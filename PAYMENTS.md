# Stripe Payment Processing with Ledger Accounting

Complete implementation for deposits and withdrawals using Stripe with strict ledger-based accounting.

---

## Architecture Overview

**Core Principle:** The ledger is the source of truth. All balance changes go through the `wallet_ledger` table.

### Components

1. **Deposit Flow**
   - Client creates deposit intent
   - Stripe processes payment
   - Webhook credits wallet (ledger-based)
   - Idempotent via `provider_events`

2. **Withdrawal Flow**
   - User requests withdrawal
   - Funds locked (moved to `locked_withdrawal_cents`)
   - Admin approves → Stripe payout created
   - Webhook finalizes → Funds deducted from locked
   - On failure → Funds released back to available

3. **Locked Balance System**
   - `wallet_balance.available_cents` - Available for use
   - `wallet_balance.locked_withdrawal_cents` - Locked for pending withdrawals
   - All movements tracked in `wallet_ledger`

---

## Database Schema

### Enhanced `wallet_balance`

```sql
CREATE TABLE wallet_balance (
  user_id uuid PRIMARY KEY,
  available_cents bigint NOT NULL DEFAULT 0,
  locked_cents bigint NOT NULL DEFAULT 0,
  locked_withdrawal_cents bigint NOT NULL DEFAULT 0,  -- NEW
  updated_at timestamptz DEFAULT now()
);
```

### `deposit_intents`

```sql
CREATE TABLE deposit_intents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  amount_cents int NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  stripe_client_secret text,
  status text NOT NULL,
  failed_reason text,
  created_at timestamptz,
  completed_at timestamptz
);
```

### `withdrawal_requests`

```sql
CREATE TABLE withdrawal_requests (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  amount_cents int NOT NULL,
  stripe_payout_id text UNIQUE,
  status text NOT NULL,
  destination jsonb,
  approved_by uuid,
  approved_at timestamptz,
  failed_reason text,
  idempotency_key text UNIQUE,
  created_at timestamptz,
  completed_at timestamptz
);
```

### `provider_events` (Idempotency)

```sql
CREATE TABLE provider_events (
  id uuid PRIMARY KEY,
  provider_name text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb,
  raw_body text,
  signature_verified boolean DEFAULT false,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz,
  UNIQUE(provider_name, provider_event_id)  -- Idempotency guarantee
);
```

---

## API Endpoints

### 1. Create Deposit Intent

**Endpoint:** `POST /functions/v1/create-deposit-intent`

**Authentication:** JWT required

**Request:**
```json
{
  "amountCents": 5000
}
```

**Response:**
```json
{
  "success": true,
  "depositIntentId": "uuid",
  "clientSecret": "pi_xxx_secret_yyy",
  "amountCents": 5000
}
```

**Validations:**
- Kill switch: `deposits_enabled`
- Account not frozen
- Amount between $5 and $1,000
- Rate limit: 5 per hour

**Flow:**
1. Validate amount and user status
2. Create `deposit_intents` record
3. Create Stripe PaymentIntent with metadata
4. Return `clientSecret` for Stripe Elements

**Client Integration:**
```javascript
// 1. Create intent
const response = await fetch('/functions/v1/create-deposit-intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ amountCents: 5000 }),
});

const { clientSecret } = await response.json();

// 2. Use Stripe Elements
import { loadStripe } from '@stripe/stripe-js';
const stripe = await loadStripe('pk_xxx');

const { error } = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: {
    return_url: 'https://yoursite.com/deposit-success',
  },
});
```

---

### 2. Stripe Webhook Handler

**Endpoint:** `POST /functions/v1/stripe-webhook`

**Authentication:** Stripe signature verification (NOT JWT)

**Events Handled:**
- `payment_intent.succeeded` → Credit wallet
- `payment_intent.payment_failed` → Mark deposit failed
- `payout.paid` → Finalize withdrawal
- `payout.failed` → Refund locked funds

