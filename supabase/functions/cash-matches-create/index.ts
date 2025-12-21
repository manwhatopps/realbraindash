import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateMatchRequest {
  entry_fee_cents: number;
  min_players?: number;
  max_players: number;
  mode: string;
  category?: string;
  question_count?: number;
  time_per_question_ms?: number;
  payout_model?: string;
  payout_config?: any;
  rake_percent?: number;
  is_private?: boolean;
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

    const body: CreateMatchRequest = await req.json();

    // Validate required fields
    if (!body.entry_fee_cents || body.entry_fee_cents <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid entry_fee_cents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.max_players || body.max_players < 2) {
      return new Response(
        JSON.stringify({ error: 'max_players must be at least 2' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const min_players = body.min_players || 2;
    if (min_players > body.max_players) {
      return new Response(
        JSON.stringify({ error: 'min_players cannot exceed max_players' }),
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
    if (balance < body.entry_fee_cents) {
      return new Response(
        JSON.stringify({ error: 'Insufficient funds', balance, required: body.entry_fee_cents }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate room code if private
    let roomCode = body.room_code;
    if (body.is_private && !roomCode) {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Create match
    const { data: match, error: matchError } = await supabase
      .from('cash_matches')
      .insert({
        creator_id: user.id,
        entry_fee_cents: body.entry_fee_cents,
        min_players,
        max_players: body.max_players,
        mode: body.mode || 'classic',
        category: body.category,
        question_count: body.question_count || 10,
        time_per_question_ms: body.time_per_question_ms || 15000,
        payout_model: body.payout_model || 'winner_take_all',
        payout_config: body.payout_config || {},
        rake_percent: body.rake_percent !== undefined ? body.rake_percent : 5.0,
        is_private: body.is_private || false,
        room_code: roomCode,
        status: 'waiting',
      })
      .select()
      .single();

    if (matchError) {
      console.error('Match creation error:', matchError);
      return new Response(
        JSON.stringify({ error: 'Failed to create match', details: matchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct entry fee from creator's wallet
    const newBalance = balance - body.entry_fee_cents;
    await supabase
      .from('user_wallets')
      .update({ balance_cents: newBalance })
      .eq('user_id', user.id);

    // Record ledger entry
    await supabase
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        amount_cents: -body.entry_fee_cents,
        balance_after_cents: newBalance,
        transaction_type: 'match_entry',
        match_id: match.id,
        description: `Joined match ${match.id}`,
      });

    // Add creator as first player
    await supabase
      .from('cash_match_players')
      .insert({
        match_id: match.id,
        user_id: user.id,
      });

    // Create escrow
    await supabase
      .from('cash_match_escrows')
      .insert({
        match_id: match.id,
        total_pot_cents: body.entry_fee_cents,
        rake_cents: 0,
        net_pot_cents: body.entry_fee_cents,
        status: 'pending',
      });

    return new Response(
      JSON.stringify({ success: true, match }),
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