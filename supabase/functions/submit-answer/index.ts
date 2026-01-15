import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TIME_LIMIT_MS = 12000; // 12 seconds per question

interface SubmitAnswerRequest {
  matchId: string;
  roundNo: number;
  userId: string;
  answer: { choice_id: string };
  responseMs: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: SubmitAnswerRequest = await req.json();
    const { matchId, roundNo, userId, answer, responseMs } = body;

    // Validate inputs
    if (!matchId || !roundNo || !userId || !answer || responseMs === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: matchId, roundNo, userId, answer, responseMs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (roundNo < 1 || roundNo > 10) {
      return new Response(
        JSON.stringify({ error: "roundNo must be between 1 and 10" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!answer.choice_id) {
      return new Response(
        JSON.stringify({ error: "answer must contain choice_id (e.g., {choice_id: 'B'})" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SUBMIT-ANSWER] Match ${matchId}, Round ${roundNo}, User ${userId}, Answer: ${answer.choice_id}, Time: ${responseMs}ms`);

    // Fetch the match question
    const { data: matchQuestion, error: fetchError } = await supabase
      .from('match_questions')
      .select('question_id, payload')
      .eq('match_id', matchId)
      .eq('round_no', roundNo)
      .maybeSingle();

    if (fetchError) {
      console.error('[SUBMIT-ANSWER] Database error:', fetchError);
      return new Response(
        JSON.stringify({ error: "Database error", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!matchQuestion || !matchQuestion.payload) {
      console.error(`[SUBMIT-ANSWER] Question not found for match ${matchId}, round ${roundNo}`);
      return new Response(
        JSON.stringify({ error: "Question not found for this match/round" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const questionPayload = matchQuestion.payload;
    const correctChoiceId = questionPayload.correct?.choice_id;
    const difficulty = questionPayload.difficulty || 1;

    // Check correctness
    const isCorrect = answer.choice_id === correctChoiceId;

    console.log(`[SUBMIT-ANSWER] Correct answer: ${correctChoiceId}, User answered: ${answer.choice_id}, Is correct: ${isCorrect}`);

    // Compute points
    let points = 0;
    if (isCorrect) {
      // Base points by difficulty
      const basePoints = difficulty === 1 ? 100 : difficulty === 2 ? 150 : 200;
      
      // Time multiplier (faster = more points)
      const timeTaken = Math.min(responseMs, TIME_LIMIT_MS);
      const timeMultiplier = Math.max(0.5, Math.min(1.0, (TIME_LIMIT_MS - timeTaken) / TIME_LIMIT_MS + 0.5));
      
      points = Math.round(basePoints * timeMultiplier);
    }

    console.log(`[SUBMIT-ANSWER] Points awarded: ${points}`);

    // Insert into match_answers
    const { error: insertAnswerError } = await supabase
      .from('match_answers')
      .insert({
        match_id: matchId,
        round_no: roundNo,
        user_id: userId,
        question_id: matchQuestion.question_id,
        answer: answer,
        is_correct: isCorrect,
        points: points,
        response_ms: responseMs
      });

    if (insertAnswerError) {
      // Check if it's a duplicate (user already answered)
      if (insertAnswerError.code === '23505') {
        console.log(`[SUBMIT-ANSWER] Duplicate answer detected - user already answered this question`);
        return new Response(
          JSON.stringify({ error: "Answer already submitted for this round" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.error('[SUBMIT-ANSWER] Error inserting answer:', insertAnswerError);
      return new Response(
        JSON.stringify({ error: "Error saving answer", details: insertAnswerError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert into question_usage (track that user saw this question)
    const { error: usageError } = await supabase
      .from('question_usage')
      .upsert({
        user_id: userId,
        question_id: matchQuestion.question_id,
        match_id: matchId,
        seen_at: new Date().toISOString(),
        is_correct: isCorrect,
        response_ms: responseMs
      }, {
        onConflict: 'user_id,question_id,match_id'
      });

    if (usageError) {
      console.warn('[SUBMIT-ANSWER] Error updating question usage (non-fatal):', usageError);
      // Don't fail the request if usage tracking fails
    }

    console.log(`[SUBMIT-ANSWER] Answer submitted successfully`);

    // Return result
    return new Response(
      JSON.stringify({
        success: true,
        isCorrect: isCorrect,
        points: points,
        correctAnswer: correctChoiceId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[SUBMIT-ANSWER] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});