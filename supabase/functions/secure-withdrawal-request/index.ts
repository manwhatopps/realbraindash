import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, Idempotency-Key',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Extract idempotency key
    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return new Response(
        JSON.stringify({ error: 'Idempotency-Key header required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user
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

    // Check if withdrawal already exists with this idempotency key
    const { data: existingRequest } = await adminSupabase
      .from('withdrawal_requests')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingRequest) {
      return new Response(
        JSON.stringify({
          success: true,
          withdrawal_request: existingRequest,
          message: 'Withdrawal request already exists',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { amountCents, destination } = body;

    if (!amountCents || amountCents <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!destination || !destination.type) {
      return new Response(
        JSON.stringify({ error: 'Invalid destination' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === KILL SWITCH CHECK ===
    const { data: withdrawalsEnabled } = await adminSupabase.rpc('check_platform_control', {
      p_control_name: 'withdrawals_enabled',
    });

    if (!withdrawalsEnabled) {
      return new Response(
        JSON.stringify({ error: 'Withdrawals are temporarily disabled' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === ACCOUNT FREEZE CHECK ===
    const { data: isFrozen } = await adminSupabase.rpc('is_account_frozen', {
      p_user_id: user.id,
    });

    if (isFrozen) {
      return new Response(
        JSON.stringify({ error: 'Account frozen - withdrawals not permitted' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === RE-CHECK KYC STATUS ===
    const { data: eligibility } = await adminSupabase
      .from('user_eligibility')
      .select('kyc_status, kyc_tier, withdrawals_locked')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!eligibility || eligibility.kyc_status !== 'approved' || eligibility.withdrawals_locked) {
      return new Response(
        JSON.stringify({ error: 'KYC verification required or withdrawals locked' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === FRAUD SCORE CHECK ===
    const { data: fraudScore } = await adminSupabase.rpc('compute_velocity_fraud_score', {
      p_user_id: user.id,
    });

    if (fraudScore && fraudScore >= 70) {
      return new Response(
        JSON.stringify({ error: 'Account flagged for review - withdrawals temporarily restricted' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === WITHDRAWAL LIMIT CHECKS ===
    // Check daily limit
    const { data: dailyLimitCheck } = await adminSupabase.rpc('check_platform_limit', {
      p_limit_type: 'max_withdrawal_per_day_cents',
      p_current_value: amountCents,
    });

    if (dailyLimitCheck && dailyLimitCheck.length > 0 && !dailyLimitCheck[0].within_limit) {
      return new Response(
        JSON.stringify({
          error: `Withdrawal exceeds daily limit of $${dailyLimitCheck[0].limit_value / 100}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === RATE LIMIT: 1 withdrawal per 24h ===
    const { data: rateLimitOk } = await adminSupabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'withdrawal',
      p_max_count: 1,
      p_window_minutes: 1440, // 24 hours
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Withdrawal rate limit: 1 withdrawal per 24 hours' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === COOLDOWN CHECK: 24h since last match ===
    const { data: lastMatch } = await adminSupabase
      .from('match_players')
      .select('joined_at')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMatch) {
      const hoursSinceLastMatch = (Date.now() - new Date(lastMatch.joined_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastMatch < 24) {
        return new Response(
          JSON.stringify({
            error: 'Withdrawal cooldown: Must wait 24 hours after last match',
            hours_remaining: Math.ceil(24 - hoursSinceLastMatch),
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // === BALANCE CHECK WITH LOCK ===
    const { data: balanceCheck } = await adminSupabase.rpc('lock_and_check_balance', {
      p_user_id: user.id,
      p_required_cents: amountCents,
    });

    if (!balanceCheck || balanceCheck.length === 0 || !balanceCheck[0].can_proceed) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if manual review required
    const requiresManualReview = (
      amountCents >= 100000 || // $1,000+
      fraudScore >= 50 || // Medium-high fraud score
      (Date.now() - new Date(user.created_at).getTime()) < (30 * 24 * 60 * 60 * 1000) // Account < 30 days
    );

    // Create withdrawal request
    const { data: withdrawalRequest, error: insertError } = await adminSupabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount_cents: amountCents,
        destination: destination,
        status: requiresManualReview ? 'pending' : 'approved',
        requires_manual_review: requiresManualReview,
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create withdrawal request', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lock funds for withdrawal (move from available to locked)
    const { data: lockResult, error: lockError } = await adminSupabase.rpc('lock_withdrawal_funds', {
      p_user_id: user.id,
      p_amount_cents: amountCents,
    });

    if (lockError || !lockResult || lockResult.length === 0 || !lockResult[0].success) {
      // Rollback withdrawal request
      await adminSupabase
        .from('withdrawal_requests')
        .delete()
        .eq('id', withdrawalRequest.id);

      return new Response(
        JSON.stringify({
          error: 'Failed to lock funds',
          details: lockError?.message || lockResult?.[0]?.error_message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audit event
    await adminSupabase.from('audit_events').insert({
      event_type: 'withdrawal_requested',
      user_id: user.id,
      amount_cents: amountCents,
      metadata: {
        withdrawal_request_id: withdrawalRequest.id,
        requires_manual_review: requiresManualReview,
        destination_type: destination.type,
      },
    });

    // If requires manual review, create alert
    if (requiresManualReview) {
      await adminSupabase.rpc('create_alert', {
        p_alert_type: 'withdrawal_review_required',
        p_severity: 'warning',
        p_message: `Withdrawal of $${amountCents / 100} requires manual review`,
        p_user_id: user.id,
        p_metadata: { withdrawal_request_id: withdrawalRequest.id, amount_cents: amountCents },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        withdrawal_request: withdrawalRequest,
        message: requiresManualReview
          ? 'Withdrawal request submitted - pending manual review'
          : 'Withdrawal request approved - processing payment',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secure-withdrawal-request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});