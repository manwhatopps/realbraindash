/**
 * === UNIFIED QUESTION FETCHER ===
 *
 * Centralized question fetching logic for all game modes.
 * Priority: Database -> Offline Fallback
 */

/**
 * Get questions for a session from unified database-backed API.
 * @param {string} categoryKey - Category like "sports", "movies", etc.
 * @param {number} count - Number of questions needed
 * @param {Object} opts - Additional options
 * @param {string} opts.mode - Game mode ('free', 'cash', 'cash-test')
 * @param {string} opts.matchId - Match ID for cash games
 * @returns {Promise<Array>} Array of question objects
 */
export async function fetchQuestionsUnified(categoryKey, count, opts = {}) {
  console.log("[FETCH] === fetchQuestionsUnified ===");
  console.log("[FETCH] Category:", categoryKey, "Count:", count);
  console.log("[FETCH] Mode:", opts.mode || 'free');

  try {
    // Get session ID for tracking
    const sessionId = window.sessionStorage.getItem('braindash_session_id') ||
                     `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    window.sessionStorage.setItem('braindash_session_id', sessionId);

    // Get user ID if logged in
    let userId = null;
    try {
      const supabaseUrl = window.VITE_SUPABASE_URL;
      const supabaseKey = window.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      }
    } catch (authError) {
      console.log("[FETCH] Not authenticated, using session tracking only");
    }

    // Call unified get-questions edge function
    const supabaseUrl = window.VITE_SUPABASE_URL;
    const supabaseKey = window.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("[FETCH] Supabase not configured, falling back to offline");
      return await getOfflineFallback(categoryKey, count);
    }

    const endpoint = `${supabaseUrl}/functions/v1/get-questions`;
    console.log("[FETCH] Calling unified API:", endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: categoryKey,
        difficulty: 'medium', // TODO: Make configurable
        count: count,
        mode: opts.mode || 'free',
        matchId: opts.matchId || null,
        userId: userId,
        sessionId: sessionId
      })
    });

    console.log("[FETCH] API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[FETCH] API error:", errorData);

      // If needs generation, fallback to offline
      if (errorData.needs_generation) {
        console.warn("[FETCH] Database empty, using offline fallback");
        return await getOfflineFallback(categoryKey, count);
      }

      throw new Error(errorData.error || 'Failed to fetch questions');
    }

    const data = await response.json();
    console.log("[FETCH] ✓ Received", data.questions?.length, "questions from DB");

    if (!data.questions || data.questions.length === 0) {
      console.warn("[FETCH] No questions returned, falling back to offline");
      return await getOfflineFallback(categoryKey, count);
    }

    // Normalize format to engine's expected format
    const normalized = data.questions.map(q => ({
      id: q.id,
      question: q.question,
      choices: Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices),
      correctIndex: q.correctIndex,
      category: q.category,
      explanation: q.explanation
    }));

    console.log("[FETCH] First question:", normalized[0]?.question.substring(0, 50) + "...");
    return normalized;

  } catch (error) {
    console.error("[FETCH] ⚠️ Failed to fetch from unified API:", error);
    console.error("[FETCH] Error details:", error.message);
    console.warn("[FETCH] Falling back to offline questions");

    // Fallback to offline questions
    return await getOfflineFallback(categoryKey, count);
  }
}

/**
 * Get offline fallback questions.
 * @param {string} categoryKey - Category key
 * @param {number} count - Number of questions
 * @returns {Promise<Array>} Array of questions
 */
async function getOfflineFallback(categoryKey, count) {
  try {
    const { getOfflineFallbackQuestions } = await import('/src/questions-offline-fallback.js');
    return getOfflineFallbackQuestions(categoryKey, count);
  } catch (importError) {
    console.error("[FETCH] Failed to load offline fallback:", importError);
    // Ultimate fallback: use window.QUESTION_BANK if available
    if (window.QUESTION_BANK && window.QUESTION_BANK[categoryKey]) {
      const pool = window.QUESTION_BANK[categoryKey];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
    return [];
  }
}

console.log('[Fetch] ✓ Unified question fetcher loaded');
