# POLITICS INTRO SYSTEM - COMPLETE CODE REVIEW DOCUMENT

**Purpose**: This document consolidates all code for the unified question loading system with LIVE Politics intro tracking across all gameplay modes (Free Play, Real Cash, Test Cash).

---

## SECTION 1: CRITICAL REQUIREMENTS

### Non-negotiable Entry Points
1. **Question Loading**: `window.getQuestionsForSession(categoryKey, count, { mode, userId })`
   - Single source for ALL question delivery
   - Handles intro logic for Politics only
   - Lives in `/src/trivia-engine-unified.js`

2. **Session Start**: `window.startTriviaSession({ mode, userId, categoryKey, questions, onComplete })`
   - Called by ALL gameplay modes
   - Must include real userId for cash matches
   - No alternate engine functions allowed

3. **User ID Requirement**
   - Real cash: Must use `supabase.auth.getUser().data.user.id`
   - Free/Test: Can use guest ID or auth ID if logged in
   - Must be passed to both getQuestionsForSession AND startTriviaSession

### LIVE MODE Visibility
- Badge must show: `mode`, `userId (first 8 chars)`, `introIndex` during politics matches
- Console logs with `[POLITICS INTRO LIVE]` prefix
- Hard guard: Cash matches without userId throw error

---

## SECTION 2: CURRENT CODE - TRIVIA ENGINE UNIFIED

### Part A: Global State

```javascript
let activeTriviaGame = null;
let activeQuestionTimerId = null;

// Question cache and tracking
const questionCache = {};   // categoryKey -> array of questions
const seenQuestionIds = {}; // categoryKey -> Set of IDs

// Politics intro tracking (NEW - to be added)
const introProgressCache = {}; // userId -> { politics_intro_index, politics_intro_completed }
```

### Part B: Current getQuestionsForSession (NEEDS UPDATE)

**Current signature**: `getQuestionsForSession(categoryKey, count)`
**Required signature**: `getQuestionsForSession(categoryKey, count, { mode, userId })`

Current implementation fetches from:
1. Question cache (in-memory)
2. Fallback to AI via edge function at `/functions/v1/get-questions`
3. Static bank from `window.QUESTION_BANK[categoryKey]`

**What needs to change**:
- Accept options object with `mode` and `userId`
- For politics: Load intro progress BEFORE fetching questions
- Serve intro questions first (if intro not complete)
- Attach intro metadata to returned questions

Current code (lines 35-86):
```javascript
async function getQuestionsForSession(categoryKey, count) {
  console.log("[QUESTIONS] === getQuestionsForSession ===");
  console.log("[QUESTIONS] Category:", categoryKey, "Count:", count);

  if (!questionCache[categoryKey]) {
    questionCache[categoryKey] = [];
  }
  if (!seenQuestionIds[categoryKey]) {
    seenQuestionIds[categoryKey] = new Set();
  }

  // Filter out questions user has already seen
  let available = questionCache[categoryKey].filter(q => {
    if (!q) return false;
    const id = q.id || q.question;
    return !seenQuestionIds[categoryKey].has(id);
  });

  // ... rest of current implementation
}
```

### Part C: fetchQuestionsForCategory (lines 94-183)

Fetches from:
- **Primary**: Edge function at `${VITE_SUPABASE_URL}/functions/v1/get-questions`
- **Fallback**: Static `window.QUESTION_BANK`

Current request body:
```javascript
{
  category: categoryKey,
  difficulty: 'medium',
  count: count,
  mode: 'free_play',
}
```

**What needs to change**:
- Pass actual mode (cash, free, cash-test)
- Pass userId (if applicable)
- For politics: Request intro questions first

### Part D: Question Normalization (lines 189-271)

Already handles multiple question formats:
- Standard: `{ question, choices, correctIndex }`
- Alternative props: `text`, `prompt`, `answers`, `options`, `correct`, `correctAnswer`

**No changes needed** - this is robust.

### Part E: Session Start - startTriviaSession (lines 365-444)

**Current signature**:
```javascript
async function startTriviaSession(opts) {
  let { mode, categoryKey, questions, onComplete } = opts;
```

