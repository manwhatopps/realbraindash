/*
  # Add Verification Tier System

  1. New Columns on auth.users metadata
    - verification_tier (T0, T1, T2, T3)
    - verification_status (unverified, pending, verified, rejected, review_required)
    - verification_last_updated
    - verification_notes

  2. New Table: compliance_events
    - Logs all KYC/AML/compliance actions
    - Tracks tier changes, verifications, limit blocks

  3. New Table: user_verification_data
    - Stores verification details securely
    - KYC data, documents, approval status

  4. New View: wallet_limits
    - Maps tier to deposit/withdrawal limits

  5. Security
    - RLS on all tables
    - Only users can view their own data
    - Compliance events for audit trail
*/

-- Add verification columns to user metadata (stored in separate table)
CREATE TABLE IF NOT EXISTS user_verification_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tier information
  verification_tier text NOT NULL DEFAULT 'T0' CHECK (verification_tier IN ('T0', 'T1', 'T2', 'T3')),
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'review_required')),
  verification_last_updated timestamptz,
  verification_notes text,
  
  -- T2 (KYC) data
  legal_name text,
  date_of_birth date,
  address_line1 text,
  address_line2 text,
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
  
  -- T3 (EDD) data
  proof_of_address_uploaded_at timestamptz,
  proof_of_income_uploaded_at timestamptz,
  source_of_funds_description text,
  two_factor_enabled boolean DEFAULT false,
  manual_approval_at timestamptz,
  approved_by text,
  edd_completed_at timestamptz,
  
  -- Tracking
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Compliance events log
CREATE TABLE IF NOT EXISTS compliance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'tier_change',
    'kyc_started',
    'kyc_completed',
    'kyc_rejected',
    'edd_started',
    'edd_completed',
    'manual_review_requested',
    'manual_review_completed',
    'deposit_blocked',
    'withdrawal_blocked',
    'limit_exceeded',
    'geo_block',
    'fraud_flag',
    'account_suspended',
    'account_reinstated'
  )),
  from_tier text,
  to_tier text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by text
);

-- Wallet limits view
CREATE OR REPLACE VIEW wallet_limits AS
SELECT
  'T0'::text AS verification_tier,
  0::numeric AS max_deposit_30d,
  0::numeric AS max_withdraw_30d,
  false AS can_deposit,
  false AS can_withdraw,
  false AS can_cash_matches
UNION ALL
SELECT
  'T1'::text AS verification_tier,
  500::numeric AS max_deposit_30d,
  0::numeric AS max_withdraw_30d,
  true AS can_deposit,
  false AS can_withdraw,
  false AS can_cash_matches
UNION ALL
SELECT
  'T2'::text AS verification_tier,
  2500::numeric AS max_deposit_30d,
  5000::numeric AS max_withdraw_30d,
  true AS can_deposit,
  true AS can_withdraw,
  true AS can_cash_matches
UNION ALL
SELECT
  'T3'::text AS verification_tier,
  10000::numeric AS max_deposit_30d,
  20000::numeric AS max_withdraw_30d,
  true AS can_deposit,
  true AS can_withdraw,
  true AS can_cash_matches;

-- Enable RLS
ALTER TABLE user_verification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: user_verification_profiles
CREATE POLICY "Users can view own verification profile"
  ON user_verification_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own verification profile"
  ON user_verification_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own verification profile"
  ON user_verification_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- RLS Policies: compliance_events
CREATE POLICY "Users can view own compliance events"
  ON compliance_events FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_verification_profiles_user ON user_verification_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_profiles_tier ON user_verification_profiles(verification_tier);
CREATE INDEX IF NOT EXISTS idx_user_verification_profiles_status ON user_verification_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_compliance_events_user ON compliance_events(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_type ON compliance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_events_created ON compliance_events(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_user_verification_profiles') THEN
    CREATE TRIGGER trigger_update_user_verification_profiles
      BEFORE UPDATE ON user_verification_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Helper function: Get user's current tier
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id uuid)
RETURNS TABLE (
  tier text,
  status text,
  can_deposit boolean,
  can_withdraw boolean,
  max_deposit numeric,
  max_withdraw numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(uvp.verification_tier, 'T0') AS tier,
    COALESCE(uvp.verification_status, 'unverified') AS status,
    wl.can_deposit,
    wl.can_withdraw,
    wl.max_deposit_30d,
    wl.max_withdraw_30d
  FROM (SELECT p_user_id AS user_id) u
  LEFT JOIN user_verification_profiles uvp ON uvp.user_id = u.user_id
  LEFT JOIN wallet_limits wl ON wl.verification_tier = COALESCE(uvp.verification_tier, 'T0');
END;
$$;

-- Helper function: Get 30-day deposit/withdrawal totals
CREATE OR REPLACE FUNCTION get_30day_totals(p_user_id uuid)
RETURNS TABLE (
  total_deposits_cents bigint,
  total_withdrawals_cents bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount_cents ELSE 0 END), 0) AS total_deposits_cents,
    COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount_cents ELSE 0 END), 0) AS total_withdrawals_cents
  FROM wallet_ledger
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days'
    AND status = 'completed';
