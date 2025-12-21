# Final Launch Checklist - BrainDash Royale

## Pre-Launch Verification

Complete this checklist before launching real-money gaming operations.

**Target Launch Date:** _____________
**Completed By:** _____________
**Approved By:** _____________

---

## ✅ PHASE 1: Core Security (MANDATORY)

### 1.1 Database Security

- [ ] All RLS policies enabled and tested
- [ ] No tables allow public access without RLS
- [ ] Service role key stored securely (env var only)
- [ ] Anon key properly restricted
- [ ] Unique constraints on all financial operations
- [ ] Indexes created for performance-critical queries

**Verification:**
```sql
-- Check tables without RLS
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
-- Should return EMPTY or only non-sensitive tables
```

### 1.2 Edge Functions

- [ ] All endpoints check authentication
- [ ] Idempotency keys required for money operations
- [ ] CORS headers properly configured
- [ ] Error messages don't leak sensitive data
- [ ] JWT verification enabled
- [ ] Rate limiting active

**Verification:**
```bash
# Test unauthenticated access (should fail)
curl -X POST https://[project].supabase.co/functions/v1/secure-lobby-join \
  -H "Content-Type: application/json" \
  -d '{"lobbyId":"test"}'
# Expected: 401 Unauthorized
```

### 1.3 Kill Switches

- [ ] All kill switches created in database
- [ ] Default values set correctly (enabled)
- [ ] All endpoints check relevant switches
- [ ] Admin-only modification enforced

**Verification:**
```sql
SELECT control_name, control_value, description
FROM platform_controls;
-- Should show: cash_mode_enabled, new_lobbies_enabled, settlement_enabled, withdrawals_enabled
```

---

## ✅ PHASE 2: Financial Controls (CRITICAL)

### 2.1 Wallet System

- [ ] Atomic balance updates with row locks
- [ ] All money operations logged to wallet_ledger
- [ ] Negative balance constraints enforced
- [ ] Escrow system functional
- [ ] Settlement creates payouts correctly
- [ ] Ledger reconciles with balances

**Verification:**
```sql
-- Test reconciliation for all users
SELECT
  user_id,
  expected_balance,
  actual_balance,
  is_valid
FROM reconcile_wallet_balance((SELECT user_id FROM wallet_balance LIMIT 1));
-- All should show is_valid = true
```

### 2.2 Escrow & Settlement

