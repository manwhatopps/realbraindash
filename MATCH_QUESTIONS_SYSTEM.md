# Match Questions System - Complete Documentation

## Overview

The Match Questions System is a hybrid static bank architecture that ensures all players in a multiplayer lobby receive the **exact same set of 10 questions** in the same order. Questions are selected from a static database (no AI during gameplay), with smart freshness tracking to minimize repeats.

## Key Principles

1. **Shared Questions**: All players in a match get identical questions
2. **Static Bank**: Questions come from pre-generated database (no OpenAI during gameplay)
3. **Frozen Snapshots**: Questions are snapshot into `match_questions` at match creation
4. **Smart Freshness**: Tracks recently-seen questions per user to minimize repeats
5. **Difficulty Schedule**: Fixed progression (Q1-5: easy, Q6-8: medium, Q9-10: hard)

## Architecture

### Database Tables

#### 1. `questions` (Static Bank)
Stores all playable trivia questions.

```sql
id                  uuid PRIMARY KEY
category            text NOT NULL
difficulty          text NOT NULL  -- 'easy', 'medium', 'hard'
difficulty_num      smallint NOT NULL CHECK (1,2,3)
q_type              text NOT NULL DEFAULT 'mcq'
prompt              text NOT NULL
choices             jsonb NOT NULL  -- [{"id":"A","text":"..."},...]
correct_index       integer NOT NULL
origin              text NOT NULL  -- 'bank' or 'ai'
status              text NOT NULL  -- 'active', 'review', 'blocked'
quality_score       numeric(4,3) DEFAULT 0.750
explanation         text
created_at          timestamptz
updated_at          timestamptz
```

**Key Points**:
- `difficulty_num` (1/2/3) is used for efficient queries
- `status='active'` means question is playable
- `quality_score` helps select better questions
- Categories: Politics, Business, Sports, Music, Movies, History, Geography, Science, Pop Culture

#### 2. `match_questions` (Frozen Sets)
Stores the 10 questions for each match.

```sql
id              uuid PRIMARY KEY
match_id        uuid NOT NULL
round_no        int NOT NULL CHECK (1-10)
question_id     uuid NOT NULL REFERENCES questions(id)
payload         jsonb NOT NULL  -- Frozen question snapshot
created_at      timestamptz
UNIQUE(match_id, round_no)
```

**Payload Format**:
```json
{
  "id": "uuid",
  "category": "Sports",
  "difficulty": 2,
  "prompt": "Which country won the FIFA World Cup in 2018?",
  "choices": [
    {"id": "A", "text": "Brazil"},
    {"id": "B", "text": "France"},
    {"id": "C", "text": "Germany"},
    {"id": "D", "text": "Argentina"}
  ],
  "correct": {"choice_id": "B"},
  "explanation": "France won the 2018 FIFA World Cup..."
}
```

#### 3. `question_usage` (Freshness Tracking)
Tracks which users have seen which questions.

```sql
id              bigserial PRIMARY KEY
user_id         uuid NOT NULL REFERENCES auth.users(id)
question_id     uuid NOT NULL REFERENCES questions(id)
match_id        uuid
seen_at         timestamptz NOT NULL
is_correct      boolean
response_ms     integer
UNIQUE(user_id, question_id, match_id)
```

#### 4. `match_answers` (Scoring & Audit)
Records each answer submission.

```sql
id              bigserial PRIMARY KEY
match_id        uuid NOT NULL
round_no        int NOT NULL CHECK (1-10)
user_id         uuid NOT NULL REFERENCES auth.users(id)
question_id     uuid NOT NULL REFERENCES questions(id)
answer          jsonb NOT NULL  -- {"choice_id": "B"}
is_correct      boolean NOT NULL
points          int NOT NULL
response_ms     int
created_at      timestamptz
UNIQUE(match_id, round_no, user_id)
```

## Edge Functions

### 1. `create-match-questions`

Creates the shared 10-question set for a match.

**When to Call**: Once when lobby locks and is ready to start.

**Request**:
```json
POST /functions/v1/create-match-questions
{
  "matchId": "uuid",
  "category": "Sports",
  "playerIds": ["uuid1", "uuid2", "uuid3"],
  "mode": "competitive"  // or "free"
}
```

**Response**:
```json
{
  "success": true,
  "matchId": "uuid",
  "category": "Sports",
  "mode": "competitive",
  "cached": false,
  "questions": [
    {
      "roundNo": 1,
      "question": {
        "id": "q-uuid",
        "category": "Sports",
        "difficulty": 1,
        "prompt": "...",
        "choices": [...],
        "correct": {"choice_id": "B"},
        "explanation": "..."
      }
    },
    // ... 9 more questions
  ]
}
```

