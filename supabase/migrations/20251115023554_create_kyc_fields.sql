/*
  # Add KYC (Know Your Customer) Fields for Identity Verification

  1. New Tables
    - `user_kyc_status`
      - `user_id` (uuid, primary key, references auth.users)
      - `kyc_status` (text) - Values: 'not_started', 'pending', 'verified', 'failed'
      - `kyc_vendor` (text, nullable) - e.g., 'placeholder', 'persona', 'stripe_identity'
      - `kyc_reference_id` (text, nullable) - External vendor reference ID
      - `created_at` (timestamptz) - When record was created
      - `updated_at` (timestamptz) - When status was last updated
  
  2. Security
    - Enable RLS on `user_kyc_status` table
    - Add policy for users to read their own KYC status
    - Add policy for authenticated users to update their own status (for initial creation)

  3. Important Notes
    - NO PII (Personal Identifiable Information) is stored in our database
    - Only status flags and vendor reference IDs are kept
    - Actual identity documents and data remain with the KYC vendor
*/

-- Create KYC status table
CREATE TABLE IF NOT EXISTS user_kyc_status (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kyc_status text NOT NULL DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'failed')),
  kyc_vendor text,
  kyc_reference_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_kyc_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own KYC status
CREATE POLICY "Users can read own KYC status"
  ON user_kyc_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own KYC status (first time)
CREATE POLICY "Users can insert own KYC status"
  ON user_kyc_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own KYC status
CREATE POLICY "Users can update own KYC status"
  ON user_kyc_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_kyc_status_user_id ON user_kyc_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_status_kyc_status ON user_kyc_status(kyc_status);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_kyc_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
CREATE TRIGGER trigger_update_user_kyc_status_updated_at
  BEFORE UPDATE ON user_kyc_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_kyc_status_updated_at();