**Required signature**:
```javascript
async function startTriviaSession(opts) {
  let { mode, userId, categoryKey, questions, onComplete } = opts;
```

**Required additions**:
1. Extract userId from opts
2. Add LIVE MODE badge (only if politics + cash/cash-test)
3. Attach intro metadata to activeTriviaGame state
4. Render diagnostics badge on screen

---

## SECTION 3: CASH PLAY HANDLER - REAL CASH MATCH START

**File**: `/src/cash-play-handler.js`

### Current Match Start (around line 530-551)

```javascript
async function startCashMatch() {
  // ... lobby load ...
  
  if (window.startTriviaSession) {
    window.startTriviaSession({
      mode: 'cash',
      categoryKey: lobby.category_key,
      questions,
      onComplete: handleMatchComplete
    });
  }
}
```

**Problems**:
1. No userId passed
2. Questions fetched but no intro logic
3. No guard check for userId

### Required Fix (NEW CODE):

```javascript
async function startCashMatch() {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      alert('You must be signed in for Cash Play.');
      return;
    }
    
    const userId = user.id; // Real auth UUID
    const { data: lobby } = await supabase
      .from('cash_lobbies')
      .select('*')
      .eq('id', currentLobbyId)
      .single();

    // UNIFIED LOADER - with userId
    const questions = await window.getQuestionsForSession(
      lobby.category_key, 
      QUESTION_COUNT, 
      { mode: 'cash', userId }
    );

    if (!questions || questions.length === 0) {
      alert('Failed to load questions');
      return;
    }

    showScreen('cash-match-screen');
    document.getElementById('trivia-engine-container').classList.add('active');

    // UNIFIED SESSION START - with userId
    window.startTriviaSession({
      mode: 'cash',
      userId,  // NEW
      categoryKey: lobby.category_key,
      questions,
      onComplete: handleMatchComplete
    });
  } catch (error) {
    console.error('Error starting match:', error);
    alert('Failed to start match: ' + error.message);
    returnToLobbies();
  }
}
```

### Post-Match Progress Update (EXISTING - line 578-609)

Already implements intro progress tracking:
```javascript
async function updateIntroProgress() {
  // Already checks if politics
  // Already updates politics_intro_index and politics_intro_completed
  // Already upserts to user_intro_progress table
}
```

**No changes needed** - this is correct.

---

## SECTION 4: FREE PLAY HANDLER

**File**: `/src/freeplay-flow.js` (or similar)

**Current issue**: No reference to question loading or session start found.

### Required Implementation:

```javascript
async function getGameplayUserIdForMode(mode) {
  if (mode === 'cash') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated for cash play');
    }
    return user.id; // Real UUID
  }

  // Free & cash-test: Use auth if logged in, otherwise stable guest ID
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) return user.id;

  // Guest: Create stable ID and persist
  let guestId = localStorage.getItem('bd_guest_id');
  if (!guestId) {
    guestId = 'guest-' + crypto.randomUUID();
    localStorage.setItem('bd_guest_id', guestId);
  }
  return guestId;
}

async function startFreePlayPolitics() {
  const userId = await getGameplayUserIdForMode('free');
  
  const questions = await window.getQuestionsForSession(
    'politics',
    QUESTION_COUNT,
    { mode: 'free', userId }
  );

  window.startTriviaSession({
    mode: 'free',
    userId,
    categoryKey: 'politics',
    questions,
    onComplete: handleFreePlayComplete
  });
}
```

---

## SECTION 5: TEST CASH HANDLER

**File**: `/src/main.js` (test mode section)

### Current Test Cash Start (line 160+ area):

```javascript
if (name === 'cash-test-screen') {
  console.log('[showScreen] Starting bot simulation');
  startBotSimulation();
}
```

### Required Implementation:

```javascript
async function startTestCashMatch(categoryKey) {
  const testUserId = 'test-' + crypto.randomUUID(); // Or stable test ID
  
  const questions = await window.getQuestionsForSession(
    categoryKey,
    QUESTION_COUNT,
    { mode: 'cash-test', userId: testUserId }
  );

  window.startTriviaSession({
    mode: 'cash-test',
    userId: testUserId,
    categoryKey,
    questions,
    onComplete: handleTestMatchComplete
  });
}
```

