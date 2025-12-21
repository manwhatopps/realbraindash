# Cash Challenge Wired to Free Play Engine

## ✅ Complete: Cash/Test Cash Now Use Free Play's Working Pipeline

Both **Cash Challenge** and **Test Cash Challenge** are now wired directly into the **working Free Play trivia engine**.

---

## 🎯 What Changed

### Before
- Free Play: Working ✅
- Test Cash: Using separate/broken logic ❌
- Cash Challenge: Not implemented ❌

### After
- **Free Play:** Working ✅ (UNCHANGED)
- **Test Cash:** Now uses Free Play's engine ✅
- **Cash Challenge:** Now uses Free Play's engine ✅

---

## 🔌 How They're Connected

### Shared Components (from Free Play)
1. **`QUESTION_BANK`** - Category-based question storage
2. **`TRIVIA_CATEGORY_MAP`** - Label → key mapping
3. **`getQuestionsForSession(categoryKey, count)`** - Question loader
4. **`startTriviaEngine({ mode, categoryKey, questions, onComplete })`** - Game engine

### Cash/Test Cash Now Call These Directly

#### Test Cash Match Flow
```javascript
function startTestCashMatch(lobby) {
  // 1. Get user's participant status
  const userIsParticipant = lobby.participants.some(p => p.id === testUser.id);
  if (!userIsParticipant) return;

  // 2. Get category key from lobby
  const categoryKey = lobby.categoryKey || "mixed";

  // 3. Use FREE PLAY's question loader
  const questions = window.getQuestionsForSession(categoryKey, 10);

  // 4. Use FREE PLAY's trivia engine
  window.startTriviaEngine({
    mode: 'cash-test',
    categoryKey,
    questions,
    onComplete: (score, details) => {
      onTestCashMatchComplete(score, details);
    }
  });
}
```

#### Real Cash Match Flow
```javascript
function startCashChallengeMatch(lobby) {
  // Same exact structure as Test Cash
  const categoryKey = lobby.categoryKey || "mixed";
  const questions = window.getQuestionsForSession(categoryKey, 10);

  window.startTriviaEngine({
    mode: 'cash',
    categoryKey,
    questions,
    onComplete: (score, details) => {
      onCashChallengeComplete(lobby, score, details);
    }
  });
}
```

---

## 📊 Complete Data Flow

### Test Cash Sports Match Example
```
1. User creates lobby
   ├─ Category Label: "Sports" (display)
   └─ Category Key: "sports" (mapped from TRIVIA_CATEGORY_MAP)

2. Lobby fills → Countdown → Match starts
   └─ startTestCashMatch(lobby) called

3. Get questions from FREE PLAY's bank
   ├─ window.getQuestionsForSession("sports", 10)
   └─ Returns 10 sports questions from QUESTION_BANK.sports

4. Start FREE PLAY's engine
   ├─ window.startTriviaEngine({ mode: 'cash-test', ... })
   └─ Uses SAME UI and logic as Free Play

5. User answers questions
   ├─ Kahoot scoring applied (speed + streak)
   └─ Score accumulates

6. Match completes
   ├─ onComplete callback fired with final score
   └─ onTestCashMatchComplete(score, details) determines winner
```

**NO separate question generator. NO math-only path. Uses Free Play's exact system.**

---

## 🔍 Key Debug Logs

When you play a **Sports Test Cash** match, you'll see:

```javascript
[Test Cash] Creating lobby - categoryLabel: Sports categoryKey: sports

[CASH-TEST] === STARTING MATCH ===
[CASH-TEST] Lobby ID: lobby-1234567890-1234
[CASH-TEST] Category Key: sports
[CASH-TEST] Getting questions from Free Play question bank

[QUESTIONS] === getQuestionsForSession ===
[QUESTIONS] categoryKey: sports
[QUESTIONS] count: 10
[QUESTIONS] Pool size for sports : 10
[QUESTIONS] Selected 10 questions

[CASH-TEST] Loaded 10 questions
[CASH-TEST] First question: Which country won the FIFA World Cup...
[CASH-TEST] Starting Free Play trivia engine

[ENGINE] === START TRIVIA ENGINE ===
[ENGINE] Mode: cash-test
[ENGINE] Category: sports
[ENGINE] Questions: 10
[ENGINE] === Rendering Question 1 / 10 ===
[ENGINE] Question: Which country won the FIFA World Cup in 2018?
[ENGINE] Current score: 0
[ENGINE] Current streak: 0

// ... user answers ...

[SCORING] { correct: true, timeRemaining: 8.50, ... basePoints: 850, streakBonus: 0, total: 850 }
[ENGINE] Points earned: 850
[ENGINE] New score: 850
[ENGINE] New streak: 1

// ... 9 more questions ...

[ENGINE] === GAME FINISHED ===
[ENGINE] Mode: cash-test
[ENGINE] Category: sports
[ENGINE] Final score: 6420
[ENGINE] Correct: 8 / 10

[CASH-TEST] Match completed! Score: 6420
```

