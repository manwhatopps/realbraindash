import { supabase } from '../supabase-client.js';

export async function createPlayWithFriends(container, onLobbyCreated, onLobbyJoined) {
  container.innerHTML = `
    <div style="max-width: 800px; margin: 40px auto; padding: 20px;">
      <h1 style="text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 40px; color: #fff;">
        Play with Friends
      </h1>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">

        <!-- Create Private Match Card -->
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 30px;
          border: 2px solid rgba(255, 255, 255, 0.1);
        ">
          <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #fff;">
            Create Private Match
          </h2>

          <div id="create-form">
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #aaa; font-size: 14px;">
                Max Players (2-12)
              </label>
              <input
                type="number"
                id="max-players"
                min="2"
                max="12"
                value="12"
                style="
                  width: 100%;
                  padding: 12px;
                  border-radius: 8px;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  font-size: 16px;
                "
              />
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #aaa; font-size: 14px;">
                Entry Fee
              </label>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">
                <button class="fee-preset" data-fee="100" style="
                  padding: 10px;
                  border-radius: 8px;
                  border: 2px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  cursor: pointer;
                  transition: all 0.2s;
                ">$1</button>
                <button class="fee-preset" data-fee="500" style="
                  padding: 10px;
                  border-radius: 8px;
                  border: 2px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  cursor: pointer;
                  transition: all 0.2s;
                ">$5</button>
                <button class="fee-preset" data-fee="1000" style="
                  padding: 10px;
                  border-radius: 8px;
                  border: 2px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  cursor: pointer;
                  transition: all 0.2s;
                ">$10</button>
              </div>
              <input
                type="number"
                id="entry-fee"
                placeholder="Custom amount in cents"
                min="0"
                style="
                  width: 100%;
                  padding: 12px;
                  border-radius: 8px;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  font-size: 16px;
                "
              />
            </div>

            <div style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; color: #fff; cursor: pointer;">
                <input type="checkbox" id="require-ready" checked style="margin-right: 10px; width: 18px; height: 18px;" />
                Ready check required
              </label>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; color: #fff; cursor: pointer;">
                <input type="checkbox" id="lock-on-start" checked style="margin-right: 10px; width: 18px; height: 18px;" />
                Lock lobby when game starts
              </label>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; color: #fff; cursor: pointer;">
                <input type="checkbox" id="host-can-play" checked style="margin-right: 10px; width: 18px; height: 18px;" />
                Host can play
              </label>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: flex; align-items: center; color: #fff; cursor: pointer;">
                <input type="checkbox" id="allow-spectators" style="margin-right: 10px; width: 18px; height: 18px;" />
                Allow spectators
              </label>
            </div>

            <button id="create-lobby-btn" style="
              width: 100%;
              padding: 16px;
              font-size: 18px;
              font-weight: bold;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              transition: transform 0.2s;
            ">
              Create Lobby
            </button>
          </div>

          <div id="lobby-created" style="display: none;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 14px; color: #aaa; margin-bottom: 10px;">Invite Code</div>
              <div id="invite-code" style="
                font-size: 36px;
                font-weight: bold;
                color: #fff;
                letter-spacing: 4px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                margin-bottom: 15px;
              "></div>
            </div>

            <div id="qr-code" style="text-align: center; margin-bottom: 20px;"></div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button id="copy-link-btn" style="
                padding: 12px;
                font-size: 16px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                cursor: pointer;
              ">
                Copy Link
              </button>

              <button id="share-btn" style="
                padding: 12px;
                font-size: 16px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                cursor: pointer;
              ">
                Share
              </button>

              <button id="enter-lobby-btn" style="
                padding: 12px;
                font-size: 16px;
                font-weight: bold;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
              ">
                Enter Lobby
              </button>
            </div>
          </div>
        </div>

        <!-- Join Private Match Card -->
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 30px;
          border: 2px solid rgba(255, 255, 255, 0.1);
        ">
          <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #fff;">
            Join Private Match
          </h2>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #aaa; font-size: 14px;">
              Enter Invite Code
            </label>
            <input
              type="text"
              id="join-code"
              placeholder="6-CHAR CODE"
              maxlength="6"
              style="
                width: 100%;
                padding: 16px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: rgba(0, 0, 0, 0.3);
                color: white;
                font-size: 24px;
                text-align: center;
                letter-spacing: 4px;
                text-transform: uppercase;
              "
            />
          </div>

          <button id="join-lobby-btn" style="
            width: 100%;
            padding: 16px;
            font-size: 18px;
            font-weight: bold;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            Join Lobby
          </button>

          <div id="join-error" style="
            display: none;
            margin-top: 15px;
            padding: 12px;
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid rgba(255, 0, 0, 0.3);
            border-radius: 8px;
            color: #ff6b6b;
            font-size: 14px;
          "></div>
        </div>
      </div>
    </div>
  `;

  let selectedFee = 100;
  let createdLobbyId = null;
  let createdCode = null;

  const feePresets = container.querySelectorAll('.fee-preset');
  const entryFeeInput = container.querySelector('#entry-fee');
  const createBtn = container.querySelector('#create-lobby-btn');
  const joinBtn = container.querySelector('#join-lobby-btn');
  const joinCodeInput = container.querySelector('#join-code');
  const joinError = container.querySelector('#join-error');

  feePresets.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedFee = parseInt(btn.dataset.fee);
      entryFeeInput.value = '';

      feePresets.forEach(b => {
        b.style.background = 'rgba(0, 0, 0, 0.3)';
        b.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
      btn.style.background = 'rgba(102, 126, 234, 0.3)';
      btn.style.borderColor = '#667eea';
    });
  });

  feePresets[0].click();

  entryFeeInput.addEventListener('input', () => {
    if (entryFeeInput.value) {
      selectedFee = parseInt(entryFeeInput.value) || 0;
      feePresets.forEach(b => {
        b.style.background = 'rgba(0, 0, 0, 0.3)';
        b.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
    }
  });

  joinCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  createBtn.addEventListener('click', async () => {
    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    try {
      const maxPlayers = parseInt(container.querySelector('#max-players').value);
      const requireReady = container.querySelector('#require-ready').checked;
      const lockOnStart = container.querySelector('#lock-on-start').checked;
      const hostCanPlay = container.querySelector('#host-can-play').checked;
      const allowSpectators = container.querySelector('#allow-spectators').checked;

      const { data, error } = await supabase.rpc('create_friend_lobby', {
        p_max_players: maxPlayers,
        p_entry_fee_cents: selectedFee,
        p_require_ready: requireReady,
        p_lock_on_start: lockOnStart,
        p_host_can_play: hostCanPlay,
        p_allow_spectators: allowSpectators
      });

      if (error) throw error;

      createdLobbyId = data.lobby_id;
      createdCode = data.code;

      container.querySelector('#create-form').style.display = 'none';
      container.querySelector('#lobby-created').style.display = 'block';
      container.querySelector('#invite-code').textContent = data.code;

      generateQRCode(data.code);
      setupLobbyCreatedActions(data.code, data.lobby_id);

    } catch (error) {
      console.error('Error creating lobby:', error);
      alert('Failed to create lobby: ' + error.message);
      createBtn.disabled = false;
      createBtn.textContent = 'Create Lobby';
    }
  });

  joinBtn.addEventListener('click', async () => {
    const code = joinCodeInput.value.trim();

    if (!code || code.length !== 6) {
      showJoinError('Please enter a 6-character code');
      return;
    }

    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining...';
    joinError.style.display = 'none';

    try {
      const { data, error } = await supabase.rpc('join_friend_lobby', {
        p_code: code,
        p_as_spectator: false
      });

      if (error) throw error;

      onLobbyJoined(data);

    } catch (error) {
      console.error('Error joining lobby:', error);
      showJoinError(error.message);
      joinBtn.disabled = false;
      joinBtn.textContent = 'Join Lobby';
    }
  });

  function showJoinError(message) {
    joinError.textContent = message;
    joinError.style.display = 'block';
  }

  function generateQRCode(code) {
    const qrContainer = container.querySelector('#qr-code');
    const joinLink = `https://braindash.co/join/${code}`;

    qrContainer.innerHTML = `
      <div style="
        display: inline-block;
        padding: 15px;
        background: white;
        border-radius: 8px;
      ">
        <div id="qr-canvas"></div>
      </div>
    `;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#000000';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(joinLink, 100, 100);
    ctx.fillText('Scan to join', 100, 120);

    const qrCanvas = container.querySelector('#qr-canvas');
    qrCanvas.appendChild(canvas);
  }

  function setupLobbyCreatedActions(code, lobbyId) {
    const joinLink = `https://braindash.co/join/${code}`;

    container.querySelector('#copy-link-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(joinLink);
        const btn = container.querySelector('#copy-link-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    });

    container.querySelector('#share-btn').addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join my BrainDash match!',
            text: `Join my BrainDash cash match! Code: ${code}`,
            url: joinLink
          });
        } catch (error) {
          console.log('Share cancelled or failed:', error);
        }
      } else {
        await navigator.clipboard.writeText(joinLink);
        alert('Link copied to clipboard!');
      }
    });

    container.querySelector('#enter-lobby-btn').addEventListener('click', () => {
      onLobbyCreated(lobbyId, code);
    });
  }
}
