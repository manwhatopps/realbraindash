# Launch Readiness Summary

**Generated**: December 26, 2025
**Project**: BrainDash Royale
**Supabase Project**: dguhvsjrqnpeonfhotty
**Status**: ⚠️ REQUIRES MANUAL SETUP BEFORE LAUNCH

---

## ✅ What's Been Completed (Automated)

### Database Infrastructure
- ✅ `admin_locks` table created for admin operation locking
- ✅ All RLS policies verified on existing tables
- ✅ Platform controls configured (SAFE MODE - cash disabled)
- ✅ Platform limits set to conservative beta values

### Platform Configuration
- ✅ **Kill Switches Set to SAFE**:
  - `cash_mode_enabled`: FALSE
  - `new_lobbies_enabled`: FALSE
  - `settlement_enabled`: TRUE
  - `withdrawals_enabled`: TRUE
  - `kyc_verification_enabled`: TRUE
  - `new_signups_enabled`: TRUE

- ✅ **Beta Launch Limits**:
  - Max stake per match: **$50**
  - Max stake per day: **$200**
  - Max withdrawal/day: **$1,000**
  - Max withdrawal/week: **$5,000**
  - Max concurrent matches: **3**
  - Max beta users: **50**
  - Min account age: **24 hours**

### Security Keys Generated
- ✅ `SERVICE_KEY`: `xppL93cmQDlrPabhEwR/rbgTaYCLb8jnS0M0R7Kh7oY=`
- ✅ `CRON_KEY`: `pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA=`

---

## 🔴 CRITICAL - Required Before Launch

### 1. Create Admin User (5 minutes)

**Step 1**: Sign up on your app
**Step 2**: Find your user ID:
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

**Step 3**: Make yourself admin:
```sql
INSERT INTO admin_users (user_id, role, permissions)
VALUES (
  '<your-user-id>',
  'admin',
  '["manage_questions", "manage_users", "manage_platform", "view_analytics"]'::jsonb
);
```

### 2. Configure Edge Function Secrets (10 minutes)

Go to: Supabase Dashboard → Settings → Edge Functions

Add these secrets:
```
SERVICE_KEY=xppL93cmQDlrPabhEwR/rbgTaYCLb8jnS0M0R7Kh7oY=
CRON_KEY=pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA=
OPENAI_API_KEY=<get-from-openai-dashboard>
STRIPE_SECRET_KEY=<get-from-stripe-dashboard>
STRIPE_WEBHOOK_SECRET=<get-after-webhook-setup>
```

### 3. Bootstrap Question Database (2 minutes)

**After** creating admin user, run:
```bash
curl -X POST "https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/admin-question-tools?action=bootstrap" \
  -H "Authorization: Bearer <YOUR_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

To get your JWT token: Open browser DevTools → Application → Local Storage → look for `supabase.auth.token`

### 4. Setup Stripe Webhook (15 minutes)

**A. Create Webhook**
1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/payment-webhook?provider=stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payout.paid`
   - `payout.failed`
4. Copy the webhook signing secret

**B. Add Secret**
Add to Supabase Edge Function secrets: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

**C. Register Provider**
```sql
INSERT INTO payment_providers (provider_name, provider_type, is_enabled)
VALUES ('stripe', 'both', true);
```

