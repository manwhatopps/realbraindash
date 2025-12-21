# Admin Dashboard & Tools Guide

## Overview

This guide provides comprehensive instructions for platform administrators to manage BrainDash Royale's production environment.

**Access Level Required:** Admin role in `admin_users` table

---

## Admin Access Setup

### Grant Admin Access

```sql
-- Grant admin access to a user
INSERT INTO admin_users (user_id, role, permissions, granted_by)
VALUES (
  'user-uuid-here',
  'admin', -- Options: admin, support, compliance, finance
  '["freeze_accounts", "toggle_kill_switches", "adjust_balances", "view_all_data"]'::jsonb,
  'granting-admin-uuid'
);
```

### Verify Admin Access

```sql
-- Check if user has admin access
SELECT * FROM admin_users
WHERE user_id = 'your-uuid'
  AND revoked_at IS NULL;
```

### Revoke Admin Access

```sql
-- Revoke admin access
UPDATE admin_users
SET revoked_at = now()
WHERE user_id = 'user-uuid';
```

---

## Kill Switch Management

### View All Kill Switches

```bash
curl https://[project].supabase.co/rest/v1/platform_controls \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

Or via SQL:
```sql
SELECT
  control_name,
  control_value,
  description,
  last_modified_at,
  (SELECT email FROM auth.users WHERE id = last_modified_by) as modified_by
FROM platform_controls
ORDER BY control_name;
```

### Toggle Kill Switches

#### Disable All Cash Features (Emergency)

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "toggle_kill_switch",
    "reason": "EMERGENCY: Security incident detected",
    "metadata": {
      "control_name": "cash_mode_enabled",
      "control_value": false
    }
  }'
```

#### Disable Withdrawals Only

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": application/json" \
  -d '{
    "action": "toggle_kill_switch",
    "reason": "Fraud investigation in progress",
    "metadata": {
      "control_name": "withdrawals_enabled",
      "control_value": false
    }
  }'
```

#### Disable New Lobbies

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "toggle_kill_switch",
    "reason": "Scheduled maintenance",
    "metadata": {
      "control_name": "new_lobbies_enabled",
      "control_value": false
    }
  }'
```

#### Re-enable Features

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "toggle_kill_switch",
    "reason": "Incident resolved - restoring service",
    "metadata": {
      "control_name": "cash_mode_enabled",
      "control_value": true
    }
  }'
```

---

## Account Management

### View User Account Status

```sql
-- Get complete user profile
SELECT
  u.id,
  u.email,
  ue.kyc_tier,
  ue.kyc_status,
  ue.withdrawals_locked,
  wb.available_cents / 100.0 as available_usd,
  wb.locked_cents / 100.0 as locked_usd,
  (SELECT COUNT(*) FROM match_players WHERE user_id = u.id) as total_matches,
  (SELECT freeze_type FROM account_freezes WHERE user_id = u.id AND unfrozen_at IS NULL LIMIT 1) as frozen
FROM auth.users u
LEFT JOIN user_eligibility ue ON ue.user_id = u.id
LEFT JOIN wallet_balance wb ON wb.user_id = u.id
WHERE u.email = 'user@example.com';
```

### Freeze Account

#### Soft Freeze (Cash Disabled, Freeplay Allowed)

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "freeze_account",
    "targetUserId": "user-uuid-here",
    "reason": "Suspected collusion - under investigation. Ticket #12345",
    "metadata": {
      "freeze_type": "soft"
    }
  }'
```

#### Hard Freeze (All Actions Blocked)

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "freeze_account",
    "targetUserId": "user-uuid-here",
    "reason": "Confirmed fraud - permanent ban. Report filed with authorities.",
    "metadata": {
      "freeze_type": "hard"
    }
  }'
```

#### Withdrawal-Only Freeze

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "freeze_account",
    "targetUserId": "user-uuid-here",
    "reason": "AML review required - high volume activity",
    "metadata": {
      "freeze_type": "withdrawal_only"
    }
  }'
```

### Unfreeze Account

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "unfreeze_account",
    "targetUserId": "user-uuid-here",
    "reason": "Investigation complete - no fraud detected. User verified legitimate."
  }'
```

### View Frozen Accounts

```sql
-- List all currently frozen accounts
SELECT
  af.user_id,
  u.email,
  af.freeze_type,
  af.reason,
  af.frozen_at,
  (SELECT score FROM fraud_scores WHERE user_id = af.user_id ORDER BY computed_at DESC LIMIT 1) as latest_fraud_score
