/*
  # Optimize RLS Policies - Auth UID Performance
  
  1. Purpose
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - Prevents re-evaluation of auth.uid() for each row
    - Significantly improves query performance at scale
  
  2. Changes
    - Drop and recreate affected RLS policies with optimized auth checks
    - Maintains exact same security logic, just optimized
  
  3. Performance Impact
    - Major improvement for queries scanning many rows
    - Reduces CPU usage on auth function calls
*/

-- ============================================================
-- WALLET & FINANCIAL TABLES
-- ============================================================

-- wallet_balance
DROP POLICY IF EXISTS "secure_wallet_read" ON wallet_balance;
CREATE POLICY "secure_wallet_read" ON wallet_balance
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- wallet_ledger
DROP POLICY IF EXISTS "Users can view own wallet ledger" ON wallet_ledger;
CREATE POLICY "Users can view own wallet ledger" ON wallet_ledger
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "secure_ledger_read" ON wallet_ledger;
CREATE POLICY "secure_ledger_read" ON wallet_ledger
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- LOBBY & MATCH TABLES
-- ============================================================

-- lobbies
DROP POLICY IF EXISTS "Users can create lobbies" ON lobbies;
CREATE POLICY "Users can create lobbies" ON lobbies
  FOR INSERT TO authenticated
  WITH CHECK (host_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "secure_lobbies_read" ON lobbies;
CREATE POLICY "secure_lobbies_read" ON lobbies
  FOR SELECT TO authenticated
  USING (
    host_user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM lobby_players
      WHERE lobby_players.lobby_id = lobbies.id
      AND lobby_players.user_id = (select auth.uid())
    )
  );

-- lobby_players
DROP POLICY IF EXISTS "Users can view players in their lobbies" ON lobby_players;
CREATE POLICY "Users can view players in their lobbies" ON lobby_players
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lobby_players AS lp
      WHERE lp.lobby_id = lobby_players.lobby_id
      AND lp.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can join lobbies" ON lobby_players;
CREATE POLICY "Users can join lobbies" ON lobby_players
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own player status" ON lobby_players;
CREATE POLICY "Users can update own player status" ON lobby_players
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "secure_lobby_players_read" ON lobby_players;
CREATE POLICY "secure_lobby_players_read" ON lobby_players
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lobby_players AS lp
      WHERE lp.lobby_id = lobby_players.lobby_id
      AND lp.user_id = (select auth.uid())
    )
  );

-- match_players
DROP POLICY IF EXISTS "Users can view matches they played" ON match_players;
CREATE POLICY "Users can view matches they played" ON match_players
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "secure_match_players_read" ON match_players;
CREATE POLICY "secure_match_players_read" ON match_players
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- match_answers
DROP POLICY IF EXISTS "Users can submit answers" ON match_answers;
CREATE POLICY "Users can submit answers" ON match_answers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "secure_answers_read" ON match_answers;
CREATE POLICY "secure_answers_read" ON match_answers
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- cash_matches
DROP POLICY IF EXISTS "Users can view accessible matches" ON cash_matches;
CREATE POLICY "Users can view accessible matches" ON cash_matches
  FOR SELECT TO authenticated
  USING (
    creator_id = (select auth.uid()) OR
    is_private = false OR
    EXISTS (
      SELECT 1 FROM cash_match_players
      WHERE cash_match_players.match_id = cash_matches.id
      AND cash_match_players.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- ESCROW & PAYOUTS
-- ============================================================

-- escrow_lock
DROP POLICY IF EXISTS "secure_escrow_read" ON escrow_lock;
CREATE POLICY "secure_escrow_read" ON escrow_lock
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- payouts
DROP POLICY IF EXISTS "secure_payouts_read" ON payouts;
CREATE POLICY "secure_payouts_read" ON payouts
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- AUDIT & SECURITY
-- ============================================================

-- audit_events
DROP POLICY IF EXISTS "Users can view own audit events" ON audit_events;
CREATE POLICY "Users can view own audit events" ON audit_events
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "secure_audit_read" ON audit_events;
CREATE POLICY "secure_audit_read" ON audit_events
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- idempotency_keys
DROP POLICY IF EXISTS "secure_idempotency_read" ON idempotency_keys;
CREATE POLICY "secure_idempotency_read" ON idempotency_keys
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- user_eligibility
DROP POLICY IF EXISTS "secure_eligibility_read" ON user_eligibility;
CREATE POLICY "secure_eligibility_read" ON user_eligibility
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- ADMIN TABLES
-- ============================================================

-- admin_users
DROP POLICY IF EXISTS "Admin users can view admin list" ON admin_users;
CREATE POLICY "Admin users can view admin list" ON admin_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users AS au
      WHERE au.user_id = (select auth.uid())
      AND au.revoked_at IS NULL
    )
  );

