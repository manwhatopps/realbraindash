/**
 * === LEADERBOARD OVERLAY ===
 *
 * Shows mid-game leaderboard after each question for 2.5 seconds.
 * Displays all players sorted by score with current user highlighted.
 */

/**
 * Render a mid-game leaderboard overlay
 * @param {Object} options
 * @param {Array} options.players - Array of player objects with {user_id, display_name, score, is_me}
 * @param {number} options.currentQuestion - Current question number (1-indexed)
 * @param {number} options.totalQuestions - Total number of questions
 * @param {number} options.durationMs - How long to show (default 2500ms)
 * @returns {Promise} Resolves when overlay is dismissed
 */
export function renderLeaderboardOverlay({ players, currentQuestion, totalQuestions, durationMs = 2500 }) {
  return new Promise((resolve) => {
    console.log('[Leaderboard] Showing overlay for', durationMs, 'ms');

    // Sort players by score descending
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'leaderboardOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
    `;

    // Create inner container
    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 600px;
      width: 100%;
      padding: 24px;
      animation: slideUp 0.4s ease-out;
    `;

    // Build header
    const header = `
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 8px;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">
          Leaderboard
        </h2>
        <p style="color: var(--muted); font-size: 1.125rem;">
          After Question ${currentQuestion} of ${totalQuestions}
        </p>
      </div>
    `;

    // Build player list
    const playerList = sortedPlayers.map((player, idx) => {
      const rank = idx + 1;
      const isTop3 = rank <= 3;
      const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

      return `
        <div style="
          background: ${player.is_me ? 'rgba(0, 234, 255, 0.1)' : 'var(--card)'};
          border: 2px solid ${player.is_me ? 'var(--accent2)' : isTop3 ? 'var(--accent)' : 'var(--line)'};
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
          transition: transform 0.2s;
          ${player.is_me ? 'box-shadow: 0 0 20px rgba(0, 234, 255, 0.3);' : ''}
        ">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: ${isTop3 ? 'linear-gradient(135deg, var(--accent2), var(--accent))' : 'var(--line)'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 900;
            color: ${isTop3 ? '#000' : 'var(--txt)'};
            flex-shrink: 0;
          ">
            ${rankEmoji || '#' + rank}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="
              font-weight: 700;
              font-size: 1.125rem;
              margin-bottom: 4px;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              ">
                ${player.display_name || `Player ${idx + 1}`}
              </span>
              ${player.is_me ? '<span style="font-size: 1.25rem;">👈</span>' : ''}
            </div>
            <div style="color: var(--muted); font-size: 0.875rem;">
              ${player.score} points
              ${player.correct_answers !== undefined ? ` • ${player.correct_answers} correct` : ''}
            </div>
          </div>
          ${player.is_me ? '<div style="font-size: 1.5rem; flex-shrink: 0;">⭐</div>' : ''}
        </div>
      `;
    }).join('');

    // Build footer with countdown
    const footer = `
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: var(--muted); font-size: 0.875rem;">
          Next question in <span id="leaderboardCountdown">2.5</span>s...
        </p>
      </div>
    `;

    // Assemble HTML
    container.innerHTML = header + '<div>' + playerList + '</div>' + footer;
    overlay.appendChild(container);

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Append to body
    document.body.appendChild(overlay);

    // Countdown timer
    const countdownEl = document.getElementById('leaderboardCountdown');
    const startTime = Date.now();
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      const seconds = (remaining / 1000).toFixed(1);
      if (countdownEl) {
        countdownEl.textContent = seconds;
      }
    }, 100);

    // Auto-dismiss after duration
    setTimeout(() => {
      clearInterval(countdownInterval);
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        overlay.remove();
        style.remove();
        console.log('[Leaderboard] Overlay dismissed');
        resolve();
      }, 300);
    }, durationMs);
  });
}
