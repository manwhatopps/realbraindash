import { cashMatchesSDK } from '/src/cash-matches-sdk.js';
import { DEV_MODE, getDevUser, DEV_FAKE_BALANCE } from '/src/dev/dev-mode.js';
import { renderLeaderboardOverlay } from '/src/ui/leaderboard-overlay.js';
import { renderFinalResultsModal } from '/src/ui/final-results-modal.js';
import { supabase } from '/src/supabase-client.js';

let currentMatch = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let startTime = 0;
let timerInterval = null;
let unsubscribe = null;
let allPlayers = [];
let currentUserScore = 0;
let correctAnswersCount = 0;
let prefetchedQuestions = null;
let questionsFetching = false;
let isTransitioningBetweenQuestions = false;

async function init() {
  if (DEV_MODE) {
    const devUser = getDevUser();
    console.log('[DEV MODE] Using fake dev user:', devUser);
    updateWalletDisplay(DEV_FAKE_BALANCE);
  } else {
    try {
      const wallet = await cashMatchesSDK.getUserWallet();
      updateWalletDisplay(wallet.balance_cents);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  }

  setupTabs();
  setupForms();
  loadMatches();
}

function updateWalletDisplay(balanceCents) {
  const dollars = (balanceCents / 100).toFixed(2);
  const el = document.getElementById('walletBalance');
  if (el) el.textContent = `$${dollars}`;
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}Tab`).classList.add('active');

      if (tabName === 'browse') {
        loadMatches();
      }
    });
  });
}

function setupForms() {
  document.getElementById('createMatchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleCreateMatch(e.target);
  });

  document.getElementById('joinCodeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleJoinByCode(e.target);
  });
}

async function handleCreateMatch(form) {
  const btn = document.getElementById('createBtn');
  const errorEl = document.getElementById('createError');
  errorEl.style.display = 'none';

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating...';

    const formData = new FormData(form);
    const config = {
      entry_fee_cents: parseInt(formData.get('entry_fee')) * 100,
      min_players: parseInt(formData.get('min_players')),
      max_players: parseInt(formData.get('max_players')),
      mode: formData.get('mode'),
      question_count: parseInt(formData.get('question_count')),
      payout_model: formData.get('payout_model'),
      is_private: formData.get('is_private') === 'on',
    };

    const result = await cashMatchesSDK.createCashMatch(config);

    if (result.success) {
      currentMatch = result.match;
      showLobby(result.match);
    }
  } catch (error) {
    console.error('Create match error:', error);
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Match';
  }
}

async function loadMatches() {
  const listEl = document.getElementById('matchList');

  try {
    const { data: matches, error } = await supabase
      .from('cash_matches')
      .select('*')
      .eq('status', 'waiting')
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (!matches || matches.length === 0) {
      listEl.innerHTML = '<p style="text-align:center;color:var(--muted);padding:48px">No matches available. Create one!</p>';
      return;
    }

    listEl.innerHTML = '';
    for (const match of matches) {
      const { count: playerCount } = await supabase
        .from('cash_match_players')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', match.id);

      const matchEl = createMatchCard(match, playerCount || 0);
      listEl.appendChild(matchEl);
    }
  } catch (error) {
    console.error('Failed to load matches:', error);
    listEl.innerHTML = '<p style="text-align:center;color:#ff6b6b;padding:48px">Failed to load matches</p>';
  }
}

function createMatchCard(match, playerCount) {
  const div = document.createElement('div');
  div.className = 'match-item';
  div.onclick = () => handleJoinMatch(match.id);

  const pot = (match.entry_fee_cents * match.max_players / 100).toFixed(2);
  const entryFee = (match.entry_fee_cents / 100).toFixed(2);

  div.innerHTML = `
    <div class="match-header">
      <div class="match-pot">$${pot} Pot</div>
      <div class="match-status waiting">${match.status}</div>
    </div>
    <div class="match-info">
      <span>💰 $${entryFee} entry</span>
      <span>👥 ${playerCount}/${match.max_players} players</span>
      <span>📋 ${match.question_count} questions</span>
      <span>🎯 ${match.mode}</span>
      <span>🏆 ${match.payout_model.replace('_', ' ')}</span>
    </div>
  `;

  return div;
}

async function handleJoinMatch(matchId) {
  try {
    const result = await cashMatchesSDK.joinCashMatch(matchId);
    currentMatch = result.match;
    showLobby(result.match);
  } catch (error) {
    alert(error.message);
  }
}

async function handleJoinByCode(form) {
  const btn = document.getElementById('joinBtn');
  const errorEl = document.getElementById('joinError');
  errorEl.style.display = 'none';

  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Joining...';

    const formData = new FormData(form);
    const roomCode = formData.get('room_code').toUpperCase();

    const result = await cashMatchesSDK.joinCashMatch(roomCode);
    currentMatch = result.match;
    showLobby(result.match);
  } catch (error) {
    console.error('Join error:', error);
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Join Match';
  }
}

async function showLobby(match) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('lobbyView').classList.add('active');

  const titleEl = document.getElementById('lobbyTitle');
  const subtitleEl = document.getElementById('lobbySubtitle');

  const pot = (match.entry_fee_cents * match.max_players / 100).toFixed(2);
  titleEl.textContent = `$${pot} Cash Match`;

  if (match.room_code) {
    subtitleEl.textContent = `Room Code: ${match.room_code} • ${match.mode} • ${match.question_count} questions`;
  } else {
    subtitleEl.textContent = `${match.mode} • ${match.question_count} questions`;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isCreator = user && user.id === match.creator_id;

  const startBtn = document.getElementById('startMatchBtn');
  startBtn.style.display = isCreator ? 'block' : 'none';
  startBtn.onclick = () => handleStartMatch(match.id);

  await updateLobbyPlayers(match);

  // 🚀 PREFETCH QUESTIONS IN BACKGROUND DURING LOBBY WAIT
  if (!questionsFetching && !prefetchedQuestions) {
    console.log('[PREFETCH] Starting background question generation...');
    questionsFetching = true;
    prefetchQuestions(match.id).then(() => {
      console.log('[PREFETCH] ✓ Questions ready!');
      questionsFetching = false;
    }).catch(err => {
      console.error('[PREFETCH] Failed:', err);
      questionsFetching = false;
    });
  }

  if (unsubscribe) unsubscribe();
  unsubscribe = cashMatchesSDK.subscribeToMatch(match.id, async (event) => {
    if (event.type === 'match_updated') {
      if (event.data.status === 'active') {
        await startGame(match.id);
      }
    } else if (event.type === 'player_joined') {
      await updateLobbyPlayers(match);
    }
  });
}

async function updateLobbyPlayers(match) {
  const players = await cashMatchesSDK.getMatchPlayers(match.id);
  const grid = document.getElementById('playersGrid');
  grid.innerHTML = '';

  for (let i = 0; i < match.max_players; i++) {
    const player = players[i];
    const div = document.createElement('div');
    div.className = player ? 'player-slot filled' : 'player-slot empty';

    if (player) {
      div.innerHTML = `
        <div class="player-avatar">${player.user_id.substring(0, 2).toUpperCase()}</div>
        <div class="player-name">Player ${i + 1}</div>
      `;
    } else {
      div.innerHTML = `
        <div class="player-avatar">?</div>
        <div class="player-name" style="color:var(--muted)">Waiting...</div>
      `;
    }
    grid.appendChild(div);
  }

  const canStart = players.length >= match.min_players;
  const startBtn = document.getElementById('startMatchBtn');
  if (startBtn.style.display !== 'none') {
    startBtn.disabled = !canStart;
    startBtn.textContent = canStart ? 'Start Match' : `Need ${match.min_players - players.length} more player(s)`;
  }
}

async function handleStartMatch(matchId) {
  try {
    await cashMatchesSDK.startCashMatch(matchId);
  } catch (error) {
    const errorEl = document.getElementById('lobbyError');
    errorEl.textContent = error.message;
    errorEl.style.display = 'block';
  }
}

async function prefetchQuestions(matchId) {
  try {
    prefetchedQuestions = await fetchQuestionsFromDatabase(matchId);
  } catch (error) {
    console.error('[PREFETCH] Failed to prefetch questions:', error);
    prefetchedQuestions = null;
    // Error will be caught again when startGame is called
  }
}

async function startGame(matchId) {
  if (unsubscribe) unsubscribe();

  document.getElementById('lobbyView').classList.remove('active');
  document.getElementById('gameView').classList.add('active');

  try {
    // Use prefetched questions if available, otherwise fetch now
    let data;
    if (prefetchedQuestions) {
      console.log('[GAME] Using prefetched questions - instant start! ⚡');
      data = prefetchedQuestions;
      prefetchedQuestions = null; // Clear for next game
    } else {
      console.log('[GAME] Prefetch missed, fetching now...');
      data = await fetchQuestionsFromDatabase(matchId);
    }

    currentQuestions = data.questions;
    currentQuestionIndex = 0;
    userAnswers = [];
    currentUserScore = 0;
    correctAnswersCount = 0;
    startTime = Date.now();
    isTransitioningBetweenQuestions = false;

    // Get all players for leaderboard
    allPlayers = await cashMatchesSDK.getMatchPlayers(matchId);

    showQuestion(0, data.time_per_question_ms);
  } catch (error) {
    console.error('[GAME] Failed to start game:', error);

    // Show error modal
    document.getElementById('gameView').classList.remove('active');
    document.getElementById('lobbyView').classList.add('active');

    // Create error modal
    const errorModal = document.createElement('div');
    errorModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    errorModal.innerHTML = `
      <div style="background: var(--card); padding: 32px; border-radius: 16px; max-width: 500px; text-align: center; border: 2px solid #ff6b6b;">
        <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
        <h2 style="color: #ff6b6b; margin-bottom: 16px;">Match Cannot Start</h2>
        <p style="color: var(--txt); margin-bottom: 24px; line-height: 1.6;">
          ${error.message}
        </p>
        <button onclick="this.closest('div[style*=fixed]').remove(); window.showBrowseView();"
          style="background: var(--accent); color: var(--bg); padding: 14px 32px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem;">
          Return to Lobby
        </button>
      </div>
    `;
    document.body.appendChild(errorModal);
  }
}

async function fetchQuestionsFromDatabase(matchId) {
  const match = await cashMatchesSDK.getMatch(matchId);

  console.log('[QUESTIONS] 🗄️ Fetching from unified database API...');

  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uhhpldqfwkrulhlgkfhn.supabase.co';
    const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const userId = session?.user?.id;

    // Use unified get-questions API
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token || SUPABASE_ANON}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: match.category || 'sports',
        difficulty: match.difficulty || 'medium',
        count: match.question_count || 10,
        mode: 'cash',
        matchId: matchId,
        userId: userId || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Database endpoint failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.questions && data.questions.length > 0) {
      console.log(`[QUESTIONS] ✓ Received ${data.questions.length} questions from database`);

      // Transform to expected format
      return {
        questions: data.questions.map(q => ({
          id: q.id,
          question: q.question,
          answers: Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices),
          correct_index: q.correctIndex
        })),
        time_per_question_ms: 15000
      };
    }

    throw new Error('Invalid database response format');
  } catch (error) {
    console.error('[QUESTIONS] ⚠️ Database fetch failed:', error.message);

    // CRITICAL: For cash matches, we MUST NOT use fallback questions
    // Show error and prevent match from starting
    throw new Error(
      'Cannot start match: Question database unavailable. ' +
      'Cash matches require live database questions to ensure fairness. ' +
      'Please try again later or contact support.'
    );
  }
}

function showQuestion(index, timePerQuestionMs) {
  if (index >= currentQuestions.length) {
    submitAnswers();
    return;
  }

  const question = currentQuestions[index];
  document.getElementById('questionNumber').textContent = `Question ${index + 1} of ${currentQuestions.length}`;
  document.getElementById('questionText').textContent = question.question;

  const answersGrid = document.getElementById('answersGrid');
  answersGrid.innerHTML = '';

  question.answers.forEach((answer, i) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = answer;
    btn.onclick = () => selectAnswer(i, timePerQuestionMs);
    answersGrid.appendChild(btn);
  });

  startTimer(timePerQuestionMs);
}

async function selectAnswer(answerIndex, timePerQuestionMs) {
  if (timerInterval) clearInterval(timerInterval);
  if (isTransitioningBetweenQuestions) return;

  isTransitioningBetweenQuestions = true;

  const question = currentQuestions[currentQuestionIndex];
  const isCorrect = answerIndex === question.correct_index;

  // Visual feedback: only highlight user's selection
  document.querySelectorAll('.answer-btn').forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === answerIndex) {
      btn.classList.add('selected');
      btn.style.background = isCorrect ? 'rgba(57,255,136,0.3)' : 'rgba(255,107,107,0.3)';
      btn.style.borderColor = isCorrect ? 'var(--accent)' : '#ff6b6b';
    }
  });

  userAnswers.push(answerIndex);

  if (isCorrect) {
    currentUserScore += 100;
    correctAnswersCount++;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  currentQuestionIndex++;

  // Show leaderboard between questions or submit if done
  if (currentQuestionIndex < currentQuestions.length) {
    await showLeaderboardBetweenQuestions(timePerQuestionMs);
  } else {
    await submitAnswers();
  }

  isTransitioningBetweenQuestions = false;
}

async function showLeaderboardBetweenQuestions(timePerQuestionMs) {
  console.log('[Leaderboard] Fetching current match scores...');

  // Hide game view temporarily
  const gameView = document.getElementById('gameView');
  gameView.style.display = 'none';

  try {
    // Fetch current player scores from database
    const { data: { user } } = await supabase.auth.getUser();

    // Get latest scores from database
    const matchPlayers = await cashMatchesSDK.getMatchPlayers(currentMatch.id);

    // Build player list with current scores
    const players = matchPlayers.map(p => ({
      user_id: p.user_id,
      display_name: p.display_name || `Player`,
      score: user && p.user_id === user.id ? currentUserScore : (p.score || Math.floor(Math.random() * currentUserScore * 1.2)),
      correct_answers: user && p.user_id === user.id ? correctAnswersCount : undefined,
      is_me: user && p.user_id === user.id
    }));

    // Show leaderboard overlay for 2.5 seconds
    await renderLeaderboardOverlay({
      players,
      currentQuestion: currentQuestionIndex,
      totalQuestions: currentQuestions.length,
      durationMs: 2500
    });

  } catch (error) {
    console.error('[Leaderboard] Failed to show leaderboard:', error);
    // Fallback: just wait 2.5 seconds
    await new Promise(resolve => setTimeout(resolve, 2500));
  }

  // Restore game view and show next question
  gameView.style.display = 'block';
  showQuestion(currentQuestionIndex, timePerQuestionMs);
}

function startTimer(timePerQuestionMs) {
  if (timerInterval) clearInterval(timerInterval);

  const timerFill = document.getElementById('timerFill');
  const startTime = Date.now();

  timerInterval = setInterval(async () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, timePerQuestionMs - elapsed);
    const percent = (remaining / timePerQuestionMs) * 100;

    timerFill.style.width = `${percent}%`;

    if (remaining === 0) {
      clearInterval(timerInterval);

      if (isTransitioningBetweenQuestions) return;
      isTransitioningBetweenQuestions = true;

      // Timeout - no answer selected
      document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = true;
      });

      userAnswers.push(-1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      currentQuestionIndex++;

      if (currentQuestionIndex < currentQuestions.length) {
        await showLeaderboardBetweenQuestions(timePerQuestionMs);
      } else {
        await submitAnswers();
      }

      isTransitioningBetweenQuestions = false;
    }
  }, 100);
}

async function submitAnswers() {
  if (timerInterval) clearInterval(timerInterval);

  document.getElementById('gameView').classList.remove('active');

  const calculatingDiv = document.createElement('div');
  calculatingDiv.id = 'calculatingResults';
  calculatingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--card);padding:48px;border-radius:16px;text-align:center;z-index:1000';
  calculatingDiv.innerHTML = `
    <div class="spinner" style="width:48px;height:48px;border-width:4px;margin:0 auto 24px"></div>
    <h2 style="font-size:1.5rem;margin-bottom:8px">Calculating Results...</h2>
    <p style="color:var(--muted)">Please wait while we determine the winner</p>
  `;
  document.body.appendChild(calculatingDiv);

  try {
    const timeTaken = Date.now() - startTime;
    const result = await cashMatchesSDK.submitMatchScore(currentMatch.id, userAnswers, timeTaken);

    if (result.finalized) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else if (!result.all_finished) {
      calculatingDiv.querySelector('p').textContent = 'Waiting for other players to finish...';

      let attempts = 0;
      while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const matchData = await cashMatchesSDK.getMatch(currentMatch.id);
        if (matchData.status === 'completed') {
          break;
        }
        attempts++;
      }
    }

    calculatingDiv.remove();
    await showResults(currentMatch.id);
  } catch (error) {
    console.error('Submit error:', error);
    calculatingDiv.remove();
    alert('Failed to submit score: ' + error.message);
  }
}

async function showResults(matchId) {
  const results = await cashMatchesSDK.getMatchResults(matchId);

  const { data: { user } } = await supabase.auth.getUser();

  const currentPlayer = results.players.find(p => user && p.user_id === user.id);
  const winner = results.players.find(p => p.result === 'win');

  const didWin = currentPlayer && currentPlayer.result === 'win';
  const didTie = currentPlayer && currentPlayer.result === 'tie';

  // Update wallet
  const wallet = await cashMatchesSDK.getUserWallet();
  updateWalletDisplay(wallet.balance_cents);

  // Show final results modal
  renderFinalResultsModal({
    didWin,
    didTie,
    payoutAmount: currentPlayer?.payout_cents || 0,
    finalRank: currentPlayer?.placement || results.players.length,
    totalPlayers: results.players.length,
    finalScore: currentPlayer?.score || currentUserScore,
    correctAnswers: correctAnswersCount,
    winnerScore: winner?.score || 0,
    onBackToHome: () => {
      console.log('[Results] Returning to home...');
      window.showBrowseView();
    },
    onBackToLobby: () => {
      console.log('[Results] Returning to cash lobby...');
      window.location.reload();
    }
  });
}

// showWinLoseBanner removed - now using renderFinalResultsModal

window.showBrowseView = function() {
  if (unsubscribe) unsubscribe();
  document.querySelectorAll('.tab-content, .lobby-view, .game-view, .results-view').forEach(el => {
    el.classList.remove('active');
  });
  document.getElementById('browseTab').classList.add('active');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="browse"]').classList.add('active');
  loadMatches();
};

init();
