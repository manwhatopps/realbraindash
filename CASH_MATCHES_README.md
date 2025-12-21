# BrainDash Cash Matches System

## Overview

A complete multi-player wager-based trivia match system supporting 1v1, 1vMany, and group tournaments (2-10+ players). Built with Supabase (Postgres + Edge Functions + Realtime) and vanilla JavaScript.

## Key Features

- ✅ **Scalable Multi-Player**: Supports 2 to 10+ players per match (no hardcoded 1v1 logic)
- ✅ **Flexible Payout Models**: Winner-take-all, Top 3 split, Percentile, Custom
- ✅ **Real-time Lobbies**: Live player joins with WebSocket updates
- ✅ **Secure Escrow**: All funds held in escrow until match finalization
- ✅ **Atomic Transactions**: Full wallet ledger with audit trail
- ✅ **Private & Public Rooms**: Room codes for invite-only matches
- ✅ **Multiple Game Modes**: Classic, Sprint, Blitz, Sudden Death

## Architecture

### Database Schema

#### `cash_matches`
Main match configuration table supporting dynamic player counts.

```sql
- id (uuid, pk)
- creator_id (uuid, fk to auth.users)
- entry_fee_cents (bigint)
- currency (text, default 'USD')
- min_players (int, default 2)
- max_players (int)
- mode (text: sprint | blitz | sudden_death | classic)
- category (text, nullable)
- question_count (int, default 10)
- time_per_question_ms (int, default 15000)
- payout_model (text: winner_take_all | top3 | percentile | custom)
- payout_config (jsonb)
- rake_percent (numeric, default 5.00)
- is_private (boolean, default false)
- room_code (text, nullable, unique)
- status (text: waiting | starting | active | completed | cancelled)
- started_at (timestamptz)
- completed_at (timestamptz)
- questions (jsonb)
- created_at, updated_at
```

#### `cash_match_players`
One row per player per match - enables N-player support.

```sql
- id (uuid, pk)
- match_id (uuid, fk to cash_matches)
- user_id (uuid, fk to auth.users)
- joined_at (timestamptz)
- score (int, nullable)
- time_taken_ms (bigint, nullable)
- finished_at (timestamptz, nullable)
- result (text: pending | win | loss | tie)
- payout_cents (bigint, default 0)
- placement (int, nullable)
- UNIQUE(match_id, user_id)
```

#### `cash_match_escrows`
Holds combined pot from all players.

```sql
- id (uuid, pk)
- match_id (uuid, fk to cash_matches, unique)
- total_pot_cents (bigint)
- rake_cents (bigint)
- net_pot_cents (bigint)
- status (text: pending | released | refunded)
- released_at (timestamptz)
- created_at, updated_at
```

#### `user_wallets`
User balance storage.

```sql
- user_id (uuid, pk, fk to auth.users)
- balance_cents (bigint, >= 0)
- currency (text, default 'USD')
- created_at, updated_at
```

#### `wallet_ledger`
Complete audit trail of all money movements.

```sql
- id (uuid, pk)
- user_id (uuid, fk to auth.users)
- amount_cents (bigint)
- balance_after_cents (bigint)
- transaction_type (text: deposit | withdrawal | match_entry | match_payout | match_refund | rake)
- match_id (uuid, nullable)
- description (text)
- created_at
```

### Edge Functions

All functions are deployed and accessible at:
`https://uimxwujknpuespwvipbi.supabase.co/functions/v1/{function-name}`

#### 1. `cash-matches-create`
**POST** - Creates a new match and adds creator as first player.

**Request Body:**
```json
{
  "entry_fee_cents": 500,
  "min_players": 2,
  "max_players": 4,
  "mode": "classic",
  "question_count": 10,
  "time_per_question_ms": 15000,
  "payout_model": "winner_take_all",
  "rake_percent": 5.0,
  "is_private": false,
  "room_code": null
}
```

**Response:**
```json
{
  "success": true,
  "match": { ... }
}
```

