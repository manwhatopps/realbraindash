/**
 * === FINAL RESULTS MODAL ===
 *
 * Shows after the final question with win/lose messaging and navigation.
 * Modal stays open until user clicks a button.
 */

/**
 * Render final results modal
 * @param {Object} options
 * @param {boolean} options.didWin - True if current user won
 * @param {boolean} options.didTie - True if match ended in a tie
 * @param {number} options.payoutAmount - Payout amount in cents
 * @param {number} options.finalRank - User's final placement (1-indexed)
 * @param {number} options.totalPlayers - Total number of players
 * @param {number} options.finalScore - User's final score
 * @param {number} options.correctAnswers - Number of correct answers
 * @param {number} options.winnerScore - Winner's score (for lose state)
 * @param {Function} options.onBackToHome - Callback for "Back to Home" button
 * @param {Function} options.onBackToLobby - Callback for "Back to Cash Lobby" button
 * @returns {HTMLElement} The modal element
 */
export function renderFinalResultsModal({
  didWin,
  didTie = false,
  payoutAmount = 0,
  finalRank,
  totalPlayers,
  finalScore,
  correctAnswers,
  winnerScore = 0,
  onBackToHome,
  onBackToLobby
}) {
  console.log('[Final Results] Rendering modal', { didWin, didTie, payoutAmount, finalRank });

  // Create modal backdrop
  const modal = document.createElement('div');
  modal.id = 'finalResultsModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.4s ease-out;
  `;

  // Create modal content container
  const content = document.createElement('div');
  content.style.cssText = `
    background: var(--card);
    border: 2px solid var(--line);
    border-radius: 24px;
    padding: 48px;
    max-width: 500px;
    width: 90%;
    text-align: center;
    animation: slideDown 0.5s ease-out;
  `;

  // Build content based on win/lose/tie
  let html = '';

  if (didWin) {
    const payoutDollars = (payoutAmount / 100).toFixed(2);
    html = `
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes moneyFloat {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-200px) rotate(360deg); opacity: 0; }
        }
        .money-emoji {
          position: absolute;
          font-size: 2rem;
          animation: moneyFloat 2s ease-out forwards;
        }
      </style>
      <div style="font-size: 6rem; margin-bottom: 24px; animation: pulse 0.6s 3;">🎉</div>
      <h1 style="
        font-size: 3rem;
        font-weight: 900;
        margin-bottom: 16px;
        color: var(--accent);
        text-shadow: 0 0 40px rgba(57, 255, 136, 0.6);
      ">
        Congratulations!
      </h1>
      <div style="
        font-size: 3rem;
        font-weight: 900;
        color: var(--accent2);
        margin-bottom: 24px;
        animation: pulse 1.5s infinite;
      ">
        You won $${payoutDollars}
      </div>
      <p style="color: var(--muted); font-size: 1.125rem; margin-bottom: 32px;">
        Money has been added to your wallet! 💰
      </p>
      <div style="
        background: rgba(57, 255, 136, 0.1);
        border: 2px solid var(--accent);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
      ">
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          text-align: center;
        ">
          <div>
            <div style="color: var(--muted); font-size: 0.875rem; margin-bottom: 8px;">
              Final Score
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--accent);">
              ${finalScore}
            </div>
          </div>
          <div>
            <div style="color: var(--muted); font-size: 0.875rem; margin-bottom: 8px;">
              Placement
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--accent);">
              #${finalRank}
            </div>
          </div>
        </div>
        ${correctAnswers !== undefined ? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line);">
            <div style="color: var(--muted); font-size: 0.875rem; margin-bottom: 4px;">
              Correct Answers
            </div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--txt);">
              ${correctAnswers} / ${totalPlayers}
            </div>
          </div>
        ` : ''}
      </div>
      <div id="moneyAnimation" style="position: relative; width: 100%; height: 100px; margin-bottom: 24px;"></div>
    `;
  } else if (didTie) {
    html = `
      <div style="font-size: 6rem; margin-bottom: 24px;">🤝</div>
      <h1 style="
        font-size: 3rem;
        font-weight: 900;
        margin-bottom: 16px;
        color: var(--accent2);
        text-shadow: 0 0 40px rgba(0, 234, 255, 0.6);
      ">
        It's a Tie!
      </h1>
      <p style="color: var(--muted); font-size: 1.125rem; margin-bottom: 32px;">
        Well played! You matched the winner's score.
      </p>
      <div style="
        background: rgba(0, 234, 255, 0.1);
        border: 2px solid var(--accent2);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
      ">
        <div style="color: var(--muted); font-size: 0.875rem; margin-bottom: 8px;">
          Final Score
        </div>
        <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent2);">
          ${finalScore} pts
        </div>
        <div style="margin-top: 16px; color: var(--muted); font-size: 1rem;">
          You placed #${finalRank} of ${totalPlayers}
        </div>
      </div>
    `;
  } else {
    // Lose state
    html = `
      <style>
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      </style>
      <div style="font-size: 6rem; margin-bottom: 24px; color: #ff6b6b; animation: shake 0.5s 2;">
        😔
      </div>
      <h1 style="
        font-size: 2.5rem;
        font-weight: 900;
        margin-bottom: 16px;
        color: #ff6b6b;
        text-shadow: 0 0 40px rgba(255, 107, 107, 0.6);
      ">
        Good effort!
      </h1>
      <p style="color: var(--muted); font-size: 1.125rem; margin-bottom: 32px;">
        This one didn't go your way. Try again?
      </p>
      <div style="
        background: rgba(255, 107, 107, 0.1);
        border: 2px solid #ff6b6b;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
      ">
        <div style="margin-bottom: 16px;">
          <div style="color: var(--muted); font-size: 0.875rem; margin-bottom: 8px;">
            Your Placement
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #ff6b6b;">
            #${finalRank} of ${totalPlayers}
          </div>
        </div>
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        ">
          <div>
            <div style="color: var(--muted); font-size: 0.875rem; margin-bottom: 8px;">
              Your Score
            </div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #ff6b6b;">
              ${finalScore}
            </div>
          </div>
          <div>
            <div style="color: var(--muted); font-size: 0.875rem; margin-bottom: 8px;">
              Winner's Score
            </div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">
              ${winnerScore}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Add navigation buttons
  html += `
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="btnBackToHome" style="
        flex: 1;
        padding: 16px 24px;
        background: var(--card);
        border: 2px solid var(--line);
        border-radius: 12px;
        color: var(--txt);
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
      ">
        Back to Home
      </button>
      <button id="btnBackToLobby" style="
        flex: 1;
        padding: 16px 24px;
        background: linear-gradient(135deg, var(--accent2), var(--accent));
        border: none;
        border-radius: 12px;
        color: #000;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
      ">
        Back to Cash Lobby
      </button>
    </div>
  `;

  content.innerHTML = html;
  modal.appendChild(content);

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    #btnBackToHome:hover {
      background: var(--line);
      transform: translateY(-2px);
    }
    #btnBackToLobby:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(57, 255, 136, 0.4);
    }
  `;
  document.head.appendChild(style);

  // Attach event listeners
  const btnHome = content.querySelector('#btnBackToHome');
  const btnLobby = content.querySelector('#btnBackToLobby');

  btnHome.addEventListener('click', () => {
    modal.remove();
    style.remove();
    if (onBackToHome) onBackToHome();
  });

  btnLobby.addEventListener('click', () => {
    modal.remove();
    style.remove();
    if (onBackToLobby) onBackToLobby();
  });

  // Animate money emojis for win state
  if (didWin) {
    setTimeout(() => {
      const container = content.querySelector('#moneyAnimation');
      if (container) {
        const emojis = ['💵', '💰', '💸', '💴', '💶', '💷'];
        for (let i = 0; i < 12; i++) {
          setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.className = 'money-emoji';
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.left = `${Math.random() * 80 + 10}%`;
            container.appendChild(emoji);
          }, i * 150);
        }
      }
    }, 500);
  }

  document.body.appendChild(modal);

  return modal;
}
