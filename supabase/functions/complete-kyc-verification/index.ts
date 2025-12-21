import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = user.id;
    const { success = true } = await req.json().catch(() => ({ success: true }));

    const newStatus = success ? 'verified' : 'failed';

    const { data: existingKyc } = await supabase
      .from('user_kyc_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingKyc) {
      await supabase
        .from('user_kyc_status')
        .update({
          kyc_status: newStatus,
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_kyc_status')
        .insert({
          user_id: userId,
          kyc_status: newStatus,
          kyc_vendor: 'placeholder',
          kyc_reference_id: crypto.randomUUID(),
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        kyc_status: newStatus,
        message: `KYC status updated to ${newStatus}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error completing KYC verification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});