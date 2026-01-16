import { supabase } from './supabase-client.js';
import { createPlayWithFriends } from './ui/play-with-friends.js';
import { createPrivateLobbyRoom } from './ui/private-lobby-room.js';

let currentPrivateLobbyCleanup = null;
let activeScreenContainer = null;

export function initFreePlayLobbiesHandlers() {
  console.log('[Free Play] Initializing lobby handlers');
}

export function showFreePlayChoice(onBack) {
  console.log('[Free Play] Showing Free Play choice screen');

  cleanupActiveScreen();

  const container = document.createElement('div');
  container.id = 'free-play-choice-screen';
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
      <h1 style="text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 40px; color: #fff;">
        Free Play
      </h1>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <button id="free-join-public-btn" style="
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

        <button id="free-play-friends-btn" style="
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

        <button id="free-play-back-btn" style="
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
          ← Back to Home
        </button>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #888; font-size: 14px;">
        <p>Join Lobby: Quick match with public lobbies</p>
        <p>Play with Friends: Create private matches up to 12 players</p>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  activeScreenContainer = container;

  const joinPublicBtn = container.querySelector('#free-join-public-btn');
  const playFriendsBtn = container.querySelector('#free-play-friends-btn');
  const backBtn = container.querySelector('#free-play-back-btn');

  joinPublicBtn.addEventListener('click', () => {
    cleanupActiveScreen();
    const freeSheet = document.getElementById('freeSheet');
    if (freeSheet) {
      freeSheet.style.display = 'grid';
      freeSheet.setAttribute('aria-hidden', 'false');
    }
  });

  playFriendsBtn.addEventListener('click', () => {
    showFreePlayWithFriends();
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

async function showFreePlayWithFriends() {
  console.log('[Free Play] Showing Play with Friends');

  cleanupActiveScreen();

  const container = document.createElement('div');
  container.id = 'free-play-with-friends-screen';
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
    cleanupActiveScreen();
    showFreePlayChoice(() => {
      if (typeof window.showScreen === 'function') {
        window.showScreen('home');
      }
    });
  });

  document.body.appendChild(container);
  container.appendChild(backBtn);
  activeScreenContainer = container;

  await createPlayWithFriends(
    container,
    (lobbyId, code) => {
      console.log('[Free Play] Lobby created:', lobbyId, code);
      showFreePlayPrivateLobbyRoom(lobbyId);
    },
    (lobbyId) => {
      console.log('[Free Play] Lobby joined:', lobbyId);
      showFreePlayPrivateLobbyRoom(lobbyId);
    },
    true
  );
}

async function showFreePlayPrivateLobbyRoom(lobbyId) {
  console.log('[Free Play] Showing private lobby room:', lobbyId);

  cleanupActiveScreen();

  const container = document.createElement('div');
  container.id = 'free-play-private-lobby-room-screen';
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
    cleanupActiveScreen();
    showFreePlayWithFriends();
  });

  document.body.appendChild(container);
  container.appendChild(backBtn);
  activeScreenContainer = container;

  currentPrivateLobbyCleanup = await createPrivateLobbyRoom(
    container,
    lobbyId,
    (matchLobbyId) => {
      console.log('[Free Play] Match started for lobby:', matchLobbyId);
      if (currentPrivateLobbyCleanup) {
        currentPrivateLobbyCleanup.cleanup();
        currentPrivateLobbyCleanup = null;
      }
      cleanupActiveScreen();
      startFreePlayPrivateLobbyMatch(matchLobbyId);
    },
    true
  );
}

async function startFreePlayPrivateLobbyMatch(lobbyId) {
  console.log('[Free Play] Starting match for lobby:', lobbyId);

  const { data: lobby, error } = await supabase
    .from('friend_lobbies')
    .select('*')
    .eq('id', lobbyId)
    .single();

  if (error || !lobby) {
    console.error('[Free Play] Error loading lobby:', error);
    alert('Failed to load lobby data');
    return;
  }

  if (typeof window.getQuestionsForSession !== 'function' || typeof window.startTriviaSession !== 'function') {
    console.error('[Free Play] Trivia engine not available');
    alert('Trivia engine not loaded. Please refresh the page.');
    return;
  }

  const categoryKey = 'sports';
  const QUESTION_COUNT = 10;

  console.log('[Free Play] Getting questions for match');
  const questions = await window.getQuestionsForSession(categoryKey, QUESTION_COUNT);

  if (!questions || questions.length === 0) {
    console.error('[Free Play] No questions available');
    alert('No questions available. Please try again.');
    return;
  }

  console.log('[Free Play] Starting trivia session');
  window.startTriviaSession({
    mode: 'friend-lobby-free',
    categoryKey,
    questions,
    lobby: lobby,
    onComplete: (score, details) => {
      console.log('[Free Play] Match completed. Score:', score);
      onFreePlayPrivateLobbyMatchComplete(lobby, score, details);
    }
  });
}

function onFreePlayPrivateLobbyMatchComplete(lobby, score, details) {
  console.log('[Free Play] Match complete handler');
  cleanupActiveScreen();

  alert(`Match complete! Your score: ${Math.round(score)} points (Free Play)`);

  showFreePlayChoice(() => {
    if (typeof window.showScreen === 'function') {
      window.showScreen('home');
    }
  });
}
