import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import OpenAI from 'npm:openai@4.73.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Service-Key',
};

const questionSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question_text: { type: 'string' },
          choices: {
            type: 'array',
            items: { type: 'string' },
            minItems: 4,
            maxItems: 4,
          },
          correct_index: {
            type: 'integer',
            minimum: 0,
            maximum: 3,
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
          },
          category: { type: 'string' },
          explanation: { type: 'string' },
          source_confidence: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
        },
        required: [
          'question_text',
          'choices',
          'correct_index',
          'difficulty',
          'category',
          'explanation',
          'source_confidence',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

const UNSAFE_KEYWORDS = [
  'kill',
  'murder',
  'suicide',
  'rape',
  'sex',
  'porn',
  'nude',
  'drug',
  'cocaine',
  'heroin',
  'nazi',
  'hitler',
  'genocide',
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const serviceKey = req.headers.get('X-Service-Key');
    const expectedKey = Deno.env.get('SERVICE_KEY');
    if (!expectedKey || serviceKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { category, difficulty, count = 5, createdBy } = body;

    if (!category || !difficulty) {
      return new Response(
        JSON.stringify({ error: 'category and difficulty required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return new Response(
        JSON.stringify({ error: 'difficulty must be easy, medium, or hard' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (count < 1 || count > 20) {
      return new Response(
        JSON.stringify({ error: 'count must be between 1 and 20' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: recentFingerprints } = await supabase.rpc('get_recent_fingerprints', {
      p_category: category,
      p_limit: 100,
    });

    const recentQuestions = recentFingerprints
      ? recentFingerprints.map((f: any) => f.question_text).slice(0, 20)
      : [];

    const prompt = buildPrompt(category, difficulty, count, recentQuestions);

    console.log(`Generating ${count} ${difficulty} questions for category: ${category}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const startTime = Date.now();
    let completion;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        completion = await openai.chat.completions.create({
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content: 'You are a trivia question generator. Generate accurate, engaging questions with correct answers. Ensure all questions are appropriate for a general audience.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'trivia_questions',
              strict: true,
              schema: questionSchema,
            },
          },
          temperature: 0.8,
        });

        break;
      } catch (err) {
        retryCount++;
        console.error(`OpenAI API error (attempt ${retryCount}):`, err.message);
        if (retryCount > maxRetries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    const elapsed = Date.now() - startTime;
    const usage = completion.usage;

    console.log(`OpenAI response received in ${elapsed}ms. Tokens: ${usage?.total_tokens}`);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (err) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    const questions = parsedResponse.questions;
    if (!Array.isArray(questions)) {
      throw new Error('Invalid questions array in response');
    }

    const results = {
      generated: questions.length,
      inserted: 0,
      duplicates: 0,
      unsafe: 0,
      questionIds: [] as string[],
    };

    for (const q of questions) {
      const unsafe = isUnsafe(q.question_text) || q.choices.some((c: string) => isUnsafe(c));
      if (unsafe) {
        console.warn(`Unsafe content detected, skipping question: ${q.question_text}`);
        results.unsafe++;
        continue;
      }

      const difficultyValid = validateDifficulty(q.question_text, q.difficulty);
      if (!difficultyValid.valid) {
        console.warn(`Difficulty mismatch for ${q.difficulty}: ${difficultyValid.reason}`);
        results.unsafe++;
        continue;
      }

      const { data: insertResult, error: insertError } = await supabase.rpc(
        'insert_generated_question_enhanced',
        {
          p_category: category,
          p_difficulty: difficulty,
          p_question_text: q.question_text,
          p_choices: q.choices,
          p_correct_index: q.correct_index,
          p_explanation: q.explanation,
          p_source_confidence: q.source_confidence,
          p_created_by: createdBy || null,
        }
      );

      if (insertError) {
        console.error('Failed to insert question:', insertError);
        continue;
      }

      if (insertResult && insertResult.length > 0) {
        const result = insertResult[0];
        if (result.is_duplicate) {
          results.duplicates++;
        } else if (!result.success) {
          console.warn(`Question rejected: ${result.rejection_reason}`);
          results.unsafe++;
        } else {
          results.inserted++;
          results.questionIds.push(result.question_id);
        }
      }
    }

    const costEstimate = Math.ceil(
      ((usage?.prompt_tokens || 0) * 0.25 + (usage?.completion_tokens || 0) * 1.0) / 100
    );

    await supabase.from('question_generation_log').insert({
      category: category,
      difficulty: difficulty,
      prompt_tokens: usage?.prompt_tokens || 0,
      completion_tokens: usage?.completion_tokens || 0,
      total_cost_cents: costEstimate,
      success: true,
      questions_generated: results.generated,
      duplicates_rejected: results.duplicates,
      created_by: createdBy || null,
      metadata: {
        model: 'gpt-4o-2024-08-06',
        elapsed_ms: elapsed,
        unsafe_rejected: results.unsafe,
      },
    });

    console.log(
      `Generated ${results.inserted} new questions (${results.duplicates} duplicates, ${results.unsafe} unsafe)`
    );

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        tokens: usage?.total_tokens,
        costCents: costEstimate,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-questions:', error);

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const body = await req.json().catch(() => ({}));

      await supabase.from('question_generation_log').insert({
        category: body.category || 'unknown',
        difficulty: body.difficulty || 'easy',
        success: false,
        error_message: error.message,
        questions_generated: 0,
        duplicates_rejected: 0,
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(
  category: string,
  difficulty: string,
  count: number,
  recentQuestions: string[]
): string {
  const categoryGuidance: Record<string, string> = {
    'Politics': 'covering political events, leaders, systems, and policies',
    'Business': 'covering economics, companies, finance, and business leaders',
    'Science': 'covering physics, chemistry, biology, and astronomy',
    'History': 'covering world history, significant events, and historical figures',
    'Geography': 'covering countries, capitals, landmarks, and physical geography',
    'Sports': 'covering various sports, athletes, records, and major events',
    'Music': 'covering music history, artists, genres, and musical works',
    'Movies': 'covering films, directors, actors, and cinema history',
    'Pop Culture': 'covering contemporary culture, celebrities, trends, and media',
  };

  const guidance = categoryGuidance[category] || `about ${category}`;

  const difficultyGuidance: Record<string, string> = {
    easy: 'suitable for beginners, covering well-known facts',
    medium: 'requiring some knowledge, challenging but not obscure',
    hard: 'for experts, covering advanced or less common information',
  };

  let prompt = `Generate ${count} ${difficulty} trivia questions ${guidance}.\n\n`;
  prompt += `Difficulty level: ${difficultyGuidance[difficulty]}\n\n`;
  prompt += 'Requirements:\n';
  prompt += '- Each question must have exactly 4 choices\n';
  prompt += '- Exactly one choice is correct\n';
  prompt += '- Provide a brief explanation (1-2 sentences) for the correct answer\n';
  prompt += '- Indicate your confidence in the answer accuracy (low/medium/high)\n';
  prompt += '- Questions must be clear, unambiguous, and appropriate for all ages\n';
  prompt += '- Avoid controversial topics, offensive content, or sensitive subjects\n\n';

  if (recentQuestions.length > 0) {
    prompt += 'DO NOT REPEAT these recent questions:\n';
    recentQuestions.forEach((q, i) => {
      prompt += `${i + 1}. ${q}\n`;
    });
    prompt += '\n';
  }

  prompt += 'Generate diverse, interesting questions that test knowledge and reasoning.';

  return prompt;
}

function isUnsafe(text: string): boolean {
  const lower = text.toLowerCase();
  return UNSAFE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function validateDifficulty(questionText: string, difficulty: string): { valid: boolean; reason?: string } {
  const text = questionText.toLowerCase();

  const hasDate = /\b(19|20)\d{2}\b/.test(questionText);

  const words = questionText.split(/\s+/);
  const properNouns = words.slice(1).filter(w => /^[A-Z][a-z]+/.test(w)).length;

  const multiStep = /[+\-×÷()]\s*[+\-×÷()]/.test(questionText) ||
                    /(first|then|next|finally|after)/i.test(text);

  const wordCount = words.length;

  if (difficulty === 'easy') {
    if (multiStep) {
      return { valid: false, reason: 'Easy questions should not have multi-step reasoning' };
    }
    if (hasDate && properNouns >= 2) {
      return { valid: false, reason: 'Easy questions should not combine dates with multiple proper nouns' };
    }
    if (wordCount > 25) {
      return { valid: false, reason: 'Easy questions should be concise' };
    }
  } else if (difficulty === 'medium') {
    if (wordCount < 5) {
      return { valid: false, reason: 'Medium questions should have reasonable length' };
    }
  } else if (difficulty === 'hard') {
    if (!hasDate && properNouns === 0 && !multiStep && wordCount < 12) {
      return { valid: false, reason: 'Hard questions should include dates, proper nouns, or multi-step reasoning' };
    }
  }

  return { valid: true };
}