**Idempotency:**
- Each event has unique `event.id`
- Stored in `provider_events(provider_event_id)` with UNIQUE constraint
- Duplicate events return 200 immediately

**Signature Verification:**
```typescript
const stripe = new Stripe(secretKey);
const signature = req.headers.get('Stripe-Signature');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

try {
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  // Process event
} catch (err) {
  return 401; // Invalid signature
}
```

**Deposit Success Flow (`payment_intent.succeeded`):**
```
1. Verify signature
2. Check idempotency (provider_events table)
3. Call process_deposit(user_id, amount_cents, ...)
   - Credit available_cents
   - Write ledger CREDIT entry
4. Update deposit_intent status = 'completed'
5. Create audit event
```

**Withdrawal Success Flow (`payout.paid`):**
```
1. Verify signature
2. Check idempotency
3. Call finalize_withdrawal(user_id, amount_cents, ...)
   - Deduct from locked_withdrawal_cents
   - Write ledger DEBIT entry
4. Update withdrawal_request status = 'completed'
5. Create audit event
```

**Withdrawal Failure Flow (`payout.failed`):**
```
1. Verify signature
2. Check idempotency
3. Call release_withdrawal_funds(user_id, amount_cents)
   - Move from locked_withdrawal_cents back to available_cents
   - Write ledger entry
4. Update withdrawal_request status = 'failed'
5. Create critical alert
```

---

### 3. Request Withdrawal

**Endpoint:** `POST /functions/v1/secure-withdrawal-request`

**Authentication:** JWT required

**Headers:**
- `Authorization: Bearer <token>`
- `Idempotency-Key: <uuid>` (REQUIRED)

**Request:**
```json
{
  "amountCents": 10000,
  "destination": {
    "type": "bank_account",
    "accountNumber": "****1234"
  }
}
```

**Response:**
```json
{
  "success": true,
  "withdrawal_request": {
    "id": "uuid",
    "status": "pending",
    "requires_manual_review": true
  },
  "message": "Withdrawal request submitted - pending manual review"
}
```

**Validations (9-layer):**
1. Idempotency key
2. Kill switch: `withdrawals_enabled`
3. Account not frozen
4. KYC tier verified
5. Fraud score < 70
6. Daily/weekly withdrawal limits
7. Rate limit: 1 per 24 hours
8. Cooldown: 24 hours after last match
9. Balance sufficient

**Manual Review Triggers:**
- Amount >= $1,000
- Fraud score >= 50
- Account age < 30 days

**Flow:**
```
1. Check idempotency (existing withdrawal with same key?)
2. Validate all 9 layers
3. Lock funds: call lock_withdrawal_funds(user_id, amount)
   - Move from available_cents to locked_withdrawal_cents
   - Write ledger entry: withdrawal_locked
4. Create withdrawal_requests record
5. If manual review required:
   - Status = 'pending'
   - Create alert for admin
6. If auto-approved:
   - Status = 'approved'
   - Admin must still trigger payout
```

---

### 4. Admin Withdrawal Approval

**Endpoint:** `POST /functions/v1/admin-withdrawal-approve`

**Authentication:** JWT required (admin role)

**Request:**
```json
{
  "withdrawalRequestId": "uuid",
  "action": "approve",
  "reason": "Verified user identity and transaction"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal approved and payout initiated",
  "payoutId": "po_xxx"
}
```

**Actions:**
- `approve` → Create Stripe payout, status = 'processing'
- `reject` → Release locked funds, status = 'rejected'

**Approve Flow:**
```
1. Verify admin role
2. Check withdrawal status = 'pending'
3. Check withdrawals_enabled kill switch
4. Create Stripe payout:
   stripe.payouts.create({
     amount: amount_cents,
     metadata: { user_id, withdrawal_request_id }
   })
5. Update withdrawal_request:
   - stripe_payout_id = payout.id
   - status = 'processing'
   - approved_by = admin_user_id
   - approved_at = now()
6. Create audit event
7. Webhook will finalize when payout completes
```

