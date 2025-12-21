import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { category, count = 10 } = await req.json();

    if (!category) {
      return new Response(
        JSON.stringify({ error: "Category is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get OpenAI API key from environment
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    console.log("[OPENAI] KEY LOADED:", !!openaiKey);

    if (!openaiKey) {
      console.error("[OPENAI] ❌ OPENAI_API_KEY not configured in Supabase Edge Function Secrets");
      return new Response(
        JSON.stringify({ error: "AI service not configured - add OPENAI_API_KEY to Supabase Edge Function Secrets" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[OPENAI] Generating ${count} questions for category: ${category}`);

    // Call OpenAI API to generate questions
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a trivia question generator. Generate ${count} multiple choice trivia questions about ${category}. Each question should have 4 answer choices. Return ONLY valid JSON in this exact format with no markdown formatting:\n{\n  "questions": [\n    {\n      "question": "Question text here?",\n      "choices": ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],\n      "correctIndex": 0\n    }\n  ]\n}\n\nMake questions engaging, challenging but fair, and ensure correct answers are randomly distributed across all choice positions (0-3).`
          },
          {
            role: "user",
            content: `Generate ${count} trivia questions about ${category}.`
          }
        ],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[OPENAI] ❌ API error:", openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate questions from OpenAI", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await openaiResponse.json();
    const content = aiData.choices[0].message.content;
    console.log("[OPENAI] ✓ Received response from OpenAI");

    // Parse the JSON response from OpenAI
    let parsedQuestions;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedQuestions = JSON.parse(cleanContent);
      console.log("[OPENAI] ✓ Parsed", parsedQuestions.questions?.length, "questions");
    } catch (parseError) {
      console.error("[OPENAI] ❌ Failed to parse response:", content);
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add unique IDs to questions
    const questionsWithIds = parsedQuestions.questions.map((q: any, i: number) => ({
      id: `${category}-${Date.now()}-${i}`,
      question: q.question,
      choices: q.choices,
      correctIndex: q.correctIndex,
    }));

    console.log("[OPENAI] ✓ Returning", questionsWithIds.length, "questions for", category);

    return new Response(
      JSON.stringify({
        success: true,
        category,
        questions: questionsWithIds
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[OPENAI] ❌ Error generating questions:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
