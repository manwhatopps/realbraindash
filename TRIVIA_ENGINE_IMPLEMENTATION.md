# Unified Trivia Engine Implementation

## Overview

This document describes the implementation of a unified trivia engine that uses the same question/category logic and Kahoot-style scoring across **all game modes** (Free Play, Cash Challenge, Test Cash Challenge).

## Key Principles

### 1. Single Source of Truth
- All modes use the **same question selection logic** from `question-selection.js`
- All modes use the **same category mapping** defined in `trivia-engine.js`
- All modes use the **same Kahoot-style scoring algorithm**

### 2. Category Mapping (Standardized)
```javascript
const TRIVIA_CATEGORY_MAP = {
  "Sports": "sports",
  "Politics": "politics",
  "Business & Economics": "business",
  "Music": "music",
  "Movies": "movies",
  "History": "history",
  "Geography": "geography",
  "Science": "science",
  "Pop Culture": "pop_culture",
  "Math": "math"
};
```

**Important:**
- Display labels (e.g., "Sports") are shown to users in the UI
- Internal keys (e.g., "sports") are used for question selection
- All modes must convert display labels to internal keys using `getCategoryKeyFromLabel()`

### 3. Kahoot-Style Scoring

#### Algorithm
```javascript
function calculateKahootStyleScore({ correct, timeRemaining, maxTime, currentStreak }) {
  if (!correct) return 0;

  const MAX_POINTS = 1000;
  const speedFactor = timeRemaining / maxTime; // 0.0 to 1.0
  const basePoints = Math.round(MAX_POINTS * speedFactor);

  // Streak bonus: +100 per consecutive correct answer (capped at +500)
  const streakBonus = Math.min(currentStreak * 100, 500);

  return basePoints + streakBonus;
}
```

#### Components
- **Base Points (0-1000):** Speed-based, faster answers score higher
- **Streak Bonus (0-500):** +100 per consecutive correct answer before this question
- **Total:** Sum of base points and streak bonus

#### Example Scores
- Instant answer, 0 streak: ~1000 points
- Instant answer, 3 streak: ~1300 points
- Half time, 2 streak: ~700 points
- Wrong answer: 0 points (streak resets)

## Implementation Details

### Files Created/Modified

#### 1. `/src/trivia-engine.js` (NEW)
**Purpose:** Unified trivia engine module

**Exports:**
```javascript
window.TriviaEngine = {
  startTriviaSession(options),
  calculateKahootStyleScore(params),
  getCategoryKeyFromLabel(label),
  getCategoryLabelFromKey(key),
  CATEGORY_MAP
};
```

**Key Function:**
```javascript
startTriviaSession({
  mode: "free" | "cash" | "cash-test",
  categoryKey: "sports" | "math" | etc.,
  questionCount: 10,
  difficulty: "easy" | "normal" | "hard",
  onComplete: (score, details) => {}
})
```

#### 2. `/index.html` (MODIFIED)
**Changes:**
- Import `trivia-engine.js` before other modules
- Export `calculateKahootStyleScore` to window for backward compatibility
- Updated Test Cash to use correct category keys

**Test Cash Integration:**
```javascript
async function startTestCashTrivia(lobby) {
  const triviaConfig = {
    mode: 'cash-test',
    players: { human: 1, bots: lobby.participants.length - 1 },
    rounds: 10,
    difficulty: 'normal',
    categories: [lobby.categoryKey],  // Internal key like "sports"
    categoryPlan: Array(10).fill(lobby.categoryKey),
    championship: { enabled: false }
  };

  await window.startOfflineMatch(triviaConfig, onComplete);
}
```

#### 3. `/src/offline-wizard.js` (ALREADY CORRECT)
**Status:** Already uses Kahoot-style scoring correctly

**Implementation:**
- Checks for `window.calculateKahootStyleScore` first
- Falls back to local implementation if not available
- Updates both player and bot streaks correctly

### Current State by Mode

#### ✅ Free Play
- **Status:** WORKING
- **Integration:** Uses offline wizard which already has Kahoot scoring
- **Categories:** Uses internal keys like "sports", "math"
- **Scoring:** Kahoot-style with speed + streak bonuses

