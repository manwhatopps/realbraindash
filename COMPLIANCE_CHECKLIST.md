# BrainDash – Cash Skill-Based Gaming Compliance Checklist

**CRITICAL: This system is currently in DEVELOPMENT MODE with TEST WALLETS ONLY.**

**Real-money gaming is DISABLED until all compliance requirements are met and approved by legal counsel.**

---

## Current Compliance Status: ❌ NOT PRODUCTION READY

### ⚠️ DEVELOPMENT MODE RESTRICTIONS

- ✅ Test wallets and sandbox transactions only
- ✅ No real payment processor integration
- ✅ No actual money transfers
- ✅ Cash matches UI shows "TEST MODE" banner
- ❌ Real KYC integration (placeholder only)
- ❌ Geo-blocking enforcement (not implemented)
- ❌ Real payment processing (simulated)
- ❌ Legal counsel approval (not obtained)
- ❌ Licensed operation (not established)

---

## 1️⃣ LEGAL CLASSIFICATION (SKILL GAME STATUS)

### Current Status: ⚠️ PARTIAL

- [x] Game outcome is **majority determined by skill**, not chance
  - ✅ Trivia questions require knowledge
  - ✅ No RNG affects scoring
  - ✅ Speed bonus rewards faster correct answers
  - ✅ No luck-based elements in gameplay

- [x] No RNG or luck-based modifiers influence outcome
  - ✅ Questions are fixed per match
  - ✅ All players receive same questions
  - ✅ Scoring is deterministic

- [x] No purchasable gameplay boosts, power-ups, or advantages
  - ✅ No in-game purchases affecting gameplay
  - ✅ Only entry fees for tournaments

- [ ] **REQUIRED:** Game rules documented with "dominant factor" test justification
  - ⚠️ TODO: Create formal legal documentation

- [ ] **REQUIRED:** Internal documentation proving skill > chance saved
  - ⚠️ TODO: Statistical analysis of skill vs chance

- [ ] **RECOMMENDED:** Obtain third-party skill game classification opinion
  - ❌ TODO: Hire gaming attorney for classification

### Action Items:
1. Hire gaming attorney to provide skill-game opinion letter
2. Document skill-dominance with statistical analysis
3. Create formal game rules documentation
4. Obtain independent fairness certification

---

## 2️⃣ AGE & USER ELIGIBILITY VERIFICATION

### Current Status: ⚠️ PLACEHOLDER ONLY

- [x] **Database schema** for KYC status tracking exists
  - ✅ `user_kyc_status` table created
  - ✅ Fields: kyc_status, kyc_vendor, kyc_reference_id

- [ ] **CRITICAL:** KYC identity verification required before deposits/wagers
  - ❌ Not implemented (placeholder functions only)
  - ⚠️ Edge functions exist but do not integrate with real vendor

- [ ] **CRITICAL:** Users must be 18+ or 21+ depending on jurisdiction
  - ❌ Age verification not implemented
  - ❌ No date of birth validation

- [ ] **CRITICAL:** Multi-factor identity verification
  - ❌ No government ID check
  - ❌ No selfie matching
  - ❌ No DOB verification

- [ ] Block fake/duplicate accounts
  - ❌ No device fingerprinting
  - ❌ No payment fingerprinting
  - ❌ No duplicate detection

- [ ] Permanent ban for fraudulent identity attempts
  - ❌ Not implemented

### Action Items:
1. **BEFORE LAUNCH:** Integrate with KYC vendor (Persona, Onfido, Jumio, Veriff)
2. Add age verification to signup flow
3. Implement device fingerprinting
4. Add duplicate account detection
5. Create fraud detection system
6. Block cash play until KYC verified

### Recommended Vendors:
- **Persona** - Best for US markets, quick integration
- **Onfido** - Global coverage
- **Jumio** - Enterprise-grade
- **Veriff** - Good balance of price/features

---

## 3️⃣ GEO-LOCATION & STATE COMPLIANCE

### Current Status: ❌ NOT IMPLEMENTED

- [ ] **CRITICAL:** Real-time IP + device geo check
  - ❌ No IP geolocation
  - ❌ No GPS verification

- [ ] **CRITICAL:** State-level/country-level allowlist & blocklist
  - ❌ No state blocking
  - ❌ No region restrictions

- [ ] **CRITICAL:** Auto-block restricted states
  - ❌ States to block: AZ, AR, CT, DE, LA, MT, SC, SD, TN (verify with counsel)
  - ⚠️ State laws change frequently - require legal review

- [ ] UI clearly reflects eligible/restricted/play-only mode
  - ❌ No geo-restriction messaging

