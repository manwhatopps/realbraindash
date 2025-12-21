import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const state = {
  currentScreen: 'landing',
  user: null,
  selectedMode: null,
  selectedCategory: null,
  currentLobby: null,
  currentMatch: null,
  gameState: {
    currentQuestion: 0,
    score: 0,
    answers: [],
    timeRemaining: 0
  },
  settings: {
    soundEnabled: true,
    notificationsEnabled: true
  }
};

const CATEGORIES = [
  { id: 'general', name: 'General Knowledge', icon: '🧠', difficulty: 'Easy' },
  { id: 'science', name: 'Science', icon: '🔬', difficulty: 'Medium' },
  { id: 'sports', name: 'Sports', icon: '⚽', difficulty: 'Easy' },
  { id: 'history', name: 'History', icon: '📜', difficulty: 'Medium' },
  { id: 'music', name: 'Music', icon: '🎵', difficulty: 'Easy' },
  { id: 'business', name: 'Business & Economics', icon: '💼', difficulty: 'Hard' }
];

function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

function showError(title, message) {
  const modal = document.getElementById('error-modal');
  document.getElementById('error-title').textContent = title;
  document.getElementById('error-message').textContent = message;
  modal.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-modal').classList.add('hidden');
}

function navigate(screen, data = {}) {
  state.currentScreen = screen;
  Object.assign(state, data);
  render();
}

function render() {
  const app = document.getElementById('app');

  switch(state.currentScreen) {
    case 'landing':
      app.innerHTML = renderLandingScreen();
      break;
    case 'auth':
      app.innerHTML = renderAuthScreen();
      break;
    case 'mode-selection':
      app.innerHTML = renderModeSelection();
      break;
    case 'terms-consent':
      app.innerHTML = renderTermsConsent();
      break;
    case 'category-selection':
      app.innerHTML = renderCategorySelection();
      break;
    case 'lobby-browser':
      app.innerHTML = renderLobbyBrowser();
      break;
    case 'lobby':
      app.innerHTML = renderLobby();
      break;
    case 'countdown':
      app.innerHTML = renderCountdown();
      break;
    case 'question':
      app.innerHTML = renderQuestion();
      break;
    case 'leaderboard':
      app.innerHTML = renderLeaderboard();
      break;
    case 'results':
      app.innerHTML = renderResults();
      break;
    case 'wallet':
      app.innerHTML = renderWallet();
      break;
    case 'profile':
      app.innerHTML = renderProfile();
      break;
    case 'global-leaderboard':
      app.innerHTML = renderGlobalLeaderboard();
      break;
    case 'settings':
      app.innerHTML = renderSettings();
      break;
    default:
      app.innerHTML = renderLandingScreen();
  }

  attachEventListeners();
}

function renderLandingScreen() {
  return `
    <div class="screen landing-screen">
      <div class="container-narrow">
        <h1 class="landing-title">BrainDash Royale</h1>
        <p class="landing-tagline">Think Fast. Win Cash.</p>

        <div class="button-group">
          <button class="btn btn-primary btn-large" data-action="play-free">Play Free</button>
          <button class="btn btn-primary btn-large" data-action="play-online">Play Online</button>
          <button class="btn btn-primary btn-large" data-action="play-friends">Play With Friends</button>
          <button class="btn btn-danger btn-large" data-action="cash-challenge">Cash Challenge</button>
        </div>

        <div style="margin: 2rem 0;">
          ${state.user ?
            `<button class="btn btn-outline" data-action="profile">My Profile</button>` :
            `<button class="btn btn-outline" data-action="auth">Login / Sign Up</button>`
          }
        </div>

        <div class="footer-links">
          <a href="#" class="footer-link" data-action="rules">View Rules</a>
          <a href="#" class="footer-link" data-action="terms">Terms of Service</a>
          <a href="#" class="footer-link" data-action="privacy">Privacy Policy</a>
          <a href="#" class="footer-link" data-action="responsible">Responsible Play</a>
        </div>
      </div>
    </div>
  `;
}

