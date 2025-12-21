import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface StartMatchRequest {
  match_id: string;
}

/**
 * Fetch questions from database for this match.
 * Returns null if insufficient questions are available.
 */
async function fetchQuestionsForMatch(
  category: string,
  difficulty: string,
  count: number,
  matchId: string
): Promise<any[] | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log(`[MATCH-START] Fetching ${count} ${difficulty} questions for ${category}`);

    // Call get-questions endpoint as server
    const response = await fetch(`${supabaseUrl}/functions/v1/get-questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        difficulty,
        count,
        mode: 'cash',
        matchId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MATCH-START] Failed to fetch questions:', errorData);
      return null;
    }

    const data = await response.json();

    if (data.success && data.questions && data.questions.length >= count) {
      console.log(`[MATCH-START] ✓ Fetched ${data.questions.length} questions from database`);

      // Transform to match format
      return data.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        answers: q.choices,
        correct: q.correctIndex,
        category: q.category,
        difficulty: q.difficulty,
      }));
    }

    console.error(`[MATCH-START] Insufficient questions: got ${data.questions?.length || 0}, need ${count}`);
    return null;
  } catch (error) {
    console.error('[MATCH-START] Error fetching questions:', error);
    return null;
  }
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

    const body: StartMatchRequest = await req.json();

    if (!body.match_id) {
      return new Response(
        JSON.stringify({ error: 'match_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get match
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

    // Only creator can manually start
    if (match.creator_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only match creator can start the match' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check match status
    if (match.status !== 'waiting' && match.status !== 'starting') {
      return new Response(
        JSON.stringify({ error: `Match is ${match.status}, cannot start` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check player count
    const { count: playerCount } = await supabase
      .from('cash_match_players')
      .select('id', { count: 'exact', head: true })
      .eq('match_id', match.id);

    if (!playerCount || playerCount < match.min_players) {
      return new Response(
        JSON.stringify({ 
          error: `Need at least ${match.min_players} players, only ${playerCount} joined`,
          player_count: playerCount,
          min_players: match.min_players
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch questions from database for this match
    const questionCount = match.question_count || 10;
    const category = match.category || 'sports';
    const difficulty = match.difficulty || 'medium';

    console.log(`[MATCH-START] Match ${match.id}: fetching ${questionCount} ${difficulty} ${category} questions`);

    const selectedQuestions = await fetchQuestionsForMatch(
      category,
      difficulty,
      questionCount,
      match.id
    );

    if (!selectedQuestions || selectedQuestions.length < questionCount) {
      console.error('[MATCH-START] Insufficient questions available in database');
      return new Response(
        JSON.stringify({
          error: 'Cannot start match: insufficient questions available',
          details: 'Question database needs to be populated. Please contact support.',
          needed: questionCount,
          available: selectedQuestions?.length || 0,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update match with questions and set to active
    const { error: updateError } = await supabase
      .from('cash_matches')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
        questions: selectedQuestions,
      })
      .eq('id', match.id);

    if (updateError) {
      console.error('Error starting match:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to start match', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        match_id: match.id,
        status: 'active',
        player_count: playerCount,
        question_count: questionCount
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