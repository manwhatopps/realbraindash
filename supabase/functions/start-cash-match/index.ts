import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  lobby_id: string;
}

interface Question {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { lobby_id }: RequestBody = await req.json();

    if (!lobby_id) {
      return new Response(
        JSON.stringify({ error: "lobby_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is a participant in this lobby
    const { data: participant, error: participantError } = await supabaseClient
      .from("cash_lobby_participants")
      .select("*")
      .eq("lobby_id", lobby_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (participantError || !participant) {
      return new Response(
        JSON.stringify({ error: "Not a participant in this lobby" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get lobby details
    const { data: lobby, error: lobbyError } = await supabaseClient
      .from("cash_lobbies")
      .select("*")
      .eq("id", lobby_id)
      .single();

    if (lobbyError || !lobby) {
      return new Response(
        JSON.stringify({ error: "Lobby not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify lobby is in countdown state
    if (lobby.status !== "countdown") {
      return new Response(
        JSON.stringify({ error: "Lobby is not ready to start" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all participants and verify all are ready
    const { data: allParticipants, error: allParticipantsError } = await supabaseClient
      .from("cash_lobby_participants")
      .select("*")
      .eq("lobby_id", lobby_id);

    if (allParticipantsError || !allParticipants || allParticipants.length === 0) {
      return new Response(
        JSON.stringify({ error: "No participants found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const allReady = allParticipants.every(
      (p) => p.has_accepted_terms && p.is_ready
    );

    if (!allReady) {
      return new Response(
        JSON.stringify({ error: "Not all participants are ready" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine question set
    let questions: Question[] = [];

    if (lobby.category_key === "politics") {
      // Check intro progress
      const { data: progress } = await supabaseClient
        .from("user_intro_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const introIndex = progress?.politics_intro_index || 0;
      const introCompleted = progress?.politics_intro_completed || false;

      if (!introCompleted && introIndex < 30) {
        // Use intro questions
        const { data: introQuestions, error: introError } = await supabaseClient
          .from("questions")
          .select("id, category, difficulty, question, correct_answer, incorrect_answers")
          .eq("intro_pack", "politics_intro_v1")
          .eq("is_intro", true)
          .order("id")
          .range(introIndex, introIndex + 9);

        if (introError) {
          console.error("Error fetching intro questions:", introError);
        } else if (introQuestions && introQuestions.length > 0) {
          questions = introQuestions as Question[];

          // If we got fewer than 10, fill remainder with normal questions
          if (questions.length < 10) {
            const needed = 10 - questions.length;
            const { data: normalQuestions } = await supabaseClient
              .from("questions")
              .select("id, category, difficulty, question, correct_answer, incorrect_answers")
              .eq("category", "politics")
              .eq("is_intro", false)
              .order("id")
              .limit(needed);

            if (normalQuestions) {
              questions = [...questions, ...normalQuestions as Question[]];
            }
          }
        }
      }
    }

    // If we still don't have questions, get normal ones
    if (questions.length === 0) {
      const { data: normalQuestions, error: questionsError } = await supabaseClient
        .from("questions")
        .select("id, category, difficulty, question, correct_answer, incorrect_answers")
        .eq("category", lobby.category_key)
        .eq("is_intro", false)
        .order("id")
        .limit(10);

      if (questionsError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch questions" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      questions = normalQuestions as Question[];
    }

    // Ensure we have exactly 10 questions
    if (questions.length < 10) {
      return new Response(
        JSON.stringify({ error: "Not enough questions available" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    questions = questions.slice(0, 10);

    // Create the match with questions snapshot
    const { data: match, error: matchError } = await supabaseClient
      .from("cash_matches")
      .insert({
        lobby_id: lobby_id,
        category_key: lobby.category_key,
        stake_cents: lobby.stake_cents,
        status: "active",
        questions: questions,
      })
      .select()
      .single();

    if (matchError || !match) {
      console.error("Error creating match:", matchError);
      return new Response(
        JSON.stringify({ error: "Failed to create match" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update lobby status to in_progress
    const { error: updateError } = await supabaseClient
      .from("cash_lobbies")
      .update({ status: "in_progress" })
      .eq("id", lobby_id);

    if (updateError) {
      console.error("Error updating lobby status:", updateError);
    }

    // Return match data
    return new Response(
      JSON.stringify({
        match_id: match.id,
        questions: questions,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
