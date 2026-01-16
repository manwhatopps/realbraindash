import { supabase } from '../supabase-client.js';

export async function createPlayWithFriends(container, onLobbyCreated, onLobbyJoined) {
  container.innerHTML = `
    <div style="max-width: 900px; margin: 40px auto; padding: 20px;">
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
            <!-- Friends-only Toggle -->
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
              <label style="display: flex; align-items: center; color: #fff; cursor: pointer;">
                <input type="checkbox" id="friends-only" checked style="margin-right: 10px; width: 18px; height: 18px;" />
                <div>
                  <div style="font-weight: bold;">Friends-only (invite code required)</div>
                  <div id="friends-only-desc" style="font-size: 12px; color: #888; margin-top: 4px;">
                    Only players with the code can join
                  </div>
                </div>
              </label>
            </div>

            <!-- Max Players -->
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #aaa; font-size: 14px;">
                Max Players (2–12)
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

            <!-- Entry Fee -->
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #aaa; font-size: 14px;">
                Entry Fee
              </label>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px;">
                <button class="fee-preset" data-fee="100" style="
                  padding: 10px;
                  border-radius: 8px;
                  border: 2px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  cursor: pointer;
                  transition: all 0.2s;
                  font-weight: bold;
                ">$1</button>
                <button class="fee-preset" data-fee="500" style="
                  padding: 10px;
                  border-radius: 8px;
                  border: 2px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  cursor: pointer;
                  transition: all 0.2s;
                  font-weight: bold;
                ">$5</button>
                <button class="fee-preset" data-fee="1000" style="
                  padding: 10px;
                  border-radius: 8px;
                  border: 2px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  cursor: pointer;
                  transition: all 0.2s;
                  font-weight: bold;
                ">$10</button>
                <button id="custom-fee-btn" style="
                  padding: 10px;
                  border-radius: 8px;
                  border: 2px solid rgba(255, 255, 255, 0.2);
                  background: rgba(0, 0, 0, 0.3);
                  color: white;
                  cursor: pointer;
                  transition: all 0.2s;
                  font-weight: bold;
                ">Custom</button>
              </div>

              <!-- Custom Fee Input (initially hidden) -->
              <div id="custom-fee-container" style="display: none; margin-bottom: 10px;">
                <div style="position: relative;">
                  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #aaa; font-size: 16px;">$</span>
                  <input
                    type="number"
                    id="custom-fee-input"
                    placeholder="0.00"
                    step="0.01"
                    min="1.00"
                    style="
                      width: 100%;
                      padding: 12px 12px 12px 24px;
                      border-radius: 8px;
                      border: 1px solid rgba(255, 255, 255, 0.2);
                      background: rgba(0, 0, 0, 0.3);
                      color: white;
                      font-size: 16px;
                    "
                  />
                </div>
              </div>

              <!-- Selected Fee Display -->
              <div id="selected-fee" style="
                padding: 8px 12px;
                background: rgba(102, 126, 234, 0.1);
                border: 1px solid rgba(102, 126, 234, 0.3);
                border-radius: 6px;
                color: #667eea;
                font-size: 14px;
                font-weight: bold;
              ">
                Selected: $1.00
              </div>
            </div>

            <!-- Game Settings Toggles -->
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

            <!-- Validation Helper Text -->
            <div id="validation-helper" style="
              display: none;
              margin-bottom: 12px;
              padding: 8px 12px;
              background: rgba(255, 165, 0, 0.1);
              border: 1px solid rgba(255, 165, 0, 0.3);
              border-radius: 6px;
              color: #ffa500;
              font-size: 13px;
            "></div>

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
              transition: transform 0.2s, opacity 0.2s;
            ">
              Create Lobby
            </button>
          </div>

          <!-- After Create Success State -->
          <div id="lobby-created" style="display: none;">
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="
                display: inline-block;
                padding: 8px 16px;
                background: rgba(46, 213, 115, 0.2);
                border: 1px solid rgba(46, 213, 115, 0.4);
                border-radius: 20px;
                color: #2ed573;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 20px;
              ">
                ✓ Lobby Created
              </div>

              <div style="font-size: 14px; color: #aaa; margin-bottom: 10px;">Invite Code</div>
              <div id="invite-code" style="
                font-family: 'Courier New', monospace;
                font-size: 48px;
                font-weight: bold;
                color: #fff;
                letter-spacing: 8px;
                padding: 20px;
                background: rgba(0, 0, 0, 0.4);
                border: 2px solid rgba(102, 126, 234, 0.3);
                border-radius: 12px;
                margin-bottom: 20px;
              "></div>

              <div style="font-size: 13px; color: #888; margin-bottom: 20px;">
                Share this code with up to 11 friends to join your private lobby
              </div>
            </div>

            <!-- QR Code -->
            <div id="qr-code" style="text-align: center; margin-bottom: 20px;"></div>

            <!-- Action Buttons -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button id="copy-link-btn" style="
                padding: 14px;
                font-size: 16px;
                font-weight: 600;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
              ">
                📋 Copy Link
              </button>

              <button id="share-btn" style="
                padding: 14px;
                font-size: 16px;
                font-weight: 600;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
              ">
                📤 Share
              </button>

              <button id="enter-lobby-btn" style="
                padding: 16px;
                font-size: 18px;
                font-weight: bold;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 10px;
                transition: transform 0.2s;
              ">
                Enter Lobby →
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
              Invite Code
            </label>
            <input
              type="text"
              id="join-code"
              placeholder="ABC123"
              maxlength="6"
              style="
                width: 100%;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                background: rgba(0, 0, 0, 0.3);
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 32px;
                text-align: center;
                letter-spacing: 6px;
                text-transform: uppercase;
                transition: border-color 0.2s;
              "
            />
            <div style="font-size: 12px; color: #666; text-align: center; margin-top: 8px;">
              Enter the 6-character code
            </div>
          </div>

          <!-- Validation Helper for Join -->
          <div id="join-validation-helper" style="
            display: none;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid rgba(255, 165, 0, 0.3);
            border-radius: 6px;
            color: #ffa500;
            font-size: 13px;
          "></div>

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
            transition: transform 0.2s, opacity 0.2s;
          ">
            Join
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
  let isCustomFee = false;
  let createdLobbyId = null;
  let createdCode = null;

  const feePresets = container.querySelectorAll('.fee-preset');
  const customFeeBtn = container.querySelector('#custom-fee-btn');
  const customFeeContainer = container.querySelector('#custom-fee-container');
  const customFeeInput = container.querySelector('#custom-fee-input');
  const selectedFeeDisplay = container.querySelector('#selected-fee');
  const createBtn = container.querySelector('#create-lobby-btn');
  const joinBtn = container.querySelector('#join-lobby-btn');
  const joinCodeInput = container.querySelector('#join-code');
  const joinError = container.querySelector('#join-error');
  const validationHelper = container.querySelector('#validation-helper');
  const joinValidationHelper = container.querySelector('#join-validation-helper');
  const maxPlayersInput = container.querySelector('#max-players');
  const friendsOnlyCheckbox = container.querySelector('#friends-only');
  const friendsOnlyDesc = container.querySelector('#friends-only-desc');

  // Friends-only toggle handler
  friendsOnlyCheckbox.addEventListener('change', () => {
    if (friendsOnlyCheckbox.checked) {
      friendsOnlyDesc.textContent = 'Only players with the code can join';
    } else {
      friendsOnlyDesc.textContent = 'Public (shows in Test Lobby list)';
    }
  });

  // Fee preset buttons handler
  feePresets.forEach(btn => {
    btn.addEventListener('click', () => {
      isCustomFee = false;
      selectedFee = parseInt(btn.dataset.fee);
      customFeeContainer.style.display = 'none';
      customFeeInput.value = '';

      feePresets.forEach(b => {
        b.style.background = 'rgba(0, 0, 0, 0.3)';
        b.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
      customFeeBtn.style.background = 'rgba(0, 0, 0, 0.3)';
      customFeeBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';

      btn.style.background = 'rgba(102, 126, 234, 0.3)';
      btn.style.borderColor = '#667eea';

      updateSelectedFeeDisplay();
      validateCreateForm();
    });
  });

  // Custom fee button handler
  customFeeBtn.addEventListener('click', () => {
    isCustomFee = true;
    customFeeContainer.style.display = 'block';
    customFeeInput.focus();

    feePresets.forEach(b => {
      b.style.background = 'rgba(0, 0, 0, 0.3)';
      b.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });

    customFeeBtn.style.background = 'rgba(102, 126, 234, 0.3)';
    customFeeBtn.style.borderColor = '#667eea';

    if (customFeeInput.value) {
      const dollars = parseFloat(customFeeInput.value);
      selectedFee = Math.round(dollars * 100);
    }

    updateSelectedFeeDisplay();
    validateCreateForm();
  });

  // Custom fee input handler
  customFeeInput.addEventListener('input', () => {
    const dollars = parseFloat(customFeeInput.value) || 0;
    selectedFee = Math.round(dollars * 100);
    updateSelectedFeeDisplay();
    validateCreateForm();
  });

  // Max players validation
  maxPlayersInput.addEventListener('input', validateCreateForm);

  // Initialize with $1 selected
  feePresets[0].click();

  function updateSelectedFeeDisplay() {
    const dollars = (selectedFee / 100).toFixed(2);
    selectedFeeDisplay.textContent = `Selected: $${dollars}`;
  }

  function validateCreateForm() {
    const maxPlayers = parseInt(maxPlayersInput.value);
    const isValidMaxPlayers = maxPlayers >= 2 && maxPlayers <= 12;
    const isValidFee = selectedFee >= 100;

    let errorMessage = '';

    if (!isValidMaxPlayers) {
      errorMessage = 'Max players must be between 2 and 12';
    } else if (!isValidFee) {
      errorMessage = 'Entry fee must be at least $1.00';
    }

    if (errorMessage) {
      validationHelper.textContent = errorMessage;
      validationHelper.style.display = 'block';
      createBtn.disabled = true;
      createBtn.style.opacity = '0.5';
      createBtn.style.cursor = 'not-allowed';
    } else {
      validationHelper.style.display = 'none';
      createBtn.disabled = false;
      createBtn.style.opacity = '1';
      createBtn.style.cursor = 'pointer';
    }
  }

  // Join code input handler - auto-uppercase and strip spaces/hyphens
  joinCodeInput.addEventListener('input', (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[\s\-]/g, '');
    e.target.value = value;

    const isValid = value.length === 6;

    if (value.length > 0 && value.length < 6) {
      joinValidationHelper.textContent = `Code must be 6 characters (${value.length}/6)`;
      joinValidationHelper.style.display = 'block';
      joinBtn.disabled = true;
      joinBtn.style.opacity = '0.5';
      joinBtn.style.cursor = 'not-allowed';
    } else if (isValid) {
      joinValidationHelper.style.display = 'none';
      joinBtn.disabled = false;
      joinBtn.style.opacity = '1';
      joinBtn.style.cursor = 'pointer';
      joinCodeInput.style.borderColor = 'rgba(46, 213, 115, 0.5)';
    } else {
      joinValidationHelper.style.display = 'none';
      joinBtn.disabled = true;
      joinBtn.style.opacity = '0.5';
      joinBtn.style.cursor = 'not-allowed';
      joinCodeInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    }

    joinError.style.display = 'none';
  });

  // Initial validation states
  validateCreateForm();
  joinBtn.disabled = true;
  joinBtn.style.opacity = '0.5';
  joinBtn.style.cursor = 'not-allowed';

  createBtn.addEventListener('click', async () => {
    if (createBtn.disabled) return;

    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';
    createBtn.style.opacity = '0.7';

    try {
      const maxPlayers = parseInt(maxPlayersInput.value);
      const requireReady = container.querySelector('#require-ready').checked;
      const lockOnStart = container.querySelector('#lock-on-start').checked;
      const hostCanPlay = container.querySelector('#host-can-play').checked;
      const allowSpectators = container.querySelector('#allow-spectators').checked;
      const friendsOnly = friendsOnlyCheckbox.checked;

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
      createBtn.style.opacity = '1';
      validateCreateForm();
    }
  });

  joinBtn.addEventListener('click', async () => {
    if (joinBtn.disabled) return;

    const code = joinCodeInput.value.trim();

    if (!code || code.length !== 6) {
      showJoinError('Please enter a 6-character code');
      return;
    }

    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining...';
    joinBtn.style.opacity = '0.7';
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
      showJoinError(error.message || 'Failed to join lobby');
      joinBtn.disabled = false;
      joinBtn.textContent = 'Join';
      joinBtn.style.opacity = '1';

      if (joinCodeInput.value.length === 6) {
        joinBtn.disabled = false;
        joinBtn.style.opacity = '1';
        joinBtn.style.cursor = 'pointer';
      }
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
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      ">
        <div id="qr-canvas"></div>
      </div>
      <div style="font-size: 12px; color: #888; margin-top: 10px;">
        Scan to join instantly
      </div>
    `;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, 100, 90);
    ctx.font = '10px sans-serif';
    ctx.fillText('braindash.co/join/', 100, 110);
    ctx.fillText('Placeholder QR', 100, 130);

    const qrCanvas = container.querySelector('#qr-canvas');
    qrCanvas.appendChild(canvas);
  }

  function setupLobbyCreatedActions(code, lobbyId) {
    const joinLink = `https://braindash.co/join/${code}`;

    const copyLinkBtn = container.querySelector('#copy-link-btn');
    const shareBtn = container.querySelector('#share-btn');

    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(joinLink);
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = '✓ Copied!';
        copyLinkBtn.style.background = 'rgba(46, 213, 115, 0.2)';
        copyLinkBtn.style.borderColor = 'rgba(46, 213, 115, 0.4)';
        setTimeout(() => {
          copyLinkBtn.textContent = originalText;
          copyLinkBtn.style.background = 'rgba(255, 255, 255, 0.1)';
          copyLinkBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy link');
      }
    });

    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join my BrainDash match!',
            text: `Join my BrainDash test cash match! Code: ${code}`,
            url: joinLink
          });
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.log('Share cancelled or failed:', error);
            await navigator.clipboard.writeText(joinLink);
            const originalText = shareBtn.textContent;
            shareBtn.textContent = '✓ Link Copied!';
            shareBtn.style.background = 'rgba(46, 213, 115, 0.2)';
            shareBtn.style.borderColor = 'rgba(46, 213, 115, 0.4)';
            setTimeout(() => {
              shareBtn.textContent = originalText;
              shareBtn.style.background = 'rgba(255, 255, 255, 0.1)';
              shareBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }, 2000);
          }
        }
      } else {
        await navigator.clipboard.writeText(joinLink);
        const originalText = shareBtn.textContent;
        shareBtn.textContent = '✓ Link Copied!';
        shareBtn.style.background = 'rgba(46, 213, 115, 0.2)';
        shareBtn.style.borderColor = 'rgba(46, 213, 115, 0.4)';
        setTimeout(() => {
          shareBtn.textContent = originalText;
          shareBtn.style.background = 'rgba(255, 255, 255, 0.1)';
          shareBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }, 2000);
      }
    });

    container.querySelector('#enter-lobby-btn').addEventListener('click', () => {
      onLobbyCreated(lobbyId, code);
    });
  }
}
