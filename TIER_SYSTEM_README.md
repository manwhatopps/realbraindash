# BrainDash Verification Tier System

## Overview

BrainDash implements a **mandatory KYC 2-tier verification system** (T2 and T3) that controls player deposits, withdrawals, and competitive access based on regulatory compliance requirements.

**Core Principle:** BrainDash is 100% skill-based. All cash gameplay requires identity verification (KYC). No exceptions.

---

## Verification Philosophy

**🔒 KYC is Mandatory for Cash Play**

- Free play available to all users without verification
- **All cash matches require Tier 2 (KYC) minimum**
- VIP and high-stakes require Tier 3 (EDD)
- No unverified cash gameplay permitted

---

## Verification Tiers

### **Unverified** ⏳

**Status:** No KYC completed
**Description:** Free play only

**Permissions:**
- ✅ Free play mode
- ✅ Practice matches
- ❌ No deposits
- ❌ No withdrawals
- ❌ No cash matches

**Limits:**
- Deposits: **$0**
- Withdrawals: **$0**
- Cash Matches: **Locked**

**Next Step:** Complete Tier 2 KYC verification

---

### **T2 — Verified Competitor** ✓

**Status:** Full KYC verified (Required for all cash play)
**Description:** Standard verified player

**Permissions:**
- ✅ All cash matches
- ✅ Deposits
- ✅ Withdrawals
- ✅ Standard tournaments
- ❌ VIP/high-stakes locked (requires T3)

**Limits:**
- Deposits: Up to **$2,500 per 30 days**
- Withdrawals: Up to **$5,000 per 30 days**
- Cash Matches: **Unlocked**

**Requirements:**
- ✅ Full legal name
- ✅ Date of birth (18+ required)
- ✅ Full residential address
- ✅ SSN last 4 digits
- ✅ Government-issued ID scan (Driver's License, Passport, State ID)
- ✅ Selfie verification (liveness check)

**Verification Process:**
1. User submits KYC information
2. Automated verification via KYC provider (Persona/Onfido/Jumio)
3. If automated fails → Manual review by compliance team
4. Approval typically takes **1-2 business days**

---

### **T3 — Elite Competitor** 👑

**Status:** Enhanced Due Diligence (EDD) + VIP
**Description:** High-stakes, VIP tournaments, and sponsored events

**Permissions:**
- ✅ All T2 features
- ✅ High-stakes matches ($100+ buy-ins)
- ✅ VIP tournaments
- ✅ Sponsored events
- ✅ Influencer/streamer access
- ✅ Priority support

**Limits:**
- Deposits: Up to **$10,000 per 30 days**
- Withdrawals: Up to **$20,000 per 30 days**
- Cash Matches: **Unlocked (all tiers)**
- VIP Access: **Unlocked**

**Requirements:**
- ✅ All T2 requirements met
- ✅ Proof of address (utility bill, bank statement)
- ✅ Proof of income/source of funds
- ✅ 2FA enabled (mandatory)
- ✅ Manual compliance approval
- ✅ Enhanced background check

**Verification Process:**
1. User completes T2 verification first
2. Submits additional EDD documents
3. Manual review by compliance officer
4. Approval typically takes **3-5 business days**
5. Subject to ongoing periodic review

---

## Database Schema

### Table: `user_verification_profiles`

```sql
CREATE TABLE user_verification_profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),

  -- Tier & Status (NULL if unverified, 'T2' or 'T3' once verified)
  verification_tier text CHECK (tier IN ('T2', 'T3')),
  verification_status text DEFAULT 'unverified' CHECK (status IN (
    'unverified', 'pending', 'verified', 'rejected', 'review_required'
  )),
  verification_last_updated timestamptz,
  verification_notes text,

  -- T2 KYC Data
  legal_name text,
  date_of_birth date,
  address_line1 text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'US',
  ssn_last_4 text,
  government_id_type text,
  government_id_uploaded_at timestamptz,
  selfie_uploaded_at timestamptz,
  kyc_provider_reference text,
  kyc_completed_at timestamptz,

  -- T3 EDD Data
  proof_of_address_uploaded_at timestamptz,
  proof_of_income_uploaded_at timestamptz,
  source_of_funds_description text,
  two_factor_enabled boolean DEFAULT false,
  manual_approval_at timestamptz,
  approved_by text,
  edd_completed_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### View: `wallet_limits`

```sql
CREATE VIEW wallet_limits AS
SELECT 'T2' AS tier, 2500 AS max_deposit_30d, 5000 AS max_withdraw_30d
UNION ALL
SELECT 'T3', 10000, 20000;
```

---

## API Functions

### PostgreSQL Function: `can_user_action()`

```sql
can_user_action(p_user_id uuid, p_action_type text, p_amount_cents bigint)
RETURNS jsonb
```

**Action Types:**
- `'deposit'` - Check if user can deposit
- `'withdraw'` - Check if user can withdraw
- `'enter_match'` - Check if user can enter cash matches
- `'enter_vip'` - Check if user can enter VIP matches

**Return Format:**
```json
{
  "allowed": false,
  "tier": "unverified",
  "code": "NEEDS_KYC",
  "reason": "You must complete identity verification (KYC) before making deposits."
}
```

**Error Codes:**
- `NEEDS_KYC` - Requires KYC verification (T2 minimum)
- `NEEDS_T3` - Requires T3 (EDD/VIP) verification
- `LIMIT_EXCEEDED` - 30-day limit reached

---

## Frontend Integration

### Check if User Can Perform Action

```javascript
import { canUser } from './tier-system.js';

const allowed = await canUser('withdraw', {
  amountCents: 10000,
  onUpgrade: () => {
    window.location.href = '/verification.html';
  }
});

if (allowed) {
  // Process withdrawal
}
```

---

## UX Micro-Copy

**Unverified trying cash match:**
> "Cash matches require identity verification (KYC). Complete verification to compete for real money."

**T2 trying VIP:**
> "VIP and high-stakes modes are exclusive to Tier 3 Elite players. Upgrade your verification for access."

**Limit exceeded:**
> "You've reached your 30-day deposit limit of $2,500. Upgrade to Tier 3 for higher limits."

---

## Key Differences from 4-Tier System

**Now (2 tiers + unverified):**
- **Unverified**: Free play only
- **T2**: KYC required - All cash play unlocked
- **T3**: EDD required - VIP/high-stakes unlocked

**Why 2 tiers?**
1. **Regulatory Compliance**: KYC is mandatory for any cash gameplay
2. **Simplified UX**: Clear distinction between free and cash play
3. **Risk Management**: No partial verification states
4. **AML Requirements**: All cash players fully verified

---

**Last Updated:** November 17, 2025
**Version:** 2.0.0 (Two-Tier System)
**Status:** Production Ready
