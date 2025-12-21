# BrainDash Unified Scoring System

## ✅ COMPLETE: Kahoot-Style Scoring Unified Across All Modes

The scoring system has been fixed and unified to use **one shared BrainDash Kahoot-style scoring function** for Free Play, Cash Challenge, and Test Cash Challenge.

---

## 🎯 What Changed

### Before
- Different scoring calculations in different places
- Scoring based on "time remaining" (confusing)
- Inconsistent streak bonuses
- No clear UI breakdown

### After
- ✅ ONE shared `calculateBrainDashScore()` function
- ✅ Based on response time in milliseconds (clear)
- ✅ True Kahoot formula implementation
- ✅ UI shows: Score, Streak, Base points, Streak bonus
- ✅ Works identically in Free Play, Cash, and Test Cash

---

## 🧮 Scoring Formula (True Kahoot Style)

### Base Points Calculation

```javascript
If responseTime < 0.5 seconds:
  basePoints = 1000 (full points for instant answer)

Otherwise:
  speedFactor = 1 - ((responseTime / maxTime) / 2)
  basePoints = round(speedFactor × 1000)

Example with 15-second timer:
  0.5s → 1000 points
  1.0s → 967 points
  3.0s → 900 points
  5.0s → 833 points
  7.5s → 750 points
  10s → 667 points
  15s → 500 points (slowest)
```

### Streak Bonus

```javascript
Streak 1: +0 points
Streak 2: +100 points
Streak 3: +200 points
Streak 4: +300 points
Streak 5: +400 points
Streak 6+: +500 points (capped)
```

### Total Score

```
Total = Base Points + Streak Bonus

Example scenarios:
1. First correct answer (0.8s):
   - Base: 973 pts
   - Streak: 0 pts (first correct)
   - Total: 973 pts
   - New streak: 1

2. Second correct answer (2.0s):
   - Base: 933 pts
   - Streak: 100 pts (2 in a row)
   - Total: 1033 pts
   - New streak: 2

3. Sixth correct answer (1.5s):
   - Base: 950 pts
   - Streak: 500 pts (6+ in a row, capped)
   - Total: 1450 pts
   - New streak: 6

4. Incorrect answer:
   - Total: 0 pts
   - Streak resets to 0
```

---

## 📊 Function Signature

```javascript
function calculateBrainDashScore({
  correct,              // boolean - was answer correct?
  responseTimeMs,       // number - time to answer in milliseconds
  questionTimerSec,     // number - total time allowed (e.g., 15)
  basePoints = 1000,    // number - max base points
  currentStreak         // number - consecutive correct BEFORE this answer
})

Returns:
{
  points: number,       // total points earned
  basePoints: number,   // base points from speed
  streakBonus: number,  // bonus from streak
  newStreak: number     // updated streak value
}
```

---

## 🎮 How It's Used

### In the Trivia Engine

When user selects an answer:

```javascript
function onAnswerSelected(selectedIndex) {
  // 1. Stop timer
  clearInterval(activeQuestionTimerId);

  // 2. Calculate response time
  const responseTimeMs = Date.now() - state.questionStartTime;

  // 3. Check if correct
  const correct = (selectedIndex === q.correctIndex);

  // 4. Calculate score using unified function
  const { points, basePoints, streakBonus, newStreak } = calculateBrainDashScore({
    correct,
    responseTimeMs,
    questionTimerSec: state.maxTimePerQuestion,  // 15 seconds
    basePoints: 1000,
    currentStreak: state.streak  // streak BEFORE this answer
  });

  // 5. Update state
  state.streak = newStreak;
  state.score += points;
  if (correct) state.correctCount += 1;

  // 6. Show UI feedback
  showAnswerFeedback(correct, points, basePoints, streakBonus);
}
```

### UI Updates

After each answer, the UI shows:

```javascript
// Score display: "Score: 4200"
scoreEl.textContent = `Score: ${state.score}`;

// Streak display: "Streak: 3 🔥"
streakEl.textContent = `Streak: ${state.streak} 🔥`;

// Breakdown (if correct):
// "✓ CORRECT! +1033 points"
// "Base: 933 pts | Streak Bonus: 100 pts"

// Breakdown (if incorrect):
// "✗ INCORRECT - 0 points"
// "Streak reset"
```

