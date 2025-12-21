import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // === ADMIN CHECK ===
    const { data: isAdmin } = await adminSupabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .maybeSingle();

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      if (action === 'stats') {
        return await handleGetStats(adminSupabase);
      } else if (action === 'generation-log') {
        return await handleGetGenerationLog(adminSupabase);
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (req.method === 'POST') {
      if (action === 'generate-batch') {
        return await handleGenerateBatch(adminSupabase, req, user.id);
      } else if (action === 'deactivate-question') {
        return await handleDeactivateQuestion(adminSupabase, req);
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-question-tools:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Get question statistics
async function handleGetStats(supabase: any) {
  const { data: stats, error } = await supabase.rpc('get_question_stats');

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stats', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get total generation cost
  const { data: costData } = await supabase
    .from('question_generation_log')
    .select('total_cost_cents')
    .eq('success', true);

  const totalCostCents = costData
    ? costData.reduce((sum: number, row: any) => sum + (row.total_cost_cents || 0), 0)
    : 0;

  // Get generation success rate
  const { data: logStats } = await supabase
    .from('question_generation_log')
    .select('success');

  const totalAttempts = logStats?.length || 0;
  const successfulAttempts = logStats?.filter((l: any) => l.success).length || 0;
  const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

  return new Response(
    JSON.stringify({
      success: true,
      questionStats: stats,
      totalCostCents: totalCostCents,
      totalCostDollars: (totalCostCents / 100).toFixed(2),
      generationAttempts: totalAttempts,
      successRate: successRate.toFixed(1),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get generation log
async function handleGetGenerationLog(supabase: any) {
  const { data: log, error } = await supabase
    .from('question_generation_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch log', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, log: log }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Generate batch of questions for all categories
async function handleGenerateBatch(supabase: any, req: Request, userId: string) {
  const body = await req.json();
  const { categories, difficulties = ['easy', 'medium', 'hard'], count = 20 } = body;

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return new Response(
      JSON.stringify({ error: 'categories array required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const serviceKey = Deno.env.get('SERVICE_KEY');
  if (!serviceKey) {
    return new Response(
      JSON.stringify({ error: 'Service key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const generateUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-questions`;

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    details: [] as any[],
  };

  // Generate for each category/difficulty combination
  for (const category of categories) {
    for (const difficulty of difficulties) {
      results.total++;

      try {
        console.log(`Generating ${count} ${difficulty} questions for ${category}`);

        const response = await fetch(generateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Key': serviceKey,
          },
          body: JSON.stringify({
            category,
            difficulty,
            count,
            createdBy: userId,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          results.successful++;
          results.details.push({
            category,
            difficulty,
            status: 'success',
            inserted: result.inserted,
            duplicates: result.duplicates,
            unsafe: result.unsafe,
            tokens: result.tokens,
            costCents: result.costCents,
          });
        } else {
          results.failed++;
          results.details.push({
            category,
            difficulty,
            status: 'failed',
            error: result.error || result.details,
          });
        }
      } catch (err) {
        results.failed++;
        results.details.push({
          category,
          difficulty,
          status: 'failed',
          error: err.message,
        });
      }

      // Rate limit: wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      results: results,
      message: `Generated questions for ${results.successful}/${results.total} category/difficulty combinations`,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Deactivate a question
async function handleDeactivateQuestion(supabase: any, req: Request) {
  const body = await req.json();
  const { questionId, reason } = body;

  if (!questionId) {
    return new Response(
      JSON.stringify({ error: 'questionId required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { error } = await supabase
    .from('questions')
    .update({
      is_active: false,
      metadata: { deactivated_reason: reason || 'Admin deactivated' },
    })
    .eq('id', questionId);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to deactivate question', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Question deactivated' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}