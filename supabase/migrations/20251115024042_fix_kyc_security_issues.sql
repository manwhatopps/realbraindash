/*
  # Fix KYC Security and Performance Issues

  1. Security Fixes
    - Update RLS policies to use (select auth.uid()) for better performance
    - Fix function search_path to be immutable
  
  2. Performance Fixes
    - Remove unused indexes that aren't being utilized
  
  3. Changes Made
    - Drop and recreate all RLS policies with proper auth.uid() wrapping
    - Drop unused indexes (they can be added back if needed later)
    - Add SECURITY DEFINER and search_path to trigger function
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own KYC status" ON user_kyc_status;
DROP POLICY IF EXISTS "Users can insert own KYC status" ON user_kyc_status;
DROP POLICY IF EXISTS "Users can update own KYC status" ON user_kyc_status;

-- Recreate policies with proper auth.uid() wrapping for performance
-- This prevents re-evaluation of auth.uid() for each row

CREATE POLICY "Users can read own KYC status"
  ON user_kyc_status
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own KYC status"
  ON user_kyc_status
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own KYC status"
  ON user_kyc_status
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop unused indexes
-- Note: The primary key on user_id already provides efficient lookups
-- These indexes were created proactively but aren't currently being used
DROP INDEX IF EXISTS idx_user_kyc_status_user_id;
DROP INDEX IF EXISTS idx_user_kyc_status_kyc_status;

-- Fix the trigger function to have a stable search_path
-- Drop and recreate with SECURITY DEFINER and explicit search_path
DROP FUNCTION IF EXISTS update_user_kyc_status_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_user_kyc_status_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_user_kyc_status_updated_at ON user_kyc_status;

CREATE TRIGGER trigger_update_user_kyc_status_updated_at
  BEFORE UPDATE ON user_kyc_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_kyc_status_updated_at();
