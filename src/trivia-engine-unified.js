/**
 * === UNIFIED TRIVIA ENGINE ===
 *
 * Single trivia engine for ALL modes: Free Play, Cash, Test Cash
 * Features:
 * - Centralized game state & lifecycle management
 * - AI-backed question generation with repeat avoidance
 * - Kahoot-style scoring WITH UI breakdown
 * - Robust cleanup on exit/end
 */

console.log('[Trivia Engine] Loading unified trivia engine...');

// ============================================================================
// GLOBAL STATE
// ============================================================================

let activeTriviaGame = null;
let activeQuestionTimerId = null;

// Question cache and tracking
const questionCache = {};   // categoryKey -> array of questions
const seenQuestionIds = {}; // categoryKey -> Set of IDs

// ============================================================================
// QUESTION MANAGEMENT WITH AI
// ============================================================================

/**
 * Get questions for a session, using cache and AI generation as needed.
 * @param {string} categoryKey - Category like "sports", "movies", etc.
 * @param {number} count - Number of questions needed
 * @returns {Promise<Array>} Array of question objects
 */
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

  console.log("[QUESTIONS] Available unseen questions:", available.length);
  console.log("[QUESTIONS] Seen question IDs in this category:", seenQuestionIds[categoryKey].size);

  // If we don't have enough, fetch more from AI or static bank
  if (available.length < count) {
    const needed = count - available.length;
    console.log("[QUESTIONS] ⚠️  Need", needed, "more questions, fetching from AI/bank...");

    const newQuestions = await fetchQuestionsForCategory(categoryKey, needed);
    questionCache[categoryKey].push(...newQuestions);

    // Recompute available
    available = questionCache[categoryKey].filter(q => {
      const id = q.id || q.question;
      return !seenQuestionIds[categoryKey].has(id);
    });
  }

  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // Mark selected as seen
  selected.forEach(q => {
    const id = q.id || q.question;
    seenQuestionIds[categoryKey].add(id);
  });

  console.log("[QUESTIONS] ✓ Selected", selected.length, "questions");
  console.log("[QUESTIONS] Total seen in", categoryKey + ":", seenQuestionIds[categoryKey].size);
  console.log("[QUESTIONS] First question:", selected[0]?.question.substring(0, 50) + "...");

  return selected;
}

/**
 * Fetch questions for a category from AI or fallback to static bank.
 * @param {string} categoryKey - Category key
 * @param {number} count - Number of questions needed
 * @returns {Promise<Array>} Array of question objects
 */
async function fetchQuestionsForCategory(categoryKey, count) {
  console.log("[QUESTIONS] fetchQuestionsForCategory", { categoryKey, count });

  // Try to fetch from database via get-questions endpoint
  try {
    console.log("[QUESTIONS] 🗄️ Attempting to fetch from database...");
    // Access env vars from window object (injected by HTML)
    const supabaseUrl = window.VITE_SUPABASE_URL;
    const supabaseKey = window.VITE_SUPABASE_ANON_KEY;

    console.log("[QUESTIONS] Supabase URL:", supabaseUrl ? 'FOUND' : 'MISSING');
    console.log("[QUESTIONS] Supabase Key:", supabaseKey ? 'FOUND' : 'MISSING');

    if (supabaseUrl && supabaseKey) {
      const endpoint = `${supabaseUrl}/functions/v1/get-questions`;
      console.log("[QUESTIONS] Calling database endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: categoryKey,
          difficulty: 'medium',
          count: count,
          mode: 'free_play',
        })
      });

      console.log("[QUESTIONS] Database response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[QUESTIONS] ✓ Received", data.questions?.length, "questions from database");
        console.log("[QUESTIONS] Sample question:", data.questions?.[0]?.question?.substring(0, 50));

        // Transform to our format
        const questions = (data.questions || []).map(q => ({
          id: q.id || Math.random().toString(36),
          question: q.question,
          choices: q.choices || q.answers || [],
          correctIndex: q.correctIndex ?? q.correct_index ?? 0,
          category: categoryKey
        }));

        // Hide offline banner if showing
        hideOfflineBanner();

        return questions;
      } else {
        const errorText = await response.text();
        console.warn("[QUESTIONS] ⚠️  Database endpoint failed:", response.status, errorText);
      }
    } else {
      console.log("[QUESTIONS] ℹ️  Supabase env vars not configured, using offline mode");
    }
  } catch (error) {
    console.error("[QUESTIONS] ⚠️  Failed to fetch from database:", error);
    console.error("[QUESTIONS] Error details:", error.message, error.stack);
  }

  // Fallback to static QUESTION_BANK
  console.log("[QUESTIONS] 📚 Falling back to static question bank");

  // Show offline mode banner
  showOfflineBanner();

  if (window.QUESTION_BANK && window.QUESTION_BANK[categoryKey]) {
    const pool = window.QUESTION_BANK[categoryKey];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Add unique IDs based on question content hash for consistency
    return selected.map((q, i) => {
      // Use question text as stable ID if no ID exists
      const stableId = q.id || `${categoryKey}-${q.question.substring(0, 50).replace(/\s+/g, '-')}`;
      return {
        id: stableId,
        question: q.question,
        choices: q.choices,
        correctIndex: q.correctIndex
      };
    });
  }

  console.warn("[QUESTIONS] No database connection and no static bank available");
  return [];
}

