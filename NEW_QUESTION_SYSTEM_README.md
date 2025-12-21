# New Category-Based Question System

## ✅ COMPLETE REPLACEMENT - Old Math-Only System Removed

This project now uses a **clean, explicit, category-based question system** in pure JavaScript for ALL game modes.

---

## 🎯 What Changed

### NEW System (Active)
1. **`/src/questions-new.js`** - Category-based question bank with 10 questions per category
2. **`/src/trivia-engine-new.js`** - Unified trivia engine with Kahoot scoring
3. All modes (Free Play, Test Cash) use these new files

### OLD System (Now Bypassed)
- **`/src/question-selection.js`** - OLD question loader (NOT USED by new system)
- **`/src/questions.js`** - OLD question system (NOT LOADED)
- **`/src/math-generator.js`** - OLD math generator (NOT USED)
- **`/src/easy_math_500.json`** - OLD math questions (NOT LOADED)
- **`/src/medium_math_500.json`** - OLD math questions (NOT LOADED)

These old files are **still present** but **NOT IMPORTED** in index.html, so they have no effect.

---

## 📊 New Question Bank Structure

### Categories Available
```javascript
QUESTION_BANK = {
  sports: [10 questions],
  politics: [10 questions],
  business: [10 questions],
  music: [10 questions],
  movies: [10 questions],
  history: [10 questions],
  geography: [10 questions],
  science: [10 questions],
  pop_culture: [10 questions],
  mixed: [auto-generated from all]
}
```

### Question Format
```javascript
{
  question: "Which country won the FIFA World Cup in 2018?",
  choices: ["Brazil", "Germany", "France", "Argentina"],
  correctIndex: 2  // 0-based index
}
```

---

## 🎮 How It Works Now

### 1. Free Play (Uses Offline Wizard)
```
User clicks "Free Play" → Guest
  ↓
Offline wizard opens (category selection)
  ↓
User selects "Sports" category
  ↓
Window.nextQuestion() called with categories: ["sports"]
  ↓
Questions loaded from QUESTION_BANK.sports
  ↓
Offline wizard renders questions
  ↓
Kahoot scoring applied automatically
  ↓
Match completes
```

**Result:** Sports questions from new question bank, no math!

### 2. Test Cash Challenge (Uses New Engine)
```
User creates lobby with "Sports" category
  ↓
Lobby stores:
  - categoryLabel: "Sports" (display)
  - categoryKey: "sports" (internal)
  ↓
Lobby fills → countdown → match starts
  ↓
startTestCashTrivia() called
  ↓
Questions loaded via getQuestionsForSession("sports", 10)
  ↓
startTriviaEngine() called with questions array
  ↓
New unified engine renders questions
  ↓
Kahoot scoring applied
  ↓
Match completes → winner determined
```

**Result:** Sports questions from new question bank, no math!

---

## 🔧 Key Functions

### `getQuestionsForSession(categoryKey, count)`
**Location:** `/src/questions-new.js`
**Purpose:** Gets a shuffled array of questions for a session
**Used by:** Test Cash Challenge

```javascript
const questions = window.getQuestionsForSession("sports", 10);
// Returns 10 sports questions
```

### `window.nextQuestion({ categories, difficulty })`
**Location:** `/src/questions-new.js` (compatibility layer)
**Purpose:** Provides questions one at a time for offline wizard
**Used by:** Free Play (via offline wizard)

```javascript
const result = await window.nextQuestion({
  categories: ["sports"],
  difficulty: "normal"
});
// Returns { question, done }
```

### `startTriviaEngine({ mode, categoryKey, questions, onComplete })`
**Location:** `/src/trivia-engine-new.js`
**Purpose:** Runs a complete trivia session with Kahoot scoring
**Used by:** Test Cash Challenge

```javascript
window.startTriviaEngine({
  mode: 'cash-test',
  categoryKey: 'sports',
  questions: questions,
  onComplete: (score, details) => {
    console.log('Final score:', score);
  }
});
```

### `calculateKahootStyleScore({ correct, timeRemaining, maxTime, currentStreak })`
**Location:** `/src/trivia-engine-new.js`
**Purpose:** Calculates points for a single question
**Used by:** New trivia engine

```javascript
const points = calculateKahootStyleScore({
  correct: true,
  timeRemaining: 8.5,  // seconds
  maxTime: 15,
  currentStreak: 2
});
// Returns: ~850 + 200 = 1050 points
```

---

## 🎯 Kahoot-Style Scoring

