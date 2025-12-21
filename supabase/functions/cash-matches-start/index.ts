import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface StartMatchRequest {
  match_id: string;
}

// Sample question pool - in production, fetch from your questions table
const SAMPLE_QUESTIONS = [
  { id: 1, question: 'What is 2 + 2?', answers: ['3', '4', '5', '6'], correct: 1, category: 'math' },
  { id: 2, question: 'What is the capital of France?', answers: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 2, category: 'geography' },
  { id: 3, question: 'Who painted the Mona Lisa?', answers: ['Van Gogh', 'Da Vinci', 'Picasso', 'Monet'], correct: 1, category: 'art' },
  { id: 4, question: 'What is 10 × 5?', answers: ['45', '50', '55', '60'], correct: 1, category: 'math' },
  { id: 5, question: 'What year did WWII end?', answers: ['1943', '1944', '1945', '1946'], correct: 2, category: 'history' },
  { id: 6, question: 'What is the largest planet?', answers: ['Mars', 'Saturn', 'Jupiter', 'Neptune'], correct: 2, category: 'science' },
  { id: 7, question: 'Who wrote Romeo and Juliet?', answers: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], correct: 1, category: 'literature' },
  { id: 8, question: 'What is H2O?', answers: ['Hydrogen', 'Helium', 'Water', 'Oxygen'], correct: 2, category: 'science' },
  { id: 9, question: 'What is 100 ÷ 4?', answers: ['20', '25', '30', '35'], correct: 1, category: 'math' },
  { id: 10, question: 'What is the speed of light?', answers: ['100k km/s', '200k km/s', '300k km/s', '400k km/s'], correct: 2, category: 'science' },
];

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

    // Select questions for this match
    // In production, this would query your questions table based on category, difficulty, etc.
    const questionCount = match.question_count || 10;
    const selectedQuestions = SAMPLE_QUESTIONS.slice(0, questionCount);

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