**Behavior**:
- **Idempotent**: Calling multiple times returns the same questions
- **Freshness**: Uses 30-day window for competitive, 14-day for free
- **Tier Selection**: Prioritizes questions unseen by most players
- **Difficulty Schedule**: Q1-5=easy(1), Q6-8=medium(2), Q9-10=hard(3)

### 2. `get-match-question`

Fetches a specific question for a round.

**When to Call**: At the start of each round (optional, can use cached questions from create call).

**Request**:
```json
POST /functions/v1/get-match-question
{
  "matchId": "uuid",
  "roundNo": 5
}
```

**Response**:
```json
{
  "success": true,
  "matchId": "uuid",
  "roundNo": 5,
  "question": {
    "id": "q-uuid",
    "category": "Sports",
    "difficulty": 1,
    "prompt": "...",
    "choices": [...],
    "correct": {"choice_id": "C"},
    "explanation": "..."
  }
}
```

### 3. `submit-answer`

Submits an answer, checks correctness, and computes points.

**When to Call**: When user submits answer for a round.

**Request**:
```json
POST /functions/v1/submit-answer
{
  "matchId": "uuid",
  "roundNo": 5,
  "userId": "user-uuid",
  "answer": {"choice_id": "B"},
  "responseMs": 4523
}
```

**Response**:
```json
{
  "success": true,
  "isCorrect": true,
  "points": 87,
  "correctAnswer": "B"
}
```

**Scoring Algorithm**:
```javascript
// Base points by difficulty
basePoints = difficulty === 1 ? 100 : difficulty === 2 ? 150 : 200

// Time bonus (faster = more points)
timeMultiplier = clamp(0.5, 1.0, (12000 - responseMs) / 12000 + 0.5)

points = isCorrect ? round(basePoints * timeMultiplier) : 0
```

## Frontend Integration

### TypeScript API

```typescript
import {
  createMatchQuestions,
  getMatchQuestion,
  submitAnswer
} from './lib/matchQuestions';

// 1. When lobby locks
const result = await createMatchQuestions(
  lobby.match_id,
  lobby.category,
  lobby.players.map(p => p.user_id),
  lobby.is_cash_match ? 'competitive' : 'free'
);

// Store questions for gameplay
const questions = result.questions;

// 2. During gameplay (for each round)
const question = questions[roundNo - 1].question;

// Display question to user...

// 3. When user answers
const result = await submitAnswer(
  matchId,
  roundNo,
  userId,
  selectedChoiceId,
  responseTimeMs
);

console.log(`Correct: ${result.isCorrect}, Points: ${result.points}`);
```

### Integration Points

**Lobby Lock**:
```typescript
async function onLobbyLock(lobby) {
  try {
    // Create shared questions
    const result = await createMatchQuestions(
      lobby.match_id,
      lobby.category,
      lobby.players.map(p => p.user_id),
      lobby.mode
    );

    // Store in match state
    lobby.questions = result.questions;

    // Start match with questions ready
    await startMatch(lobby);
  } catch (error) {
    console.error('Failed to create questions:', error);
    await cancelMatch(lobby.match_id, 'Question generation failed');
  }
}
```

**Game Round**:
```typescript
async function playRound(matchId, roundNo, questions) {
  const question = questions[roundNo - 1].question;

  // Display question
  displayQuestion(question);

  // Wait for user answer
  const { choiceId, responseMs } = await waitForUserAnswer();

  // Submit answer
  const result = await submitAnswer(
    matchId,
    roundNo,
    currentUserId,
    choiceId,
    responseMs
  );

  // Show result
  showResult(result);
  updateScore(result.points);
}
```

## Question Selection Algorithm

### Freshness Windows
- **Competitive mode**: 30 days
- **Free mode**: 14 days

### Tier System

For each round, candidates are ranked:

**Tier A**: Seen by 0 players (ideal)
**Tier B**: Seen by 1 player
**Tier C**: Seen by 2 players
**Tier D**: Seen by 3+ players (fallback)

Within each tier, questions are sorted by:
1. Seen count (lowest first)
2. Quality score (highest first)
3. Random tiebreaker

### Difficulty Schedule

```
Round 1-5:  Difficulty 1 (easy)
Round 6-8:  Difficulty 2 (medium)
Round 9-10: Difficulty 3 (hard)
```

This schedule is **non-negotiable** and hardcoded.

## Database Performance

### Indexes

