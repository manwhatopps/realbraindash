/*
  # Remove Duplicate Indexes and Constraints
  
  1. Purpose
    - Remove duplicate indexes that provide identical functionality
    - Remove duplicate unique constraints
    - Reduces index maintenance overhead
    - Saves storage space
  
  2. Changes
    - Drop duplicate indexes that aren't backing constraints
    - Drop duplicate unique constraints (keeping the more descriptive names)
  
  3. Performance Impact
    - Positive: Faster INSERT/UPDATE/DELETE operations
    - Positive: Less storage usage
    - No negative impact: Duplicate indexes/constraints provide no additional benefit
*/

-- escrow_lock: Drop duplicate unique constraint (keep escrow_lock_match_user_unique)
ALTER TABLE escrow_lock DROP CONSTRAINT IF EXISTS escrow_lock_match_id_user_id_key;

-- escrow_lock: Drop duplicate index (keep idx_escrow_lock_user_status which is more specific)
DROP INDEX IF EXISTS idx_escrow_lock_user_id;

-- lobby_players: Drop duplicate unique constraint (keep lobby_players_lobby_user_unique)
ALTER TABLE lobby_players DROP CONSTRAINT IF EXISTS lobby_players_lobby_id_user_id_key;

-- match_players: Drop duplicate unique constraint (keep match_players_match_user_unique)
ALTER TABLE match_players DROP CONSTRAINT IF EXISTS match_players_match_id_user_id_key;

-- match_players: Drop duplicate index (keep idx_match_players_score which covers both match and score)
DROP INDEX IF EXISTS idx_match_players_match;

-- payouts: Drop duplicate unique constraint (keep payouts_match_user_unique)
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_match_id_user_id_key;

-- wallet_ledger: Drop duplicate index (keep idx_wallet_ledger_user_id which is simpler)
DROP INDEX IF EXISTS idx_wallet_ledger_user_created;