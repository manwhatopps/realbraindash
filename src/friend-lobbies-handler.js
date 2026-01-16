import { supabase } from './supabase-client.js';
import { createCashPlayLanding } from './ui/cash-play-landing.js';
import { createPlayWithFriends } from './ui/play-with-friends.js';
import { createPrivateLobbyRoom } from './ui/private-lobby-room.js';

let currentPrivateLobbyCleanup = null;
let activeScreenContainer = null;

export function initFriendLobbiesHandlers() {
  console.log('[Friend Lobbies TEST MODE] Initializing handlers');

  const urlParams = new URLSearchParams(window.location.search);
  const joinCode = urlParams.get('code');

  if (joinCode) {
    console.log('[Friend Lobbies TEST MODE] Join code detected in URL:', joinCode);
    handleJoinFromLink(joinCode);
  }
}

export function showTestCashChoice(onBack) {
  console.log('[Friend Lobbies TEST MODE] Showing Test Cash choice screen');

  cleanupActiveScreen();

  const container = document.createElement('div');
  container.id = 'test-cash-choice-screen';
  container.className = 'screen';
  container.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    z-index: 1000;
    overflow-y: auto;
  `;

  container.innerHTML = `
    <div style="max-width: 600px; margin: 40px auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="
          display: inline-block;
          padding: 6px 16px;
          background: rgba(255, 200, 0, 0.2);
          border: 1px solid rgba(255, 200, 0, 0.5);
          border-radius: 20px;
          color: #ffc800;
          font-weight: bold;
          font-size: 12px;
          letter-spacing: 1px;
        ">
          🧪 TEST MODE
        </span>
      </div>

      <h1 style="text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 40px; color: #fff;">
        Cash Play (Test)
      </h1>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <button id="test-join-public-btn" style="
          width: 100%;
          padding: 30px;
          font-size: 20px;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        ">
          Join Lobby
        </button>

        <button id="test-play-friends-btn" style="
          width: 100%;
          padding: 30px;
          font-size: 20px;
          font-weight: bold;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        ">
          Play with Friends
        </button>

        <button id="test-cash-back-btn" style="
          width: 100%;
          padding: 15px;
          font-size: 16px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          cursor: pointer;
          margin-top: 20px;
        ">
          ← Back to Test Mode
        </button>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #888; font-size: 14px;">
        <p>Join Lobby: Compete against test bots</p>
        <p>Play with Friends: Create private matches up to 12 players</p>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  activeScreenContainer = container;

  const joinPublicBtn = container.querySelector('#test-join-public-btn');
  const playFriendsBtn = container.querySelector('#test-play-friends-btn');
  const backBtn = container.querySelector('#test-cash-back-btn');

  joinPublicBtn.addEventListener('click', () => {
    cleanupActiveScreen();
    if (typeof window.showScreen === 'function') {
      window.showScreen('cash-test-screen');
    }
  });

  playFriendsBtn.addEventListener('click', () => {
    showTestPlayWithFriends();
  });

  backBtn.addEventListener('click', () => {
    cleanupActiveScreen();
    if (onBack) onBack();
  });
}

function cleanupActiveScreen() {
  if (activeScreenContainer && document.body.contains(activeScreenContainer)) {
    activeScreenContainer.remove();
  }
  activeScreenContainer = null;

  if (currentPrivateLobbyCleanup) {
    currentPrivateLobbyCleanup.cleanup();
    currentPrivateLobbyCleanup = null;
  }
}

async function showTestPlayWithFriends() {
  console.log('[Friend Lobbies TEST MODE] Showing Play with Friends');

  cleanupActiveScreen();

  const container = document.createElement('div');
  container.id = 'test-play-with-friends-screen';
  container.className = 'screen';
  container.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    z-index: 1000;
    overflow-y: auto;
  `;

  const testModeBadge = document.createElement('div');
  testModeBadge.style.cssText = `
    text-align: center;
    padding: 20px 0 0 0;
  `;
  testModeBadge.innerHTML = `
    <span style="
      display: inline-block;
      padding: 6px 16px;
      background: rgba(255, 200, 0, 0.2);
      border: 1px solid rgba(255, 200, 0, 0.5);
      border-radius: 20px;
      color: #ffc800;
      font-weight: bold;
      font-size: 12px;
      letter-spacing: 1px;
    ">
      🧪 TEST MODE
    </span>
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
    cleanupActiveScreen();
    showTestCashChoice(() => {
      if (typeof window.showScreen === 'function') {
        window.showScreen('home');
      }
    });
  });

  document.body.appendChild(container);
  container.appendChild(testModeBadge);
  container.appendChild(backBtn);
  activeScreenContainer = container;

  await createPlayWithFriends(
    container,
    (lobbyId, code) => {
      console.log('[Friend Lobbies TEST MODE] Lobby created:', lobbyId, code);
      showTestPrivateLobbyRoom(lobbyId);
    },
    (lobbyId) => {
      console.log('[Friend Lobbies TEST MODE] Lobby joined:', lobbyId);
      showTestPrivateLobbyRoom(lobbyId);
    }
  );
}