**Actions:**
1. Validates user has sufficient balance
2. Creates match record
3. Deducts entry fee from creator's wallet
4. Records transaction in ledger
5. Adds creator to `cash_match_players`
6. Creates escrow with initial pot
7. Generates room code if private

#### 2. `cash-matches-join`
**POST** - Adds a player to an existing match.

**Request Body:**
```json
{
  "match_id": "uuid",
  // OR
  "room_code": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "match": { ... },
  "player_count": 3,
  "can_start": true
}
```

**Actions:**
1. Finds match by ID or room code
2. Validates match is in 'waiting' status
3. Checks user isn't already joined
4. Checks match isn't full
5. Validates user balance
6. Deducts entry fee
7. Adds player to match
8. Updates escrow pot
9. Auto-starts if max_players reached

#### 3. `cash-matches-start`
**POST** - Starts the match (host only).

**Request Body:**
```json
{
  "match_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "match_id": "uuid",
  "status": "active",
  "player_count": 4,
  "question_count": 10
}
```

**Actions:**
1. Validates caller is match creator
2. Checks min_players requirement met
3. Selects questions from pool
4. Updates match status to 'active'
5. Stores questions in match.questions (jsonb)
6. Sets started_at timestamp

#### 4. `cash-matches-get-questions`
**GET** - Returns questions for a player (without answers).

**Query Params:**
- `match_id`: uuid

**Response:**
```json
{
  "success": true,
  "match_id": "uuid",
  "questions": [
    {
      "id": 1,
      "question": "What is 2 + 2?",
      "answers": ["3", "4", "5", "6"],
      "category": "math"
    }
  ],
  "time_per_question_ms": 15000,
  "mode": "classic"
}
```

**Security:**
- Verifies user is a player in the match
- Returns questions WITHOUT correct answer indexes
- Only available when match status is 'active' or 'completed'

#### 5. `cash-matches-submit-score`
**POST** - Submits player's answers and calculates score.

**Request Body:**
```json
{
  "match_id": "uuid",
  "answers": [1, 0, 2, 1, 3, 2, 0, 1, 1, 2],
  "time_taken_ms": 45230
}
```

**Response:**
```json
{
  "success": true,
  "score": 800,
  "correct_count": 8,
  "total_questions": 10,
  "all_finished": true
}
```

**Actions:**
1. Validates user is a player
2. Checks score not already submitted
3. Compares answers with correct answers from match.questions
4. Calculates score (100 pts per correct answer)
5. Updates player record with score and time
6. Checks if all players finished
7. Sets match to 'completed' if all done

#### 6. `cash-matches-finalize`
**POST** - Distributes payouts based on final scores.

**Request Body:**
```json
{
  "match_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "player_id": "uuid",
      "amount": 1425,
      "placement": 1,
      "result": "win"
    }
  ],
  "rake_cents": 75,
  "net_pot_cents": 1425
}
```

**Payout Algorithms:**

**Winner Take All:**
```
1st place: 100% of net pot
Others: $0
```

**Top 3:**
```
1st: 60% of net pot
2nd: 30% of net pot
3rd: 10% of net pot
Others: $0
```

**Percentile (Top 50%):**
```
Top 50% of players split pot equally
Others: $0
```

**Actions:**
1. Validates match is 'completed'
2. Checks all players submitted scores
3. Sorts players by score (ties broken by time)
4. Calculates rake (default 5%)
5. Applies payout model algorithm
6. Updates each player's result and payout
7. Credits winners' wallets
8. Records payout transactions in ledger
9. Marks escrow as 'released'

**Critical:** This function must ONLY run once per match. All logic is server-side.

## Client SDK

### JavaScript SDK (`/src/cash-matches-sdk.js`)