---

## 🔍 Key Implementation Details

### 1. Response Time Tracking

```javascript
// When question is rendered:
state.questionStartTime = Date.now();

// When answer is selected:
const responseTimeMs = Date.now() - state.questionStartTime;
```

**This gives accurate response time in milliseconds.**

### 2. Streak Management

```javascript
// BEFORE scoring:
const currentStreak = state.streak;  // e.g., 2

// Calculate score WITH current streak:
const { newStreak } = calculateBrainDashScore({
  currentStreak: state.streak  // Use streak before this answer
});

// AFTER scoring:
state.streak = newStreak;  // e.g., 3 (if correct) or 0 (if incorrect)
```

**The streak used for bonus calculation is the one BEFORE the current answer.**

### 3. UI Elements

Required HTML elements (already exist):

```html
<div id="ogScoreDisplay">Score: 0</div>
<div id="ogStreakDisplay">Streak: 0 🔥</div>
<div id="ogScoringBreakdown"></div>
```

**These are updated in real-time after each answer.**

---

## 📝 Modes Using This Scoring

### Free Play ✅
- Uses `calculateBrainDashScore()`
- Shows score and streak in UI
- Final score displayed at end

### Test Cash Challenge ✅
- Uses `calculateBrainDashScore()`
- Same scoring as Free Play
- Final score determines winner vs bots

### Cash Challenge ✅
- Uses `calculateBrainDashScore()`
- Same scoring as Test Cash
- Final score determines real money winner

**All three modes use the EXACT SAME scoring calculation.**

---

## 🔍 Debug Logs

### When Answer is Selected

```javascript
[TRIVIA] === Answer Selected ===
[TRIVIA] Selected: 2 Correct: 2
[TRIVIA] Is correct: true
[TRIVIA] Response time: 2.35 s

[SCORING] BrainDash {
  correct: true,
  responseTimeMs: 2347,
  responseTimeSec: 2.35,
  questionTimerSec: 15,
  currentStreak: 1,
  newStreak: 2,
  basePointsEarned: 922,
  streakBonus: 100,
  points: 1022
}

[TRIVIA] Points earned: 1022
[TRIVIA] New total score: 1995
[TRIVIA] New streak: 2
```

### Correct Answer Breakdown

```
✓ CORRECT! +1022 points
Base: 922 pts | Streak Bonus: 100 pts
```

### Incorrect Answer Breakdown

```
✗ INCORRECT - 0 points
Streak reset
```

---

## 🎯 Testing Guide

### Test 1: Base Points from Speed

1. Start Free Play
2. Answer first question **immediately** (< 0.5s)
   - Expected: ~1000 base points
3. Answer second question **after 5 seconds**
   - Expected: ~833 base points
4. Answer third question **at last second**
   - Expected: ~500 base points

**Verify:** Faster answers = more base points

### Test 2: Streak Bonus Progression

1. Start Free Play
2. Get 6 questions correct in a row
3. Watch streak and bonus:
   - Q1 correct: Streak 1, Bonus +0
   - Q2 correct: Streak 2, Bonus +100
   - Q3 correct: Streak 3, Bonus +200
   - Q4 correct: Streak 4, Bonus +300
   - Q5 correct: Streak 5, Bonus +400
   - Q6 correct: Streak 6, Bonus +500
4. Get one wrong
5. **Verify:** Streak resets to 0

### Test 3: Score Consistency Across Modes

1. Play Free Play Sports
2. Note scoring behavior
3. Play Test Cash Sports
4. **Verify:** Scoring feels identical
5. Answer speeds result in same points
6. Streaks work the same way

### Test 4: UI Breakdown Display

1. Start any game
2. Answer questions
3. **Verify after each answer:**
   - Score updates immediately
   - Streak shows correct count
   - Breakdown shows: "+X pts (Base: Y, Streak: +Z)"
   - Correct answer highlighted in green

---

## 📊 Score Distribution Examples

### Perfect Game (10 questions, all instant < 0.5s)

