# Cash Challenge - Test Mode

## Overview

Cash Challenge is a **TEST MODE ONLY** skill-based multiplayer competition system for BrainDash. This mode simulates the complete flow of a cash match including consent, KYC verification, lobby creation, multiplayer gameplay, and results distribution - all with **virtual test credits only**.

**⚠️ CRITICAL: NO REAL MONEY IS USED. ALL CREDITS ARE VIRTUAL FOR TESTING PURPOSES.**

---

## Access

**URL:** `/cash-challenge-test.html`

Direct link: Open this file in your browser or navigate to it via the dev server.

---

## Features

### 1. Consent Modal

**Purpose:** Educate users about the game rules and collect agreement

**Features:**
- Clear "TEST MODE" warning banner
- Skill-based disclaimer (not gambling)
- Entry fee selector: $1, $5, or $10 (test credits)
- Terms checkbox: "I agree to the Terms of Use and Cash Challenge Rules"
- "Continue to Mock KYC" button (disabled until terms accepted)

**Flow:**
```
User clicks "Start Cash Challenge"
  → Consent modal appears
  → User selects entry fee ($1/$5/$10)
  → User checks terms agreement
  → User clicks "Continue to Mock KYC"
```

---

### 2. Mock KYC Screen

**Purpose:** Simulate identity verification process

**Fields:**
- **Last 4 of SSN:** Text input (accepts any 4 digits, no validation)
- **Upload ID:** Mock file upload button (no actual file handling)

**Features:**
- Clear "Mock Verification" warning
- "This is a simulated KYC process. No real data is collected or verified."
- Fake validation (just checks if fields are filled)
- No data is stored or transmitted to KYC providers

**Flow:**
```
User enters 4 digits for SSN (e.g., "1234")
  → User clicks "Choose File (Mock Upload)"
  → Shows "✓ Mock ID uploaded successfully"
  → User clicks "Submit Mock KYC"
  → KYC marked as complete
  → Lobby created automatically
```

---

### 3. Lobby System

**Purpose:** Multiplayer matchmaking with invite system

**Features:**

#### Lobby Creation
- Automatically creates lobby after KYC completion
- Generates unique 6-character lobby code (e.g., "ABC123")
- Creator automatically joins as first player
- Lobby stored in Supabase `test_mode_lobbies` table

#### Invite System
- **Copy Invite Link:** Copies URL with lobby code to clipboard
  - Format: `https://example.com/cash-challenge-test.html?lobby=ABC123`
- **Show QR Code:** Displays QR code placeholder for mobile scanning
- Invited players auto-join lobby when opening link

#### Player List
- Real-time player list with usernames
- Shows "You" label for current player
- Player status: "Waiting..." or "✓ Ready"
- Player count: "X/4" (max 4 players)

#### Ready System
- Each player has "Mark as Ready" button
- Toggle ready status (can cancel ready)
- Real-time updates via Supabase subscriptions
- "All players ready! Starting match..." when everyone is ready
- Auto-starts game 2 seconds after all players ready

**Database Tables:**
```sql
test_mode_lobbies:
  - id
  - lobby_code (unique 6 chars)
  - entry_fee (1, 5, or 10)
  - status (waiting, in_progress, completed)
  - created_by (user_id)
  - winner_id

test_mode_lobby_players:
  - id
  - lobby_id
  - user_id
  - username
  - is_ready (boolean)
  - has_accepted_terms (boolean)
  - mock_kyc_completed (boolean)
  - mock_kyc_ssn_last4
  - test_score
  - placement
```

---

### 4. Skill Test Game

**Game Type:** Reflex Tap Test

**Objective:** Tap the target button as many times as possible in 10 seconds

**UI:**
- Large circular tap target (200px diameter)
- Real-time score counter
- 10-second countdown timer
- Neon gradient visual effects
- Tap feedback animation (scale down on press)

**Game Flow:**
```
1. Game starts automatically when all players ready
2. 10-second timer begins
3. Player taps circular target as fast as possible
4. Each tap increments score counter
5. Timer counts down: 10s → 9s → ... → 0s
6. Game ends at 0 seconds
7. Score submitted to database
8. Lobby creator finalizes results
```

**Scoring:**
- Each tap = +1 point
- No penalties
- Higher score = better placement
- Deterministic (pure skill, no RNG)

---

### 5. Results Screen

**Purpose:** Display final standings and payouts

**Features:**

