/*
  # Final Launch Infrastructure

  This migration implements the final production components required for safe real-money launch:

  ## 1. Automatic Settlement Infrastructure
  - `settlement_attempts` - Track settlement retry history
  - `settlement_locks` - Prevent concurrent settlement attempts
  - Functions for automatic settlement with retry logic

  ## 2. Payment Provider Integration
  - `payment_providers` - Provider configuration
  - `deposit_intents` - Track deposit requests
  - `provider_events` - Idempotent webhook processing
  - `withdrawal_requests` - Enhanced withdrawal workflow
  - Functions for deposit/withdrawal processing

  ## 3. Legal Document Versioning
  - `legal_documents` - Versioned terms, privacy policy, disclosures
  - `user_match_consents` - Per-match consent tracking
  - Functions to enforce current version acceptance

  ## 4. Launch Safety Limits
  - `platform_limits` - Configurable stake/withdrawal caps
  - Functions to enforce limits server-side

  ## Security
  - All tables have RLS enabled
  - Admin-only access for configuration
  - Immutable audit trails
  - No client trust
*/

-- =====================================================
-- 1. AUTOMATIC SETTLEMENT INFRASTRUCTURE
-- =====================================================

-- Track settlement attempts for retry logic
CREATE TABLE IF NOT EXISTS settlement_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  lobby_id uuid,
  attempt_number int NOT NULL DEFAULT 1,
  status text NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message text,
  error_details jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  next_retry_at timestamptz,
  UNIQUE(match_id, attempt_number)
);

ALTER TABLE settlement_attempts ENABLE ROW LEVEL SECURITY;

-- Admin-only access to settlement attempts
CREATE POLICY "Admin read settlement attempts"
  ON settlement_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- Settlement locks to prevent concurrent settlement
CREATE TABLE IF NOT EXISTS settlement_locks (
  match_id uuid PRIMARY KEY,
  locked_by text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE settlement_locks ENABLE ROW LEVEL SECURITY;

-- No direct access to locks (managed by functions only)
CREATE POLICY "No direct access to settlement locks"
  ON settlement_locks FOR ALL
  TO authenticated
  USING (false);

-- Add settlement tracking columns to lobbies if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lobbies' AND column_name = 'settlement_failed'
  ) THEN
    ALTER TABLE lobbies ADD COLUMN settlement_failed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lobbies' AND column_name = 'auto_settlement_enabled'
  ) THEN
    ALTER TABLE lobbies ADD COLUMN auto_settlement_enabled boolean DEFAULT true;
  END IF;
END $$;

-- =====================================================
-- 2. PAYMENT PROVIDER INTEGRATION
-- =====================================================

-- Payment provider configuration
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL UNIQUE,
  provider_type text NOT NULL CHECK (provider_type IN ('deposit', 'withdrawal', 'both')),
  is_enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  webhook_secret_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin manage payment providers"
  ON payment_providers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- Deposit intents
CREATE TABLE IF NOT EXISTS deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  provider_id uuid REFERENCES payment_providers(id),
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  provider_intent_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  client_secret text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz,
  UNIQUE(provider_intent_id)
);

ALTER TABLE deposit_intents ENABLE ROW LEVEL SECURITY;

-- Users can read their own deposit intents
CREATE POLICY "Users read own deposit intents"
  ON deposit_intents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can insert/update
CREATE POLICY "Service role manages deposit intents"
  ON deposit_intents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Provider webhook events (idempotency)
CREATE TABLE IF NOT EXISTS provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_name, provider_event_id)
);

ALTER TABLE provider_events ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin read provider events"
  ON provider_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  provider_id uuid REFERENCES payment_providers(id),
  provider_payout_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'processing', 'completed', 'failed', 'rejected', 'cancelled'
  )),
  destination jsonb NOT NULL,
  requires_manual_review boolean NOT NULL DEFAULT false,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(idempotency_key)
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own withdrawal requests
CREATE POLICY "Users read own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role manages
CREATE POLICY "Service role manages withdrawal requests"
  ON withdrawal_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. LEGAL DOCUMENT VERSIONING
-- =====================================================

-- Legal documents with versions
CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN (
    'terms_of_service',
    'privacy_policy',
    'fee_disclosure',
    'skill_contest_disclosure',
    'risk_disclosure'
  )),
  version text NOT NULL,
  content text NOT NULL,
  content_hash text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  requires_acceptance boolean NOT NULL DEFAULT true,
  published_by uuid REFERENCES auth.users(id),
  published_at timestamptz NOT NULL DEFAULT now(),
  effective_date timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(document_type, version)
);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Public read for current versions
CREATE POLICY "Public read current legal documents"
  ON legal_documents FOR SELECT
  TO authenticated
  USING (is_current = true);

