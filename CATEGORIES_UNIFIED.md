# Categories Unified Across All Modes

## ✅ COMPLETE: Single Category System for Free Play and Cash Challenge

Free Play now uses the **exact same categories** as Cash Challenge and Test Cash Challenge. The old Math/Art/Entertainment categories have been removed.

---

## 🎯 Problem Fixed

### Before
**Free Play had:**
- Math 🔢
- Art 🎨
- Entertainment 🎭
- Sports 🏈
- History 🏛️
- Music 🎵
- Science 🔬
- Movies 🎬
- Geography 🗺️

**Cash Challenge had:**
- Sports
- Politics
- Business & Economics
- Music
- Movies
- History
- Geography
- Science
- Pop Culture
- Mixed

**Result:** Mismatched categories, confusion in question loading, broken category keys

### After
**All modes use the same 10 categories:**
1. Sports 🏈
2. Politics 🏛️
3. Business & Economics 💼
4. Music 🎵
5. Movies 🎬
6. History 📜
7. Geography 🗺️
8. Science 🔬
9. Pop Culture 🎭
10. Mixed 🎲

---

## 📊 Canonical Category Definition

Created `TRIVIA_CATEGORIES` as the **single source of truth**:

```javascript
// In /src/questions-new.js

const TRIVIA_CATEGORIES = [
  { label: "Sports", key: "sports", icon: "🏈" },
  { label: "Politics", key: "politics", icon: "🏛️" },
  { label: "Business & Economics", key: "business", icon: "💼" },
  { label: "Music", key: "music", icon: "🎵" },
  { label: "Movies", key: "movies", icon: "🎬" },
  { label: "History", key: "history", icon: "📜" },
  { label: "Geography", key: "geography", icon: "🗺️" },
  { label: "Science", key: "science", icon: "🔬" },
  { label: "Pop Culture", key: "pop_culture", icon: "🎭" },
  { label: "Mixed", key: "mixed", icon: "🎲" }
];

// Auto-generated map
const TRIVIA_CATEGORY_MAP = TRIVIA_CATEGORIES.reduce((map, c) => {
  map[c.label] = c.key;
  return map;
}, {});

// Exports
window.TRIVIA_CATEGORIES = TRIVIA_CATEGORIES;
window.TRIVIA_CATEGORY_MAP = TRIVIA_CATEGORY_MAP;
```

### Fields
- **`label`**: User-facing name (e.g., "Business & Economics")
- **`key`**: Internal key for question bank (e.g., "business")
- **`icon`**: Emoji icon for UI

---

## 🔧 How It Works

### 1. Category Definition (Single Source)
File: `/src/questions-new.js`

```javascript
const TRIVIA_CATEGORIES = [ /* 10 categories */ ];
```

This array is the **only place** categories are defined.

