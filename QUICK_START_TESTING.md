# Quick Start: Testing Unified Trivia System

## 🎯 Goal
Verify that Cash Challenge and Test Cash Challenge use the **SAME** questions and categories as Free Play.

---

## ✅ Test Plan

### Test 1: Free Play Sports
1. Click **"Free Play"** on homepage
2. Click **"Continue as Guest"**
3. Select **"Sports"** category (tile with 🏈)
4. Click **"Start Game"**
5. **Observe:** Questions should be about sports (football, basketball, etc.)
6. **Note the score** - it uses Kahoot-style scoring (speed + streak bonuses)

### Test 2: Test Cash Sports
1. Return to homepage
2. Click **"Cash Challenge (TEST MODE)"**
3. Create lobby:
   - Category: **"Sports"** (🏈 Sports)
   - Stake: $10
   - Max Players: 2
4. Click **"Create Lobby (Test)"**
5. Click **"View Lobby"** on your created lobby
6. Check terms box and click **"Join & Accept Terms"**
7. Wait for countdown (lobby fills automatically with bots)
8. **Observe:** Questions should be **EXACTLY THE SAME TYPE** as Free Play Sports
9. **Verify:** If you see math questions, something is wrong!

### Test 3: Compare Multiple Categories

Repeat for each category:

| Category | Free Play | Test Cash | Expected Questions |
|----------|-----------|-----------|-------------------|
| Sports | ✓ | ✓ | Sports trivia |
| Politics | ✓ | ✓ | Same as Free Play |
| Movies | ✓ | ✓ | Same as Free Play |
| History | ✓ | ✓ | Same as Free Play |
| Math | ✓ | ✓ | Math problems (ONLY for Math category) |

---

## 🐛 Debugging: If You See Wrong Questions

### Open Browser Console (F12)
Look for these key logs:

#### When Creating Lobby
```
[Test Cash] Creating lobby - categoryLabel: Sports categoryKey: sports
```
✅ **Good:** categoryKey should match the category (lowercase, no spaces)
❌ **Bad:** categoryKey is "math" when you selected Sports

#### When Match Starts
```
[Test Cash] === CALLING FREE PLAY TRIVIA ENGINE ===
[Test Cash] Categories array: ["sports"]
[Test Cash] Category plan: ["sports", "sports", "sports", ...]
```
✅ **Good:** Array contains the correct category
❌ **Bad:** Array contains "math" or is empty

#### When Loading Questions
```
[Question Selection] === nextQuestion called ===
[Question Selection] categories: ["sports"]
[Question Selection] ✓ Valid category found: sports
[Question Selection] Question prompt: What team won the Super Bowl...
```
✅ **Good:** Category is valid and question matches
❌ **Bad:** Category defaults to math or prompt doesn't match category

---

## 🎮 Expected Behavior

### All Modes Use Same Engine
- **Free Play** calls `window.startOfflineMatch(config, callback)`
- **Test Cash** calls `window.startOfflineMatch(config, callback)`
- **Cash Challenge** calls `window.startOfflineMatch(config, callback)`

They all use the **EXACT SAME** function.

### Scoring is Identical
- **Max per question:** 1000 points (instant answer, no streak)
- **Streak bonus:** +100, +200, +300, ... up to +500
- **Speed matters:** Faster answers = more points
- **Wrong answer:** 0 points, streak resets

### No Special Cash Behavior
- Cash modes do NOT have a separate question loader
- Cash modes do NOT default to math
- Cash modes use the EXACT categories you select

---

## 📊 Success Criteria

✅ **Test Passed IF:**
1. Sports Free Play shows sports questions
2. Sports Test Cash shows sports questions
3. Both modes show similar questions (from same pool)
4. Scoring works the same way (Kahoot-style)
5. No math questions appear in Sports matches

❌ **Test Failed IF:**
1. Test Cash shows math questions when Sports is selected
2. Questions don't match the selected category
3. Free Play and Test Cash show completely different question types

---

## 🔧 Common Issues & Fixes

### Issue: Test Cash Always Shows Math
**Cause:** categoryKey not being set correctly
**Check:** Console log for `[Test Cash] Category Key (internal): ???`
**Fix:** Verify TRIVIA_CATEGORY_MAP in index.html

### Issue: Questions Don't Match Category
**Cause:** Question pool not loaded for that category
**Check:** Console log for `[Question Selection] Available pools: ???`
**Fix:** Add JSON file for that category in `/src/` folder

### Issue: No Questions Appear
**Cause:** Question selection failing
**Check:** Console for errors in `[Question Selection]` logs
**Fix:** Verify question JSON files are loaded correctly

---

## 🎯 Quick Checklist

Before reporting an issue, verify:

- [ ] Browser console is open (F12)
- [ ] You created a lobby with the correct category
- [ ] You waited for lobby to fill and countdown to complete
- [ ] You checked console logs for category values
- [ ] You compared questions to Free Play

If all checks pass but questions are still wrong:
1. Copy ALL console logs starting from "Creating lobby"
2. Take a screenshot of the question
3. Report with both the logs and screenshot

---

## 🚀 Next Steps After Testing

Once verified working:
1. Test more categories (Politics, Movies, History, etc.)
2. Verify Kahoot scoring matches across modes
3. Test Real Cash Challenge (when ready)
4. Ensure multiplayer sync works correctly

---

**Remember:** Free Play is the source of truth. If Test Cash doesn't match Free Play, it's a bug!
