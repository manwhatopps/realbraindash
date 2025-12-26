/*
  # Create Admin Locks Table
  
  1. New Tables
    - `admin_locks`
      - `key` (text, primary key) - Lock identifier
      - `locked_until` (timestamptz) - Lock expiration time
      - `locked_by` (uuid) - Admin user who holds the lock
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `admin_locks` table
    - Only admin users can acquire/release locks
  
  3. Purpose
    - Prevents concurrent admin operations
    - Used by admin-question-tools for safe database operations
*/

CREATE TABLE IF NOT EXISTS admin_locks (
  key TEXT PRIMARY KEY,
  locked_until TIMESTAMPTZ NOT NULL,
  locked_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_locks ENABLE ROW LEVEL SECURITY;

-- Admin users can manage locks
CREATE POLICY "Admins can manage locks"
  ON admin_locks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.revoked_at IS NULL
    )
  );

-- Add index for faster lock checks
CREATE INDEX IF NOT EXISTS idx_admin_locks_expiry ON admin_locks(locked_until);