### 2. Free Play Dynamic Rendering
File: `/index.html`

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const renderFreePlayCategories = () => {
    const catsGrid = document.getElementById('catsGrid');

    // Clear old hardcoded content
    catsGrid.innerHTML = '';

    // Render from TRIVIA_CATEGORIES
    window.TRIVIA_CATEGORIES.forEach(cat => {
      const tile = document.createElement('div');
      tile.className = cat.key === 'mixed' ? 'wizard-tile wizard-tile-selected' : 'wizard-tile';
      tile.setAttribute('data-cat', cat.key);
      tile.innerHTML = `
        <div class="cat-icon">${cat.icon}</div>
        <div class="cat-title">${cat.label}</div>
      `;
      catsGrid.appendChild(tile);
    });
  };

  // Render when available
  if (window.TRIVIA_CATEGORIES) {
    renderFreePlayCategories();
  } else {
    // Wait for questions-new.js to load
    const checkInterval = setInterval(() => {
      if (window.TRIVIA_CATEGORIES) {
        clearInterval(checkInterval);
        renderFreePlayCategories();
      }
    }, 100);
  }
});
```

### 3. Cash Challenge Uses Same Categories
Cash Challenge already uses `TRIVIA_CATEGORY_MAP` for lobbies:

```javascript
function createTestCashLobby(categoryLabel, stake, maxPlayers) {
  const categoryKey = TRIVIA_CATEGORY_MAP[categoryLabel] || "mixed";

  const lobby = {
    id: generateLobbyId(),
    categoryLabel,      // "Sports"
    categoryKey,        // "sports"
    mode: "cash-test",
    // ...
  };
}
```

### 4. Question Loading (Unified)
Both modes use the same function:

```javascript
const questions = await getQuestionsForSession(categoryKey, 10);
// categoryKey = "sports", "politics", "business", etc.
```

---

## 📝 Files Modified

### `/src/questions-new.js`
**Added:**
- `TRIVIA_CATEGORIES` array with 10 categories
- Auto-generated `TRIVIA_CATEGORY_MAP` from array
- Export `window.TRIVIA_CATEGORIES`

**Changed:**
- Category map now derived from canonical array
- Console log shows category labels instead of keys

### `/index.html`
**Removed:**
- Hardcoded category tiles for Math, Art, Entertainment
- All old category HTML markup

**Added:**
- Dynamic category rendering on page load
- Waits for `TRIVIA_CATEGORIES` to be available
- Renders all 10 categories from single source

---

## 🎮 User Experience

### Free Play Flow
1. Click "Guest" or "Free Play"
2. Select number of bots
3. Select rounds
4. Select difficulty
5. **Select categories** ← Now shows same 10 as Cash
6. Categories match exactly what Cash Challenge offers

### Cash Challenge Flow
1. Click "Cash Challenge"
2. **Select category** ← Same 10 categories
3. Create/join lobby
4. Categories match exactly what Free Play offers

---

## 🔍 Debug Logs

### On Page Load
```javascript
[Questions] ✓ New question bank loaded successfully
[Questions] Available categories: Sports, Politics, Business & Economics, Music, Movies, History, Geography, Science, Pop Culture, Mixed
[Categories] Rendering Free Play categories from TRIVIA_CATEGORIES
[Categories] Rendered 10 categories
```

### When Selecting Category (Free Play)
```javascript
[Offline Wizard] Starting wizard flow
[Offline Wizard] Categories selected: ["sports", "music"]
[Offline Wizard] Category plan: ["sports", "music", "sports", "music", "sports"]
```

### When Creating Lobby (Cash)
```javascript
[Test Cash] Creating lobby - categoryLabel: Sports categoryKey: sports
[Test Cash] Lobby created: { categoryLabel: "Sports", categoryKey: "sports", ... }
```

### When Loading Questions (Both Modes)
```javascript
[QUESTIONS] === getQuestionsForSession ===
[QUESTIONS] categoryKey: sports
[QUESTIONS] count: 10
[QUESTIONS] Pool size for sports: 10
[QUESTIONS] Selected 10 questions
```

---

## ✅ Verification Checklist

- [x] `TRIVIA_CATEGORIES` defined as single source
- [x] All 10 categories have label, key, and icon
- [x] `TRIVIA_CATEGORY_MAP` auto-generated
- [x] Free Play renders categories dynamically
- [x] Cash Challenge uses same category map
- [x] Old Math/Art/Entertainment removed
- [x] No hardcoded category tiles in HTML
- [x] Both modes call `getQuestionsForSession(categoryKey, count)`
- [x] Category keys match QUESTION_BANK keys
- [x] Build succeeds

---

## 🚀 Testing Guide

### Test 1: Free Play Shows Correct Categories
1. Open BrainDash
2. Click "Guest" or "Free Play"
3. Navigate to Categories step
4. **Verify:** 10 categories shown:
   - Sports 🏈
   - Politics 🏛️
   - Business & Economics 💼
   - Music 🎵
   - Movies 🎬
   - History 📜
   - Geography 🗺️
   - Science 🔬
   - Pop Culture 🎭
   - Mixed 🎲
5. **Verify:** NO Math, Art, or Entertainment

### Test 2: Free Play Uses Correct Category Keys
1. In Free Play, select "Sports"
2. Start game
3. Open console
4. **Verify logs:**
   ```
   [QUESTIONS] categoryKey: sports
   [QUESTIONS] Pool size for sports: 10
   ```
5. **Not:** `categoryKey: Sports` (wrong case) or `categoryKey: undefined`

### Test 3: Cash Challenge Matches
1. Click "Cash Challenge" → "Test Cash"
2. View available categories
3. **Verify:** Same 10 categories as Free Play
4. Create Sports lobby
5. **Verify console:**
   ```
   [Test Cash] categoryKey: sports
   ```

### Test 4: Questions Load Correctly
1. Play Free Play Sports game
2. Note questions received
3. Play Test Cash Sports game
4. **Verify:**
   - Both use `categoryKey: "sports"`
   - Both call same `getQuestionsForSession()`
   - Questions come from same pool

### Test 5: No Old Categories
1. Search console for "math", "art", "entertainment"
2. **Verify:** No references to old categories
3. Check HTML source
4. **Verify:** No hardcoded tiles for old categories

---

## 📊 Category Mapping Reference

| UI Label | Internal Key | Icon | Question Bank Key |
|----------|-------------|------|------------------|
| Sports | sports | 🏈 | sports |
| Politics | politics | 🏛️ | politics |
| Business & Economics | business | 💼 | business |
| Music | music | 🎵 | music |
| Movies | movies | 🎬 | movies |
| History | history | 📜 | history |
| Geography | geography | 🗺️ | geography |
| Science | science | 🔬 | science |
| Pop Culture | pop_culture | 🎭 | pop_culture |
| Mixed | mixed | 🎲 | mixed |

---

## 🔧 Adding New Categories (Future)

To add a new category:

### 1. Update TRIVIA_CATEGORIES
```javascript
const TRIVIA_CATEGORIES = [
  // ... existing ...
  { label: "Technology", key: "technology", icon: "💻" }
];
```

### 2. Add Questions to QUESTION_BANK
```javascript
const QUESTION_BANK = {
  // ... existing ...
  "technology": [
    {
      question: "What does CPU stand for?",
      choices: ["Central Processing Unit", "..."],
      correctIndex: 0
    }
    // ... more questions
  ]
};
```

### 3. Done!
- Free Play automatically renders new category
- Cash Challenge automatically includes it
- No other changes needed

---

## 🎯 Summary

**Problem:** Free Play and Cash Challenge used different categories
**Solution:** Created `TRIVIA_CATEGORIES` as single source of truth

**Changes:**
1. Defined 10 canonical categories in `/src/questions-new.js`
2. Removed hardcoded HTML for old categories
3. Dynamically render Free Play categories from array
4. Both modes now use same category keys

**Result:**
- Free Play: 10 categories (Sports, Politics, Business, etc.)
- Cash Challenge: Same 10 categories
- No more Math/Art/Entertainment
- Unified question loading
- One category system, one question source

**Build Status:** ✅ Success (1.11s)

Categories are now unified across all modes!