- [ ] Escrow locked on lobby join
- [ ] Escrow released on settlement or refund
- [ ] Settlement is idempotent (can't double-settle)
- [ ] Payouts match prize calculations
- [ ] Rake collected correctly
- [ ] Winners receive funds, losers lose escrow

**Verification:**
Run test match end-to-end and verify:
- Escrow status: `locked` → `released`
- Winner wallet increased
- Loser wallet decreased (escrow lost)
- Rake added to platform balance

### 2.3 Withdrawals

- [ ] Idempotency enforced
- [ ] KYC re-checked before withdrawal
- [ ] Fraud score validated
- [ ] Cooldown enforced (24h after last match)
- [ ] Rate limit enforced (1 per 24h)
- [ ] Balance check with lock
- [ ] Audit logging complete

**Verification:**
```bash
# Test withdrawal with invalid idempotency (reuse key)
# Expected: Same response returned (cached)

# Test rapid withdrawals
# Expected: 429 Rate Limit after 1st request
```

---

## ✅ PHASE 3: Fraud Detection (MANDATORY)

### 3.1 Fraud Scoring

- [ ] Velocity scoring implemented
- [ ] Pattern scoring implemented
- [ ] Auto-freeze at threshold (70+)
- [ ] Fraud scores logged
- [ ] Alerts created for high scores

**Verification:**
```sql
-- Create test high-velocity scenario
-- Verify auto-freeze function works
SELECT auto_freeze_high_fraud_accounts();
```

### 3.2 Account Freezing

- [ ] Freeze types implemented (soft, hard, withdrawal_only, cash_only)
- [ ] Frozen accounts blocked from actions
- [ ] Freeze reason logged
- [ ] Unfreeze capability functional
- [ ] Admin actions audited

**Verification:**
- Freeze test account
- Attempt to join lobby (should fail with 403)
- Unfreeze
- Verify can join again

### 3.3 Rate Limiting

- [ ] Rate limits enforced on lobby joins
- [ ] Rate limits enforced on withdrawals
- [ ] Rate limits enforced on answer submissions
- [ ] Limits stored in database
- [ ] Check expires after window

**Verification:**
```sql
SELECT * FROM rate_limits
WHERE user_id = 'test-user'
  AND window_end > now();
```

---

## ✅ PHASE 4: Reconciliation (CRITICAL)

### 4.1 Reconciliation Job

- [ ] Job deployed as edge function
- [ ] Cron schedule configured
- [ ] Checks all required scenarios:
  - [ ] Negative balances
  - [ ] Orphaned escrows
  - [ ] Balance mismatches
  - [ ] Settlements without payouts
- [ ] Auto-freeze on critical issues
- [ ] Alerts created

**Verification:**
```bash
# Run manual reconciliation
curl -X POST https://[project].supabase.co/functions/v1/job-reconciliation \
  -H "X-Cron-Secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"runType":"full"}'

# Check results
# Expected: 0 issues_found (or all resolved)
```

### 4.2 Reconciliation Monitoring

- [ ] Reconciliation runs logged
- [ ] Issues table populated
- [ ] Alerts surface to admin dashboard
- [ ] Resolution workflow functional

**Verification:**
```sql
SELECT * FROM reconciliation_runs ORDER BY started_at DESC LIMIT 5;
SELECT * FROM reconciliation_issues WHERE resolved_at IS NULL;
```

---

## ✅ PHASE 5: Compliance & Jurisdiction (MANDATORY)

### 5.1 KYC System

- [ ] Stripe Identity integrated
- [ ] Tier system enforced (unverified, tier1, tier2)
- [ ] Stake limits based on tier
- [ ] Withdrawal limits based on tier
- [ ] KYC re-checked before withdrawals

**Verification:**
- Create unverified user
- Attempt $100 cash match (should fail)
- Upgrade to tier1
- Attempt $100 cash match (should succeed)

### 5.2 Jurisdiction Rules

- [ ] Rules table populated (US states, international)
- [ ] Restricted regions blocked
- [ ] Checks enforced server-side
- [ ] Cannot be bypassed by client

**Verification:**
```sql
SELECT * FROM jurisdiction_rules
WHERE cash_matches_allowed = false;
-- Should include restricted US states
```

### 5.3 Terms & Disclosures

- [ ] Terms of Service finalized (legal review)
- [ ] Skill-based disclosure displayed
- [ ] Risk disclosure displayed ("you may lose your entry fee")
- [ ] Per-match acceptance recorded
- [ ] Acceptance logged to compliance_acceptances table

**Verification:**
```sql
SELECT * FROM compliance_acceptances
WHERE user_id = 'test-user'
ORDER BY accepted_at DESC LIMIT 5;
```

---

## ✅ PHASE 6: Monitoring & Alerts (MANDATORY)

### 6.1 Alert System

- [ ] Alert types defined
- [ ] Severity levels set
- [ ] Alerts stored in alert_events table
- [ ] Critical alerts trigger notifications
- [ ] Acknowledgment system functional

**Verification:**
```sql
-- Create test alert
SELECT create_alert(
  'rls_violation',
  'critical',
  'Test alert',
  NULL,
  NULL,
  '{}'::jsonb
);

-- Verify created
SELECT * FROM alert_events WHERE message = 'Test alert';
```

### 6.2 Monitoring Integration

- [ ] Monitoring config file created (monitoring-alerts.yml)
- [ ] Integration with Datadog/New Relic/etc. configured
- [ ] Dashboards created:
  - [ ] Platform health
  - [ ] Financial metrics
  - [ ] Fraud detection
  - [ ] Compliance overview
- [ ] PagerDuty/on-call integration active

### 6.3 Logging

- [ ] All financial operations logged to audit_events
- [ ] All admin actions logged to incident_actions
- [ ] Logs immutable (no DELETE policies)
- [ ] 7-year retention configured

---

## ✅ PHASE 7: Incident Response (MANDATORY)

### 7.1 Admin Tools

- [ ] Admin users table populated
- [ ] Admin roles assigned
- [ ] Admin endpoint functional
- [ ] Actions available:
  - [ ] Freeze/unfreeze account
  - [ ] Toggle kill switches
  - [ ] Force refund
  - [ ] Adjust balance
  - [ ] Cancel match
- [ ] All actions audited

**Verification:**
- Test freeze account via admin endpoint
- Verify logged in incident_actions
- Test unfreeze

### 7.2 Runbooks

- [ ] INCIDENT_RESPONSE.md complete
- [ ] RUNBOOK.md complete
- [ ] FRAUD_MODEL.md complete
- [ ] ADMIN_GUIDE.md complete
- [ ] Emergency contacts updated
- [ ] Team trained on procedures

---

## ✅ PHASE 8: Negative Security Tests (CRITICAL)

### 8.1 Test Suite

- [ ] Test fixtures created
- [ ] All IDOR tests passing (403/400 responses)
- [ ] Replay tests passing (idempotency works)
- [ ] Race condition tests passing (atomic operations)
- [ ] Client trust tests passing (server computes values)
- [ ] Frozen account tests passing (blocked)
- [ ] Kill switch tests passing (503 responses)
- [ ] Rate limit tests passing (429 responses)

**Verification:**
```bash
# Setup
node tests/setup-test-fixtures.js
node tests/get-tokens.js

# Run tests
node tests/negative-security-tests-executable.js

# Expected: All tests PASS (meaning attacks FAIL safely)
```

### 8.2 Penetration Testing

- [ ] External pentest scheduled
- [ ] Scope defined (IDOR, race, replay, injection, XSS, CSRF)
- [ ] Pentest report reviewed
- [ ] All critical findings fixed
- [ ] Re-test confirmed fixes

**Recommended Vendors:**
- HackerOne
- Synack
- Trail of Bits

---

## ✅ PHASE 9: Performance & Scalability

### 9.1 Load Testing

- [ ] Load test performed (1000 concurrent users)
- [ ] Response times acceptable (p95 < 2s)
- [ ] No database deadlocks
- [ ] No memory leaks
- [ ] No connection pool exhaustion

**Tool Recommendations:**
- k6
- Apache JMeter
- Locust

### 9.2 Database Optimization

- [ ] All queries indexed
- [ ] Slow queries optimized
- [ ] Connection pooling configured
- [ ] Read replicas (if needed)

**Verification:**
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC LIMIT 10;
```

---

## ✅ PHASE 10: Legal & Compliance

### 10.1 Legal Documents

- [ ] Terms of Service finalized
- [ ] Privacy Policy finalized (GDPR/CCPA compliant)
- [ ] Skill-based gaming classification confirmed
- [ ] State gaming licenses obtained (if required)
- [ ] Payment processor approved

### 10.2 Financial Setup

- [ ] Escrow account opened
- [ ] Liability insurance secured
- [ ] Chargeback handling process defined
- [ ] SAR filing process defined (AML)
- [ ] Accounting system integrated

### 10.3 Compliance Contacts

- [ ] Gaming attorney on retainer
- [ ] Compliance officer assigned
- [ ] Regulator contacts documented
- [ ] Law enforcement contact (for fraud reports)

---

## ✅ PHASE 11: Payment Processing

### 11.1 Deposits

- [ ] Payment processor integrated (Stripe/PayPal)
- [ ] Credit/debit cards accepted
- [ ] ACH transfers enabled (if applicable)
- [ ] Fraud detection active at processor level
- [ ] 3D Secure enabled (if applicable)

### 11.2 Withdrawals

- [ ] Withdrawal processor integrated
- [ ] Payout methods configured
- [ ] Processing times disclosed to users
- [ ] Fees disclosed
- [ ] Manual review workflow for high-value withdrawals

---

## ✅ PHASE 12: Disaster Recovery

### 12.1 Backups

- [ ] Daily automated backups configured
- [ ] Backup retention: 30 days minimum
- [ ] Backup restoration tested
- [ ] Backup stored off-site
- [ ] Point-in-time recovery available

**Verification:**
```bash
# Test restore from backup
pg_restore -d test_database backup.dump
```

### 12.2 Incident Response Plan

- [ ] Data breach response plan documented
- [ ] Notification timeline defined (72 hours)
- [ ] External contacts identified (legal, insurance, PR)
- [ ] Communication templates prepared

---

## ✅ PHASE 13: User Communication

### 13.1 Support

- [ ] Support ticketing system operational
- [ ] Support team trained
- [ ] FAQ created
- [ ] Dispute resolution process documented
- [ ] Response time SLAs defined

### 13.2 Status Page

- [ ] Public status page created (status.braindash.com)
- [ ] Incident communication templates
- [ ] Scheduled maintenance notifications

---

## ✅ PHASE 14: Final Pre-Launch

### 14.1 Smoke Tests

- [ ] Create account (email/social)
- [ ] Complete KYC (Tier 1)
- [ ] Deposit $50
- [ ] Join freeplay match (success)
- [ ] Join cash match $5 (success)
- [ ] Play match to completion
- [ ] Settlement occurs automatically
- [ ] Winner receives payout
- [ ] Withdraw $25 (success after 24h cooldown)

### 14.2 Kill Switch Test

- [ ] Disable cash_mode_enabled
- [ ] Attempt to join cash match (should fail with 503)
- [ ] Re-enable cash_mode_enabled
- [ ] Attempt to join cash match (should succeed)

### 14.3 Freeze Test

- [ ] Freeze test account (soft)
- [ ] Attempt cash match (should fail)
- [ ] Attempt freeplay (should succeed)
- [ ] Unfreeze account
- [ ] Attempt cash match (should succeed)

---

## 🚀 LAUNCH DAY

### Launch Sequence

1. [ ] All team members on standby
2. [ ] Monitoring dashboards open
3. [ ] PagerDuty armed
4. [ ] Status page updated ("Launching...")
5. [ ] Enable cash_mode_enabled
6. [ ] Enable new_signups_enabled
7. [ ] Monitor for 1 hour
8. [ ] If stable, announce launch
9. [ ] If issues, activate kill switches

### Post-Launch Monitoring (First 24 Hours)

- [ ] Check alerts every hour
- [ ] Review reconciliation results
- [ ] Monitor fraud scores
- [ ] Check settlement success rate
- [ ] Verify no negative balances
- [ ] Review user support tickets

---

## 📊 Success Metrics

### Day 1
- Zero critical alerts
- Zero reconciliation issues
- Zero negative balances
- Settlement success rate > 99%
- No RLS violations
- No platform downtime

### Week 1
- < 5% fraud freeze rate
- < 2% chargeback rate
- Support tickets resolved < 24h
- User satisfaction > 4/5

---

## ✅ APPROVAL SIGNATURES

**Security Lead:** ______________________ Date: __________

**Engineering Lead:** ____________________ Date: __________

**Compliance Officer:** __________________ Date: __________

**Finance Lead:** ______________________ Date: __________

**CEO/Founder:** ______________________ Date: __________

---

**Document Version:** 1.0
**Last Updated:** 2024-12-21
**Next Review:** Upon launch completion
