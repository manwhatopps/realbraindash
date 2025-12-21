import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SubmitScoreRequest {
  match_id: string;
  answers: number[];
  time_taken_ms: number;
}

async function finalizeMatch(supabase: any, matchId: string, match: any, players: any[]) {
  const { data: escrow } = await supabase
    .from('cash_match_escrows')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (!escrow || escrow.status === 'released') {
    return;
  }

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.time_taken_ms || 0) - (b.time_taken_ms || 0);
  });

  const rakeCents = Math.floor(escrow.total_pot_cents * (match.rake_percent / 100));
  const netPot = escrow.total_pot_cents - rakeCents;

  let payouts: { player_id: string; user_id: string; amount: number; placement: number; result: string }[] = [];

  switch (match.payout_model) {
    case 'winner_take_all':
      sortedPlayers.forEach((player, index) => {
        payouts.push({
          player_id: player.id,
          user_id: player.user_id,
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
          user_id: player.user_id,
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
          user_id: player.user_id,
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
          user_id: player.user_id,
          amount: index === 0 ? netPot : 0,
          placement: index + 1,
          result: index === 0 ? 'win' : 'loss',
        });
      });
  }

  for (const payout of payouts) {
    await supabase
      .from('cash_match_players')
      .update({
        result: payout.result,
        payout_cents: payout.amount,
        placement: payout.placement,
      })
      .eq('id', payout.player_id);

    if (payout.amount > 0) {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance_cents')
        .eq('user_id', payout.user_id)
        .maybeSingle();

      const currentBalance = wallet?.balance_cents || 0;
      const newBalance = currentBalance + payout.amount;

      if (wallet) {
        await supabase
          .from('user_wallets')
          .update({ balance_cents: newBalance })
          .eq('user_id', payout.user_id);
      } else {
        await supabase
          .from('user_wallets')
          .insert({
            user_id: payout.user_id,
            balance_cents: payout.amount,
          });
      }

      await supabase
        .from('wallet_ledger')
        .insert({
          user_id: payout.user_id,
          amount_cents: payout.amount,
          balance_after_cents: newBalance,
          transaction_type: 'match_payout',
          match_id: matchId,
          description: `Match ${matchId} payout - Placement #${payout.placement}`,
        });
    }
  }

  await supabase
    .from('cash_match_escrows')
    .update({
      status: 'released',
      rake_cents: rakeCents,
      net_pot_cents: netPot,
      released_at: new Date().toISOString(),
    })
    .eq('match_id', matchId);
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

    const body: SubmitScoreRequest = await req.json();

    if (!body.match_id || !body.answers || !Array.isArray(body.answers)) {
      return new Response(
        JSON.stringify({ error: 'match_id and answers array required' }),
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

    const { data: player, error: playerError } = await supabase
      .from('cash_match_players')
      .select('*')
      .eq('match_id', body.match_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (playerError || !player) {
      return new Response(
        JSON.stringify({ error: 'Not a player in this match' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (player.score !== null) {
      return new Response(
        JSON.stringify({ error: 'Score already submitted' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questions = match.questions || [];
    let correctCount = 0;
    
    for (let i = 0; i < Math.min(body.answers.length, questions.length); i++) {
      if (body.answers[i] === questions[i].correct) {
        correctCount++;
      }
    }

    const finalScore = correctCount * 100;

    const { error: updateError } = await supabase
      .from('cash_match_players')
      .update({
        score: finalScore,
        time_taken_ms: body.time_taken_ms,
        finished_at: new Date().toISOString(),
      })
      .eq('id', player.id);

    if (updateError) {
      console.error('Error updating score:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit score', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: allPlayers } = await supabase
      .from('cash_match_players')
      .select('id, score, user_id, time_taken_ms')
      .eq('match_id', body.match_id);

    const allFinished = allPlayers?.every(p => p.score !== null);
    let matchStatus = match.status;
    let shouldFinalize = false;

    if (allFinished && match.status === 'active') {
      await supabase
        .from('cash_matches')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', body.match_id);

      matchStatus = 'completed';
      shouldFinalize = true;

      try {
        await finalizeMatch(supabase, body.match_id, match, allPlayers);
      } catch (finalizeError) {
        console.error('Auto-finalize error:', finalizeError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: finalScore,
        correct_count: correctCount,
        total_questions: questions.length,
        all_finished: allFinished,
        match_status: matchStatus,
        finalized: shouldFinalize
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