// ============================================================================
// QUESTION NORMALIZATION
// ============================================================================

/**
 * Normalize question objects to ensure consistent structure across all sources.
 * Expected output format: { question, choices, correctIndex }
 *
 * @param {Object} raw - Raw question object from any source
 * @returns {Object|null} Normalized question or null if invalid
 */
function normalizeQuestion(raw) {
  if (!raw) {
    console.warn("[NORMALIZE] Null/undefined question object");
    return null;
  }

  // 1) Already normalized (Free Play shape)
  if (raw.question && Array.isArray(raw.choices) && typeof raw.correctIndex === 'number') {
    return {
      id: raw.id,
      question: raw.question,
      choices: raw.choices,
      correctIndex: raw.correctIndex
    };
  }

  // Only log if normalization is needed
  console.log("[NORMALIZE] Processing non-standard question:", {
    hasQuestion: !!raw.question,
    hasText: !!raw.text,
    hasPrompt: !!raw.prompt,
    hasChoices: !!raw.choices,
    hasAnswers: !!raw.answers,
    hasOptions: !!raw.options,
    hasCorrectIndex: typeof raw.correctIndex === 'number'
  });

  // 2) Handle alternative property names
  const questionText =
    raw.question ||
    raw.text ||
    raw.prompt ||
    raw.questionText ||
    null;

  const choices =
    raw.choices ||
    raw.answers ||
    raw.options ||
    null;

  let correctIndex =
    typeof raw.correctIndex === 'number' ? raw.correctIndex :
    typeof raw.correctAnswerIndex === 'number' ? raw.correctAnswerIndex :
    typeof raw.answerIndex === 'number' ? raw.answerIndex :
    typeof raw.correct === 'number' ? raw.correct :
    null;

  // If correctIndex is still null but raw.correctAnswer is a string, find it in choices
  if (correctIndex === null && choices && raw.correctAnswer && typeof raw.correctAnswer === 'string') {
    const idx = choices.indexOf(raw.correctAnswer);
    if (idx >= 0) {
      correctIndex = idx;
      console.log("[NORMALIZE] Found correctIndex from correctAnswer string:", idx);
    }
  }

  // Validate
  if (!questionText || !Array.isArray(choices) || correctIndex === null) {
    console.error("[NORMALIZE] ❌ Could not normalize question:", {
      hasQuestionText: !!questionText,
      hasChoices: Array.isArray(choices),
      hasCorrectIndex: correctIndex !== null,
      raw
    });
    return null;
  }

  console.log("[NORMALIZE] ✓ Normalized successfully");
  return {
    id: raw.id,
    question: questionText,
    choices,
    correctIndex
  };
}

// ============================================================================
// KAHOOT-STYLE SCORING
// ============================================================================

/**
 * === BrainDash Kahoot-style scoring ===
 * Based on Kahoot's formula: faster answers get more points, with a streak bonus.
 *
 * @param {Object} params
 * @param {boolean} params.correct - Whether answer was correct
 * @param {number} params.responseTimeMs - Time taken to answer in milliseconds
 * @param {number} params.questionTimerSec - Total seconds allowed per question (e.g., 15)
 * @param {number} params.basePoints - Maximum base points (default 1000)
 * @param {number} params.currentStreak - Consecutive correct answers BEFORE this one
 * @returns {Object} { points, basePoints, streakBonus, newStreak }
 */
function calculateBrainDashScore({
  correct,
  responseTimeMs,
  questionTimerSec,
  basePoints = 1000,
  currentStreak
}) {
  if (!correct) {
    return {
      points: 0,
      basePoints: 0,
      streakBonus: 0,
      newStreak: 0
    };
  }

  const T = questionTimerSec;
  const t = Math.max(0, Math.min(responseTimeMs / 1000, T)); // seconds, clamped

  let basePointsEarned;

  // Kahoot gives full points if answer < 0.5 seconds
  if (t < 0.5) {
    basePointsEarned = basePoints;
  } else {
    // Kahoot-style decay: basePoints * (1 - ((t / T) / 2))
    const speedFactor = 1 - ((t / T) / 2);
    basePointsEarned = Math.round(speedFactor * basePoints);
    basePointsEarned = Math.max(0, Math.min(basePointsEarned, basePoints));
  }

  const newStreak = currentStreak + 1;

  // Kahoot-style streak bonus:
  // 2 in a row → +100, 3 → +200, ..., 6+ → +500 (cap)
  let streakBonus = 0;
  if (newStreak === 2) streakBonus = 100;
  else if (newStreak === 3) streakBonus = 200;
  else if (newStreak === 4) streakBonus = 300;
  else if (newStreak === 5) streakBonus = 400;
  else if (newStreak >= 6) streakBonus = 500;

  const points = basePointsEarned + streakBonus;

  console.log("[SCORING] BrainDash", {
    correct,
    responseTimeMs,
    responseTimeSec: (responseTimeMs / 1000).toFixed(2),
    questionTimerSec,
    currentStreak,
    newStreak,
    basePointsEarned,
    streakBonus,
    points
  });

  return {
    points,
    basePoints: basePointsEarned,
    streakBonus,
    newStreak
  };
}

// ============================================================================
// SESSION LIFECYCLE
// ============================================================================

