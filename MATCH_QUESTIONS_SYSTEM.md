# Match Questions System

## Overview

The Match Questions System ensures that all players in a multiplayer lobby receive the **exact same set of 10 questions** in the same order. This is critical for fair competition.

## Architecture

### Components

1. **Edge Function**: `create-match-questions`
   - Server-side question selection
   - Handles deduplication and freshness logic
   - Idempotent (safe to call multiple times)

2. **Database Tables**:
   - `questions` - Question bank
   - `match_questions` - Links matches to their question set
   - `user_seen_questions` - Tracks which users have seen which questions

3. **Client Helper**: `src/match-questions-client.js`
   - Simple API wrapper for frontend integration

## Question Selection Algorithm

### Difficulty Schedule

Every match has exactly 10 questions with a fixed difficulty progression:

- **Questions 1-5**: Easy (difficulty = 'easy')
- **Questions 6-8**: Medium (difficulty = 'medium')
- **Questions 9-10**: Hard (difficulty = 'hard')

### Freshness System

To avoid repeat questions, the system tracks which players have seen which questions recently:

- **Competitive mode**: 30-day freshness window
- **Free mode**: 14-day freshness window

### Tier Selection

For each question slot, candidates are ranked into tiers:

- **Tier A**: seen by 0 players (ideal)
- **Tier B**: seen by 1 player
- **Tier C**: seen by 2 players
- **Tier D**: seen by 3+ players (fallback)

The system always picks from the best available tier.

Within a tier, questions are sorted by:
1. Seen count (lowest first)
2. Creation date (oldest first, for variety)
3. Random tiebreaker

## API Reference

### Edge Function Endpoint

```
POST /functions/v1/create-match-questions
```

### Request Format

```json
{
  "matchId": "uuid",
  "category": "Sports",
  "playerIds": ["uuid1", "uuid2", "uuid3"],
  "mode": "competitive"
}
```

**Parameters:**

- `matchId` (string, required): UUID of the match
- `category` (string, required): Question category. Valid options:
  - Politics
  - Business
  - Sports
  - Music
  - Movies
  - History
  - Geography
  - Science
  - Pop Culture
  - Stakes
- `playerIds` (string[], required): Array of player UUIDs (minimum 1)
- `mode` (string, required): Either "competitive" or "free"

### Response Format

```json
{
  "success": true,
  "matchId": "123e4567-e89b-12d3-a456-426614174000",
  "category": "Sports",
  "cached": false,
  "questions": [
    {
      "roundNo": 1,
      "question": {
        "id": "q-uuid-1",
        "category": "Sports",
        "difficulty": "easy",
        "prompt": "Which country won the FIFA World Cup in 2018?",
        "choices": ["Brazil", "France", "Germany", "Argentina"],
        "correct": 1,
        "explanation": "France won the 2018 FIFA World Cup held in Russia, defeating Croatia 4-2 in the final."
      }
    },
    {
      "roundNo": 2,
      "question": {
        "id": "q-uuid-2",
        "category": "Sports",
        "difficulty": "easy",
        "prompt": "How many players are on a basketball team on the court?",
        "choices": ["4", "5", "6", "7"],
        "correct": 1,
        "explanation": "A basketball team has 5 players on the court at any given time."
      }
    }
    // ... 8 more questions
  ]
}
```

**Response Fields:**

- `success` (boolean): Always true on success
- `matchId` (string): The match UUID
- `category` (string): The category used
- `cached` (boolean): True if questions already existed (idempotency)
- `questions` (array): Array of 10 question objects

### Error Responses

**400 Bad Request** - Invalid input:
```json
{
  "error": "Invalid category. Must be one of: Politics, Business, Sports..."
}
```

**404 Not Found** - Insufficient questions:
```json
{
  "error": "No questions available for category 'Sports' with difficulty 'hard'",
  "category": "Sports",
  "difficulty": "hard",
  "roundNo": 9
}
```

**500 Internal Server Error** - Database or system error:
```json
{
  "error": "Internal server error",
  "details": "Connection timeout"
}
```

## Client Integration

### Basic Usage

```javascript
import { createMatchQuestions } from './match-questions-client.js';

// When lobby locks and is ready to start
async function startMatch(lobby) {
  try {
    const result = await createMatchQuestions(
      lobby.match_id,
      lobby.category,
      lobby.players.map(p => p.user_id),
      lobby.is_cash_match ? 'competitive' : 'free'
    );

    // All players will receive these questions
    console.log('Match starting with', result.questions.length, 'questions');

    // Proceed to start the match
    await startGameWithQuestions(result.questions);

  } catch (error) {
    console.error('Failed to create match questions:', error);
    // Handle error - cancel match or retry
    await cancelMatch(lobby.match_id, error.message);
  }
}
```

