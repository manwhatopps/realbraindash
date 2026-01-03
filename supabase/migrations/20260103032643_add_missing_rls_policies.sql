/*
  # Add Missing RLS Policies
  
  1. Purpose
    - Add RLS policies for tables that have RLS enabled but no policies
    - Prevents unauthorized access to sensitive data
    - Ensures security compliance
  
  2. Tables Affected
    - alert_events
    - incident_actions
    - platform_controls
    - rate_limits
    - reconciliation_issues
    - reconciliation_runs
  
  3. Security Model
    - Most tables are admin-only access
    - rate_limits is system-managed, no direct user access
    - Alert and incident tracking for admin oversight
*/

-- ============================================================
-- ALERT_EVENTS - Admin read, system write
-- ============================================================

CREATE POLICY "Admins can view alert events"
  ON alert_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

CREATE POLICY "Admins can acknowledge alerts"
  ON alert_events
  FOR UPDATE
  TO authenticated
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
-- INCIDENT_ACTIONS - Admin only
-- ============================================================

CREATE POLICY "Admins can view incident actions"
  ON incident_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

CREATE POLICY "Admins can perform incident actions"
  ON incident_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

-- ============================================================
-- PLATFORM_CONTROLS - Public read, admin write
-- ============================================================

CREATE POLICY "Everyone can view platform controls"
  ON platform_controls
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage platform controls"
  ON platform_controls
  FOR ALL
  TO authenticated
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
-- RATE_LIMITS - System only (no user access)
-- ============================================================

CREATE POLICY "No direct user access to rate limits"
  ON rate_limits
  FOR SELECT
  TO authenticated
  USING (false);

-- ============================================================
-- RECONCILIATION_ISSUES - Admin only
-- ============================================================

CREATE POLICY "Admins can view reconciliation issues"
  ON reconciliation_issues
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );

CREATE POLICY "Admins can resolve reconciliation issues"
  ON reconciliation_issues
  FOR UPDATE
  TO authenticated
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
-- RECONCILIATION_RUNS - Admin only
-- ============================================================

CREATE POLICY "Admins can view reconciliation runs"
  ON reconciliation_runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
      AND admin_users.revoked_at IS NULL
    )
  );