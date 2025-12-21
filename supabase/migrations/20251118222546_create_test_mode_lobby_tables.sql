/*
  # Create Test Mode Lobby Tables

  1. New Tables
    - `test_mode_lobbies`
      - Stores test mode cash challenge lobbies
      - Lobby code, entry fee, status
      - Created by user_id
      
    - `test_mode_lobby_players`
      - Tracks players in each lobby
      - Ready status
      - Mock KYC completion
      - Test scores
    
  2. Security
    - Enable RLS on all tables
    - Players can read lobbies they're in
    - Only lobby creator can update lobby status
    - Players can update their own ready status

  3. Notes
    - This is TEST MODE ONLY - no real money
    - All credits are virtual test credits
    - Data is for demo/testing purposes only
*/

-- Test mode lobbies table
CREATE TABLE IF NOT EXISTS test_mode_lobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_code text NOT NULL UNIQUE,
  entry_fee integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'in_progress', 'completed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type text DEFAULT 'reflex_test',
  max_players integer DEFAULT 4,
  winner_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  started_at timestamptz,
  completed_at timestamptz
);

-- Test mode lobby players table
CREATE TABLE IF NOT EXISTS test_mode_lobby_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL REFERENCES test_mode_lobbies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  is_ready boolean DEFAULT false,
  has_accepted_terms boolean DEFAULT false,
  mock_kyc_completed boolean DEFAULT false,
  mock_kyc_ssn_last4 text,
  test_score integer DEFAULT 0,
  placement integer,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(lobby_id, user_id)
);

-- Enable RLS
ALTER TABLE test_mode_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_mode_lobby_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies: test_mode_lobbies
CREATE POLICY "Users can view lobbies they created or joined"
  ON test_mode_lobbies FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR id IN (
      SELECT lobby_id FROM test_mode_lobby_players WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create lobbies"
  ON test_mode_lobbies FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Lobby creator can update lobby"
  ON test_mode_lobbies FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- RLS Policies: test_mode_lobby_players
CREATE POLICY "Users can view players in their lobbies"
  ON test_mode_lobby_players FOR SELECT
  TO authenticated
  USING (
    lobby_id IN (
      SELECT id FROM test_mode_lobbies
      WHERE created_by = (select auth.uid())
      OR id IN (
        SELECT lobby_id FROM test_mode_lobby_players WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can join lobbies"
  ON test_mode_lobby_players FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own player status"
  ON test_mode_lobby_players FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_mode_lobbies_code ON test_mode_lobbies(lobby_code);
CREATE INDEX IF NOT EXISTS idx_test_mode_lobbies_status ON test_mode_lobbies(status);
CREATE INDEX IF NOT EXISTS idx_test_mode_lobbies_created_by ON test_mode_lobbies(created_by);
CREATE INDEX IF NOT EXISTS idx_test_mode_lobby_players_lobby ON test_mode_lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_test_mode_lobby_players_user ON test_mode_lobby_players(user_id);

-- Function to generate unique lobby code
CREATE OR REPLACE FUNCTION generate_lobby_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
  code_exists boolean;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM test_mode_lobbies WHERE lobby_code = result) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Function to check if all players are ready
CREATE OR REPLACE FUNCTION check_all_players_ready(p_lobby_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_players integer;
  ready_players integer;
BEGIN
  SELECT COUNT(*) INTO total_players
  FROM test_mode_lobby_players
  WHERE lobby_id = p_lobby_id;
  
  SELECT COUNT(*) INTO ready_players
  FROM test_mode_lobby_players
  WHERE lobby_id = p_lobby_id AND is_ready = true;
  
  RETURN total_players > 0 AND total_players = ready_players;
END;
$$;

COMMENT ON TABLE test_mode_lobbies IS 'TEST MODE ONLY - Cash challenge lobbies with virtual credits';
COMMENT ON TABLE test_mode_lobby_players IS 'TEST MODE ONLY - Players in cash challenge lobbies';