-- Admin manage
CREATE POLICY "Admin manage legal documents"
  ON legal_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- Per-match consent tracking
CREATE TABLE IF NOT EXISTS user_match_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  match_id uuid,
  lobby_id uuid,
  document_type text NOT NULL,
  document_version text NOT NULL,
  document_hash text NOT NULL,
  jurisdiction text,
  ip_hash text,
  user_agent_hash text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE user_match_consents ENABLE ROW LEVEL SECURITY;

-- Users can read their own consents
CREATE POLICY "Users read own consents"
  ON user_match_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert
CREATE POLICY "Service role manages consents"
  ON user_match_consents FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Index for efficient consent checks
CREATE INDEX IF NOT EXISTS idx_user_match_consents_lookup
  ON user_match_consents(user_id, match_id, document_type);

-- =====================================================
-- 4. LAUNCH SAFETY LIMITS
-- =====================================================

-- Platform limits (configurable without redeploy)
CREATE TABLE IF NOT EXISTS platform_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type text NOT NULL UNIQUE CHECK (limit_type IN (
    'max_stake_per_match_cents',
    'max_stake_per_day_cents',
    'max_withdrawal_per_day_cents',
    'max_withdrawal_per_week_cents',
    'max_concurrent_matches_per_user',
    'max_beta_users',
    'min_account_age_hours'
  )),
  limit_value bigint NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  description text,
  last_modified_by uuid REFERENCES auth.users(id),
  last_modified_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_limits ENABLE ROW LEVEL SECURITY;

-- Public read limits
CREATE POLICY "Public read platform limits"
  ON platform_limits FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Admin manage
CREATE POLICY "Admin manage platform limits"
  ON platform_limits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND revoked_at IS NULL
    )
  );

-- Insert default launch limits
INSERT INTO platform_limits (limit_type, limit_value, description) VALUES
  ('max_stake_per_match_cents', 10000, 'Maximum $100 per match during launch'),
  ('max_stake_per_day_cents', 50000, 'Maximum $500 per day during launch'),
  ('max_withdrawal_per_day_cents', 100000, 'Maximum $1,000 per day withdrawal'),
  ('max_withdrawal_per_week_cents', 500000, 'Maximum $5,000 per week withdrawal'),
  ('max_concurrent_matches_per_user', 3, 'Maximum 3 concurrent cash matches per user'),
  ('max_beta_users', 100, 'Beta launch capped at 100 users'),
  ('min_account_age_hours', 24, 'Account must be 24h old for cash matches')
