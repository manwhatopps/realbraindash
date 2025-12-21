# OpenAI-Powered Trivia Question Generation

Complete implementation for AI-generated trivia questions with strict JSON schema, deduplication, caching, and content safety.

---

## Architecture Overview

**Core Principle:** Questions are generated on-demand, deduplicated via fingerprinting, cached for reuse, and validated for safety.

### Components

1. **Question Generator**
   - OpenAI GPT-4 with Structured Outputs
   - Strict JSON schema enforcement
   - Category and difficulty-specific prompts
   - Deduplication via SHA256 fingerprints

2. **Caching System**
   - Store generated questions in database
   - Reuse unseen questions (not used in last 30 days)
   - Track usage count per question

3. **Content Safety**
   - Basic keyword filtering
   - Age-appropriate content
   - No controversial topics

4. **Match Integration**
   - Select cached questions first
   - Generate new questions if needed
   - All players see identical questions
   - Persist match-question mapping

---

## Database Schema

### `questions`

Stores all generated questions with metadata.

```sql
CREATE TABLE questions (
  id uuid PRIMARY KEY,
  category text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text text NOT NULL,
  choices jsonb NOT NULL,              -- Array of 4 strings
  correct_index int NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation text,
  source text NOT NULL DEFAULT 'openai',
  source_confidence text CHECK (source_confidence IN ('low', 'medium', 'high')),
  fingerprint text NOT NULL,           -- SHA256 hash for deduplication
  is_active boolean NOT NULL DEFAULT true,
  times_used int NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  content_flags jsonb DEFAULT '[]'::jsonb
);
```

### `question_fingerprints`

Tracks unique questions per category for fast duplicate detection.

```sql
CREATE TABLE question_fingerprints (
  id uuid PRIMARY KEY,
  category text NOT NULL,
  fingerprint text NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, fingerprint)  -- Prevents duplicates per category
);
```

### `match_questions`

Maps questions to matches to ensure all players see the same questions.

```sql
CREATE TABLE match_questions (
  id uuid PRIMARY KEY,
  match_id uuid NOT NULL,
  lobby_id uuid,
  question_id uuid NOT NULL REFERENCES questions(id),
  question_number int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, question_number)
);
```

### `question_generation_log`

Tracks OpenAI API calls for cost monitoring and quality analysis.

```sql
CREATE TABLE question_generation_log (
  id uuid PRIMARY KEY,
  category text NOT NULL,
  difficulty text NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  total_cost_cents int,
  success boolean NOT NULL,
  error_message text,
  questions_generated int DEFAULT 0,
  duplicates_rejected int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb
);
```

---

## API Endpoints

### 1. Generate Questions (Internal Only)

**Endpoint:** `POST /functions/v1/generate-questions`

**Authentication:** Service key (X-Service-Key header)

**Request:**
```json
{
  "category": "Science",
  "difficulty": "medium",
  "count": 5,
  "createdBy": "admin-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "generated": 5,
  "inserted": 4,
  "duplicates": 1,
  "unsafe": 0,
  "questionIds": ["uuid1", "uuid2", "uuid3", "uuid4"],
  "tokens": 1250,
  "costCents": 3
}
```

**Parameters:**
- `category` - String (e.g., "Science", "History", "Sports")
- `difficulty` - "easy" | "medium" | "hard"
- `count` - Integer, 1-20
- `createdBy` - Optional UUID of admin user

**Process:**
1. Get recent fingerprints (last 100 for category)
2. Build category-specific prompt
3. Call OpenAI with Structured Outputs
4. Validate JSON schema
5. Filter unsafe content
6. Deduplicate via fingerprints
7. Insert new questions
8. Log generation attempt

**Error Handling:**
- OpenAI API errors → Retry up to 2 times with backoff
- Schema validation failure → Reject entire response
- Duplicate questions → Skip silently
- Unsafe content → Skip with warning

---

### 2. Admin Question Tools

**Endpoint:** `GET/POST /functions/v1/admin-question-tools`

**Authentication:** JWT required (admin role)

#### GET Actions

**Get Statistics:**
```bash
GET /functions/v1/admin-question-tools?action=stats
```

Response:
```json
{
  "success": true,
  "questionStats": [
    {
      "category": "Science",
      "total_questions": 150,
      "easy_count": 50,
      "medium_count": 60,
      "hard_count": 40,
      "avg_times_used": 2.3,
      "last_generated": "2024-12-21T10:00:00Z"
    }
  ],
  "totalCostCents": 250,
  "totalCostDollars": "2.50",
  "generationAttempts": 15,
  "successRate": "93.3"
}
```