**Reject Flow:**
```
1. Verify admin role
2. Call release_withdrawal_funds(user_id, amount)
   - Move from locked_withdrawal_cents back to available_cents
3. Update withdrawal_request:
   - status = 'rejected'
   - reviewed_by = admin_user_id
   - rejection_reason = reason
4. Create audit event
```

---

## Helper Functions

### `lock_withdrawal_funds(user_id, amount_cents)`

Moves funds from available to locked.

```sql
-- Before:
available_cents: 10000
locked_withdrawal_cents: 0

-- After lock_withdrawal_funds(user_id, 5000):
available_cents: 5000
locked_withdrawal_cents: 5000

-- Ledger entry:
transaction_type: 'withdrawal_locked'
amount_cents: -5000
balance_after_cents: 5000 (available)
```

### `release_withdrawal_funds(user_id, amount_cents)`

Moves funds from locked back to available (withdrawal failed/rejected).

```sql
-- Before:
available_cents: 5000
locked_withdrawal_cents: 5000

-- After release_withdrawal_funds(user_id, 5000):
available_cents: 10000
locked_withdrawal_cents: 0

-- Ledger entry:
transaction_type: 'withdrawal_released'
amount_cents: 5000
balance_after_cents: 10000 (available)
```

### `finalize_withdrawal(user_id, amount_cents, ...)`

Deducts from locked funds (payout succeeded).

```sql
-- Before:
available_cents: 5000
locked_withdrawal_cents: 5000

-- After finalize_withdrawal(user_id, 5000, ...):
available_cents: 5000 (unchanged)
locked_withdrawal_cents: 0

-- Ledger entry:
transaction_type: 'withdrawal_completed'
amount_cents: -5000
description: 'Withdrawal completed: po_xxx'
```

### `process_deposit(user_id, amount_cents, ...)`

Credits available funds (deposit succeeded).

```sql
-- Before:
available_cents: 5000

-- After process_deposit(user_id, 10000, ...):
available_cents: 15000

-- Ledger entry:
transaction_type: 'deposit_completed'
amount_cents: 10000
balance_after_cents: 15000
description: 'Deposit completed: pi_xxx'
```

---

## Ledger Integrity

### All Balance Changes Go Through Ledger

Every single balance mutation creates a `wallet_ledger` entry:

```sql
INSERT INTO wallet_ledger (
  user_id,
  transaction_type,
  amount_cents,
  balance_after_cents,
  description,
  metadata
);
```

### Transaction Types

- `deposit_completed` - Deposit success
- `withdrawal_locked` - Funds locked for withdrawal
- `withdrawal_released` - Withdrawal cancelled/failed, funds released
- `withdrawal_completed` - Withdrawal success
- `match_entry` - Entered cash match
- `match_payout` - Won cash match
- `match_refund` - Match cancelled/error
- `adjustment` - Admin balance adjustment

### Reconciliation

The reconciliation job verifies:
```sql
-- Wallet balance should equal sum of ledger entries
SELECT
  w.user_id,
  w.available_cents AS wallet_balance,
  SUM(l.amount_cents) AS ledger_balance
FROM wallet_balance w
LEFT JOIN wallet_ledger l ON l.user_id = w.user_id
GROUP BY w.user_id
HAVING w.available_cents != COALESCE(SUM(l.amount_cents), 0);
```

---

## Security Guarantees

### 1. Idempotency

**Webhook events:**
- Unique constraint on `provider_events(provider_name, provider_event_id)`
- Duplicate webhook = instant 200 response, no processing

**Withdrawal requests:**
- Unique constraint on `withdrawal_requests(idempotency_key)`
- Duplicate request = return existing withdrawal

### 2. Signature Verification

All Stripe webhooks verified using `stripe.webhooks.constructEvent()`:
- Validates signature using `STRIPE_WEBHOOK_SECRET`
- Prevents replay attacks
- Ensures authenticity

### 3. No Client Trust

- Deposit amounts set server-side only
- Webhook processing is server-only (no JWT)
- Balance mutations only via server functions
- Client cannot manipulate any money values

