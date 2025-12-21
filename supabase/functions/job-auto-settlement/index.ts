import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Cron-Secret',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Verify cron secret
    const cronSecret = req.headers.get('X-Cron-Secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if settlement is enabled
    const { data: settlementEnabled } = await supabase.rpc('check_platform_control', {
      p_control_name: 'settlement_enabled',
    });

    if (!settlementEnabled) {
      return new Response(
        JSON.stringify({ message: 'Settlement disabled by kill switch', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find all matches that need settlement
    const { data: matchesNeedingSettlement, error: fetchError } = await supabase
      .from('lobbies')
      .select('id, match_id, state, settled_at, settlement_failed')
      .eq('state', 'completed')
      .is('settled_at', null)
      .eq('settlement_failed', false)
      .eq('is_cash_match', true)
      .limit(50); // Process in batches

    if (fetchError) {
      console.error('Error fetching matches for settlement:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch matches', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!matchesNeedingSettlement || matchesNeedingSettlement.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No matches need settlement', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${matchesNeedingSettlement.length} matches needing settlement`);

    const results = {
      total: matchesNeedingSettlement.length,
      succeeded: 0,
      failed: 0,
      locked: 0,
      details: [] as any[],
    };

    // Process each match
    for (const lobby of matchesNeedingSettlement) {
      try {
        console.log(`Processing settlement for match ${lobby.match_id}, lobby ${lobby.id}`);

        // Try to acquire lock
        const { data: lockAcquired } = await supabase.rpc('acquire_settlement_lock', {
          p_match_id: lobby.match_id,
          p_locked_by: 'auto-settlement-job',
        });

        if (!lockAcquired) {
          console.log(`Could not acquire lock for match ${lobby.match_id}`);
          results.locked++;
          results.details.push({
            match_id: lobby.match_id,
            lobby_id: lobby.id,
            status: 'locked',
            message: 'Another process is settling this match',
          });
          continue;
        }

        // Record attempt
        const { data: existingAttempts } = await supabase
          .from('settlement_attempts')
          .select('attempt_number')
          .eq('match_id', lobby.match_id)
          .order('attempt_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        const attemptNumber = (existingAttempts?.attempt_number || 0) + 1;

        const { error: attemptInsertError } = await supabase
          .from('settlement_attempts')
          .insert({
            match_id: lobby.match_id,
            lobby_id: lobby.id,
            attempt_number: attemptNumber,
            status: 'pending',
          });

        if (attemptInsertError) {
          console.error(`Failed to record attempt for match ${lobby.match_id}:`, attemptInsertError);
        }

        // Attempt settlement
        const { data: settlementResult, error: settlementError } = await supabase.rpc(
          'settle_match_payouts',
          {
            p_match_id: lobby.match_id,
            p_lobby_id: lobby.id,
          }
        );

        // Release lock
        await supabase.rpc('release_settlement_lock', {
          p_match_id: lobby.match_id,
        });

        if (settlementError || !settlementResult || settlementResult.length === 0 || !settlementResult[0].success) {
          const errorMsg = settlementError?.message || settlementResult?.[0]?.error_message || 'Unknown error';
          console.error(`Settlement failed for match ${lobby.match_id}:`, errorMsg);

          // Update attempt record
          await supabase
            .from('settlement_attempts')
            .update({
              status: 'failed',
              error_message: errorMsg,
              completed_at: new Date().toISOString(),
              next_retry_at: new Date(Date.now() + (attemptNumber * 60000)).toISOString(), // Exponential backoff
            })
            .eq('match_id', lobby.match_id)
            .eq('attempt_number', attemptNumber);

          // Mark lobby as settlement_failed if too many attempts
          if (attemptNumber >= 5) {
            await supabase
              .from('lobbies')
              .update({ settlement_failed: true })
              .eq('id', lobby.id);

            // Create critical alert
            await supabase.rpc('create_alert', {
              p_alert_type: 'settlement_failure',
              p_severity: 'critical',
              p_message: `Settlement failed after ${attemptNumber} attempts for match ${lobby.match_id}`,
              p_user_id: null,
              p_match_id: lobby.match_id,
              p_metadata: { lobby_id: lobby.id, error: errorMsg, attempts: attemptNumber },
            });
          }

          results.failed++;
          results.details.push({
            match_id: lobby.match_id,
            lobby_id: lobby.id,
            status: 'failed',
            error: errorMsg,
            attempt: attemptNumber,
          });
        } else {
          // Success
          console.log(`Settlement succeeded for match ${lobby.match_id}`);

          // Update attempt record
          await supabase
            .from('settlement_attempts')
            .update({
              status: 'success',
              completed_at: new Date().toISOString(),
            })
            .eq('match_id', lobby.match_id)
            .eq('attempt_number', attemptNumber);

          // Create audit event
          await supabase.from('audit_events').insert({
            event_type: 'auto_settlement_completed',
            match_id: lobby.match_id,
            lobby_id: lobby.id,
            metadata: {
              attempt: attemptNumber,
              payouts_created: settlementResult[0].payouts_created,
              total_pot_cents: settlementResult[0].total_pot_cents,
            },
          });

          results.succeeded++;
          results.details.push({
            match_id: lobby.match_id,
            lobby_id: lobby.id,
            status: 'success',
            payouts: settlementResult[0].payouts_created,
          });
        }
      } catch (err) {
        console.error(`Unexpected error settling match ${lobby.match_id}:`, err);
        results.failed++;
        results.details.push({
          match_id: lobby.match_id,
          lobby_id: lobby.id,
          status: 'error',
          error: err.message,
        });

        // Try to release lock
        try {
          await supabase.rpc('release_settlement_lock', {
            p_match_id: lobby.match_id,
          });
        } catch (unlockErr) {
          console.error(`Failed to release lock for match ${lobby.match_id}:`, unlockErr);
        }
      }
    }

    console.log('Auto-settlement complete:', results);

    return new Response(
      JSON.stringify({
        message: 'Auto-settlement job completed',
        ...results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical error in auto-settlement job:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});