### Integration Points

The function should be called:

1. **After lobby lock**: When all players are ready
2. **Before match start**: Questions must exist before gameplay begins
3. **Once per match**: The function is idempotent (safe to retry)

**DO NOT** call this function:
- For each individual player
- During gameplay
- Multiple times for the same match (unless retrying on error)

### Error Handling

```javascript
try {
  const result = await createMatchQuestions(matchId, category, playerIds, mode);
  return result;
} catch (error) {
  if (error.message.includes('No questions available')) {
    // Insufficient question bank - try different category or notify admin
    console.error('Question bank depleted for:', category);
    // Fallback strategy here
  } else if (error.message.includes('not authenticated')) {
    // Auth issue - redirect to login
    window.location.href = '/login';
  } else {
    // Generic error - retry or cancel match
    console.error('Unexpected error:', error);
  }
}
```

## Database Schema

### match_questions Table

Stores the mapping between matches and their questions:

```sql
CREATE TABLE match_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  lobby_id uuid,
  question_id uuid NOT NULL REFERENCES questions(id),
  question_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Key points:**
- Each match has 10 rows (question_number 1-10)
- All players query the same match_id to get their questions
- Created once when lobby locks

## Performance Considerations

### Caching (Idempotency)

If questions already exist for a match, they're returned immediately from the database. This makes the function safe to call multiple times.

### Query Optimization

For large player bases:
- The system queries `user_seen_questions` efficiently
- Tier selection happens in memory after batch queries
- Questions are selected sequentially (not parallel) to avoid duplicates

### Scaling

**Current capacity:**
- 10 questions per match
- ~1-2 seconds for cold selection
- <100ms for cached retrieval

**Bottlenecks:**
- Question bank size per category/difficulty
- Database query performance for seen_count

**Recommendations:**
- Maintain 500+ questions per category/difficulty combination
- Index `user_seen_questions(user_id, question_id, seen_at)`
- Monitor question reuse rates

## Testing

### Manual Test

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-match-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "matchId": "123e4567-e89b-12d3-a456-426614174000",
    "category": "Sports",
    "playerIds": ["user-uuid-1", "user-uuid-2"],
    "mode": "free"
  }'
```

### Expected Behavior

1. **First call**: Creates and returns 10 questions (cached: false)
2. **Second call** (same matchId): Returns existing questions (cached: true)
3. **Different matchId**: Creates new set of 10 questions

### Verification

Check that:
- All 10 questions are returned
- Difficulty follows schedule (5 easy, 3 medium, 2 hard)
- No duplicate question IDs in the same match
- Questions match the requested category
- `match_questions` table has 10 rows for the match

## Monitoring

### Logs

The function logs detailed information:

```
[CREATE-MATCH-QUESTIONS] Processing match abc-123, category: Sports, players: 4, mode: competitive
[CREATE-MATCH-QUESTIONS] Using freshness window: 30 days
[CREATE-MATCH-QUESTIONS] Selecting question 1/10, difficulty: easy
[CREATE-MATCH-QUESTIONS] Found 247 candidate questions
[CREATE-MATCH-QUESTIONS] Tier distribution - A: 189, B: 42, C: 14, D: 2
[CREATE-MATCH-QUESTIONS] Selected question q-xyz-789, seenCount: 0
...
[CREATE-MATCH-QUESTIONS] Successfully created 10 questions for match abc-123
```

### Key Metrics

Monitor these in production:
- Question bank size per category/difficulty
- Average tier distribution (should be mostly Tier A)
- Question reuse frequency
- Failed requests due to insufficient questions

## Troubleshooting

### "No questions available"

**Cause**: Insufficient questions in the database for the requested category/difficulty

**Solution**:
1. Check question bank: `SELECT category, difficulty, COUNT(*) FROM questions WHERE is_active = true GROUP BY category, difficulty`
2. Generate more questions for that category/difficulty
3. Consider relaxing freshness constraints

### Questions repeating too often

**Cause**: Small question bank or many active players

**Solution**:
1. Increase question bank size (target: 500+ per category/difficulty)
2. Adjust freshness window (decrease for more repeats, increase for fewer)
3. Add more categories to distribute load

### Slow performance

**Cause**: Large player base or missing indexes

**Solution**:
1. Check indexes on `user_seen_questions`
2. Monitor database query performance
3. Consider caching tier calculations

## Future Enhancements

Potential improvements:

1. **Batch optimization**: Pre-compute question sets for common scenarios
2. **Dynamic difficulty**: Adjust based on player skill levels
3. **Category mixing**: Allow multi-category matches
4. **Question rotation**: Ensure even distribution across entire bank
5. **Real-time stock monitoring**: Alert when question bank is low
