import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature, X-Provider-Signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get provider from path or header
    const url = new URL(req.url);
    const providerName = url.searchParams.get('provider') || 'stripe';

    // Get provider config
    const { data: provider, error: providerError } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('provider_name', providerName)
      .eq('is_enabled', true)
      .maybeSingle();

    if (providerError || !provider) {
      console.error('Provider not found or disabled:', providerName);
      return new Response(
        JSON.stringify({ error: 'Provider not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('Stripe-Signature') || req.headers.get('X-Provider-Signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Verify signature using provider.webhook_secret_hash
    // For now, we'll parse the payload
    const payload = JSON.parse(rawBody);

    // Extract event details (Stripe format)
    const eventId = payload.id;
    const eventType = payload.type;
    const eventData = payload.data?.object;

    if (!eventId || !eventType) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check idempotency - have we processed this event?
    const { data: existingEvent } = await supabase
      .from('provider_events')
      .select('id, processed')
      .eq('provider_name', providerName)
      .eq('provider_event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ${eventId} already processed`);
      return new Response(
        JSON.stringify({ received: true, message: 'Event already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store event
    const { error: eventInsertError } = await supabase
      .from('provider_events')
      .insert({
        provider_name: providerName,
        provider_event_id: eventId,
        event_type: eventType,
        payload: payload,
      });

    if (eventInsertError) {
      console.error('Failed to store provider event:', eventInsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process event based on type
    let processed = false;
    let processingError = null;

    try {
      if (eventType === 'payment_intent.succeeded' || eventType === 'charge.succeeded') {
        // DEPOSIT SUCCESSFUL
        const intentId = eventData.id;
        const amountCents = eventData.amount; // Stripe uses cents
        const customerId = eventData.customer;
        const metadata = eventData.metadata || {};

        console.log(`Processing deposit success: ${intentId}, amount: ${amountCents}`);

        // Find deposit intent
        const { data: depositIntent } = await supabase
          .from('deposit_intents')
          .select('*')
          .eq('provider_intent_id', intentId)
          .maybeSingle();

        if (!depositIntent) {
          console.error(`Deposit intent not found for ${intentId}`);
          processingError = 'Deposit intent not found';
        } else if (depositIntent.status === 'completed') {
          console.log(`Deposit ${intentId} already completed`);
          processed = true;
        } else {
          // Credit wallet ATOMICALLY
          const userId = depositIntent.user_id;

          // Update wallet balance
          const { error: walletError } = await supabase.rpc('credit_wallet_atomic', {
            p_user_id: userId,
            p_amount_cents: amountCents,
            p_transaction_type: 'deposit',
            p_description: `Deposit via ${providerName} - ${intentId}`,
            p_metadata: { provider_intent_id: intentId, provider: providerName },
          });

          if (walletError) {
            console.error('Failed to credit wallet:', walletError);
            processingError = walletError.message;

            // Create critical alert
            await supabase.rpc('create_alert', {
              p_alert_type: 'payment_processing_error',
              p_severity: 'critical',
              p_message: `Failed to credit wallet for deposit ${intentId}`,
              p_user_id: userId,
              p_metadata: { intent_id: intentId, amount_cents: amountCents, error: walletError.message },
            });
          } else {
            // Update deposit intent status
            await supabase
              .from('deposit_intents')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', depositIntent.id);

            // Create audit event
            await supabase.from('audit_events').insert({
              event_type: 'deposit_completed',
              user_id: userId,
              amount_cents: amountCents,
              metadata: { provider: providerName, intent_id: intentId },
            });

            processed = true;
            console.log(`Deposit ${intentId} successfully credited to user ${userId}`);
          }
        }
      } else if (eventType === 'payout.paid' || eventType === 'transfer.paid') {
        // WITHDRAWAL SUCCESSFUL
        const payoutId = eventData.id;
        const amountCents = eventData.amount;

        console.log(`Processing payout success: ${payoutId}, amount: ${amountCents}`);

        // Find withdrawal request
        const { data: withdrawalRequest } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('provider_payout_id', payoutId)
          .maybeSingle();

        if (!withdrawalRequest) {
          console.error(`Withdrawal request not found for ${payoutId}`);
          processingError = 'Withdrawal request not found';
        } else if (withdrawalRequest.status === 'completed') {
          console.log(`Withdrawal ${payoutId} already completed`);
          processed = true;
        } else {
          // Update withdrawal request
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
            metadata: { provider: providerName, payout_id: payoutId },
          });

          processed = true;
          console.log(`Withdrawal ${payoutId} completed for user ${withdrawalRequest.user_id}`);
        }
      } else if (eventType === 'payout.failed' || eventType === 'transfer.failed') {
        // WITHDRAWAL FAILED
        const payoutId = eventData.id;
        const failureMessage = eventData.failure_message || 'Unknown error';

        console.error(`Payout failed: ${payoutId}, reason: ${failureMessage}`);

        // Find withdrawal request
        const { data: withdrawalRequest } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('provider_payout_id', payoutId)
          .maybeSingle();

        if (withdrawalRequest) {
          // Update status to failed
          await supabase
            .from('withdrawal_requests')
            .update({
              status: 'failed',
              rejection_reason: failureMessage,
            })
            .eq('id', withdrawalRequest.id);

          // Release locked funds back to available
          await supabase.rpc('credit_wallet_atomic', {
            p_user_id: withdrawalRequest.user_id,
            p_amount_cents: withdrawalRequest.amount_cents,
            p_transaction_type: 'withdrawal_refund',
            p_description: `Withdrawal failed - funds restored: ${failureMessage}`,
            p_metadata: { payout_id: payoutId, original_amount: withdrawalRequest.amount_cents },
          });

          // Create alert
          await supabase.rpc('create_alert', {
            p_alert_type: 'withdrawal_failed',
            p_severity: 'error',
            p_message: `Withdrawal failed for user ${withdrawalRequest.user_id}: ${failureMessage}`,
            p_user_id: withdrawalRequest.user_id,
            p_metadata: { payout_id: payoutId, amount_cents: withdrawalRequest.amount_cents },
          });

          processed = true;
        }
      } else {
        console.log(`Unhandled event type: ${eventType}`);
        processed = true; // Mark as processed to avoid retry
      }
    } catch (err) {
      console.error('Error processing webhook event:', err);
      processingError = err.message;
    }

    // Update event processing status
    await supabase
      .from('provider_events')
      .update({
        processed: processed,
        processed_at: processed ? new Date().toISOString() : null,
        processing_error: processingError,
      })
      .eq('provider_name', providerName)
      .eq('provider_event_id', eventId);

    return new Response(
      JSON.stringify({ received: true, processed: processed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical error in payment webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});