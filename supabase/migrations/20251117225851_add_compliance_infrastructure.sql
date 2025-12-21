/*
  # Compliance Infrastructure for Cash Gaming

  1. New Tables
    - `compliance_gates` - Tracks which compliance requirements are met
    - `user_geo_verifications` - Logs user location checks
    - `user_responsible_gaming` - Self-exclusion and limits
    - `match_audit_logs` - Detailed audit trail for matches
    - `admin_actions` - Tracks all administrative actions

  2. Security
    - All tables have RLS enabled
    - Only service role can write to audit logs
    - Users can view their own compliance status

  3. Purpose
    - Track compliance readiness
    - Enable geo-blocking when implemented
    - Support responsible gaming features
    - Provide full audit trail
*/

-- Compliance gates tracking
CREATE TABLE IF NOT EXISTS compliance_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_name text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  required_for_production boolean NOT NULL DEFAULT false,
  description text,
  last_verified_at timestamptz,
  verified_by text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Insert initial compliance gates
INSERT INTO compliance_gates (gate_name, required_for_production, description) VALUES
  ('legal_counsel_approval', true, 'Gaming attorney has reviewed and approved system'),
  ('kyc_vendor_integration', true, 'Live KYC vendor (Persona/Onfido/etc) is integrated'),
  ('geo_blocking_active', true, 'Real-time geo-blocking service is operational'),
  ('payment_processor_approved', true, 'Payment processor has approved cash gaming'),
  ('terms_and_conditions', true, 'Complete T&Cs drafted and reviewed by counsel'),
  ('privacy_policy', true, 'GDPR/CCPA compliant privacy policy in place'),
  ('responsible_gaming', true, 'Self-exclusion and limits features implemented'),
  ('aml_monitoring', true, 'AML transaction monitoring is active'),
  ('audit_logging', false, 'Comprehensive audit logging system operational'),
  ('fraud_detection', false, 'Device fingerprinting and fraud detection active')
ON CONFLICT (gate_name) DO NOTHING;

-- User geo-location verification logs
CREATE TABLE IF NOT EXISTS user_geo_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address inet,
  country_code text,
  region_code text,
  city text,
  latitude numeric,
  longitude numeric,
  is_allowed boolean NOT NULL DEFAULT false,
  blocked_reason text,
  verification_method text CHECK (verification_method IN ('ip', 'gps', 'manual')),
  verified_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT valid_region_code CHECK (region_code IS NULL OR region_code ~ '^[A-Z]{2}$')
);

-- Responsible gaming settings and self-exclusion
CREATE TABLE IF NOT EXISTS user_responsible_gaming (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Self-exclusion
  is_self_excluded boolean NOT NULL DEFAULT false,
  self_excluded_at timestamptz,
  self_excluded_until timestamptz,
  exclusion_reason text,
  
  -- Deposit limits (in cents)
  daily_deposit_limit_cents bigint DEFAULT 50000,
  weekly_deposit_limit_cents bigint DEFAULT 200000,
  monthly_deposit_limit_cents bigint DEFAULT 1000000,
  
  -- Wager limits (in cents)
  max_match_entry_cents bigint DEFAULT 10000,
  
  -- Time limits
  session_time_limit_minutes int DEFAULT 120,
  daily_time_limit_minutes int DEFAULT 240,
  
  -- Warnings
  time_warning_threshold_minutes int DEFAULT 60,
  loss_warning_threshold_cents bigint DEFAULT 10000,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Match audit logs (detailed server-side events)
CREATE TABLE IF NOT EXISTS match_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES cash_matches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'match_created', 'player_joined', 'match_started', 
    'question_answered', 'score_submitted', 'match_finalized',
    'payout_distributed', 'match_cancelled', 'player_disconnected',
    'fraud_flag', 'admin_action'
  ))
);

-- Admin actions audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_match_id uuid REFERENCES cash_matches(id) ON DELETE SET NULL,
  action_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  ip_address inet,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_action_type CHECK (action_type IN (
    'wallet_adjustment', 'manual_payout', 'match_void', 'user_ban',
    'user_unban', 'kyc_override', 'limit_override', 'self_exclusion_remove',
    'compliance_gate_update', 'refund_processed'
  ))
);

-- State/country allowlist for geo-blocking
CREATE TABLE IF NOT EXISTS geo_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  region_code text,
  is_allowed boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT unique_geo_location UNIQUE (country_code, region_code),
  CONSTRAINT valid_country CHECK (country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT valid_region CHECK (region_code IS NULL OR region_code ~ '^[A-Z]{2}$')
);

