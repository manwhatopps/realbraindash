# Test Cash Debug Guide

## 🎯 Issue: Trivia Screen Not Appearing After Countdown

This document helps debug why the trivia screen doesn't show after Test Cash countdown ends.

---

## 📊 Complete Flow (What Should Happen)

```
1. User creates Sports lobby
   └─ createTestLobby() stores categoryKey: "sports"

2. User joins lobby
   └─ Lobby fills to maxPlayers

3. handleLobbyFull() triggered
   └─ After 3s delay → show5SecondCountdown()

4. show5SecondCountdown() counts down
   └─ When count reaches 0 → startTestMatch(lobby)

5. startTestMatch() prepares UI
   ├─ Hides lobby screens
   ├─ Hides main wrap
   └─ Calls startTestCashMatch(lobby)

6. startTestCashMatch() loads questions
   ├─ Gets questions via window.getQuestionsForSession("sports", 10)
   └─ Calls window.startTriviaEngine({ questions, ... })

7. startTriviaEngine() shows trivia
   ├─ Calls window.showOfflineGameScreen()
   ├─ Shows #offlineGame screen
   ├─ Calls renderQuestion()
   └─ Displays first question
```

---

## 🔍 Debug Logs to Watch

### Phase 1: Lobby Creation
```javascript
[Test Cash] Creating lobby - categoryLabel: Sports categoryKey: sports
```
**✅ Good:** categoryKey is "sports"
**❌ Bad:** categoryKey is undefined/null

### Phase 2: Countdown Trigger
```javascript
[Lobby] Lobby is now full: lobby-1234567890
[Test Cash] Starting countdown in 3 seconds...
```

### Phase 3: Countdown Complete
```javascript
[Test Cash] === startTestMatch called ===
[Test Cash] Lobby ID: lobby-1234567890
[Test Cash] Category Key: sports
[Test Cash] Hiding all lobby screens
[Test Cash] Hidden main wrap
[Test Cash] Calling startTestCashMatch...
```
**✅ Good:** All logs appear in order
**❌ Bad:** startTestMatch never called (countdown broken)

### Phase 4: Question Loading
```javascript
[CASH-TEST] ========================================
[CASH-TEST] === STARTING MATCH ===
[CASH-TEST] Lobby ID: lobby-1234567890
[CASH-TEST] Category Label: Sports
[CASH-TEST] Category Key: sports
[CASH-TEST] ========================================
[CASH-TEST] ✓ User is participant
[CASH-TEST] ✓ Free Play engine available
[CASH-TEST] Calling getQuestionsForSession("sports", 10)
[QUESTIONS] === getQuestionsForSession ===
[QUESTIONS] categoryKey: sports
[QUESTIONS] count: 10
[QUESTIONS] Pool size for sports : 10
[QUESTIONS] Selected 10 questions
[CASH-TEST] ✓ Loaded 10 questions
[CASH-TEST] First question preview: Which country won the FIFA World Cup in 2018?...
```
**✅ Good:** Questions loaded successfully
**❌ Bad:** No questions returned or error

### Phase 5: Engine Start
```javascript
[CASH-TEST] ========================================
[CASH-TEST] Calling startTriviaEngine NOW
[CASH-TEST] ========================================
[ENGINE] === START TRIVIA ENGINE ===
[ENGINE] Mode: cash-test
[ENGINE] Category: sports
[ENGINE] Questions: 10
[ENGINE] === Rendering Question 1 / 10 ===
[ENGINE] Question: Which country won the FIFA World Cup in 2018?
```
**✅ Good:** Engine starts and renders question
**❌ Bad:** Engine doesn't start or no question renders

---

## 🐛 Common Issues & Solutions

### Issue 1: Countdown Never Completes
**Symptoms:**
- Countdown overlay stays on screen
- No `[Test Cash] === startTestMatch called ===` log

**Possible Causes:**
1. User not marked as participant in lobby
2. `currentUserLobbyId` doesn't match lobby.id
3. JavaScript error during countdown

**Check:**
```javascript
// In browser console during countdown:
console.log('currentUserLobbyId:', currentUserLobbyId);
console.log('lobby.id:', lobby.id);
console.log('testUser:', testUser);
console.log('lobby.participants:', lobby.participants);
```

**Fix:**
Verify user is properly added to lobby.participants when joining.

---

