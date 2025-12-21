/*
  # Update to Two-Tier System (T2 and T3 Only)

  1. Changes
    - Remove T0 and T1 from verification_tier constraint
    - Update default tier to NULL (no tier until KYC)
    - Update wallet_limits view to only show T2 and T3
    - Add unverified state for users who haven't completed KYC
    - All users must complete KYC to play cash matches

  2. Tiers
    - T2: Verified Competitor (KYC required) - Base tier, all cash matches
    - T3: Elite Competitor (EDD required) - VIP, high-stakes, tournaments

  3. Philosophy
    - No unverified play for cash
    - Free play available without verification
    - KYC is mandatory for any cash gameplay
*/

-- Drop old constraint and add new one
ALTER TABLE user_verification_profiles
DROP CONSTRAINT IF EXISTS user_verification_profiles_verification_tier_check;

ALTER TABLE user_verification_profiles
ADD CONSTRAINT user_verification_profiles_verification_tier_check
CHECK (verification_tier IN ('T2', 'T3'));

-- Update default to NULL (no tier until verified)
ALTER TABLE user_verification_profiles
ALTER COLUMN verification_tier DROP DEFAULT;

-- Recreate wallet_limits view with only T2 and T3
DROP VIEW IF EXISTS wallet_limits;

CREATE OR REPLACE VIEW wallet_limits AS
SELECT
  'T2'::text AS verification_tier,
  2500::numeric AS max_deposit_30d,
  5000::numeric AS max_withdraw_30d,
  true AS can_deposit,
  true AS can_withdraw,
  true AS can_cash_matches,
  false AS can_vip_matches
UNION ALL
SELECT
  'T3'::text AS verification_tier,
  10000::numeric AS max_deposit_30d,
  20000::numeric AS max_withdraw_30d,
  true AS can_deposit,
  true AS can_withdraw,
  true AS can_cash_matches,
  true AS can_vip_matches;

-- Drop and recreate helper function with updated signature
DROP FUNCTION IF EXISTS get_user_tier(uuid);

CREATE OR REPLACE FUNCTION get_user_tier(p_user_id uuid)
RETURNS TABLE (
  tier text,
  status text,
  can_deposit boolean,
  can_withdraw boolean,
  can_cash_matches boolean,
  can_vip_matches boolean,
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
    uvp.verification_tier AS tier,
    COALESCE(uvp.verification_status, 'unverified') AS status,
    COALESCE(wl.can_deposit, false) AS can_deposit,
    COALESCE(wl.can_withdraw, false) AS can_withdraw,
    COALESCE(wl.can_cash_matches, false) AS can_cash_matches,
    COALESCE(wl.can_vip_matches, false) AS can_vip_matches,
    COALESCE(wl.max_deposit_30d, 0) AS max_deposit,
    COALESCE(wl.max_withdraw_30d, 0) AS max_withdraw
  FROM (SELECT p_user_id AS user_id) u
  LEFT JOIN user_verification_profiles uvp ON uvp.user_id = u.user_id
  LEFT JOIN wallet_limits wl ON wl.verification_tier = uvp.verification_tier;
END;
$$;

-- Drop and recreate can_user_action to handle NULL tier (unverified users)
DROP FUNCTION IF EXISTS can_user_action(uuid, text, bigint);

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
  v_can_cash_matches boolean;
  v_can_vip_matches boolean;
  v_total_deposits bigint;
  v_total_withdrawals bigint;
  v_result jsonb;
BEGIN
  -- Get user tier info
  SELECT tier, status, max_deposit, max_withdraw, can_deposit, can_withdraw, can_cash_matches, can_vip_matches
  INTO v_tier, v_status, v_max_deposit, v_max_withdraw, v_can_deposit, v_can_withdraw, v_can_cash_matches, v_can_vip_matches
  FROM get_user_tier(p_user_id);

  -- Get 30-day totals
  SELECT total_deposits_cents, total_withdrawals_cents
  INTO v_total_deposits, v_total_withdrawals
  FROM get_30day_totals(p_user_id);

  -- Check deposit
  IF p_action_type = 'deposit' THEN
    IF v_tier IS NULL OR v_status != 'verified' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', COALESCE(v_tier, 'unverified'),
        'code', 'NEEDS_KYC',
        'reason', 'You must complete identity verification (KYC) before making deposits.'
      );
    END IF;

    IF NOT v_can_deposit THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_KYC',
        'reason', 'Deposits require verified identity. Complete KYC verification to continue.'
      );
    END IF;

    IF (v_total_deposits + p_amount_cents) > (v_max_deposit * 100) THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'LIMIT_EXCEEDED',
        'reason', 'You''ve reached your 30-day deposit limit of $' || v_max_deposit || '. Upgrade to Tier 3 for higher limits.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  -- Check withdrawal
  IF p_action_type = 'withdraw' THEN
    IF v_tier IS NULL OR v_status != 'verified' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', COALESCE(v_tier, 'unverified'),
        'code', 'NEEDS_KYC',
        'reason', 'You must complete identity verification (KYC) before withdrawing funds.'
      );
    END IF;

    IF NOT v_can_withdraw THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_KYC',
        'reason', 'Withdrawals require verified identity. Complete KYC verification to cash out.'
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
    IF v_tier IS NULL OR v_status != 'verified' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', COALESCE(v_tier, 'unverified'),
        'code', 'NEEDS_KYC',
        'reason', 'Cash matches require identity verification (KYC). Complete verification to compete for real money.'
      );
    END IF;

    IF NOT v_can_cash_matches THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_KYC',
        'reason', 'You must complete identity verification before playing cash matches.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  -- Check VIP/high-stakes entry
  IF p_action_type = 'enter_vip' OR p_action_type = 'enter_high_stakes' THEN
    IF v_tier IS NULL OR v_status != 'verified' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', COALESCE(v_tier, 'unverified'),
        'code', 'NEEDS_KYC',
        'reason', 'VIP matches require identity verification. Complete KYC first.'
      );
    END IF;

    IF v_tier != 'T3' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_T3',
        'reason', 'VIP and high-stakes modes are exclusive to Tier 3 Elite players. Upgrade your verification for access.'
      );
    END IF;

    IF NOT v_can_vip_matches THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'tier', v_tier,
        'code', 'NEEDS_T3',
        'reason', 'Upgrade to Tier 3 (Elite Competitor) to access VIP matches.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  -- Default: deny unknown actions
  RETURN jsonb_build_object(
    'allowed', false,
    'tier', COALESCE(v_tier, 'unverified'),
    'code', 'UNKNOWN_ACTION',
    'reason', 'Unknown action type'
  );
END;
$$;

-- Add comment
COMMENT ON FUNCTION can_user_action IS 'Checks if user can perform action. All users must have T2 (KYC) minimum for cash play. T3 (EDD) required for VIP/high-stakes.';