**If you see different logs or math questions, something is wrong.**

---

## ✅ Verification Tests

### Test 1: Free Play Still Works
1. Click "Free Play"
2. Click "Continue as Guest"
3. Select "Sports"
4. Play game
5. **Expected:** Sports questions, Kahoot scoring
6. **Status:** Should still work (UNCHANGED)

### Test 2: Test Cash Sports
1. Click "Cash Challenge (TEST MODE)"
2. Create lobby with "Sports" category
3. Join lobby and wait for countdown
4. **Expected:** Sports questions (same type as Free Play)
5. **Expected:** Kahoot scoring
6. **Expected:** Winner determined by score

### Test 3: Test Cash Politics
1. Create lobby with "Politics" category
2. Join and play
3. **Expected:** Politics questions
4. **Expected:** NO math questions

### Test 4: Console Logs
1. Open browser console (F12)
2. Play a Sports Test Cash match
3. Look for:
   - `[CASH-TEST] Category Key: sports`
   - `[QUESTIONS] categoryKey: sports`
   - `[ENGINE] Category: sports`
4. **Expected:** All logs show correct category
5. **Expected:** Questions match category

---

## 📝 Files Modified

### `/index.html`
**Changes:**
- Renamed `startTestCashTrivia` → `startTestCashMatch`
- Updated function to use Free Play's `getQuestionsForSession` and `startTriviaEngine`
- Added `startCashChallengeMatch` for real cash mode (same structure)
- Added `onCashChallengeComplete` placeholder

**Lines:** 1698-1802

**NO changes to:**
- Lobby creation (already correct)
- Category mapping (already correct)
- Free Play logic (completely untouched)

---

## 🎮 Lobby Category Mapping (Already Working)

When creating a lobby, the category is already correctly mapped:

```javascript
function createTestLobby({ category, ... }) {
  const categoryLabel = category;        // "Sports"
  const categoryKey = TRIVIA_CATEGORY_MAP[categoryLabel]; // "sports"

  const lobby = {
    category: categoryLabel,   // Display in UI
    categoryLabel,             // Display in UI
    categoryKey,               // Use for questions ✅
    // ...
  };
}
```

**This was already correct. No changes needed.**

---

## 🚀 What Happens Now

### When You Test
1. **Free Play** continues to work exactly as before
2. **Test Cash Challenge** now:
   - Shows same questions as Free Play for the selected category
   - Uses same trivia UI
   - Uses same Kahoot scoring
   - Determines winner by highest score
3. **Cash Challenge** (real money) is ready to use the same system

### Expected Behavior
- **Sports lobby** → Sports questions (football, basketball, etc.)
- **Politics lobby** → Politics questions (government, laws, etc.)
- **Movies lobby** → Movies questions (actors, directors, etc.)
- **NO math questions** unless you add a "Math" category option

---

## 🎯 Summary

**Before this change:**
- Free Play: Working ✅
- Test Cash: Broken/different system ❌

**After this change:**
- Free Play: Still working ✅ (unchanged)
- Test Cash: Uses Free Play's system ✅
- Cash Challenge: Uses Free Play's system ✅

**Key Functions Used:**
- `window.getQuestionsForSession(categoryKey, 10)` - Get questions
- `window.startTriviaEngine({ mode, categoryKey, questions, onComplete })` - Run game
- `window.calculateKahootStyleScore(...)` - Calculate points

**All modes now share the same:**
- Question bank
- Question loader
- Trivia engine
- Scoring system
- UI

**No separate logic. No math defaults. One unified system.**

---

## 🐛 Troubleshooting

### If Test Cash still shows math questions:
1. Check console for `[CASH-TEST] Category Key: ???`
2. If it's undefined/null, lobby creation is broken
3. If it's correct but questions are math, question loader is broken

### If trivia engine doesn't start:
1. Check console for `[CASH-TEST] Free Play trivia engine not available`
2. Verify `/src/questions-new.js` loaded
3. Verify `/src/trivia-engine-new.js` loaded
4. Hard refresh browser (Ctrl+Shift+R)

### If questions don't appear:
1. Check `[ENGINE] Questions: ???` in console
2. If 0, `getQuestionsForSession` returned empty array
3. Check `[QUESTIONS] Pool size for ??? : ???`
4. Should show 10 for each category

---

## ✅ Build Status

```
✓ built in 1.01s
dist/index.html: 78.73 kB
No errors
```

Project builds successfully with all changes integrated.
