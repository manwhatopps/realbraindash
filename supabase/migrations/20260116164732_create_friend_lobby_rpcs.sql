/*
  # Friend Lobby RPC Functions

  ## Overview
  Security-definer functions to manage friend lobby operations with proper authorization
  and business rule enforcement.

  ## Functions

  ### 1. `create_friend_lobby`
  Creates a new private lobby with unique invite code.
  - Generates 6-character code from safe alphabet
  - Inserts lobby record with host
  - Auto-joins host as player or spectator based on host_can_play
  - Returns lobby_id and invite code

  ### 2. `join_friend_lobby`
  Joins an existing lobby by invite code.
  - Validates lobby status and capacity
  - Enforces lock_on_start rules
  - Prevents overfilling
  - Idempotent (no error if already joined)

  ### 3. `set_friend_lobby_ready`
  Updates user's ready state in a lobby.
  - User can only update their own state
  - Only affects current lobby member

  ### 4. `start_friend_lobby`
  Starts the game for a lobby.
  - Only host can start
  - Validates ready requirements
  - Sets status to 'started' and timestamps
  - Enforces minimum player count

  ## Security
  All functions use SECURITY DEFINER with explicit auth checks.
  All operations validate lobby membership and authorization.
*/

-- Function to generate a unique 6-character invite code
CREATE OR REPLACE FUNCTION generate_friend_lobby_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Alphabet without ambiguous characters (no 0, O, I, L, 1)
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  code_exists boolean;
  attempts int := 0;
  max_attempts int := 10;