---

## SECTION 6: POLITICS INTRO LOGIC (NEW CODE)

### Database Table: user_intro_progress

**Already exists** (from previous migrations), schema:
```sql
CREATE TABLE user_intro_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  politics_intro_index INT DEFAULT 0,
  politics_intro_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Intro Questions Table

**Need to seed/verify**: Politics intro questions (30 total)

Already should exist from previous setup:
- Questions with `category = 'politics'` and `intro_order = 0-29`
- Or similar marker for intro questions

### Updated getQuestionsForSession (FULL IMPLEMENTATION)

```javascript
async function getQuestionsForSession(categoryKey, count, options = {}) {
  const { mode, userId } = options;
  
  console.log("[QUESTIONS] === getQuestionsForSession ===");
  console.log("[QUESTIONS] Category:", categoryKey, "Count:", count, "Mode:", mode, "UserId:", userId);

  let selectedQuestions = [];
  let introUsedCount = 0;
  let introIndex = 0;
  let introCompleted = false;

  // POLITICS INTRO LOGIC
  if (categoryKey === 'politics' && userId) {
    console.log("[POLITICS] Loading intro questions for userId:", userId);
    
    // Load intro progress
    let progress;
    
    if (userId.startsWith('guest-') || userId.startsWith('test-')) {
      // Guest/test: use localStorage
      const key = `intro_progress_${userId}`;
      progress = JSON.parse(localStorage.getItem(key)) || {
        politics_intro_index: 0,
        politics_intro_completed: false
      };
    } else {
      // Real user: fetch from Supabase
      try {
        const { data, error } = await supabase
          .from('user_intro_progress')
          .select('politics_intro_index, politics_intro_completed')
          .eq('user_id', userId)
          .maybeSingle();
        
        progress = data || {
          politics_intro_index: 0,
          politics_intro_completed: false
        };
      } catch (err) {
        console.error("[POLITICS] Failed to load progress:", err);
        progress = { politics_intro_index: 0, politics_intro_completed: false };
      }
    }

    introIndex = progress.politics_intro_index;
    introCompleted = progress.politics_intro_completed;

    console.log("[POLITICS] Current progress:", { introIndex, introCompleted });

    // If intro not complete, serve intro questions
    if (!introCompleted) {
      const introQuestionsNeeded = Math.min(count, 30 - introIndex);
      
      console.log("[POLITICS] Fetching", introQuestionsNeeded, "intro questions");
      
      // Fetch intro questions
      const introQuestions = await fetchPoliticsIntroQuestions(
        introIndex,
        introQuestionsNeeded
      );
      
      selectedQuestions.push(...introQuestions);
      introUsedCount = introQuestions.length;
      
      console.log("[POLITICS] Got", introUsedCount, "intro questions");
    }
  }

  // If we still need more questions, fetch regular questions
  if (selectedQuestions.length < count) {
    const regularNeeded = count - selectedQuestions.length;
    console.log("[QUESTIONS] Need", regularNeeded, "regular questions");
    
    const regularQuestions = await getQuestionsForSession_Regular(
      categoryKey,
      regularNeeded
    );
    
    selectedQuestions.push(...regularQuestions);
  }

  // Attach metadata for completion tracking
  if (categoryKey === 'politics' && introUsedCount > 0) {
    selectedQuestions.meta = {
      introUsedCount,
      introStartIndex: introIndex,
      introCompleted
    };
  }

  console.log("[QUESTIONS] ✓ Returning", selectedQuestions.length, "questions");
  return selectedQuestions;
}

async function fetchPoliticsIntroQuestions(startIndex, count) {
  console.log("[POLITICS] Fetching intro questions:", { startIndex, count });
  
  // Fetch from database where category='politics' AND intro_order >= startIndex
  // Limit to count
  
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', 'politics')
      .gte('intro_order', startIndex)
      .lt('intro_order', startIndex + count)
      .order('intro_order', { ascending: true });
    
    if (error) throw error;
    
    return (questions || []).map(q => ({
      id: q.id,
      question: q.question,
      choices: q.choices,
      correctIndex: q.correct_index
    }));
  } catch (err) {
    console.error("[POLITICS] Failed to fetch intro questions:", err);
    return [];
  }
}

