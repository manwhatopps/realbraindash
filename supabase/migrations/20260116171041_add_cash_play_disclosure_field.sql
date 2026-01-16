/*
  # Add Cash Play Disclosure Acceptance Field

  1. Changes to user_verification_profiles
    - Add `cash_play_disclosure_accepted` boolean field (default: false)
    - This tracks whether user has seen and accepted the one-time disclosure
      about withdrawal verification requirements in TEST MODE Cash Play

  2. Security
    - Users can update only their own profile
    - Existing RLS policies already cover this

  3. Important Notes
    - This is informational only - no identity collection
    - Used only for TEST MODE Cash Play disclosure
    - Does NOT affect real Cash Play
*/

-- Add disclosure acceptance field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_verification_profiles'
    AND column_name = 'cash_play_disclosure_accepted'
  ) THEN
    ALTER TABLE user_verification_profiles
    ADD COLUMN cash_play_disclosure_accepted boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_verification_profiles_disclosure
ON user_verification_profiles(cash_play_disclosure_accepted);

COMMENT ON COLUMN user_verification_profiles.cash_play_disclosure_accepted IS 'Tracks if user has accepted the TEST MODE cash play disclosure about withdrawal verification requirements';
