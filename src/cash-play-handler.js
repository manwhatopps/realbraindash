import { supabase } from './supabase-client.js';

const CATEGORY_MAP = {
  politics: 'Politics',
  business: 'Business & Economics',
  sports: 'Sports',
  music: 'Music',
  movies: 'Movies',
  history: 'History',
  geography: 'Geography',
  science: 'Science',
  pop_culture: 'Pop Culture'
};

let currentUser = null;
let selectedStake = 100;
let lobbySubscription = null;
let participantsSubscription = null;
let currentLobbyId = null;
let currentMatchId = null;

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/';
    return;
  }

  currentUser = session.user;
  setupEventListeners();
}

function setupEventListeners() {
  window.goHome = () => {
    window.location.href = '/';
  };

  window.showChoiceScreen = () => {
    showScreen('cash-choice-screen');
  };

  window.showLobbyList = () => {
    showScreen('cash-lobby-list-screen');
    loadLobbies();
  };

  window.selectStake = (stake) => {
    selectedStake = stake;
    document.querySelectorAll('.stake-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.stake) === stake);
    });
  };

  window.createLobby = createLobby;
  window.joinLobby = joinLobby;
  window.leaveLobby = leaveLobby;
  window.acceptTerms = acceptTerms;
  window.setReady = setReady;
  window.returnToLobbies = returnToLobbies;

  selectStake(100);
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