**Get Generation Log:**
```bash
GET /functions/v1/admin-question-tools?action=generation-log
```

Response:
```json
{
  "success": true,
  "log": [
    {
      "id": "uuid",
      "category": "Science",
      "difficulty": "medium",
      "questions_generated": 5,
      "duplicates_rejected": 1,
      "total_cost_cents": 3,
      "success": true,
      "created_at": "2024-12-21T10:00:00Z"
    }
  ]
}
```

#### POST Actions

**Generate Batch:**
```bash
POST /functions/v1/admin-question-tools?action=generate-batch
```

Request:
```json
{
  "categories": ["Science", "History", "Sports"],
  "difficulties": ["easy", "medium", "hard"],
  "count": 20
}
```

Response:
```json
{
  "success": true,
  "results": {
    "total": 9,
    "successful": 8,
    "failed": 1,
    "details": [
      {
        "category": "Science",
        "difficulty": "easy",
        "status": "success",
        "inserted": 18,
        "duplicates": 2,
        "unsafe": 0,
        "tokens": 2100,
        "costCents": 5
      }
    ]
  },
  "message": "Generated questions for 8/9 category/difficulty combinations"
}
```

**Deactivate Question:**
```bash
POST /functions/v1/admin-question-tools?action=deactivate-question
```

Request:
```json
{
  "questionId": "uuid",
  "reason": "Incorrect answer"
}
```

---

## OpenAI Integration

### Structured Outputs Schema

Enforces strict JSON format - no malformed responses.

```typescript
const questionSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question_text: { type: 'string' },
          choices: {
            type: 'array',
            items: { type: 'string' },
            minItems: 4,
            maxItems: 4,
          },
          correct_index: {
            type: 'integer',
            minimum: 0,
            maximum: 3,
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
          },
          category: { type: 'string' },
          explanation: { type: 'string' },
          source_confidence: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
        },
        required: [
          'question_text',
          'choices',
          'correct_index',
          'difficulty',
          'category',
          'explanation',
          'source_confidence',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};
```

### API Call

```typescript
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-2024-08-06',
  messages: [
    {
      role: 'system',
      content: 'You are a trivia question generator...',
    },
    {
      role: 'user',
      content: prompt,
    },
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'trivia_questions',
      strict: true,
      schema: questionSchema,
    },
  },
  temperature: 0.8,
});

const questions = JSON.parse(completion.choices[0].message.content).questions;
```

### Model Selection

- **Primary:** `gpt-4o-2024-08-06` (Structured Outputs support)
- **Temperature:** 0.8 (balance creativity and accuracy)
- **Cost:** ~$2.50 per 1000 input tokens, ~$10 per 1000 output tokens

### Prompt Engineering

Prompts are category and difficulty-specific:

```
Generate 5 medium trivia questions covering physics, chemistry, biology, and astronomy.

Difficulty level: requiring some knowledge, challenging but not obscure

Requirements:
- Each question must have exactly 4 choices
- Exactly one choice is correct
- Provide a brief explanation (1-2 sentences) for the correct answer
- Indicate your confidence in the answer accuracy (low/medium/high)
- Questions must be clear, unambiguous, and appropriate for all ages
- Avoid controversial topics, offensive content, or sensitive subjects

DO NOT REPEAT these recent questions:
1. What is the speed of light in a vacuum?
2. Which element has the atomic number 6?
...

Generate diverse, interesting questions that test knowledge and reasoning.
```

---

## Deduplication System

### Fingerprint Generation

Each question is normalized and hashed:

```sql
CREATE FUNCTION generate_question_fingerprint(p_question_text text)
RETURNS text AS $$
DECLARE
  v_normalized text;
BEGIN
  -- Lowercase
  v_normalized := lower(p_question_text);

  -- Remove punctuation
  v_normalized := regexp_replace(v_normalized, '[^a-zA-Z0-9\s]', '', 'g');

  -- Collapse whitespace
  v_normalized := regexp_replace(v_normalized, '\s+', ' ', 'g');

  -- Trim
  v_normalized := trim(v_normalized);

  -- SHA256 hash
  RETURN encode(digest(v_normalized, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Example:**
```
Original: "What is the capital of France?"
Normalized: "what is the capital of france"
Fingerprint: "a3c8f9b2..."
```

### Duplicate Detection

```sql
CREATE FUNCTION is_duplicate_question(p_category text, p_fingerprint text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM question_fingerprints
    WHERE category = p_category
      AND fingerprint = p_fingerprint
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Unique Constraint:**
```sql
UNIQUE(category, fingerprint)  -- Prevents duplicates per category
```

### Recent Questions Context

To avoid generating recent duplicates, we include them in the prompt:

```sql
CREATE FUNCTION get_recent_fingerprints(p_category text, p_limit int DEFAULT 100)
RETURNS TABLE (fingerprint text, question_text text) AS $$
BEGIN
  RETURN QUERY
  SELECT qf.fingerprint, q.question_text
  FROM question_fingerprints qf
  JOIN questions q ON q.id = qf.question_id
  WHERE qf.category = p_category
  ORDER BY qf.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Last 20 questions are included in the prompt as "DO NOT REPEAT".

---

## Caching & Reuse

### Question Selection for Match

```sql
CREATE FUNCTION get_cached_questions_for_match(
  p_category text,
  p_difficulty text,
  p_count int,
  p_exclude_recent_days int DEFAULT 30
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.question_text, q.choices, q.correct_index, q.explanation
  FROM questions q
  WHERE q.category = p_category
    AND q.difficulty = p_difficulty
    AND q.is_active = true
    AND (q.last_used_at IS NULL OR q.last_used_at < now() - (p_exclude_recent_days || ' days')::interval)
  ORDER BY
    q.times_used ASC,
    q.last_used_at ASC NULLS FIRST,
    random()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Selection Priority:**
1. Never used questions
2. Least used questions
3. Questions not used in last 30 days
4. Random selection within those constraints

### Mark Questions as Used

```sql
CREATE FUNCTION mark_questions_used(p_question_ids uuid[])
RETURNS void AS $$
BEGIN
  UPDATE questions
  SET
    times_used = times_used + 1,
    last_used_at = now()
  WHERE id = ANY(p_question_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Match Integration Flow

```javascript
// Server-side match creation
async function createMatchWithQuestions(matchId, category, difficulty, count) {
  // 1. Try to get cached questions
  const { data: cachedQuestions } = await supabase.rpc('get_cached_questions_for_match', {
    p_category: category,
    p_difficulty: difficulty,
    p_count: count,
    p_exclude_recent_days: 30,
  });

  let questions = cachedQuestions || [];

  // 2. If not enough, generate new ones
  if (questions.length < count) {
    const needed = count - questions.length;
    const response = await fetch('/functions/v1/generate-questions', {
      method: 'POST',
      headers: {
        'X-Service-Key': SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        difficulty,
        count: needed,
      }),
    });

    const result = await response.json();

    // Get newly generated questions
    const { data: newQuestions } = await supabase
      .from('questions')
      .select('*')
      .in('id', result.questionIds);

    questions = [...questions, ...newQuestions];
  }

  // 3. Create match-question mapping
  const matchQuestions = questions.map((q, index) => ({
    match_id: matchId,
    question_id: q.id,
    question_number: index + 1,
  }));

  await supabase.from('match_questions').insert(matchQuestions);

  // 4. Mark questions as used
  const questionIds = questions.map(q => q.id);
  await supabase.rpc('mark_questions_used', { p_question_ids: questionIds });

  return questions;
}
```

---

## Content Safety

### Basic Keyword Filtering

```typescript
const UNSAFE_KEYWORDS = [
  'kill', 'murder', 'suicide',
  'rape', 'sex', 'porn', 'nude',
  'drug', 'cocaine', 'heroin',
  'nazi', 'hitler', 'genocide',
];

function isUnsafe(text: string): boolean {
  const lower = text.toLowerCase();
  return UNSAFE_KEYWORDS.some(keyword => lower.includes(keyword));
}

// Check both question and choices
for (const q of questions) {
  const unsafe = isUnsafe(q.question_text) || q.choices.some(c => isUnsafe(c));
  if (unsafe) {
    console.warn(`Unsafe content detected, skipping: ${q.question_text}`);
    continue;
  }
}
```

### Content Guidelines

Enforced via prompt:
- Age-appropriate (suitable for all ages)
- No controversial topics (politics, religion)
- No offensive content
- No sensitive subjects (violence, sexuality)
- Factual accuracy over opinion
- Clear, unambiguous wording

### Future Enhancements

- OpenAI Moderation API integration
- Custom content filters per category
- Human review workflow for flagged questions
- User reporting system

---

## Cost Analysis

### OpenAI Pricing (GPT-4o-2024-08-06)

- Input: $2.50 per 1M tokens (~$0.0025 per 1K tokens)
- Output: $10.00 per 1M tokens (~$0.01 per 1K tokens)

### Typical Generation

**Request (5 questions, medium difficulty):**
- Prompt tokens: ~500
- Completion tokens: ~750
- Total tokens: ~1,250
- Cost: ~$0.03 (3 cents)

**Batch Generation (20 questions × 9 category/difficulty combos):**
- 180 questions total
- ~36 API calls
- ~45,000 tokens total
- Cost: ~$1.08

### Cost Optimization

1. **Caching:** Generate once, reuse many times
   - 1 generation ($0.03) used 10+ times = $0.003 per question use

2. **Batch Generation:** Generate more questions per call
   - 20 questions per call = better token efficiency

3. **Difficulty-Specific:** Don't regenerate easy questions often
   - Easy questions are more stable/factual

4. **Category Rotation:** Balance generation across categories
   - Avoid depleting single category

### Cost Monitoring

Track costs in `question_generation_log`:

```sql
SELECT
  category,
  difficulty,
  SUM(total_cost_cents) / 100.0 AS total_cost_dollars,
  SUM(questions_generated) AS total_questions,
  (SUM(total_cost_cents) / 100.0) / NULLIF(SUM(questions_generated), 0) AS cost_per_question
FROM question_generation_log
WHERE success = true
GROUP BY category, difficulty
ORDER BY total_cost_dollars DESC;
```

---

## Categories

### Supported Categories

| Category | Description | Difficulty Guidance |
|----------|-------------|---------------------|
| General Knowledge | History, geography, science, current events | Easy: Famous facts, Medium: Requires some knowledge, Hard: Obscure details |
| Science | Physics, chemistry, biology, astronomy | Easy: Basic concepts, Medium: Scientific principles, Hard: Advanced theories |
| History | World history, events, figures | Easy: Major events, Medium: Historical context, Hard: Specific dates/details |
| Geography | Countries, capitals, landmarks | Easy: Major countries, Medium: Capitals and features, Hard: Obscure locations |
| Sports | Various sports, athletes, records | Easy: Popular sports, Medium: Records and stats, Hard: Specific games/dates |
| Entertainment | Movies, music, TV, celebrities | Easy: Mainstream hits, Medium: Award winners, Hard: Cult classics |
| Literature | Books, authors, literary works | Easy: Famous authors, Medium: Classic works, Hard: Literary techniques |
| Math | Arithmetic, algebra, geometry | Easy: Basic operations, Medium: Problem-solving, Hard: Advanced math |

### Adding New Categories

1. Add category to prompt templates
2. Define difficulty guidelines
3. Generate initial question bank (20+ per difficulty)
4. Test question quality
5. Deploy to production

---

## Quality Metrics

### Question Quality Indicators

1. **Source Confidence**
   - High: Well-known facts, easily verifiable
   - Medium: Requires some research, generally accepted
   - Low: Obscure or potentially controversial

2. **Usage Pattern**
   - Frequently used = High quality (players don't report issues)
   - Never used = Newly generated or poor quality
   - High skip rate = Poor quality (track in future)

3. **Duplicate Rate**
   - Target: <10% duplicates per generation
   - High duplicate rate = Category exhausted, need prompt tuning

4. **Generation Success Rate**
   - Target: >95% successful API calls
   - Low rate = OpenAI API issues or prompt problems

### Admin Dashboard Metrics

```sql
-- Questions per category
SELECT category, difficulty, COUNT(*) AS count
FROM questions WHERE is_active = true
GROUP BY category, difficulty
ORDER BY category, difficulty;

-- Most used questions (potential favorites)
SELECT category, question_text, times_used
FROM questions
WHERE is_active = true
ORDER BY times_used DESC
LIMIT 20;

-- Never used questions (potential quality issues)
SELECT category, difficulty, COUNT(*) AS count
FROM questions
WHERE is_active = true AND times_used = 0
GROUP BY category, difficulty;

-- Generation cost by category
SELECT category, SUM(total_cost_cents) / 100.0 AS total_cost
FROM question_generation_log
WHERE success = true
GROUP BY category
ORDER BY total_cost DESC;
```

---

## Testing

### Test Question Generation

```bash
# Generate 5 medium science questions
curl -X POST https://[project].supabase.co/functions/v1/generate-questions \
  -H "X-Service-Key: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Science",
    "difficulty": "medium",
    "count": 5
  }'