#### Final Standings Table
- Sorted by placement (1st → last)
- Winner highlighted with 🏆 trophy icon
- Shows for each player:
  - Placement (#1, #2, #3, #4)
  - Username
  - Final score
  - Winnings/losses (test credits)

#### Payout Calculation
```javascript
Total Pot = Entry Fee × Number of Players
Winner Gets = Total Pot × 0.8 (80%)
Others Lose = Their entry fee

Example with $5 entry, 4 players:
  Total Pot: $20
  Winner: +$16 ($20 × 0.8)
  2nd Place: -$5
  3rd Place: -$5
  4th Place: -$5
```

#### Test Credit Reminder
- Clear banner: "All credits are virtual test credits. No real money was won or lost."
- "Return to Main Menu" button

---

## Complete User Flow

### Flow 1: Create New Lobby

```
1. User navigates to /cash-challenge-test.html
2. Clicks "Start Cash Challenge"
3. Consent modal appears
   - Reads terms
   - Selects entry fee ($5)
   - Checks agreement box
   - Clicks "Continue to Mock KYC"
4. Mock KYC modal appears
   - Enters SSN last 4: "1234"
   - Clicks "Choose File (Mock Upload)"
   - Clicks "Submit Mock KYC"
5. Lobby created automatically
   - Shows lobby code: "ABC123"
   - Player added to lobby as creator
   - "Mark as Ready" button available
6. Player copies invite link
   - Shares with friends
7. Friends join via link (see Flow 2)
8. All players mark ready
9. Match starts automatically
10. 10-second reflex test plays
11. Results displayed
12. Winner gets 80% of pot (test credits)
```

### Flow 2: Join Existing Lobby

```
1. Friend receives invite link
2. Opens link in browser
   - URL: /cash-challenge-test.html?lobby=ABC123
3. System detects lobby code parameter
4. Consent modal appears
   - Must accept terms
   - Must complete mock KYC
5. After KYC, automatically joins lobby ABC123
6. Added to player list
7. Marks ready when prepared
8. Game starts when all players ready
9. Plays 10-second reflex test
10. Results displayed
```

---

## Real-Time Multiplayer

**Technology:** Supabase Realtime Subscriptions

**Channels:**
- `lobby:{lobby_id}` - Subscribes to lobby updates

**Events:**
- Player joins → Player list updates for all
- Player marks ready → Ready count updates for all
- All players ready → Lobby status changes to "in_progress"
- Lobby status changes → Game starts for all players
- Player submits score → Scores recorded
- Lobby finalized → Results shown to all

**Implementation:**
```javascript
supabase
  .channel(`lobby:${lobbyId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'test_mode_lobby_players',
    filter: `lobby_id=eq.${lobbyId}`
  }, () => {
    updatePlayerList();
  })
  .subscribe();
```

---

## Database Schema

### test_mode_lobbies

```sql
CREATE TABLE test_mode_lobbies (
  id uuid PRIMARY KEY,
  lobby_code text UNIQUE NOT NULL,
  entry_fee integer DEFAULT 5,
  status text CHECK (status IN ('waiting', 'in_progress', 'completed')),
  created_by uuid REFERENCES auth.users(id),
  game_type text DEFAULT 'reflex_test',
  max_players integer DEFAULT 4,
  winner_id uuid,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);
```

### test_mode_lobby_players

```sql
CREATE TABLE test_mode_lobby_players (
  id uuid PRIMARY KEY,
  lobby_id uuid REFERENCES test_mode_lobbies(id),
  user_id uuid REFERENCES auth.users(id),
  username text NOT NULL,
  is_ready boolean DEFAULT false,
  has_accepted_terms boolean DEFAULT false,
  mock_kyc_completed boolean DEFAULT false,
  mock_kyc_ssn_last4 text,
  test_score integer DEFAULT 0,
  placement integer,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(lobby_id, user_id)
);
```

### Helper Functions

**generate_lobby_code():**
- Generates unique 6-character alphanumeric code
- Avoids confusing characters (I, O, 0, 1)
- Checks for uniqueness in database

**check_all_players_ready(lobby_id):**
- Returns true if all players in lobby are ready
- Used to trigger auto-start

---

## Security & Safety

### TEST MODE Safeguards

1. **Clear Labeling:**
   - Persistent banner: "TEST MODE ONLY - NO REAL MONEY"
   - Repeated warnings in all modals
   - "Test Credits" labels everywhere

2. **No Real Data:**
   - Mock KYC collects no real data
   - SSN is not validated or stored securely
   - File uploads are fake (no actual uploads)
   - No connection to real KYC providers

3. **No Real Money:**
   - All credits are virtual numbers
   - No deposit functionality
   - No withdrawal functionality
   - No payment processor integration
   - Balances stored in memory only (not persistent)

4. **Isolated Tables:**
   - Separate `test_mode_*` tables
   - No connection to real user balances
   - No connection to real verification system
   - Easy to purge test data

### Row Level Security

**All tables have RLS enabled:**

- Users can only view lobbies they created or joined
- Users can only update their own player status
- Lobby creators can update lobby status
- No cross-user data access

---

## Testing Scenarios

### Scenario 1: Single Player Creates Lobby

```
1. Start cash challenge
2. Complete consent and mock KYC
3. Lobby created with code ABC123
4. Mark self as ready
5. Wait (nothing happens - need 2+ players)
6. Share invite link
```

### Scenario 2: Two Players Complete Match

```
Player 1:
  1. Create lobby (ABC123)
  2. Mark ready
  3. Wait for Player 2