- [ ] Store user's verified state for audit
  - ❌ No location tracking in database

### Action Items:
1. **BEFORE LAUNCH:** Integrate geo-blocking service (GeoComply, MaxMind)
2. Create state allowlist/blocklist in database
3. Add real-time location checks before matches
4. Implement GPS verification for mobile
5. Add UI warnings for restricted states
6. Store user location in audit log

### Recommended Vendors:
- **GeoComply** - Industry standard for gaming ($$$$)
- **MaxMind GeoIP2** - Cost-effective ($$$)
- **IP2Location** - Budget option ($$)

### Prohibited States (as of 2024, verify with counsel):
- Arizona (AZ)
- Arkansas (AR)
- Connecticut (CT)
- Delaware (DE)
- Louisiana (LA)
- Montana (MT)
- South Carolina (SC)
- South Dakota (SD)
- Tennessee (TN)
- Washington (WA) - completely banned

**NOTE:** This list changes. Require quarterly legal review.

---

## 4️⃣ FINANCIAL COMPLIANCE (DEPOSITS & PAYOUTS)

### Current Status: ✅ ARCHITECTURE READY, ❌ NOT CONNECTED

- [x] Ledger-based accounting system exists
  - ✅ `wallet_ledger` table with immutable records
  - ✅ All transactions logged
  - ✅ Running balance tracked

- [x] Escrow system architecture in place
  - ✅ `cash_match_escrows` table
  - ✅ Funds locked until match completion

- [ ] **CRITICAL:** Deposits through licensed payment gateways
  - ❌ No real payment integration (test mode only)
  - ❌ Stripe not configured
  - ❌ PayPal not integrated

- [ ] **CRITICAL:** Platform revenue separate from player escrow
  - ⚠️ Architecture supports this but needs audit

- [x] Platform revenue defined as transparent rake/fee
  - ✅ Rake percentage stored per match
  - ✅ Displayed before entry

- [ ] **CRITICAL:** No crypto deposits unless licensed
  - ✅ Not implemented (good - avoid unless licensed)

### Action Items:
1. **BEFORE LAUNCH:** Integrate Stripe Connect or PayPal
2. Set up separate bank accounts for player funds vs revenue
3. Implement ACH/bank transfer withdrawals
4. Add withdrawal identity verification
5. Implement transaction limits ($2,500/day recommended)
6. Add chargeback handling
7. Configure tax reporting (1099 forms for $600+)

### Recommended Payment Vendors:
- **Stripe Connect** - Best for marketplace model
- **Braintree** - PayPal owned, good for gaming
- **Dwolla** - ACH specialist
- **Adyen** - Enterprise solution

---

## 5️⃣ AML / FRAUD PREVENTION REQUIREMENTS

### Current Status: ❌ NOT IMPLEMENTED

- [ ] **CRITICAL:** AML thresholds monitored
  - ❌ No monitoring for $600+ transactions
  - ❌ No $2,000+ escalation
  - ❌ No velocity checks

- [ ] **CRITICAL:** Flag suspicious patterns
  - ❌ No fraud detection
  - ❌ No chargeback tracking
  - ❌ No multi-account detection

- [ ] **CRITICAL:** Limit multi-accounting through fingerprinting
  - ❌ No device fingerprinting
  - ❌ No browser fingerprinting

- [ ] **CRITICAL:** Withdrawals only to verified accounts
  - ❌ No identity matching for withdrawals

- [ ] High-risk patterns escalated automatically
  - ❌ No automated flagging

### Action Items:
1. **BEFORE LAUNCH:** Implement transaction monitoring
2. Add velocity checks (deposits/withdrawals per hour/day)
3. Flag accounts with >3 chargebacks
4. Implement device fingerprinting (FingerprintJS)
5. Add manual review queue for high-risk transactions
6. Create AML compliance officer role
7. File SARs (Suspicious Activity Reports) when required

### Thresholds to Monitor:
- **$600** - Tax reporting threshold (1099-MISC)
- **$2,000** - Enhanced due diligence
- **$10,000** - CTR (Currency Transaction Report) required
- **Velocity:** >$5,000 in 24 hours = flag for review

---

## 6️⃣ TERMS, DISCLOSURES & TRANSPARENCY

### Current Status: ⚠️ PARTIAL

- [x] Entry fees and rake % displayed before joining
  - ✅ Shown in match creation UI
  - ✅ Visible in lobby

- [x] Payout model disclosed
  - ✅ Shows winner-take-all, top3, etc.

- [ ] **REQUIRED:** Complete Terms & Conditions
  - ⚠️ TODO: Draft comprehensive T&Cs
  - Must include: skill-based nature, eligibility, refunds, disputes