```
Q1: 1000 + 0 = 1000    (streak 1)
Q2: 1000 + 100 = 1100  (streak 2)
Q3: 1000 + 200 = 1200  (streak 3)
Q4: 1000 + 300 = 1300  (streak 4)
Q5: 1000 + 400 = 1400  (streak 5)
Q6: 1000 + 500 = 1500  (streak 6)
Q7: 1000 + 500 = 1500  (streak 7, bonus capped)
Q8: 1000 + 500 = 1500
Q9: 1000 + 500 = 1500
Q10: 1000 + 500 = 1500
----------------------------
Total: 13,500 points
```

### Good Game (10 questions, average 3s response)

```
Q1: 900 + 0 = 900
Q2: 900 + 100 = 1000
Q3: 900 + 200 = 1100
Q4: 0 (wrong, streak reset)
Q5: 900 + 0 = 900
Q6: 900 + 100 = 1000
Q7: 900 + 200 = 1100
Q8: 900 + 300 = 1200
Q9: 900 + 400 = 1300
Q10: 900 + 500 = 1400
----------------------------
Total: 9,900 points
Correct: 9/10
```

### Average Game (10 questions, mixed speed/accuracy)

```
Q1: 850 + 0 = 850      (correct, 4s)
Q2: 0                  (wrong)
Q3: 920 + 0 = 920      (correct, 2s)
Q4: 750 + 100 = 850    (correct, 8s)
Q5: 0                  (wrong)
Q6: 980 + 0 = 980      (correct, 1s)
Q7: 0                  (wrong)
Q8: 900 + 0 = 900      (correct, 3s)
Q9: 850 + 100 = 950    (correct, 4s)
Q10: 800 + 200 = 1000  (correct, 6s)
----------------------------
Total: 6,450 points
Correct: 7/10
```

---

## 🚀 Performance Characteristics

### Point Range per Question

```
Maximum: 1500 points (instant + 6-streak)
Minimum: 0 points (incorrect)

Realistic ranges:
- Instant answer: 1000-1500 pts
- Fast (1-3s): 900-1400 pts
- Medium (4-7s): 750-1250 pts
- Slow (8-15s): 500-1000 pts
```

### Game Score Ranges (10 questions)

```
Perfect: 13,500 points
Excellent (9/10, fast): 11,000-12,000 points
Good (8/10, mixed): 8,000-10,000 points
Average (7/10, mixed): 6,000-8,000 points
Below average (6/10): 4,000-6,000 points
```

---

## 📁 Files Modified

### `/src/trivia-engine-unified.js`
**Changed:**
1. Renamed `calculateKahootStyleScore()` → `calculateBrainDashScore()`
2. Updated to use `responseTimeMs` instead of `timeRemaining`
3. Implemented true Kahoot formula:
   - Full points for < 0.5s
   - Decay formula: `1 - ((t/T)/2)`
4. Updated streak bonus tiers: 2→+100, 3→+200, etc.
5. Updated `onAnswerSelected()` to:
   - Calculate `responseTimeMs`
   - Use new scoring function
   - Update streak from `newStreak`
6. Exported both names for compatibility

**Lines changed:** ~120-195, 462-500, 612-629

### No other files modified
- Did NOT change question generation
- Did NOT change screen navigation
- Did NOT change lobby logic
- ONLY scoring and scoring UI

---

## ✅ Verification Checklist

- [x] One shared scoring function for all modes
- [x] Uses responseTimeMs (milliseconds)
- [x] Implements true Kahoot formula
- [x] Streak bonus: 2→100, 3→200, 4→300, 5→400, 6+→500
- [x] UI shows score, streak, and breakdown
- [x] Works in Free Play
- [x] Works in Test Cash
- [x] Works in Cash Challenge
- [x] Fast answers = more points
- [x] Streak increases bonus
- [x] Incorrect resets streak
- [x] Build succeeds

---

## 🎯 Summary

**Problem:** Inconsistent scoring across modes, unclear formula
**Solution:** One unified BrainDash Kahoot-style scoring function

**Formula:**
- Base: 1000 × (1 - ((responseTime/maxTime)/2)) if > 0.5s, else 1000
- Streak: 0/100/200/300/400/500 based on consecutive correct
- Total: Base + Streak

**Result:**
- Free Play, Cash, and Test Cash all use same scoring
- UI shows clear breakdown
- Fast answers + streaks = high scores
- True Kahoot-style experience

**Build Status:** ✅ Success (1.29s)

The scoring system is now unified, transparent, and Kahoot-accurate!
