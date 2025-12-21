# Bootstrap Quick Start Guide

## Purpose
Populate the BrainDash question database with initial AI-generated questions.

---

## Prerequisites

### 1. Admin User Setup
Create an admin user in your database:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users;

-- Insert into admin_users table
INSERT INTO admin_users (user_id, role)
VALUES ('your-user-id-here', 'super_admin');
```

### 2. Environment Variables
Ensure these are configured in Supabase Dashboard → Project Settings → Edge Functions:

- `OPENAI_API_KEY` - Your OpenAI API key
- `SERVICE_KEY` - Internal service key for function-to-function calls
- `SUPABASE_URL` - Auto-configured
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured

---

## Running Bootstrap

### Option 1: Via cURL (Recommended)

```bash
# 1. Get your admin user auth token
# Login to your app, open DevTools Console, run:
# localStorage.getItem('supabase.auth.token')

# 2. Run bootstrap command
curl -X POST \
  'https://[your-project-ref].supabase.co/functions/v1/admin-question-tools?action=bootstrap' \
  -H 'Authorization: Bearer [your-admin-token]' \
  -H 'Content-Type: application/json'
```

### Option 2: Via JavaScript (Browser Console)

```javascript
// Run this in your app's browser console while logged in as admin
async function runBootstrap() {
  const token = localStorage.getItem('supabase.auth.token');

  const response = await fetch(
    `${window.VITE_SUPABASE_URL}/functions/v1/admin-question-tools?action=bootstrap`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JSON.parse(token).access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = await response.json();
  console.log('Bootstrap Result:', result);
}

runBootstrap();
```

---

## What Gets Generated

### Categories (5):
- Sports
- Movies
- History
- Science
- Geography

### Difficulties per Category (3):
- Easy
- Medium
- Hard

### Questions per Difficulty:
- 50 questions

### Total Questions:
5 categories × 3 difficulties × 50 questions = **750 questions**

---

## Expected Output

```json
{
  "success": true,
  "results": {
    "total": 15,
    "successful": 15,
    "failed": 0,
    "totalInserted": 750,
    "details": [
      {
        "category": "sports",
        "difficulty": "easy",
        "status": "success",
        "inserted": 50,
        "duplicates": 0
      },
      ...
    ]
  },
  "message": "Bootstrap complete: Generated 750 questions across 15 category/difficulty combinations"
}
```

---

## Monitoring Progress

The bootstrap process takes approximately **30 minutes** due to rate limiting.

### Check Progress in Real-Time:

**Option 1: Supabase Dashboard Logs**
- Go to: Dashboard → Functions → admin-question-tools
- View: Logs tab
- Look for: `[BOOTSTRAP]` entries

**Option 2: Database Query**
```sql
-- Check current question counts
SELECT
  category,
  difficulty,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM questions
GROUP BY category, difficulty
ORDER BY category, difficulty;
```

---

## Troubleshooting

### Error: "Service key not configured"
**Solution:**
```bash
# Add SERVICE_KEY to Supabase Edge Functions environment
# Dashboard → Project Settings → Edge Functions → Secrets
# Add: SERVICE_KEY = [your-secret-key]
```

### Error: "Admin access required"
**Solution:**
```sql
-- Verify admin user exists
SELECT * FROM admin_users WHERE user_id = 'your-user-id';

-- If missing, add:
INSERT INTO admin_users (user_id, role)
VALUES ('your-user-id', 'super_admin');
```

### Error: "OpenAI API failed"
**Solution:**
- Check `OPENAI_API_KEY` is valid
- Check OpenAI account has credits
- Check OpenAI API status: https://status.openai.com/

### Partial Success (e.g., 10/15 successful)
**Solution:**
- Check function logs for specific errors
- Some categories may have failed due to API rate limits
- Re-run bootstrap (it will skip duplicates)

---

## Verification

After bootstrap completes:

```sql
-- 1. Check total questions
SELECT COUNT(*) FROM questions WHERE is_active = true;
-- Expected: ~750

-- 2. Check breakdown
SELECT category, difficulty, COUNT(*)
FROM questions
WHERE is_active = true
GROUP BY category, difficulty
ORDER BY category, difficulty;
-- Expected: ~50 per category/difficulty

-- 3. Check generation log
SELECT
  success,
  COUNT(*) as attempts,
  SUM(questions_generated) as total_questions,
  SUM(total_cost_cents) as total_cost_cents
FROM question_generation_log
GROUP BY success;
-- Expected: success=true, ~15 attempts, ~750 questions
```

---

## Cost Estimate

**OpenAI API Cost:**
- Model: GPT-4
- Questions: 750
- Estimated Cost: $10-15 USD

**Rate Limiting:**
- 2 seconds between requests
- Total time: ~30 minutes

---

## Post-Bootstrap

### Enable Games:
Once bootstrap completes:
- ✅ Free Play will use database questions
- ✅ Cash Challenge can start matches
- ✅ Questions will be unique across matches

### Monitor Usage:
```sql
-- Check question usage over time
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as questions_used
FROM seen_questions
GROUP BY day
ORDER BY day DESC
LIMIT 7;
```

### Refill When Needed:
```bash
# Generate more questions for specific category
curl -X POST \
  'https://[your-project].supabase.co/functions/v1/admin-question-tools?action=generate-batch' \
  -H 'Authorization: Bearer [admin-token]' \
  -H 'Content-Type: application/json' \
  -d '{
    "categories": ["sports"],
    "difficulties": ["medium"],
    "count": 50
  }'
```

---

## Emergency Rollback

If bootstrap fails critically:

```sql
-- Delete all generated questions
DELETE FROM questions WHERE created_at > NOW() - INTERVAL '1 hour';

-- Disable all questions
UPDATE questions SET is_active = false;
```

Then investigate logs and retry.

---

## Success Indicators

✅ **Bootstrap Successful If:**
- API returns `"success": true`
- Database shows ~750 active questions
- Free Play starts without offline banner
- Cash matches can be created and started
- Questions are unique across games

❌ **Bootstrap Failed If:**
- API returns errors
- Database has <100 questions
- Free Play shows offline banner
- Cash matches cannot start
- Questions repeat immediately

---

## Next Steps

After successful bootstrap:
1. Test Free Play (should use DB questions)
2. Test Cash Challenge (should start without errors)
3. Monitor question usage for first week
4. Set up alerts for low question counts
5. Schedule weekly question refills

---

## Support

For issues:
1. Check Supabase function logs
2. Check `question_generation_log` table for errors
3. Verify environment variables are set
4. Check OpenAI API dashboard for request logs
5. Contact development team with error logs
