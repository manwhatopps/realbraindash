/**
 * UNIFIED TRIVIA ENGINE
 *
 * Single source of truth for all trivia gameplay across:
 * - Free Play
 * - Cash Challenge
 * - Test Cash Challenge
 *
 * Uses Kahoot-style scoring with speed bonuses and streak multipliers.
 * All modes use the same category/question selection logic.
 */

console.log('[Trivia Engine] Module loaded');

// === CATEGORY MAPPING (SOURCE OF TRUTH) ===
// Maps display labels to internal category keys
const TRIVIA_CATEGORY_MAP = {
  "Sports": "sports",
  "Politics": "politics",
  "Business & Economics": "business",
  "Music": "music",
  "Movies": "movies",
  "History": "history",
  "Geography": "geography",
  "Science": "science",
  "Pop Culture": "pop_culture"
};

// === KAHOOT-STYLE SCORING ===
// Calculate points for a single question
// - correct: boolean - whether answer was correct
// - timeRemaining: seconds remaining when answered
// - maxTime: total seconds allowed per question
// - currentStreak: number of consecutive correct answers BEFORE this question
function calculateKahootStyleScore({ correct, timeRemaining, maxTime, currentStreak }) {
  if (!correct) return 0;

  const MAX_POINTS = 1000;
  const clampedTime = Math.max(0, Math.min(timeRemaining, maxTime));
  const speedFactor = maxTime > 0 ? clampedTime / maxTime : 0;
  const basePoints = Math.round(MAX_POINTS * speedFactor);

  // Streak bonus: +100 per previous correct answer, capped at +500
  const streakBonus = Math.min(currentStreak * 100, 500);
  const total = basePoints + streakBonus;

  console.log('[Trivia Engine Scoring]', {
    correct,
    timeRemaining: timeRemaining.toFixed(2),
    maxTime,
    currentStreak,
    basePoints,
    streakBonus,
    total
  });

  return total;
}

// === GAME STATE ===
let currentSession = null;

/**
 * Start a trivia session for any mode
 *
 * @param {Object} options
 * @param {"free"|"cash"|"cash-test"} options.mode - Game mode
 * @param {string|null} options.categoryKey - Internal category key (e.g. "sports", "math")
 * @param {number} options.questionCount - Number of questions (typically 10)
 * @param {string} [options.difficulty="normal"] - Difficulty level
 * @param {function(score: number, details: object): void} [options.onComplete] - Completion callback
 */
async function startTriviaSession(options) {
  const {
    mode,
    categoryKey,
    questionCount = 10,
    difficulty = 'normal',
    onComplete
  } = options;

  console.log('[Trivia Engine] === START SESSION ===');
  console.log('[Trivia Engine] Mode:', mode);
  console.log('[Trivia Engine] Category Key:', categoryKey);
  console.log('[Trivia Engine] Questions:', questionCount);
  console.log('[Trivia Engine] Difficulty:', difficulty);

  // Initialize session state
  currentSession = {
    mode,
    categoryKey,
    questionCount,
    difficulty,
    onComplete,
    currentQuestionIndex: 0,
    score: 0,
    streak: 0,
    correctCount: 0,
    questions: [],
    startTime: Date.now()
  };

  // Use offline wizard's trivia system (which already has Free Play working)
  // Build the config in the same format the offline wizard expects
  const categories = categoryKey ? [categoryKey] : [];
  const categoryPlan = Array(questionCount).fill(categoryKey);

  const triviaConfig = {
    mode: mode,
    players: { human: 1, bots: 0 }, // We'll handle multiplayer separately
    rounds: questionCount,
    difficulty: difficulty,
    eliminationEnabled: false,
    elimination: { startRound: null, perRound: 0, schedule: [] },
    categories: categories,
    categoryPlan: categoryPlan,
    championship: { enabled: false }
  };

  console.log('[Trivia Engine] Trivia config:', triviaConfig);

  // Check if offline wizard's match runner is available
  if (typeof window.startOfflineMatch === 'function') {
    console.log('[Trivia Engine] Using offline wizard match runner');

    try {
      await window.startOfflineMatch(triviaConfig, (finalScore, details) => {
        console.log('[Trivia Engine] Session complete!');
        console.log('[Trivia Engine] Final score:', finalScore);
        console.log('[Trivia Engine] Details:', details);

        if (typeof onComplete === 'function') {
          onComplete(finalScore, details);
        }

        currentSession = null;
      });
    } catch (error) {
      console.error('[Trivia Engine] Error running session:', error);
      throw error;
    }
  } else {
    console.error('[Trivia Engine] Offline match runner not available!');
    throw new Error('Trivia engine not initialized - offline wizard not loaded');
  }
}

/**
 * Convert a display label to an internal category key
 * @param {string} label - Display label (e.g. "Sports")
 * @returns {string} Internal key (e.g. "sports")
 */
function getCategoryKeyFromLabel(label) {
  return TRIVIA_CATEGORY_MAP[label] || null;
}

/**
 * Get the display label from a category key
 * @param {string} key - Internal key (e.g. "sports")
 * @returns {string} Display label (e.g. "Sports")
 */
function getCategoryLabelFromKey(key) {
  for (const [label, k] of Object.entries(TRIVIA_CATEGORY_MAP)) {
    if (k === key) return label;
  }
  return key; // fallback to key itself
}

// Export to window for global access
window.TriviaEngine = {
  startTriviaSession,
  calculateKahootStyleScore,
  getCategoryKeyFromLabel,
  getCategoryLabelFromKey,
  CATEGORY_MAP: TRIVIA_CATEGORY_MAP
};

// Also export individual functions for backward compatibility
window.startTriviaSession = startTriviaSession;
window.calculateKahootStyleScore = calculateKahootStyleScore;

console.log('[Trivia Engine] Initialized successfully');