- [ ] **REQUIRED:** Privacy Policy
  - ⚠️ TODO: GDPR/CCPA compliant privacy policy

- [ ] **REQUIRED:** Fair Play Policy
  - ⚠️ TODO: Anti-cheating, anti-collusion rules

- [ ] **REQUIRED:** Responsible Gaming messaging
  - ❌ Not present

- [ ] **REQUIRED:** AML/KYC Policy
  - ❌ Not documented

### Action Items:
1. **BEFORE LAUNCH:** Hire attorney to draft legal documents
2. Create Terms of Service
3. Create Privacy Policy (GDPR/CCPA compliant)
4. Create Fair Play Policy
5. Add responsible gaming resources
6. Add prominent disclosures in UI
7. Require acceptance before first cash match

### Required Legal Documents:
- ✅ Terms & Conditions
- ✅ Privacy Policy
- ✅ Fair Play Policy
- ✅ AML/KYC Policy
- ✅ Responsible Gaming Policy
- ✅ Dispute Resolution Process
- ✅ Refund Policy

---

## 7️⃣ CUSTOMER PROTECTION & SAFETY

### Current Status: ❌ NOT IMPLEMENTED

- [ ] **REQUIRED:** Self-exclusion feature
  - ❌ Users cannot self-exclude from cash play

- [ ] **REQUIRED:** Deposit & wager limits configurable
  - ❌ No limits system

- [ ] **RECOMMENDED:** Cool-down & time-played warnings
  - ❌ Not implemented

- [ ] **REQUIRED:** Dedicated support & dispute resolution
  - ❌ No support system
  - ❌ No dispute process

### Action Items:
1. **BEFORE LAUNCH:** Add self-exclusion feature
2. Implement deposit limits (daily/weekly/monthly)
3. Add wager limits per match
4. Add time-played tracking
5. Create dispute resolution process
6. Add support ticket system
7. Add responsible gaming resources (NCPG links)

### Recommended Limits:
- **Daily deposit limit:** $500 default
- **Weekly deposit limit:** $2,000 default
- **Monthly deposit limit:** $10,000 default
- **Max single match entry:** $100
- **Time warnings:** After 2 hours continuous play

---

## 8️⃣ SECURITY & DATA COMPLIANCE

### Current Status: ⚠️ PARTIAL

- [x] KYC data storage schema exists
  - ✅ Supabase with encryption enabled
  - ✅ RLS policies protect user data

- [ ] **REQUIRED:** All KYC data encrypted at rest and in transit
  - ⚠️ Supabase provides encryption, but needs verification

- [ ] **REQUIRED:** No permanent raw document storage unless required
  - ❌ Not applicable yet (no KYC vendor integration)

- [x] Access restricted to least-privilege staff
  - ✅ RLS policies in place
  - ⚠️ Need role-based admin access controls

- [ ] **REQUIRED:** GDPR, CCPA, SOC-2 awareness
  - ❌ No formal compliance program

### Action Items:
1. **BEFORE LAUNCH:** Enable Supabase encryption at rest
2. Configure SSL/TLS for all connections
3. Implement role-based access control for admins
4. Add data retention policies
5. Create GDPR data export feature
6. Create CCPA opt-out feature
7. Add audit logging for admin access
8. Consider SOC 2 Type II certification

---

## 9️⃣ PLATFORM & AUDITABILITY

### Current Status: ✅ STRONG FOUNDATION

- [x] Every match logged with full details
  - ✅ player IDs tracked
  - ✅ questions served stored in match
  - ✅ timestamps recorded
  - ✅ scores calculated server-side

- [x] Result resolution computed server-side only
  - ✅ No client-side scoring
  - ✅ Answers validated server-side
  - ✅ Payouts calculated server-side

- [x] Full audit history retrievable
  - ✅ `wallet_ledger` provides complete transaction history
  - ✅ `cash_match_players` tracks all participant data
  - ✅ `cash_matches` stores match configuration

- [ ] **RECOMMENDED:** Third-party fairness testing
  - ❌ Not performed

### Action Items:
1. Add audit log export feature
2. Create admin dashboard for match review
3. Add match replay feature for dispute resolution
4. Consider iTech Labs or GLI certification (optional but valuable)

---

## 🔟 LAUNCH BLOCKERS (ALL MUST BE DONE)

### Current Status: ❌ 0/5 COMPLETED

- [ ] **🚨 BLOCKER:** Legal counsel review & approval
  - ❌ No attorney engaged
  - **Cost:** $5,000-$25,000 for gaming attorney review

