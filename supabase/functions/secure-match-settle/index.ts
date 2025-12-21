import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, Idempotency-Key',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Extract idempotency key
    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return new Response(
        JSON.stringify({ error: 'Idempotency-Key header required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check idempotency
    const { data: existingKey } = await supabase
      .from('idempotency_keys')
      .select('response_body, response_status')
      .eq('key', idempotencyKey)
      .eq('user_id', user.id)
      .eq('route', 'match/settle')
      .maybeSingle();

    if (existingKey) {
      return new Response(
        JSON.stringify(existingKey.response_body),
        { 
          status: existingKey.response_status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { lobbyId } = body;

    if (!lobbyId) {
      return new Response(
        JSON.stringify({ error: 'lobbyId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // === KILL SWITCH CHECK ===
    const { data: settlementEnabled } = await adminSupabase.rpc('check_platform_control', {
      p_control_name: 'settlement_enabled',
    });

    if (!settlementEnabled) {
      const responseBody = { error: 'Match settlement is temporarily disabled' };
      await adminSupabase.from('idempotency_keys').insert({
        key: idempotencyKey, user_id: user.id, route: 'match/settle',
        response_status: 503, response_body: responseBody,
      });
      return new Response(
        JSON.stringify(responseBody),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is participant or host
    const { data: lobby } = await adminSupabase
      .from('lobbies')
      .select('id, host_user_id, match_id, state, settled_at')
      .eq('id', lobbyId)
      .maybeSingle();

    if (!lobby) {
      const responseBody = { error: 'Lobby not found' };
      await adminSupabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        user_id: user.id,
        route: 'match/settle',
        response_status: 404,
        response_body: responseBody,
      });
      return new Response(
        JSON.stringify(responseBody),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is host or participant
    const { data: participation } = await adminSupabase
      .from('lobby_players')
      .select('id')
      .eq('lobby_id', lobbyId)
      .eq('user_id', user.id)
      .maybeSingle();

    const isHost = lobby.host_user_id === user.id;
    const isParticipant = !!participation;

    if (!isHost && !isParticipant) {
      const responseBody = { error: 'Not authorized to settle this match' };
      await adminSupabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        user_id: user.id,
        route: 'match/settle',
        response_status: 403,
        response_body: responseBody,
      });
      return new Response(
        JSON.stringify(responseBody),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify lobby state is completed
    if (lobby.state !== 'completed') {
      const responseBody = { error: `Match not completed. Current state: ${lobby.state}` };
      await adminSupabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        user_id: user.id,
        route: 'match/settle',
        response_status: 400,
        response_body: responseBody,
      });
      return new Response(
        JSON.stringify(responseBody),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already settled
    if (lobby.settled_at) {
      const responseBody = { 
        success: true, 
        message: 'Match already settled',
        settled_at: lobby.settled_at 
      };
      await adminSupabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        user_id: user.id,
        route: 'match/settle',
        response_status: 200,
        response_body: responseBody,
      });
      return new Response(
        JSON.stringify(responseBody),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lobby.match_id) {
      const responseBody = { error: 'No match ID found for lobby' };
      await adminSupabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        user_id: user.id,
        route: 'match/settle',
        response_status: 400,
        response_body: responseBody,
      });
      return new Response(
        JSON.stringify(responseBody),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call atomic settlement function
    const { data: settlementResult, error: settlementError } = await adminSupabase.rpc(
      'settle_match_payouts',
      {
        p_match_id: lobby.match_id,
        p_lobby_id: lobbyId,
      }
    );

    if (settlementError) {
      console.error('Settlement error:', settlementError);

      // Create critical alert for settlement failure
      await adminSupabase.rpc('create_alert', {
        p_alert_type: 'settlement_failure',
        p_severity: 'critical',
        p_message: `Settlement failed for match ${lobby.match_id}: ${settlementError.message}`,
        p_user_id: user.id,
        p_match_id: lobby.match_id,
        p_metadata: { lobby_id: lobbyId, error: settlementError.message },
      });

      const responseBody = { error: 'Settlement failed', details: settlementError.message };
      await adminSupabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        user_id: user.id,
        route: 'match/settle',
        response_status: 500,
        response_body: responseBody,
      });
      return new Response(
        JSON.stringify(responseBody),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settlementResult || settlementResult.length === 0 || !settlementResult[0].success) {
      const errorMsg = settlementResult?.[0]?.error_message || 'Settlement failed';
      const responseBody = { error: errorMsg };
      await adminSupabase.from('idempotency_keys').insert({
        key: idempotencyKey,
        user_id: user.id,
        route: 'match/settle',
        response_status: 400,
        response_body: responseBody,
      });
      return new Response(
        JSON.stringify(responseBody),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = settlementResult[0];
    const responseBody = {
      success: true,
      payouts_created: result.payouts_created,
      total_pot_cents: result.total_pot_cents,
      rake_cents: result.rake_cents,
      prize_pool_cents: result.total_pot_cents - result.rake_cents,
    };

    // Store idempotency key
    await adminSupabase.from('idempotency_keys').insert({
      key: idempotencyKey,
      user_id: user.id,
      route: 'match/settle',
      response_status: 200,
      response_body: responseBody,
    });

    return new Response(
      JSON.stringify(responseBody),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secure-match-settle:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});