```

Expected response:
```json
{
  "success": true,
  "generated": 5,
  "inserted": 4,
  "duplicates": 1,
  "unsafe": 0,
  "questionIds": ["uuid1", "uuid2", "uuid3", "uuid4"],
  "tokens": 1250,
  "costCents": 3
}
```

### Test Deduplication

```bash
# Generate same questions twice - second call should reject duplicates
curl ... # First call: inserted = 5
curl ... # Second call: duplicates = 5, inserted = 0
```

### Test Content Safety

```bash
# Try to generate unsafe content (should filter out)
curl -X POST https://[project].supabase.co/functions/v1/generate-questions \
  -H "X-Service-Key: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Controversial Topics",
    "difficulty": "medium",
    "count": 5
  }'

# Check logs for unsafe rejections
SELECT * FROM question_generation_log
WHERE metadata->>'unsafe_rejected' > 0
ORDER BY created_at DESC;
```

### Test Caching

```sql
-- Generate questions
-- (Use generation endpoint)

-- Retrieve cached questions
SELECT * FROM get_cached_questions_for_match(
  'Science'::text,
  'medium'::text,
  10,
  30
);

-- Mark as used
SELECT mark_questions_used(ARRAY['uuid1', 'uuid2']);

-- Verify usage count incremented
SELECT id, times_used, last_used_at
FROM questions
WHERE id IN ('uuid1', 'uuid2');
```

---

## Configuration

### Required Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxx

# Service Key (internal authentication)
SERVICE_KEY=random-secret-key-xxx

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### OpenAI Setup

1. **Get API Key:**
   - OpenAI Dashboard → API keys
   - Create new key
   - Copy to environment variables

2. **Enable Structured Outputs:**
   - Available on `gpt-4o-2024-08-06` and later
   - No additional configuration needed

3. **Set Usage Limits:**
   - Dashboard → Usage limits
   - Recommended: $50/month for testing, $500/month for production

---

## Troubleshooting

### No Questions Generated

**Symptoms:** `inserted = 0, duplicates = 0, unsafe = 0`

**Causes:**
1. OpenAI API error (check logs)
2. JSON schema validation failure
3. Empty response from OpenAI

**Fix:**
```bash
# Check generation log
SELECT * FROM question_generation_log
WHERE success = false
ORDER BY created_at DESC
LIMIT 10;

