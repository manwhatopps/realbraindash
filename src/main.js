// ===== SUPABASE CONNECTION VERIFICATION =====
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔌 SUPABASE CONNECTION CHECK');
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Project:', import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]);
console.log('Expected:', 'uhhpldqfwkrulhlgkfhn');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// ===== TEST MODE CONFIG =====
// Check APP_CONFIG for review mode status
const REVIEW_MODE = window.APP_CONFIG?.REVIEW_MODE || false;
const TEST_CASH_MODE = window.APP_CONFIG?.CASH_MODE_CONFIG?.testModeVisible !== false;

// === CATEGORY MAPPING (SHARED BY FREE PLAY & TEST CASH) ===
// Maps UI display labels to internal category keys used by question loader
// Free Play uses: data-cat="sports" (lowercase, no spaces)
// Test Cash uses: categoryLabel="Sports" (display) -> categoryKey="sports" (internal)
const TRIVIA_CATEGORY_MAP = {
  "Politics": "politics",
  "Business & Economics": "business",
  "Sports": "sports",
  "Music": "music",
  "Movies": "movies",
  "History": "history",
  "Geography": "geography",
  "Science": "science",
  "Pop Culture": "pop_culture"
};

// === KAHOOT-STYLE SCORING ===
// Calculate points for a single question (0 if incorrect)
// Speed-based: faster answers get more base points (up to 1000)
// Streak bonus: +100 per consecutive correct answer (capped at +500)
// NOTE: This function is also defined in trivia-engine.js for consistency
function calculateKahootStyleScore({ correct, timeRemaining, maxTime, currentStreak }) {
  if (!correct) return 0;

  const MAX_POINTS = 1000;
  const clampedTime = Math.max(0, Math.min(timeRemaining, maxTime));
  const speedFactor = maxTime > 0 ? clampedTime / maxTime : 0;
  const basePoints = Math.round(MAX_POINTS * speedFactor);
  const streakBonus = Math.min(currentStreak * 100, 500);
  const total = basePoints + streakBonus;

  console.log('[SCORING] correct:', correct, 'timeRemaining:', timeRemaining, 'currentStreak:', currentStreak,
              '=> base:', basePoints, 'streakBonus:', streakBonus, 'total:', total);

  return total;
}

// Export to window for backward compatibility
window.calculateKahootStyleScore = calculateKahootStyleScore;

// Test user and lobbies state
const testUser = {
  id: "user-test-1",
  username: "You",
  balance: 100
};

const botProfiles = [
  { id: "bot-1", username: "Bot Blake", balance: 80 },
  { id: "bot-2", username: "Bot Nova", balance: 150 },
  { id: "bot-3", username: "Bot Pixel", balance: 200 },
  { id: "bot-4", username: "Bot Turbo", balance: 120 }
];

let testLobbies = [];
let botIntervalId = null;
let currentLobbyId = null;
let lobbyRefreshInterval = null;
let currentUserLobbyId = null; // Track which lobby the user has actually joined

// Lobby filters state - multi-select
const lobbyFilters = {
  categories: [], // array of strings
  stakes: [],     // array of numbers
  sizes: []       // array of numbers
};

// Create default lobbies
function initDefaultLobbies() {
  const defaultLobbiesConfig = [
    { category: "Sports", stake: 10, maxPlayers: 2 },
    { category: "Movies", stake: 20, maxPlayers: 2 },
    { category: "Music", stake: 10, maxPlayers: 4 },
    { category: "Science", stake: 50, maxPlayers: 2 },
    { category: "Pop Culture", stake: 10, maxPlayers: 2 }
  ];

  defaultLobbiesConfig.forEach((config, index) => {
    testLobbies.push({
      id: `default-${index + 1}`,
      hostId: "system",
      hostName: "BrainDash Auto Lobby",
      category: config.category,
      stake: config.stake,
      maxPlayers: config.maxPlayers,
      participants: [],
      status: "open",
      isDefault: true
    });
  });
}

// ===== CONFIG =====
const BACKEND_BASE  = window.location.origin;

// ===== Supabase client (singleton) =====
import { supabase as sb } from '/src/supabase-client.js';

// ===== UI helpers =====
const toast = document.getElementById('toast');
const authSheet = document.getElementById('authSheet');
const freeSheet = document.getElementById('freeSheet');

const showToast = (m, ms=3000) => { toast.textContent=m; toast.style.display='block'; setTimeout(()=>toast.style.display='none',ms); };
const openSheet = el => { el.style.display='grid'; el.setAttribute('aria-hidden','false'); };
const closeSheet = el => { el.style.display='none'; el.setAttribute('aria-hidden','true'); };

// ===== ACTIVE MATCH STATE =====
// Global flags to track active matches and prevent unwanted navigation
let activeMatchMode = null;    // "free" | "cash" | "cash-test" | null
let activeMatchLobbyId = null; // for cash modes

// ===== TEST CASH MODE HELPERS =====
function _showScreenInternal(name) {
  console.log('[showScreen] Showing screen:', name);

  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.style.display = 'none';
  });

  // Handle homepage vs modal screens
  const wrapEl = document.querySelector('.wrap');
  if (name === 'home' && wrapEl) {
    // Show homepage
    wrapEl.style.display = 'flex';
    console.log('[showScreen] Showing homepage wrap');
  } else {
    // Hide homepage for modal screens
    if (wrapEl) {
      wrapEl.style.display = 'none';
      console.log('[showScreen] Hidden wrap element');
    }

    // Show the requested screen
    const screen = document.getElementById(name);
    console.log('[showScreen] Found screen element:', screen);
    if (screen) {
      screen.classList.remove('hidden');
      screen.style.display = 'block';
      console.log('[showScreen] Screen display set to:', screen.style.display);
      console.log('[showScreen] Screen classList:', screen.classList.toString());
    }
  }

  if (name === 'cash-test-screen') {
    console.log('[showScreen] Starting bot simulation');
    startBotSimulation();
  } else {
    stopBotSimulation();
  }
}

// ===== NAVIGATION WRAPPER WITH MATCH PROTECTION =====
// Intercepts all navigation to prevent leaving active matches
function showScreen(name) {
  console.log('[NAV] showScreen called', {
    target: name,
    activeMatchMode,
    activeMatchLobbyId
  });

  // Block navigation to home screens during active cash-test matches
  const homeScreens = ['home', 'home-screen', 'main-menu'];
  if (activeMatchMode === 'cash-test' && homeScreens.includes(name)) {
    console.warn('[NAV] ❌ BLOCKED navigation to', name, 'during active cash-test match');
    console.warn('[NAV] Match must complete or be exited before returning home');
    return;
  }

  // Block navigation to cash-test screen during active match
  if (activeMatchMode === 'cash-test' && name === 'cash-test-screen') {
    console.warn('[NAV] ❌ BLOCKED navigation to cash-test-screen during active match');
    return;
  }

  // Allow navigation
  console.log('[NAV] ✓ Navigation allowed to', name);
  _showScreenInternal(name);
}

function hideScreen(name) {
  console.log('[hideScreen] Hiding screen:', name);
  const screen = document.getElementById(name);
  if (screen) {
    screen.classList.add('hidden');
    screen.style.display = 'none';
    console.log('[hideScreen] Screen hidden');
  }

  // [FIX] DO NOT automatically show homepage when hiding screens
  // This was causing cash-test to redirect to home after countdown
  // The wrap should only be shown when explicitly navigating to home via showScreen
  // const wrapEl = document.querySelector('.wrap');
  // if (wrapEl) {
  //   wrapEl.style.display = 'flex';
  //   console.log('[hideScreen] Shown wrap element');
  // }
  console.log('[FIX] NOT showing wrap - prevents unwanted home navigation');

  if (name === 'cash-test-screen') {
    console.log('[hideScreen] Stopping bot simulation');
    stopBotSimulation();
  }
}

function updateTestUserBalanceUI() {
  const balanceEl = document.getElementById('testBalance');
  if (balanceEl) {
    balanceEl.textContent = '$' + testUser.balance.toFixed(2);
  }
}

