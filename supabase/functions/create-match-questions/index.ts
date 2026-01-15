import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VALID_CATEGORIES = [
  'Politics', 'Business', 'Sports', 'Music', 'Movies', 
  'History', 'Geography', 'Science', 'Pop Culture', 'Stakes'
];

// Difficulty schedule for 10 questions
const DIFFICULTY_SCHEDULE = [
  'easy', 'easy', 'easy', 'easy', 'easy',      // Q1-Q5: easy
  'medium', 'medium', 'medium',                // Q6-Q8: medium
  'hard', 'hard'                               // Q9-Q10: hard
];

interface CreateMatchQuestionsRequest {
  matchId: string;
  category: string;
  playerIds: string[];
  mode: 'competitive' | 'free';
}

interface QuestionPayload {
  id: string;
  category: string;
  difficulty: string;
  prompt: string;
  choices: any;
  correct: any;
  explanation: string;
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
      .select('id, question_number, question_id, questions(id, category, difficulty, question_text, choices, correct_index, explanation)')
      .eq('match_id', matchId)
      .order('question_number', { ascending: true });

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
        roundNo: mq.question_number,
        question: {
          id: mq.questions.id,
          category: mq.questions.category,
          difficulty: mq.questions.difficulty,
          prompt: mq.questions.question_text,
          choices: mq.questions.choices,
          correct: mq.questions.correct_index,
          explanation: mq.questions.explanation
        }
      }));

      return new Response(
        JSON.stringify({
          success: true,
          matchId: matchId,
          category: category,
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
      const difficulty = DIFFICULTY_SCHEDULE[roundNo - 1];
      
      console.log(`[CREATE-MATCH-QUESTIONS] Selecting question ${roundNo}/10, difficulty: ${difficulty}`);

      // Get all active questions for this category and difficulty
      const { data: candidates, error: candidatesError } = await supabase
        .from('questions')
        .select('id, category, difficulty, question_text, choices, correct_index, explanation, created_at')
        .eq('category', category)
        .eq('difficulty', difficulty)
        .eq('is_active', true)
        .not('id', 'in', `(${Array.from(usedQuestionIds).join(',') || 'null'})`);

      if (candidatesError) {
        console.error(`[CREATE-MATCH-QUESTIONS] Error fetching candidates:`, candidatesError);
        return new Response(
          JSON.stringify({ error: "Error fetching question candidates", details: candidatesError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!candidates || candidates.length === 0) {
        console.error(`[CREATE-MATCH-QUESTIONS] No questions available for category: ${category}, difficulty: ${difficulty}`);
        return new Response(
          JSON.stringify({ 
            error: `No questions available for category '${category}' with difficulty '${difficulty}'`,
            category,
            difficulty,
            roundNo
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[CREATE-MATCH-QUESTIONS] Found ${candidates.length} candidate questions`);

      // For each candidate, count how many players have seen it recently
      const candidatesWithScores = await Promise.all(
        candidates.map(async (question) => {
          const { count, error: seenError } = await supabase
            .from('user_seen_questions')
            .select('user_id', { count: 'exact', head: true })
            .eq('question_id', question.id)
            .in('user_id', playerIds)
            .gte('seen_at', cutoffDate.toISOString());

          if (seenError) {
            console.warn(`[CREATE-MATCH-QUESTIONS] Error checking seen count:`, seenError);
            return { ...question, seenCount: 999 }; // Penalize on error
          }

          return { ...question, seenCount: count || 0 };
        })
      );

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

      // Sort by seenCount (asc), then created_at (asc), then random
      selectedTier.sort((a, b) => {
        if (a.seenCount !== b.seenCount) return a.seenCount - b.seenCount;
        if (a.created_at !== b.created_at) return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return Math.random() - 0.5;
      });

      // Pick the best question
      const selectedQuestion = selectedTier[0];
      selectedQuestions.push({
        roundNo,
        question: selectedQuestion
      });
      usedQuestionIds.add(selectedQuestion.id);

      console.log(`[CREATE-MATCH-QUESTIONS] Selected question ${selectedQuestion.id}, seenCount: ${selectedQuestion.seenCount}`);
    }

    // Insert into match_questions table
    const matchQuestionRows = selectedQuestions.map(sq => ({
      match_id: matchId,
      question_id: sq.question.id,
      question_number: sq.roundNo
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
      question: {
        id: sq.question.id,
        category: sq.question.category,
        difficulty: sq.question.difficulty,
        prompt: sq.question.question_text,
        choices: sq.question.choices,
        correct: sq.question.correct_index,
        explanation: sq.question.explanation
      }
    }));

    return new Response(
      JSON.stringify({
        success: true,
        matchId: matchId,
        category: category,
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