Player 2:
  1. Open invite link
  2. Accept consent + KYC
  3. Join lobby ABC123
  4. Mark ready

Both Players:
  5. Match starts automatically
  6. Play 10-second tap game
  7. See results
  8. Winner gets 80% of pot
```

### Scenario 3: Four Player Tournament

```
4 players, $10 entry each
Total pot: $40

Results:
  1st Place: 45 taps → Wins $32 (+$22 profit)
  2nd Place: 38 taps → Loses $10
  3rd Place: 31 taps → Loses $10
  4th Place: 25 taps → Loses $10
```

---

## Future Enhancements

### Alternative Game Modes

**Trivia Mode:**
- 10 rapid-fire questions
- Score = correct answers
- Questions from database

**Math Challenge:**
- Solve as many math problems as possible in 30 seconds
- Difficulty increases with each correct answer
- Score = total correct

**Typing Speed Test:**
- Type random words/sentences
- Score = words per minute
- Accuracy penalties

### Tournament Features

**Bracket System:**
- Multi-round elimination
- Winners advance to next round
- Grand prize for tournament winner

**Spectator Mode:**
- Watch ongoing matches
- Real-time score updates
- Betting with test credits (spectators only)

**Leaderboards:**
- Daily/weekly/all-time rankings
- Top players by game mode
- Stats tracking (win rate, avg score, etc.)

### Social Features

**Friends List:**
- Add friends
- Challenge friends directly
- Private lobbies

**Chat System:**
- Lobby chat
- Post-game chat
- Emoji reactions

**Replay System:**
- Save game replays
- Share best performances
- Review past matches

---

## Technical Architecture

### Stack

- **Frontend:** Vanilla JavaScript (ES6+)
- **Database:** Supabase (PostgreSQL)
- **Realtime:** Supabase Realtime Subscriptions
- **Auth:** Supabase Auth
- **Styling:** Custom CSS with CSS Variables

### State Management

```javascript
// Global state
let currentUser = null;           // Supabase user object
let selectedFee = 5;              // Entry fee selection
let mockKYCData = {};             // KYC form data (not validated)
let currentLobby = null;          // Active lobby object
let myPlayerId = null;            // Current player's ID in lobby
let lobbySubscription = null;     // Realtime subscription
let gameTimer = null;             // Game countdown interval
let gameScore = 0;                // Player's tap count
```

### Screen Management

```javascript
Screens:
  - mainScreen (initial landing)
  - consentModal (terms agreement)
  - kycModal (mock verification)
  - loadingScreen (transitions)
  - lobbyScreen (waiting room)
  - gameScreen (reflex test)
  - resultsScreen (final standings)

Only one screen visible at a time
Managed via .hidden class toggle
```

---

## Deployment Notes

### Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Currently hardcoded in HTML file for simplicity. For production, move to environment variables.

### Database Setup

Run migration:
```sql
-- See: supabase/migrations/create_test_mode_lobby_tables.sql
```

### Build

```bash
npm run build
# Outputs to dist/
```

### Serve

```bash
npm run dev
# Navigate to /cash-challenge-test.html
```

---

## FAQ

**Q: Is any real money used?**
A: No. All credits are virtual test credits for demonstration only.

**Q: Is KYC data validated or stored?**
A: No. The KYC screen is a mock simulation. No real data is collected or verified.

**Q: Can I withdraw test credits?**
A: No. Test credits are not real money and cannot be withdrawn.

**Q: How many players can join a lobby?**
A: Maximum 4 players per lobby (configurable in database).

**Q: What happens if a player leaves during the game?**
A: Currently, the game continues. Future enhancement: Handle disconnections gracefully.

**Q: Can I play alone?**
A: Technically yes (mark ready solo), but the game is designed for 2+ players.

**Q: How is the winner determined?**
A: Highest score wins. In case of tie, first player to achieve the score wins.

**Q: What if all players get the same score?**
A: First player to submit that score wins (timestamp tiebreaker).

---

## Known Limitations

1. **No reconnection handling** - If player refreshes during game, they lose their spot
2. **No mobile optimization** - Best experience on desktop
3. **QR code is placeholder** - Not implemented, just visual placeholder
4. **Single game mode** - Only reflex test available
5. **No chat** - Players cannot communicate in lobby
6. **No spectators** - Cannot watch ongoing matches
7. **Test credits not persistent** - Credits reset on page reload

---

## Support

For issues or questions about Cash Challenge Test Mode:

1. Check console for errors
2. Verify Supabase connection
3. Confirm RLS policies are enabled
4. Check database tables exist
5. Verify user is authenticated

---

**Last Updated:** November 17, 2025
**Version:** 1.0.0
**Status:** Test Mode - Fully Functional
