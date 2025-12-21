// Offline Wizard - Step-by-step game setup
// Flow: Home → Bots → Rounds → Difficulty → Categories → Start

(function () {
  console.log('[Offline Wizard] Initializing...');

  // 3-decimal scoring (matches server-authoritative system)
  function round3HalfUp(n) {
    const v = Math.trunc(n * 1000 + (n >= 0 ? 0.5 : -0.5)) / 1000;
    return Number(v.toFixed(3));
  }

  function speedPoints(t_ms, window_ms = 7000) {
    if (t_ms <= 1) return 100.0;
    const dec = 100 / window_ms;
    return Math.max(0, 100 - dec * (t_ms - 1));
  }

  function calculateKahootScore(elapsedMs, isFirst = false) {
    const S = round3HalfUp(speedPoints(elapsedMs));
    const A = 1.0; // Always correct in offline mode
    const base = round3HalfUp(S * A);

    // Rank bonus (only for first player in offline mode)
    const bonus = isFirst ? 5.0 : 0.0;

    return round3HalfUp(base + bonus);
  }

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const errBoxId = 'bd-wizard-errors';
  function showError(e) {
    const msg = e?.message || e?.toString() || String(e);
    console.error('[Offline Wizard Error]', msg);
    try {
      let box = document.getElementById(errBoxId);
      if (!box) {
        box = document.createElement('pre');
        box.id = errBoxId;
        box.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:9999;background:#240;color:#fff;padding:8px 10px;border-radius:8px;max-width:60vw;max-height:40vh;overflow:auto;font:12px/1.3 ui-monospace,monospace;';
        document.body.appendChild(box);
      }
      box.textContent = '[Offline Wizard Error] ' + msg;
    } catch (err) {
      console.error('[Offline Wizard] Could not display error:', err);
    }
  }

  const sheets = {
    bots: $('#offlineStepBots'),
    rounds: $('#offlineStepRounds'),
    difficulty: $('#offlineStepDifficulty'),
    categories: $('#offlineStepCategories')
  };

  const buttons = {
    backBots: $('#offBackBots'),
    homeBots: $('#offHomeBots'),
    backRounds: $('#offBackRounds'),
    homeRounds: $('#offHomeRounds'),
    backDiff: $('#offBackDiff'),
    homeDiff: $('#offHomeDiff'),
    backCats: $('#offBackCats'),
    homeCats: $('#offHomeCats'),
    nextFromBots: $('#nextFromBots'),
    nextFromRounds: $('#nextFromRounds'),
    nextFromDiff: $('#nextFromDiff'),
    startGame: $('#startOfflineWizard')
  };

  const inputs = {
    botsInput: $('#botsInput'),
    roundsInput: $('#roundsInput'),
    elimStart: $('#elimStartInput'),
    catsGrid: $('#catsGrid')
  };

  const State = {
    HOME: 'home',
    BOTS: 'bots',
    ROUNDS: 'rounds',
    DIFF: 'difficulty',
    CATS: 'categories'
  };

  let navigationStack = [];

  const config = {
    mode: 'offline',
    players: { human: 1, bots: 3 },
    rounds: 5,
    difficulty: 'normal',
    eliminationEnabled: true,
    elimination: { startRound: 3, perRound: 1, schedule: [] },
    categories: []
  };

  // Helper functions
  const openSheet = (sheet) => {
    if (!sheet) return;
    sheet.style.display = 'grid';
    sheet.setAttribute('aria-hidden', 'false');
  };

  const closeSheet = (sheet) => {
    if (!sheet) return;
    sheet.style.display = 'none';
    sheet.setAttribute('aria-hidden', 'true');
  };

  const closeAllSheets = () => {
    Object.values(sheets).forEach(closeSheet);
  };

  const clamp = (n, min, max) => {
    return Math.min(max, Math.max(min, n));
  };

  // Auto-compute elimination start round
  // Given P players and R rounds, we need (P-2) eliminations to get down to 2 finalists
  // Eliminations needed: P - 2
  // We have R rounds to do eliminations
  // Start round: R - (P - 2) + 1 = R - P + 3
  // Example: 11 players, 25 rounds: 25 - 11 + 3 = 17
  const computeAutoElimStart = (totalPlayers, totalRounds) => {
    const eliminationsNeeded = totalPlayers - 2;
    const startRound = totalRounds - eliminationsNeeded + 1;

    // Ensure start round is at least round 2 and at most the last round
    return Math.max(2, Math.min(startRound, totalRounds));
  };

  const buildEliminationSchedule = (totalPlayers, totalRounds, startRound) => {
    const schedule = [];
    let alive = totalPlayers;

    for (let r = 1; r <= totalRounds; r++) {
      let eliminate = 0;
      // Eliminate 1 player per round starting at startRound, but stop when we reach 2 players
      if (r >= startRound && alive > 2) {
        eliminate = 1;
        alive -= 1;
      }
      schedule.push({ round: r, eliminate, playersRemaining: alive });
    }

    // Log the schedule for verification
    console.log('[Elimination Schedule]', {
      totalPlayers,
      totalRounds,
      startRound,
      finalPlayers: alive,
      schedule
    });

    return schedule;
  };

  // Build even category distribution plan
  // For multi-category games, ensures each category gets proportional rounds
  // Example: ['sports', 'history'] with 10 rounds → 5 sports, 5 history (shuffled)
  const buildEvenCategoryPlan = (categories, totalRounds) => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return Array(totalRounds).fill(null);
    }

    const unique = [...new Set(categories)];
    const K = unique.length;
    const base = Math.floor(totalRounds / K);
    let remainder = totalRounds % K;

    const counts = unique.map(() => base);
    for (let i = 0; i < remainder; i++) {
      counts[i]++;
    }

    const plan = [];
    unique.forEach((cat, idx) => {
      for (let i = 0; i < counts[idx]; i++) {
        plan.push(cat);
      }
    });

    for (let i = plan.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [plan[i], plan[j]] = [plan[j], plan[i]];
    }

    return plan;
  };

  // Navigation
  const render = () => {
    const current = navigationStack[navigationStack.length - 1] || State.HOME;
    console.log('[Offline Wizard] Current state:', current);

    closeAllSheets();

    if (current === State.BOTS) openSheet(sheets.bots);
    else if (current === State.ROUNDS) openSheet(sheets.rounds);
    else if (current === State.DIFF) openSheet(sheets.difficulty);
    else if (current === State.CATS) openSheet(sheets.categories);
  };

  const go = (state) => {
    if (navigationStack[navigationStack.length - 1] !== state) {
      navigationStack.push(state);
    }
    render();
  };

  const back = () => {
    if (navigationStack.length > 1) {
      navigationStack.pop();
      render();
    } else {
      // If at first step, go home
      home();
    }
  };

  const home = () => {
    navigationStack = [];
    closeAllSheets();

    // Hide and cleanup game screen
    const gameScreen = $('#offlineGame');
    if (gameScreen) {
      gameScreen.classList.add('hidden');
      gameScreen.style.display = 'none';

      // Clear game content to reset state
      const questionView = gameScreen.querySelector('#ogQuestionView');
      const leaderboardView = gameScreen.querySelector('#ogLeaderboardView');
      if (questionView) questionView.style.display = 'none';
      if (leaderboardView) leaderboardView.style.display = 'none';
    }

    // Reset page overflow
    document.body.style.overflow = '';

    // Hide timer
    if (window.QuestionTimer) {
      window.QuestionTimer.hide();
    }

    // Clear all question banks for fresh regeneration
    if (window.__questionLoader__?.clearAllQuestionBanks) {
      window.__questionLoader__.clearAllQuestionBanks();
    }

    // Clear any elimination banners
    if (window.hideEliminationBanner) {
      window.hideEliminationBanner();
    }

    // Reset game active flags
    if (typeof isGameActive !== 'undefined') {
      isGameActive = false;
    }
    if (typeof gameInterruptFlag !== 'undefined') {
      gameInterruptFlag = false;
    }

    console.log('[Offline Wizard] Returned to home, all state reset');
  };

  function getGameElements() {
    return {
      screen: $('#offlineGame'),
      back: $('#ogBackToMenu'),
      round: $('#ogRoundLabel'),
      cat: $('#ogCategoryLabel'),
      prompt: $('#ogPrompt'),
      choices: '#ogChoices',
      questionView: $('#ogQuestionView'),
      leaderboardView: $('#ogLeaderboardView'),
      leaderboard: $('#ogLeaderboard')
    };
  }

  function generateBotName() {
    const adjectives = ['Swift', 'Clever', 'Mighty', 'Quick', 'Smart', 'Brave', 'Bold', 'Wise', 'Fast', 'Sharp'];
    const nouns = ['Fox', 'Eagle', 'Tiger', 'Wolf', 'Hawk', 'Bear', 'Lion', 'Panther', 'Falcon', 'Dragon'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${Math.floor(Math.random() * 99) + 1}`;
  }

  function initializePlayers(cfg) {
    const players = [
      { id: 'human', name: 'You', isHuman: true, score: 0, correctAnswers: 0, streak: 0 }
    ];

    for (let i = 0; i < cfg.players.bots; i++) {
      players.push({
        id: `bot${i + 1}`,
        name: generateBotName(),
        isHuman: false,
        score: 0,
        correctAnswers: 0,
        streak: 0
      });
    }

    return players;
  }

  function simulateBotAnswer(difficulty) {
    // Bot accuracy rates: easy 50%, normal 60-65%, hard 65%
    const chances = {
      Easy: 0.50,
      easy: 0.50,
      Medium: 0.625,
      medium: 0.625,
      normal: 0.625,
      Hard: 0.65,
      hard: 0.65
    };
    const chance = chances[difficulty] || 0.625;
    return Math.random() < chance;
  }

  function getBotAnswerTime(difficulty) {
    // Easy: Bots take longer (slower thinking, 3-8 seconds)
    // Medium: Moderate speed (2-6 seconds)
    // Hard: Faster but not too fast (1.5-5 seconds)
    const diffLower = (difficulty || 'normal').toLowerCase();

    if (diffLower === 'easy') {
      return 3000 + Math.random() * 5000; // 3-8 seconds
    } else if (diffLower === 'medium' || diffLower === 'normal') {
      return 2000 + Math.random() * 4000; // 2-6 seconds
    } else {
      return 1500 + Math.random() * 3500; // 1.5-5 seconds (faster on hard but not too fast)
    }
  }

  function renderLeaderboard(players) {
    const og = getGameElements();
    if (!og.leaderboard) return;

    const sorted = [...players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.correctAnswers - a.correctAnswers;
    });

    og.leaderboard.innerHTML = sorted.map((player, idx) => {
      const rank = idx + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      const bgColor = player.isHuman ? 'rgba(57, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.03)';
      const borderColor = player.isHuman ? 'var(--accent2)' : 'var(--line)';

      return `
        <div style="background:${bgColor};border:2px solid ${borderColor};border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:16px">
            <span style="font-size:24px;font-weight:700;min-width:40px">${medal}</span>
            <div>
              <div style="font-weight:700;font-size:18px;color:var(--txt)">${player.name}</div>
              <div style="font-size:14px;color:var(--muted)">${player.correctAnswers} correct</div>
            </div>
          </div>
          <div style="font-size:28px;font-weight:700;color:var(--accent2)">${player.score.toFixed(3)}</div>
        </div>
      `;
    }).join('');
  }

  const showEl = (el, show) => {
    if (!el) return;
    if (show) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  };

  // Step 1: Bots selection
  const selectTile = (container, attr, value) => {
    $$(container + ' .wizard-tile').forEach(tile => {
      const val = tile.getAttribute(attr);
      if (val === value) {
        tile.classList.add('wizard-tile-selected');
      } else {
        tile.classList.remove('wizard-tile-selected');
      }
    });
  };

  $$('#offlineStepBots .wizard-tile[data-val]').forEach(tile => {
    tile.addEventListener('click', () => {
      const val = parseInt(tile.dataset.val, 10);
      inputs.botsInput.value = clamp(val, 1, 15);
      selectTile('#offlineStepBots', 'data-val', String(val));
    });
  });

  if (buttons.nextFromBots) {
    buttons.nextFromBots.addEventListener('click', () => {
      const bots = clamp(parseInt(inputs.botsInput.value, 10) || 3, 1, 15);
      config.players.bots = bots;
      console.log('[Offline Wizard] Bots selected:', bots);
      refreshElimPreview();
      go(State.ROUNDS);
    });
  }

  // Step 2: Rounds selection
  $$('#offlineStepRounds .wizard-tile[data-val]').forEach(tile => {
    tile.addEventListener('click', () => {
      const val = parseInt(tile.dataset.val, 10);
      inputs.roundsInput.value = clamp(val, 3, 20);
      selectTile('#offlineStepRounds', 'data-val', String(val));
    });
  });

  if (buttons.nextFromRounds) {
    buttons.nextFromRounds.addEventListener('click', () => {
      const rounds = clamp(parseInt(inputs.roundsInput.value, 10) || 5, 3, 20);
      config.rounds = rounds;

      console.log('[Offline Wizard] Rounds selected:', rounds);
      refreshElimPreview();
      go(State.DIFF);
    });
  }

  // Step 3: Difficulty & Elimination
  const elimToggle = $('#elimToggle');
  const elimPreview = $('#elimPreview');
  const elimStartPreview = $('#elimStartPreview');

  const refreshElimPreview = () => {
    const totalPlayers = 1 + config.players.bots;
    const startRound = computeAutoElimStart(totalPlayers, config.rounds);
    const eliminationsNeeded = totalPlayers - 2;

    if (elimStartPreview) {
      elimStartPreview.textContent = String(startRound);
    }

    if (elimPreview) {
      elimPreview.style.display = config.eliminationEnabled ? 'flex' : 'none';
    }

    console.log('[Offline Wizard] Elim preview:', {
      totalPlayers,
      rounds: config.rounds,
      startRound,
      eliminationsNeeded,
      finalPlayers: 2,
      enabled: config.eliminationEnabled
    });
  };

  if (elimToggle) {
    elimToggle.addEventListener('click', () => {
      config.eliminationEnabled = !config.eliminationEnabled;
      elimToggle.textContent = config.eliminationEnabled ? 'ON' : 'OFF';
      elimToggle.classList.toggle('toggle-on', config.eliminationEnabled);
      elimToggle.classList.toggle('toggle-off', !config.eliminationEnabled);
      refreshElimPreview();
    });
  }

  $$('#offlineStepDifficulty .wizard-tile[data-diff]').forEach(tile => {
    tile.addEventListener('click', () => {
      $$('#offlineStepDifficulty .wizard-tile').forEach(t => {
        t.classList.remove('wizard-tile-selected');
      });
      tile.classList.add('wizard-tile-selected');
    });
  });

  if (buttons.nextFromDiff) {
    buttons.nextFromDiff.addEventListener('click', () => {
      const selectedDiff = $('#offlineStepDifficulty .wizard-tile.wizard-tile-selected');
      config.difficulty = selectedDiff?.dataset.diff || 'normal';

      console.log('[Offline Wizard] Difficulty:', config.difficulty, 'Elimination enabled:', config.eliminationEnabled);
      go(State.CATS);
    });
  }

  // Step 4: Categories (multi-select)
  if (inputs.catsGrid) {
    inputs.catsGrid.addEventListener('click', (e) => {
      const tile = e.target.closest('.wizard-tile[data-cat]');
      if (!tile) return;

      const cat = tile.dataset.cat ?? '';

      if (cat === '') {
        $$('#catsGrid .wizard-tile').forEach(t => t.classList.remove('wizard-tile-selected'));
        tile.classList.add('wizard-tile-selected');
      } else {
        const anyTile = $('#catsGrid .wizard-tile[data-cat=""]');
        if (anyTile) anyTile.classList.remove('wizard-tile-selected');
        tile.classList.toggle('wizard-tile-selected');
      }
    });
  }

  async function renderQuestion(question, cfg, players) {
    const og = getGameElements();
    if (!og.prompt || !$(og.choices)) {
      console.error('[Offline Wizard] Game elements not found');
      return { userCorrect: false };
    }

    og.questionView.style.display = 'flex';
    og.leaderboardView.style.display = 'none';

    og.prompt.textContent = question.prompt;
    const choicesWrap = $(og.choices);
    choicesWrap.innerHTML = '';

    let userAnswered = false;
    let userCorrect = false;
    let userAnswerTime = 0;

    (question.choices || []).forEach((text, idx) => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = text;

      btn.addEventListener('click', () => {
        if (userAnswered) return;
        userAnswered = true;
        userAnswerTime = Date.now();
        userCorrect = idx === (question.correct_index - 1);

        $$(og.choices + ' .btn').forEach(b => b.disabled = true);

        if (userCorrect) {
          btn.style.outline = '3px solid #2ea043';
          btn.style.background = 'rgba(46, 160, 67, 0.2)';
        } else {
          btn.style.outline = '3px solid #9e2a2b';
          btn.style.background = 'rgba(158, 42, 43, 0.2)';
        }
      });

      choicesWrap.appendChild(btn);
    });

    const QUESTION_TIME = question.time_limit_ms || 7000;
    const timerBar = $('#ogTimerProgress');

    if (timerBar) {
      timerBar.style.width = '100%';
      timerBar.style.background = '#00eaff';
      const startTime = Date.now();
      question.startTime = startTime;
      const timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, QUESTION_TIME - elapsed);
        const percent = (remaining / QUESTION_TIME) * 100;
        timerBar.style.width = percent + '%';

        if (percent < 30) {
          timerBar.style.background = '#ff4444';
        } else if (percent < 60) {
          timerBar.style.background = '#ffd700';
        }

        if (remaining <= 0) {
          clearInterval(timerInterval);
        }
      }, 100);

      await new Promise(resolve => setTimeout(resolve, QUESTION_TIME));
      clearInterval(timerInterval);
      timerBar.style.width = '0%';
    } else {
      question.startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, QUESTION_TIME));
    }

    if (window.QuestionTimer) {
      window.QuestionTimer.hide();
    }

    $$(og.choices + ' .btn').forEach((b, i) => {
      b.disabled = true;
      if (i === (question.correct_index - 1)) {
        b.style.outline = '3px solid #2ea043';
      }
    });

    const human = players.find(p => p.isHuman);
    if (userCorrect && userAnswerTime > 0) {
      const elapsedMs = userAnswerTime - question.startTime;
      const timeRemainingSec = Math.max(0, (QUESTION_TIME - elapsedMs) / 1000);
      const maxTimeSec = QUESTION_TIME / 1000;

      // Use Kahoot-style scoring from index.html
      const points = window.calculateKahootStyleScore
        ? window.calculateKahootStyleScore({
            correct: true,
            timeRemaining: timeRemainingSec,
            maxTime: maxTimeSec,
            currentStreak: human.streak
          })
        : calculateKahootScore(elapsedMs, false); // Fallback to old scoring

      human.score += points;
      human.correctAnswers += 1;
      human.streak += 1; // Increment streak
      human.lastPoints = points;

      console.log('[Offline Wizard] Human scored', points, 'points. Streak:', human.streak, 'Total:', human.score);
    } else if (!userCorrect && userAnswered) {
      human.streak = 0; // Reset streak on wrong answer
      console.log('[Offline Wizard] Human answered incorrectly. Streak reset.');
    }

    players.forEach(player => {
      if (!player.isHuman) {
        const botCorrect = simulateBotAnswer(cfg.difficulty);
        if (botCorrect) {
          const botTime = getBotAnswerTime(cfg.difficulty);
          const timeRemainingSec = Math.max(0, (QUESTION_TIME - botTime) / 1000);
          const maxTimeSec = QUESTION_TIME / 1000;

          // Use Kahoot-style scoring for bots too
          const points = window.calculateKahootStyleScore
            ? window.calculateKahootStyleScore({
                correct: true,
                timeRemaining: timeRemainingSec,
                maxTime: maxTimeSec,
                currentStreak: player.streak
              })
            : calculateKahootScore(botTime, false); // Fallback

          player.score += points;
          player.correctAnswers += 1;
          player.streak += 1;
        } else {
          player.streak = 0; // Reset bot streak on wrong answer
        }
      }
    });

    return { userCorrect, userAnswered, userAnswerTime };
  }

  async function runMatch(cfg) {
    console.log('[Offline Wizard] Starting match with config:', cfg);

    try {
      closeAllSheets();

      const og = getGameElements();
      if (!og.screen) {
        console.error('[Offline Wizard] Game screen not found');
        return;
      }

      document.body.style.overflow = 'hidden';
      og.screen.classList.remove('hidden');
      og.screen.style.display = 'flex';

      // Mark game as active
      isGameActive = true;
      gameInterruptFlag = false;

      const players = initializePlayers(cfg);

      for (let currentRound = 1; currentRound <= cfg.rounds; currentRound++) {
        // Check if game was interrupted
        if (gameInterruptFlag) {
          console.log('[Offline Wizard] Game interrupted by user');
          break;
        }
        console.log(`[Offline Wizard] Starting round ${currentRound}/${cfg.rounds}`);

        try {
          og.round.textContent = `Round ${currentRound} / ${cfg.rounds}`;
          const planCat = Array.isArray(cfg.categoryPlan) ? cfg.categoryPlan[currentRound - 1] : null;
          og.cat.textContent = planCat ? planCat : 'Any';

          if (cfg.elimination?.banner?.enabled && currentRound === cfg.elimination.banner.fireOnRound) {
            if (window.showEliminationBanner) {
              await new Promise(resolve => {
                window.showEliminationBanner(cfg.elimination.banner.text, 5000);
                setTimeout(resolve, 5000);
              });
            }
          }

          const categories = planCat ? [planCat] : (cfg.categories?.length ? cfg.categories : []);

          console.log('[Offline Wizard] Round', currentRound, 'planCat:', planCat, 'categories for question:', categories);

          let question = null;
          let done = false;

          if (window.nextQuestion) {
            try {
              const result = await window.nextQuestion({ categories, difficulty: cfg.difficulty });
              question = result?.question;
              done = result?.done;

              if (done || !question) {
                const fallback = await window.nextQuestion({ categories: [], difficulty: null });
                question = fallback?.question || null;
              }
            } catch (qErr) {
              console.error('[Offline Wizard] Question fetch error:', qErr);
              question = null;
            }
          }

          if (!question) {
            og.prompt.textContent = 'No questions available. Try different categories.';
            await new Promise(resolve => setTimeout(resolve, 3000));
            home();
            return;
          }

          await renderQuestion(question, cfg, players);

          og.questionView.style.display = 'none';
          og.leaderboardView.style.display = 'flex';
          renderLeaderboard(players);

          const LEADERBOARD_TIME = 3000;
          await new Promise(resolve => setTimeout(resolve, LEADERBOARD_TIME));
        } catch (e) {
          showError(e);
          await new Promise(resolve => setTimeout(resolve, 2000));
          home();
          return;
        }
      }

      if (window.QuestionTimer) {
        window.QuestionTimer.hide();
      }

      // Get final player count from schedule
      const finalSchedule = cfg.elimination?.schedule || [];
      const lastRound = finalSchedule[finalSchedule.length - 1];
      const finalPlayers = lastRound?.playersRemaining || 2;

      console.log('[Offline Wizard] Game complete!', {
        finalPlayers,
        eliminationEnabled: cfg.eliminationEnabled
      });

      // If we have a completion callback (Test Cash mode), call it instead of going home
      if (typeof matchCompletionCallback === 'function') {
        const humanPlayer = players.find(p => p.isHuman || p.id === 'human');
        const userScore = humanPlayer ? humanPlayer.score : 0; // Use Kahoot score, not correctAnswers
        const userCorrectCount = humanPlayer ? humanPlayer.correctAnswers : 0;
        console.log('[Offline Wizard] Test Cash mode complete. User Kahoot score:', userScore, 'Correct:', userCorrectCount);

        // Call the callback and clear it
        const callback = matchCompletionCallback;
        matchCompletionCallback = null;
        currentMatchPlayers = null;
        callback(userScore, { correctAnswers: userCorrectCount });
        return; // Don't go home, let Test Cash handle navigation
      }

      if (window.showEliminationBanner) {
        if (cfg.eliminationEnabled && finalPlayers === 2) {
          window.showEliminationBanner('🏆 Rounds complete! 2 finalists remain. Championship round starting… (Best of 3)', 5000);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          window.showEliminationBanner('🎉 Game complete! Thanks for playing!', 3000);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      home();
    } catch (e) {
      showError(e);
      await new Promise(resolve => setTimeout(resolve, 2000));
      home();
    } finally {
      // Always mark game as inactive when match ends
      isGameActive = false;
      gameInterruptFlag = false;
    }
  }

  // Start Game
  if (buttons.startGame) {
    buttons.startGame.addEventListener('click', () => {
      try {
        const selectedCats = $$('#catsGrid .wizard-tile.wizard-tile-selected');
        const picked = selectedCats.map(t => t.dataset.cat).filter(c => c !== undefined);

        config.categories = picked.includes('') || picked.length === 0 ? [] : picked;

      const totalPlayers = 1 + config.players.bots;

      if (config.eliminationEnabled) {
        const startRound = computeAutoElimStart(totalPlayers, config.rounds);
        config.elimination.startRound = startRound;
        config.elimination.perRound = 1;
        config.elimination.schedule = buildEliminationSchedule(
          totalPlayers,
          config.rounds,
          startRound
        );

        config.elimination.banner = {
          enabled: true,
          text: `Elimination begins on Round ${startRound}. From now on, the lowest scorer is eliminated each round.`,
          fireOnRound: startRound
        };
      } else {
        config.elimination.startRound = null;
        config.elimination.perRound = 0;
        config.elimination.schedule = Array.from({ length: config.rounds }, (_, i) => ({
          round: i + 1,
          eliminate: 0,
          playersRemaining: totalPlayers
        }));
        config.elimination.banner = { enabled: false };
      }

      config.championship = {
        enabled: true,
        format: 'bo3',
        startsAfterRound: config.rounds
      };

      config.categoryPlan = buildEvenCategoryPlan(config.categories, config.rounds);

      console.log('[Offline Wizard] Final config:', config);
      console.log('[Offline Wizard] Elimination schedule:', config.elimination.schedule);
      if (config.elimination.banner.enabled) {
        console.log('[Offline Wizard] Banner:', config.elimination.banner);
      }
      console.log('[Offline Wizard] Championship:', config.championship);
      console.log('[Offline Wizard] Category plan:', config.categoryPlan);

      try {
        sessionStorage.setItem('bd.offline.config', JSON.stringify(config));
      } catch (e) {
        console.warn('[Offline Wizard] Could not save config:', e);
      }

        if (typeof window.showCountdown === 'function') {
          window.showCountdown(5, () => {
            try {
              runMatch(config);
            } catch (e) {
              showError(e);
            }
          });
        } else {
          console.log('[Offline Wizard] No countdown available, starting game directly');
          runMatch(config);
        }
      } catch (e) {
        showError(e);
      }
    });
  }

  // Navigation button handlers
  if (buttons.backBots) buttons.backBots.addEventListener('click', back);
  if (buttons.homeBots) buttons.homeBots.addEventListener('click', home);
  if (buttons.backRounds) buttons.backRounds.addEventListener('click', back);
  if (buttons.homeRounds) buttons.homeRounds.addEventListener('click', home);
  if (buttons.backDiff) buttons.backDiff.addEventListener('click', back);
  if (buttons.homeDiff) buttons.homeDiff.addEventListener('click', home);
  if (buttons.backCats) buttons.backCats.addEventListener('click', back);
  if (buttons.homeCats) buttons.homeCats.addEventListener('click', home);

  let isGameActive = false;
  let gameInterruptFlag = false;

  const backBtn = $('#ogBackToMenu');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // If game is active, show confirmation
      if (isGameActive) {
        const confirmed = window.confirm('Are you sure you want to exit? Your progress will be lost.');
        if (!confirmed) {
          return;
        }
        // Set interrupt flag to stop ongoing game
        gameInterruptFlag = true;
      }

      // Complete cleanup
      if (window.QuestionTimer) {
        window.QuestionTimer.hide();
      }

      // Reset all game state
      isGameActive = false;
      gameInterruptFlag = false;

      home();
    });
  }

  // Export start function for external triggers
  window.startOfflineWizard = () => {
    console.log('[Offline Wizard] Starting wizard flow');
    navigationStack = [State.BOTS];
    render();
  };

  // === FREE PLAY TRIVIA ENTRY POINT (SOURCE OF TRUTH) ===
  // Export runMatch for ALL modes: Free Play, Cash Challenge, Test Cash Challenge
  // This is the SINGLE SOURCE OF TRUTH for trivia gameplay
  // All modes MUST use this same entry point to ensure consistent:
  // - Question loading and selection
  // - Category handling
  // - Kahoot-style scoring
  // - UI and timing
  let matchCompletionCallback = null;
  let currentMatchPlayers = null;

  window.startOfflineMatch = async (cfg, onComplete) => {
    console.log('[Offline Wizard] === RECEIVED CONFIG ===');
    console.log('[Offline Wizard] Mode:', cfg.mode);
    console.log('[Offline Wizard] categories:', cfg.categories);
    console.log('[Offline Wizard] categoryPlan:', cfg.categoryPlan);
    console.log('[Offline Wizard] Full config:', cfg);
    matchCompletionCallback = onComplete;
    try {
      currentMatchPlayers = null;
      await runMatch(cfg);
    } catch (error) {
      console.error('[Offline Wizard] Match error:', error);
      if (typeof matchCompletionCallback === 'function') {
        matchCompletionCallback(0);
        matchCompletionCallback = null;
      }
    }
  };

  // Hook to capture player data
  function capturePlayersForCallback(players) {
    currentMatchPlayers = players;
  }

  // Initialize in home state
  home();

  window.addEventListener('bd:error', (e) => {
    const msg = e.detail?.error || 'Unknown error';
    showError('[API] ' + msg);
  });

  console.log('[Offline Wizard] Initialized successfully');
})();
