import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GetMatchQuestionRequest {
  matchId: string;
  roundNo: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request (support both GET and POST)
    let matchId: string;
    let roundNo: number;

    if (req.method === "GET") {
      const url = new URL(req.url);
      matchId = url.searchParams.get("matchId") || "";
      roundNo = parseInt(url.searchParams.get("roundNo") || "0");
    } else {
      const body: GetMatchQuestionRequest = await req.json();
      matchId = body.matchId;
      roundNo = body.roundNo;
    }

    // Validate inputs
    if (!matchId) {
      return new Response(
        JSON.stringify({ error: "matchId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roundNo || roundNo < 1 || roundNo > 10) {
      return new Response(
        JSON.stringify({ error: "roundNo must be between 1 and 10" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[GET-MATCH-QUESTION] Fetching match ${matchId}, round ${roundNo}`);

    // Fetch the question from match_questions
    const { data: matchQuestion, error: fetchError } = await supabase
      .from('match_questions')
      .select('id, match_id, round_no, question_id, payload')
      .eq('match_id', matchId)
      .eq('round_no', roundNo)
      .maybeSingle();

    if (fetchError) {
      console.error('[GET-MATCH-QUESTION] Database error:', fetchError);
      return new Response(
        JSON.stringify({ error: "Database error", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!matchQuestion) {
      console.log(`[GET-MATCH-QUESTION] No question found for match ${matchId}, round ${roundNo}`);
      return new Response(
        JSON.stringify({ 
          error: "Match questions not created yet",
          message: "Call create-match-questions at lobby lock to generate questions"
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[GET-MATCH-QUESTION] Found question ${matchQuestion.question_id}`);

    // Return the question payload
    return new Response(
      JSON.stringify({
        success: true,
        matchId: matchQuestion.match_id,
        roundNo: matchQuestion.round_no,
        question: matchQuestion.payload
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[GET-MATCH-QUESTION] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});