/**
 * Initialize a new trivia game session.
 * @param {Object} opts
 * @param {"free"|"cash"|"cash-test"} opts.mode - Game mode
 * @param {string} opts.categoryKey - Category key
 * @param {Array} opts.questions - Array of question objects
 * @param {Function} opts.onComplete - Callback when game ends
 */
async function startTriviaSession(opts) {
  let { mode, categoryKey, questions, onComplete } = opts;

  console.log("[DEBUG:ENGINE-ENTRY] ========================================");
  console.log("[DEBUG:ENGINE-ENTRY] === TRIVIA ENGINE CALLED ===");
  console.log("[DEBUG:ENGINE-ENTRY] ========================================");
  console.log("[DEBUG:ENGINE-ENTRY] Mode:", mode);
  console.log("[DEBUG:ENGINE-ENTRY] Category:", categoryKey);
  console.log("[DEBUG:ENGINE-ENTRY] Questions count (raw):", questions?.length || 0);
  console.log("[DEBUG:ENGINE-ENTRY] First question (raw):", questions?.[0]);
  console.log("[DEBUG:ENGINE-ENTRY] Has onComplete callback:", typeof onComplete === 'function');
  console.log("[DEBUG:ENGINE-ENTRY] ========================================");

  console.log("[TRIVIA] === START TRIVIA SESSION ===");
  console.log("[TRIVIA] Mode:", mode);
  console.log("[TRIVIA] Category:", categoryKey);
  console.log("[TRIVIA] Questions (raw):", questions?.length || 0);

  // Clean up any existing session first
  cleanupTriviaSession();

  if (!questions || questions.length === 0) {
    console.error("[TRIVIA] No questions provided!");
    if (typeof onComplete === 'function') {
      onComplete(0, { error: 'No questions available' });
    }
    return;
  }

  // Normalize questions to ensure consistent structure across all modes
  console.log("[TRIVIA] Normalizing questions...");
  const normalizedQuestions = questions
    .map(normalizeQuestion)
    .filter(q => q !== null);

  console.log("[TRIVIA] Normalized", normalizedQuestions.length, "valid questions");
  console.log("[TRIVIA] First normalized question:", normalizedQuestions[0]);

  if (normalizedQuestions.length === 0) {
    console.error("[TRIVIA] No valid questions after normalization!");
    if (typeof onComplete === 'function') {
      onComplete(0, { error: 'No valid questions after normalization' });
    }
    return;
  }

  // Use normalized questions
  questions = normalizedQuestions;

  // Set active match flags to prevent unwanted navigation during game
  if (typeof activeMatchMode !== 'undefined') {
    activeMatchMode = mode;
    console.log("[TRIVIA] Set activeMatchMode:", mode);
  }
  if (typeof activeMatchLobbyId !== 'undefined') {
    activeMatchLobbyId = null; // Set by lobby code if needed
  }

  // Initialize session state
  activeTriviaGame = {
    mode,
    categoryKey,
    questions,
    currentIndex: 0,
    score: 0,
    streak: 0,
    correctCount: 0,
    onComplete,
    questionStartTime: null,
    maxTimePerQuestion: 8, // seconds (changed from 15)
    currentQuestionLocked: false,   // true once we've finalized a question
    awaitingScoreboard: false       // true while scoreboard is showing
  };

  // Show trivia screen
  showTriviaScreen();

  // Render first question
  renderTriviaQuestion();
}

/**
 * Fully clean up an active trivia session (timers & state).
 * Call this when a game ends OR when the player exits mid-game.
 */
function cleanupTriviaSession() {
  console.log("[TRIVIA] Cleaning up trivia session");

  if (activeQuestionTimerId) {
    clearInterval(activeQuestionTimerId);
    activeQuestionTimerId = null;
  }

  activeTriviaGame = null;
}

/**
 * Exit the current trivia session (user canceled mid-game).
 */
function exitTriviaSession() {
  console.log("[TRIVIA] User exiting trivia session");

  if (!activeTriviaGame) {
    console.log("[TRIVIA] No active session to exit");
    return;
  }

  const mode = activeTriviaGame.mode;

  cleanupTriviaSession();

  // Clear active match flags BEFORE navigation to allow exit
  if (typeof activeMatchMode !== 'undefined') {
    console.log("[TRIVIA] Clearing activeMatchMode for exit (was:", activeMatchMode, ")");
    activeMatchMode = null;
  }
  if (typeof activeMatchLobbyId !== 'undefined') {
    activeMatchLobbyId = null;
  }

  // Return to appropriate screen based on mode
  if (mode === 'free') {
    showScreen('home');
  } else if (mode === 'cash-test') {
    showScreen('cash-test-screen');
  } else if (mode === 'cash') {
    showScreen('cash-challenge-screen');
  }

  console.log("[TRIVIA] Exited to", mode, "screen");
}

// ============================================================================
// UI RENDERING
// ============================================================================

/**
 * Show the trivia screen and hide others.
 */
