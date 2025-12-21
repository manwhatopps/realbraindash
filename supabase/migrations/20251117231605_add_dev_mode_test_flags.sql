/*
  # Add Test Mode Flags for Dev Environment

  1. Changes
    - Add is_test column to cash_matches
    - Add is_test column to wallet_ledger
    - Add is_test column to cash_match_players
    - Add is_test column to cash_match_escrows

  2. Purpose
    - Allow filtering of test/dev data from production data
    - Enable safe development testing without polluting real data
    - Support dev mode workflow

  3. Security
    - These flags only mark data as test data
    - RLS policies remain unchanged
    - Production builds will never set is_test = true
*/

-- Add is_test flag to cash_matches
ALTER TABLE cash_matches 
ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- Add is_test flag to wallet_ledger
ALTER TABLE wallet_ledger 
ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- Add is_test flag to cash_match_players
ALTER TABLE cash_match_players 
ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- Add is_test flag to cash_match_escrows
ALTER TABLE cash_match_escrows 
ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- Create indexes for filtering test data
CREATE INDEX IF NOT EXISTS idx_cash_matches_is_test ON cash_matches(is_test);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_is_test ON wallet_ledger(is_test);

-- Create view for production matches only (excluding test data)
CREATE OR REPLACE VIEW production_cash_matches AS
SELECT * FROM cash_matches WHERE is_test = false;

-- Create view for production ledger only (excluding test data)
CREATE OR REPLACE VIEW production_wallet_ledger AS
SELECT * FROM wallet_ledger WHERE is_test = false;

-- Function to clean up test data (use with caution!)
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete test match players
  DELETE FROM cash_match_players WHERE is_test = true;
  
  -- Delete test match escrows
  DELETE FROM cash_match_escrows WHERE is_test = true;
  
  -- Delete test matches
  DELETE FROM cash_matches WHERE is_test = true;
  
  -- Delete test wallet ledger entries
  DELETE FROM wallet_ledger WHERE is_test = true;
  
  RAISE NOTICE 'Test data cleanup complete';
END;
$$;

COMMENT ON FUNCTION cleanup_test_data() IS 
  'Removes all test data created in dev mode. Use with caution!';