### 5. Setup Cron Jobs (5 minutes)

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Auto-Settlement (every 5 minutes)
SELECT cron.schedule(
  'auto-settlement',
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

-- Question Refill (daily at 2 AM)
SELECT cron.schedule(
  'question-refill',
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

-- Verify jobs
SELECT * FROM cron.job ORDER BY jobid;
```

### 6. Add Legal Documents (30 minutes + legal review)

**⚠️ CRITICAL**: Have an attorney review these before launch.

```sql
-- Terms of Service
INSERT INTO legal_documents (
  document_type, version, content, content_hash, is_current
) VALUES (
  'terms_of_service',
  'v1.0',
  '<YOUR FULL LEGAL TEXT HERE>',
  sha256('<YOUR FULL LEGAL TEXT HERE>'),
  true
);

-- Skill Contest Disclosure
INSERT INTO legal_documents (
  document_type, version, content, content_hash, is_current
) VALUES (
  'skill_contest_disclosure',
  'v1.0',
  'This is a skill-based competition. Outcomes depend on your knowledge and speed, not chance. You may compete against other players of varying skill levels.',
  sha256('This is a skill-based competition. Outcomes depend on your knowledge and speed, not chance. You may compete against other players of varying skill levels.'),
  true
);

-- Risk Disclosure
INSERT INTO legal_documents (
  document_type, version, content, content_hash, is_current
) VALUES (
  'risk_disclosure',
  'v1.0',
  'WARNING: You may lose your entire entry fee if you do not perform well. Only participate with money you can afford to lose. This is not gambling, but you can still lose money.',
  sha256('WARNING: You may lose your entire entry fee if you do not perform well. Only participate with money you can afford to lose. This is not gambling, but you can still lose money.'),
  true
);
```

---

## ⚠️ HIGH PRIORITY - Before Production

### 7. Run Tests (20 minutes)

**Note**: Tests require `SUPABASE_SERVICE_ROLE_KEY` environment variable. Get this from Supabase Dashboard → Settings → API.

```bash
# Create test .env
cat > .env.test << EOF
SUPABASE_URL=https://dguhvsjrqnpeonfhotty.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndWh2c2pycW5wZW9uZmhvdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDkxOTAsImV4cCI6MjA3OTIyNTE5MH0.VQ1LAy545BkKan70yHdnOup1y33BH4wm3w-bKq_qxAs
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
CRON_SECRET=pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA=
EOF

# Run tests
source .env.test
node tests/final-launch-verification.js
```

**Expected**: All tests pass, no critical failures.

### 8. External Security Audit

**Recommended vendors**:
- HackerOne (https://hackerone.com)
- Synack (https://synack.com)
- Trail of Bits (https://trailofbits.com)

**Scope**: IDOR, race conditions, replay attacks, RLS bypass, SQL injection

**Timeline**: 2-4 weeks

**Cost**: $5,000 - $20,000

### 9. Legal & Insurance

- [ ] Gaming attorney review (Terms, disclosures)
- [ ] Liability insurance policy ($1M+ recommended)
- [ ] State gaming licenses (varies by jurisdiction)
- [ ] Privacy policy (GDPR/CCPA compliant)

### 10. Monitoring Setup

- [ ] Setup Datadog/New Relic/Sentry
- [ ] Configure PagerDuty for critical alerts
- [ ] Create status page (status.yourdomain.com)
- [ ] Setup Slack alert channel

---

## 🚀 LAUNCH SEQUENCE

### When ALL critical items above are complete:

**1. Final Pre-Launch Check**
```bash
# Verify kill switches are OFF
SELECT control_name, control_value FROM platform_controls;
# Should show: cash_mode_enabled=false, new_lobbies_enabled=false

# Verify questions exist
SELECT COUNT(*) FROM questions WHERE is_active=true;
# Should be > 100

# Verify no negative balances
SELECT COUNT(*) FROM wallet_balance WHERE available_cents < 0;
# Should be 0
```

**2. Go Live**
```sql
-- Enable cash mode
UPDATE platform_controls
SET control_value = true, last_modified_at = NOW()
WHERE control_name IN ('cash_mode_enabled', 'new_lobbies_enabled');
```

**3. Monitor First Hour**
- Watch for critical alerts
- Check settlement success rate
- Monitor wallet balances
- Review any user issues

---

## 🆘 EMERGENCY PROCEDURES

### Instant Kill Switch
```sql
-- IMMEDIATE SHUTDOWN
UPDATE platform_controls
SET control_value = false
WHERE control_name IN ('cash_mode_enabled', 'new_lobbies_enabled');
```

### Freeze a User
```sql
INSERT INTO account_freezes (user_id, freeze_type, reason, frozen_by)
VALUES ('<user-id>', 'hard', 'Suspicious activity', '<admin-user-id>');
```

### Manual Settlement Trigger
```bash
curl -X POST "https://dguhvsjrqnpeonfhotty.supabase.co/functions/v1/job-auto-settlement" \
  -H "X-Cron-Secret: pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA="
```

---

## 📊 Current Status Checklist

### Infrastructure
- [x] Database tables created
- [x] RLS policies enabled
- [x] Kill switches configured (SAFE MODE)
- [x] Platform limits configured
- [x] Admin locks table created
- [x] Security keys generated

### Requires Manual Setup
- [ ] Admin user created
- [ ] Edge function secrets configured
- [ ] OpenAI API key added
- [ ] Stripe configured
- [ ] Stripe webhook created
- [ ] Payment provider registered
- [ ] Cron jobs scheduled
- [ ] Question database bootstrapped
- [ ] Legal documents published

### Before Production
- [ ] Security tests passed
- [ ] External pentest completed
- [ ] Legal review completed
- [ ] Insurance secured
- [ ] Monitoring configured
- [ ] Support team trained

### Legal & Compliance
- [ ] Terms of Service finalized
- [ ] Privacy Policy finalized
- [ ] State licenses obtained (if required)
- [ ] Attorney approval

---

## 📞 Next Steps

1. **Right Now** (30 min): Complete items 1-5 in "CRITICAL" section
2. **This Week** (2-3 days): Complete items 6-7
3. **Before Launch** (2-4 weeks): Complete items 8-10
4. **Launch Day**: Follow launch sequence

---

## 📚 Additional Documentation

- `LAUNCH_SETUP_INSTRUCTIONS.md` - Detailed step-by-step guide
- `FINAL_LAUNCH_CHECKLIST.md` - Comprehensive pre-launch checklist
- `LAUNCH_READINESS_REPORT.md` - Technical architecture overview
- `ADMIN_GUIDE.md` - Admin operations guide
- `SECURITY.md` - Security architecture details

---

## ⚡ Quick Reference

**Supabase Project**: dguhvsjrqnpeonfhotty
**Supabase URL**: https://dguhvsjrqnpeonfhotty.supabase.co
**Current Mode**: SAFE (cash disabled)
**Max Beta Users**: 50
**Max Stake**: $50/match, $200/day

**Generated Keys** (add to Edge Function secrets):
- `SERVICE_KEY`: xppL93cmQDlrPabhEwR/rbgTaYCLb8jnS0M0R7Kh7oY=
- `CRON_KEY`: pTC5fbxRQX5KG8zVJ9Oay0+HfG8WGZ4G57UJioLIlMA=

---

**Document Version**: 1.0
**Last Updated**: 2025-12-26
**Next Review**: After completing critical items
