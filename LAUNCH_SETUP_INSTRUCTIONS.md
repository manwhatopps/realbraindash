# Launch Setup Instructions

## Automated Setup Complete

The following items have been automatically configured:

- ✅ `admin_locks` table created
- ✅ Platform controls set to SAFE mode (cash disabled, lobbies disabled)
- ✅ Platform limits set to conservative beta values:
  - Max stake per match: $50
  - Max stake per day: $200
  - Max beta users: 50
  - Min account age: 24 hours
- ✅ Secure keys generated for environment variables

---

## Required Manual Setup Steps

### 1. Configure Supabase Edge Function Environment Variables

Go to your Supabase Dashboard → Edge Functions → Settings and add these secrets:

```bash
SERVICE_KEY=xppL93cmQDlrPabhEwR/rbgTaYCLb8jnS0M0R7Kh7oY=
CRON_KEY=pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA=
OPENAI_API_KEY=<your-openai-api-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<from-stripe-webhook-settings>
```

### 2. Create Your Admin User

First, sign up for an account on your app. Then run this SQL in Supabase SQL Editor:

```sql
-- Replace <your-user-id> with your actual user ID from auth.users
INSERT INTO admin_users (user_id, role, permissions)
VALUES (
  '<your-user-id>',
  'admin',
  '["manage_questions", "manage_users", "manage_platform", "view_analytics"]'::jsonb
);
```

To find your user ID:
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

### 3. Bootstrap Question Database

Once you have an admin user, run this curl command (replace `YOUR_ADMIN_TOKEN` with your JWT token from the browser):

```bash
curl -X POST "https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/admin-question-tools?action=bootstrap" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

This will generate initial questions for all categories.

### 4. Setup Payment Provider (Stripe)

#### A. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/payment-webhook?provider=stripe`
3. Select these events:
   - `payment_intent.succeeded`
   - `payout.paid`
   - `payout.failed`
4. Copy the webhook signing secret and add it to your edge function secrets as `STRIPE_WEBHOOK_SECRET`

#### B. Insert Stripe Provider Config

```sql
INSERT INTO payment_providers (provider_name, provider_type, is_enabled, config)
VALUES (
  'stripe',
  'both',
  true,
  '{"mode": "live"}'::jsonb
);
```

#### C. Test Webhook (Optional)

```bash
stripe listen --forward-to https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/payment-webhook?provider=stripe
```

### 5. Setup Automated Cron Jobs