async function createLobby() {
  const category = document.getElementById('create-category').value;
  const maxPlayers = parseInt(document.getElementById('create-max-players').value);

  if (maxPlayers < 2 || maxPlayers > 12) {
    alert('Max players must be between 2 and 12');
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Player';

    const { data: lobby, error } = await supabase
      .from('cash_lobbies')
      .insert({
        host_user_id: user.id,
        host_name: username,
        category_key: category,
        category_label: CATEGORY_MAP[category],
        stake_cents: selectedStake,
        max_players: maxPlayers,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    const { error: participantError } = await supabase
      .from('cash_lobby_participants')
      .insert({
        lobby_id: lobby.id,
        user_id: user.id,
        username: username,
        has_accepted_terms: false,
        is_ready: false
      });

    if (participantError) throw participantError;

    viewLobby(lobby.id);
  } catch (error) {
    console.error('Error creating lobby:', error);
    alert('Failed to create lobby: ' + error.message);
  }
}

async function loadLobbies() {
  try {
    const { data: lobbies, error } = await supabase
      .from('cash_lobbies')
      .select('*, cash_lobby_participants(count)')
      .in('status', ['open', 'full', 'countdown'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderLobbies(lobbies);
    subscribeToLobbies();
  } catch (error) {
    console.error('Error loading lobbies:', error);
    document.getElementById('lobby-list').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Failed to load lobbies</p>
      </div>
    `;
  }
}

function renderLobbies(lobbies) {
  const lobbyList = document.getElementById('lobby-list');

  if (!lobbies || lobbies.length === 0) {
    lobbyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎮</div>
        <p>No active lobbies. Create one to get started!</p>
      </div>
    `;
    return;
  }

  lobbyList.innerHTML = lobbies.map(lobby => {
    const participantCount = lobby.cash_lobby_participants?.[0]?.count || 0;
    const stakeDollars = (lobby.stake_cents / 100).toFixed(2);

    return `
      <div class="lobby-card">
        <div class="lobby-info">
          <div class="lobby-title">
            <span>${lobby.category_label}</span>
            <span class="status-badge status-${lobby.status}">${lobby.status}</span>
          </div>
          <div class="lobby-details">
            <div class="lobby-detail">💰 $${stakeDollars}</div>
            <div class="lobby-detail">👤 ${participantCount}/${lobby.max_players}</div>
            <div class="lobby-detail">🎯 Host: ${lobby.host_name}</div>
          </div>
        </div>
        <button class="btn-primary" onclick="viewLobby('${lobby.id}')" style="width: auto; min-width: 120px;">
          View Lobby
        </button>
      </div>
    `;
  }).join('');
}

function subscribeToLobbies() {
  if (lobbySubscription) {
    lobbySubscription.unsubscribe();
  }

  lobbySubscription = supabase
    .channel('cash_lobbies_channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'cash_lobbies'
    }, () => {
      loadLobbies();
    })
    .subscribe();
}

async function viewLobby(lobbyId) {
  currentLobbyId = lobbyId;
  showScreen('cash-lobby-details-screen');
  await loadLobbyDetails();
  subscribeToLobby(lobbyId);
}

async function loadLobbyDetails() {
  try {
    const { data: lobby, error: lobbyError } = await supabase
      .from('cash_lobbies')
      .select('*')
      .eq('id', currentLobbyId)
      .single();

    if (lobbyError) throw lobbyError;

    const { data: participants, error: participantsError } = await supabase
      .from('cash_lobby_participants')
      .select('*')
      .eq('lobby_id', currentLobbyId)
      .order('joined_at');

    if (participantsError) throw participantsError;

    const isParticipant = participants.some(p => p.user_id === currentUser.id);
    const myParticipant = participants.find(p => p.user_id === currentUser.id);
    const stakeDollars = (lobby.stake_cents / 100).toFixed(2);

    let content = `
      <h2>${lobby.category_label}</h2>
      <div style="margin: 20px 0;">
        <div class="lobby-details">
          <div class="lobby-detail">💰 Stake: $${stakeDollars}</div>
          <div class="lobby-detail">👥 ${participants.length}/${lobby.max_players} Players</div>
          <div class="lobby-detail">🎯 Host: ${lobby.host_name}</div>
          <div class="lobby-detail"><span class="status-badge status-${lobby.status}">${lobby.status}</span></div>
        </div>
      </div>

      <div class="participants-list">
        <h3 style="margin-bottom: 15px;">Participants</h3>
        ${participants.map(p => `
          <div class="participant-item">
            <span class="participant-name">${p.username}${p.user_id === lobby.host_user_id ? ' 👑' : ''}</span>
            <div class="participant-status">
              ${p.has_accepted_terms ? '✅ Terms' : '⏳ Terms'}
              ${p.is_ready ? '✅ Ready' : '⏳ Ready'}
              <div class="status-indicator ${p.is_ready ? 'ready' : ''}"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    if (!isParticipant && lobby.status === 'open') {
      content += `
        <button class="btn-primary btn-success" onclick="joinLobby()">
          Join Lobby ($${stakeDollars})
        </button>
      `;
    } else if (isParticipant) {
      if (!myParticipant.has_accepted_terms) {
        content += `
          <div class="terms-checkbox">
            <input type="checkbox" id="terms-accept" />
            <label for="terms-accept">
              I agree to the cash play terms and conditions. I understand that this is a real money game and I am responsible for any applicable taxes and fees.
            </label>
          </div>
          <button class="btn-primary" onclick="acceptTerms()">I Agree & Continue</button>
        `;
      } else if (!myParticipant.is_ready) {
        content += `
          <button class="btn-primary btn-success" onclick="setReady()">
            I'm Ready!
          </button>
        `;
      } else {
        const allReady = participants.every(p => p.has_accepted_terms && p.is_ready);
        const readyCount = participants.filter(p => p.is_ready).length;

        content += `
          <div style="text-align: center; padding: 30px;">
            <h3>✅ You're Ready!</h3>
            <p style="margin: 10px 0; opacity: 0.8;">
              ${readyCount}/${participants.length} players ready
            </p>
            ${allReady ? '<p style="color: #38ef7d; font-weight: 600;">Starting soon...</p>' : ''}
          </div>
        `;
      }
    }

    document.getElementById('lobby-details-content').innerHTML = content;

    if (isParticipant) {
      checkAndStartCountdown(lobby, participants);
    }
  } catch (error) {
    console.error('Error loading lobby details:', error);
    alert('Failed to load lobby: ' + error.message);
  }
}

function subscribeToLobby(lobbyId) {
  if (participantsSubscription) {
    participantsSubscription.unsubscribe();
  }

  participantsSubscription = supabase
    .channel(`lobby_${lobbyId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'cash_lobby_participants',
      filter: `lobby_id=eq.${lobbyId}`
    }, () => {
      loadLobbyDetails();
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'cash_lobbies',
      filter: `id=eq.${lobbyId}`
    }, (payload) => {
      if (payload.new.status === 'countdown') {
        startCountdownOverlay();
      }
      loadLobbyDetails();
    })
    .subscribe();
}

async function joinLobby() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Player';

    const { error } = await supabase
      .from('cash_lobby_participants')
      .insert({
        lobby_id: currentLobbyId,
        user_id: user.id,
        username: username,
        has_accepted_terms: false,
        is_ready: false
      });

    if (error) {
      if (error.code === '23505') {
        alert('You are already in this lobby');
      } else {
        throw error;
      }
    }

    await updateLobbyStatus();
    await loadLobbyDetails();
  } catch (error) {
    console.error('Error joining lobby:', error);
    alert('Failed to join lobby: ' + error.message);
  }
}

async function leaveLobby() {
  if (!currentLobbyId) {
    showScreen('cash-lobby-list-screen');
    return;
  }

  try {
    const { error } = await supabase
      .from('cash_lobby_participants')
      .delete()
      .eq('lobby_id', currentLobbyId)
      .eq('user_id', currentUser.id);

    if (error) throw error;

    if (participantsSubscription) {
      participantsSubscription.unsubscribe();
      participantsSubscription = null;
    }

    currentLobbyId = null;
    showScreen('cash-lobby-list-screen');
    await updateLobbyStatus();
  } catch (error) {
    console.error('Error leaving lobby:', error);
    alert('Failed to leave lobby: ' + error.message);
  }
}

async function acceptTerms() {
  const checkbox = document.getElementById('terms-accept');
  if (!checkbox || !checkbox.checked) {
    alert('Please accept the terms and conditions to continue');
    return;
  }

  try {
    const { error } = await supabase
      .from('cash_lobby_participants')
      .update({ has_accepted_terms: true })
      .eq('lobby_id', currentLobbyId)
      .eq('user_id', currentUser.id);

    if (error) throw error;

    await loadLobbyDetails();
  } catch (error) {
    console.error('Error accepting terms:', error);
    alert('Failed to accept terms: ' + error.message);
  }
}

async function setReady() {
  try {
    const { error } = await supabase
      .from('cash_lobby_participants')
      .update({ is_ready: true })
      .eq('lobby_id', currentLobbyId)
      .eq('user_id', currentUser.id);

    if (error) throw error;

    await loadLobbyDetails();
  } catch (error) {
    console.error('Error setting ready:', error);
    alert('Failed to set ready: ' + error.message);
  }
}

async function updateLobbyStatus() {
  const { data: lobby } = await supabase
    .from('cash_lobbies')
    .select('max_players, status')
    .eq('id', currentLobbyId)
    .single();

  const { data: participants } = await supabase
    .from('cash_lobby_participants')
    .select('id')
    .eq('lobby_id', currentLobbyId);

  if (!lobby || !participants) return;

  const participantCount = participants.length;
  let newStatus = lobby.status;

  if (participantCount >= lobby.max_players && lobby.status === 'open') {
    newStatus = 'full';
  } else if (participantCount < lobby.max_players && lobby.status === 'full') {
    newStatus = 'open';
  }

  if (newStatus !== lobby.status) {
    await supabase
      .from('cash_lobbies')
      .update({ status: newStatus })
      .eq('id', currentLobbyId);
  }
}

async function checkAndStartCountdown(lobby, participants) {
  if (participants.length < 2) return;
  if (!['open', 'full'].includes(lobby.status)) return;

  const allReady = participants.every(p => p.has_accepted_terms && p.is_ready);

  if (allReady) {
    const { error } = await supabase
      .from('cash_lobbies')
      .update({
        status: 'countdown',
        countdown_started_at: new Date().toISOString()
      })
      .eq('id', currentLobbyId)
      .eq('status', lobby.status);

    if (!error) {
      startCountdownOverlay();
    }
  }
}

function startCountdownOverlay() {
  const overlay = document.getElementById('countdown-overlay');
  const numberEl = document.getElementById('countdown-number');
  overlay.classList.add('active');

  let count = 5;
  numberEl.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      numberEl.textContent = count;
    } else {
      clearInterval(interval);
      overlay.classList.remove('active');
      startMatch();
    }
  }, 1000);
}

async function startMatch() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-cash-match`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lobby_id: currentLobbyId })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start match');
    }

    const { match_id, questions } = await response.json();
    currentMatchId = match_id;

    const { data: lobby } = await supabase
      .from('cash_lobbies')
      .select('category_key')
      .eq('id', currentLobbyId)
      .single();

    showScreen('cash-match-screen');
    document.getElementById('trivia-engine-container').classList.add('active');

    if (window.startTriviaSession) {
      window.startTriviaSession({
        mode: 'cash',
        categoryKey: lobby.category_key,
        questions,
        onComplete: handleMatchComplete
      });
    } else {
      console.error('Trivia engine not loaded');
      alert('Failed to load trivia engine. Please refresh the page.');
    }
  } catch (error) {
    console.error('Error starting match:', error);
    alert('Failed to start match: ' + error.message);
    returnToLobbies();
  }
}