// Fallback: regular question fetcher (existing logic)
async function getQuestionsForSession_Regular(categoryKey, count) {
  // Use existing fetchQuestionsForCategory logic
  return await fetchQuestionsForCategory(categoryKey, count);
}
```

---

## SECTION 7: SESSION COMPLETION & PROGRESS UPDATE

### In trivia-engine-unified.js - endTriviaSession or equivalent

When game completes and `onComplete` is called:

```javascript
async function endTriviaSession(score, details) {
  if (!activeTriviaGame) return;

  const { mode, userId, categoryKey } = activeTriviaGame;
  const meta = activeTriviaGame.questions?.meta || {};

  // If politics and intro questions were served, update progress
  if (categoryKey === 'politics' && meta.introUsedCount > 0) {
    const newIndex = Math.min(meta.introStartIndex + meta.introUsedCount, 30);
    const completed = newIndex >= 30;

    console.log("[POLITICS] Updating progress:", { 
      oldIndex: meta.introStartIndex, 
      newIndex, 
      completed 
    });

    if (userId.startsWith('guest-') || userId.startsWith('test-')) {
      // Save to localStorage
      const key = `intro_progress_${userId}`;
      localStorage.setItem(key, JSON.stringify({
        politics_intro_index: newIndex,
        politics_intro_completed: completed
      }));
    } else {
      // Save to Supabase
      try {
        await supabase
          .from('user_intro_progress')
          .upsert({
            user_id: userId,
            politics_intro_index: newIndex,
            politics_intro_completed: completed,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error("[POLITICS] Failed to save progress:", err);
      }
    }
  }

  cleanupTriviaSession();
  
  if (typeof activeTriviaGame.onComplete === 'function') {
    activeTriviaGame.onComplete(score, details);
  }
}
```

---

## SECTION 8: LIVE MODE BADGE IMPLEMENTATION

### HTML Structure (add to trivia game screen)

```html
<div id="politics-live-badge" class="politics-live-badge hidden">
  <div class="badge-content">
    <span class="badge-label">LIVE POLITICS INTRO</span>
    <span class="badge-detail">mode: <span id="badge-mode"></span></span>
    <span class="badge-detail">userId: <span id="badge-user-id"></span></span>
    <span class="badge-detail">introIndex: <span id="badge-intro-index"></span></span>
  </div>
</div>
```

### CSS (styling for badge)

```css
.politics-live-badge {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #38ef7d, #11998e);
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(56, 239, 125, 0.3);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badge-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.badge-detail {
  font-size: 11px;
  opacity: 0.95;
}

.politics-live-badge.hidden {
  display: none;
}
```

### JavaScript (in startTriviaSession)

```javascript
async function startTriviaSession(opts) {
  const { mode, userId, categoryKey, questions, onComplete } = opts;

  // ... existing validation ...

  activeTriviaGame = {
    mode,
    userId,
    categoryKey,
    questions,
    currentIndex: 0,
    score: 0,
    streak: 0,
    correctCount: 0,
    onComplete,
    // ... other state ...
  };

  // SHOW LIVE BADGE FOR POLITICS
  if (categoryKey === 'politics' && mode === 'cash') {
    showLiveModeBadge(mode, userId, questions?.meta?.introStartIndex || 0);
  } else {
    hideLiveModeBadge();
  }

  showTriviaScreen();
  renderTriviaQuestion();
}

function showLiveModeBadge(mode, userId, introIndex) {
  const badge = document.getElementById('politics-live-badge');
  if (!badge) return;

  document.getElementById('badge-mode').textContent = mode;
  document.getElementById('badge-user-id').textContent = userId.substring(0, 8);
  document.getElementById('badge-intro-index').textContent = `${introIndex}/30`;

  badge.classList.remove('hidden');
  
  console.log('[POLITICS INTRO LIVE]', {
    mode,
    userId: userId.substring(0, 8),
    introIndex,
    servedIntro: questions?.meta?.introUsedCount || 0
  });
}

function hideLiveModeBadge() {
  const badge = document.getElementById('politics-live-badge');
  if (badge) badge.classList.add('hidden');
}
```

---

## SECTION 9: CONSOLE LOGGING / DIAGNOSTICS

### Required Console Output (on politics cash match start)

```
[POLITICS INTRO LIVE] mode=cash userId=abc12345 introIndex=10 servedIntro=10
[TRIVIA] === START TRIVIA SESSION ===
[TRIVIA] Mode: cash
[TRIVIA] Category: politics
[TRIVIA] Questions (raw): 10
```

### Required Hard Guard (in startTriviaSession)

```javascript
if (mode === 'cash' && !userId) {
  console.error('[TRIVIA] ❌ CASH MATCH WITHOUT USERID - WIRING BUG');
  alert('Cash match started without userId — wiring bug');
  throw new Error('Cash mode requires userId');
}
```

---

## SECTION 10: IMPLEMENTATION CHECKLIST

### Step 1: Update trivia-engine-unified.js
- [ ] Update `getQuestionsForSession` signature to accept `{ mode, userId }`
- [ ] Add intro progress loading (Supabase + localStorage)
- [ ] Add intro question fetcher
- [ ] Attach intro metadata to questions
- [ ] Update `startTriviaSession` to accept and store `userId`
- [ ] Add LIVE badge rendering logic
- [ ] Add hard guard for cash mode without userId
- [ ] Add console logging `[POLITICS INTRO LIVE]`

### Step 2: Update cash-play-handler.js
- [ ] Get real userId via `supabase.auth.getUser()`
- [ ] Pass userId to `getQuestionsForSession`
- [ ] Pass userId to `startTriviaSession`
- [ ] Verify `updateIntroProgress` is already correct

### Step 3: Update freeplay-flow.js
- [ ] Add `getGameplayUserIdForMode` helper
- [ ] Update free play start to fetch with mode + userId
- [ ] Update to call `startTriviaSession` with userId

### Step 4: Update main.js (test cash)
- [ ] Add test cash match starter with stable test userId
- [ ] Pass userId to `getQuestionsForSession`
- [ ] Pass userId to `startTriviaSession`

### Step 5: Verify Database
- [ ] Verify `user_intro_progress` table exists
- [ ] Verify politics intro questions exist with `intro_order` or similar
- [ ] Run migration if needed

### Step 6: Test
- [ ] Start real cash politics match → badge shows
- [ ] Finish intro questions → progress updates
- [ ] Start second match → introIndex advances
- [ ] After 3 matches → introIndex reaches 30, normal questions only
- [ ] Test free play → intro logic also works (if logged in)
- [ ] Test cash-test → intro logic works with test UUID

---

## SECTION 11: SQL QUERIES TO VERIFY

### Check intro progress table
```sql
SELECT * FROM user_intro_progress LIMIT 5;
```

### Check politics intro questions
```sql
SELECT COUNT(*) FROM questions 
WHERE category = 'politics' AND intro_order IS NOT NULL;
```

### Check user progress after a match
```sql
SELECT * FROM user_intro_progress 
WHERE user_id = 'YOUR_USER_UUID';
```

### Fetch intro questions for a user
```sql
SELECT * FROM questions
WHERE category = 'politics'
  AND intro_order >= 0  -- Start index
  AND intro_order < 10  -- End index (count)
ORDER BY intro_order ASC;
```

---

## SUMMARY

This system ensures:
1. **Single question loader** for all modes
2. **Real userId** always passed to engine (auth UUID for cash, guest/test ID for others)
3. **Intro progress persists** (Supabase for auth, localStorage for guests)
4. **LIVE badge visible** during politics cash matches
5. **Completion tracking** updates intro index after each match
6. **Hard guard** prevents cash matches without userId
7. **Diagnostics** visible in console and UI

All question delivery, session start, and intro logic flows through unified engine with consistent metadata passing.
