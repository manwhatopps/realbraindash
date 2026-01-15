/**
 * Client Helper for Match Questions API
 *
 * This module provides a simple interface to call the create-match-questions
 * Edge Function when a lobby locks and is ready to start a match.
 */

import { supabase } from './supabase-client.js';

/**
 * Creates a shared question set for a match
 *
 * This function should be called when:
 * - A lobby reaches the required number of players
 * - All players are ready
 * - The match is about to start
 *
 * All players in the lobby will receive the SAME 10 questions in the same order.
 *
 * @param {string} matchId - UUID of the match
 * @param {string} category - Question category (e.g., "Sports", "Science", "Pop Culture")
 * @param {string[]} playerIds - Array of player UUIDs in the match
 * @param {'competitive'|'free'} mode - Match mode (affects freshness window)
 * @returns {Promise<Object>} Result with questions array
 */
export async function createMatchQuestions(matchId, category, playerIds, mode = 'free') {
  try {
    // Validate inputs
    if (!matchId || !category || !playerIds || !mode) {
      throw new Error('Missing required parameters');
    }

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      throw new Error('playerIds must be a non-empty array');
    }

    console.log('[MATCH-QUESTIONS] Creating questions for match:', matchId);
    console.log('[MATCH-QUESTIONS] Category:', category);
    console.log('[MATCH-QUESTIONS] Players:', playerIds.length);
    console.log('[MATCH-QUESTIONS] Mode:', mode);

    // Get the Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    // Call the Edge Function
    const functionUrl = `${supabaseUrl}/functions/v1/create-match-questions`;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        matchId,
        category,
        playerIds,
        mode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create match questions');
    }

    const result = await response.json();

    console.log('[MATCH-QUESTIONS] Success! Created', result.questions.length, 'questions');
    if (result.cached) {
      console.log('[MATCH-QUESTIONS] Questions were cached (already existed)');
    }

    return result;

  } catch (error) {
    console.error('[MATCH-QUESTIONS] Error:', error);
    throw error;
  }
}

/**
 * Example usage in a lobby system:
 *
 * // When lobby is ready to start
 * async function onLobbyReady(lobby) {
 *   try {
 *     // Extract player IDs from lobby
 *     const playerIds = lobby.players.map(p => p.user_id);
 *
 *     // Create match questions
 *     const result = await createMatchQuestions(
 *       lobby.match_id,
 *       lobby.category,
 *       playerIds,
 *       lobby.is_cash_match ? 'competitive' : 'free'
 *     );
 *
 *     console.log('Match ready with questions:', result.questions);
 *
 *     // Store questions or start match
 *     // All players will get these same questions
 *
 *   } catch (error) {
 *     console.error('Failed to create match questions:', error);
 *     // Handle error - maybe cancel match or retry
 *   }
 * }
 */

/**
 * Response format:
 * {
 *   success: true,
 *   matchId: "uuid",
 *   category: "Sports",
 *   cached: false,
 *   questions: [
 *     {
 *       roundNo: 1,
 *       question: {
 *         id: "uuid",
 *         category: "Sports",
 *         difficulty: "easy",
 *         prompt: "Which country won the FIFA World Cup in 2018?",
 *         choices: ["Brazil", "France", "Germany", "Argentina"],
 *         correct: 1,
 *         explanation: "France won the 2018 FIFA World Cup..."
 *       }
 *     },
 *     // ... 9 more questions
 *   ]
 * }
 *
 * Difficulty schedule (guaranteed):
 * - Questions 1-5: easy
 * - Questions 6-8: medium
 * - Questions 9-10: hard
 */
