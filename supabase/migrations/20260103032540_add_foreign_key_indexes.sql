/*
  # Add Foreign Key Indexes for Performance
  
  1. Purpose
    - Add indexes on all foreign key columns that don't have covering indexes
    - Improves JOIN performance and foreign key constraint checking
    - Prevents full table scans when querying related data
  
  2. Changes
    - Add 33 indexes on foreign key columns across multiple tables
    - All indexes use IF NOT EXISTS to prevent conflicts
  
  3. Performance Impact
    - Significant improvement for queries joining tables
    - Faster foreign key constraint validation
    - Better query planner optimization
*/

-- account_freezes foreign key indexes
CREATE INDEX IF NOT EXISTS idx_account_freezes_fraud_score_id ON account_freezes(fraud_score_id);
CREATE INDEX IF NOT EXISTS idx_account_freezes_frozen_by ON account_freezes(frozen_by);
CREATE INDEX IF NOT EXISTS idx_account_freezes_unfrozen_by ON account_freezes(unfrozen_by);

-- admin_actions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user_id ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON admin_actions(target_user_id);

-- admin_users foreign key indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_granted_by ON admin_users(granted_by);

-- alert_events foreign key indexes
CREATE INDEX IF NOT EXISTS idx_alert_events_acknowledged_by ON alert_events(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_alert_events_user_id_fk ON alert_events(user_id);

-- cash_match_players foreign key indexes
CREATE INDEX IF NOT EXISTS idx_cash_match_players_user_id ON cash_match_players(user_id);

-- cash_matches foreign key indexes
CREATE INDEX IF NOT EXISTS idx_cash_matches_creator_id ON cash_matches(creator_id);

-- compliance_events foreign key indexes
CREATE INDEX IF NOT EXISTS idx_compliance_events_user_id ON compliance_events(user_id);

-- deposit_intents foreign key indexes
CREATE INDEX IF NOT EXISTS idx_deposit_intents_provider_id ON deposit_intents(provider_id);

-- idempotency_keys foreign key indexes
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id);

-- legal_documents foreign key indexes
CREATE INDEX IF NOT EXISTS idx_legal_documents_published_by ON legal_documents(published_by);

-- match_answers foreign key indexes
CREATE INDEX IF NOT EXISTS idx_match_answers_user_id ON match_answers(user_id);

-- match_audit_logs foreign key indexes
CREATE INDEX IF NOT EXISTS idx_match_audit_logs_match_id ON match_audit_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_match_audit_logs_user_id ON match_audit_logs(user_id);

-- match_players foreign key indexes
CREATE INDEX IF NOT EXISTS idx_match_players_lobby_id ON match_players(lobby_id);

-- match_questions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_match_questions_question_id ON match_questions(question_id);

-- payouts foreign key indexes
CREATE INDEX IF NOT EXISTS idx_payouts_lobby_id ON payouts(lobby_id);

-- platform_controls foreign key indexes
CREATE INDEX IF NOT EXISTS idx_platform_controls_last_modified_by ON platform_controls(last_modified_by);

-- platform_limits foreign key indexes
CREATE INDEX IF NOT EXISTS idx_platform_limits_last_modified_by ON platform_limits(last_modified_by);

-- question_fingerprints foreign key indexes
CREATE INDEX IF NOT EXISTS idx_question_fingerprints_question_id ON question_fingerprints(question_id);

-- question_generation_log foreign key indexes
CREATE INDEX IF NOT EXISTS idx_question_generation_log_created_by ON question_generation_log(created_by);

-- questions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);

-- reconciliation_issues foreign key indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_issues_resolved_by ON reconciliation_issues(resolved_by);

-- test_mode_lobbies foreign key indexes
CREATE INDEX IF NOT EXISTS idx_test_mode_lobbies_created_by ON test_mode_lobbies(created_by);

-- test_mode_lobby_players foreign key indexes
CREATE INDEX IF NOT EXISTS idx_test_mode_lobby_players_user_id ON test_mode_lobby_players(user_id);

-- user_geo_verifications foreign key indexes
CREATE INDEX IF NOT EXISTS idx_user_geo_verifications_user_id ON user_geo_verifications(user_id);

-- user_seen_questions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_user_seen_questions_question_id ON user_seen_questions(question_id);

-- withdrawal_requests foreign key indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_approved_by ON withdrawal_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_provider_id ON withdrawal_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_reviewed_by ON withdrawal_requests(reviewed_by);