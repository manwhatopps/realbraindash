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

    const body = await req.json();
    const { amountCents } = body;

    if (!amountCents || amountCents <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === KILL SWITCH CHECK ===
    const { data: depositsEnabled } = await adminSupabase.rpc('check_platform_control', {
      p_control_name: 'deposits_enabled',
    });

    if (!depositsEnabled) {
      return new Response(
        JSON.stringify({ error: 'Deposits are temporarily disabled' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === ACCOUNT FREEZE CHECK ===
    const { data: isFrozen } = await adminSupabase.rpc('is_account_frozen', {
      p_user_id: user.id,
    });

    if (isFrozen) {
      return new Response(
        JSON.stringify({ error: 'Account frozen' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === DEPOSIT LIMITS ===
    // Check minimum (e.g., $5)
    if (amountCents < 500) {
      return new Response(
        JSON.stringify({ error: 'Minimum deposit is $5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check maximum (e.g., $1,000 per transaction)
    if (amountCents > 100000) {
      return new Response(
        JSON.stringify({ error: 'Maximum deposit is $1,000 per transaction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === RATE LIMIT ===
    const { data: rateLimitOk } = await adminSupabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'deposit',
      p_max_count: 5,
      p_window_minutes: 60,
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Deposit rate limit exceeded (5 per hour)' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === CREATE STRIPE PAYMENT INTENT ===
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment processing not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // Create deposit_intent record first
    const { data: depositIntent, error: insertError } = await adminSupabase
      .from('deposit_intents')
      .insert({
        user_id: user.id,
        amount_cents: amountCents,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create deposit intent:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create deposit intent' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        deposit_intent_id: depositIntent.id,
        environment: Deno.env.get('ENVIRONMENT') || 'production',
      },
      description: `Deposit for BrainDash Royale - ${user.email}`,
    });

    // Update deposit_intent with Stripe details
    await adminSupabase
      .from('deposit_intents')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_client_secret: paymentIntent.client_secret,
        status: 'processing',
      })
      .eq('id', depositIntent.id);

    // Create audit event
    await adminSupabase.from('audit_events').insert({
      event_type: 'deposit_intent_created',
      user_id: user.id,
      amount_cents: amountCents,
      metadata: {
        deposit_intent_id: depositIntent.id,
        stripe_payment_intent_id: paymentIntent.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        depositIntentId: depositIntent.id,
        clientSecret: paymentIntent.client_secret,
        amountCents: amountCents,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-deposit-intent:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});