function createTestLobby({ hostId, hostName, category, stake, maxPlayers, isBotHost }) {
  // Map display category to internal key for question loader
  const categoryLabel = category; // UI display: "Sports", "Politics", etc.
  const categoryKey = TRIVIA_CATEGORY_MAP[categoryLabel] || null; // Internal: "sports", "politics", etc.

  console.log('[Test Cash] Creating lobby - categoryLabel:', categoryLabel, 'categoryKey:', categoryKey);

  const lobby = {
    id: "lobby-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
    hostId,
    hostName,
    category: categoryLabel,      // Keep for UI display
    categoryLabel,                 // Explicit label field
    categoryKey,                   // Key for question loader
    stake,
    maxPlayers,
    participants: isBotHost ? [{
      id: hostId,
      username: hostName,
      isBot: true,
      hasAcceptedTerms: true,  // Bots auto-accept
      isReady: true             // Bots auto-ready
    }] : [],
    status: "open"
  };
  testLobbies.unshift(lobby);
  renderTestLobbyList();
  return lobby;
}

function joinTestLobby(lobbyId, player) {
  const lobby = testLobbies.find(l => l.id === lobbyId);
  if (!lobby) {
    console.error('[Join] Lobby not found:', lobbyId);
    return false;
  }

  // Allow joining open or full lobbies (full by status, not by count)
  if (lobby.status !== "open" && lobby.status !== "full") {
    console.error('[Join] Lobby status is', lobby.status, '- cannot join');
    return false;
  }

  if (lobby.participants.some(p => p.id === player.id)) {
    console.log('[Join] User already in lobby');
    return false;
  }

  if (lobby.participants.length >= lobby.maxPlayers) {
    console.log('[Join] Lobby is full (player count)');
    return false;
  }

  // Deduct stake from player balance
  if (player.isBot) {
    const bot = botProfiles.find(b => b.id === player.id);
    if (bot && bot.balance >= lobby.stake) {
      bot.balance -= lobby.stake;
    }
  } else if (player.id === testUser.id) {
    if (testUser.balance < lobby.stake) return false;
    testUser.balance -= lobby.stake;
    updateTestUserBalanceUI();
  }

  // Bots auto-accept terms and auto-ready for testing
  const isBot = !!player.isBot;
  lobby.participants.push({
    id: player.id,
    username: player.username,
    isBot: isBot,
    hasAcceptedTerms: isBot ? true : (player.hasAcceptedTerms || false),
    isReady: isBot ? true : (player.isReady || false)
  });

  // Track which lobby the user has joined
  if (player.id === testUser.id) {
    currentUserLobbyId = lobby.id;
    console.log('[Test Cash] User joined lobby:', lobby.id);
  }

  renderTestLobbyList();

  if (lobby.participants.length >= lobby.maxPlayers) {
    lobby.status = "full";
    // Don't auto-start countdown - wait for ready-up
    updateLobbyDetailsView(lobby);
  } else {
    updateLobbyDetailsView(lobby);
  }

  // Check if everyone is ready (for bots that auto-join)
  checkLobbyAllReady(lobby);

  return true;
}

function startLobbyCountdown(lobby) {
  console.log('[Lobby] Starting countdown for lobby:', lobby.id);

  // HARD GUARD: Only show countdown if user is in this lobby
  const userIsParticipant = lobby.participants.some(p => p.id === testUser.id);
  if (!userIsParticipant || currentUserLobbyId !== lobby.id) {
    console.log('[Test Cash] Skipping countdown for lobby', lobby.id, 'because user is not in this lobby');
    return;
  }

  updateLobbyDetailsView(lobby);

  // Start countdown immediately - no delay!
  lobby.status = "in_progress";
  renderTestLobbyList();
  show5SecondCountdown(lobby);
}

function handleLobbyFull(lobby) {
  console.log('[Lobby] Lobby is now full:', lobby.id);
  // This function is now deprecated - ready-up flow handles countdown
  updateLobbyDetailsView(lobby);
}

function show5SecondCountdown(lobby) {
  // HARD GUARD: Only show countdown if user is in this lobby
  const userIsParticipant = lobby.participants.some(p => p.id === testUser.id);
  if (!userIsParticipant || currentUserLobbyId !== lobby.id) {
    console.log('[Test Cash] Skipping countdown display for lobby', lobby.id);
    return;
  }
  const countdownOverlay = document.createElement('div');
  countdownOverlay.id = 'match-countdown-overlay';
  countdownOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.95);
    backdrop-filter: blur(10px);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
  `;

  countdownOverlay.innerHTML = `
    <div style="text-align:center;max-width:600px;padding:40px">
      <h1 style="font-size:2.5rem;font-weight:900;background:linear-gradient(135deg,var(--accent2),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 16px">Lobby Full!</h1>
      <div style="font-size:1.125rem;color:var(--muted);margin-bottom:32px">
        ${getCategoryIcon(lobby.category)} ${lobby.category} · $${lobby.stake} entry
      </div>
      <div style="font-size:1rem;color:var(--txt);margin-bottom:24px">Match starting in...</div>
      <div id="match-countdown-number" style="font-size:8rem;font-weight:900;color:var(--accent2);line-height:1;">3</div>
    </div>
  `;

  document.body.appendChild(countdownOverlay);

  let count = 3;
  const countdownEl = document.getElementById('match-countdown-number');

  const countdownInterval = setInterval(() => {
    // Check if user is still in lobby during countdown
    const stillInLobby = lobby.participants.some(p => p.id === testUser.id);
    if (!stillInLobby || currentUserLobbyId !== lobby.id) {
      console.log('[Test Cash] User left lobby during countdown, stopping');
      clearInterval(countdownInterval);
      if (document.body.contains(countdownOverlay)) {
        document.body.removeChild(countdownOverlay);
      }
      return;
    }

    count--;
    if (count > 0) {
      countdownEl.textContent = count;
      countdownEl.style.animation = 'none';
      setTimeout(() => { countdownEl.style.animation = 'pulse 0.5s ease'; }, 10);
    } else {
      clearInterval(countdownInterval);
      countdownEl.textContent = 'GO!';
      countdownEl.style.color = 'var(--accent)';
      setTimeout(() => {
        document.body.removeChild(countdownOverlay);
        startTestMatch(lobby);
      }, 500);
    }
  }, 1000);
}

function openLobbyDetails(lobbyId) {
  currentLobbyId = lobbyId;
  const lobby = testLobbies.find(l => l.id === lobbyId);
  if (!lobby) return;

  updateLobbyDetailsView(lobby);
  showScreen('lobby-details-screen');

  // Start polling for lobby updates
  if (lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
  lobbyRefreshInterval = setInterval(() => {
    const currentLobby = testLobbies.find(l => l.id === currentLobbyId);
    if (currentLobby && currentLobby.status === 'open' || currentLobby.status === 'full') {
      updateLobbyDetailsView(currentLobby);
    }
  }, 1000);
}

function updateLobbyDetailsView(lobby) {
  if (!lobby) return;

  document.getElementById('lobbyDetailsIcon').textContent = getCategoryIcon(lobby.category);
  document.getElementById('lobbyDetailsCategory').textContent = lobby.category;
  document.getElementById('lobbyDetailsHost').textContent = `Host: ${lobby.hostName}`;
  document.getElementById('lobbyDetailsStake').textContent = `$${lobby.stake}`;
  document.getElementById('lobbyDetailsPlayerCount').textContent = `(${lobby.participants.length}/${lobby.maxPlayers})`;

  // Update status text
  const statusEl = document.getElementById('lobbyDetailsStatus');
  if (lobby.status === 'full') {
    statusEl.textContent = 'Lobby full! Preparing your match...';
    statusEl.style.color = '#FFC107';
  } else if (lobby.participants.length < lobby.maxPlayers) {
    statusEl.textContent = 'Waiting for more players to join...';
    statusEl.style.color = 'var(--muted)';
  }

  // Render players list
  const playersListEl = document.getElementById('lobbyDetailsPlayersList');
  playersListEl.innerHTML = '';
  lobby.participants.forEach(p => {
    const playerCard = document.createElement('div');
    playerCard.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:10px;padding:12px 16px';
    playerCard.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:1.25rem">${p.isBot ? '🤖' : '👤'}</div>
        <div>
          <div style="font-size:0.9375rem;font-weight:600;color:var(--txt)">${p.username}</div>
          <div style="font-size:0.75rem;color:var(--muted)">${p.isBot ? 'Bot' : 'Player'}</div>
        </div>
      </div>
      ${!p.isBot ? '<div style="background:rgba(57,255,136,.1);border:1px solid rgba(57,255,136,.3);border-radius:6px;padding:4px 8px;font-size:0.75rem;font-weight:600;color:var(--accent)">YOU</div>' : ''}
    `;
    playersListEl.appendChild(playerCard);
  });

  // Show/hide sections based on user status
  const userInLobby = lobby.participants.some(p => p.id === testUser.id);
  const isFull = lobby.participants.length >= lobby.maxPlayers;

  document.getElementById('lobbyDetailsJoinSection').style.display = !userInLobby && !isFull ? 'block' : 'none';
  document.getElementById('lobbyDetailsAlreadyJoined').style.display = userInLobby ? 'block' : 'none';
  document.getElementById('lobbyDetailsFull').style.display = !userInLobby && isFull ? 'block' : 'none';

  // If user is in lobby, show the appropriate phase (terms -> ready -> waiting)
  if (userInLobby) {
    const currentParticipant = lobby.participants.find(p => p.id === testUser.id);
    updateLobbyReadyPhases(lobby, currentParticipant);
  }
}