- [ ] **🚨 BLOCKER:** Payment processor approval
  - ❌ Stripe not configured
  - ❌ PayPal not approved
  - **Timeline:** 2-4 weeks for approval

- [ ] **🚨 BLOCKER:** Live KYC vendor integration
  - ❌ No vendor selected
  - **Cost:** $1-5 per verification

- [ ] **🚨 BLOCKER:** Geo-restriction fully functional
  - ❌ Not implemented
  - **Cost:** $100-500/month for geo service

- [ ] **🚨 BLOCKER:** Cash play locked behind compliance gates
  - ⚠️ Currently accessible (TEST MODE banner shown)
  - Must be hard-locked in production

---

## RECOMMENDED VENDOR OPTIONS

### KYC/AML Providers
- **Persona** - $2-5 per verification, best US coverage
- **Onfido** - $1-3 per verification, global
- **Jumio** - Enterprise pricing, very thorough
- **Veriff** - $1-4 per verification, good UX
- **Cognito** - Budget option

### Geo-blocking Services
- **GeoComply** - Industry standard, $$$$ (used by DraftKings)
- **MaxMind GeoIP2** - $$$, accurate
- **IP2Location** - $$, decent accuracy

### Payment Processors
- **Stripe Connect** - 2.9% + $0.30, marketplace model
- **Braintree** - PayPal owned, gaming-friendly
- **PayPal** - Popular with users
- **Adyen** - Enterprise, global
- **Dwolla** - ACH specialist, lower fees

### Device Fingerprinting
- **FingerprintJS** - $99+/month
- **Seon** - Fraud prevention focus
- **Incognia** - Location + device

---

## ESTIMATED COSTS TO LAUNCH

### One-Time Costs
- Legal review: $5,000-$25,000
- Terms & policies drafting: $2,000-$10,000
- KYC vendor setup: $500-$2,000
- Payment processor setup: $0-$5,000
- **Total:** $7,500-$42,000

### Monthly Costs
- KYC per verification: $1-5 × volume
- Geo-blocking service: $100-$500/month
- Payment processing: 2.9% + $0.30 per transaction
- Compliance monitoring: $500-$2,000/month
- **Minimum:** ~$1,000/month before transaction costs

### Timeline to Launch
- Legal review: 2-4 weeks
- KYC integration: 1-2 weeks
- Payment integration: 2-4 weeks
- Geo-blocking: 1 week
- Testing: 2 weeks
- **Total:** 8-13 weeks (2-3 months)

---

## DEVELOPMENT SAFEGUARDS IN PLACE

### Current Protections ✅

1. **Test Mode Banner**
   - All cash match UI shows "TEST MODE ONLY"
   - Prominent warnings before entry

2. **No Real Money**
   - All wallets are test balances
   - No actual payment processing

3. **Audit Trail**
   - All transactions logged
   - Full history retrievable

4. **Server-Side Security**
   - Scores calculated server-side
   - Payouts determined server-side
   - No client trust

5. **RLS Enabled**
   - Users can only see their own data
   - Wallet operations protected

---

## NEXT STEPS TO PRODUCTION

### Phase 1: Legal Foundation (Weeks 1-4)
1. Hire gaming attorney
2. Obtain skill-game opinion letter
3. Draft all legal documents
4. File necessary business licenses

### Phase 2: Compliance Infrastructure (Weeks 5-8)
1. Integrate KYC vendor
2. Add geo-blocking
3. Set up payment processing
4. Implement deposit/withdrawal limits
5. Add self-exclusion features

### Phase 3: Testing & Audit (Weeks 9-12)
1. Internal compliance audit
2. Payment processor approval
3. Beta testing with real money (small amounts)
4. Legal review of live system
5. Final counsel approval

### Phase 4: Launch (Week 13)
1. Remove TEST MODE restrictions
2. Enable real payment processing
3. Monitor closely for first 30 days
4. Quarterly compliance reviews

---

## COMPLIANCE CONTACTS

### Required Professionals
- **Gaming Attorney:** [TO BE HIRED]
- **Compliance Officer:** [TO BE APPOINTED]
- **KYC Vendor:** [TO BE SELECTED]
- **Payment Processor:** [TO BE APPROVED]
- **Geo Service:** [TO BE INTEGRATED]

---

## FINAL STATEMENT

**🚨 CRITICAL: No real-money game mode may be enabled unless every above requirement is met and verified by both engineering and legal counsel.**

**Current Status: TEST MODE ONLY - No actual money may be wagered or won.**

**This system must remain in development/sandbox mode until all compliance gates are cleared and documented.**

---

*Last Updated: November 17, 2025*
*Next Review: [BEFORE ANY PRODUCTION LAUNCH]*