FROM account_freezes af
JOIN auth.users u ON u.id = af.user_id
WHERE af.unfrozen_at IS NULL
ORDER BY af.frozen_at DESC;
```

---

## Financial Operations

### View User Wallet

```sql
-- Get user wallet details
SELECT
  user_id,
  available_cents / 100.0 as available_usd,
  locked_cents / 100.0 as locked_usd,
  lifetime_deposited_cents / 100.0 as lifetime_deposited_usd,
  lifetime_withdrawn_cents / 100.0 as lifetime_withdrawn_usd
FROM wallet_balance
WHERE user_id = 'user-uuid';

-- Get recent ledger entries
SELECT
  transaction_type,
  amount_cents / 100.0 as amount_usd,
  balance_after_cents / 100.0 as balance_after_usd,
  description,
  created_at
FROM wallet_ledger
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 20;
```

### Adjust Balance (Add or Deduct Funds)

#### Add Bonus/Compensation

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "adjust_balance",
    "targetUserId": "user-uuid-here",
    "amountCents": 5000,
    "reason": "Compensation for 2-hour platform outage. Support ticket #67890"
  }'
```

#### Deduct Fraudulent Winnings

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "adjust_balance",
    "targetUserId": "user-uuid-here",
    "amountCents": -25000,
    "reason": "Reverting fraudulent payout from match abc-123. Incident #INC-001"
  }'
```

### Refund Match

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "force_refund",
    "targetLobbyId": "lobby-uuid-here",
    "reason": "System error during match - refunding all players"
  }'
```

This will:
1. Unlock all escrows for the lobby
2. Return funds to players' wallets
3. Update lobby state to `cancelled_refunded`
4. Create ledger entries for audit trail

### Cancel Match

```bash
curl -X POST https://[project].supabase.co/functions/v1/admin-incident-response \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "action": "cancel_match",
    "targetMatchId": "match-uuid-here",
    "reason": "Match cancelled due to cheating detection"
  }'
```

---

## Fraud Monitoring

### View High-Risk Users

```sql
-- Users with high fraud scores
SELECT
  fs.user_id,
  u.email,
  fs.score,
  fs.score_type,
  fs.signals,
  fs.computed_at,
  (SELECT freeze_type FROM account_freezes WHERE user_id = fs.user_id AND unfrozen_at IS NULL LIMIT 1) as frozen
FROM fraud_scores fs
JOIN auth.users u ON u.id = fs.user_id
WHERE fs.score >= 70
  AND fs.computed_at > now() - interval '7 days'
ORDER BY fs.score DESC, fs.computed_at DESC;
```

### Manually Flag User for Review

```sql
-- Create manual fraud score
INSERT INTO fraud_scores (user_id, score_type, score, signals)
VALUES (
  'user-uuid',
  'manual',
  80,
  '{"flagged_by": "admin_email", "reason": "Multiple accounts from same IP", "ticket": "FRAUD-456"}'::jsonb
);
```

### View Fraud Alerts

```sql
-- Recent fraud alerts
SELECT
  alert_type,
  severity,
  message,
  user_id,
  metadata,
  created_at,
  acknowledged_at
FROM alert_events
WHERE alert_type IN ('fraud_threshold', 'withdrawal_anomaly')
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### Acknowledge Alert

```sql
UPDATE alert_events
SET
  acknowledged_at = now(),
  acknowledged_by = 'admin-user-id'
WHERE id = 'alert-uuid';
```

---

## Reconciliation

### Run Manual Reconciliation

```bash
curl -X POST https://[project].supabase.co/functions/v1/job-reconciliation \
  -H "X-Cron-Secret: $CRON_SECRET" \
  -H "Content-Type": "application/json" \
  -d '{
    "runType": "full"
  }'
```

Run types:
- `full` - All checks
- `wallet_balance` - Balance reconciliation only
- `escrow` - Orphaned escrow check only
- `payout` - Settlement/payout consistency only

### View Reconciliation Results

```sql
-- Recent reconciliation runs
SELECT
  run_type,
  records_checked,
  issues_found,
  status,
  started_at,
  completed_at,
  error_message
FROM reconciliation_runs
ORDER BY started_at DESC
LIMIT 10;