Run this SQL in Supabase SQL Editor to schedule automated jobs:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Auto-Settlement (every 5 minutes)
SELECT cron.schedule(
  'auto-settlement-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/job-auto-settlement',
    headers := jsonb_build_object(
      'X-Cron-Secret', 'pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA=',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Job 2: Question Refill (daily at 2 AM UTC)
SELECT cron.schedule(
  'question-refill-job',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/admin-question-tools?action=refill_cron',
    headers := jsonb_build_object(
      'X-Cron-Key', 'pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA=',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify cron jobs are scheduled
SELECT * FROM cron.job ORDER BY jobid;
```

### 6. Publish Legal Documents

Create the required legal documents and insert them into the database:

```sql
-- Terms of Service
INSERT INTO legal_documents (
  document_type,
  version,
  content,
  content_hash,
  is_current,
  requires_acceptance
) VALUES (
  'terms_of_service',
  'v1.0',
  '[Your full Terms of Service text]',
  sha256('[Your full Terms of Service text]'),
  true,
  true
);

-- Skill Contest Disclosure
INSERT INTO legal_documents (
  document_type,
  version,
  content,
  content_hash,
  is_current,
  requires_acceptance
) VALUES (
  'skill_contest_disclosure',
  'v1.0',
  'This is a skill-based competition. Your performance depends on knowledge and speed, not chance.',
  sha256('This is a skill-based competition. Your performance depends on knowledge and speed, not chance.'),
  true,
  true
);

-- Risk Disclosure
INSERT INTO legal_documents (
  document_type,
  version,
  content,
  content_hash,
  is_current,
  requires_acceptance
) VALUES (
  'risk_disclosure',
  'v1.0',
  'You may lose your entry fee if you do not perform well. Only participate with money you can afford to lose.',
  sha256('You may lose your entry fee if you do not perform well. Only participate with money you can afford to lose.'),
  true,
  true
);
```

### 7. Run Security Tests

```bash
cd tests

# Setup test fixtures
node setup-test-fixtures.js

# Get test tokens
node get-tokens.js

# Run negative security tests
node negative-security-tests-executable.js
```

Expected: All tests should PASS (meaning attacks FAIL safely).

### 8. Run Final Launch Verification

```bash
node tests/final-launch-verification.js
```

Expected output: `✅ LAUNCH READINESS: APPROVED`

---

## Launching to Production

### When Ready to Go Live

Execute this SQL to enable cash matches:

```sql
-- Enable cash mode and new lobbies
UPDATE platform_controls
SET
  control_value = true,
  last_modified_at = NOW()
WHERE control_name IN ('cash_mode_enabled', 'new_lobbies_enabled');

-- Verify
SELECT control_name, control_value FROM platform_controls;
```

### Emergency Kill Switch

If you need to immediately disable cash features:

```sql
-- Disable cash mode (EMERGENCY)
UPDATE platform_controls
SET
  control_value = false,
  last_modified_at = NOW()
WHERE control_name IN ('cash_mode_enabled', 'new_lobbies_enabled');
```

---

## Current Configuration Status

### Platform Controls
- ❌ `cash_mode_enabled`: **FALSE** (disabled for safety)
- ❌ `new_lobbies_enabled`: **FALSE** (disabled for safety)
- ✅ `kyc_verification_enabled`: TRUE
- ✅ `new_signups_enabled`: TRUE
- ✅ `settlement_enabled`: TRUE
- ✅ `withdrawals_enabled`: TRUE

### Platform Limits (Beta)
- Max stake per match: **$50** (5,000 cents)
- Max stake per day: **$200** (20,000 cents)
- Max withdrawal per day: **$1,000** (100,000 cents)
- Max withdrawal per week: **$5,000** (500,000 cents)
- Max concurrent matches: **3**
- Max beta users: **50**
- Min account age: **24 hours**

### Database Status
- ✅ All security tables created
- ✅ RLS enabled on all tables
- ✅ Admin locks table created
- ⏳ Questions database: **EMPTY** (needs bootstrap)
- ⏳ Admin users: **0** (needs setup)

---

## Monitoring & Operations

### Check System Health

```sql
-- Check active matches
SELECT COUNT(*) FROM lobbies WHERE state IN ('in_progress', 'ready_to_start');

-- Check recent settlements
SELECT COUNT(*) FROM lobbies WHERE settled_at > NOW() - INTERVAL '1 hour';

-- Check wallet balances
SELECT COUNT(*) FROM wallet_balance WHERE available_cents > 0;

-- Check for negative balances (should be 0)
SELECT COUNT(*) FROM wallet_balance WHERE available_cents < 0;

-- Check recent alerts
SELECT * FROM alert_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Manual Settlement Trigger

```bash
curl -X POST "https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/job-auto-settlement" \
  -H "X-Cron-Secret: pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA=" \
  -H "Content-Type: application/json"
```

### Freeze a User

```sql
INSERT INTO account_freezes (
  user_id,
  freeze_type,
  reason,
  frozen_by
) VALUES (
  '<user-id>',
  'hard',
  'Suspicious activity detected',
  '<your-admin-user-id>'
);
```

---

## Remaining Blockers Before Production Launch

### CRITICAL (Cannot launch without)
1. ❌ Legal documents - Need attorney review
2. ❌ Payment processor approval - Stripe account must be verified
3. ❌ Admin user creation - Need at least one admin
4. ❌ Question database bootstrap - Need initial questions

### HIGH PRIORITY (Recommended before launch)
5. ⏳ External penetration test
6. ⏳ Liability insurance
7. ⏳ State gaming licenses (jurisdiction dependent)

---

## Support Contacts

- **Engineering Issues**: [Your engineering contact]
- **Compliance Issues**: [Your compliance officer]
- **Legal Issues**: [Your gaming attorney]
- **Payment Issues**: [Stripe support or your payment contact]

---

**Document Created**: 2025-12-26
**Configuration Version**: Beta v1.0
**Supabase Project**: dguhvsjrqnpeonfhotty
