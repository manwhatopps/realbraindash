/*
  # Add Biometric/Passkey Preferences

  1. New Table
    - `user_biometric_preferences` - Stores biometric login preferences

  2. Purpose
    - Future-ready for biometric/passkey authentication
    - Stores user opt-in preferences
    - Placeholder for credential storage

  3. Security
    - RLS enabled
    - Users can only view/update their own preferences
*/

CREATE TABLE IF NOT EXISTS user_biometric_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Biometric opt-in flags
  biometric_enabled boolean NOT NULL DEFAULT false,
  passkey_enabled boolean NOT NULL DEFAULT false,
  
  -- Device tracking
  device_name text,
  device_platform text,
  last_biometric_login timestamptz,
  
  -- Credential storage (for future WebAuthn implementation)
  credentials_json jsonb DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_platform CHECK (device_platform IN ('ios', 'android', 'macos', 'windows', 'linux', 'other', NULL))
);

-- Enable RLS
ALTER TABLE user_biometric_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own biometric preferences"
  ON user_biometric_preferences FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own biometric preferences"
  ON user_biometric_preferences FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own biometric preferences"
  ON user_biometric_preferences FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_biometric_preferences_user ON user_biometric_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_biometric_preferences_enabled ON user_biometric_preferences(biometric_enabled, passkey_enabled) WHERE biometric_enabled = true OR passkey_enabled = true;

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
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_user_biometric_preferences') THEN
    CREATE TRIGGER trigger_update_user_biometric_preferences
      BEFORE UPDATE ON user_biometric_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Helper function to get user's biometric preferences
CREATE OR REPLACE FUNCTION get_user_biometric_prefs(p_user_id uuid)
RETURNS TABLE (
  biometric_enabled boolean,
  passkey_enabled boolean,
  device_name text,
  last_login timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ubp.biometric_enabled,
    ubp.passkey_enabled,
    ubp.device_name,
    ubp.last_biometric_login
  FROM user_biometric_preferences ubp
  WHERE ubp.user_id = p_user_id;
END;
$$;

COMMENT ON TABLE user_biometric_preferences IS 
  'Stores user preferences for biometric/passkey authentication (future feature)';
COMMENT ON COLUMN user_biometric_preferences.credentials_json IS 
  'Placeholder for WebAuthn credential data - not yet implemented';
