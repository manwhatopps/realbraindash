import { supabase } from './supabase-client.js';
import { DEV_MODE, getDevUser } from './dev/dev-mode.js';

const SUPABASE_URL = 'https://dguhvsjrqnpeonfhotty.supabase.co';

export class CashMatchesSDK {
  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
  }

  async getAuthToken() {
    if (DEV_MODE) {
      console.log('[DEV MODE] Using fake auth token');
      return 'dev-mode-fake-token';
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }
    return session.access_token;
  }

  async createCashMatch(config) {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/cash-matches-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create match');
    }

    return data;
  }

  async joinCashMatch(matchIdOrCode) {
    const token = await this.getAuthToken();

    const body = matchIdOrCode.length === 6
      ? { room_code: matchIdOrCode }
      : { match_id: matchIdOrCode };

    const response = await fetch(`${this.baseUrl}/cash-matches-join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to join match');
    }

    return data;
  }

  async startCashMatch(matchId) {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/cash-matches-start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ match_id: matchId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start match');
    }

    return data;
  }

  async fetchMatchQuestions(matchId) {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/cash-matches-get-questions?match_id=${matchId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch questions');
    }

    return data;
  }

  async submitMatchScore(matchId, answers, timeTakenMs) {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/cash-matches-submit-score`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        match_id: matchId,
        answers,
        time_taken_ms: timeTakenMs,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit score');
    }

    return data;
  }

  async finalizeMatch(matchId) {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/cash-matches-finalize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ match_id: matchId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to finalize match');
    }

    return data;
  }

  async getMatch(matchId) {
    const { data, error } = await supabase
      .from('cash_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error) throw error;
    return data;
  }

  async getMatchPlayers(matchId) {
    const { data, error } = await supabase
      .from('cash_match_players')
      .select('*, user_id')
      .eq('match_id', matchId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getMatchResults(matchId) {
    const { data: match, error: matchError } = await supabase
      .from('cash_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;

    const { data: players, error: playersError } = await supabase
      .from('cash_match_players')
      .select('*')
      .eq('match_id', matchId)
      .order('placement', { ascending: true });

    if (playersError) throw playersError;

    const { data: escrow } = await supabase
      .from('cash_match_escrows')
      .select('*')
      .eq('match_id', matchId)
      .single();

    return {
      match,
      players,
      escrow,
    };
  }

  async getUserWallet() {
    if (DEV_MODE) {
      const devUser = getDevUser();
      console.log('[DEV MODE] Returning fake wallet');
      return { balance_cents: devUser.balance_cents, user_id: devUser.id };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data || { balance_cents: 0 };
  }

  async awaitMatchStart(matchId, pollIntervalMs = 2000) {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const match = await this.getMatch(matchId);

          if (match.status === 'active') {
            resolve(match);
          } else if (match.status === 'cancelled') {
            reject(new Error('Match was cancelled'));
          } else {
            setTimeout(checkStatus, pollIntervalMs);
          }
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }

  subscribeToMatch(matchId, callback) {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          callback({ type: 'match_updated', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cash_match_players',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          callback({ type: 'player_joined', data: payload.new });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const cashMatchesSDK = new CashMatchesSDK();
