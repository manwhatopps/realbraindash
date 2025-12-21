import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
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

    // Parse request body
    const body = await req.json();
    const { lobbyId, termsAccepted } = body;

    if (!lobbyId) {
      return new Response(
        JSON.stringify({ error: 'lobbyId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify user is in lobby
    const { data: player } = await adminSupabase
      .from('lobby_players')
      .select('id, is_ready, terms_accepted')
      .eq('lobby_id', lobbyId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .maybeSingle();

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Not a member of this lobby' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check lobby state
    const { data: lobby } = await adminSupabase
      .from('lobbies')
      .select('id, state, is_cash_match')
      .eq('id', lobbyId)
      .maybeSingle();

    if (!lobby) {
      return new Response(
        JSON.stringify({ error: 'Lobby not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lobby.state !== 'waiting_for_players' && lobby.state !== 'consent_pending' && lobby.state !== 'escrow_locked') {
      return new Response(
        JSON.stringify({ error: `Cannot ready up. Lobby state: ${lobby.state}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For cash matches, require terms acceptance
    if (lobby.is_cash_match && !player.terms_accepted && !termsAccepted) {
      return new Response(
        JSON.stringify({ error: 'Must accept terms for cash matches' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update player record (scoped to auth.uid())
    const updateData: any = {
      is_ready: true,
    };

    if (lobby.is_cash_match && termsAccepted && !player.terms_accepted) {
      updateData.terms_accepted = true;
      updateData.terms_accepted_at = new Date().toISOString();
    }

    const { error: updateError } = await adminSupabase
      .from('lobby_players')
      .update(updateData)
      .eq('lobby_id', lobbyId)
      .eq('user_id', user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update ready status', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if all players are ready
    const { data: players } = await adminSupabase
      .from('lobby_players')
      .select('is_ready, terms_accepted')
      .eq('lobby_id', lobbyId)
      .is('left_at', null);

    const allReady = players?.every(p => p.is_ready) || false;
    const allAccepted = !lobby.is_cash_match || players?.every(p => p.terms_accepted) || false;

    // If all ready and terms accepted, update lobby state
    if (allReady && allAccepted) {
      await adminSupabase
        .from('lobbies')
        .update({ state: 'ready_to_start' })
        .eq('id', lobbyId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_ready: true,
        all_ready: allReady,
        all_accepted: allAccepted,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secure-lobby-ready:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});