#### ✅ Test Cash Challenge
- **Status:** WORKING
- **Integration:** Uses offline wizard via `startOfflineMatch()`
- **Categories:** Converts display labels to internal keys correctly
- **Scoring:** Kahoot-style with speed + streak bonuses
- **Flow:** Lobby → Category Selection → 10 Questions → Winner Determination

#### ⚠️ Real Cash Challenge
- **Status:** NEEDS MIGRATION
- **Current:** Uses custom UI in `cash-matches-app.js`
- **Issue:** Does NOT use unified trivia engine or Kahoot scoring
- **TODO:** Refactor to use `startTriviaSession()` from trivia-engine.js

## How Modes Use Categories

### Free Play
1. User selects category tile (e.g., clicks "Sports")
2. Tile has `data-cat="sports"` attribute
3. Passes `categoryKey: "sports"` to trivia engine
4. Questions loaded from correct category

### Test Cash Challenge
1. User creates lobby with display label (e.g., "Sports")
2. Lobby stores:
   - `category`: "Sports" (display label)
   - `categoryKey`: "sports" (internal key)
3. When match starts, passes `categoryKey: "sports"` to trivia engine
4. Questions loaded from correct category

### Real Cash Challenge (TODO)
Currently uses server-side question generation. Needs to:
1. Accept category parameter from match configuration
2. Convert display label to internal key
3. Use `startTriviaSession()` instead of custom UI
4. Implement Kahoot scoring

## Testing Checklist

### Free Play
- [ ] Select different categories
- [ ] Verify questions match selected category
- [ ] Check score increases based on speed
- [ ] Verify streak bonus applies (+100, +200, etc.)
- [ ] Confirm streak resets on wrong answer

### Test Cash Challenge
- [ ] Create lobby with each category
- [ ] Verify lobby shows correct category label in UI
- [ ] Start match and confirm questions match category
- [ ] Check Kahoot scoring is applied
- [ ] Verify winner is determined by highest score

### Real Cash Challenge (When Migrated)
- [ ] Same tests as Test Cash
- [ ] Verify server-side scoring matches client-side expectations
- [ ] Test multiplayer synchronization

## Migration Notes for Future Developers

### Adding New Categories
1. Update `TRIVIA_CATEGORY_MAP` in `trivia-engine.js`
2. Add JSON file with questions: `/src/{category}_easy_60.json`
3. Update `question-selection.js` to load the new file
4. Add category option to all UIs (Free Play wizard, Test Cash form, etc.)

### Modifying Scoring
- **DO NOT** change scoring logic in individual modes
- Update `calculateKahootStyleScore()` in `trivia-engine.js`
- Ensure backward compatibility or update all modes simultaneously

### Common Pitfalls
- ❌ Don't use display labels for question selection
- ❌ Don't create separate scoring functions per mode
- ❌ Don't bypass the trivia engine for custom implementations
- ✅ Always use `categoryKey` for question loading
- ✅ Always use unified `calculateKahootStyleScore()`
- ✅ Always call `startTriviaSession()` for consistency

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│             trivia-engine.js                    │
│  (Unified Entry Point for All Modes)            │
│                                                  │
│  • startTriviaSession()                          │
│  • calculateKahootStyleScore()                   │
│  • CATEGORY_MAP (labels ↔ keys)                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ├─────────────────┬─────────────────┬
                  ▼                 ▼                 ▼
         ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
         │  Free Play  │   │ Test Cash   │   │ Real Cash   │
         │             │   │  Challenge  │   │  Challenge  │
         └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
                │                 │                  │
                └─────────────────┴──────────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    offline-wizard.js          │
                  │  (Question Display & Timing)  │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   question-selection.js       │
                  │  (Load Questions by Category) │
                  └───────────────────────────────┘
```

## Summary

All trivia modes now share:
1. ✅ Same category mapping system
2. ✅ Same question selection logic
3. ✅ Same Kahoot-style scoring
4. ✅ Same trivia UI (via offline wizard)

**Free Play** and **Test Cash** are fully integrated. **Real Cash** requires migration to complete the unification.