function renderAuthScreen() {
  return `
    <div class="screen" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); justify-content: center; align-items: center; padding: 2rem;">
      <div class="auth-container">
        <h2 style="text-align: center;">Welcome Back</h2>

        <form id="auth-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="auth-email" required placeholder="Enter your email">
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="auth-password" required placeholder="Enter your password">
          </div>

          <button type="submit" class="btn btn-primary btn-large">Sign In</button>
        </form>

        <div class="divider">or</div>

        <div class="social-btns">
          <button class="btn btn-outline btn-large" data-action="google-auth">Continue with Google</button>
          <button class="btn btn-outline btn-large" data-action="apple-auth">Continue with Apple</button>
          <button class="btn btn-outline btn-large" data-action="guest-play">Play as Guest</button>
        </div>

        <div style="text-align: center; margin-top: 1.5rem;">
          <button class="btn btn-outline" data-action="back">Back to Home</button>
        </div>
      </div>
    </div>
  `;
}

function renderModeSelection() {
  return `
    <div class="screen" style="background: var(--gray-50); padding: 2rem;">
      <div class="container">
        <h2>Select Game Mode</h2>
        <p style="color: var(--gray-600); margin-bottom: 2rem;">Choose how you want to play</p>

        <div class="card-grid">
          <div class="card mode-card" data-action="select-mode" data-mode="free">
            <div class="mode-icon">🎮</div>
            <h3 class="mode-title">Free Play</h3>
            <p class="mode-description">Practice and have fun with no stakes. Perfect for learning!</p>
          </div>

          <div class="card mode-card" data-action="select-mode" data-mode="online">
            <div class="mode-icon">🌐</div>
            <h3 class="mode-title">Online Matchmaking</h3>
            <p class="mode-description">Get matched with players of similar skill level instantly.</p>
          </div>

          <div class="card mode-card" data-action="select-mode" data-mode="friends">
            <div class="mode-icon">👥</div>
            <h3 class="mode-title">Play With Friends</h3>
            <p class="mode-description">Create a private lobby and invite your friends to play.</p>
          </div>

          <div class="card mode-card cash-challenge" data-action="select-mode" data-mode="cash">
            <div class="mode-icon">💰</div>
            <h3 class="mode-title">Cash Challenge</h3>
            <p class="mode-description">Compete for real money prizes. Entry fees apply.</p>
            <div class="risk-disclaimer">⚠️ Real Money - 18+ Only</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <button class="btn btn-outline" data-action="back">Back</button>
        </div>
      </div>
    </div>
  `;
}

function renderTermsConsent() {
  const entryFee = 5.00;
  const platformFee = 0.25;
  const totalCost = entryFee + platformFee;
  const potentialPayout = entryFee * 4 * 0.9;

  return `
    <div class="screen" style="background: var(--gray-50); justify-content: center; align-items: center; padding: 2rem;">
      <div class="card" style="max-width: 600px;">
        <h2>Match Terms & Consent</h2>

        <div style="background: var(--gray-50); padding: 1.5rem; border-radius: var(--radius-md); margin: 1.5rem 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <span style="font-weight: 600;">Entry Fee:</span>
            <span style="font-size: 1.25rem; font-weight: 700;">$${entryFee.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <span style="font-weight: 600;">Platform Fee:</span>
            <span style="color: var(--gray-600);">$${platformFee.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 2px solid var(--gray-300);">
            <span style="font-weight: 700; font-size: 1.125rem;">Total Cost:</span>
            <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">$${totalCost.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-300);">
            <span style="font-weight: 600; color: var(--success);">Potential Payout:</span>
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--success);">$${potentialPayout.toFixed(2)}</span>
          </div>
        </div>

        <div style="background: var(--accent); color: var(--white); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <strong>⚠️ Risk Disclosure:</strong> You may lose your entry fee if you do not win. Only play with money you can afford to lose.
        </div>

        <div class="checkbox-group" style="margin: 1.5rem 0;">
          <input type="checkbox" id="accept-terms" class="checkbox-input">
          <label for="accept-terms" style="font-weight: 600;">I accept the terms of this match and understand the risks involved.</label>
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button class="btn btn-outline" data-action="back" style="flex: 1;">Cancel</button>
          <button class="btn btn-primary" data-action="accept-terms" id="continue-btn" disabled style="flex: 1;">Continue to Match</button>
        </div>
      </div>
    </div>
  `;
}