BEGIN
  LOOP
    -- Generate 6 random characters
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM friend_lobbies WHERE friend_lobbies.code = code) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- 1. Create Friend Lobby
CREATE OR REPLACE FUNCTION create_friend_lobby(
  p_max_players int,
  p_entry_fee_cents int,
  p_require_ready boolean DEFAULT true,
  p_lock_on_start boolean DEFAULT true,
  p_host_can_play boolean DEFAULT true,
  p_allow_spectators boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lobby_id uuid;
  v_code text;
  v_user_id uuid;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate parameters
  IF p_max_players < 2 OR p_max_players > 12 THEN
    RAISE EXCEPTION 'max_players must be between 2 and 12';
  END IF;
  
  IF p_entry_fee_cents < 0 THEN
    RAISE EXCEPTION 'entry_fee_cents must be non-negative';
  END IF;

  -- Generate unique code
  v_code := generate_friend_lobby_code();

  -- Insert lobby
  INSERT INTO friend_lobbies (
    host_user_id,
    code,
    max_players,
    entry_fee_cents,
    require_ready,
    lock_on_start,
    host_can_play,
    allow_spectators,
    status
  ) VALUES (
    v_user_id,
    v_code,
    p_max_players,
    p_entry_fee_cents,
    p_require_ready,
    p_lock_on_start,
    p_host_can_play,
    p_allow_spectators,
    'open'
  )
  RETURNING id INTO v_lobby_id;

  -- Add host as member (player or spectator based on host_can_play)
  INSERT INTO friend_lobby_members (
    lobby_id,
    user_id,
    role,
    is_ready
  ) VALUES (
    v_lobby_id,
    v_user_id,
    CASE WHEN p_host_can_play THEN 'player' ELSE 'spectator' END,
    false
  );

  -- Return lobby info
  RETURN json_build_object(
    'lobby_id', v_lobby_id,
    'code', v_code
  );
END;
$$;

-- 2. Join Friend Lobby
CREATE OR REPLACE FUNCTION join_friend_lobby(
  p_code text,
  p_as_spectator boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lobby_id uuid;
  v_status text;
  v_max_players int;
  v_player_count int;
  v_lock_on_start boolean;
  v_allow_spectators boolean;
  v_user_id uuid;
  v_already_member boolean;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Look up lobby by code (case-insensitive)
  SELECT 
    id, status, max_players, lock_on_start, allow_spectators
  INTO 
    v_lobby_id, v_status, v_max_players, v_lock_on_start, v_allow_spectators
  FROM friend_lobbies
  WHERE UPPER(code) = UPPER(p_code);

  IF v_lobby_id IS NULL THEN
    RAISE EXCEPTION 'Lobby not found with code: %', p_code;
  END IF;

  -- Check if lobby is open
  IF v_status != 'open' THEN
    IF v_status = 'started' AND v_lock_on_start THEN
      RAISE EXCEPTION 'Lobby has started and is locked';
    ELSIF v_status IN ('finished', 'cancelled') THEN
      RAISE EXCEPTION 'Lobby is no longer active';
    END IF;
  END IF;

  -- Check if user is already a member (idempotent)
  SELECT EXISTS(
    SELECT 1 FROM friend_lobby_members
    WHERE lobby_id = v_lobby_id AND user_id = v_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    RETURN v_lobby_id; -- Already joined, return success
  END IF;

  -- If joining as spectator, check if allowed
  IF p_as_spectator THEN
    IF NOT v_allow_spectators THEN
      RAISE EXCEPTION 'Spectators are not allowed in this lobby';
    END IF;
  ELSE
    -- Joining as player, check capacity
    SELECT COUNT(*) INTO v_player_count
    FROM friend_lobby_members
    WHERE lobby_id = v_lobby_id AND role = 'player';

    IF v_player_count >= v_max_players THEN
      RAISE EXCEPTION 'Lobby is full (max % players)', v_max_players;
    END IF;
  END IF;

  -- Insert member
  INSERT INTO friend_lobby_members (
    lobby_id,
    user_id,
    role,
    is_ready
  ) VALUES (
    v_lobby_id,
    v_user_id,
    CASE WHEN p_as_spectator THEN 'spectator' ELSE 'player' END,
    false
  );

  RETURN v_lobby_id;
END;
$$;

-- 3. Set Ready State
CREATE OR REPLACE FUNCTION set_friend_lobby_ready(
  p_lobby_id uuid,
  p_ready boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update ready state for this user in this lobby
  UPDATE friend_lobby_members
  SET is_ready = p_ready
  WHERE lobby_id = p_lobby_id
    AND user_id = v_user_id;

  -- Check if update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not a member of this lobby';
  END IF;
END;
$$;

-- 4. Start Friend Lobby
CREATE OR REPLACE FUNCTION start_friend_lobby(
  p_lobby_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_host_id uuid;
  v_status text;
  v_require_ready boolean;
  v_player_count int;
  v_ready_count int;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get lobby info
  SELECT host_user_id, status, require_ready
  INTO v_host_id, v_status, v_require_ready
  FROM friend_lobbies
  WHERE id = p_lobby_id;

  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Lobby not found';
  END IF;

  -- Only host can start
  IF v_host_id != v_user_id THEN
    RAISE EXCEPTION 'Only the host can start the lobby';
  END IF;

  -- Check lobby status
  IF v_status != 'open' THEN
    RAISE EXCEPTION 'Lobby is not open (current status: %)', v_status;
  END IF;

  -- Count players and ready players
  SELECT 
    COUNT(*) FILTER (WHERE role = 'player'),
    COUNT(*) FILTER (WHERE role = 'player' AND is_ready = true)
  INTO v_player_count, v_ready_count
  FROM friend_lobby_members
  WHERE lobby_id = p_lobby_id;

  -- Ensure at least 2 players
  IF v_player_count < 2 THEN
    RAISE EXCEPTION 'Need at least 2 players to start (currently: %)', v_player_count;
  END IF;

  -- If ready check required, all players must be ready
  IF v_require_ready AND v_ready_count < v_player_count THEN
    RAISE EXCEPTION 'All players must be ready (% of % ready)', v_ready_count, v_player_count;
  END IF;

  -- Start the lobby
  UPDATE friend_lobbies
  SET 
    status = 'started',
    started_at = now()
  WHERE id = p_lobby_id;
END;
$$;