/*
  # Stripe Payment Infrastructure

  Complete implementation for Stripe-based deposits and withdrawals with ledger accounting.

  ## 1. Deposit Infrastructure
  - Enhanced `deposit_intents` with Stripe fields
  - Tracking of Stripe PaymentIntents

  ## 2. Withdrawal Infrastructure
  - Enhanced `withdrawal_requests` with locked balance tracking
  - Admin approval workflow
  - Stripe payout tracking

  ## 3. Webhook Idempotency
  - Enhanced `provider_events` for Stripe signature verification
  - Unique constraint on stripe_event_id

  ## 4. Locked Balance Tracking
  - Add locked_withdrawal_cents to wallet_balance
  - Functions to move funds between available and locked

  ## Security
  - All operations are ledger-based (source of truth)
  - Idempotency enforced via unique constraints
  - Audit trail for all money movements
  - Admin-only approval endpoints
*/

-- =====================================================
-- 1. WALLET BALANCE ENHANCEMENTS
-- =====================================================

-- Add locked withdrawal tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_balance' AND column_name = 'locked_withdrawal_cents'
  ) THEN
    ALTER TABLE wallet_balance ADD COLUMN locked_withdrawal_cents bigint NOT NULL DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- 2. DEPOSIT INTENTS ENHANCEMENTS
-- =====================================================

-- Add Stripe-specific fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposit_intents' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE deposit_intents ADD COLUMN stripe_payment_intent_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposit_intents' AND column_name = 'stripe_client_secret'
  ) THEN
    ALTER TABLE deposit_intents ADD COLUMN stripe_client_secret text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposit_intents' AND column_name = 'failed_reason'
  ) THEN
    ALTER TABLE deposit_intents ADD COLUMN failed_reason text;
  END IF;
END $$;

-- =====================================================
-- 3. WITHDRAWAL REQUESTS ENHANCEMENTS
-- =====================================================

-- Add Stripe payout tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawal_requests' AND column_name = 'stripe_payout_id'
  ) THEN
    ALTER TABLE withdrawal_requests ADD COLUMN stripe_payout_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawal_requests' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE withdrawal_requests ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawal_requests' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE withdrawal_requests ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawal_requests' AND column_name = 'failed_reason'
  ) THEN
    ALTER TABLE withdrawal_requests ADD COLUMN failed_reason text;
  END IF;
END $$;

-- =====================================================
-- 4. PROVIDER EVENTS ENHANCEMENTS
-- =====================================================

-- Add Stripe-specific fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_events' AND column_name = 'signature_verified'
  ) THEN
    ALTER TABLE provider_events ADD COLUMN signature_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_events' AND column_name = 'raw_body'
  ) THEN
    ALTER TABLE provider_events ADD COLUMN raw_body text;
  END IF;
END $$;

-- =====================================================
-- 5. PAYMENT HELPER FUNCTIONS
-- =====================================================

-- Lock funds for withdrawal (move from available to locked)
CREATE OR REPLACE FUNCTION lock_withdrawal_funds(
  p_user_id uuid,
  p_amount_cents int
)
RETURNS TABLE (
  success boolean,
  available_cents bigint,
  locked_cents bigint,
  error_message text
) AS $$
DECLARE
  v_current_available bigint;
  v_new_available bigint;
  v_new_locked bigint;
BEGIN
  -- Lock the wallet row
  SELECT available_cents, locked_withdrawal_cents
  INTO v_current_available, v_new_locked
  FROM wallet_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::bigint, 0::bigint, 'Wallet not found'::text;
    RETURN;
  END IF;

  IF v_current_available < p_amount_cents THEN
    RETURN QUERY SELECT false, v_current_available, v_new_locked, 'Insufficient balance'::text;
    RETURN;
  END IF;

  -- Move funds from available to locked
  v_new_available := v_current_available - p_amount_cents;
  v_new_locked := v_new_locked + p_amount_cents;

  UPDATE wallet_balance
  SET
    available_cents = v_new_available,
    locked_withdrawal_cents = v_new_locked
  WHERE user_id = p_user_id;

  -- Create ledger entry for lock
  INSERT INTO wallet_ledger (
    user_id,
    transaction_type,
    amount_cents,
    balance_after_cents,
    description
  ) VALUES (
    p_user_id,
    'withdrawal_locked',
    -p_amount_cents,
    v_new_available,
    format('Locked %s cents for withdrawal', p_amount_cents)
  );

  RETURN QUERY SELECT true, v_new_available, v_new_locked, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release locked funds back to available (withdrawal failed)