async function showTestPrivateLobbyRoom(lobbyId) {
  console.log('[Friend Lobbies TEST MODE] Showing private lobby room:', lobbyId);

  cleanupActiveScreen();

  const container = document.createElement('div');
  container.id = 'test-private-lobby-room-screen';
  container.className = 'screen';
  container.style.cssText = `
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    z-index: 1000;
    overflow-y: auto;
  `;

  const testModeBadge = document.createElement('div');
  testModeBadge.style.cssText = `
    text-align: center;
    padding: 20px 0 0 0;
  `;
  testModeBadge.innerHTML = `
    <span style="
      display: inline-block;
      padding: 6px 16px;
      background: rgba(255, 200, 0, 0.2);
      border: 1px solid rgba(255, 200, 0, 0.5);
      border-radius: 20px;
      color: #ffc800;
      font-weight: bold;
      font-size: 12px;
      letter-spacing: 1px;
    ">
      🧪 TEST MODE
    </span>
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
    cleanupActiveScreen();
    showTestPlayWithFriends();
  });

  document.body.appendChild(container);
  container.appendChild(testModeBadge);
  container.appendChild(backBtn);
  activeScreenContainer = container;

  currentPrivateLobbyCleanup = await createPrivateLobbyRoom(
    container,
    lobbyId,
    (matchLobbyId) => {
      console.log('[Friend Lobbies TEST MODE] Match started for lobby:', matchLobbyId);
      if (currentPrivateLobbyCleanup) {
        currentPrivateLobbyCleanup.cleanup();
        currentPrivateLobbyCleanup = null;
      }
      cleanupActiveScreen();
      startTestPrivateLobbyMatch(matchLobbyId);
    }
  );
}

async function handleJoinFromLink(code) {
  console.log('[Friend Lobbies TEST MODE] Attempting to join via link code:', code);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert('Please sign in to join this test match');
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
    showTestPrivateLobbyRoom(lobbyId);

  } catch (error) {
    console.error('[Friend Lobbies TEST MODE] Error joining from link:', error);
    alert('Failed to join test match: ' + error.message);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function startTestPrivateLobbyMatch(lobbyId) {
  console.log('[Friend Lobbies TEST MODE] Starting match for lobby:', lobbyId);

  const { data: lobby, error } = await supabase
    .from('friend_lobbies')
    .select('*')
    .eq('id', lobbyId)
    .single();

  if (error || !lobby) {
    console.error('[Friend Lobbies TEST MODE] Error loading lobby:', error);
    alert('Failed to load lobby data');
    return;
  }

  if (typeof window.getQuestionsForSession !== 'function' || typeof window.startTriviaSession !== 'function') {
    console.error('[Friend Lobbies TEST MODE] Trivia engine not available');
    alert('Trivia engine not loaded. Please refresh the page.');
    return;
  }

  const categoryKey = 'sports';
  const QUESTION_COUNT = 10;

  console.log('[Friend Lobbies TEST MODE] Getting questions for match');
  const questions = await window.getQuestionsForSession(categoryKey, QUESTION_COUNT);

  if (!questions || questions.length === 0) {
    console.error('[Friend Lobbies TEST MODE] No questions available');
    alert('No questions available. Please try again.');
    return;
  }

  console.log('[Friend Lobbies TEST MODE] Starting trivia session');
  window.startTriviaSession({
    mode: 'friend-lobby-test',
    categoryKey,
    questions,
    lobby: lobby,
    onComplete: (score, details) => {
      console.log('[Friend Lobbies TEST MODE] Match completed. Score:', score);
      onTestPrivateLobbyMatchComplete(lobby, score, details);
    }
  });
}

function onTestPrivateLobbyMatchComplete(lobby, score, details) {
  console.log('[Friend Lobbies TEST MODE] Match complete handler');
  cleanupActiveScreen();

  alert(`Test match complete! Your score: ${Math.round(score)} points (Test Mode - No real money)`);

  showTestCashChoice(() => {
    if (typeof window.showScreen === 'function') {
      window.showScreen('home');
    }
  });
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
