import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import Stripe from 'npm:stripe@14.14.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const body = await req.json();
    const { withdrawalRequestId, action, reason } = body;

    if (!withdrawalRequestId || !action) {
      return new Response(
        JSON.stringify({ error: 'withdrawalRequestId and action required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return new Response(
        JSON.stringify({ error: 'action must be approve or reject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === GET WITHDRAWAL REQUEST ===
    const { data: withdrawalRequest, error: fetchError } = await adminSupabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalRequestId)
      .maybeSingle();

    if (fetchError || !withdrawalRequest) {
      return new Response(
        JSON.stringify({ error: 'Withdrawal request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (withdrawalRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Withdrawal already ${withdrawalRequest.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reject') {
      // === REJECT WITHDRAWAL ===
      // Release locked funds back to available
      const { error: releaseError } = await adminSupabase.rpc('release_withdrawal_funds', {
        p_user_id: withdrawalRequest.user_id,
        p_amount_cents: withdrawalRequest.amount_cents,
      });

      if (releaseError) {
        console.error('Failed to release funds:', releaseError);
        return new Response(
          JSON.stringify({ error: 'Failed to release funds' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update withdrawal request
      await adminSupabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || 'Rejected by admin',
        })
        .eq('id', withdrawalRequestId);

      // Create audit event
      await adminSupabase.from('audit_events').insert({
        event_type: 'withdrawal_rejected',
        user_id: withdrawalRequest.user_id,
        admin_id: user.id,
        amount_cents: withdrawalRequest.amount_cents,
        metadata: {
          withdrawal_request_id: withdrawalRequestId,
          reason: reason,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Withdrawal rejected and funds released',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === APPROVE WITHDRAWAL ===
    // Kill switch check
    const { data: withdrawalsEnabled } = await adminSupabase.rpc('check_platform_control', {
      p_control_name: 'withdrawals_enabled',
    });

    if (!withdrawalsEnabled) {
      return new Response(
        JSON.stringify({ error: 'Withdrawals are currently disabled' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Stripe payout
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // Create payout
    // NOTE: This requires Stripe Connect or a custom payout destination
    // For now, we'll create a payout object to track it
    const payout = await stripe.payouts.create({
      amount: withdrawalRequest.amount_cents,
      currency: 'usd',
      metadata: {
        user_id: withdrawalRequest.user_id,
        withdrawal_request_id: withdrawalRequestId,
        approved_by: user.id,
      },
      description: `Withdrawal for user ${withdrawalRequest.user_id}`,
    });

    // Update withdrawal request
    await adminSupabase
      .from('withdrawal_requests')
      .update({
        status: 'processing',
        stripe_payout_id: payout.id,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', withdrawalRequestId);

    // Create audit event
    await adminSupabase.from('audit_events').insert({
      event_type: 'withdrawal_approved',
      user_id: withdrawalRequest.user_id,
      admin_id: user.id,
      amount_cents: withdrawalRequest.amount_cents,
      metadata: {
        withdrawal_request_id: withdrawalRequestId,
        stripe_payout_id: payout.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Withdrawal approved and payout initiated',
        payoutId: payout.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-withdrawal-approve:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});