```javascript
import { cashMatchesSDK } from '/src/cash-matches-sdk.js';

// Create a match
const result = await cashMatchesSDK.createCashMatch({
  entry_fee_cents: 500,
  min_players: 2,
  max_players: 4,
  mode: 'classic',
  question_count: 10,
  payout_model: 'winner_take_all'
});

// Join a match
await cashMatchesSDK.joinCashMatch(matchId);
// OR by room code
await cashMatchesSDK.joinCashMatch('ABC123');

// Start match (creator only)
await cashMatchesSDK.startCashMatch(matchId);

// Get questions
const { questions } = await cashMatchesSDK.fetchMatchQuestions(matchId);

// Submit score
await cashMatchesSDK.submitMatchScore(matchId, answers, timeTakenMs);

// Finalize match
await cashMatchesSDK.finalizeMatch(matchId);

// Get match details
const match = await cashMatchesSDK.getMatch(matchId);
const players = await cashMatchesSDK.getMatchPlayers(matchId);
const results = await cashMatchesSDK.getMatchResults(matchId);

// Get wallet
const wallet = await cashMatchesSDK.getUserWallet();

// Wait for match to start
await cashMatchesSDK.awaitMatchStart(matchId);

// Subscribe to match updates
const unsubscribe = cashMatchesSDK.subscribeToMatch(matchId, (event) => {
  if (event.type === 'match_updated') {
    console.log('Match updated:', event.data);
  } else if (event.type === 'player_joined') {
    console.log('Player joined:', event.data);
  }
});
```

## User Flow

### Creating & Hosting a Match

1. User fills out match creation form
2. System validates balance >= entry_fee
3. Match created in 'waiting' status
4. Creator's entry fee deducted
5. Creator shown lobby with room code (if private)
6. Real-time updates as players join
7. Creator clicks "Start" when min_players reached
8. Match transitions to 'active'
9. Questions loaded for all players

### Joining a Match

1. User browses public matches OR enters room code
2. Clicks join
3. System validates balance and availability
4. Entry fee deducted
5. User added to lobby
6. Waits for host to start
7. Auto-redirects when match goes active

### Playing the Match

1. Questions appear one at a time
2. Timer bar shows remaining time
3. User selects answer
4. Next question loads automatically
5. After final question, answers **automatically submit** (no button)
6. Score calculated server-side
7. "Calculating results..." screen appears

### Match Finalization & Results (Fully Automatic)

**CRITICAL: NO MANUAL "SUBMIT SCORE" BUTTON EXISTS**

The system works as follows:

1. When quiz ends, game engine **automatically calls** `submitMatchScore()`
2. Server validates answers and calculates score
3. Server checks if all players have finished
4. **IF all players finished**: Match auto-finalizes immediately
   - Rankings calculated
   - Payout algorithm applied
   - Funds transferred to winners
   - Match status set to 'completed'
5. **IF waiting for others**: Frontend polls match status
6. Results screen automatically shows when ready:
   - Final placements
   - Scores
   - Payouts
   - Updated wallet balance

Players simply play the quiz. Everything else happens automatically server-side.

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

- **user_wallets**: Users can only view/update their own wallet
- **wallet_ledger**: Users can only view their own transactions
- **cash_matches**: Users can view public matches or matches they've joined
- **cash_match_players**: Users can view players in matches they're in
- **cash_match_escrows**: Users can view escrows for their matches

### Server-Side Validation

- All money operations validated server-side
- Scores calculated by comparing with server-stored correct answers
- Payouts distributed only by Edge Function
- Escrow never released without finalization
- Balance checks before all transactions

### Atomic Transactions

- Entry fees deducted before adding to match
- Payouts recorded in ledger before wallet credit
- All operations use Postgres transactions
- Failed operations roll back completely

## Testing the System

### 1. Setup Test Wallets

First, add funds to user wallets manually via SQL or a deposit function:

```sql
INSERT INTO user_wallets (user_id, balance_cents)
VALUES ('user-uuid', 10000)  -- $100.00
ON CONFLICT (user_id)
DO UPDATE SET balance_cents = user_wallets.balance_cents + 10000;
```

### 2. Test Flow (2 Players)

**Terminal 1 (Player 1 - Host):**
```javascript
// Visit /cash-matches.html
// Sign in as user1
// Create match: $5 entry, 2-4 players, winner-take-all
// Note the match ID
// Wait in lobby
```