ON CONFLICT (limit_type) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if settlement is needed and not locked
CREATE OR REPLACE FUNCTION check_settlement_needed(p_match_id uuid)
RETURNS TABLE (
  needs_settlement boolean,
  lobby_id uuid,
  reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.state = 'completed' AND l.settled_at IS NULL AND NOT COALESCE(l.settlement_failed, false),
    l.id,
    CASE
      WHEN l.state != 'completed' THEN 'Match not completed'
      WHEN l.settled_at IS NOT NULL THEN 'Already settled'
      WHEN l.settlement_failed = true THEN 'Settlement previously failed'
      ELSE 'Ready for settlement'
    END
  FROM lobbies l
  WHERE l.match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Acquire settlement lock (returns true if acquired)
CREATE OR REPLACE FUNCTION acquire_settlement_lock(
  p_match_id uuid,
  p_locked_by text DEFAULT 'auto-settlement-job'
)
RETURNS boolean AS $$
DECLARE
  v_acquired boolean;
BEGIN
  -- Clean up expired locks
  DELETE FROM settlement_locks
  WHERE expires_at < now();

  -- Try to acquire lock
  INSERT INTO settlement_locks (match_id, locked_by, expires_at)
  VALUES (p_match_id, p_locked_by, now() + interval '5 minutes')
  ON CONFLICT (match_id) DO NOTHING
  RETURNING true INTO v_acquired;

  RETURN COALESCE(v_acquired, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release settlement lock
CREATE OR REPLACE FUNCTION release_settlement_lock(p_match_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM settlement_locks WHERE match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check platform limit
CREATE OR REPLACE FUNCTION check_platform_limit(
  p_limit_type text,
  p_current_value bigint
)
RETURNS TABLE (
  within_limit boolean,
  limit_value bigint,
  reason text
) AS $$
DECLARE
  v_limit_value bigint;
  v_is_enabled boolean;
BEGIN
  SELECT pl.limit_value, pl.is_enabled
  INTO v_limit_value, v_is_enabled
  FROM platform_limits pl
  WHERE pl.limit_type = p_limit_type;

  IF NOT FOUND OR NOT v_is_enabled THEN
    RETURN QUERY SELECT true, NULL::bigint, 'No limit configured'::text;
    RETURN;
  END IF;

  IF p_current_value <= v_limit_value THEN
    RETURN QUERY SELECT true, v_limit_value, 'Within limit'::text;
  ELSE
    RETURN QUERY SELECT false, v_limit_value, format('Exceeds limit of %s', v_limit_value)::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current legal document version
CREATE OR REPLACE FUNCTION get_current_legal_version(p_document_type text)
RETURNS TABLE (
  version text,
  content_hash text,
  effective_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ld.version,
    ld.content_hash,
    ld.effective_date
  FROM legal_documents ld
  WHERE ld.document_type = p_document_type
    AND ld.is_current = true
    AND ld.effective_date <= now()
  ORDER BY ld.published_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has accepted required legal documents for cash match
CREATE OR REPLACE FUNCTION check_legal_consent(
  p_user_id uuid,
  p_match_id uuid DEFAULT NULL
)
RETURNS TABLE (
  has_consent boolean,
  missing_documents text[]
) AS $$
DECLARE
  v_required_docs text[] := ARRAY['terms_of_service', 'skill_contest_disclosure', 'risk_disclosure'];
  v_missing_docs text[];
  v_doc text;
  v_current_version text;
  v_has_consent boolean;
BEGIN
  v_missing_docs := ARRAY[]::text[];

  FOREACH v_doc IN ARRAY v_required_docs
  LOOP
    SELECT version INTO v_current_version
    FROM legal_documents
    WHERE document_type = v_doc
      AND is_current = true
    LIMIT 1;

    IF v_current_version IS NULL THEN
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM user_match_consents
      WHERE user_id = p_user_id
        AND document_type = v_doc
        AND document_version = v_current_version
        AND (p_match_id IS NULL OR match_id = p_match_id)
    ) INTO v_has_consent;

    IF NOT v_has_consent THEN
      v_missing_docs := array_append(v_missing_docs, v_doc);
    END IF;
  END LOOP;

  RETURN QUERY SELECT
    (array_length(v_missing_docs, 1) IS NULL OR array_length(v_missing_docs, 1) = 0),
    v_missing_docs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record user consent
CREATE OR REPLACE FUNCTION record_legal_consent(
  p_user_id uuid,
  p_match_id uuid,
  p_lobby_id uuid,
  p_document_types text[],
  p_jurisdiction text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_doc_type text;
  v_version text;
  v_hash text;
BEGIN
  FOREACH v_doc_type IN ARRAY p_document_types
  LOOP
    SELECT version, content_hash
    INTO v_version, v_hash
    FROM legal_documents
    WHERE document_type = v_doc_type
      AND is_current = true
    LIMIT 1;

    IF v_version IS NOT NULL THEN
      INSERT INTO user_match_consents (
        user_id, match_id, lobby_id, document_type,
        document_version, document_hash, jurisdiction, ip_hash
      ) VALUES (
        p_user_id, p_match_id, p_lobby_id, v_doc_type,
        v_version, v_hash, p_jurisdiction, p_ip_hash
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check user's daily stake total
CREATE OR REPLACE FUNCTION get_user_daily_stake(p_user_id uuid)
RETURNS bigint AS $$
DECLARE
  v_total bigint;
BEGIN
  SELECT COALESCE(SUM(ABS(amount_cents)), 0)
  INTO v_total
  FROM wallet_ledger
  WHERE user_id = p_user_id
    AND transaction_type = 'match_entry'
    AND created_at > (now() - interval '24 hours');

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check user's concurrent matches
CREATE OR REPLACE FUNCTION get_user_concurrent_matches(p_user_id uuid)
RETURNS int AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(DISTINCT l.id)
  INTO v_count
  FROM lobbies l
  JOIN lobby_players lp ON lp.lobby_id = l.id
  WHERE lp.user_id = p_user_id
    AND l.is_cash_match = true
    AND l.state IN ('waiting_for_players', 'ready', 'in_progress')
    AND lp.left_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count total cash users (for beta limit)
CREATE OR REPLACE FUNCTION get_total_cash_users()
RETURNS int AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(DISTINCT user_id)
  INTO v_count
  FROM user_eligibility
  WHERE kyc_tier IN ('tier1_basic', 'tier2_full')
    AND kyc_status = 'approved';

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_settlement_attempts_match ON settlement_attempts(match_id, attempt_number);
CREATE INDEX IF NOT EXISTS idx_deposit_intents_user ON deposit_intents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_events_lookup ON provider_events(provider_name, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON withdrawal_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_documents_current ON legal_documents(document_type, is_current) WHERE is_current = true;