function updateLobbyReadyPhases(lobby, participant) {
  if (!lobby || !participant) return;

  const termsPhase = document.getElementById('lobby-terms-phase');
  const readyPhase = document.getElementById('lobby-ready-phase');
  const waitingPhase = document.getElementById('lobby-waiting-phase');

  // Count ready players
  const readyCount = lobby.participants.filter(p => p.isReady).length;
  const totalPlayers = lobby.participants.length;

  if (!participant.hasAcceptedTerms) {
    // Show terms acceptance phase
    if (termsPhase) termsPhase.style.display = 'block';
    if (readyPhase) readyPhase.style.display = 'none';
    if (waitingPhase) waitingPhase.style.display = 'none';
  } else if (!participant.isReady) {
    // Show ready up phase
    if (termsPhase) termsPhase.style.display = 'none';
    if (readyPhase) readyPhase.style.display = 'block';
    if (waitingPhase) waitingPhase.style.display = 'none';

    const readyStatus = document.getElementById('lobby-ready-status');
    if (readyStatus) {
      readyStatus.textContent = `${readyCount}/${totalPlayers} players ready`;
    }
  } else {
    // Show waiting phase (player is ready)
    if (termsPhase) termsPhase.style.display = 'none';
    if (readyPhase) readyPhase.style.display = 'none';
    if (waitingPhase) waitingPhase.style.display = 'block';

    const readyStatusWaiting = document.getElementById('lobby-ready-status-waiting');
    if (readyStatusWaiting) {
      readyStatusWaiting.textContent = `${readyCount}/${totalPlayers} players ready`;
    }
  }
}

function handleAcceptTerms(lobbyId) {
  console.log('[LOBBY] User accepting terms', { lobbyId });

  const lobby = testLobbies.find(l => l.id === lobbyId);
  if (!lobby) return;

  const participant = lobby.participants.find(p => p.id === testUser.id);
  if (!participant) return;

  participant.hasAcceptedTerms = true;
  participant.isReady = false;

  console.log('[LOBBY] Terms accepted for user', testUser.id);
  updateLobbyDetailsView(lobby);
  checkLobbyAllReady(lobby);
}

function handleReadyUp(lobbyId) {
  console.log('[LOBBY] User ready up', { lobbyId });

  const lobby = testLobbies.find(l => l.id === lobbyId);
  if (!lobby) return;

  const participant = lobby.participants.find(p => p.id === testUser.id);
  if (!participant) {
    console.warn('[LOBBY] Participant not found in lobby');
    return;
  }

  if (!participant.hasAcceptedTerms) {
    showToast('⚠️ You must accept the Terms & Conditions before readying up.');
    return;
  }

  participant.isReady = true;

  console.log('[LOBBY] User marked as ready', testUser.id);
  updateLobbyDetailsView(lobby);
  checkLobbyAllReady(lobby);
}

function checkLobbyAllReady(lobby) {
  if (!lobby) return;

  // Ensure all bots are auto-ready (redundant safety check)
  lobby.participants.forEach(p => {
    if (p.isBot) {
      p.hasAcceptedTerms = true;
      p.isReady = true;
    }
  });

  // Check if there's at least one real user in the lobby
  const hasRealUser = lobby.participants.some(p => !p.isBot);

  const allAccepted = lobby.participants.length > 0 &&
    lobby.participants.every(p => p.hasAcceptedTerms);

  const allReady = lobby.participants.length > 0 &&
    lobby.participants.every(p => p.isReady);

  console.log('[LOBBY] checkLobbyAllReady', {
    lobbyId: lobby.id,
    hasRealUser,
    participants: lobby.participants.map(p => ({
      id: p.id,
      username: p.username,
      isBot: p.isBot,
      hasAcceptedTerms: p.hasAcceptedTerms,
      isReady: p.isReady
    })),
    allAccepted,
    allReady,
    status: lobby.status
  });

  // Only start countdown if there's a real user AND everyone is accepted and ready
  if (hasRealUser && allAccepted && allReady && (lobby.status === 'open' || lobby.status === 'full')) {
    console.log('[LOBBY] ✓ All players accepted terms and ready! Starting countdown...');
    lobby.status = 'countdown';
    startLobbyCountdown(lobby);
  } else if (!hasRealUser) {
    console.log('[LOBBY] ⏸️ Waiting for a real user to join before starting countdown');
  }
}

