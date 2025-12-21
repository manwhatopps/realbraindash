/**
 * === UNIFIED TRIVIA ENGINE ===
 *
 * Single trivia engine used by ALL modes:
 * - Free Play
 * - Cash Challenge
 * - Test Cash Challenge
 *
 * Features:
 * - Category-based questions from QUESTION_BANK
 * - Kahoot-style scoring (speed + streak bonuses)
 * - Consistent UI and timing across all modes
 */

console.log('[Trivia Engine] Loading unified trivia engine...');

// Global state for current game session
let currentSession = null;

/**
 * Calculates Kahoot-style score for a single question.
 *
 * @param {Object} params
 * @param {boolean} params.correct - whether answer was correct
 * @param {number} params.timeRemaining - seconds remaining when answered
 * @param {number} params.maxTime - total seconds allowed per question
 * @param {number} params.currentStreak - consecutive correct answers BEFORE this one
 * @returns {number} Points earned (0 if incorrect)
 */
function calculateKahootStyleScore({ correct, timeRemaining, maxTime, currentStreak }) {
  if (!correct) return 0;

  const MAX_POINTS = 1000;
  const clampedTime = Math.max(0, Math.min(timeRemaining, maxTime));
  const speedFactor = maxTime > 0 ? clampedTime / maxTime : 0;

  const basePoints = Math.round(MAX_POINTS * speedFactor);
  const streakBonus = Math.min(currentStreak * 100, 500);

  const total = basePoints + streakBonus;

  console.log("[SCORING]", {
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

/**
 * Starts a trivia game with a pre-selected question set.
 *
 * @param {Object} opts
 * @param {"free"|"cash"|"cash-test"} opts.mode - game mode
 * @param {string} opts.categoryKey - internal category key (e.g., "sports")
 * @param {Array} opts.questions - array of {question, choices, correctIndex}
 * @param {function(score: number, details: object): void} opts.onComplete - callback when game ends
 */
function startTriviaEngine(opts) {
  const { mode, categoryKey, questions, onComplete } = opts;

  console.log("[ENGINE] === START TRIVIA ENGINE ===");
  console.log("[ENGINE] Mode:", mode);
  console.log("[ENGINE] Category:", categoryKey);
  console.log("[ENGINE] Questions:", questions.length);

  if (!questions || questions.length === 0) {
    console.error("[ENGINE] No questions provided!");
    if (typeof onComplete === 'function') {
      onComplete(0, { error: 'No questions available' });
    }
    return;
  }

  // Initialize session state
  currentSession = {
    mode,
    categoryKey,
    questions,
    currentQuestionIndex: 0,
    currentScore: 0,
    currentStreak: 0,
    correctCount: 0,
    maxTimePerQuestion: 15, // seconds
    startTime: Date.now(),
    questionStartTime: null,
    onComplete
  };

  // Show trivia screen (reuse existing offline wizard UI)
  if (typeof window.showOfflineGameScreen === 'function') {
    window.showOfflineGameScreen();
  }

  // Start first question
  renderQuestion();
}

/**
 * Renders the current question to the UI
 */
function renderQuestion() {
  if (!currentSession) {
    console.error("[ENGINE] No active session");
    return;
  }

  const { questions, currentQuestionIndex, currentScore } = currentSession;
  const question = questions[currentQuestionIndex];

  if (!question) {
    console.log("[ENGINE] No more questions, finishing game");
    finishGame();
    return;
  }

  console.log("[ENGINE] === Rendering Question", currentQuestionIndex + 1, "/", questions.length, "===");
  console.log("[ENGINE] Question:", question.question);
  console.log("[ENGINE] Current score:", currentScore);
  console.log("[ENGINE] Current streak:", currentSession.currentStreak);

  // Store question start time for scoring
  currentSession.questionStartTime = Date.now();

  // Use existing offline game UI elements
  const promptEl = document.getElementById('ogPrompt');
  const choicesEl = document.getElementById('ogChoices');
  const roundLabel = document.getElementById('ogRoundLabel');
  const categoryLabel = document.getElementById('ogCategoryLabel');

  if (promptEl) {
    promptEl.textContent = question.question;
  }

  if (roundLabel) {
    roundLabel.textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;
  }

  if (categoryLabel) {
    categoryLabel.textContent = currentSession.categoryKey.toUpperCase();
  }

  if (choicesEl) {
    choicesEl.innerHTML = '';

    question.choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = choice;
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
      `;

      btn.onclick = () => handleAnswer(index);
      choicesEl.appendChild(btn);
    });
  }

  // Start timer
  startQuestionTimer();
}

/**
 * Starts the timer for the current question
 */
function startQuestionTimer() {
  if (!currentSession) return;

  const timerBar = document.getElementById('ogTimerProgress');
  const maxTime = currentSession.maxTimePerQuestion * 1000; // convert to ms
  const startTime = currentSession.questionStartTime;

  const timerInterval = setInterval(() => {
    if (!currentSession || currentSession.questionStartTime !== startTime) {
      clearInterval(timerInterval);
      return;
    }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, maxTime - elapsed);
    const percent = (remaining / maxTime) * 100;

    if (timerBar) {
      timerBar.style.width = `${percent}%`;
    }

    if (remaining === 0) {
      clearInterval(timerInterval);
      console.log("[ENGINE] Time's up!");
      handleAnswer(-1); // -1 indicates timeout (wrong answer)
    }
  }, 100);

  // Store interval so we can clear it on answer
  currentSession.timerInterval = timerInterval;
}

/**
 * Handles user's answer selection
 * @param {number} selectedIndex - index of selected choice, or -1 for timeout
 */
function handleAnswer(selectedIndex) {
  if (!currentSession) {
    console.error("[ENGINE] No active session");
    return;
  }

  // Clear timer
  if (currentSession.timerInterval) {
    clearInterval(currentSession.timerInterval);
    currentSession.timerInterval = null;
  }

  const { questions, currentQuestionIndex, currentStreak, maxTimePerQuestion, questionStartTime } = currentSession;
  const question = questions[currentQuestionIndex];

  // Calculate time remaining
  const elapsed = (Date.now() - questionStartTime) / 1000; // seconds
  const timeRemaining = Math.max(0, maxTimePerQuestion - elapsed);

  // Check if correct
  const correct = (selectedIndex === question.correctIndex);

  console.log("[ENGINE] === Answer Selected ===");
  console.log("[ENGINE] Selected:", selectedIndex, "Correct:", question.correctIndex);
  console.log("[ENGINE] Is correct:", correct);
  console.log("[ENGINE] Time remaining:", timeRemaining.toFixed(2), "s");

  // Update streak
  if (correct) {
    currentSession.correctCount += 1;
    currentSession.currentStreak += 1;
  } else {
    currentSession.currentStreak = 0;
  }

  // Calculate points for this question
  const questionPoints = calculateKahootStyleScore({
    correct,
    timeRemaining,
    maxTime: maxTimePerQuestion,
    currentStreak // Use streak BEFORE this question
  });

  currentSession.currentScore += questionPoints;

  console.log("[ENGINE] Points earned:", questionPoints);
  console.log("[ENGINE] New score:", currentSession.currentScore);
  console.log("[ENGINE] New streak:", currentSession.currentStreak);

  // Optional: show feedback UI
  showAnswerFeedback(correct, questionPoints);

  // Move to next question after brief delay
  setTimeout(() => {
    currentSession.currentQuestionIndex += 1;
    renderQuestion();
  }, 1500);
}

/**
 * Shows feedback after answering a question
 */
function showAnswerFeedback(correct, points) {
  // You can enhance this with more visual feedback
  console.log("[ENGINE] Feedback:", correct ? "✓ CORRECT" : "✗ WRONG", "| Points:", points);

  // Optional: highlight the correct answer in the UI
  const choicesEl = document.getElementById('ogChoices');
  if (choicesEl) {
    const buttons = choicesEl.querySelectorAll('button');
    buttons.forEach((btn, index) => {
      btn.disabled = true;
      if (index === currentSession.questions[currentSession.currentQuestionIndex].correctIndex) {
        btn.style.background = 'rgba(57, 255, 136, 0.3)';
        btn.style.borderColor = 'var(--accent)';
      }
    });
  }
}

/**
 * Finishes the game and calls the completion callback
 */
function finishGame() {
  if (!currentSession) {
    console.error("[ENGINE] No active session to finish");
    return;
  }

  const { mode, categoryKey, currentScore, correctCount, questions, onComplete } = currentSession;

  console.log("[ENGINE] === GAME FINISHED ===");
  console.log("[ENGINE] Mode:", mode);
  console.log("[ENGINE] Category:", categoryKey);
  console.log("[ENGINE] Final score:", currentScore);
  console.log("[ENGINE] Correct:", correctCount, "/", questions.length);

  const details = {
    mode,
    categoryKey,
    totalQuestions: questions.length,
    correctCount,
    correctAnswers: correctCount, // alias for compatibility
    score: currentScore
  };

  // Call completion callback
  if (typeof onComplete === 'function') {
    onComplete(currentScore, details);
  }

  // Clear session
  currentSession = null;
}

// Export to window for global access
window.calculateKahootStyleScore = calculateKahootStyleScore;
window.startTriviaEngine = startTriviaEngine;

// Helper to show offline game screen
window.showOfflineGameScreen = function() {
  const gameScreen = document.getElementById('offlineGame');
  if (gameScreen) {
    gameScreen.classList.remove('hidden');
    gameScreen.style.display = 'flex';

    // Hide main wrap
    const wrapEl = document.querySelector('.wrap');
    if (wrapEl) wrapEl.style.display = 'none';

    // Hide other screens
    document.querySelectorAll('.screen').forEach(s => {
      if (s.id !== 'offlineGame') {
        s.classList.add('hidden');
        s.style.display = 'none';
      }
    });
  }
};

console.log('[Trivia Engine] ✓ Unified trivia engine loaded successfully');
