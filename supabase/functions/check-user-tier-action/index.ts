import { createClient } from 'npm:@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { actionType, amountCents = 0, gameMode } = await req.json();

    if (!actionType) {
      throw new Error('Missing actionType parameter');
    }

    const { data, error } = await supabase.rpc('can_user_action', {
      p_user_id: user.id,
      p_action_type: actionType,
      p_amount_cents: amountCents
    });

    if (error) {
      console.error('Error checking user action:', error);
      throw error;
    }

    if (!data.allowed) {
      await supabase.from('compliance_events').insert({
        user_id: user.id,
        event_type: actionType === 'deposit' ? 'deposit_blocked' : actionType === 'withdraw' ? 'withdrawal_blocked' : 'limit_exceeded',
        details: {
          action: actionType,
          amount_cents: amountCents,
          reason: data.reason,
          code: data.code,
          tier: data.tier
        }
      });
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        allowed: false,
        error: error.message || 'Internal server error',
        code: 'ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});