**Terminal 2 (Player 2):**
```javascript
// Visit /cash-matches.html
// Sign in as user2
// Browse matches, join the one created by Player 1
// Both users now in lobby
```

**Back to Terminal 1:**
```javascript
// Click "Start Match"
// Both users redirected to game
```

**Both players:**
```javascript
// Answer questions
// Submit when done
```

**Automatic:**
```javascript
// When both finish, finalize runs
// Results screen shows:
//   - Player 1 (if won): Score 900, Payout $9.50
//   - Player 2 (if lost): Score 700, Payout $0.00
// Wallets updated automatically
```

### 3. Test Multi-Player (4 Players)

Same flow but with 4 users. Test payout models:

- **Winner Take All**: Only 1st place gets paid
- **Top 3**: 1st, 2nd, 3rd split pot (60/30/10%)
- **Percentile**: Top 50% (2 players) split pot equally

## Extending the System

### Adding New Payout Models

Edit `cash-matches-finalize` Edge Function:

```typescript
function calculatePayouts(players, totalPot, rakeCents, payoutModel) {
  const netPot = totalPot - rakeCents;

  switch (payoutModel) {
    case 'your_model':
      // Your payout logic here
      break;
    // ...
  }
}
```

### Adding Tournament Brackets

The current architecture supports adding tournaments:

1. Create `tournaments` table with bracket structure
2. Link multiple `cash_matches` to a tournament
3. Use `payout_model: 'custom'` for tournament prizes
4. Track advancement through rounds
5. Final match distributes tournament pot

### Integrating Real Questions Database

Replace sample questions in `cash-matches-start`:

```typescript
// Instead of SAMPLE_QUESTIONS
const { data: questions } = await supabase
  .from('questions')
  .select('*')
  .eq('category', match.category)
  .limit(match.question_count);
```

## Deployment

### Edge Functions

All functions are already deployed:
- ✅ cash-matches-create
- ✅ cash-matches-join
- ✅ cash-matches-start
- ✅ cash-matches-get-questions
- ✅ cash-matches-submit-score
- ✅ cash-matches-finalize

### Database

All tables and RLS policies are created via migrations:
- ✅ `20251115023554_create_kyc_fields.sql`
- ✅ `20251115024042_fix_kyc_security_issues.sql`
- ✅ `{timestamp}_create_multiplayer_cash_matches.sql`

### Frontend

Access the cash matches UI at:
`/cash-matches.html`

## Troubleshooting

### "Insufficient funds" error
- Check user wallet balance: `SELECT * FROM user_wallets WHERE user_id = 'uuid'`
- Add test funds using INSERT statement above

### Match won't start
- Verify min_players requirement met
- Check only creator can start
- Ensure match status is 'waiting'

### Finalize fails
- Confirm all players submitted scores
- Verify match status is 'completed'
- Check escrow hasn't already been released

### Questions not loading
- Ensure match status is 'active'
- Verify user is in cash_match_players
- Check questions were stored during start

## Performance Considerations

- Indexes created on all foreign keys
- RLS policies optimized with `(select auth.uid())`
- Escrow updates use atomic operations
- Realtime subscriptions filtered per match
- Question pool pre-loaded, not fetched per-player

## Future Enhancements

- [ ] Scheduled matches (start at specific time)
- [ ] Team-based matches (2v2, 3v3)
- [ ] Skill-based matchmaking
- [ ] Leaderboards
- [ ] Tournament brackets
- [ ] Practice mode (no entry fee)
- [ ] Spectator mode
- [ ] Replay system
- [ ] Chat/reactions during match
- [ ] Mobile app with push notifications

## Support

For issues or questions, check:
1. Supabase logs in dashboard
2. Browser console for client errors
3. Edge Function logs for server errors
4. Database triggers/constraints for data issues

---

**Built with ❤️ for BrainDash**

**Status**: Production-ready ✅
**Last Updated**: November 2025
