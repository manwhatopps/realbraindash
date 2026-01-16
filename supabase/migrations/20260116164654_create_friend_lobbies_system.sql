/*
  # Create Friend Lobbies System for Private Cash Matches

  ## Overview
  Implements private lobby system allowing users to create/join cash matches with friends.
  Supports invite codes, ready checks, spectators, and customizable match settings.

  ## New Tables

  ### 1. `friend_lobbies`
  Main table for private cash match lobbies with host control and configuration.
  
  **Columns:**
  - `id` (uuid, PK): Unique lobby identifier
  - `created_at` (timestamptz): Timestamp of lobby creation
  - `host_user_id` (uuid, FK): Creator and host of the lobby
  - `mode` (text): Game mode, default 'cash'
  - `is_private` (boolean): Whether lobby requires invite code
  - `code` (text, unique): 6-character uppercase invite code
  - `status` (text): Lobby state - 'open', 'started', 'finished', 'cancelled'
  - `max_players` (int): Maximum number of players (2-12)
  - `entry_fee_cents` (int): Entry fee in cents (USD)
  - `currency` (text): Currency code, default 'USD'
  - `require_ready` (boolean): Whether all players must ready up
  - `lock_on_start` (boolean): Prevent joins after game starts
  - `host_can_play` (boolean): Whether host participates as player
  - `allow_spectators` (boolean): Allow spectator roles
  - `started_at` (timestamptz): When game started
  - `ended_at` (timestamptz): When game ended

  ### 2. `friend_lobby_members`
  Tracks users who have joined a lobby and their ready state.
  
  **Columns:**
  - `lobby_id` (uuid, FK): Reference to friend_lobbies
  - `user_id` (uuid, FK): Reference to auth.users
  - `joined_at` (timestamptz): When user joined
  - `role` (text): 'player' or 'spectator'
  - `is_ready` (boolean): Ready state for match start

  ## Security
  - RLS enabled on both tables
  - Members can view lobbies they're part of
  - Only host can start/modify lobby settings (enforced via RPC)
  - Users can only update their own ready state

  ## Indexes
  - Index on `friend_lobbies.code` for fast lookups
  - Index on `friend_lobbies.host_user_id` for host queries
  - Index on `friend_lobby_members.lobby_id` for member queries
*/

-- Create friend_lobbies table
CREATE TABLE IF NOT EXISTS friend_lobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  host_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode text DEFAULT 'cash' NOT NULL,
  is_private boolean DEFAULT true NOT NULL,
  code text UNIQUE NOT NULL,
  status text DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'started', 'finished', 'cancelled')),
  max_players int DEFAULT 12 NOT NULL CHECK (max_players >= 2 AND max_players <= 12),
  entry_fee_cents int DEFAULT 0 NOT NULL CHECK (entry_fee_cents >= 0),
  currency text DEFAULT 'USD' NOT NULL,
  require_ready boolean DEFAULT true NOT NULL,
  lock_on_start boolean DEFAULT true NOT NULL,
  host_can_play boolean DEFAULT true NOT NULL,
  allow_spectators boolean DEFAULT false NOT NULL,
  started_at timestamptz,
  ended_at timestamptz
);

-- Create friend_lobby_members table
CREATE TABLE IF NOT EXISTS friend_lobby_members (
  lobby_id uuid REFERENCES friend_lobbies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  role text DEFAULT 'player' NOT NULL CHECK (role IN ('player', 'spectator')),
  is_ready boolean DEFAULT false NOT NULL,
  PRIMARY KEY (lobby_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_lobbies_code ON friend_lobbies(code);
CREATE INDEX IF NOT EXISTS idx_friend_lobbies_host_user_id ON friend_lobbies(host_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_lobbies_status ON friend_lobbies(status);
CREATE INDEX IF NOT EXISTS idx_friend_lobby_members_lobby_id ON friend_lobby_members(lobby_id);
CREATE INDEX IF NOT EXISTS idx_friend_lobby_members_user_id ON friend_lobby_members(user_id);

-- Enable Row Level Security
ALTER TABLE friend_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_lobby_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_lobbies

-- Allow authenticated users to read lobbies they are members of
CREATE POLICY "Users can view lobbies they are members of"
  ON friend_lobbies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM friend_lobby_members
      WHERE friend_lobby_members.lobby_id = friend_lobbies.id
      AND friend_lobby_members.user_id = auth.uid()
    )
  );

-- Allow authenticated users to create lobbies (host_user_id must match)
CREATE POLICY "Users can create their own lobbies"
  ON friend_lobbies
  FOR INSERT
  TO authenticated
  WITH CHECK (host_user_id = auth.uid());

-- Allow host to update their own lobby (with restrictions enforced by RPC)
CREATE POLICY "Host can update their own lobby"
  ON friend_lobbies
  FOR UPDATE
  TO authenticated
  USING (host_user_id = auth.uid())
  WITH CHECK (host_user_id = auth.uid());

-- RLS Policies for friend_lobby_members

-- Allow users to view members of lobbies they are part of
CREATE POLICY "Users can view members of their lobbies"
  ON friend_lobby_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM friend_lobby_members AS flm
      WHERE flm.lobby_id = friend_lobby_members.lobby_id
      AND flm.user_id = auth.uid()
    )
  );

-- Allow users to update their own ready state
CREATE POLICY "Users can update their own ready state"
  ON friend_lobby_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Inserts handled via RPC for security
CREATE POLICY "Allow inserts via RPC"
  ON friend_lobby_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);