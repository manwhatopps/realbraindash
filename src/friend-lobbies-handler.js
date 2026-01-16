import { supabase } from './supabase-client.js';
import { createCashPlayLanding } from './ui/cash-play-landing.js';
import { createPlayWithFriends } from './ui/play-with-friends.js';
import { createPrivateLobbyRoom } from './ui/private-lobby-room.js';

let currentPrivateLobbyCleanup = null;

export function initFriendLobbiesHandlers() {
  console.log('[Friend Lobbies] Initializing handlers');

  const urlParams = new URLSearchParams(window.location.search);
  const joinCode = urlParams.get('code');

  if (joinCode) {
    console.log('[Friend Lobbies] Join code detected in URL:', joinCode);
    handleJoinFromLink(joinCode);
  }

  const cashBtn = document.getElementById('cashBtn');
  if (cashBtn) {
    const originalCashHandler = cashBtn.onclick;

    cashBtn.onclick = async (e) => {
      console.log('[Friend Lobbies] Cash Play clicked - intercepting');
      e.preventDefault();
      e.stopPropagation();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[Friend Lobbies] No session - running original handler');
        if (originalCashHandler) {
          originalCashHandler.call(cashBtn, e);
        } else if (typeof startCashGate === 'function') {
          startCashGate();
        }
        return;
      }

      console.log('[Friend Lobbies] Session found - showing Cash Play landing');
      showCashPlayLanding();
    };

    console.log('[Friend Lobbies] Cash button handler installed');
  } else {
    console.warn('[Friend Lobbies] Cash button not found');
  }
}

function showCashPlayLanding() {
  console.log('[Friend Lobbies] Showing Cash Play landing');

  const container = document.createElement('div');
  container.id = 'cash-play-landing-screen';
  container.className = 'screen';
  container.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    z-index: 1000;
    overflow-y: auto;
  `;

  document.body.appendChild(container);

  createCashPlayLanding(
    container,
    () => {
      console.log('[Friend Lobbies] Join Public Lobby clicked');
      container.remove();
      alert('Public lobbies coming soon!');
    },
    () => {
      console.log('[Friend Lobbies] Play with Friends clicked');
      container.remove();
      showPlayWithFriends();
    }
  );
}

async function showPlayWithFriends() {
  console.log('[Friend Lobbies] Showing Play with Friends');

  const container = document.createElement('div');
  container.id = 'play-with-friends-screen';
  container.className = 'screen';
  container.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    z-index: 1000;
    overflow-y: auto;
  `;

  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.style.cssText = `
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    z-index: 10;
  `;
  backBtn.addEventListener('click', () => {
    container.remove();
    showCashPlayLanding();
  });

  document.body.appendChild(container);
  container.appendChild(backBtn);

  await createPlayWithFriends(
    container,
    (lobbyId, code) => {
      console.log('[Friend Lobbies] Lobby created:', lobbyId, code);
      container.remove();
      showPrivateLobbyRoom(lobbyId);
    },
    (lobbyId) => {
      console.log('[Friend Lobbies] Lobby joined:', lobbyId);
      container.remove();
      showPrivateLobbyRoom(lobbyId);
    }
  );
}

async function showPrivateLobbyRoom(lobbyId) {
  console.log('[Friend Lobbies] Showing private lobby room:', lobbyId);

  const container = document.createElement('div');
  container.id = 'private-lobby-room-screen';
  container.className = 'screen';
  container.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    z-index: 1000;
    overflow-y: auto;
  `;

  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.style.cssText = `
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    z-index: 10;
  `;
  backBtn.addEventListener('click', () => {
    if (currentPrivateLobbyCleanup) {
      currentPrivateLobbyCleanup.cleanup();
      currentPrivateLobbyCleanup = null;
    }
    container.remove();
    showPlayWithFriends();
  });

  document.body.appendChild(container);
  container.appendChild(backBtn);

  currentPrivateLobbyCleanup = await createPrivateLobbyRoom(
    container,
    lobbyId,
    (matchLobbyId) => {
      console.log('[Friend Lobbies] Match started for lobby:', matchLobbyId);
      if (currentPrivateLobbyCleanup) {
        currentPrivateLobbyCleanup.cleanup();
        currentPrivateLobbyCleanup = null;
      }
      container.remove();
      startPrivateLobbyMatch(matchLobbyId);
    }
  );
}

async function handleJoinFromLink(code) {
  console.log('[Friend Lobbies] Attempting to join via link code:', code);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert('Please sign in to join this match');
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  try {
    const { data: lobbyId, error } = await supabase.rpc('join_friend_lobby', {
      p_code: code,
      p_as_spectator: false
    });

    if (error) throw error;

    window.history.replaceState({}, document.title, window.location.pathname);
    showPrivateLobbyRoom(lobbyId);

  } catch (error) {
    console.error('[Friend Lobbies] Error joining from link:', error);
    alert('Failed to join match: ' + error.message);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function startPrivateLobbyMatch(lobbyId) {
  console.log('[Friend Lobbies] Starting match for lobby:', lobbyId);

  const { data: lobby, error } = await supabase
    .from('friend_lobbies')
    .select('*')
    .eq('id', lobbyId)
    .single();

  if (error || !lobby) {
    console.error('[Friend Lobbies] Error loading lobby:', error);
    alert('Failed to load lobby data');
    return;
  }

  if (typeof window.getQuestionsForSession !== 'function' || typeof window.startTriviaSession !== 'function') {
    console.error('[Friend Lobbies] Trivia engine not available');
    alert('Trivia engine not loaded. Please refresh the page.');
    return;
  }

  const categoryKey = 'sports';
  const QUESTION_COUNT = 10;

  console.log('[Friend Lobbies] Getting questions for match');
  const questions = await window.getQuestionsForSession(categoryKey, QUESTION_COUNT);

  if (!questions || questions.length === 0) {
    console.error('[Friend Lobbies] No questions available');
    alert('No questions available. Please try again.');
    return;
  }

  console.log('[Friend Lobbies] Starting trivia session');
  window.startTriviaSession({
    mode: 'friend-lobby',
    categoryKey,
    questions,
    lobby: lobby,
    onComplete: (score, details) => {
      console.log('[Friend Lobbies] Match completed. Score:', score);
      onPrivateLobbyMatchComplete(lobby, score, details);
    }
  });
}

function onPrivateLobbyMatchComplete(lobby, score, details) {
  console.log('[Friend Lobbies] Match complete handler');
  alert(`Match complete! Your score: ${Math.round(score)} points`);
}

export function setupJoinRoute() {
  const path = window.location.pathname;
  if (path.startsWith('/join/')) {
    const code = path.split('/join/')[1];
    if (code) {
      console.log('[Friend Lobbies] Join route detected:', code);
      handleJoinFromLink(code);
    }
  }
}
