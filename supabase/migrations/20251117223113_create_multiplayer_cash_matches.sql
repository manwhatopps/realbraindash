/*
  # Multi-Player Cash Matches System

  1. New Tables
    - `cash_matches`
      - Match configuration and state for any number of players (2-10+)
      - Supports dynamic player counts, not hardcoded to 1v1
      - Includes entry fee, game mode, payout model, and room settings
    
    - `cash_match_players`
      - One record per player per match
      - Tracks individual player scores, results, and timestamps
      - Enables scalable N-player support
    
    - `cash_match_escrows`
      - Tracks total pot (entry_fee × player_count)
      - Released only after match finalization
    
    - `wallet_ledger`
      - Records all wallet transactions (deposits, match entries, payouts)
      - Maintains audit trail for all money movements
    
    - `user_wallets`
      - Stores user balance in cents
      - Updated atomically via wallet_ledger transactions

  2. Security
    - Enable RLS on all tables
    - Users can view their own matches and wallet
    - Only server (service role) can modify escrows and ledger
    - All money operations are atomic and auditable

  3. Match Flow
    - Create: Host creates match with settings
    - Join: Players join until min_players reached
    - Start: Match starts (auto or manual)
    - Play: All players receive identical questions
    - Submit: Each player submits score independently
    - Finalize: Server calculates winners and distributes pot

  4. Important Notes
    - NO hardcoded player1/player2 logic
    - Supports 1v1, 1vMany, and tournaments
    - All payouts calculated server-side only
    - Escrow never released until finalize completes
*/

-- Create user wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents bigint NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create wallet ledger for audit trail
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  balance_after_cents bigint NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'match_entry', 'match_payout', 'match_refund', 'rake')),
  match_id uuid,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create cash matches table (multi-player support)
CREATE TABLE IF NOT EXISTS cash_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Match settings
  entry_fee_cents bigint NOT NULL CHECK (entry_fee_cents > 0),
  currency text NOT NULL DEFAULT 'USD',
  min_players int NOT NULL DEFAULT 2 CHECK (min_players >= 2),
  max_players int NOT NULL CHECK (max_players >= min_players),
  
  -- Game configuration
  mode text NOT NULL CHECK (mode IN ('sprint', 'blitz', 'sudden_death', 'classic')),
  category text,
  question_count int NOT NULL DEFAULT 10 CHECK (question_count > 0),
  time_per_question_ms int NOT NULL DEFAULT 15000 CHECK (time_per_question_ms > 0),
  
  -- Payout configuration
  payout_model text NOT NULL DEFAULT 'winner_take_all' CHECK (payout_model IN ('winner_take_all', 'top3', 'percentile', 'custom')),
  payout_config jsonb DEFAULT '{}'::jsonb,
  rake_percent numeric(5,2) NOT NULL DEFAULT 5.00 CHECK (rake_percent >= 0 AND rake_percent <= 100),
  
  -- Room settings
  is_private boolean NOT NULL DEFAULT false,
  room_code text,
  
  -- Match state
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'active', 'completed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Questions (stored as JSON array after match starts)
  questions jsonb,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT unique_room_code UNIQUE (room_code)
);

-- Create cash match players table
CREATE TABLE IF NOT EXISTS cash_match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES cash_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Player state
  joined_at timestamptz DEFAULT now() NOT NULL,
  score int,
  time_taken_ms bigint,
  finished_at timestamptz,
  
  -- Result
  result text DEFAULT 'pending' CHECK (result IN ('pending', 'win', 'loss', 'tie')),
  payout_cents bigint DEFAULT 0,
  placement int,
  
  CONSTRAINT unique_match_player UNIQUE (match_id, user_id)
);

-- Create cash match escrows table
CREATE TABLE IF NOT EXISTS cash_match_escrows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE REFERENCES cash_matches(id) ON DELETE CASCADE,
  
  total_pot_cents bigint NOT NULL DEFAULT 0,
  rake_cents bigint NOT NULL DEFAULT 0,
  net_pot_cents bigint NOT NULL DEFAULT 0,
  
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'refunded')),
  released_at timestamptz,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_match_escrows ENABLE ROW LEVEL SECURITY;

-- RLS Policies: user_wallets
CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own wallet"
  ON user_wallets FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- RLS Policies: wallet_ledger
CREATE POLICY "Users can view own ledger"
  ON wallet_ledger FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RLS Policies: cash_matches
CREATE POLICY "Users can view public matches"
  ON cash_matches FOR SELECT
  TO authenticated
  USING (is_private = false OR creator_id = (select auth.uid()));

CREATE POLICY "Users can view matches they joined"
  ON cash_matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cash_match_players
      WHERE cash_match_players.match_id = cash_matches.id
      AND cash_match_players.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create matches"
  ON cash_matches FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = creator_id);

-- RLS Policies: cash_match_players
CREATE POLICY "Users can view players in their matches"
  ON cash_match_players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cash_match_players cmp
      WHERE cmp.match_id = cash_match_players.match_id
      AND cmp.user_id = (select auth.uid())
    )
  );

-- RLS Policies: cash_match_escrows
CREATE POLICY "Users can view escrows for their matches"
  ON cash_match_escrows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cash_match_players
      WHERE cash_match_players.match_id = cash_match_escrows.match_id
      AND cash_match_players.user_id = (select auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_matches_status ON cash_matches(status);
CREATE INDEX IF NOT EXISTS idx_cash_matches_creator ON cash_matches(creator_id);
CREATE INDEX IF NOT EXISTS idx_cash_matches_room_code ON cash_matches(room_code) WHERE room_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_match_players_match ON cash_match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_cash_match_players_user ON cash_match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user ON wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_match ON wallet_ledger(match_id) WHERE match_id IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- Triggers for updated_at
CREATE TRIGGER trigger_update_user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_cash_matches_updated_at
  BEFORE UPDATE ON cash_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_cash_match_escrows_updated_at
  BEFORE UPDATE ON cash_match_escrows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
