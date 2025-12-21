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

    // Parse request body - client only sends these fields
    const body = await req.json();
    const { matchId, questionIndex, selectedAnswer } = body;

    if (matchId === undefined || questionIndex === undefined || selectedAnswer === undefined) {
      return new Response(
        JSON.stringify({ error: 'matchId, questionIndex, and selectedAnswer required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify user is participant in match
    const { data: participation } = await adminSupabase
      .from('match_players')
      .select('id, lobby_id')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!participation) {
      return new Response(
        JSON.stringify({ error: 'Not a participant in this match' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lobby to fetch questions
    const { data: lobby } = await adminSupabase
      .from('lobbies')
      .select('id, state')
      .eq('id', participation.lobby_id)
      .maybeSingle();

    if (!lobby || lobby.state !== 'in_progress') {
      return new Response(
        JSON.stringify({ error: 'Match is not in progress' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if answer already submitted (idempotency via unique constraint)
    const { data: existingAnswer } = await adminSupabase
      .from('match_answers')
      .select('id, is_correct, points_earned')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .eq('question_index', questionIndex)
      .maybeSingle();

    if (existingAnswer) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Answer already submitted',
          is_correct: existingAnswer.is_correct,
          points_earned: existingAnswer.points_earned,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server computes correctness and points
    // In real implementation, fetch question details and compare
    // For now, simplified version:
    const submittedAt = new Date();
    const timeTakenMs = 3000; // Would be computed based on question start time
    
    // TODO: Fetch actual question and verify correctness
    const isCorrect = true; // Placeholder - must verify against server-stored question
    const pointsEarned = isCorrect ? Math.max(0, 1000 - timeTakenMs) : 0;

    // Insert answer (unique constraint prevents duplicates)
    const { data: answerData, error: answerError } = await adminSupabase
      .from('match_answers')
      .insert({
        match_id: matchId,
        user_id: user.id,
        question_index: questionIndex,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        points_earned: pointsEarned,
        submitted_at: submittedAt,
      })
      .select()
      .single();

    if (answerError) {
      // If unique constraint violation, fetch existing answer
      if (answerError.code === '23505') {
        const { data: existing } = await adminSupabase
          .from('match_answers')
          .select('is_correct, points_earned')
          .eq('match_id', matchId)
          .eq('user_id', user.id)
          .eq('question_index', questionIndex)
          .maybeSingle();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Answer already submitted',
            is_correct: existing?.is_correct,
            points_earned: existing?.points_earned,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to submit answer', details: answerError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update match_players score
    await adminSupabase.rpc('execute', {
      query: 'UPDATE match_players SET score = score + $1 WHERE match_id = $2 AND user_id = $3',
      params: [pointsEarned, matchId, user.id],
    });

    return new Response(
      JSON.stringify({
        success: true,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken_ms: timeTakenMs,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secure-answer-submit:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});