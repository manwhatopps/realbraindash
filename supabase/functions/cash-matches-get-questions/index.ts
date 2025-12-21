import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    const url = new URL(req.url);
    const matchId = url.searchParams.get('match_id');

    if (!matchId) {
      return new Response(
        JSON.stringify({ error: 'match_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('cash_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return new Response(
        JSON.stringify({ error: 'Match not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is a player in this match
    const { data: player } = await supabase
      .from('cash_match_players')
      .select('id')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Not a player in this match' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check match status
    if (match.status !== 'active' && match.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: `Match is ${match.status}, questions not available` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return questions without correct answers
    const questions = match.questions || [];
    const questionsWithoutAnswers = questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answers: q.answers,
      category: q.category,
    }));

    return new Response(
      JSON.stringify({ 
        success: true,
        match_id: matchId,
        questions: questionsWithoutAnswers,
        time_per_question_ms: match.time_per_question_ms,
        mode: match.mode
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