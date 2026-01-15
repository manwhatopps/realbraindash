/**
 * FREE PLAY STABILITY LAYER
 *
 * Ensures Free Play never crashes and handles all edge cases gracefully.
 * This wraps the trivia engine and offline wizard with safety mechanisms.
 */

console.log('[Free Play Stability] Loading stability layer...');

// Global error boundary for Free Play
let freePlayActive = false;
let freePlayRecoveryMode = false;

/**
 * Wrap a function with error handling that prevents crashes
 */
function safeExecute(fn, context = 'Free Play') {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[${context}] Error caught:`, error);
      handleFreePlayError(error, context);
      return null;
    }
  };
}

/**
 * Handle Free Play errors gracefully
 */
function handleFreePlayError(error, context) {
  console.error('[Free Play Stability] Error:', context, error);

  // Show user-friendly error message
  showFreePlayError(error, context);

  // If in recovery mode, force return to home
  if (freePlayRecoveryMode) {
    console.warn('[Free Play Stability] Recovery mode active, forcing home');
    forceReturnHome();
    return;
  }

  // Enter recovery mode on first error
  freePlayRecoveryMode = true;
  setTimeout(() => {
    freePlayRecoveryMode = false;
  }, 5000);
}

/**
 * Show user-friendly error message
 */
function showFreePlayError(error, context) {
  const errorMessages = {
    'No questions available': 'Unable to load questions. Please try a different category or check your connection.',
    'Network request failed': 'Connection issue detected. Using offline questions.',
    'Session expired': 'Your session expired. Please refresh and try again.',
    'default': 'Something went wrong. Returning to home...'
  };

  let message = errorMessages.default;

  if (error && error.message) {
    for (const [key, msg] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        message = msg;
        break;
      }
    }
  }

  // Show toast notification
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.background = '#ff6b6b';
    toast.style.color = '#fff';
    setTimeout(() => {
      toast.style.display = 'none';
      toast.style.background = '';
      toast.style.color = '';
    }, 4000);
  }

  console.log('[Free Play Stability] Showed error to user:', message);
}

/**
 * Force return to home screen with full cleanup
 */
function forceReturnHome() {
  console.log('[Free Play Stability] Forcing return to home...');

  try {
    // Clean up trivia session
    if (typeof window.cleanupTriviaSession === 'function') {
      window.cleanupTriviaSession();
    }

    // Hide game screen
    const gameScreen = document.getElementById('offlineGame');
    if (gameScreen) {
      gameScreen.classList.add('hidden');
      gameScreen.style.display = 'none';
    }

    // Hide all wizard sheets
    const sheets = ['offlineStepBots', 'offlineStepRounds', 'offlineStepDifficulty', 'offlineStepCategories', 'freeSheet'];
    sheets.forEach(id => {
      const sheet = document.getElementById(id);
      if (sheet) {
        sheet.style.display = 'none';
        sheet.setAttribute('aria-hidden', 'true');
      }
    });

    // Show homepage
    const wrap = document.querySelector('.wrap');
    if (wrap) {
      wrap.style.display = 'flex';
    }

    // Reset body overflow
    document.body.style.overflow = '';

    // Clear active flags
    freePlayActive = false;

    console.log('[Free Play Stability] Successfully returned to home');
  } catch (error) {
    console.error('[Free Play Stability] Error during force home:', error);
    // Last resort: reload page
    window.location.href = '/';
  }
}

/**
 * Safe wrapper for question fetching
 */
async function safeGetQuestions(categoryKey, count) {
  try {
    console.log('[Free Play Stability] Fetching questions:', categoryKey, count);

    // Use the trivia engine's question fetcher
    if (typeof window.getQuestionsForSession === 'function') {
      const questions = await window.getQuestionsForSession(categoryKey, count);

      if (!questions || questions.length === 0) {
        throw new Error('No questions available for this category');
      }

      console.log('[Free Play Stability] Successfully fetched', questions.length, 'questions');
      return questions;
    } else {
      throw new Error('Question loader not available');
    }
  } catch (error) {
    console.error('[Free Play Stability] Question fetch failed:', error);

    // Try fallback to QUESTION_BANK
    if (window.QUESTION_BANK && window.QUESTION_BANK[categoryKey]) {
      console.log('[Free Play Stability] Using fallback question bank');
      const pool = window.QUESTION_BANK[categoryKey];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    // Last resort: return empty and let caller handle
    throw new Error('Unable to load questions from any source');
  }
}

/**
 * Monitor Free Play session health
 */
function monitorFreePlayHealth() {
  setInterval(() => {
    if (!freePlayActive) return;

    // Check if game screen exists
    const gameScreen = document.getElementById('offlineGame');
    if (!gameScreen) {
      console.warn('[Free Play Stability] Game screen missing during active session');
      freePlayActive = false;
      return;
    }

    // Check if game is visible but frozen
    const questionEl = document.getElementById('ogPrompt');
    if (questionEl && gameScreen.style.display !== 'none') {
      const hasContent = questionEl.textContent && questionEl.textContent.trim().length > 0;
      if (!hasContent) {
        console.warn('[Free Play Stability] Game screen visible but no question content');
      }
    }
  }, 5000);
}

/**
 * Add safety mechanisms to trivia engine
 */
function wrapTriviaEngine() {
  // Wrap startTriviaSession with safety
  if (window.startTriviaSession) {
    const originalStart = window.startTriviaSession;
    window.startTriviaSession = safeExecute(async function(opts) {
      freePlayActive = true;
      console.log('[Free Play Stability] Starting trivia session with safety wrapper');

      // Validate inputs
      if (!opts || !opts.questions || opts.questions.length === 0) {
        throw new Error('No questions provided to trivia session');
      }

      try {
        return await originalStart.call(this, opts);
      } finally {
        freePlayActive = false;
      }
    }, 'Trivia Engine');
  }

  // Wrap cleanupTriviaSession with safety
  if (window.cleanupTriviaSession) {
    const originalCleanup = window.cleanupTriviaSession;
    window.cleanupTriviaSession = function() {
      try {
        originalCleanup.call(this);
        freePlayActive = false;
      } catch (error) {
        console.error('[Free Play Stability] Cleanup error:', error);
        freePlayActive = false;
      }
    };
  }

  // Wrap exitTriviaSession with safety
  if (window.exitTriviaSession) {
    const originalExit = window.exitTriviaSession;
    window.exitTriviaSession = function() {
      try {
        originalExit.call(this);
        freePlayActive = false;
      } catch (error) {
        console.error('[Free Play Stability] Exit error:', error);
        forceReturnHome();
      }
    };
  }
}

/**
 * Add safety to offline wizard
 */
function wrapOfflineWizard() {
  // Intercept wizard start
  if (window.startOfflineWizard) {
    const originalWizardStart = window.startOfflineWizard;
    window.startOfflineWizard = safeExecute(function() {
      console.log('[Free Play Stability] Starting offline wizard with safety');
      return originalWizardStart.call(this);
    }, 'Offline Wizard');
  }

  // Intercept match start
  if (window.startOfflineMatch) {
    const originalMatchStart = window.startOfflineMatch;
    window.startOfflineMatch = safeExecute(async function(cfg, onComplete) {
      console.log('[Free Play Stability] Starting offline match with safety');
      freePlayActive = true;

      try {
        return await originalMatchStart.call(this, cfg, onComplete);
      } finally {
        freePlayActive = false;
      }
    }, 'Offline Match');
  }
}

/**
 * Global error handler for uncaught errors
 */
function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    if (!freePlayActive) return;

    console.error('[Free Play Stability] Uncaught error during Free Play:', event.error);
    event.preventDefault();

    handleFreePlayError(event.error, 'Uncaught Error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!freePlayActive) return;

    console.error('[Free Play Stability] Unhandled promise rejection during Free Play:', event.reason);
    event.preventDefault();

    handleFreePlayError(event.reason, 'Promise Rejection');
  });
}

/**
 * Initialize stability layer
 */
function initFreePlayStability() {
  console.log('[Free Play Stability] Initializing...');

  // Wrap critical functions with error handling
  wrapTriviaEngine();
  wrapOfflineWizard();

  // Set up monitoring
  monitorFreePlayHealth();

  // Set up global error handlers
  setupGlobalErrorHandler();

  // Export safe question fetcher
  window.safeGetQuestions = safeGetQuestions;
  window.forceReturnHome = forceReturnHome;

  console.log('[Free Play Stability] ✓ Stability layer active');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFreePlayStability);
} else {
  // Wait for trivia engine to load first
  setTimeout(initFreePlayStability, 100);
}

// Export for testing
window.FreePlayStability = {
  forceReturnHome,
  handleFreePlayError,
  safeGetQuestions
};
