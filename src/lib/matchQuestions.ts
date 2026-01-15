/**
 * Match Questions API Client
 *
 * This module provides TypeScript functions to interact with the hybrid static
 * bank question system for BrainDash matches.
 *
 * All players in a match receive the SAME 10 questions in the SAME order.
 */

import { supabase } from '../supabase-client.js';

export interface QuestionPayload {
  id: string;
  category: string;
  difficulty: number; // 1=easy, 2=medium, 3=hard
  prompt: string;
  choices: Array<{ id: string; text: string }>;
  correct: { choice_id: string };
  explanation: string;
}

export interface MatchQuestion {
  roundNo: number;
  question: QuestionPayload;
}

export interface CreateMatchQuestionsResponse {
  success: boolean;
  matchId: string;
  category: string;
  mode: string;
  questions: MatchQuestion[];
  cached: boolean;
}

export interface GetMatchQuestionResponse {
  success: boolean;
  matchId: string;
  roundNo: number;
  question: QuestionPayload;
}

export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  points: number;
  correctAnswer: string;
}

/**
 * Create a shared question set for a match
 *
 * This should be called ONCE when the lobby locks and players are ready.
 * The function is idempotent - calling it multiple times returns the same questions.
 *
 * @param matchId - UUID of the match
 * @param category - Question category (e.g., "Sports", "Science")
 * @param playerIds - Array of player UUIDs in the match
 * @param mode - "competitive" (30-day freshness) or "free" (14-day freshness)
 * @returns Promise with the 10 questions for the match
 */
export async function createMatchQuestions(
  matchId: string,
  category: string,
  playerIds: string[],
  mode: 'competitive' | 'free' = 'free'
): Promise<CreateMatchQuestionsResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    console.log('[MATCH-QUESTIONS] Creating questions for match:', matchId);

    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/create-match-questions`, {
      method: 'POST',
      headers,
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
    console.log('[MATCH-QUESTIONS] Success!', result.cached ? '(cached)' : '(new)');
    return result;

  } catch (error) {
    console.error('[MATCH-QUESTIONS] Error:', error);
    throw error;
  }
}

/**
 * Get a specific question for a match round
 *
 * Fetches the frozen question snapshot for the specified round.
 * Questions must be created first via createMatchQuestions().
 *
 * @param matchId - UUID of the match
 * @param roundNo - Round number (1-10)
 * @returns Promise with the question for this round
 */
export async function getMatchQuestion(
  matchId: string,
  roundNo: number
): Promise<GetMatchQuestionResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    console.log(`[MATCH-QUESTIONS] Fetching question for match ${matchId}, round ${roundNo}`);

    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/get-match-question`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        matchId,
        roundNo
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get match question');
    }

    const result = await response.json();
    console.log(`[MATCH-QUESTIONS] Question fetched:`, result.question.id);
    return result;

  } catch (error) {
    console.error('[MATCH-QUESTIONS] Error:', error);
    throw error;
  }
}

/**
 * Submit an answer for a match question
 *
 * Records the user's answer, checks correctness, computes points, and tracks usage.
 *
 * @param matchId - UUID of the match
 * @param roundNo - Round number (1-10)
 * @param userId - UUID of the user answering
 * @param choiceId - The choice selected (e.g., "A", "B", "C", "D")
 * @param responseMs - Time taken to answer in milliseconds
 * @returns Promise with the result (correct/incorrect, points earned)
 */
export async function submitAnswer(
  matchId: string,
  roundNo: number,
  userId: string,
  choiceId: string,
  responseMs: number
): Promise<SubmitAnswerResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL not configured');
    }

    console.log(`[MATCH-QUESTIONS] Submitting answer: ${choiceId} in ${responseMs}ms`);

    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/submit-answer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        matchId,
        roundNo,
        userId,
        answer: { choice_id: choiceId },
        responseMs
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit answer');
    }

    const result = await response.json();
    console.log(`[MATCH-QUESTIONS] Answer ${result.isCorrect ? 'CORRECT' : 'INCORRECT'} - ${result.points} points`);
    return result;

  } catch (error) {
    console.error('[MATCH-QUESTIONS] Error:', error);
    throw error;
  }
}

/**
 * Get difficulty text from numeric value
 */
export function getDifficultyText(difficulty: number): string {
  switch (difficulty) {
    case 1: return 'easy';
    case 2: return 'medium';
    case 3: return 'hard';
    default: return 'easy';
  }
}

/**
 * Get numeric difficulty from text
 */
export function getDifficultyNum(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 1;
    case 'medium': return 2;
    case 'hard': return 3;
    default: return 1;
  }
}

/**
 * Valid question categories
 */
export const VALID_CATEGORIES = [
  'Politics',
  'Business',
  'Sports',
  'Music',
  'Movies',
  'History',
  'Geography',
  'Science',
  'Pop Culture'
] as const;

export type QuestionCategory = typeof VALID_CATEGORIES[number];

/**
 * Difficulty schedule for 10-question matches
 */
export const DIFFICULTY_SCHEDULE = [
  1, 1, 1, 1, 1,  // Rounds 1-5: Easy
  2, 2, 2,        // Rounds 6-8: Medium
  3, 3            // Rounds 9-10: Hard
] as const;