function showTriviaScreen() {
  console.log("[TRIVIA] === showTriviaScreen CALLED ===");

  // CRITICAL: Remove any countdown overlays that might be blocking the view
  const countdownOverlay = document.getElementById('match-countdown-overlay');
  if (countdownOverlay) {
    console.warn("[TRIVIA] ⚠️ Found countdown overlay still present! Removing...");
    countdownOverlay.remove();
  }

  const gameScreen = document.getElementById('offlineGame');
  console.log("[TRIVIA] Found #offlineGame element:", !!gameScreen);

  if (!gameScreen) {
    console.error("[TRIVIA] ❌ Trivia screen element #offlineGame not found!");
    console.error("[TRIVIA] Available elements with id:",
      Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    return;
  }

  console.log("[TRIVIA] Before show - offlineGame display:", gameScreen.style.display);
  console.log("[TRIVIA] Before show - offlineGame classList:", gameScreen.classList.toString());

  gameScreen.classList.remove('hidden');
  gameScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: var(--bg);
    z-index: 10005 !important;
    display: flex !important;
    flex-direction: column;
    overflow: hidden;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  `;

  console.log("[TRIVIA] After show - offlineGame display:", gameScreen.style.display);
  console.log("[TRIVIA] After show - offlineGame classList:", gameScreen.classList.toString());
  console.log("[TRIVIA] After show - offlineGame visibility:", gameScreen.style.visibility);

  // CRITICAL: Show the question view and hide leaderboard view
  const questionView = document.getElementById('ogQuestionView');
  const leaderboardView = document.getElementById('ogLeaderboardView');

  if (questionView) {
    questionView.style.display = 'flex';
    console.log("[TRIVIA] Showing #ogQuestionView");
  } else {
    console.error("[TRIVIA] ❌ #ogQuestionView not found!");
  }

  if (leaderboardView) {
    leaderboardView.style.display = 'none';
    console.log("[TRIVIA] Hiding #ogLeaderboardView");
  }

  // Hide main wrap
  const wrapEl = document.querySelector('.wrap');
  if (wrapEl) {
    wrapEl.style.display = 'none';
    console.log("[TRIVIA] Hidden main wrap");
  }

  // Hide other screens
  const otherScreens = document.querySelectorAll('.screen');
  console.log("[TRIVIA] Hiding", otherScreens.length, "other screens");
  otherScreens.forEach(s => {
    if (s.id !== 'offlineGame') {
      s.classList.add('hidden');
      s.style.display = 'none';
    }
  });

  // Force visibility check
  const computedStyle = window.getComputedStyle(gameScreen);
  console.log("[TRIVIA] Computed display:", computedStyle.display);
  console.log("[TRIVIA] Computed visibility:", computedStyle.visibility);
  console.log("[TRIVIA] Computed z-index:", computedStyle.zIndex);

  console.log("[TRIVIA] ✓ Trivia screen shown successfully");
}

/**
 * Render the current question to the UI.
 */
function renderTriviaQuestion() {
  if (!activeTriviaGame) {
    console.error("[TRIVIA] No active game");
    return;
  }

  const { mode, questions, currentIndex, score, streak } = activeTriviaGame;
  const q = questions[currentIndex];

  if (!q) {
    console.log("[TRIVIA] No more questions, finishing session");
    finishTriviaSession();
    return;
  }

  console.log("[RENDER] ========================================");
  console.log("[RENDER] State snapshot:");
  console.log("[RENDER] - Mode:", mode);
  console.log("[RENDER] - Current index:", currentIndex);
  console.log("[RENDER] - Total questions:", questions.length);
  console.log("[RENDER] - Question object:", q);
  console.log("[RENDER] - Has .question?", !!q.question);
  console.log("[RENDER] - Has .choices?", Array.isArray(q.choices));
  console.log("[RENDER] - Choices length:", q.choices?.length);
  console.log("[RENDER] - Has .correctIndex?", typeof q.correctIndex === 'number');
  console.log("[RENDER] ========================================");

  console.log("[DEBUG:ENGINE-RENDER] ========================================");
  console.log("[DEBUG:ENGINE-RENDER] Rendering question", currentIndex + 1, "/", questions.length);
  console.log("[DEBUG:ENGINE-RENDER] Question text:", q.question?.substring(0, 60) + "...");
  console.log("[DEBUG:ENGINE-RENDER] ========================================");

  console.log("[TRIVIA] === Rendering Question", currentIndex + 1, "/", questions.length, "===");
  console.log("[TRIVIA] Question:", q.question);

  // Get UI elements
  const questionEl = document.getElementById('ogPrompt');
  const answersEl = document.getElementById('ogChoices');
  const roundLabel = document.getElementById('ogRoundLabel');
  const categoryLabel = document.getElementById('ogCategoryLabel');
  const scoreEl = document.getElementById('ogScoreDisplay');
  const streakEl = document.getElementById('ogStreakDisplay');

  console.log("[RENDER] UI Elements check:");
  console.log("[RENDER] - #ogPrompt:", !!questionEl);
  console.log("[RENDER] - #ogChoices:", !!answersEl);
  console.log("[RENDER] - #ogRoundLabel:", !!roundLabel);
  console.log("[RENDER] - #ogCategoryLabel:", !!categoryLabel);

  if (!questionEl || !answersEl) {
    console.error("[RENDER] ❌ Missing required UI elements!");
    console.error("[RENDER] questionEl:", questionEl);
    console.error("[RENDER] answersEl:", answersEl);
    console.error("[RENDER] Available elements:",
      Array.from(document.querySelectorAll('[id]')).map(el => el.id).filter(id => id.startsWith('og')));
    return;
  }

  // Clear previous answer feedback banner
  const breakdownEl = document.getElementById('ogScoringBreakdown');
  if (breakdownEl) {
    breakdownEl.innerHTML = '';
    console.log("[RENDER] Cleared previous answer feedback");
  }

  // Update question text
  console.log("[RENDER] Setting question text:", q.question);
  questionEl.textContent = q.question;
  console.log("[RENDER] Question text set. questionEl.textContent:", questionEl.textContent);

  // Update labels - display correct question number
  const displayQuestionNum = currentIndex + 1;
  const totalQuestions = questions.length;
  if (roundLabel) {
    roundLabel.textContent = `Question ${displayQuestionNum}/${totalQuestions}`;
    console.log("[RENDER] Round label set:", roundLabel.textContent);
    console.log("[RENDER] Question index:", currentIndex, "Displaying as:", displayQuestionNum, "of", totalQuestions);
  }
  if (categoryLabel) {
    categoryLabel.textContent = activeTriviaGame.categoryKey.toUpperCase();
    console.log("[RENDER] Category label set:", categoryLabel.textContent);
  }
  if (scoreEl) {
    scoreEl.textContent = `Score: ${score}`;
  }
  if (streakEl) {
    streakEl.textContent = `Streak: ${streak} 🔥`;
  }

  // Render answer buttons
  console.log("[RENDER] Rendering", q.choices.length, "answer buttons");
  answersEl.innerHTML = '';
  q.choices.forEach((choiceText, idx) => {
    console.log("[RENDER] Creating button", idx + 1, ":", choiceText);
    const btn = document.createElement('button');
    btn.className = 'btn trivia-answer-btn';
    btn.textContent = choiceText;
    btn.style.cssText = `
      width: 100%;
      text-align: center;
      padding: 20px 24px;
      font-size: 18px;
      font-weight: 600;
      border-radius: 12px;
      background: var(--card);
      border: 2px solid var(--line);
      color: var(--txt);
      cursor: pointer;
      transition: all .2s ease;
      margin-bottom: 12px;
    `;
    btn.addEventListener('click', () => {
      onAnswerSelected(idx);
    });
    answersEl.appendChild(btn);
    console.log("[RENDER] Button", idx + 1, "appended to answersEl");
  });

  console.log("[RENDER] ✓ All", q.choices.length, "buttons rendered");
  console.log("[RENDER] answersEl.children.length:", answersEl.children.length);

  // Verify parent container is visible
  const gameScreen = document.getElementById('offlineGame');
  if (gameScreen) {
    const computedStyle = window.getComputedStyle(gameScreen);
    console.log("[RENDER] Parent #offlineGame display:", computedStyle.display);
    console.log("[RENDER] Parent #offlineGame visibility:", computedStyle.visibility);
    console.log("[RENDER] Parent #offlineGame z-index:", computedStyle.zIndex);
    console.log("[RENDER] Parent #offlineGame innerHTML length:", gameScreen.innerHTML.length);
    console.log("[RENDER] Parent #offlineGame children count:", gameScreen.children.length);

    // Check if questionEl and answersEl are actually in the DOM
    console.log("[RENDER] questionEl in DOM?", document.body.contains(questionEl));
    console.log("[RENDER] answersEl in DOM?", document.body.contains(answersEl));

    // Get bounding box to see if elements have size
    const rect = gameScreen.getBoundingClientRect();
    console.log("[RENDER] #offlineGame dimensions:", {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    });

    if (questionEl) {
      const qRect = questionEl.getBoundingClientRect();
      const qStyle = window.getComputedStyle(questionEl);
      console.log("[RENDER] questionEl dimensions:", {
        width: qRect.width,
        height: qRect.height,
        top: qRect.top,
        left: qRect.left
      });
      console.log("[RENDER] questionEl computed styles:", {
        display: qStyle.display,
        visibility: qStyle.visibility,
        fontSize: qStyle.fontSize,
        color: qStyle.color,
        textContent: questionEl.textContent.substring(0, 50)
      });

      // Check parent visibility
      const qParent = questionEl.parentElement;
      if (qParent) {
        const pRect = qParent.getBoundingClientRect();
        const pStyle = window.getComputedStyle(qParent);
        console.log("[RENDER] questionEl parent (#ogQuestionView?) dimensions:", {
          id: qParent.id,
          width: pRect.width,
          height: pRect.height,
          display: pStyle.display,
          visibility: pStyle.visibility
        });
      }
    }

    // Force visibility if hidden
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      console.warn("[RENDER] ⚠️ Parent was hidden! Re-showing...");
      showTriviaScreen();
    }
  }

  // Start timer for this question
  console.log("[RENDER] Starting question timer");
  startQuestionTimer();
  console.log("[RENDER] ✓ renderTriviaQuestion COMPLETE");
}

/**
 * Start the countdown timer for the current question.
 */
function startQuestionTimer() {
  if (!activeTriviaGame) return;

  const state = activeTriviaGame;
  const maxTime = state.maxTimePerQuestion;
  state.questionStartTime = Date.now();
  state.currentQuestionLocked = false;
  state.awaitingScoreboard = false;

  const timerBar = document.getElementById('ogTimerProgress');
  let remaining = maxTime;

  // Clear any existing timer
  if (activeQuestionTimerId) {
    clearInterval(activeQuestionTimerId);
    activeQuestionTimerId = null;
  }

  // Set initial timer display
  if (timerBar) {
    timerBar.style.width = '100%';
    timerBar.style.transition = 'none';
    // Force reflow
    timerBar.offsetHeight;
    timerBar.style.transition = `width ${maxTime}s linear`;
    timerBar.style.width = '0%';
  }

  // Update every 100ms for smooth countdown
  activeQuestionTimerId = setInterval(() => {
    const elapsed = (Date.now() - state.questionStartTime) / 1000;
    remaining = Math.max(0, maxTime - elapsed);

    if (remaining <= 0) {
      clearInterval(activeQuestionTimerId);
      activeQuestionTimerId = null;
      console.log("[TRIVIA] Time's up!");
      onQuestionTimerExpired();
    }
  }, 100);

  console.log("[TRIVIA] Timer started for", maxTime, "seconds");
}

/**
 * Called when question timer expires (hits 0).
 */
function onQuestionTimerExpired() {
  if (!activeTriviaGame) return;

  const state = activeTriviaGame;

  if (state.currentQuestionLocked) {
    // Already processed the answer; just show scoreboard and advance
    console.log("[TRIVIA] Timer expired, answer already processed, showing scoreboard...");
    showPerQuestionScoreboardAndAdvance();
    return;
  }

  // Timer expired without an answer; treat as incorrect
  console.log("[TRIVIA] Timer expired with no answer, processing as incorrect...");
  onAnswerSelected(null, { fromTimer: true });
}

/**
 * Handle user's answer selection.
 * @param {number|null} selectedIndex - Index of selected choice, or null for timeout
 * @param {Object} opts - Options like {fromTimer: true}
 */
function onAnswerSelected(selectedIndex, opts = {}) {
  if (!activeTriviaGame) {
    console.error("[TRIVIA] No active game");
    return;
  }

  const state = activeTriviaGame;
  const { questions, currentIndex, maxTimePerQuestion } = state;

  if (state.currentQuestionLocked) {
    console.log("[TRIVIA] Question already locked, ignoring duplicate answer");
    return;
  }

  const q = questions[currentIndex];
  if (!q) {
    console.error("[TRIVIA] No question at index", currentIndex);
    return;
  }

  // Calculate response time in milliseconds
  const now = Date.now();
  const responseTimeMs = state.questionStartTime
    ? (now - state.questionStartTime)
    : maxTimePerQuestion * 1000;

  // Check if correct
  const correct = (selectedIndex !== null && selectedIndex === q.correctIndex);

  console.log("[TRIVIA] === Answer Selected ===");
  console.log("[TRIVIA] Selected:", selectedIndex, "Correct:", q.correctIndex);
  console.log("[TRIVIA] Is correct:", correct);
  console.log("[TRIVIA] Response time:", (responseTimeMs / 1000).toFixed(2), "s");

  // Calculate points using BrainDash Kahoot-style scoring
  const { points, basePoints, streakBonus, newStreak } = calculateBrainDashScore({
    correct,
    responseTimeMs,
    questionTimerSec: maxTimePerQuestion,
    basePoints: 1000,
    currentStreak: state.streak
  });

  // Update streak and score
  state.streak = newStreak;
  if (correct) {
    state.correctCount += 1;
  }
  state.score += points;

  // Lock this question so we don't double-score
  state.currentQuestionLocked = true;

  console.log("[TRIVIA] Points earned:", points);
  console.log("[TRIVIA] New total score:", state.score);
  console.log("[TRIVIA] New streak:", state.streak);

  // Show answer feedback with scoring breakdown
  showAnswerFeedback(correct, points, basePoints, streakBonus, q.correctIndex);

  // Update score display immediately
  const scoreDisplay = document.getElementById('ogScoreDisplay');
  const streakDisplay = document.getElementById('ogStreakDisplay');
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${state.score}`;
  if (streakDisplay) streakDisplay.textContent = `Streak: ${state.streak} 🔥`;

  // If this was triggered by timer expiration, show scoreboard now
  // Otherwise, timer will handle it when it expires
  if (opts.fromTimer) {
    showPerQuestionScoreboardAndAdvance();
  }
}

/**
 * Show feedback after answering a question with scoring breakdown.
 */
function showAnswerFeedback(correct, points, basePoints, streakBonus, correctIndex) {
  console.log("[TRIVIA] Showing feedback:", correct ? "✓ CORRECT" : "✗ WRONG", "Points:", points);

  // Highlight correct answer and disable buttons
  const answersEl = document.getElementById('ogChoices');
  if (answersEl) {
    const buttons = answersEl.querySelectorAll('button');
    buttons.forEach((btn, index) => {
      btn.disabled = true;
      btn.style.cursor = 'not-allowed';

      if (index === correctIndex) {
        btn.style.background = 'rgba(57, 255, 136, 0.3)';
        btn.style.borderColor = 'var(--accent)';
        btn.style.borderWidth = '3px';
      }
    });
  }

  // Show scoring breakdown
  const breakdownEl = document.getElementById('ogScoringBreakdown');
  if (breakdownEl) {
    if (correct) {
      breakdownEl.innerHTML = `
        <div style="background: rgba(57, 255, 136, 0.08); border: 1px solid var(--accent); border-radius: 8px; padding: 10px; margin: 12px 0;">
          <div style="font-size: 1rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">
            ✓ CORRECT! +${points} pts
          </div>
          <div style="font-size: 0.8rem; color: var(--muted);">
            Base: ${basePoints} | Streak: ${streakBonus}
          </div>
        </div>
      `;
    } else {
      breakdownEl.innerHTML = `
        <div style="background: rgba(255, 87, 87, 0.08); border: 1px solid #ff5757; border-radius: 8px; padding: 10px; margin: 12px 0;">
          <div style="font-size: 1rem; font-weight: 700; color: #ff5757; margin-bottom: 4px;">
            ✗ INCORRECT - 0 pts
          </div>
          <div style="font-size: 0.8rem; color: var(--muted);">
            Streak reset
          </div>
        </div>
      `;
    }
  }

  // Update score and streak displays
  const scoreEl = document.getElementById('ogScoreDisplay');
  const streakEl = document.getElementById('ogStreakDisplay');
  if (scoreEl) {
    scoreEl.textContent = `Score: ${activeTriviaGame.score}`;
  }
  if (streakEl) {
    streakEl.textContent = `Streak: ${activeTriviaGame.streak} 🔥`;
  }
}

/**
 * Show a 2-second scoreboard between questions, then advance.
 */
function showPerQuestionScoreboardAndAdvance() {
  if (!activeTriviaGame || activeTriviaGame.awaitingScoreboard) {
    console.log("[SCOREBOARD] Already awaiting scoreboard or no active game");
    return;
  }

  const state = activeTriviaGame;
  state.awaitingScoreboard = true;

  const { currentIndex, questions, score, lobby } = state;
  const questionNumber = currentIndex + 1;
  const totalQuestions = questions.length;
  const isLastQuestion = questionNumber === totalQuestions;

  console.log(`[SCOREBOARD] Showing scoreboard for question ${questionNumber}/${totalQuestions}`);
  console.log('[SCOREBOARD] Lobby data:', lobby);
  console.log('[SCOREBOARD] Lobby participants:', lobby?.participants);
  console.log('[SCOREBOARD] Participants count:', lobby?.participants?.length);
  console.log('[SCOREBOARD] Is last question:', isLastQuestion);

  // Hide question view, show scoreboard
  const questionView = document.getElementById('ogQuestionView');
  const leaderboardView = document.getElementById('ogLeaderboardView');

  if (questionView) questionView.style.display = 'none';
  if (leaderboardView) {
    leaderboardView.style.display = 'flex';

    // Update leaderboard content with per-question results
    const leaderboardEl = document.getElementById('ogLeaderboard');
    if (leaderboardEl) {
      // Build multiplayer leaderboard if lobby exists
      let leaderboardHTML = '';

      if (lobby && lobby.participants && lobby.participants.length > 0) {
        console.log('[SCOREBOARD] Building multiplayer leaderboard with', lobby.participants.length, 'players');
        console.log('[SCOREBOARD] Participants:', lobby.participants);

        // Simulate bot scores for this question
        const players = lobby.participants.map(p => {
          if (p.isBot) {
            // Bots get random scores around the user's score
            const variance = Math.floor(Math.random() * 1000) - 500;
            const botScore = Math.max(0, score + variance);
            console.log('[SCOREBOARD] Bot player:', p.username, 'Score:', botScore);
            return { username: p.username, score: botScore, isBot: true, isUser: false };
          } else {
            console.log('[SCOREBOARD] Real player:', p.username, 'Score:', score);
            return { username: p.username, score: score, isBot: false, isUser: true };
          }
        });

        // Sort by score descending
        players.sort((a, b) => b.score - a.score);
        console.log('[SCOREBOARD] Sorted players:', players);

        // Add countdown timer element at the top
        leaderboardHTML = `
          <div style="padding: 24px 20px; max-width: 500px; margin: 0 auto;">
            <div style="font-size: 1.5rem; font-weight: 900; color: var(--accent2); margin-bottom: 12px; text-align: center;">
              Question ${questionNumber}/${totalQuestions} Complete
            </div>
            ${!isLastQuestion ? '<div id="scoreboard-countdown" style="font-size: 1.2rem; font-weight: 700; color: var(--accent); margin-bottom: 20px; text-align: center;">Next question in <span id="countdown-seconds">4</span>s</div>' : '<div style="font-size: 1rem; color: var(--muted); margin-bottom: 20px; text-align: center;">Final Results</div>'}
            <div style="background: var(--card); border-radius: 12px; padding: 16px; border: 1px solid var(--line);">
              ${players.map((p, idx) => {
                const isUser = p.isUser;
                const bgColor = isUser ? 'rgba(57, 255, 136, 0.1)' : 'transparent';
                const borderColor = isUser ? 'var(--accent)' : 'transparent';
                const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';

                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; margin-bottom: 8px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <span style="font-size: 1.2rem; font-weight: 900; color: var(--muted); min-width: 24px;">${emoji || (idx + 1)}</span>
                      <span style="font-size: 1rem; font-weight: ${isUser ? '700' : '600'}; color: var(--txt);">${p.username}</span>
                    </div>
                    <span style="font-size: 1.1rem; font-weight: 700; color: ${isUser ? 'var(--accent)' : 'var(--txt)'}">${Math.round(p.score)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      } else {
        console.log('[SCOREBOARD] No lobby data or single player mode');
        // Single player mode
        leaderboardHTML = `
          <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 2rem; font-weight: 900; color: var(--accent2); margin-bottom: 16px;">
              Question ${questionNumber}/${totalQuestions}
            </div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--txt); margin-bottom: 8px;">
              Your Score: ${score}
            </div>
            ${!isLastQuestion ? '<div id="scoreboard-countdown" style="font-size: 1rem; color: var(--muted);">Next question in <span id="countdown-seconds">4</span>s</div>' : '<div style="font-size: 1rem; color: var(--muted);">Game Complete!</div>'}
          </div>
        `;
      }

      leaderboardEl.innerHTML = leaderboardHTML;
      console.log('[SCOREBOARD] Leaderboard HTML set, length:', leaderboardHTML.length);

      // Start countdown timer if not last question
      if (!isLastQuestion) {
        let secondsLeft = 4;
        const countdownEl = document.getElementById('countdown-seconds');
        const countdownInterval = setInterval(() => {
          secondsLeft--;
          if (countdownEl && secondsLeft > 0) {
            countdownEl.textContent = secondsLeft;
          } else {
            clearInterval(countdownInterval);
          }
        }, 1000);
      }
    }
  }

  // If this is the last question, finish immediately after showing scores
  if (isLastQuestion) {
    setTimeout(() => {
      console.log("[SCOREBOARD] Last question completed, finishing session...");
      finishTriviaSession();
    }, 4000);
  } else {
    // Wait 4 seconds, then advance to next question
    setTimeout(() => {
      console.log("[SCOREBOARD] Advancing to next question...");

      // Hide scoreboard, show question view
      if (leaderboardView) leaderboardView.style.display = 'none';
      if (questionView) questionView.style.display = 'flex';

      // Advance index and reset flags
      state.currentIndex += 1;
      state.currentQuestionLocked = false;
      state.awaitingScoreboard = false;

      // Render next question
      renderTriviaQuestion();
    }, 4000);
  }
}

/**
 * Finish the trivia session and show results.
 */
function finishTriviaSession() {
  if (!activeTriviaGame) {
    console.error("[TRIVIA] No active session to finish");
    return;
  }

  const state = activeTriviaGame;
  const { mode, categoryKey, score, correctCount, questions, onComplete } = state;

  console.log("[TRIVIA] === SESSION FINISHED ===");
  console.log("[TRIVIA] Mode:", mode);
  console.log("[TRIVIA] Category:", categoryKey);
  console.log("[TRIVIA] Final score:", score);
  console.log("[TRIVIA] Correct:", correctCount, "/", questions.length);

  const details = {
    mode,
    categoryKey,
    score,
    correctCount,
    correctAnswers: correctCount, // Alias for compatibility
    totalQuestions: questions.length
  };

  // Clean up session
  cleanupTriviaSession();

  // Clear active match flags to allow navigation again
  if (typeof activeMatchMode !== 'undefined') {
    console.log("[TRIVIA] Clearing activeMatchMode (was:", activeMatchMode, ")");
    activeMatchMode = null;
  }
  if (typeof activeMatchLobbyId !== 'undefined') {
    activeMatchLobbyId = null;
  }

  // Call completion callback
  if (typeof onComplete === 'function') {
    onComplete(score, details);
  }
}

// ============================================================================
// OFFLINE MODE BANNER
// ============================================================================

/**
 * Show a visible warning banner when using offline fallback questions.
 */
function showOfflineBanner() {
  // Check if banner already exists
  let banner = document.getElementById('offline-mode-banner');
  if (banner) {
    banner.style.display = 'block';
    return;
  }

  // Create banner
  banner = document.createElement('div');
  banner.id = 'offline-mode-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white;
    padding: 12px 20px;
    text-align: center;
    font-weight: 700;
    font-size: 0.9rem;
    z-index: 100000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  `;
  banner.innerHTML = `
    <span style="font-size: 1.2rem;">⚠️</span>
    <span>OFFLINE MODE: Using fallback questions (limited variety)</span>
  `;

  document.body.appendChild(banner);
  console.log('[OFFLINE-BANNER] Offline mode banner displayed');
}

/**
 * Hide the offline mode banner.
 */
function hideOfflineBanner() {
  const banner = document.getElementById('offline-mode-banner');
  if (banner) {
    banner.style.display = 'none';
    console.log('[OFFLINE-BANNER] Offline mode banner hidden');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

window.getQuestionsForSession = getQuestionsForSession;
window.startTriviaSession = startTriviaSession;
window.cleanupTriviaSession = cleanupTriviaSession;
window.exitTriviaSession = exitTriviaSession;
window.calculateBrainDashScore = calculateBrainDashScore;
window.showOfflineBanner = showOfflineBanner;
window.hideOfflineBanner = hideOfflineBanner;

// Also keep legacy names for compatibility
window.startTriviaEngine = startTriviaSession;
window.calculateKahootStyleScore = calculateBrainDashScore;

console.log('[Trivia Engine] ✓ Unified trivia engine loaded successfully');
console.log('[Trivia Engine] Available functions:', [
  'getQuestionsForSession',
  'startTriviaSession',
  'cleanupTriviaSession',
  'exitTriviaSession',
  'calculateBrainDashScore'
]);