### Issue 2: Functions Not Available
**Symptoms:**
```javascript
[CASH-TEST] ❌ Free Play trivia engine not available!
[CASH-TEST] - window.getQuestionsForSession: undefined
[CASH-TEST] - window.startTriviaEngine: undefined
```

**Possible Causes:**
1. `/src/questions-new.js` not loaded
2. `/src/trivia-engine-new.js` not loaded
3. Scripts loaded in wrong order

**Check:**
```javascript
// In browser console:
console.log('getQuestionsForSession:', typeof window.getQuestionsForSession);
console.log('startTriviaEngine:', typeof window.startTriviaEngine);
console.log('QUESTION_BANK:', window.QUESTION_BANK);
```

**Fix:**
Verify in index.html:
```html
<script type="module">
  import '/src/questions-new.js';
  import '/src/trivia-engine-new.js';
  // ... rest of code
</script>
```

---

### Issue 3: No Questions Returned
**Symptoms:**
```javascript
[CASH-TEST] ❌ No questions available for category: sports
[QUESTIONS] Pool size for sports : 0
```

**Possible Causes:**
1. QUESTION_BANK.sports is empty
2. categoryKey doesn't match any QUESTION_BANK key

**Check:**
```javascript
// In browser console:
console.log('QUESTION_BANK:', window.QUESTION_BANK);
console.log('sports questions:', window.QUESTION_BANK.sports);
console.log('sports count:', window.QUESTION_BANK.sports?.length);
```

**Fix:**
Verify QUESTION_BANK in `/src/questions-new.js` has questions for the category.

---

### Issue 4: Trivia Screen Doesn't Show
**Symptoms:**
- Engine starts successfully
- Questions are loaded
- But screen stays blank or shows lobby

**Possible Causes:**
1. `showOfflineGameScreen()` not working
2. Another screen overlaying trivia screen
3. CSS display issues

**Check:**
```javascript
// In browser console after engine starts:
const gameScreen = document.getElementById('offlineGame');
console.log('Game screen element:', gameScreen);
console.log('Game screen display:', gameScreen?.style.display);
console.log('Game screen classList:', gameScreen?.classList);
console.log('Game screen visible:', !gameScreen?.classList.contains('hidden'));
```

**Check for overlays:**
```javascript
// Look for elements with high z-index
const allElements = document.querySelectorAll('*');
const highZIndex = Array.from(allElements).filter(el => {
  const z = window.getComputedStyle(el).zIndex;
  return z !== 'auto' && parseInt(z) > 10000;
});
console.log('High z-index elements:', highZIndex);
```

**Fix:**
Manually show the screen to test:
```javascript
window.showOfflineGameScreen();
```

---

### Issue 5: Question Not Rendering
**Symptoms:**
- Trivia screen shows
- But question area is blank
- No choices visible

**Possible Causes:**
1. Question element IDs don't exist
2. renderQuestion() has error
3. Question data malformed

**Check:**
```javascript
// In browser console:
console.log('Prompt element:', document.getElementById('ogPrompt'));
console.log('Choices element:', document.getElementById('ogChoices'));
console.log('Round label:', document.getElementById('ogRoundLabel'));
console.log('Category label:', document.getElementById('ogCategoryLabel'));
```

**Fix:**
Verify HTML has these elements in `#offlineGame`:
```html
<div id="ogPrompt"></div>
<div id="ogChoices"></div>
<div id="ogRoundLabel"></div>
<div id="ogCategoryLabel"></div>
```

---

## 🎯 Step-by-Step Debug Checklist

When trivia doesn't show after countdown:

### [ ] 1. Open Browser Console (F12)

### [ ] 2. Create & Join Test Cash Lobby
- Select "Sports" category
- Join lobby
- Wait for countdown

### [ ] 3. Check Phase 1 Logs (Lobby Creation)
```
✓ [Test Cash] Creating lobby - categoryLabel: Sports categoryKey: sports
```

### [ ] 4. Check Phase 2 Logs (Countdown Start)
```
✓ [Lobby] Lobby is now full
✓ Countdown overlay appears on screen
```

### [ ] 5. Check Phase 3 Logs (Countdown Complete)
```
✓ [Test Cash] === startTestMatch called ===
✓ [Test Cash] Category Key: sports
✓ [Test Cash] Calling startTestCashMatch...
```
**If missing:** Countdown isn't calling startTestMatch