-- Unresolved issues
SELECT
  ri.issue_type,
  ri.severity,
  ri.user_id,
  u.email,
  ri.expected_value / 100.0 as expected_usd,
  ri.actual_value / 100.0 as actual_usd,
  ri.details,
  ri.created_at
FROM reconciliation_issues ri
LEFT JOIN auth.users u ON u.id = ri.user_id
WHERE ri.resolved_at IS NULL
ORDER BY
  CASE ri.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  ri.created_at DESC;
```

### Resolve Reconciliation Issue

```sql
UPDATE reconciliation_issues
SET
  resolved_at = now(),
  resolved_by = 'admin-user-id',
  resolution_notes = 'Balance adjusted manually. See incident action #123'
WHERE id = 'issue-uuid';
```

---

## Monitoring & Alerts

### View Critical Alerts

```sql
-- Unacknowledged critical alerts
SELECT
  alert_type,
  severity,
  message,
  user_id,
  match_id,
  metadata,
  created_at
FROM alert_events
WHERE severity IN ('critical', 'error')
  AND acknowledged_at IS NULL
ORDER BY created_at DESC;
```

### Platform Health Dashboard (SQL)

```sql
-- Platform health metrics
SELECT
  (SELECT control_value FROM platform_controls WHERE control_name = 'cash_mode_enabled') as cash_enabled,
  (SELECT control_value FROM platform_controls WHERE control_name = 'withdrawals_enabled') as withdrawals_enabled,
  (SELECT COUNT(*) FROM lobbies WHERE state = 'in_progress') as active_matches,
  (SELECT COUNT(*) FROM account_freezes WHERE unfrozen_at IS NULL) as frozen_accounts,
  (SELECT COUNT(*) FROM alert_events WHERE severity = 'critical' AND acknowledged_at IS NULL) as critical_alerts,
  (SELECT COUNT(*) FROM fraud_scores WHERE score >= 80 AND computed_at > now() - interval '24 hours') as high_risk_users,
  (SELECT SUM(available_cents + locked_cents) / 100.0 FROM wallet_balance) as total_platform_balance_usd;
```

---

## Incident Response Actions

### View Recent Admin Actions

```sql
-- Audit trail of admin actions
SELECT
  ia.action_type,
  ia.target_user_id,
  tu.email as target_email,
  ia.reason,
  ia.amount_cents / 100.0 as amount_usd,
  ia.performed_by,
  pu.email as performed_by_email,
  ia.performed_at
FROM incident_actions ia
LEFT JOIN auth.users tu ON tu.id = ia.target_user_id
JOIN auth.users pu ON pu.id = ia.performed_by
ORDER BY ia.performed_at DESC
LIMIT 50;
```

### Export Audit Trail for Regulators

```sql
-- Export complete audit trail for a user
SELECT
  ae.event_type,
  ae.user_id,
  u.email,
  ae.lobby_id,
  ae.match_id,
  ae.amount_cents / 100.0 as amount_usd,
  ae.metadata,
  ae.created_at,
  ae.ip_hash
FROM audit_events ae
JOIN auth.users u ON u.id = ae.user_id
WHERE ae.user_id = 'user-uuid'
  AND ae.created_at BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY ae.created_at ASC;
```

Export to CSV:
```bash
psql $DATABASE_URL -c "COPY (
  SELECT * FROM audit_events WHERE user_id = 'user-uuid'
) TO STDOUT WITH CSV HEADER" > audit_export.csv
```

---

## User Support

### Search for User

```sql
-- By email
SELECT
  u.id,
  u.email,
  u.created_at,
  ue.kyc_tier,
  wb.available_cents / 100.0 as balance_usd
FROM auth.users u
LEFT JOIN user_eligibility ue ON ue.user_id = u.id
LEFT JOIN wallet_balance wb ON wb.user_id = u.id
WHERE u.email ILIKE '%search@%';

-- By wallet activity
SELECT DISTINCT
  wl.user_id,
  u.email,
  SUM(CASE WHEN wl.transaction_type = 'deposit' THEN wl.amount_cents ELSE 0 END) / 100.0 as total_deposits_usd