END;
$$;

-- Helper function: Check if action is allowed
CREATE OR REPLACE FUNCTION can_user_action(
  p_user_id uuid,
  p_action_type text,
  p_amount_cents bigint DEFAULT 0
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier text;
  v_status text;
  v_max_deposit numeric;
  v_max_withdraw numeric;
  v_can_deposit boolean;
  v_can_withdraw boolean;
  v_total_deposits bigint;
  v_total_withdrawals bigint;
  v_result jsonb;
BEGIN
  -- Get user tier info
  SELECT tier, status, max_deposit_30d, max_withdraw_30d, can_deposit, can_withdraw
  INTO v_tier, v_status, v_max_deposit, v_max_withdraw, v_can_deposit, v_can_withdraw
  FROM get_user_tier(p_user_id);

  -- Get 30-day totals
  SELECT total_deposits_cents, total_withdrawals_cents
  INTO v_total_deposits, v_total_withdrawals
  FROM get_30day_totals(p_user_id);

  -- Check deposit
  IF p_action_type = 'deposit' THEN
    IF NOT v_can_deposit THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_T1',
        'reason', 'Deposits require at least Tier 1 verification. Start verification to add funds.'
      );
    END IF;

    IF (v_total_deposits + p_amount_cents) > (v_max_deposit * 100) THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'LIMIT_EXCEEDED',
        'reason', 'You''ve reached your 30-day deposit limit of $' || v_max_deposit || '. Upgrade your tier for higher limits.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  -- Check withdrawal
  IF p_action_type = 'withdraw' THEN
    IF v_tier = 'T0' OR v_tier = 'T1' OR v_status != 'verified' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_T2',
        'reason', 'Withdrawals are unlocked at Tier 2 (Verified Competitor). Start verification to cash out your winnings.'
      );
    END IF;

    IF NOT v_can_withdraw THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_T2',
        'reason', 'You must reach Tier 2 (Verified Competitor) before you can withdraw funds.'
      );
    END IF;

    IF (v_total_withdrawals + p_amount_cents) > (v_max_withdraw * 100) THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'LIMIT_EXCEEDED',
        'reason', 'You''ve reached your 30-day withdrawal limit of $' || v_max_withdraw || '. Upgrade to Tier 3 for higher limits.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  -- Check cash match entry
  IF p_action_type = 'enter_match' THEN
    IF v_tier = 'T0' OR v_tier = 'T1' OR v_status != 'verified' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_T2',
        'reason', 'Cash matches require Tier 2 verification. Start verification to compete for real money.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  -- Check VIP/high-stakes entry
  IF p_action_type = 'enter_vip' OR p_action_type = 'enter_high_stakes' THEN
    IF v_tier != 'T3' OR v_status != 'verified' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_T3',
        'reason', 'VIP and high-stakes modes are exclusive to Tier 3 Elite players. Upgrade your verification to join.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  -- Default: deny unknown actions
  RETURN jsonb_build_object(
    'allowed', false,
    'tier', v_tier,
    'code', 'UNKNOWN_ACTION',
    'reason', 'Unknown action type'
  );
END;
$$;

-- Trigger function: Log tier changes
CREATE OR REPLACE FUNCTION log_tier_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.verification_tier IS DISTINCT FROM NEW.verification_tier) THEN
    INSERT INTO compliance_events (user_id, event_type, from_tier, to_tier, details)
    VALUES (
      NEW.user_id,
      'tier_change',
      OLD.verification_tier,
      NEW.verification_tier,
      jsonb_build_object(
        'old_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'timestamp', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_tier_change') THEN
    CREATE TRIGGER trigger_log_tier_change
      AFTER UPDATE ON user_verification_profiles
      FOR EACH ROW
      EXECUTE FUNCTION log_tier_change();
  END IF;
END
$$;

COMMENT ON TABLE user_verification_profiles IS 'Stores user verification tier and KYC/EDD data';
COMMENT ON TABLE compliance_events IS 'Audit log for all compliance-related events';
COMMENT ON VIEW wallet_limits IS 'Maps verification tiers to deposit/withdrawal limits';
COMMENT ON FUNCTION can_user_action IS 'Checks if user can perform action based on tier and limits';
