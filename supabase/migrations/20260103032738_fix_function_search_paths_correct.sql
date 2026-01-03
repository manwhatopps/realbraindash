/*
  # Fix Function Search Paths for Security
  
  1. Purpose
    - Set immutable search_path on all database functions
    - Prevents search path injection attacks
    - Ensures functions always reference correct schemas
  
  2. Changes
    - Set search_path = 'public, pg_temp' for all functions
    - Uses correct function signatures
  
  3. Security Impact
    - Prevents malicious schema injection
    - Ensures consistent function behavior
    - Required for production security compliance
*/

-- Functions with no arguments
ALTER FUNCTION initialize_wallet_balance() SET search_path = 'public, pg_temp';
ALTER FUNCTION auto_freeze_high_fraud_accounts() SET search_path = 'public, pg_temp';
ALTER FUNCTION cleanup_expired_idempotency_keys() SET search_path = 'public, pg_temp';
ALTER FUNCTION get_total_cash_users() SET search_path = 'public, pg_temp';
ALTER FUNCTION get_question_stats() SET search_path = 'public, pg_temp';
ALTER FUNCTION update_updated_at_column() SET search_path = 'public, pg_temp';

-- Wallet functions
ALTER FUNCTION compute_match_payouts(uuid, bigint, numeric) SET search_path = 'public, pg_temp';
ALTER FUNCTION lock_and_check_balance(uuid, bigint) SET search_path = 'public, pg_temp';
ALTER FUNCTION credit_wallet_atomic(uuid, integer, text, text, jsonb) SET search_path = 'public, pg_temp';
ALTER FUNCTION lock_withdrawal_funds(uuid, integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION release_withdrawal_funds(uuid, integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION finalize_withdrawal(uuid, integer, uuid, text) SET search_path = 'public, pg_temp';
ALTER FUNCTION process_deposit(uuid, integer, uuid, text) SET search_path = 'public, pg_temp';
ALTER FUNCTION reconcile_wallet_balance(uuid) SET search_path = 'public, pg_temp';

-- Question functions
ALTER FUNCTION get_questions_for_session(text, text, integer, uuid, text, uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION insert_seen_question(uuid, uuid, text, text) SET search_path = 'public, pg_temp';
ALTER FUNCTION insert_seen_questions_bulk(uuid[], uuid, text, text) SET search_path = 'public, pg_temp';
ALTER FUNCTION shuffle_question_choices(uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION generate_question_fingerprint(text) SET search_path = 'public, pg_temp';
ALTER FUNCTION is_duplicate_question(text, text) SET search_path = 'public, pg_temp';
ALTER FUNCTION get_recent_fingerprints(text, integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION get_cached_questions_for_match(text, text, integer, integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION mark_questions_used(uuid[]) SET search_path = 'public, pg_temp';
ALTER FUNCTION insert_generated_question(text, text, text, jsonb, integer, text, text, uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION generate_normalized_fingerprint(text) SET search_path = 'public, pg_temp';
ALTER FUNCTION cleanup_old_seen_questions(integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION insert_generated_question_enhanced(text, text, text, jsonb, integer, text, text, uuid) SET search_path = 'public, pg_temp';

-- Lobby & match functions
ALTER FUNCTION atomic_lobby_join(uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION settle_match_payouts(uuid, uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION check_settlement_needed(uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION acquire_settlement_lock(uuid, text) SET search_path = 'public, pg_temp';
ALTER FUNCTION release_settlement_lock(uuid) SET search_path = 'public, pg_temp';

-- Platform & eligibility functions
ALTER FUNCTION check_cash_eligibility(uuid, bigint) SET search_path = 'public, pg_temp';
ALTER FUNCTION check_rate_limit(uuid, text, integer, integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION check_platform_control(text) SET search_path = 'public, pg_temp';
ALTER FUNCTION check_platform_limit(text, bigint) SET search_path = 'public, pg_temp';
ALTER FUNCTION get_user_daily_stake(uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION get_user_concurrent_matches(uuid) SET search_path = 'public, pg_temp';

-- Fraud & security functions
ALTER FUNCTION is_account_frozen(uuid, text) SET search_path = 'public, pg_temp';
ALTER FUNCTION compute_velocity_fraud_score(uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION create_alert(text, text, text, uuid, uuid, jsonb) SET search_path = 'public, pg_temp';

-- Legal & consent functions
ALTER FUNCTION get_current_legal_version(text) SET search_path = 'public, pg_temp';
ALTER FUNCTION check_legal_consent(uuid, uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION record_legal_consent(uuid, uuid, uuid, text[], text, text) SET search_path = 'public, pg_temp';