### [ ] 6. Check Phase 4 Logs (Question Loading)
```
✓ [CASH-TEST] === STARTING MATCH ===
✓ [CASH-TEST] ✓ User is participant
✓ [CASH-TEST] ✓ Free Play engine available
✓ [CASH-TEST] ✓ Loaded 10 questions
```
**If missing:** Functions not available or questions not loading

### [ ] 7. Check Phase 5 Logs (Engine Start)
```
✓ [ENGINE] === START TRIVIA ENGINE ===
✓ [ENGINE] Mode: cash-test
✓ [ENGINE] Questions: 10
✓ [ENGINE] === Rendering Question 1 / 10 ===
```
**If missing:** startTriviaEngine not being called or failing

### [ ] 8. Verify Screen Visible
- Trivia screen should be visible
- Question text should appear
- 4 answer choices should be visible

---

## 🚀 Manual Test Commands

If you want to test individual parts:

### Test Question Loading
```javascript
// Should return 10 sports questions
const questions = window.getQuestionsForSession('sports', 10);
console.log('Questions:', questions);
```

### Test Engine Start
```javascript
// Should show trivia screen and first question
const questions = window.getQuestionsForSession('sports', 10);
window.startTriviaEngine({
  mode: 'cash-test',
  categoryKey: 'sports',
  questions,
  onComplete: (score, details) => {
    console.log('Complete!', score, details);
  }
});
```

### Test Screen Display
```javascript
// Should show trivia screen
window.showOfflineGameScreen();
```

---

## 📝 Expected Console Output (Success)

When everything works, you should see this **exact sequence**:

```
[Test Cash] Creating lobby - categoryLabel: Sports categoryKey: sports
[Lobby] Lobby is now full: lobby-1234567890-1234
[Test Cash] === startTestMatch called ===
[Test Cash] Lobby ID: lobby-1234567890-1234
[Test Cash] Category Key: sports
[Test Cash] Hiding all lobby screens
[Test Cash] Hidden main wrap
[Test Cash] Calling startTestCashMatch...
[CASH-TEST] ========================================
[CASH-TEST] === STARTING MATCH ===
[CASH-TEST] Lobby ID: lobby-1234567890-1234
[CASH-TEST] Category Label: Sports
[CASH-TEST] Category Key: sports
[CASH-TEST] ========================================
[CASH-TEST] ✓ User is participant
[CASH-TEST] Checking for Free Play engine functions...
[CASH-TEST] - window.getQuestionsForSession: function
[CASH-TEST] - window.startTriviaEngine: function
[CASH-TEST] ✓ Free Play engine available
[CASH-TEST] Calling getQuestionsForSession("sports", 10)
[QUESTIONS] === getQuestionsForSession ===
[QUESTIONS] categoryKey: sports
[QUESTIONS] count: 10
[QUESTIONS] Pool size for sports : 10
[QUESTIONS] Selected 10 questions
[QUESTIONS] First question: Which country won the FIFA World Cup...
[CASH-TEST] Questions returned: [Array(10)]
[CASH-TEST] Questions length: 10
[CASH-TEST] ✓ Loaded 10 questions
[CASH-TEST] First question preview: Which country won the FIFA World Cup in 2018?...
[CASH-TEST] First question full: {question: "...", choices: [...], correctIndex: 2}
[CASH-TEST] ========================================
[CASH-TEST] Calling startTriviaEngine NOW
[CASH-TEST] ========================================
[ENGINE] === START TRIVIA ENGINE ===
[ENGINE] Mode: cash-test
[ENGINE] Category: sports
[ENGINE] Questions: 10
[ENGINE] === Rendering Question 1 / 10 ===
[ENGINE] Question: Which country won the FIFA World Cup in 2018?
[ENGINE] Current score: 0
[ENGINE] Current streak: 0
[CASH-TEST] startTriviaEngine called successfully
```

**And then you should SEE:**
- Trivia screen with question
- 4 answer buttons
- Timer bar
- Category label showing "SPORTS"
- Round label showing "Question 1/10"

---

## ✅ Summary

**The flow is:**
1. Countdown hits 0
2. Calls `startTestMatch(lobby)`
3. Calls `startTestCashMatch(lobby)`
4. Loads questions via `getQuestionsForSession()`
5. Starts engine via `startTriviaEngine()`
6. Engine shows screen via `showOfflineGameScreen()`
7. Engine renders first question

**If any step fails, the detailed logs will show exactly where.**

**Most common issue:** Functions not loaded (check imports in index.html)

**Build status:** ✅ Success (908ms)
