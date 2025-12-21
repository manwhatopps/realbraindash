/*
  # Fix Security Issues

  1. Performance & Index Optimization
    - Add missing index for foreign key `admin_actions_target_match_id_fkey`
    - Drop 28 unused indexes to improve write performance

  2. Security Policy Consolidation
    - Consolidate multiple permissive SELECT policies on `cash_matches` table

  3. Security Definer Views
    - Convert SECURITY DEFINER views to SECURITY INVOKER for safer execution

  4. Function Security
    - Add explicit search_path to functions to prevent search_path manipulation attacks

  ## Security Impact
  - **High**: Prevents search_path manipulation attacks in functions and views
  - **Medium**: Improves query performance with proper indexing
  - **Low**: Reduces write overhead by removing unused indexes
*/

-- ============================================================================
-- 1. ADD MISSING INDEX FOR FOREIGN KEY
-- ============================================================================

-- Add index for admin_actions.target_match_id foreign key
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_match 
  ON public.admin_actions(target_match_id) 
  WHERE target_match_id IS NOT NULL;

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

-- Cash match players indexes
DROP INDEX IF EXISTS public.idx_cash_match_players_match;
DROP INDEX IF EXISTS public.idx_cash_match_players_user;

-- Test mode lobbies indexes
DROP INDEX IF EXISTS public.idx_test_mode_lobbies_code;
DROP INDEX IF EXISTS public.idx_test_mode_lobbies_status;
DROP INDEX IF EXISTS public.idx_test_mode_lobbies_created_by;

-- Test mode lobby players indexes
DROP INDEX IF EXISTS public.idx_test_mode_lobby_players_lobby;
DROP INDEX IF EXISTS public.idx_test_mode_lobby_players_user;

-- User biometric preferences indexes
DROP INDEX IF EXISTS public.idx_user_biometric_preferences_user;
DROP INDEX IF EXISTS public.idx_user_biometric_preferences_enabled;

-- Cash matches indexes
DROP INDEX IF EXISTS public.idx_cash_matches_room_code;
DROP INDEX IF EXISTS public.idx_cash_matches_is_test;
DROP INDEX IF EXISTS public.idx_cash_matches_status;
DROP INDEX IF EXISTS public.idx_cash_matches_creator;

-- Wallet ledger indexes
DROP INDEX IF EXISTS public.idx_wallet_ledger_user;
DROP INDEX IF EXISTS public.idx_wallet_ledger_match;
DROP INDEX IF EXISTS public.idx_wallet_ledger_is_test;

-- Compliance events indexes
DROP INDEX IF EXISTS public.idx_compliance_events_user;
DROP INDEX IF EXISTS public.idx_compliance_events_type;
DROP INDEX IF EXISTS public.idx_compliance_events_created;

-- User geo verifications indexes
DROP INDEX IF EXISTS public.idx_user_geo_verifications_user;
DROP INDEX IF EXISTS public.idx_user_geo_verifications_created;

-- Match audit logs indexes
DROP INDEX IF EXISTS public.idx_match_audit_logs_match;
DROP INDEX IF EXISTS public.idx_match_audit_logs_user;
DROP INDEX IF EXISTS public.idx_match_audit_logs_type;

-- Admin actions indexes (keep the new one we just created)
DROP INDEX IF EXISTS public.idx_admin_actions_admin;
DROP INDEX IF EXISTS public.idx_admin_actions_target_user;

-- Geo allowlist indexes
DROP INDEX IF EXISTS public.idx_geo_allowlist_lookup;

-- User verification profiles indexes
DROP INDEX IF EXISTS public.idx_user_verification_profiles_user;
DROP INDEX IF EXISTS public.idx_user_verification_profiles_tier;
DROP INDEX IF EXISTS public.idx_user_verification_profiles_status;

-- ============================================================================
-- 3. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- Drop existing SELECT policies on cash_matches
DROP POLICY IF EXISTS "Users can view matches they joined" ON public.cash_matches;
DROP POLICY IF EXISTS "Users can view public matches" ON public.cash_matches;

-- Create single consolidated SELECT policy
CREATE POLICY "Users can view accessible matches"
  ON public.cash_matches
  FOR SELECT
  TO authenticated
  USING (
    -- User is the creator
    creator_id = auth.uid()
    OR
    -- User has joined the match
    EXISTS (
      SELECT 1 FROM public.cash_match_players
      WHERE cash_match_players.match_id = cash_matches.id
      AND cash_match_players.user_id = auth.uid()
    )
    OR
    -- Match is public (not private)
    NOT is_private
  );

-- ============================================================================
-- 4. FIX SECURITY DEFINER VIEWS - Convert to SECURITY INVOKER
-- ============================================================================

-- Drop and recreate production_cash_matches view with SECURITY INVOKER
DROP VIEW IF EXISTS public.production_cash_matches;
CREATE VIEW public.production_cash_matches
WITH (security_invoker = true)
AS
SELECT *
FROM public.cash_matches
WHERE is_test = false;

-- Drop and recreate wallet_limits view with SECURITY INVOKER
DROP VIEW IF EXISTS public.wallet_limits;
CREATE VIEW public.wallet_limits
WITH (security_invoker = true)
AS
SELECT
  user_id,
  balance_cents,
  currency,
  created_at,
  updated_at
FROM public.user_wallets;

-- Drop and recreate production_wallet_ledger view with SECURITY INVOKER
DROP VIEW IF EXISTS public.production_wallet_ledger;
CREATE VIEW public.production_wallet_ledger
WITH (security_invoker = true)
AS
SELECT *
FROM public.wallet_ledger
WHERE is_test = false;

-- ============================================================================
-- 5. FIX FUNCTION SEARCH_PATH MUTABILITY
-- ============================================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix log_tier_change function
CREATE OR REPLACE FUNCTION public.log_tier_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  -- Log tier changes to compliance_events
  IF (TG_OP = 'UPDATE' AND OLD.verification_tier IS DISTINCT FROM NEW.verification_tier) THEN
    INSERT INTO public.compliance_events (
      user_id,
      event_type,
      from_tier,
      to_tier,
      details,
      created_by
    ) VALUES (
      NEW.user_id,
      'tier_change',
      OLD.verification_tier,
      NEW.verification_tier,
      jsonb_build_object(
        'old_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'verification_last_updated', NEW.verification_last_updated
      ),
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix generate_lobby_code function
CREATE OR REPLACE FUNCTION public.generate_lobby_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
