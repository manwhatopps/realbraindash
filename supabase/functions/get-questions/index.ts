import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GetQuestionsRequest {
  category: string;
  difficulty?: string;
  count?: number;
  mode?: 'free' | 'cash' | 'cash-test';
  matchId?: string;
  userId?: string;
  sessionId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const body: GetQuestionsRequest = await req.json();
    const {
      category,
      difficulty = 'medium',
      count = 10,
      mode = 'free',
      matchId,
      userId,
      sessionId
    } = body;

    if (!category) {
      return new Response(
        JSON.stringify({ error: "category is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return new Response(
        JSON.stringify({ error: "difficulty must be easy, medium, or hard" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate count
    if (count < 1 || count > 50) {
      return new Response(
        JSON.stringify({ error: "count must be between 1 and 50" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[GET-QUESTIONS] Fetching ${count} ${difficulty} questions for ${category}`);
    console.log(`[GET-QUESTIONS] Mode: ${mode}, UserId: ${userId || 'none'}, SessionId: ${sessionId || 'none'}`);

    // Fetch questions using the unified function
    const { data: questions, error: fetchError } = await supabase.rpc(
      'get_questions_for_session',
      {
        p_category: category,
        p_difficulty: difficulty,
        p_count: count,
        p_user_id: userId || null,
        p_session_id: sessionId || null,
        p_match_id: matchId || null
      }
    );

    if (fetchError) {
      console.error('[GET-QUESTIONS] Database error:', fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch questions", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!questions || questions.length === 0) {
      console.log('[GET-QUESTIONS] No questions found, triggering generation');

      // Trigger server-side generation if needed
      const serviceKey = Deno.env.get('SERVICE_KEY');
      if (serviceKey) {
        try {
          const generateUrl = `${supabaseUrl}/functions/v1/generate-questions`;
          const generateResponse = await fetch(generateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Service-Key': serviceKey,
            },
            body: JSON.stringify({
              category,
              difficulty,
              count: Math.min(count * 2, 20), // Generate extras for variety
              createdBy: userId || null
            })
          });

          if (generateResponse.ok) {
            const generateResult = await generateResponse.json();
            console.log(`[GET-QUESTIONS] Generated ${generateResult.inserted} new questions`);

            // Retry fetch after generation
            const { data: newQuestions, error: retryError } = await supabase.rpc(
              'get_questions_for_session',
              {
                p_category: category,
                p_difficulty: difficulty,
                p_count: count,
                p_user_id: userId || null,
                p_session_id: sessionId || null,
                p_match_id: matchId || null
              }
            );

            if (!retryError && newQuestions && newQuestions.length > 0) {
              return await formatAndReturnQuestions(supabase, newQuestions, mode, userId, sessionId);
            }
          }
        } catch (genError) {
          console.error('[GET-QUESTIONS] Auto-generation failed:', genError);
        }
      }

      return new Response(
        JSON.stringify({
          error: "No questions available",
          needs_generation: true,
          category,
          difficulty
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[GET-QUESTIONS] Found ${questions.length} questions`);

    return await formatAndReturnQuestions(supabase, questions, mode, userId, sessionId);

  } catch (error) {
    console.error("[GET-QUESTIONS] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function formatAndReturnQuestions(
  supabase: any,
  questions: any[],
  mode: string,
  userId?: string,
  sessionId?: string
) {
  const formattedQuestions = [];
  const questionIds = [];

  for (const q of questions) {
    // Shuffle choices server-side for uniform distribution
    const { data: shuffled, error: shuffleError } = await supabase.rpc(
      'shuffle_question_choices',
      { p_question_id: q.id }
    );

    if (shuffleError || !shuffled || shuffled.length === 0) {
      // Fallback to original if shuffle fails
      formattedQuestions.push({
        id: q.id,
        question: q.question_text,
        choices: q.choices,
        correctIndex: q.correct_index,
        difficulty: q.difficulty,
        category: q.category,
        explanation: q.explanation,
        source_confidence: q.source_confidence
      });
    } else {
      const s = shuffled[0];
      formattedQuestions.push({
        id: s.id,
        question: s.question_text,
        choices: s.choices,
        correctIndex: s.correct_index,
        difficulty: q.difficulty,
        category: q.category,
        explanation: q.explanation,
        source_confidence: q.source_confidence,
        shuffled: true
      });
    }

    questionIds.push(q.id);
  }

  // Mark questions as used
  await supabase.rpc('mark_questions_used', { p_question_ids: questionIds });

  // Track as seen (async, don't wait)
  if (userId || sessionId) {
    supabase.rpc('insert_seen_questions_bulk', {
      p_question_ids: questionIds,
      p_user_id: userId || null,
      p_session_id: sessionId || null,
      p_mode: mode
    }).then(() => {
      console.log(`[GET-QUESTIONS] Tracked ${questionIds.length} questions as seen`);
    }).catch((err: any) => {
      console.error('[GET-QUESTIONS] Failed to track seen questions:', err);
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      questions: formattedQuestions,
      count: formattedQuestions.length,
      mode
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