### Formula
```
If incorrect: 0 points

If correct:
  basePoints = 1000 × (timeRemaining / maxTime)
  streakBonus = min(currentStreak × 100, 500)
  total = basePoints + streakBonus
```

### Examples
| Time Left | Streak | Base Points | Streak Bonus | Total |
|-----------|--------|-------------|--------------|-------|
| 15s | 0 | 1000 | 0 | 1000 |
| 10s | 1 | ~667 | 100 | 767 |
| 5s | 3 | ~333 | 300 | 633 |
| 1s | 5 | ~67 | 500 | 567 |
| 0s (timeout) | 0 | 0 | 0 | 0 |

---

## 🔍 Debug Logs to Watch

### When Playing Sports Free Play
```
[Questions] nextQuestion called (compatibility mode)
[Questions] categories: ["sports"]
[Questions] Using category: sports
[Questions] Returning question: Which country won the FIFA World Cup...
[Questions] Category: sports
```

**✅ Good:** Category is "sports", question is sports-related
**❌ Bad:** Category is undefined/empty, or question is math

### When Playing Sports Test Cash
```
[Test Cash] === STARTING TRIVIA MATCH (NEW ENGINE) ===
[Test Cash] Category Key (internal): sports
[Test Cash] === LOADING QUESTIONS FROM NEW QUESTION BANK ===
[QUESTIONS] === getQuestionsForSession ===
[QUESTIONS] categoryKey: sports
[QUESTIONS] Pool size for sports : 10
[Test Cash] Loaded 10 questions for sports
[Test Cash] First question: Which country won the FIFA World Cup...
[ENGINE] === START TRIVIA ENGINE ===
[ENGINE] Mode: cash-test
[ENGINE] Category: sports
[ENGINE] Questions: 10
```

**✅ Good:** All logs show "sports", questions are sports-related
**❌ Bad:** Logs show math/empty, or questions don't match category

---

## 📝 Files Modified

### Created
- `/src/questions-new.js` - New question bank
- `/src/trivia-engine-new.js` - New unified engine
- `/NEW_QUESTION_SYSTEM_README.md` - This file

### Modified
- `/index.html` - Updated imports and Test Cash logic

### Bypassed (Not Deleted, Just Not Loaded)
- `/src/question-selection.js` - Old loader
- `/src/questions.js` - Old system
- `/src/math-generator.js` - Old math generator
- `/src/easy_math_500.json` - Old math questions
- `/src/medium_math_500.json` - Old math questions

---

## ✅ Verification Checklist

To verify everything works:

### Test 1: Free Play Sports
1. Click "Free Play"
2. Click "Continue as Guest"
3. Select "Sports" (🏈)
4. Click "Start Game"
5. **Expected:** Questions about sports (football, basketball, etc.)
6. **NOT Expected:** Math questions

### Test 2: Test Cash Sports
1. Click "Cash Challenge (TEST MODE)"
2. Create lobby with "Sports" category
3. Join and wait for countdown
4. **Expected:** Questions about sports
5. **NOT Expected:** Math questions

### Test 3: Console Logs
1. Open browser console (F12)
2. Play a Sports match
3. Look for `[Questions] Using category: sports`
4. Look for `[ENGINE] Category: sports`
5. **Expected:** All logs show correct category
6. **NOT Expected:** Math/undefined in logs

---

## 🚀 Adding More Questions

To add more questions to a category:

1. Open `/src/questions-new.js`
2. Find the category in `QUESTION_BANK`
3. Add more question objects:

```javascript
sports: [
  // ... existing questions ...
  {
    question: "Your new question here?",
    choices: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: 2  // 0-based (C is correct)
  }
]
```

4. Save and reload
5. New questions will appear in that category

---

## 🎯 Summary

**Before:** Math questions everywhere, complex old system
**After:** Category-based questions, clean new system

**Free Play:** ✅ Uses new question bank via compatibility layer
**Test Cash:** ✅ Uses new question bank directly
**Kahoot Scoring:** ✅ Unified across all modes

**Old Math System:** ❌ Bypassed, not loaded, has no effect

---

## 🐛 If You Still See Math Questions

1. **Check console logs:** Look for `[Questions] Using category: ???`
2. **Verify file load:** Check that `/src/questions-new.js` loaded
3. **Clear cache:** Hard refresh browser (Ctrl+Shift+R)
4. **Check lobby:** Verify categoryKey is set correctly
5. **Report:** Copy all `[Questions]` and `[ENGINE]` logs

The console logs will show exactly which category is being used and where it's coming from.