### 4. Atomic Operations

All balance changes wrapped in database transactions:
```sql
BEGIN;
  -- Lock wallet row FOR UPDATE
  -- Validate balance
  -- Update balance
  -- Insert ledger entry
COMMIT;
```

### 5. Audit Trail

Every money operation logged:
- `audit_events` table
- `wallet_ledger` entries (immutable)
- `provider_events` (webhook history)

---

## Configuration

### Required Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx or sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Platform
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
SUPABASE_ANON_KEY=eyJxxx
```

### Stripe Dashboard Setup

1. **Get API Keys:**
   - Dashboard → Developers → API keys
   - Copy Secret key (`sk_test_...` or `sk_live_...`)

2. **Configure Webhook:**
   - Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://[project].supabase.co/functions/v1/stripe-webhook`
   - Events to send:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payout.paid`
     - `payout.failed`
   - Copy Signing secret (`whsec_...`)

3. **Test Mode:**
   - Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to https://[project].supabase.co/functions/v1/stripe-webhook
   stripe trigger payment_intent.succeeded
   ```

---

## Testing

### Test Deposit Flow

```bash
# 1. Create deposit intent
curl -X POST https://[project].supabase.co/functions/v1/create-deposit-intent \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amountCents": 5000}'

# 2. Use Stripe test card: 4242 4242 4242 4242
# 3. Webhook fires automatically
# 4. Check balance:
SELECT * FROM wallet_balance WHERE user_id = 'xxx';
SELECT * FROM wallet_ledger WHERE user_id = 'xxx' ORDER BY created_at DESC;
```

### Test Withdrawal Flow

```bash
# 1. Request withdrawal
curl -X POST https://[project].supabase.co/functions/v1/secure-withdrawal-request \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "amountCents": 10000,
    "destination": {"type": "bank_account"}
  }'

# 2. Check locked balance:
SELECT available_cents, locked_withdrawal_cents FROM wallet_balance WHERE user_id = 'xxx';

# 3. Admin approves:
curl -X POST https://[project].supabase.co/functions/v1/admin-withdrawal-approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "withdrawalRequestId": "uuid",
    "action": "approve"
  }'

# 4. Webhook finalizes (simulate):
stripe trigger payout.paid
```

### Verify Idempotency

```bash
# Send same webhook twice - should process only once
curl -X POST https://[project].supabase.co/functions/v1/stripe-webhook \
  -H "Stripe-Signature: $SIGNATURE" \
  -d @webhook_payload.json

# Check provider_events:
SELECT * FROM provider_events WHERE provider_event_id = 'evt_xxx';
```

---

## Monitoring & Alerts

### Critical Alerts

1. **Deposit Credit Failed**
   - Trigger: `process_deposit()` returns error
   - Severity: CRITICAL
   - Action: Manual wallet credit required

2. **Withdrawal Finalization Failed**
   - Trigger: `finalize_withdrawal()` returns error
   - Severity: CRITICAL
   - Action: Funds stuck in locked state

3. **Webhook Signature Verification Failed**
   - Trigger: Invalid Stripe signature
   - Severity: ERROR
   - Action: Check webhook secret configuration

4. **Idempotency Violation**
   - Trigger: Should never happen (unique constraint)
   - Severity: CRITICAL
   - Action: Investigate data integrity

### Metrics to Track

- Deposit success rate (target: >99%)
- Withdrawal approval time (target: <24h)
- Webhook processing latency (target: <2s)
- Locked balance aging (flag >7 days)
- Reconciliation discrepancies (target: 0)

### Dashboards

**Financial Health:**
- Total deposits (daily/monthly)
- Total withdrawals (daily/monthly)
- Locked balance total
- Net revenue (deposits - withdrawals)

**Operations:**
- Pending withdrawals count
- Manual review queue size
- Failed payment intents
- Webhook processing errors

---

## Troubleshooting

### Deposit Not Credited