-- admin_locks
DROP POLICY IF EXISTS "Admins can manage locks" ON admin_locks;
DROP POLICY IF EXISTS "Admins can manage locks" ON admin_locks;
CREATE POLICY "Admins can manage locks" ON admin_locks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- ============================================================
-- FRAUD & COMPLIANCE
-- ============================================================

-- fraud_scores
DROP POLICY IF EXISTS "Users view own fraud scores" ON fraud_scores;
CREATE POLICY "Users view own fraud scores" ON fraud_scores
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- account_freezes
DROP POLICY IF EXISTS "Users view own freeze status" ON account_freezes;
CREATE POLICY "Users view own freeze status" ON account_freezes
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- compliance_acceptances
DROP POLICY IF EXISTS "Users view own compliance acceptances" ON compliance_acceptances;
CREATE POLICY "Users view own compliance acceptances" ON compliance_acceptances
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- PAYMENT TABLES
-- ============================================================

-- settlement_attempts
DROP POLICY IF EXISTS "Admin read settlement attempts" ON settlement_attempts;
CREATE POLICY "Admin read settlement attempts" ON settlement_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- payment_providers
DROP POLICY IF EXISTS "Admin manage payment providers" ON payment_providers;
CREATE POLICY "Admin manage payment providers" ON payment_providers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- deposit_intents
DROP POLICY IF EXISTS "Users read own deposit intents" ON deposit_intents;
CREATE POLICY "Users read own deposit intents" ON deposit_intents
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- provider_events
DROP POLICY IF EXISTS "Admin read provider events" ON provider_events;
CREATE POLICY "Admin read provider events" ON provider_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- withdrawal_requests
DROP POLICY IF EXISTS "Users read own withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users read own withdrawal requests" ON withdrawal_requests
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- LEGAL & CONSENT
-- ============================================================

-- legal_documents
DROP POLICY IF EXISTS "Admin manage legal documents" ON legal_documents;
CREATE POLICY "Admin manage legal documents" ON legal_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- user_match_consents
DROP POLICY IF EXISTS "Users read own consents" ON user_match_consents;
CREATE POLICY "Users read own consents" ON user_match_consents
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- PLATFORM CONFIGURATION
-- ============================================================

-- platform_limits
DROP POLICY IF EXISTS "Admin manage platform limits" ON platform_limits;
CREATE POLICY "Admin manage platform limits" ON platform_limits
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- ============================================================
-- QUESTION SYSTEM
-- ============================================================

-- questions
DROP POLICY IF EXISTS "Admin manage questions" ON questions;
CREATE POLICY "Admin manage questions" ON questions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- question_fingerprints
DROP POLICY IF EXISTS "Admin read fingerprints" ON question_fingerprints;
CREATE POLICY "Admin read fingerprints" ON question_fingerprints
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- match_questions
DROP POLICY IF EXISTS "Players read match questions" ON match_questions;
CREATE POLICY "Players read match questions" ON match_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_players
      WHERE match_players.match_id = match_questions.match_id
      AND match_players.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM lobby_players
      WHERE lobby_players.lobby_id = match_questions.lobby_id
      AND lobby_players.user_id = (select auth.uid())
    )
  );

-- question_generation_log
DROP POLICY IF EXISTS "Admin read generation log" ON question_generation_log;
CREATE POLICY "Admin read generation log" ON question_generation_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- user_seen_questions
DROP POLICY IF EXISTS "Users read own seen questions" ON user_seen_questions;
CREATE POLICY "Users read own seen questions" ON user_seen_questions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR user_id IS NULL);