async function handleMatchComplete(score, details) {
  try {
    const { error } = await supabase
      .from('cash_match_results')
      .insert({
        match_id: currentMatchId,
        user_id: currentUser.id,
        score: score,
        correct_count: details.correctCount || 0,
        details: details
      });

    if (error) throw error;

    await updateIntroProgress();

    setTimeout(() => {
      determineWinner();
    }, 2000);
  } catch (error) {
    console.error('Error submitting results:', error);
    alert('Failed to submit results: ' + error.message);
  }
}

async function updateIntroProgress() {
  try {
    const { data: lobby } = await supabase
      .from('cash_lobbies')
      .select('category_key')
      .eq('id', currentLobbyId)
      .single();

    if (lobby.category_key !== 'politics') return;

    const { data: progress } = await supabase
      .from('user_intro_progress')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (!progress || progress.politics_intro_completed) return;

    const newIndex = Math.min(progress.politics_intro_index + 10, 30);
    const completed = newIndex >= 30;

    await supabase
      .from('user_intro_progress')
      .upsert({
        user_id: currentUser.id,
        politics_intro_index: newIndex,
        politics_intro_completed: completed,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error updating intro progress:', error);
  }
}

async function determineWinner() {
  try {
    const { data: results, error } = await supabase
      .from('cash_match_results')
      .select('user_id, score, details')
      .eq('match_id', currentMatchId)
      .order('score', { ascending: false });

    if (error) throw error;

    if (results && results.length > 0) {
      const topScore = results[0].score;
      const winners = results.filter(r => r.score === topScore);

      const winner = winners[Math.floor(Math.random() * winners.length)];

      const { data: winnerUser } = await supabase.auth.admin.getUserById(winner.user_id);
      const winnerName = winnerUser?.user?.user_metadata?.username || 'Player';

      await supabase
        .from('cash_lobbies')
        .update({
          status: 'finished',
          winner_user_id: winner.user_id,
          winner_name: winnerName
        })
        .eq('id', currentLobbyId);

      const isWinner = winner.user_id === currentUser.id;
      showMatchEndModal(isWinner, topScore, results);
    }
  } catch (error) {
    console.error('Error determining winner:', error);
  }
}

function showMatchEndModal(isWinner, score, allResults) {
  const modal = document.getElementById('match-end-modal');
  const content = document.getElementById('match-end-content');

  content.innerHTML = `
    <div class="modal-score">${score} points</div>
    <div class="modal-details">
      ${isWinner ?
        '🎉 Congratulations! You won!' :
        '😔 Better luck next time!'
      }
    </div>
    ${isWinner ?
      '<div style="margin-top: 20px; opacity: 0.9;">💰 Payout processing...</div>' :
      ''
    }
  `;

  modal.classList.add('active');
  document.getElementById('trivia-engine-container').classList.remove('active');
}

function returnToLobbies() {
  const modal = document.getElementById('match-end-modal');
  modal.classList.remove('active');

  if (participantsSubscription) {
    participantsSubscription.unsubscribe();
    participantsSubscription = null;
  }

  currentLobbyId = null;
  currentMatchId = null;

  showScreen('cash-lobby-list-screen');
  loadLobbies();
}

window.viewLobby = viewLobby;

init();
