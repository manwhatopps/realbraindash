import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface JoinMatchRequest {
  match_id?: string;
  room_code?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: JoinMatchRequest = await req.json();

    // Find match by ID or room code
    let matchQuery = supabase.from('cash_matches').select('*');
    
    if (body.match_id) {
      matchQuery = matchQuery.eq('id', body.match_id);
    } else if (body.room_code) {
      matchQuery = matchQuery.eq('room_code', body.room_code);
    } else {
      return new Response(
        JSON.stringify({ error: 'Must provide match_id or room_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: match, error: matchError } = await matchQuery.maybeSingle();

    if (matchError || !match) {
      return new Response(
        JSON.stringify({ error: 'Match not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check match status
    if (match.status !== 'waiting') {
      return new Response(
        JSON.stringify({ error: `Match is ${match.status}, cannot join` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already joined
    const { data: existingPlayer } = await supabase
      .from('cash_match_players')
      .select('id')
      .eq('match_id', match.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPlayer) {
      return new Response(
        JSON.stringify({ error: 'Already joined this match', match }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if match is full
    const { count: playerCount } = await supabase
      .from('cash_match_players')
      .select('id', { count: 'exact', head: true })
      .eq('match_id', match.id);

    if (playerCount && playerCount >= match.max_players) {
      return new Response(
        JSON.stringify({ error: 'Match is full' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user wallet balance
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('balance_cents')
      .eq('user_id', user.id)
      .maybeSingle();

    const balance = wallet?.balance_cents || 0;
    if (balance < match.entry_fee_cents) {
      return new Response(
        JSON.stringify({ error: 'Insufficient funds', balance, required: match.entry_fee_cents }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct entry fee
    const newBalance = balance - match.entry_fee_cents;
    await supabase
      .from('user_wallets')
      .update({ balance_cents: newBalance })
      .eq('user_id', user.id);

    // Record ledger entry
    await supabase
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        amount_cents: -match.entry_fee_cents,
        balance_after_cents: newBalance,
        transaction_type: 'match_entry',
        match_id: match.id,
        description: `Joined match ${match.id}`,
      });

    // Add player to match
    await supabase
      .from('cash_match_players')
      .insert({
        match_id: match.id,
        user_id: user.id,
      });

    // Update escrow
    const { data: escrow } = await supabase
      .from('cash_match_escrows')
      .select('*')
      .eq('match_id', match.id)
      .single();

    const newTotalPot = escrow.total_pot_cents + match.entry_fee_cents;
    await supabase
      .from('cash_match_escrows')
      .update({
        total_pot_cents: newTotalPot,
        net_pot_cents: newTotalPot,
      })
      .eq('match_id', match.id);

    // Check if min_players reached and auto-start if needed
    const newPlayerCount = (playerCount || 0) + 1;
    if (newPlayerCount >= match.min_players && newPlayerCount === match.max_players) {
      // Match is full, trigger start
      await supabase
        .from('cash_matches')
        .update({ status: 'starting' })
        .eq('id', match.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        match,
        player_count: newPlayerCount,
        can_start: newPlayerCount >= match.min_players
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});