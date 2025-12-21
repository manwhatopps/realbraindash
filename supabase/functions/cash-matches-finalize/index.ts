import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface FinalizeMatchRequest {
  match_id: string;
}

function calculatePayouts(players: any[], totalPot: number, rakeCents: number, payoutModel: string) {
  const netPot = totalPot - rakeCents;
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.time_taken_ms || 0) - (b.time_taken_ms || 0);
  });

  const payouts: { player_id: string; amount: number; placement: number; result: string }[] = [];

  switch (payoutModel) {
    case 'winner_take_all':
      sortedPlayers.forEach((player, index) => {
        payouts.push({
          player_id: player.id,
          amount: index === 0 ? netPot : 0,
          placement: index + 1,
          result: index === 0 ? 'win' : 'loss',
        });
      });
      break;

    case 'top3':
      const top3Splits = [0.6, 0.3, 0.1];
      sortedPlayers.forEach((player, index) => {
        const payout = index < 3 ? Math.floor(netPot * top3Splits[index]) : 0;
        payouts.push({
          player_id: player.id,
          amount: payout,
          placement: index + 1,
          result: index < 3 ? 'win' : 'loss',
        });
      });
      break;

    case 'percentile':
      const topPercent = Math.ceil(sortedPlayers.length * 0.5);
      const perWinnerPayout = Math.floor(netPot / topPercent);
      sortedPlayers.forEach((player, index) => {
        const payout = index < topPercent ? perWinnerPayout : 0;
        payouts.push({
          player_id: player.id,
          amount: payout,
          placement: index + 1,
          result: index < topPercent ? 'win' : 'loss',
        });
      });
      break;

    default:
      sortedPlayers.forEach((player, index) => {
        payouts.push({
          player_id: player.id,
          amount: index === 0 ? netPot : 0,
          placement: index + 1,
          result: index === 0 ? 'win' : 'loss',
        });
      });
  }

  return payouts;
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

    const body: FinalizeMatchRequest = await req.json();

    if (!body.match_id) {
      return new Response(
        JSON.stringify({ error: 'match_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: match, error: matchError } = await supabase
      .from('cash_matches')
      .select('*')
      .eq('id', body.match_id)
      .single();

    if (matchError || !match) {
      return new Response(
        JSON.stringify({ error: 'Match not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (match.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: `Match status is ${match.status}, must be completed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: escrow } = await supabase
      .from('cash_match_escrows')
      .select('*')
      .eq('match_id', body.match_id)
      .single();

    if (!escrow || escrow.status === 'released') {
      return new Response(
        JSON.stringify({ error: 'Escrow already released or not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: players } = await supabase
      .from('cash_match_players')
      .select('*')
      .eq('match_id', body.match_id);

    if (!players || players.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No players found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allScoresSubmitted = players.every(p => p.score !== null);
    if (!allScoresSubmitted) {
      return new Response(
        JSON.stringify({ error: 'Not all players have submitted scores' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rakeCents = Math.floor(escrow.total_pot_cents * (match.rake_percent / 100));
    const payouts = calculatePayouts(players, escrow.total_pot_cents, rakeCents, match.payout_model);

    for (const payout of payouts) {
      await supabase
        .from('cash_match_players')
        .update({
          result: payout.result,
          payout_cents: payout.amount,
          placement: payout.placement,
        })
        .eq('id', payout.player_id);

      const player = players.find(p => p.id === payout.player_id);
      if (player && payout.amount > 0) {
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('balance_cents')
          .eq('user_id', player.user_id)
          .maybeSingle();

        const currentBalance = wallet?.balance_cents || 0;
        const newBalance = currentBalance + payout.amount;

        if (wallet) {
          await supabase
            .from('user_wallets')
            .update({ balance_cents: newBalance })
            .eq('user_id', player.user_id);
        } else {
          await supabase
            .from('user_wallets')
            .insert({
              user_id: player.user_id,
              balance_cents: payout.amount,
            });
        }

        await supabase
          .from('wallet_ledger')
          .insert({
            user_id: player.user_id,
            amount_cents: payout.amount,
            balance_after_cents: newBalance,
            transaction_type: 'match_payout',
            match_id: body.match_id,
            description: `Match ${body.match_id} payout - Placement #${payout.placement}`,
          });
      }
    }

    await supabase
      .from('cash_match_escrows')
      .update({
        status: 'released',
        rake_cents: rakeCents,
        net_pot_cents: escrow.total_pot_cents - rakeCents,
        released_at: new Date().toISOString(),
      })
      .eq('match_id', body.match_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        payouts,
        rake_cents: rakeCents,
        net_pot_cents: escrow.total_pot_cents - rakeCents
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