function leaveLobby(lobbyId) {
  const lobby = testLobbies.find(l => l.id === lobbyId);
  if (!lobby) return;

  const userIndex = lobby.participants.findIndex(p => p.id === testUser.id);
  if (userIndex === -1) return; // User not in lobby

  // Remove user from participants
  lobby.participants.splice(userIndex, 1);

  // Refund stake
  testUser.balance += lobby.stake;
  updateTestUserBalanceUI();

  // If lobby was full or in_progress, revert to open
  if (lobby.status === 'full' || lobby.status === 'in_progress') {
    if (lobby.participants.length < lobby.maxPlayers) {
      lobby.status = 'open';
    }
  }

  renderTestLobbyList();

  console.log('[Lobby] User left lobby:', lobbyId);
  showToast('✓ Left lobby. Stake refunded.');

  // Clear user's lobby membership
  if (currentUserLobbyId === lobbyId) {
    currentUserLobbyId = null;
    console.log('[Test Cash] User no longer in any lobby');
  }

  // Navigate back to lobby list
  if (lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
  currentLobbyId = null;
  hideScreen('lobby-details-screen');
  showScreen('cash-test-screen');
}

let currentTestCashLobby = null;

function startTestMatch(lobby) {
  console.log('[Test Cash] === startTestMatch called ===');
  console.log('[Test Cash] Lobby ID:', lobby.id);
  console.log('[Test Cash] Category Key:', lobby.categoryKey);

  // HARD GUARD: Only start match if user is in this lobby
  const userInLobby = lobby.participants.some(p => p.id === testUser.id);
  if (!userInLobby || currentUserLobbyId !== lobby.id) {
    console.log('[Test Cash] Skipping match start - user not in lobby');
    return;
  }

  currentTestCashLobby = lobby;

  // Set active match flags BEFORE hiding screens to prevent unwanted navigation
  activeMatchMode = 'cash-test';
  activeMatchLobbyId = lobby.id;
  console.log('[FIX] Set activeMatchMode to cash-test and activeMatchLobbyId to', lobby.id);

  // Hide ALL Test Cash screens
  console.log('[Test Cash] Hiding all lobby screens');
  if (lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
  hideScreen('lobby-details-screen');
  hideScreen('cash-test-screen');

  // Hide main wrap
  const wrapEl = document.querySelector('.wrap');
  if (wrapEl) {
    wrapEl.style.display = 'none';
    console.log('[Test Cash] Hidden main wrap');
  }

  // Start 10-question trivia match using the SAME engine as Free Play
  console.log('[DEBUG:CASH-COUNTDOWN] ========================================');
  console.log('[DEBUG:CASH-COUNTDOWN] Countdown reached 0 for lobby:', lobby.id);
  console.log('[DEBUG:CASH-COUNTDOWN] Mode:', lobby.mode);
  console.log('[DEBUG:CASH-COUNTDOWN] Category:', lobby.categoryKey);
  console.log('[DEBUG:CASH-COUNTDOWN] Participants:', lobby.participants.length);
  console.log('[DEBUG:CASH-COUNTDOWN] Launching Test Cash match NOW');
  console.log('[DEBUG:CASH-COUNTDOWN] ========================================');
  console.log('[Test Cash] Calling startTestCashMatch...');
  startTestCashMatch(lobby);
}

// === CASH CHALLENGE MATCH START (REAL MONEY) ===
function startCashChallengeMatch(lobby) {
  console.log('[CASH] === STARTING REAL CASH MATCH ===');
  console.log('[CASH] Lobby ID:', lobby.id);
  console.log('[CASH] Category Key:', lobby.categoryKey);

  // Only run on clients who are actually in this lobby
  const userIsParticipant = lobby.participants.some(p => p.id === currentUser?.id);
  if (!userIsParticipant) {
    console.log("[CASH] Not starting match for non-participant on this client", lobby.id);
    return;
  }

  // Check if Free Play's working engine is available
  if (typeof window.getQuestionsForSession !== 'function' || typeof window.startTriviaEngine !== 'function') {
    console.error('[CASH] Free Play trivia engine not available');
    alert('Trivia engine not loaded. Please refresh the page.');
    return;
  }

  const categoryKey = lobby.categoryKey || "mixed";
  const QUESTION_COUNT = 10;

  // Use FREE PLAY's working question loader
  console.log('[CASH] Getting questions from Free Play question bank');
  const questions = window.getQuestionsForSession(categoryKey, QUESTION_COUNT);

  if (!questions || questions.length === 0) {
    console.error('[CASH] No questions available for category:', categoryKey);
    alert('No questions available. Please try a different category.');
    return;
  }

  console.log('[CASH] Loaded', questions.length, 'questions');
  console.log('[CASH] First question:', questions[0].question.substring(0, 50) + '...');

  // Use FREE PLAY's working trivia engine
  console.log('[CASH] Starting Free Play trivia engine');
  window.startTriviaEngine({
    mode: 'cash',
    categoryKey,
    questions,
    onComplete: (score, details) => {
      console.log('[CASH] Match completed! Score:', score);
      onCashChallengeComplete(lobby, score, details);
    }
  });
}

// === TEST CASH CHALLENGE MATCH START (FAKE MONEY) ===
async function startTestCashMatch(lobby) {
  console.log('[DEBUG:CASH-START] ========================================');
  console.log('[DEBUG:CASH-START] startTestCashMatch called');
  console.log('[DEBUG:CASH-START] Lobby ID:', lobby.id);
  console.log('[DEBUG:CASH-START] Mode:', lobby.mode);
  console.log('[DEBUG:CASH-START] Category Key (raw):', lobby.categoryKey);
  console.log('[DEBUG:CASH-START] Category Label:', lobby.categoryLabel || lobby.category);
  console.log('[DEBUG:CASH-START] Participants:', lobby.participants);
  console.log('[DEBUG:CASH-START] ========================================');

  console.log('[CASH-TEST] ========================================');
  console.log('[CASH-TEST] === STARTING MATCH ===');
  console.log('[CASH-TEST] Lobby ID:', lobby.id);
  console.log('[CASH-TEST] Category Label:', lobby.categoryLabel || lobby.category);
  console.log('[CASH-TEST] Category Key (raw):', lobby.categoryKey);

  // FIX: If categoryKey is missing, derive it from categoryLabel/category
  if (!lobby.categoryKey && (lobby.categoryLabel || lobby.category)) {
    const categoryLabel = lobby.categoryLabel || lobby.category;
    lobby.categoryKey = TRIVIA_CATEGORY_MAP[categoryLabel];
    console.log('[CASH-TEST] 🔧 Fixed missing categoryKey - mapped "' + categoryLabel + '" to "' + lobby.categoryKey + '"');
  }

  console.log('[CASH-TEST] Category Key (final):', lobby.categoryKey);
  console.log('[CASH-TEST] ========================================');

  // Only run on clients who are actually in this lobby
  const userIsParticipant = lobby.participants.some(p => p.id === testUser.id);
  if (!userIsParticipant) {
    console.log("[CASH-TEST] ❌ Not starting match - user not participant");
    return;
  }
  console.log('[CASH-TEST] ✓ User is participant');

  // Check if unified trivia engine is available
  console.log('[CASH-TEST] Checking for unified trivia engine...');
  console.log('[CASH-TEST] - window.getQuestionsForSession:', typeof window.getQuestionsForSession);
  console.log('[CASH-TEST] - window.startTriviaSession:', typeof window.startTriviaSession);

  if (typeof window.getQuestionsForSession !== 'function' || typeof window.startTriviaSession !== 'function') {
    console.error('[CASH-TEST] ❌ Unified trivia engine not available!');
    fallbackTestMatch(lobby);
    return;
  }
  console.log('[CASH-TEST] ✓ Unified trivia engine available');

  // FIX: Use sports as final fallback instead of "mixed" (which doesn't exist)
  const categoryKey = lobby.categoryKey || "sports";
  const QUESTION_COUNT = 10;

  console.log('[CASH-TEST] Using categoryKey:', categoryKey);

  // Use unified trivia engine's async question loader (with AI support)
  console.log('[CASH-TEST] Calling getQuestionsForSession("' + categoryKey + '", ' + QUESTION_COUNT + ') - ASYNC');
  const questions = await window.getQuestionsForSession(categoryKey, QUESTION_COUNT);

  console.log('[CASH-TEST] Questions returned:', questions);
  console.log('[CASH-TEST] Questions length:', questions ? questions.length : 'null/undefined');

  if (!questions || questions.length === 0) {
    console.error('[CASH-TEST] ❌ No questions available for category:', categoryKey);
    fallbackTestMatch(lobby);
    return;
  }

  console.log('[CASH-TEST] ✓ Loaded', questions.length, 'questions');
  console.log('[CASH-TEST] First question preview:', questions[0].question.substring(0, 60) + '...');
  console.log('[CASH-TEST] First question full:', questions[0]);

  // Use unified trivia engine with lifecycle management and Kahoot scoring
  console.log('[DEBUG:CASH-START] ========================================');
  console.log('[DEBUG:CASH-START] Questions loaded successfully');
  console.log('[DEBUG:CASH-START] About to call window.startTriviaSession');
  console.log('[DEBUG:CASH-START] - categoryKey:', categoryKey);
  console.log('[DEBUG:CASH-START] - questionCount:', questions.length);
  console.log('[DEBUG:CASH-START] ========================================');

  console.log('[CASH-TEST] ========================================');
  console.log('[CASH-TEST] Calling startTriviaSession NOW');
  console.log('[CASH-TEST] ========================================');

  window.startTriviaSession({
    mode: 'cash-test',
    categoryKey,
    questions,
    lobby: lobby,
    onComplete: (score, details) => {
      console.log('[DEBUG:CASH-END] ========================================');
      console.log('[DEBUG:CASH-END] Test Cash match completed');
      console.log('[DEBUG:CASH-END] Lobby ID:', lobby.id);
      console.log('[DEBUG:CASH-END] Final score:', score);
      console.log('[DEBUG:CASH-END] Details:', details);
      console.log('[DEBUG:CASH-END] ========================================');
      console.log('[CASH-TEST] Match completed! Score:', score);
      onTestCashMatchComplete(score, details, lobby);
    }
  });

  console.log('[DEBUG:CASH-START] startTriviaSession called - should start rendering shortly');
  console.log('[CASH-TEST] startTriviaSession called successfully');
}

// === PLACEHOLDER FOR REAL CASH COMPLETION ===
function onCashChallengeComplete(lobby, score, details) {
  console.log('[CASH] Match complete handler called');
  console.log('[CASH] Score:', score, 'Details:', details);
  // TODO: Implement real cash winner determination and payout
  alert(`Match complete! Your score: ${score} points`);
}

function fallbackTestMatch(lobby) {
  // Fallback to instant result if trivia engine not available
  console.log('[Test Cash] Using fallback match logic');

  // Clear active match flags to allow navigation
  activeMatchMode = null;
  activeMatchLobbyId = null;
  console.log('[Test Cash] Cleared active match flags for fallback');

  const pot = lobby.stake * lobby.participants.length;
  const userIndex = lobby.participants.findIndex(p => !p.isBot);
  const winnerIndex = Math.random() < 0.55 && userIndex !== -1
    ? userIndex
    : Math.floor(Math.random() * lobby.participants.length);

  const winner = lobby.participants[winnerIndex];

  if (winner.isBot) {
    const bot = botProfiles.find(b => b.id === winner.id);
    if (bot) bot.balance += pot;
  } else {
    testUser.balance += pot;
  }

  lobby.status = "finished";
  lobby.winnerId = winner.id;
  lobby.winnerName = winner.username;

  updateTestUserBalanceUI();
  renderTestLobbyList();

  showScreen('cash-test-screen');

  if (lobby.participants.some(p => p.id === testUser.id)) {
    const message = winner.id === testUser.id
      ? `🎉 You WON this match! +$${pot.toFixed(2)} (fake)`
      : `${winner.username} won this match. You lost your $${lobby.stake.toFixed(2)} entry (fake).`;

    setTimeout(() => {
      showToast(message, 5000);
    }, 500);
  }

  currentTestCashLobby = null;
}

// Simulate bot Kahoot scores comparable to human score
function simulateBotKahootScore(baseUserScore) {
  // Bots score in a similar range to the user (±40% variance)
  const variance = (Math.random() - 0.5) * 0.8 * baseUserScore; // ±40%
  const minFloor = Math.floor(baseUserScore * 0.3); // At least 30% of user score
  return Math.max(minFloor, Math.round(baseUserScore + variance));
}

function onTestCashMatchComplete(userScore, userDetails, passedLobby) {
  console.log('[Test Cash] Match complete. User Kahoot score:', userScore, 'Details:', userDetails);

  // Clear active match flags (should already be cleared by finishTriviaSession, but ensure)
  activeMatchMode = null;
  activeMatchLobbyId = null;
  console.log('[FIX] Cleared activeMatchMode in onTestCashMatchComplete');

  // Use passed lobby if available, otherwise fallback
  const lobby = passedLobby || currentTestCashLobby;
  if (!lobby) {
    console.error('[Test Cash] No active lobby found');
    return;
  }
  console.log('[Test Cash] Using lobby:', lobby.id, 'with', lobby.participants.length, 'participants');

  const userCorrectCount = userDetails?.correctAnswers || 0;

  // Simulate bot scores using Kahoot-style range
  const results = [
    { id: testUser.id, username: testUser.username, score: userScore, correctCount: userCorrectCount, isBot: false }
  ];

  lobby.participants.forEach(p => {
    if (p.isBot) {
      const botScore = simulateBotKahootScore(userScore);
      results.push({ id: p.id, username: p.username, score: botScore, isBot: true });
    }
  });

  // Find winner (highest Kahoot score)
  results.sort((a, b) => b.score - a.score);
  const topScore = results[0].score;
  const winners = results.filter(r => r.score === topScore);
  const winner = winners[Math.floor(Math.random() * winners.length)];

  console.log('[Test Cash] Final results:', results.map(r => `${r.username}: ${r.score}`).join(', '));

  // Calculate pot and pay winner
  const pot = lobby.stake * lobby.participants.length;

  if (winner.isBot) {
    const bot = botProfiles.find(b => b.id === winner.id);
    if (bot) bot.balance += pot;
  } else {
    testUser.balance += pot;
  }

  // Update lobby status
  lobby.status = "finished";
  lobby.winnerId = winner.id;
  lobby.winnerName = winner.username;

  updateTestUserBalanceUI();
  renderTestLobbyList();

  // Clear user's lobby membership
  if (currentUserLobbyId === lobby.id) {
    currentUserLobbyId = null;
    console.log('[Test Cash] Match finished for lobby', lobby.id, 'reset currentUserLobbyId');
  }

  // Navigate back to lobby list
  showScreen('cash-test-screen');
  currentTestCashLobby = null;

  // Show end-game modal
  setTimeout(() => {
    showMatchEndModal(winner.id === testUser.id, pot, userScore, userCorrectCount, winner);
  }, 500);
}

function showMatchEndModal(userWon, pot, userScore, correctCount, winner) {
  const modal = document.getElementById('match-end-modal');
  const icon = document.getElementById('match-end-icon');
  const title = document.getElementById('match-end-title');
  const message = document.getElementById('match-end-message');

  if (!modal || !icon || !title || !message) return;

  if (userWon) {
    icon.textContent = '🎉';
    title.textContent = 'Congratulations!';
    title.style.color = 'var(--accent)';
    message.innerHTML = `
      You won the match!<br>
      <strong style="color:var(--accent);font-size:1.3rem">+$${pot.toFixed(2)}</strong> added to your balance<br>
      <span style="color:var(--muted);font-size:0.95rem">Score: ${Math.round(userScore)} pts (${correctCount}/10 correct)</span>
    `;
  } else {
    const scoreDiff = Math.abs(Math.round(winner.score) - Math.round(userScore));
    let encouragement = 'Better luck next time!';
    if (scoreDiff < 500) {
      encouragement = 'You were so close!';
    } else if (scoreDiff < 1000) {
      encouragement = 'Almost there!';
    }

    icon.textContent = '😔';
    title.textContent = encouragement;
    title.style.color = '#ff5757';
    message.innerHTML = `
      ${winner.username} won with ${Math.round(winner.score)} pts<br>
      Your score: <strong>${Math.round(userScore)} pts</strong> (${correctCount}/10 correct)<br>
      <span style="color:#ff5757;font-size:1.1rem">-$${pot.toFixed(2)}</span>
    `;
  }

  modal.style.display = 'flex';
}

function closeMatchEndModal() {
  const modal = document.getElementById('match-end-modal');
  if (modal) modal.style.display = 'none';
}

function startBotSimulation() {
  if (botIntervalId) return;
  botIntervalId = setInterval(() => {
    if (Math.random() < 0.5) {
      const openLobbies = testLobbies.filter(l => l.status === "open" && l.participants.length < l.maxPlayers);
      if (openLobbies.length > 0) {
        const lobby = openLobbies[Math.floor(Math.random() * openLobbies.length)];
        const availableBots = botProfiles.filter(b => b.balance >= lobby.stake && !lobby.participants.some(p => p.id === b.id));
        if (availableBots.length > 0) {
          const bot = availableBots[Math.floor(Math.random() * availableBots.length)];
          joinTestLobby(lobby.id, { ...bot, isBot: true });
          return;
        }
      }
    }

    const availableBots = botProfiles.filter(b => b.balance > 0);
    if (availableBots.length === 0) return;

    const bot = availableBots[Math.floor(Math.random() * availableBots.length)];
    if (bot.balance <= 0) return;

    const categories = ["Politics", "Business & Economics", "Sports", "Music", "Movies", "History", "Geography", "Science", "Pop Culture"];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const stakes = [1, 10, 20, 50, 100];
    const validStakes = stakes.filter(s => s <= bot.balance);
    if (validStakes.length === 0) return;

    const stake = validStakes[Math.floor(Math.random() * validStakes.length)];
    const maxPlayersOptions = [2, 4];
    const maxPlayers = maxPlayersOptions[Math.floor(Math.random() * maxPlayersOptions.length)];

    if (bot.balance >= stake) {
      createTestLobby({
        hostId: bot.id,
        hostName: bot.username,
        category,
        stake,
        maxPlayers,
        isBotHost: true
      });
    }
  }, 4000);
}

function stopBotSimulation() {
  if (botIntervalId) {
    clearInterval(botIntervalId);
    botIntervalId = null;
  }
}

function getCategoryIcon(category) {
  const icons = {
    'Politics': '🏛️',
    'Business & Economics': '💼',
    'Sports': '🏈',
    'Music': '🎵',
    'Movies': '🎬',
    'History': '📜',
    'Geography': '🗺️',
    'Science': '🔬',
    'Pop Culture': '⭐'
  };
  return icons[category] || '🎯';
}

function renderTestLobbyList() {
  const container = document.getElementById('testLobbyList');
  const emptyState = document.getElementById('emptyState');
  const lobbyCount = document.getElementById('lobbyCount');

  if (!container || !lobbyCount) return;

  // Apply multi-select filters
  let lobbies = [...testLobbies];

  // Category filter (OR within group)
  if (lobbyFilters.categories.length > 0) {
    lobbies = lobbies.filter(lobby => lobbyFilters.categories.includes(lobby.category));
  }

  // Stake filter (OR within group)
  if (lobbyFilters.stakes.length > 0) {
    lobbies = lobbies.filter(lobby => lobbyFilters.stakes.includes(lobby.stake));
  }

  // Size filter (OR within group)
  if (lobbyFilters.sizes.length > 0) {
    lobbies = lobbies.filter(lobby => lobbyFilters.sizes.includes(lobby.maxPlayers));
  }

  // Update count with filtered results
  lobbyCount.textContent = `${lobbies.length} ${lobbies.length === 1 ? 'lobby' : 'lobbies'}`;

  if (lobbies.length === 0) {
    container.innerHTML = '';

    // Check if it's because of filters or truly empty
    if (testLobbies.length > 0) {
      // Filtered to zero
      const noResultsEl = document.createElement('div');
      noResultsEl.style.cssText = 'background:var(--card);border:1px dashed var(--line);border-radius:16px;padding:48px 24px;text-align:center';
      noResultsEl.innerHTML = `
        <div style="font-size:3rem;margin-bottom:12px;opacity:0.5">🔍</div>
        <div style="font-size:1.125rem;font-weight:600;color:var(--muted);margin-bottom:8px">No lobbies match your filters</div>
        <div style="font-size:0.875rem;color:var(--dim)">Try changing the category, stake, or lobby size</div>
      `;
      container.appendChild(noResultsEl);
    } else {
      // Actually empty
      if (emptyState) {
        emptyState.style.display = 'block';
        container.appendChild(emptyState);
      }
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  container.innerHTML = '';

  lobbies.forEach(lobby => {
    const card = document.createElement('div');
    card.className = 'lobby-card';

    const statusBadge = lobby.status === 'open' ? 'open' :
                       lobby.status === 'in_progress' ? 'in-progress' : 'finished';
    const statusText = lobby.status === 'open' ? 'OPEN' :
                      lobby.status === 'in_progress' ? 'IN PROGRESS' :
                      `FINISHED`;

    const userInLobby = lobby.participants.some(p => p.id === testUser.id);
    const canJoin = lobby.status === 'open' && !userInLobby && testUser.balance >= lobby.stake;

    let buttonHtml = '';
    if (lobby.status === 'open' || lobby.status === 'full') {
      buttonHtml = `<button class="btn" style="padding:8px 20px;font-size:0.875rem" onclick="window.openLobbyDetailsWrapper('${lobby.id}')">View Lobby</button>`;
    } else {
      buttonHtml = `<button class="btn secondary" style="padding:8px 20px;font-size:0.875rem;opacity:0.5;cursor:not-allowed" disabled>${lobby.status === 'in_progress' ? 'In Progress' : 'Finished'}</button>`;
    }

    card.innerHTML = `
      <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:1.5rem">${getCategoryIcon(lobby.category)}</span>
            <h3 style="font-size:1.25rem;font-weight:700;margin:0;color:var(--txt)">${lobby.category}</h3>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            <span class="lobby-badge ${statusBadge}">${statusText}</span>
            <span style="font-size:0.875rem;color:var(--muted)">Host: ${lobby.hostName}</span>
          </div>
          ${lobby.status === 'finished' ? `<div style="font-size:0.875rem;color:var(--accent);font-weight:600">🏆 Winner: ${lobby.winnerName}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:1.5rem;font-weight:700;color:var(--accent2);margin-bottom:4px">$${lobby.stake}</div>
          <div style="font-size:0.75rem;color:var(--muted)">entry fee</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:12px;border-top:1px solid var(--line)">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:0.875rem;color:var(--muted)">Players:</span>
          <span style="font-size:0.9375rem;font-weight:600;color:var(--txt)">${lobby.participants.length} / ${lobby.maxPlayers}</span>
        </div>
        ${buttonHtml}
      </div>
    `;
    container.appendChild(card);
  });
}

window.openLobbyDetailsWrapper = function(lobbyId) {
  openLobbyDetails(lobbyId);
};

// Close buttons
document.querySelectorAll('.close').forEach(btn => {
  btn.addEventListener('click', e => {
    const sheetName = e.currentTarget.getAttribute('data-close');
    const el = document.getElementById(sheetName);
    if (el) closeSheet(el);
  });
});

// Click outside to close
[authSheet, freeSheet].forEach(sheet => {
  sheet.addEventListener('click', e => {
    if (e.target === sheet) closeSheet(sheet);
  });
});

// Track auth context for redirects after sign-in
let authContext = null; // 'free' or 'cash'

// ===== TEST CASH MODE SETUP =====
if (TEST_CASH_MODE && !REVIEW_MODE) {
  const testCashBtn = document.getElementById('testCashBtn');
  const testCashCard = document.getElementById('testCashCard');
  const testCashBackBtn = document.getElementById('testCashBackBtn');
  const testCreateLobby = document.getElementById('testCreateLobby');
  const addTestFunds = document.getElementById('addTestFunds');

  testCashBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Test Mode] Opening Test Cash Challenge');
    console.log('[Test Mode] Current TEST_CASH_MODE:', TEST_CASH_MODE);
    showScreen('cash-test-screen');
    console.log('[Test Mode] Screen shown');
  });

  testCashCard?.addEventListener('click', (e) => {
    if (e.target !== testCashBtn && !testCashBtn.contains(e.target)) {
      testCashBtn.click();
    }
  });

  testCashBackBtn?.addEventListener('click', () => {
    hideScreen('cash-test-screen');
  });

  addTestFunds?.addEventListener('click', () => {
    testUser.balance += 20;
    updateTestUserBalanceUI();
    showToast('✓ Added $20 to test balance!');
  });

  // Quick stake buttons
  document.querySelectorAll('.stake-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const stake = btn.getAttribute('data-stake');
      document.getElementById('testStake').value = stake;
      document.querySelectorAll('.stake-quick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Initialize default lobbies
  if (testLobbies.length === 0) {
    initDefaultLobbies();
    renderTestLobbyList();
  }

  // Quick Cash Match
  const quickCashBtn = document.getElementById('quickCashBtn');
  quickCashBtn?.addEventListener('click', () => {
    const validStakes = [1, 10, 20, 50, 100];
    const stake = testUser.balance >= 10 ? 10 : (testUser.balance >= 1 ? 1 : null);

    if (!stake) {
      showToast('⚠️ Insufficient balance for Quick Cash Match');
      return;
    }

    const categories = ["Politics", "Business & Economics", "Sports", "Music", "Movies", "History", "Geography", "Science", "Pop Culture"];
    const category = categories[Math.floor(Math.random() * categories.length)];

    const lobby = createTestLobby({
      hostId: testUser.id,
      hostName: testUser.username,
      category,
      stake,
      maxPlayers: 2,
      isBotHost: false
    });

    showToast(`⚡ Quick Cash Match created! ${category} · $${stake}`);

    // Open lobby details to show terms and let user join
    setTimeout(() => openLobbyDetails(lobby.id), 300);
  });

  // Create lobby
  testCreateLobby?.addEventListener('click', () => {
    const category = document.getElementById('testCategory').value;
    const stake = parseInt(document.getElementById('testStake').value);
    const maxPlayers = parseInt(document.getElementById('testMaxPlayers').value);
    const validStakes = [1, 10, 20, 50, 100];

    if (!category || !stake || !maxPlayers) {
      showToast('⚠️ Please fill in all fields');
      return;
    }

    if (!validStakes.includes(stake)) {
      showToast('⚠️ Stake must be $1, $10, $20, $50, or $100');
      return;
    }

    if (stake > testUser.balance) {
      showToast('⚠️ Insufficient balance');
      return;
    }

    if (maxPlayers < 2) {
      showToast('⚠️ Max players must be at least 2');
      return;
    }

    const lobby = createTestLobby({
      hostId: testUser.id,
      hostName: testUser.username,
      category,
      stake,
      maxPlayers,
      isBotHost: false
    });

    showToast(`✓ Lobby created!`);

    // Open lobby details to show terms and let user join
    setTimeout(() => openLobbyDetails(lobby.id), 300);
  });

  // Multi-select filter pill handlers
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const type = pill.getAttribute('data-type');
      const value = pill.getAttribute('data-value');

      if (type === 'category') {
        const index = lobbyFilters.categories.indexOf(value);
        if (index === -1) {
          lobbyFilters.categories.push(value);
          pill.classList.add('active');
        } else {
          lobbyFilters.categories.splice(index, 1);
          pill.classList.remove('active');
        }
      } else if (type === 'stake') {
        const numValue = Number(value);
        const index = lobbyFilters.stakes.indexOf(numValue);
        if (index === -1) {
          lobbyFilters.stakes.push(numValue);
          pill.classList.add('active');
        } else {
          lobbyFilters.stakes.splice(index, 1);
          pill.classList.remove('active');
        }
      } else if (type === 'size') {
        const numValue = Number(value);
        const index = lobbyFilters.sizes.indexOf(numValue);
        if (index === -1) {
          lobbyFilters.sizes.push(numValue);
          pill.classList.add('active');
        } else {
          lobbyFilters.sizes.splice(index, 1);
          pill.classList.remove('active');
        }
      }

      renderTestLobbyList();
    });
  });

  // Lobby Details screen handlers
  const lobbyDetailsBackBtn = document.getElementById('lobbyDetailsBackBtn');
  const lobbyDetailsJoinBtn = document.getElementById('lobbyDetailsJoinBtn');

  console.log('[Init] lobbyDetailsJoinBtn element found:', lobbyDetailsJoinBtn);

  if (lobbyDetailsJoinBtn) {
    console.log('[Init] Adding click listener to Join button');
  } else {
    console.error('[Init] Join button not found in DOM!');
  }

  lobbyDetailsBackBtn?.addEventListener('click', () => {
    // Check if user is in the current lobby
    const lobby = testLobbies.find(l => l.id === currentLobbyId);
    const userInLobby = lobby && lobby.participants.some(p => p.id === testUser.id);

    if (userInLobby) {
      // Show confirmation modal
      const modal = document.getElementById('leave-lobby-modal');
      if (modal) {
        modal.style.display = 'flex';
      }
    } else {
      // User not in lobby, just go back
      if (lobbyRefreshInterval) clearInterval(lobbyRefreshInterval);
      currentLobbyId = null;
      hideScreen('lobby-details-screen');
      showScreen('cash-test-screen');
    }
  });

  // Leave lobby confirmation modal handlers
  const confirmLeaveLobby = document.getElementById('confirmLeaveLobby');
  const cancelLeaveLobby = document.getElementById('cancelLeaveLobby');

  confirmLeaveLobby?.addEventListener('click', () => {
    const modal = document.getElementById('leave-lobby-modal');
    if (modal) modal.style.display = 'none';

    if (currentLobbyId) {
      leaveLobby(currentLobbyId);
    }
  });

  cancelLeaveLobby?.addEventListener('click', () => {
    const modal = document.getElementById('leave-lobby-modal');
    if (modal) modal.style.display = 'none';
  });

  // Match End Modal handlers
  const matchEndHomeBtn = document.getElementById('match-end-home-btn');
  const matchEndRematchBtn = document.getElementById('match-end-rematch-btn');
  const matchEndDepositBtn = document.getElementById('match-end-deposit-btn');

  matchEndHomeBtn?.addEventListener('click', () => {
    closeMatchEndModal();
    hideScreen('cash-test-screen');
    const wrapEl = document.querySelector('.wrap');
    if (wrapEl) wrapEl.style.display = 'block';
    showScreen('fp-picker-screen');
  });

  matchEndRematchBtn?.addEventListener('click', () => {
    closeMatchEndModal();
    showToast('Rematch feature coming soon!');
  });

  matchEndDepositBtn?.addEventListener('click', () => {
    closeMatchEndModal();
    showToast('Deposit feature coming soon!');
  });

  if (lobbyDetailsJoinBtn) {
    lobbyDetailsJoinBtn.addEventListener('click', () => {
      console.log('[Join Button] ========== CLICKED ==========');
      console.log('[Join Button] currentLobbyId:', currentLobbyId);
      console.log('[Join Button] testUser:', testUser);

    if (!currentLobbyId) {
      console.error('[Join Button] No currentLobbyId!');
      showToast('⚠️ Error: No lobby selected');
      return;
    }

    const lobby = testLobbies.find(l => l.id === currentLobbyId);
    console.log('[Join Button] Found lobby:', lobby);
    console.log('[Join Button] User balance:', testUser.balance, 'Lobby stake:', lobby?.stake);

    const success = joinTestLobby(currentLobbyId, {
      id: testUser.id,
      username: testUser.username,
      isBot: false,
      hasAcceptedTerms: false,
      isReady: false
    });

    console.log('[Join Button] joinTestLobby returned:', success);

    if (success) {
      showToast('✓ Joined lobby successfully!');
    } else {
      showToast('⚠️ Unable to join lobby');
    }
    });
    console.log('[Init] Join button click listener attached successfully');
  } else {
    console.error('[Init] Could not attach listener - button element is null');
  }

  // Wire up Terms & Ready buttons
  const acceptTermsBtn = document.getElementById('lobby-accept-terms-btn');
  const readyBtn = document.getElementById('lobby-ready-btn');

  if (acceptTermsBtn) {
    acceptTermsBtn.addEventListener('click', () => {
      if (currentLobbyId) {
        handleAcceptTerms(currentLobbyId);
      }
    });
  }

  if (readyBtn) {
    readyBtn.addEventListener('click', () => {
      if (currentLobbyId) {
        handleReadyUp(currentLobbyId);
      }
    });
  }
} else if (REVIEW_MODE) {
  // Hide Test Cash mode elements in review mode
  console.log('[Review Mode] Hiding Test Cash mode');
  const testCashCard = document.getElementById('testCashCard');
  const testCashBtn = document.getElementById('testCashBtn');
  if (testCashCard) testCashCard.style.display = 'none';
  if (testCashBtn) testCashBtn.style.display = 'none';
}

// ===== FREE PLAY BUTTONS =====
const freeBtn = document.getElementById('freeBtn');
const freeCard = document.getElementById('freeCard');

freeBtn.addEventListener('click', () => {
  console.log('[Free Play] Opening choice sheet');
  openSheet(freeSheet);
});

freeCard.addEventListener('click', (e) => {
  if (e.target !== freeBtn && !freeBtn.contains(e.target)) {
    freeBtn.click();
  }
});

// Guest button - handled by freeplay-flow.js
// (Flow script intercepts this and shows setup screen first)

// Free sign-in button - optional auth, then go to free play
document.getElementById('freeSignInBtn').addEventListener('click', async () => {
  console.log('[Free Play] Sign-in requested');
  authContext = 'free';
  closeSheet(freeSheet);
  openSheet(authSheet);
});

// ===== CASH PLAY GATE =====
const cashBtn = document.getElementById('cashBtn');
const cashCard = document.getElementById('cashCard');

// Hide Cash mode in review mode
if (REVIEW_MODE || !window.APP_CONFIG?.CASH_MODE_CONFIG?.enabled) {
  console.log('[Review Mode] Hiding Cash Play mode');
  if (cashCard) cashCard.style.display = 'none';
  if (cashBtn) cashBtn.style.display = 'none';
} else {
  cashBtn.addEventListener('click', startCashGate);

  cashCard.addEventListener('click', (e) => {
    if (e.target !== cashBtn && !cashBtn.contains(e.target)) {
      cashBtn.click();
    }
  });
}

async function startCashGate(){
  console.log('[Cash Gate] Starting...');
  authContext = 'cash';
  cashBtn.disabled = true;
  cashBtn.innerHTML = '⏱ Checking... <span class="spinner"></span>';

  try {
    let session = (await sb.auth.getSession()).data.session;

    if (!session) {
      console.log('[Cash Gate] No session - opening auth');
      cashBtn.disabled = false;
      cashBtn.innerHTML = 'Enter Cash Play';
      openSheet(authSheet);
      await waitForAuthChange();
      closeSheet(authSheet);
      session = (await sb.auth.getSession()).data.session;
      if (!session) {
        console.log('[Cash Gate] User cancelled');
        return;
      }
    }

    console.log('[Cash Gate] Authenticated, checking verification...');

    const { data: { user }, error: userError } = await sb.auth.getUser();
    if (userError || !user) {
      showToast('Failed to get user info. Try again.');
      cashBtn.disabled = false;
      cashBtn.innerHTML = 'Enter Cash Play';
      return;
    }

    const emailOk = !!user.email_confirmed_at;
    const phoneOk = !!user.phone && !!user.phone_confirmed_at;

    console.log('[Cash Gate] Email verified:', emailOk, 'Phone verified:', phoneOk);

    if (!emailOk && !phoneOk) {
      showToast('⚠️ Verify your email or phone first. Check your inbox/SMS.', 5000);
      cashBtn.disabled = false;
      cashBtn.innerHTML = 'Enter Cash Play';
      return;
    }

    console.log('[Cash Gate] Contact verified, checking KYC...');

    // Check KYC status
    const { data: kycRecord } = await sb
      .from('user_kyc_status')
      .select('kyc_status')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('[Cash Gate] KYC record:', kycRecord);

    if (kycRecord?.kyc_status === 'verified') {
      console.log('[Cash Gate] KYC verified - entering');
      showToast('✓ Verified! Entering Cash Play...');
      setTimeout(() => { window.location.href = '/online.html'; }, 800);
      return;
    }

    // Not verified → redirect to identity verification page
    console.log('[Cash Gate] KYC not verified - redirecting to verify-identity');
    showToast('🔒 Identity verification required...');

    setTimeout(() => {
      window.location.href = '/verify-identity.html';
    }, 800);

  } catch (error) {
    console.error('[Cash Gate] Error:', error);
    showToast('⚠️ Something went wrong. Try again.');
    cashBtn.disabled = false;
    cashBtn.innerHTML = 'Enter Cash Play';
  }
}

// Import and initialize the auth UI module
import { initAuth } from '/src/auth/auth-ui.js';

// Initialize auth forms
initAuth();

// Import NEW category-based question bank (SINGLE SOURCE OF TRUTH)
import '/src/questions-new.js';

// Import UNIFIED trivia engine with AI, lifecycle, and Kahoot scoring
import '/src/trivia-engine-unified.js';

// Import and initialize Free Play flow
import '/src/freeplay-flow.js';

// Import and initialize Offline Wizard
import '/src/offline-wizard.js';

// ===== WIRE EXIT BUTTON FOR TRIVIA =====
document.addEventListener('DOMContentLoaded', () => {
  const exitBtn = document.getElementById('ogBackToMenu');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (typeof window.exitTriviaSession === 'function') {
        window.exitTriviaSession();
      }
    });
    console.log('[Trivia] Exit button wired to exitTriviaSession');
  }


  // ===== RENDER FREE PLAY CATEGORIES DYNAMICALLY =====
  // Use TRIVIA_CATEGORIES as single source of truth for both Free Play and Cash
  const renderFreePlayCategories = () => {
    const catsGrid = document.getElementById('catsGrid');
    if (!catsGrid || !window.TRIVIA_CATEGORIES) {
      console.warn('[Categories] Cannot render - missing catsGrid or TRIVIA_CATEGORIES');
      return;
    }

    console.log('[Categories] Rendering Free Play categories from TRIVIA_CATEGORIES');

    // Clear existing content
    catsGrid.innerHTML = '';

    // Render each category from the canonical list
    window.TRIVIA_CATEGORIES.forEach(cat => {
      const tile = document.createElement('div');
      tile.className = cat.key === 'mixed' ? 'wizard-tile wizard-tile-selected' : 'wizard-tile';
      tile.setAttribute('data-cat', cat.key);

      tile.innerHTML = `
        <div class="cat-icon">${cat.icon}</div>
        <div class="cat-title">${cat.label}</div>
      `;

      catsGrid.appendChild(tile);
    });

    console.log('[Categories] Rendered', window.TRIVIA_CATEGORIES.length, 'categories');
  };

  // Render when TRIVIA_CATEGORIES becomes available
  if (window.TRIVIA_CATEGORIES) {
    renderFreePlayCategories();
  } else {
    // Wait for questions-new.js to load
    const checkInterval = setInterval(() => {
      if (window.TRIVIA_CATEGORIES) {
        clearInterval(checkInterval);
        renderFreePlayCategories();
      }
    }, 100);
    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
});

// ===== WAIT FOR AUTH =====
function waitForAuthChange(){
  return new Promise((resolve)=>{
    const sub = sb.auth.onAuthStateChange((evt, sess)=>{
      if (sess) {
        try { sub.data.subscription.unsubscribe(); } catch{}
        resolve();
      }
    });
    setTimeout(()=>{ try { sub.data.subscription.unsubscribe(); } catch{} resolve(); }, 120000);
  });
}

// ===== PRODUCTION AUTH GUARD - Handle OAuth returns and session restoration =====
(async () => {
  console.log('[Auth Guard] Initializing production auth guard...');

  const params = new URLSearchParams(window.location.search);
  const hasOAuthParams = params.has('code') || params.has('access_token') || params.has('error');

  // Check if we've already shown the OAuth success message
  const oauthSuccessShown = sessionStorage.getItem('bd_oauth_success_shown');

  if (hasOAuthParams) {
    console.log('[Auth Guard] ========================================');
    console.log('[Auth Guard] OAuth redirect detected');
    console.log('[Auth Guard] URL params:', {
      hasCode: params.has('code'),
      hasAccessToken: params.has('access_token'),
      hasError: params.has('error'),
      error: params.get('error'),
      errorDescription: params.get('error_description')
    });
    console.log('[Auth Guard] ========================================');

    // Check for OAuth errors
    if (params.has('error')) {
      const error = params.get('error');
      const description = params.get('error_description');
      console.error('[Auth Guard] ❌ OAuth error:', error, description);
      showToast('⚠️ Sign in failed: ' + (description || error));

      // Clean up URL (remove query params and hash)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return;
    }

    // OAuth success - let Supabase handle the session
    try {
      console.log('[Auth Guard] ✅ Returned from Google');
      console.log('[Auth Guard] Waiting for session to be established...');

      // Give Supabase time to process the OAuth callback
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session }, error } = await sb.auth.getSession();

      if (error) {
        console.error('[Auth Guard] ❌ Error getting session:', error);

        // Only show error toast if we haven't shown success yet
        if (!oauthSuccessShown) {
          showToast('⚠️ Authentication error. Please try again.');
        }
      } else if (session) {
        console.log('[Auth Guard] ✅ Supabase session created');
        console.log('[Auth Guard] User:', session.user.email);
        console.log('[Auth Guard] Provider:', session.user.app_metadata?.provider);

        // Only show success toast once per OAuth flow
        if (!oauthSuccessShown) {
          showToast('✓ Signed in as ' + session.user.email);
          sessionStorage.setItem('bd_oauth_success_shown', 'true');
          console.log('[Auth Guard] Success toast shown and guard set');
        } else {
          console.log('[Auth Guard] Success toast already shown this session, skipping');
        }
      } else {
        console.warn('[Auth Guard] ⚠️ No session found after OAuth redirect');

        // Only show error toast if we haven't shown success yet
        if (!oauthSuccessShown) {
          showToast('⚠️ Sign in incomplete. Please try again.');
        }
      }

      // Clean up URL (remove query params and hash)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      console.log('[Auth Guard] URL cleaned');

      // Handle context-based redirects
      if (session && authContext === 'free') {
        console.log('[Auth Guard] Redirecting to free play after auth');
        setTimeout(() => { window.location.href = '/offline.html'; }, 1000);
      }
      // If authContext was 'cash', startCashGate will handle the flow

    } catch (err) {
      console.error('[Auth Guard] ❌ Exception during session handling:', err);

      // Only show error toast if we haven't shown success yet
      if (!oauthSuccessShown) {
        showToast('⚠️ Authentication error. Please try again.');
      }

      // Clean up URL (remove query params and hash)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  } else {
    // Normal page load - check for existing session
    console.log('[Auth Guard] Normal page load - checking for existing session');

    try {
      const { data: { session }, error } = await sb.auth.getSession();

      if (error) {
        console.error('[Auth Guard] Error checking session:', error);
      } else if (session) {
        console.log('[Auth Guard] ✅ Existing session found');
        console.log('[Auth Guard] User:', session.user.email);
        console.log('[Auth Guard] Session valid until:', new Date(session.expires_at * 1000).toLocaleString());
        console.log('[Auth Guard] No OAuth params - skipping success toast (normal page load)');
      } else {
        console.log('[Auth Guard] No existing session (user not logged in)');
      }
    } catch (err) {
      console.error('[Auth Guard] Exception checking session:', err);
    }
  }

  console.log('[Auth Guard] Initialization complete');
})();

// ===== DATABASE CONNECTION VERIFICATION =====
(async function verifyDatabaseConnection() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFYING DATABASE CONNECTION...');

    const { supabase } = await import('./supabase-client.js');

    // Query questions table to verify connection to real data
    const { data, error, count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database verification FAILED:', error.message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    console.log('✅ DATABASE CONNECTION VERIFIED');
    console.log('📊 Questions in database:', count);
    console.log('✅ Expected: ~2800+ questions');
    console.log('✅ Status:', count > 2000 ? 'CONNECTED TO REAL DATA ✓' : 'WARNING: Low question count');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Database verification exception:', err);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
})();