```sql
-- Question selection
CREATE INDEX idx_questions_selection
ON questions(category, difficulty_num, status, quality_score, created_at)
WHERE status = 'active';

-- Freshness queries
CREATE INDEX idx_question_usage_user_seen
ON question_usage(user_id, seen_at DESC);

CREATE INDEX idx_question_usage_question_seen
ON question_usage(question_id, seen_at DESC);

-- Match lookups
CREATE INDEX idx_match_questions_lookup
ON match_questions(match_id, round_no);

-- Answer queries
CREATE INDEX idx_match_answers_match_user
ON match_answers(match_id, user_id);
```

### Query Patterns

**Efficient** (uses service role):
```typescript
// Batch seen counts for all candidates
SELECT question_id, COUNT(DISTINCT user_id) as seen_count
FROM question_usage
WHERE question_id = ANY($1)
  AND user_id = ANY($2)
  AND seen_at >= $3
GROUP BY question_id
```

**Avoid**:
- N+1 queries (query each question separately)
- Full table scans on questions
- Missing WHERE clauses on large tables

## Testing

### Manual Test Flow

```bash
# 1. Create questions
curl -X POST $URL/functions/v1/create-match-questions \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "123e4567-e89b-12d3-a456-426614174000",
    "category": "Sports",
    "playerIds": ["user1", "user2"],
    "mode": "free"
  }'

# 2. Get specific question
curl -X POST $URL/functions/v1/get-match-question \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "123e4567-e89b-12d3-a456-426614174000",
    "roundNo": 1
  }'

# 3. Submit answer
curl -X POST $URL/functions/v1/submit-answer \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "123e4567-e89b-12d3-a456-426614174000",
    "roundNo": 1,
    "userId": "user1",
    "answer": {"choice_id": "B"},
    "responseMs": 5000
  }'
```

### Automated Tests

See `tests/test-match-questions.js` for comprehensive test suite.

## Monitoring

### Key Metrics

1. **Question Bank Health**:
   - Questions per category/difficulty
   - Active vs blocked ratio
   - Average quality score

2. **Selection Performance**:
   - Tier distribution (should be mostly Tier A)
   - Question reuse frequency
   - Time to create question set

3. **Gameplay Metrics**:
   - Answer submission latency
   - Correct answer percentage
   - Average points per question

### Database Queries

```sql
-- Check question bank size
SELECT category, difficulty_num, COUNT(*) as count
FROM questions
WHERE status = 'active'
GROUP BY category, difficulty_num
ORDER BY category, difficulty_num;

-- Check freshness tracking
SELECT
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_usage_records,
  MAX(seen_at) as last_seen
FROM question_usage
WHERE seen_at >= NOW() - INTERVAL '30 days';

-- Check answer submission rate
SELECT
  DATE(created_at) as date,
  COUNT(*) as answers,
  AVG(points) as avg_points,
  AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as correct_rate
FROM match_answers
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Troubleshooting

### Error: "No questions available"

**Cause**: Insufficient questions in database for category/difficulty.

**Solution**:
1. Check question counts: `SELECT category, difficulty_num, COUNT(*) FROM questions WHERE status='active' GROUP BY 1,2`
2. Generate more questions for that category/difficulty
3. Consider relaxing freshness window temporarily

### Questions Repeating Too Often

**Cause**: Small question bank or many active players.

**Solution**:
1. Increase question bank (target: 500+ per category/difficulty)
2. Adjust freshness window (decrease for more repeats, increase for fewer)
3. Monitor tier distribution in logs

### Slow Performance

**Cause**: Missing indexes or large player base.

**Solution**:
1. Verify indexes exist: `SELECT * FROM pg_indexes WHERE tablename IN ('questions', 'question_usage', 'match_questions')`
2. Check query performance with EXPLAIN ANALYZE
3. Consider caching question sets for common scenarios

### Duplicate Answer Error

**Cause**: User trying to submit answer twice for same round.

**Response**: HTTP 409 Conflict - this is expected behavior. Frontend should prevent double-submission.

## Security Considerations

1. **Service Role**: Edge functions use SERVICE_ROLE_KEY (bypass RLS)
2. **Input Validation**: All inputs validated (UUIDs, categories, round numbers)
3. **No AI Calls**: OpenAI never called during gameplay (only for admin refill)
4. **Audit Trail**: All answers recorded in match_answers table
5. **Idempotency**: Safe to retry operations

## Future Enhancements

1. **Dynamic Difficulty**: Adjust based on player skill
2. **Category Mixing**: Allow multi-category matches
3. **Question Rotation**: Ensure even distribution across bank
4. **Real-time Stock Alerts**: Notify when question bank low
5. **Performance Caching**: Pre-compute question sets for common scenarios

## Summary

The Match Questions System provides a robust, scalable architecture for multiplayer trivia matches with guaranteed fairness (all players get same questions), smart repeat avoidance, and no AI calls during gameplay. The hybrid static bank approach keeps costs low while maintaining high quality gameplay.
