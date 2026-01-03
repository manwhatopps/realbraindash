/*
  # Remove Duplicate RLS Policies
  
  1. Purpose
    - Remove duplicate permissive RLS policies that provide identical access
    - Simplifies security model
    - Improves query planning performance
  
  2. Changes
    - Keep more descriptive policy names
    - Remove generic "secure_*" policies where they duplicate other policies
    - Keep separate admin/public policies where both are legitimately needed
  
  3. Security Impact
    - No change to actual security - policies being removed are exact duplicates
    - Maintains same access patterns
    - Clearer security model
*/

-- audit_events: Remove duplicate (both allow users to view own events)
DROP POLICY IF EXISTS "secure_audit_read" ON audit_events;

-- lobby_players: Remove duplicate (both allow viewing players in user's lobbies)
DROP POLICY IF EXISTS "secure_lobby_players_read" ON lobby_players;

-- match_players: Remove duplicate (both allow viewing own matches)
DROP POLICY IF EXISTS "secure_match_players_read" ON match_players;

-- wallet_ledger: Remove duplicates (all three do the same thing)
DROP POLICY IF EXISTS "secure_ledger_read" ON wallet_ledger;
DROP POLICY IF EXISTS "Users can view own ledger" ON wallet_ledger;

-- Note: legal_documents and platform_limits have TWO DIFFERENT policies:
-- - One for admin management (write access)
-- - One for public read access
-- These are NOT duplicates, so we keep both