# Check error message
SELECT error_message FROM question_generation_log
WHERE id = 'failing-uuid';
```

### High Duplicate Rate

**Symptoms:** `duplicates > 50% of generated`

**Causes:**
1. Category question bank exhausted
2. Prompt not diverse enough
3. Recent fingerprints not included in prompt

**Fix:**
1. Increase count per generation (more diverse)
2. Add more variation to prompts
3. Temporarily reduce fingerprint context (risky)

### Unsafe Content Rejected

**Symptoms:** `unsafe > 0`

**Causes:**
1. Category prompt too broad
2. OpenAI generating edge cases
3. Keyword list too strict

**Fix:**
1. Refine category prompts for safety
2. Add explicit safety instructions
3. Review and adjust keyword list

### High Cost

**Symptoms:** Cost >$1 per 100 questions

**Causes:**
1. Too many API calls
2. Generating too few questions per call
3. High retry rate

**Fix:**
1. Batch generation (20 questions per call)
2. Cache and reuse aggressively
3. Optimize prompts (reduce token count)

---

## Production Checklist

- [ ] OpenAI API key configured
- [ ] Service key generated and secure
- [ ] Initial question bank generated (100+ per category)
- [ ] Content safety keywords reviewed
- [ ] Cost monitoring dashboard setup
- [ ] Admin tools tested
- [ ] Category coverage verified
- [ ] Deduplication tested
- [ ] Caching strategy validated
- [ ] Match integration tested

---

## FAQ

**Q: Can questions be edited after generation?**
A: Yes, directly update the `questions` table. Update `fingerprint` if question_text changes.

**Q: How often should new questions be generated?**
A: Monitor question bank. If a category has <50 questions or high reuse rate (>5 times avg), generate more.

**Q: Can custom categories be added?**
A: Yes, add to the category list and define prompts. No code changes needed.

**Q: What happens if OpenAI is down?**
A: Generation fails gracefully. Matches use cached questions only. No impact to existing matches.

**Q: Can questions be manually added?**
A: Yes, insert directly into `questions` table with `source = 'manual'`.

**Q: How to handle incorrect answers?**
A: Deactivate via admin tools: `POST /admin-question-tools?action=deactivate-question`

**Q: What's the quality control process?**
A: Human review of sample questions, user reporting (future), high `source_confidence` filter.

---

**Document Version:** 1.0
**Last Updated:** 2024-12-21
**Status:** Production Ready