function renderCategorySelection() {
  return `
    <div class="screen" style="background: var(--gray-50); padding: 2rem;">
      <div class="container">
        <h2>Select Category</h2>
        <p style="color: var(--gray-600); margin-bottom: 2rem;">Choose the topic you want to play</p>

        <div class="category-grid">
          ${CATEGORIES.map(cat => `
            <div class="category-card" data-action="select-category" data-category="${cat.id}">
              <div class="category-icon">${cat.icon}</div>
              <div class="category-name">${cat.name}</div>
              <div style="font-size: 0.875rem; color: var(--gray-600); margin-top: 0.5rem;">${cat.difficulty}</div>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <button class="btn btn-outline" data-action="back">Back</button>
        </div>
      </div>
    </div>
  `;
}

function renderLobbyBrowser() {
  const mockLobbies = [
    { id: 1, category: 'General Knowledge', entryFee: 'Free', players: '2/4', timePerQ: '8s' },
    { id: 2, category: 'Sports', entryFee: '$5.00', players: '3/4', timePerQ: '10s' },
    { id: 3, category: 'Science', entryFee: 'Free', players: '1/4', timePerQ: '8s' },
    { id: 4, category: 'History', entryFee: '$10.00', players: '2/6', timePerQ: '12s' }
  ];

  return `
    <div class="screen" style="background: var(--gray-50); padding: 2rem;">
      <div class="container">
        <h2>Available Lobbies</h2>
        <p style="color: var(--gray-600); margin-bottom: 2rem;">Join an existing match or create your own</p>

        <div style="margin-bottom: 1.5rem;">
          <button class="btn btn-primary" data-action="create-lobby">Create New Lobby</button>
        </div>

        <div class="lobby-list">
          ${mockLobbies.map(lobby => `
            <div class="lobby-item">
              <div class="lobby-info">
                <div class="lobby-category">${lobby.category}</div>
                <div class="lobby-details">
                  ${lobby.entryFee} • ${lobby.players} Players • ${lobby.timePerQ} per question
                </div>
              </div>
              <button class="btn btn-primary" data-action="join-lobby" data-lobby-id="${lobby.id}">Join</button>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <button class="btn btn-outline" data-action="back">Back</button>
        </div>
      </div>
    </div>
  `;
}

function renderLobby() {
  const mockPlayers = [
    { id: 1, name: 'Player 1', ready: true },
    { id: 2, name: 'Player 2', ready: true },
    { id: 3, name: 'Bot 1', ready: true, isBot: true },
    { id: 4, name: 'You', ready: false, isYou: true }
  ];

  const allReady = mockPlayers.every(p => p.ready);

  return `
    <div class="screen" style="background: var(--gray-50); padding: 2rem;">
      <div class="container-narrow">
        <div class="card">
          <h2>Game Lobby</h2>

          <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); margin: 1.5rem 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 600;">Category:</span>
              <span>General Knowledge</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 600;">Entry Fee:</span>
              <span>$5.00</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">Players:</span>
              <span>${mockPlayers.length}/4</span>
            </div>
          </div>

          <h3>Players</h3>
          <div class="player-list">
            ${mockPlayers.map(player => `
              <div class="player-item">
                <div>
                  <div class="player-name">${player.name}${player.isYou ? ' (You)' : ''}${player.isBot ? ' 🤖' : ''}</div>
                </div>
                <div class="player-status ${player.ready ? 'ready' : 'waiting'}">
                  ${player.ready ? 'Ready' : 'Waiting'}
                </div>
              </div>
            `).join('')}
          </div>

          ${!mockPlayers.find(p => p.isYou)?.ready ? `
            <button class="btn btn-primary btn-large" data-action="ready-up" style="width: 100%; margin-top: 1.5rem;">
              Ready Up
            </button>
          ` : `
            <div style="text-align: center; color: var(--gray-600); margin-top: 1.5rem;">
              ${allReady ? 'Starting match...' : 'Waiting for other players...'}
            </div>
          `}

          <button class="btn btn-outline" data-action="leave-lobby" style="width: 100%; margin-top: 1rem;">
            Leave Lobby
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderCountdown() {
  return `
    <div class="screen countdown-screen">
      <div class="container-narrow" style="text-align: center;">
        <h2 style="margin-bottom: 2rem;">Get Ready!</h2>
        <div style="background: rgba(255,255,255,0.1); padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
          <div style="font-size: 1.25rem; margin-bottom: 1rem;">Category: General Knowledge</div>
          <div style="font-size: 1rem; opacity: 0.9;">10 Questions</div>
        </div>
        <div class="countdown-number" id="countdown-num">3</div>
      </div>
    </div>
  `;
}

function renderQuestion() {
  const question = {
    number: 1,
    total: 10,
    text: 'What is the capital of France?',
    answers: ['London', 'Paris', 'Berlin', 'Madrid'],
    timeLimit: 8
  };

  const circumference = 2 * Math.PI * 36;

  return `
    <div class="screen question-screen">
      <div class="container">
        <div class="question-header">
          <div class="question-number">Question ${question.number}/${question.total}</div>
          <div class="timer-container">
            <svg class="timer-circle" viewBox="0 0 80 80">
              <circle class="timer-bg" cx="40" cy="40" r="36"></circle>
              <circle
                class="timer-progress"
                cx="40"
                cy="40"
                r="36"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="0"
                id="timer-progress"
              ></circle>
            </svg>
            <div class="timer-text" id="timer-text">${question.timeLimit}</div>
          </div>
        </div>

        <div class="question-text">${question.text}</div>

        <div class="answers-grid">
          ${question.answers.map((answer, i) => `
            <button class="answer-btn" data-action="select-answer" data-answer="${i}">
              ${answer}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderLeaderboard() {
  const players = [
    { rank: 1, name: 'Player 2', score: 950 },
    { rank: 2, name: 'You', score: 920 },
    { rank: 3, name: 'Bot 1', score: 880 },
    { rank: 4, name: 'Player 1', score: 850 }
  ];

  return `
    <div class="screen leaderboard-screen">
      <div class="container">
        <h2 class="leaderboard-title">Current Standings</h2>

        <div class="leaderboard-list">
          ${players.map(player => `
            <div class="leaderboard-item">
              <div class="leaderboard-rank ${player.rank === 1 ? 'first' : player.rank === 2 ? 'second' : player.rank === 3 ? 'third' : ''}">#${player.rank}</div>
              <div class="leaderboard-name">${player.name}</div>
              <div class="leaderboard-score">${player.score}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderResults() {
  const results = {
    placement: 2,
    score: 920,
    payout: 9.00,
    winner: 'Player 2',
    players: [
      { rank: 1, name: 'Player 2', score: 950 },
      { rank: 2, name: 'You', score: 920 },
      { rank: 3, name: 'Bot 1', score: 880 }
    ]
  };

  return `
    <div class="screen results-screen">
      <div class="container">
        <h1>Match Complete!</h1>

        <div class="podium">
          ${results.players.slice(0, 3).map((player, i) => `
            <div class="podium-place ${i === 0 ? 'first' : i === 1 ? 'second' : 'third'}">
              <div class="podium-rank">${player.rank}</div>
              <div class="podium-name">${player.name}</div>
              <div class="podium-score">${player.score}</div>
            </div>
          `).join('')}
        </div>

        ${results.payout > 0 ? `
          <div class="payout-summary">
            <h3>Your Winnings</h3>
            <div class="payout-amount">$${results.payout.toFixed(2)}</div>
            <p style="color: var(--gray-600); margin-top: 0.5rem;">Added to your wallet</p>
          </div>
        ` : ''}

        <div class="button-group" style="margin-top: 2rem;">
          <button class="btn btn-primary btn-large" data-action="play-again">Play Again</button>
          <button class="btn btn-outline" data-action="home">Return Home</button>
        </div>
      </div>
    </div>
  `;
}

function renderWallet() {
  const mockTransactions = [
    { id: 1, type: 'Match Win', amount: 18.00, date: '2024-01-20', status: 'completed', positive: true },
    { id: 2, type: 'Match Entry', amount: -5.00, date: '2024-01-20', status: 'completed', positive: false },
    { id: 3, type: 'Deposit', amount: 50.00, date: '2024-01-19', status: 'completed', positive: true },
    { id: 4, type: 'Withdrawal', amount: -25.00, date: '2024-01-18', status: 'pending', positive: false }
  ];

  return `
    <div class="screen wallet-screen">
      <div class="container-narrow">
        <div class="wallet-balance">
          <h2>Your Balance</h2>
          <div class="balance-amount">$87.50</div>
          <div class="wallet-actions">
            <button class="btn btn-primary" data-action="deposit">Deposit</button>
            <button class="btn btn-secondary" data-action="withdraw">Withdraw</button>
          </div>
        </div>

        <div class="transaction-list">
          <h3>Transaction History</h3>
          ${mockTransactions.map(txn => `
            <div class="transaction-item">
              <div>
                <div class="transaction-type">${txn.type}</div>
                <div class="transaction-date">${txn.date}</div>
              </div>
              <div style="text-align: right;">
                <div class="transaction-amount ${txn.positive ? 'positive' : 'negative'}">
                  ${txn.positive ? '+' : ''}$${Math.abs(txn.amount).toFixed(2)}
                </div>
                <div class="status-badge ${txn.status}">${txn.status}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-outline" data-action="home" style="width: 100%; margin-top: 2rem;">
          Back to Home
        </button>
      </div>
    </div>
  `;
}

function renderProfile() {
  const stats = {
    gamesPlayed: 47,
    winRate: 64,
    accuracy: 82
  };

  return `
    <div class="screen" style="background: var(--gray-50); padding: 2rem;">
      <div class="container-narrow">
        <div class="card" style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;">
            👤
          </div>
          <h2 style="margin-bottom: 0.5rem;">${state.user?.email || 'Guest Player'}</h2>
          <p style="color: var(--gray-600);">Member since Jan 2024</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.gamesPlayed}</div>
            <div class="stat-label">Games Played</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.winRate}%</div>
            <div class="stat-label">Win Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.accuracy}%</div>
            <div class="stat-label">Accuracy</div>
          </div>
        </div>

        <div class="card" style="margin-top: 2rem;">
          <h3>Recent Matches</h3>
          <div style="color: var(--gray-600); margin-top: 1rem;">No recent matches to display</div>
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button class="btn btn-outline" data-action="settings" style="flex: 1;">Settings</button>
          <button class="btn btn-primary" data-action="home" style="flex: 1;">Back to Home</button>
        </div>
      </div>
    </div>
  `;
}

function renderGlobalLeaderboard() {
  const mockLeaderboard = [
    { rank: 1, name: 'ProGamer123', score: 15420 },
    { rank: 2, name: 'BrainMaster', score: 14890 },
    { rank: 3, name: 'QuizWhiz', score: 14230 },
    { rank: 4, name: 'You', score: 12450, isYou: true },
    { rank: 5, name: 'SmartPlayer', score: 11980 }
  ];

  return `
    <div class="screen" style="background: var(--gray-50); padding: 2rem;">
      <div class="container-narrow">
        <h2>Global Leaderboard</h2>

        <div class="tabs">
          <button class="tab active" data-action="leaderboard-tab" data-tab="daily">Daily</button>
          <button class="tab" data-action="leaderboard-tab" data-tab="weekly">Weekly</button>
          <button class="tab" data-action="leaderboard-tab" data-tab="alltime">All-Time</button>
        </div>

        <div class="card">
          ${mockLeaderboard.map(player => `
            <div class="leaderboard-item" style="${player.isYou ? 'background: var(--primary); color: white; border-radius: var(--radius-md); margin: 0.5rem 0;' : ''}">
              <div class="leaderboard-rank ${player.rank === 1 ? 'first' : player.rank === 2 ? 'second' : player.rank === 3 ? 'third' : ''}" style="${player.isYou ? 'color: white;' : ''}">#${player.rank}</div>
              <div class="leaderboard-name" style="${player.isYou ? 'color: white;' : ''}">${player.name}</div>
              <div class="leaderboard-score" style="${player.isYou ? 'color: white;' : ''}">${player.score}</div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-outline" data-action="home" style="width: 100%; margin-top: 2rem;">
          Back to Home
        </button>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="screen" style="background: var(--gray-50); padding: 2rem;">
      <div class="container-narrow">
        <h2>Settings</h2>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-label">Sound Effects</div>
            <label class="toggle-switch">
              <input type="checkbox" class="toggle-input" ${state.settings.soundEnabled ? 'checked' : ''} data-setting="sound">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-label">Notifications</div>
            <label class="toggle-switch">
              <input type="checkbox" class="toggle-input" ${state.settings.notificationsEnabled ? 'checked' : ''} data-setting="notifications">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <button class="btn btn-outline" data-action="view-terms">Terms of Service</button>
          </div>

          <div class="setting-item">
            <button class="btn btn-outline" data-action="view-privacy">Privacy Policy</button>
          </div>

          ${state.user ? `
            <div class="setting-item">
              <button class="btn btn-danger" data-action="logout">Logout</button>
            </div>
          ` : ''}
        </div>

        <button class="btn btn-outline" data-action="back" style="width: 100%; margin-top: 2rem;">
          Back
        </button>
      </div>
    </div>
  `;
}

function attachEventListeners() {
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', handleAction);
  });

  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', handleAuth);
  }

  const termsCheckbox = document.getElementById('accept-terms');
  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', (e) => {
      document.getElementById('continue-btn').disabled = !e.target.checked;
    });
  }

  const errorClose = document.getElementById('error-close');
  if (errorClose) {
    errorClose.addEventListener('click', hideError);
  }

  document.querySelectorAll('[data-setting]').forEach(el => {
    el.addEventListener('change', handleSettingChange);
  });
}

async function handleAction(e) {
  e.preventDefault();
  const action = e.currentTarget.dataset.action;
  const mode = e.currentTarget.dataset.mode;
  const category = e.currentTarget.dataset.category;
  const lobbyId = e.currentTarget.dataset.lobbyId;

  switch(action) {
    case 'play-free':
    case 'play-online':
    case 'play-friends':
      if (!state.user) {
        state.selectedMode = action;
        navigate('auth');
      } else {
        navigate('mode-selection');
      }
      break;

    case 'cash-challenge':
      if (!state.user) {
        showError('Login Required', 'You must be logged in to play cash challenges.');
      } else {
        state.selectedMode = 'cash';
        navigate('terms-consent');
      }
      break;

    case 'auth':
      navigate('auth');
      break;

    case 'guest-play':
      state.user = { email: 'guest@braindash.com', isGuest: true };
      navigate('mode-selection');
      break;

    case 'back':
    case 'home':
      navigate('landing');
      break;

    case 'select-mode':
      state.selectedMode = mode;
      if (mode === 'cash') {
        navigate('terms-consent');
      } else {
        navigate('category-selection');
      }
      break;

    case 'accept-terms':
      navigate('category-selection');
      break;

    case 'select-category':
      state.selectedCategory = category;
      navigate('lobby-browser');
      break;

    case 'create-lobby':
    case 'join-lobby':
      navigate('lobby');
      break;

    case 'ready-up':
      setTimeout(() => navigate('countdown'), 500);
      setTimeout(() => startCountdown(), 500);
      break;

    case 'leave-lobby':
      navigate('lobby-browser');
      break;

    case 'select-answer':
      handleAnswerSelection(e.currentTarget);
      break;

    case 'play-again':
      navigate('category-selection');
      break;

    case 'profile':
      navigate('profile');
      break;

    case 'settings':
      navigate('settings');
      break;

    case 'logout':
      state.user = null;
      navigate('landing');
      break;

    case 'rules':
    case 'terms':
    case 'privacy':
    case 'responsible':
      showError('Information', 'This feature will be available soon.');
      break;

    default:
      console.log('Unhandled action:', action);
  }
}

async function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  showLoading();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    state.user = data.user;
    hideLoading();
    navigate('mode-selection');
  } catch (error) {
    hideLoading();
    showError('Login Failed', error.message);
  }
}

function handleSettingChange(e) {
  const setting = e.target.dataset.setting;
  const value = e.target.checked;

  if (setting === 'sound') {
    state.settings.soundEnabled = value;
  } else if (setting === 'notifications') {
    state.settings.notificationsEnabled = value;
  }
}

function startCountdown() {
  let count = 3;
  const countdownNum = document.getElementById('countdown-num');

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownNum.textContent = count;
    } else {
      clearInterval(interval);
      navigate('question');
      startQuestionTimer();
    }
  }, 1000);
}

function startQuestionTimer() {
  let timeLeft = 8;
  const timerText = document.getElementById('timer-text');
  const timerProgress = document.getElementById('timer-progress');
  const circumference = 2 * Math.PI * 36;

  const interval = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;

    const progress = timeLeft / 8;
    const offset = circumference * (1 - progress);
    timerProgress.style.strokeDashoffset = offset;

    if (timeLeft <= 0) {
      clearInterval(interval);
      setTimeout(() => navigate('leaderboard'), 500);
      setTimeout(() => navigate('results'), 2500);
    }
  }, 1000);
}

function handleAnswerSelection(button) {
  const allButtons = document.querySelectorAll('.answer-btn');
  allButtons.forEach(btn => btn.disabled = true);

  button.classList.add('selected');

  setTimeout(() => {
    const correctIndex = 1;
    allButtons[correctIndex].classList.add('correct');
    if (button !== allButtons[correctIndex]) {
      button.classList.add('incorrect');
    }
  }, 500);

  setTimeout(() => {
    navigate('leaderboard');
    setTimeout(() => navigate('results'), 2000);
  }, 2000);
}

supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    state.user = session.user;
  } else {
    state.user = null;
  }
  render();
});

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    state.user = session.user;
  }
  render();
}

init();
