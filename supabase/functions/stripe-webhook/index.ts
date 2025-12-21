import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import Stripe from 'npm:stripe@14.14.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get Stripe signature
    const signature = req.headers.get('Stripe-Signature');
    if (!signature) {
      console.error('Missing Stripe signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read raw body for signature verification
    const rawBody = await req.text();

    // === VERIFY STRIPE SIGNATURE ===
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Stripe configuration missing');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === IDEMPOTENCY CHECK ===
    const { data: existingEvent } = await supabase
      .from('provider_events')
      .select('id, processed, processing_error')
      .eq('provider_name', 'stripe')
      .eq('provider_event_id', event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed`);
      return new Response(
        JSON.stringify({
          received: true,
          message: 'Event already processed',
          processed: existingEvent.processed,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store event (idempotency enforcement)
    const { error: eventInsertError } = await supabase
      .from('provider_events')
      .insert({
        provider_name: 'stripe',
        provider_event_id: event.id,
        event_type: event.type,
        payload: event,
        raw_body: rawBody,
        signature_verified: true,
      });

    if (eventInsertError) {
      // Unique constraint violation = already processed
      if (eventInsertError.code === '23505') {
        return new Response(
          JSON.stringify({ received: true, message: 'Event already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Failed to store provider event:', eventInsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === PROCESS EVENT ===
    let processed = false;
    let processingError = null;

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handleDepositSuccess(supabase, event);
          processed = true;
          break;

        case 'payment_intent.payment_failed':
          await handleDepositFailure(supabase, event);
          processed = true;
          break;

        case 'payout.paid':
          await handleWithdrawalSuccess(supabase, event);
          processed = true;
          break;

        case 'payout.failed':
          await handleWithdrawalFailure(supabase, event);
          processed = true;
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
          processed = true; // Mark as processed to avoid retry
      }
    } catch (err) {
      console.error(`Error processing ${event.type}:`, err);
      processingError = err.message;

      // Create critical alert for payment processing failures
      await supabase.rpc('create_alert', {
        p_alert_type: 'payment_processing_error',
        p_severity: 'critical',
        p_message: `Failed to process ${event.type}: ${err.message}`,
        p_metadata: { event_id: event.id, event_type: event.type },
      });
    }

    // Update event processing status
    await supabase
      .from('provider_events')
      .update({
        processed: processed,
        processed_at: processed ? new Date().toISOString() : null,
        processing_error: processingError,
      })
      .eq('provider_name', 'stripe')
      .eq('provider_event_id', event.id);

    return new Response(
      JSON.stringify({ received: true, processed: processed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// === DEPOSIT SUCCESS HANDLER ===
async function handleDepositSuccess(supabase: any, event: any) {
  const paymentIntent = event.data.object;
  const paymentIntentId = paymentIntent.id;
  const amountCents = paymentIntent.amount;
  const userId = paymentIntent.metadata?.user_id;
  const depositIntentId = paymentIntent.metadata?.deposit_intent_id;

  console.log(`Processing deposit success: ${paymentIntentId}, amount: ${amountCents}`);

  if (!userId || !depositIntentId) {
    throw new Error('Missing user_id or deposit_intent_id in metadata');
  }

  // Find deposit intent
  const { data: depositIntent } = await supabase
    .from('deposit_intents')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (!depositIntent) {
    throw new Error(`Deposit intent not found for ${paymentIntentId}`);
  }

  if (depositIntent.status === 'completed') {
    console.log(`Deposit ${paymentIntentId} already completed`);
    return;
  }

  // === LEDGER-BASED DEPOSIT PROCESSING ===
  const { data: result, error: processError } = await supabase.rpc('process_deposit', {
    p_user_id: userId,
    p_amount_cents: amountCents,
    p_deposit_intent_id: depositIntentId,
    p_stripe_payment_intent_id: paymentIntentId,
  });

  if (processError || !result || result.length === 0 || !result[0].success) {
    const errorMsg = processError?.message || result?.[0]?.error_message || 'Unknown error';
    console.error('Failed to process deposit:', errorMsg);

    // Create critical alert
    await supabase.rpc('create_alert', {
      p_alert_type: 'deposit_processing_failed',
      p_severity: 'critical',
      p_message: `Failed to credit wallet for deposit ${paymentIntentId}: ${errorMsg}`,
      p_user_id: userId,
      p_metadata: {
        payment_intent_id: paymentIntentId,
        amount_cents: amountCents,
        error: errorMsg,
      },
    });

    throw new Error(errorMsg);
  }

  // Update deposit intent status
  await supabase
    .from('deposit_intents')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', depositIntentId);

  // Create audit event
  await supabase.from('audit_events').insert({
    event_type: 'deposit_completed',
    user_id: userId,
    amount_cents: amountCents,
    metadata: {
      deposit_intent_id: depositIntentId,
      payment_intent_id: paymentIntentId,
      new_balance: result[0].new_balance_cents,
    },
  });

  console.log(`Deposit ${paymentIntentId} successfully credited to user ${userId}. New balance: ${result[0].new_balance_cents}`);
}

// === DEPOSIT FAILURE HANDLER ===
async function handleDepositFailure(supabase: any, event: any) {
  const paymentIntent = event.data.object;
  const paymentIntentId = paymentIntent.id;
  const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

  console.error(`Deposit failed: ${paymentIntentId}, reason: ${failureMessage}`);

  // Find deposit intent
  const { data: depositIntent } = await supabase
    .from('deposit_intents')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (!depositIntent) {
    console.warn(`Deposit intent not found for failed payment ${paymentIntentId}`);
    return;
  }

  // Update status
  await supabase
    .from('deposit_intents')
    .update({
      status: 'failed',
      failed_reason: failureMessage,
    })
    .eq('id', depositIntent.id);

  // Create audit event
  await supabase.from('audit_events').insert({
    event_type: 'deposit_failed',
    user_id: depositIntent.user_id,
    amount_cents: depositIntent.amount_cents,
    metadata: {
      deposit_intent_id: depositIntent.id,
      payment_intent_id: paymentIntentId,
      reason: failureMessage,
    },
  });
}

// === WITHDRAWAL SUCCESS HANDLER ===
async function handleWithdrawalSuccess(supabase: any, event: any) {
  const payout = event.data.object;
  const payoutId = payout.id;
  const amountCents = payout.amount;

  console.log(`Processing withdrawal success: ${payoutId}, amount: ${amountCents}`);

  // Find withdrawal request
  const { data: withdrawalRequest } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('stripe_payout_id', payoutId)
    .maybeSingle();

  if (!withdrawalRequest) {
    throw new Error(`Withdrawal request not found for payout ${payoutId}`);
  }

  if (withdrawalRequest.status === 'completed') {
    console.log(`Withdrawal ${payoutId} already completed`);
    return;
  }

  // === FINALIZE WITHDRAWAL (DEDUCT FROM LOCKED) ===
  const { data: result, error: finalizeError } = await supabase.rpc('finalize_withdrawal', {
    p_user_id: withdrawalRequest.user_id,
    p_amount_cents: amountCents,
    p_withdrawal_request_id: withdrawalRequest.id,
    p_stripe_payout_id: payoutId,
  });

  if (finalizeError || !result || result.length === 0 || !result[0].success) {
    const errorMsg = finalizeError?.message || result?.[0]?.error_message || 'Unknown error';
    console.error('Failed to finalize withdrawal:', errorMsg);

    await supabase.rpc('create_alert', {
      p_alert_type: 'withdrawal_finalization_failed',
      p_severity: 'critical',
      p_message: `Failed to finalize withdrawal ${payoutId}: ${errorMsg}`,
      p_user_id: withdrawalRequest.user_id,
      p_metadata: { payout_id: payoutId, amount_cents: amountCents, error: errorMsg },
    });

    throw new Error(errorMsg);
  }

  // Update withdrawal request status
  await supabase
    .from('withdrawal_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', withdrawalRequest.id);

  // Create audit event
  await supabase.from('audit_events').insert({
    event_type: 'withdrawal_completed',
    user_id: withdrawalRequest.user_id,
    amount_cents: amountCents,
    metadata: {
      withdrawal_request_id: withdrawalRequest.id,
      payout_id: payoutId,
    },
  });

  console.log(`Withdrawal ${payoutId} completed for user ${withdrawalRequest.user_id}`);
}

// === WITHDRAWAL FAILURE HANDLER ===
async function handleWithdrawalFailure(supabase: any, event: any) {
  const payout = event.data.object;
  const payoutId = payout.id;
  const failureMessage = payout.failure_message || 'Payout failed';

  console.error(`Withdrawal failed: ${payoutId}, reason: ${failureMessage}`);

  // Find withdrawal request
  const { data: withdrawalRequest } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('stripe_payout_id', payoutId)
    .maybeSingle();

  if (!withdrawalRequest) {
    console.warn(`Withdrawal request not found for failed payout ${payoutId}`);
    return;
  }

  // === RELEASE LOCKED FUNDS BACK TO AVAILABLE ===
  const { data: result, error: releaseError } = await supabase.rpc('release_withdrawal_funds', {
    p_user_id: withdrawalRequest.user_id,
    p_amount_cents: withdrawalRequest.amount_cents,
  });

  if (releaseError || !result || result.length === 0 || !result[0].success) {
    const errorMsg = releaseError?.message || 'Failed to release funds';
    console.error('Failed to release locked funds:', errorMsg);

    await supabase.rpc('create_alert', {
      p_alert_type: 'withdrawal_refund_failed',
      p_severity: 'critical',
      p_message: `Failed to refund user after withdrawal failure ${payoutId}`,
      p_user_id: withdrawalRequest.user_id,
      p_metadata: { payout_id: payoutId, amount_cents: withdrawalRequest.amount_cents },
    });
  }

  // Update withdrawal request status
  await supabase
    .from('withdrawal_requests')
    .update({
      status: 'failed',
      failed_reason: failureMessage,
    })
    .eq('id', withdrawalRequest.id);

  // Create audit event
  await supabase.from('audit_events').insert({
    event_type: 'withdrawal_failed',
    user_id: withdrawalRequest.user_id,
    amount_cents: withdrawalRequest.amount_cents,
    metadata: {
      withdrawal_request_id: withdrawalRequest.id,
      payout_id: payoutId,
      reason: failureMessage,
      funds_refunded: result?.[0]?.success || false,
    },
  });

  console.log(`Withdrawal ${payoutId} failed and funds refunded to user ${withdrawalRequest.user_id}`);
}