FROM wallet_ledger wl
JOIN auth.users u ON u.id = wl.user_id
GROUP BY wl.user_id, u.email
HAVING SUM(CASE WHEN wl.transaction_type = 'deposit' THEN wl.amount_cents ELSE 0 END) > 100000
ORDER BY total_deposits_usd DESC;
```

### View User Match History

```sql
-- Recent matches
SELECT
  mp.match_id,
  l.category,
  l.stake_cents / 100.0 as stake_usd,
  mp.score,
  mp.final_rank,
  mp.payout_cents / 100.0 as payout_usd,
  mp.joined_at,
  l.state
FROM match_players mp
JOIN lobbies l ON l.match_id = mp.match_id
WHERE mp.user_id = 'user-uuid'
ORDER BY mp.joined_at DESC
LIMIT 20;
```

---

## Scheduled Jobs

### Setup Reconciliation Cron Job

Using Supabase Cron (pg_cron):

```sql
-- Run reconciliation every 6 hours
SELECT cron.schedule(
  'reconciliation-job',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/job-reconciliation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', '[CRON_SECRET]'
    ),
    body := jsonb_build_object('runType', 'full')
  );
  $$
);
```

### View Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

### Disable/Enable Job

```sql
-- Disable
SELECT cron.unschedule('reconciliation-job');

-- Re-enable
SELECT cron.schedule(...); -- Run schedule command again
```

---

## Reports

### Daily Revenue Report

```sql
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) FILTER (WHERE transaction_type = 'match_entry') as matches_played,
  SUM(amount_cents) FILTER (WHERE transaction_type = 'deposit') / 100.0 as deposits_usd,
  SUM(ABS(amount_cents)) FILTER (WHERE transaction_type = 'withdrawal') / 100.0 as withdrawals_usd,
  SUM(amount_cents) FILTER (WHERE transaction_type = 'rake') / 100.0 as rake_revenue_usd
FROM wallet_ledger
WHERE created_at > now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### User Lifetime Value

```sql
SELECT
  wl.user_id,
  u.email,
  u.created_at as signup_date,
  SUM(CASE WHEN transaction_type = 'deposit' THEN amount_cents ELSE 0 END) / 100.0 as ltv_deposits_usd,
  SUM(CASE WHEN transaction_type = 'withdrawal' THEN ABS(amount_cents) ELSE 0 END) / 100.0 as ltv_withdrawals_usd,
  SUM(CASE WHEN transaction_type = 'rake' THEN amount_cents ELSE 0 END) / 100.0 as ltv_rake_usd,
  COUNT(DISTINCT match_id) FILTER (WHERE transaction_type = 'match_entry') as total_matches
FROM wallet_ledger wl
JOIN auth.users u ON u.id = wl.user_id
GROUP BY wl.user_id, u.email, u.created_at
ORDER BY ltv_rake_usd DESC
LIMIT 50;
```

---

## Security Best Practices

### Admin Token Security

1. **Never share admin tokens**
2. **Rotate tokens every 90 days**
3. **Use environment variables** - Never hardcode
4. **Audit admin actions** - Review `incident_actions` table regularly
5. **Revoke access** when admin leaves team

### Incident Response Checklist

When responding to incidents:

1. ✅ Document reason clearly
2. ✅ Check for related accounts (same IP, device)
3. ✅ Review audit trail
4. ✅ Create support ticket
5. ✅ Notify user (if appropriate)
6. ✅ Create alert for similar future incidents

---

## Troubleshooting

### Issue: Kill Switch Not Taking Effect

**Check:**
```sql
SELECT * FROM platform_controls WHERE control_name = 'cash_mode_enabled';
```

**Force refresh:** Restart edge functions or wait for cache expiry

### Issue: User Can't Withdraw

**Check:**
1. Kill switch: `withdrawals_enabled`
2. Account freeze: `SELECT * FROM account_freezes WHERE user_id = '...' AND unfrozen_at IS NULL;`
3. KYC status: `SELECT * FROM user_eligibility WHERE user_id = '...';`
4. Fraud score: `SELECT * FROM fraud_scores WHERE user_id = '...' ORDER BY computed_at DESC LIMIT 1;`

### Issue: Balance Mismatch

**Reconcile:**
```sql
SELECT * FROM reconcile_wallet_balance('user-uuid');
```

If mismatch found, investigate ledger:
```sql
SELECT * FROM wallet_ledger WHERE user_id = 'user-uuid' ORDER BY created_at DESC;
```

---

**Last Updated:** 2024-12-21
**Version:** 1.0
**Support:** admin@braindash.example.com
