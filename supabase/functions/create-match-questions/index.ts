import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VALID_CATEGORIES = [
  'Politics', 'Business', 'Sports', 'Music', 'Movies', 
  'History', 'Geography', 'Science', 'Pop Culture'
];

// Difficulty schedule for 10 questions (using numeric difficulty)
const DIFFICULTY_SCHEDULE = [
  1, 1, 1, 1, 1,      // Q1-Q5: easy (1)
  2, 2, 2,            // Q6-Q8: medium (2)
  3, 3                // Q9-Q10: hard (3)
];

interface CreateMatchQuestionsRequest {
  matchId: string;
  category: string;
  playerIds: string[];
  mode: 'competitive' | 'free';
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
    const body: CreateMatchQuestionsRequest = await req.json();
    const { matchId, category, playerIds, mode } = body;

    // Validate inputs
    if (!matchId || !category || !playerIds || !mode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: matchId, category, playerIds, mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      return new Response(
        JSON.stringify({ error: "Invalid matchId format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "playerIds must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!['competitive', 'free'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: "mode must be 'competitive' or 'free'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[CREATE-MATCH-QUESTIONS] Processing match ${matchId}, category: ${category}, players: ${playerIds.length}, mode: ${mode}`);

    // Check if questions already exist (idempotency)
    const { data: existingQuestions, error: checkError } = await supabase
      .from('match_questions')
      .select('id, round_no, question_id, payload')
      .eq('match_id', matchId)
      .order('round_no', { ascending: true });

    if (checkError) {
      console.error('[CREATE-MATCH-QUESTIONS] Error checking existing questions:', checkError);
      return new Response(
        JSON.stringify({ error: "Database error checking existing questions", details: checkError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If questions already exist, return them
    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`[CREATE-MATCH-QUESTIONS] Questions already exist for match ${matchId}, returning existing set`);
      
      const formattedQuestions = existingQuestions.map((mq: any) => ({
        roundNo: mq.round_no,
        question: mq.payload
      }));

      return new Response(
        JSON.stringify({
          success: true,
          matchId: matchId,
          category: category,
          mode: mode,
          questions: formattedQuestions,
          cached: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine freshness window
    const freshnessWindow = mode === 'competitive' ? 30 : 14;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - freshnessWindow);

    console.log(`[CREATE-MATCH-QUESTIONS] Using freshness window: ${freshnessWindow} days (cutoff: ${cutoffDate.toISOString()})`);

    // Select 10 questions following the difficulty schedule
    const selectedQuestions: any[] = [];
    const usedQuestionIds = new Set<string>();

    for (let roundNo = 1; roundNo <= 10; roundNo++) {
      const difficultyNum = DIFFICULTY_SCHEDULE[roundNo - 1];
      
      console.log(`[CREATE-MATCH-QUESTIONS] Selecting question ${roundNo}/10, difficulty: ${difficultyNum}`);

      // Get all active questions for this category and difficulty
      const { data: candidates, error: candidatesError } = await supabase
        .from('questions')
        .select('id, category, difficulty_num, prompt, choices, correct_index, explanation, quality_score, created_at')
        .eq('category', category)
        .eq('difficulty_num', difficultyNum)
        .eq('status', 'active')
        .not('id', 'in', `(${Array.from(usedQuestionIds).join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .limit(200);

      if (candidatesError) {
        console.error(`[CREATE-MATCH-QUESTIONS] Error fetching candidates:`, candidatesError);
        return new Response(
          JSON.stringify({ error: "Error fetching question candidates", details: candidatesError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!candidates || candidates.length === 0) {
        console.error(`[CREATE-MATCH-QUESTIONS] No questions available for category: ${category}, difficulty: ${difficultyNum}`);
        return new Response(
          JSON.stringify({ 
            error: `No questions available for category '${category}' with difficulty ${difficultyNum}`,
            category,
            difficulty: difficultyNum,
            roundNo
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[CREATE-MATCH-QUESTIONS] Found ${candidates.length} candidate questions`);

      // Count seen for all candidates in one query
      const candidateIds = candidates.map(c => c.id);
      const { data: seenData, error: seenError } = await supabase
        .from('question_usage')
        .select('question_id, user_id')
        .in('question_id', candidateIds)
        .in('user_id', playerIds)
        .gte('seen_at', cutoffDate.toISOString());

      if (seenError) {
        console.warn(`[CREATE-MATCH-QUESTIONS] Error checking seen counts:`, seenError);
      }

      // Count seen per question
      const seenCounts = new Map<string, Set<string>>();
      if (seenData) {
        for (const record of seenData) {
          if (!seenCounts.has(record.question_id)) {
            seenCounts.set(record.question_id, new Set());
          }
          seenCounts.get(record.question_id)!.add(record.user_id);
        }
      }

      const candidatesWithScores = candidates.map(question => ({
        ...question,
        seenCount: seenCounts.get(question.id)?.size || 0
      }));

      // Categorize into tiers
      const tierA = candidatesWithScores.filter(q => q.seenCount === 0);
      const tierB = candidatesWithScores.filter(q => q.seenCount === 1);
      const tierC = candidatesWithScores.filter(q => q.seenCount === 2);
      const tierD = candidatesWithScores.filter(q => q.seenCount > 2);

      console.log(`[CREATE-MATCH-QUESTIONS] Tier distribution - A: ${tierA.length}, B: ${tierB.length}, C: ${tierC.length}, D: ${tierD.length}`);

      // Select from best tier available
      let selectedTier = tierA.length > 0 ? tierA : 
                         tierB.length > 0 ? tierB : 
                         tierC.length > 0 ? tierC : tierD;

      if (selectedTier.length === 0) {
        console.error(`[CREATE-MATCH-QUESTIONS] No questions available after tier selection`);
        return new Response(
          JSON.stringify({ error: "No suitable questions available" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sort by seenCount (asc), quality_score (desc), then random
      selectedTier.sort((a, b) => {
        if (a.seenCount !== b.seenCount) return a.seenCount - b.seenCount;
        if (a.quality_score !== b.quality_score) return b.quality_score - a.quality_score;
        return Math.random() - 0.5;
      });

      // Pick the best question
      const selectedQuestion = selectedTier[0];
      
      // Format choices to match expected format with choice_id
      const formattedChoices = Array.isArray(selectedQuestion.choices) 
        ? selectedQuestion.choices.map((choice: any, idx: number) => ({
            id: String.fromCharCode(65 + idx), // A, B, C, D
            text: typeof choice === 'string' ? choice : choice.text || choice
          }))
        : selectedQuestion.choices;

      // Determine correct choice_id
      const correctChoiceId = String.fromCharCode(65 + selectedQuestion.correct_index); // 0->A, 1->B, etc.

      const payload = {
        id: selectedQuestion.id,
        category: selectedQuestion.category,
        difficulty: selectedQuestion.difficulty_num,
        prompt: selectedQuestion.prompt,
        choices: formattedChoices,
        correct: { choice_id: correctChoiceId },
        explanation: selectedQuestion.explanation
      };

      selectedQuestions.push({
        roundNo,
        question: selectedQuestion,
        payload
      });
      usedQuestionIds.add(selectedQuestion.id);

      console.log(`[CREATE-MATCH-QUESTIONS] Selected question ${selectedQuestion.id}, seenCount: ${selectedQuestion.seenCount}`);
    }

    // Insert into match_questions table with payload
    const matchQuestionRows = selectedQuestions.map(sq => ({
      match_id: matchId,
      question_id: sq.question.id,
      round_no: sq.roundNo,
      payload: sq.payload
    }));

    const { error: insertError } = await supabase
      .from('match_questions')
      .insert(matchQuestionRows);

    if (insertError) {
      console.error('[CREATE-MATCH-QUESTIONS] Error inserting match questions:', insertError);
      return new Response(
        JSON.stringify({ error: "Error saving match questions", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[CREATE-MATCH-QUESTIONS] Successfully created ${selectedQuestions.length} questions for match ${matchId}`);

    // Format response
    const formattedQuestions = selectedQuestions.map(sq => ({
      roundNo: sq.roundNo,
      question: sq.payload
    }));

    return new Response(
      JSON.stringify({
        success: true,
        matchId: matchId,
        category: category,
        mode: mode,
        questions: formattedQuestions,
        cached: false
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[CREATE-MATCH-QUESTIONS] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});