1. Check `deposit_intents`:
   ```sql
   SELECT * FROM deposit_intents
   WHERE stripe_payment_intent_id = 'pi_xxx';
   ```

2. Check webhook received:
   ```sql
   SELECT * FROM provider_events
   WHERE payload->'data'->'object'->>'id' = 'pi_xxx';
   ```

3. Check ledger:
   ```sql
   SELECT * FROM wallet_ledger
   WHERE metadata->>'stripe_payment_intent_id' = 'pi_xxx';
   ```

4. If webhook not received:
   - Check Stripe Dashboard → Developers → Webhooks → Attempts
   - Manually trigger: Dashboard → Events → Send test webhook

### Withdrawal Stuck in Processing

1. Check status:
   ```sql
   SELECT * FROM withdrawal_requests WHERE id = 'uuid';
   ```

2. Check Stripe payout:
   ```sql
   SELECT stripe_payout_id FROM withdrawal_requests WHERE id = 'uuid';
   -- Check in Stripe Dashboard
   ```

3. Check webhook:
   ```sql
   SELECT * FROM provider_events
   WHERE event_type IN ('payout.paid', 'payout.failed')
   AND payload->'data'->'object'->>'id' = 'po_xxx';
   ```

4. Manual resolution:
   - If payout succeeded but webhook failed:
     ```sql
     SELECT finalize_withdrawal(
       user_id, amount_cents, withdrawal_id, stripe_payout_id
     );
     ```
   - If payout failed:
     ```sql
     SELECT release_withdrawal_funds(user_id, amount_cents);
     UPDATE withdrawal_requests SET status = 'failed' WHERE id = 'uuid';
     ```

### Negative Balance Detected

**THIS SHOULD NEVER HAPPEN** - indicates critical bug.

1. Immediate action:
   ```sql
   -- Freeze affected accounts
   UPDATE user_eligibility SET account_frozen = true
   WHERE user_id IN (SELECT user_id FROM wallet_balance WHERE available_cents < 0);
   ```

2. Investigate ledger:
   ```sql
   SELECT * FROM wallet_ledger
   WHERE user_id = 'affected_user_id'
   ORDER BY created_at;
   ```

3. Run reconciliation:
   ```sql
   SELECT * FROM check_balance_integrity();
   ```

4. Fix and create incident report

---

## FAQ

**Q: Can a user withdraw funds locked for a match?**
A: No. `locked_cents` (match escrow) and `locked_withdrawal_cents` are separate. Only `available_cents` can be withdrawn.

**Q: What happens if a withdrawal is approved but Stripe fails?**
A: The `payout.failed` webhook releases locked funds back to available and updates status to 'failed'. User can try again.

**Q: Can an admin manually credit a user's balance?**
A: Yes, via `credit_wallet_atomic()` with `transaction_type = 'adjustment'`. Creates ledger entry and audit log.

**Q: How long do funds stay locked for a pending withdrawal?**
A: Until admin approves/rejects, or 7 days (auto-reject with alert).

**Q: Can a user cancel a pending withdrawal?**
A: Not currently implemented. Admin must reject it to release funds.

**Q: What's the minimum/maximum deposit?**
A: Min: $5, Max: $1,000 per transaction. Configurable in code.

**Q: How are Stripe fees handled?**
A: Stripe deducts fees automatically. User receives full requested amount on deposits, pays full amount on withdrawals.

---

## Production Checklist

- [ ] Stripe account verified and approved
- [ ] Live API keys configured (`sk_live_...`)
- [ ] Webhook endpoint registered in Stripe Dashboard
- [ ] Webhook secret (`whsec_...`) configured
- [ ] Test deposit flow with live card
- [ ] Test withdrawal flow with real bank account
- [ ] Reconciliation job scheduled (daily)
- [ ] Monitoring alerts configured
- [ ] Admin approval queue setup
- [ ] Support team trained on manual resolution

---

**Document Version:** 1.0
**Last Updated:** 2024-12-21
**Status:** Production Ready