CREATE OR REPLACE FUNCTION release_withdrawal_funds(
  p_user_id uuid,
  p_amount_cents int
)
RETURNS TABLE (
  success boolean,
  available_cents bigint,
  locked_cents bigint
) AS $$
DECLARE
  v_current_available bigint;
  v_current_locked bigint;
  v_new_available bigint;
  v_new_locked bigint;
BEGIN
  -- Lock the wallet row
  SELECT available_cents, locked_withdrawal_cents
  INTO v_current_available, v_current_locked
  FROM wallet_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::bigint, 0::bigint;
    RETURN;
  END IF;

  IF v_current_locked < p_amount_cents THEN
    -- Can't release more than locked
    RETURN QUERY SELECT false, v_current_available, v_current_locked;
    RETURN;
  END IF;

  -- Move funds from locked back to available
  v_new_available := v_current_available + p_amount_cents;
  v_new_locked := v_current_locked - p_amount_cents;

  UPDATE wallet_balance
  SET
    available_cents = v_new_available,
    locked_withdrawal_cents = v_new_locked
  WHERE user_id = p_user_id;

  -- Create ledger entry for release
  INSERT INTO wallet_ledger (
    user_id,
    transaction_type,
    amount_cents,
    balance_after_cents,
    description
  ) VALUES (
    p_user_id,
    'withdrawal_released',
    p_amount_cents,
    v_new_available,
    format('Released %s cents from locked withdrawal', p_amount_cents)
  );

  RETURN QUERY SELECT true, v_new_available, v_new_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Finalize withdrawal (deduct from locked, write ledger DEBIT)
CREATE OR REPLACE FUNCTION finalize_withdrawal(
  p_user_id uuid,
  p_amount_cents int,
  p_withdrawal_request_id uuid,
  p_stripe_payout_id text
)
RETURNS TABLE (
  success boolean,
  locked_cents bigint,
  error_message text
) AS $$
DECLARE
  v_current_locked bigint;
  v_new_locked bigint;
BEGIN
  -- Lock the wallet row
  SELECT locked_withdrawal_cents
  INTO v_current_locked
  FROM wallet_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::bigint, 'Wallet not found'::text;
    RETURN;
  END IF;

  IF v_current_locked < p_amount_cents THEN
    RETURN QUERY SELECT false, v_current_locked, 'Insufficient locked funds'::text;
    RETURN;
  END IF;

  -- Deduct from locked
  v_new_locked := v_current_locked - p_amount_cents;

  UPDATE wallet_balance
  SET locked_withdrawal_cents = v_new_locked
  WHERE user_id = p_user_id;

  -- Write ledger DEBIT for withdrawal
  INSERT INTO wallet_ledger (
    user_id,
    transaction_type,
    amount_cents,
    balance_after_cents,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'withdrawal_completed',
    -p_amount_cents,
    (SELECT available_cents FROM wallet_balance WHERE user_id = p_user_id),
    format('Withdrawal completed: %s', p_stripe_payout_id),
    jsonb_build_object(
      'withdrawal_request_id', p_withdrawal_request_id,
      'stripe_payout_id', p_stripe_payout_id
    )
  );

  RETURN QUERY SELECT true, v_new_locked, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process deposit (credit available, write ledger CREDIT)
CREATE OR REPLACE FUNCTION process_deposit(
  p_user_id uuid,
  p_amount_cents int,
  p_deposit_intent_id uuid,
  p_stripe_payment_intent_id text
)
RETURNS TABLE (
  success boolean,
  new_balance_cents bigint,
  error_message text
) AS $$
DECLARE
  v_new_balance bigint;
BEGIN
  -- Ensure wallet exists
  INSERT INTO wallet_balance (user_id, available_cents, locked_cents, locked_withdrawal_cents)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Credit available balance
  UPDATE wallet_balance
  SET available_cents = available_cents + p_amount_cents
  WHERE user_id = p_user_id
  RETURNING available_cents INTO v_new_balance;

  -- Write ledger CREDIT
  INSERT INTO wallet_ledger (
    user_id,
    transaction_type,
    amount_cents,
    balance_after_cents,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'deposit_completed',
    p_amount_cents,
    v_new_balance,
    format('Deposit completed: %s', p_stripe_payment_intent_id),
    jsonb_build_object(
      'deposit_intent_id', p_deposit_intent_id,
      'stripe_payment_intent_id', p_stripe_payment_intent_id
    )
  );

  RETURN QUERY SELECT true, v_new_balance, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_deposit_intents_stripe_payment_intent
  ON deposit_intents(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_stripe_payout
  ON withdrawal_requests(stripe_payout_id) WHERE stripe_payout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_provider_events_signature
  ON provider_events(provider_name, signature_verified, processed);