-- Insert US states allowlist (verify with legal counsel before enabling)
INSERT INTO geo_allowlist (country_code, region_code, is_allowed, notes) VALUES
  -- Blocked states (as of 2024 - VERIFY WITH LEGAL COUNSEL)
  ('US', 'AZ', false, 'Arizona - skill games restricted'),
  ('US', 'AR', false, 'Arkansas - skill games restricted'),
  ('US', 'CT', false, 'Connecticut - skill games restricted'),
  ('US', 'DE', false, 'Delaware - skill games restricted'),
  ('US', 'LA', false, 'Louisiana - skill games restricted'),
  ('US', 'MT', false, 'Montana - skill games restricted'),
  ('US', 'SC', false, 'South Carolina - skill games restricted'),
  ('US', 'SD', false, 'South Dakota - skill games restricted'),
  ('US', 'TN', false, 'Tennessee - skill games restricted'),
  ('US', 'WA', false, 'Washington - all online gaming banned'),
  
  -- Allowed states (example - verify all before launch)
  ('US', 'CA', true, 'California - skill games allowed'),
  ('US', 'NY', true, 'New York - skill games allowed'),
  ('US', 'TX', true, 'Texas - skill games allowed'),
  ('US', 'FL', true, 'Florida - skill games allowed')
ON CONFLICT (country_code, region_code) DO NOTHING;

-- Enable RLS
ALTER TABLE compliance_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_geo_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responsible_gaming ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_allowlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies: compliance_gates (read-only for all authenticated users)
CREATE POLICY "Anyone can view compliance gates"
  ON compliance_gates FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies: user_geo_verifications
CREATE POLICY "Users can view own geo verifications"
  ON user_geo_verifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RLS Policies: user_responsible_gaming
CREATE POLICY "Users can view own responsible gaming settings"
  ON user_responsible_gaming FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own responsible gaming settings"
  ON user_responsible_gaming FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own responsible gaming settings"
  ON user_responsible_gaming FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- RLS Policies: match_audit_logs (read-only for users in the match)
CREATE POLICY "Users can view audit logs for their matches"
  ON match_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cash_match_players
      WHERE cash_match_players.match_id = match_audit_logs.match_id
      AND cash_match_players.user_id = (select auth.uid())
    )
  );

-- RLS Policies: admin_actions (only admins can view - implement admin role later)
CREATE POLICY "Admins can view all admin actions"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (false);  -- TODO: Replace with admin role check

-- RLS Policies: geo_allowlist (everyone can read)
CREATE POLICY "Anyone can view geo allowlist"
  ON geo_allowlist FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_geo_verifications_user ON user_geo_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_geo_verifications_created ON user_geo_verifications(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_audit_logs_match ON match_audit_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_match_audit_logs_user ON match_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_match_audit_logs_type ON match_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_geo_allowlist_lookup ON geo_allowlist(country_code, region_code);

-- Triggers for updated_at
CREATE TRIGGER trigger_update_compliance_gates_updated_at
  BEFORE UPDATE ON compliance_gates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_responsible_gaming_updated_at
  BEFORE UPDATE ON user_responsible_gaming
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_geo_allowlist_updated_at
  BEFORE UPDATE ON geo_allowlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if all required compliance gates are enabled
CREATE OR REPLACE FUNCTION check_compliance_ready()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  gates_ready boolean;
BEGIN
  SELECT bool_and(is_enabled) INTO gates_ready
  FROM compliance_gates
  WHERE required_for_production = true;
  
  RETURN COALESCE(gates_ready, false);
END;
$$;

-- Function to check if user is in allowed geography
CREATE OR REPLACE FUNCTION check_user_geo_allowed(p_country_code text, p_region_code text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  geo_allowed boolean;
BEGIN
  SELECT is_allowed INTO geo_allowed
  FROM geo_allowlist
  WHERE country_code = p_country_code
  AND (region_code = p_region_code OR region_code IS NULL)
  LIMIT 1;
  
  RETURN COALESCE(geo_allowed, false);
END;
$$;

-- Function to check if user is self-excluded
CREATE OR REPLACE FUNCTION is_user_self_excluded(p_user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  excluded boolean;
  excluded_until timestamptz;
BEGIN
  SELECT is_self_excluded, self_excluded_until INTO excluded, excluded_until
  FROM user_responsible_gaming
  WHERE user_id = p_user_id;
  
  IF excluded AND (excluded_until IS NULL OR excluded_until > now()) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
