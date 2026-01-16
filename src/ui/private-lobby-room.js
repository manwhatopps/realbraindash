import { supabase } from '../supabase-client.js';

export async function createPrivateLobbyRoom(container, lobbyId, onMatchStarted) {
  let lobbyData = null;
  let members = [];
  let currentUserId = null;
  let realtimeChannel = null;

  const { data: { user } } = await supabase.auth.getUser();
  currentUserId = user?.id;

  async function loadLobbyData() {
    const { data: lobby, error: lobbyError } = await supabase
      .from('friend_lobbies')
      .select('*')
      .eq('id', lobbyId)
      .single();

    if (lobbyError) {
      console.error('Error loading lobby:', lobbyError);
      return;
    }

    lobbyData = lobby;

    const { data: memberData, error: memberError } = await supabase
      .from('friend_lobby_members')
      .select(`
        *,
        user:user_id (
          id,
          email
        )
      `)
      .eq('lobby_id', lobbyId)
      .order('joined_at', { ascending: true });

    if (memberError) {
      console.error('Error loading members:', memberError);
      return;
    }

    members = memberData || [];
    render();
  }

  function render() {
    if (!lobbyData) {
      container.innerHTML = '<div style="color: white; text-align: center;">Loading...</div>';
      return;
    }

    const isHost = lobbyData.host_user_id === currentUserId;
    const playerCount = members.filter(m => m.role === 'player').length;
    const readyCount = members.filter(m => m.role === 'player' && m.is_ready).length;
    const allReady = lobbyData.require_ready ? readyCount === playerCount : true;
    const canStart = isHost && playerCount >= 2 && allReady && lobbyData.status === 'open';

    container.innerHTML = `
      <div style="max-width: 900px; margin: 40px auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: bold; color: #fff; margin-bottom: 10px;">
            Private Lobby
          </h1>
          <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 4px; margin-bottom: 20px;">
            ${lobbyData.code}
          </div>
          ${lobbyData.status === 'started' ? `
            <div style="
              display: inline-block;
              padding: 10px 20px;
              background: rgba(255, 200, 0, 0.2);
              border: 1px solid rgba(255, 200, 0, 0.5);
              border-radius: 8px;
              color: #ffc800;
              font-weight: bold;
            ">
              Lobby Locked - Game Started
            </div>
          ` : ''}
        </div>

        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 30px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 30px;
        ">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
            <div>
              <div style="color: #aaa; font-size: 14px; margin-bottom: 5px;">Entry Fee</div>
              <div style="color: #fff; font-size: 20px; font-weight: bold;">
                $${(lobbyData.entry_fee_cents / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div style="color: #aaa; font-size: 14px; margin-bottom: 5px;">Max Players</div>
              <div style="color: #fff; font-size: 20px; font-weight: bold;">
                ${playerCount}/${lobbyData.max_players}
              </div>
            </div>
            <div>
              <div style="color: #aaa; font-size: 14px; margin-bottom: 5px;">Ready Status</div>
              <div style="color: #fff; font-size: 20px; font-weight: bold;">
                ${readyCount}/${playerCount}
              </div>
            </div>
            <div>
              <div style="color: #aaa; font-size: 14px; margin-bottom: 5px;">Host</div>
              <div style="color: #fff; font-size: 16px;">
                ${members.find(m => m.user_id === lobbyData.host_user_id)?.user?.email || 'Unknown'}
              </div>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <div style="color: #aaa; font-size: 14px; margin-bottom: 10px;">Settings</div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
              ${lobbyData.require_ready ? '<span style="padding: 6px 12px; background: rgba(102, 126, 234, 0.2); border-radius: 6px; color: #667eea; font-size: 13px;">Ready Check</span>' : ''}
              ${lobbyData.lock_on_start ? '<span style="padding: 6px 12px; background: rgba(102, 126, 234, 0.2); border-radius: 6px; color: #667eea; font-size: 13px;">Lock on Start</span>' : ''}
              ${lobbyData.allow_spectators ? '<span style="padding: 6px 12px; background: rgba(102, 126, 234, 0.2); border-radius: 6px; color: #667eea; font-size: 13px;">Spectators Allowed</span>' : ''}
            </div>
          </div>
        </div>

        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 30px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 30px;
        ">
          <h2 style="font-size: 24px; font-weight: bold; color: #fff; margin-bottom: 20px;">
            Players (${playerCount})
          </h2>

          <div id="members-list">
            ${members
              .filter(m => m.role === 'player')
              .map(member => `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 15px;
                  background: rgba(0, 0, 0, 0.3);
                  border-radius: 8px;
                  margin-bottom: 10px;
                  border: 2px solid ${member.is_ready ? 'rgba(46, 213, 115, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
                ">
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="
                      width: 40px;
                      height: 40px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                    ">
                      ${member.user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style="color: #fff; font-weight: bold;">
                        ${member.user?.email || 'Unknown'}
                        ${member.user_id === lobbyData.host_user_id ? '<span style="color: #ffc800; margin-left: 8px;">👑 Host</span>' : ''}
                        ${member.user_id === currentUserId ? '<span style="color: #667eea; margin-left: 8px;">(You)</span>' : ''}
                      </div>
                    </div>
                  </div>
                  <div style="
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 14px;
                    ${member.is_ready
                      ? 'background: rgba(46, 213, 115, 0.2); color: #2ed573; border: 1px solid #2ed573;'
                      : 'background: rgba(255, 255, 255, 0.1); color: #aaa; border: 1px solid rgba(255, 255, 255, 0.2);'
                    }
                  ">
                    ${member.is_ready ? 'READY' : 'NOT READY'}
                  </div>
                </div>
              `).join('')}
          </div>

          ${members.filter(m => m.role === 'spectator').length > 0 ? `
            <h3 style="font-size: 20px; font-weight: bold; color: #fff; margin: 30px 0 15px;">
              Spectators (${members.filter(m => m.role === 'spectator').length})
            </h3>
            ${members
              .filter(m => m.role === 'spectator')
              .map(member => `
                <div style="
                  display: flex;
                  align-items: center;
                  padding: 15px;
                  background: rgba(0, 0, 0, 0.2);
                  border-radius: 8px;
                  margin-bottom: 10px;
                  border: 2px solid rgba(255, 255, 255, 0.05);
                ">
                  <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    margin-right: 15px;
                  ">
                    ${member.user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style="color: #aaa;">
                    ${member.user?.email || 'Unknown'}
                    <span style="color: #888; margin-left: 8px; font-size: 12px;">Spectator</span>
                  </div>
                </div>
              `).join('')}
          ` : ''}
        </div>

        <div style="display: flex; gap: 15px; justify-content: center;">
          ${(() => {
            const currentMember = members.find(m => m.user_id === currentUserId && m.role === 'player');
            if (currentMember) {
              return `
                <button id="toggle-ready-btn" style="
                  padding: 16px 32px;
                  font-size: 18px;
                  font-weight: bold;
                  background: ${currentMember.is_ready
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, #2ed573 0%, #17c0eb 100%)'
                  };
                  color: white;
                  border: ${currentMember.is_ready ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'};
                  border-radius: 8px;
                  cursor: pointer;
                  min-width: 200px;
                ">
                  ${currentMember.is_ready ? 'Not Ready' : 'Ready Up'}
                </button>
              `;
            }
            return '';
          })()}

          ${isHost && lobbyData.status === 'open' ? `
            <button id="start-match-btn" ${!canStart ? 'disabled' : ''} style="
              padding: 16px 32px;
              font-size: 18px;
              font-weight: bold;
              background: ${canStart
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.1)'
              };
              color: ${canStart ? 'white' : '#666'};
              border: none;
              border-radius: 8px;
              cursor: ${canStart ? 'pointer' : 'not-allowed'};
              min-width: 200px;
            ">
              Start Match
            </button>
            ${!canStart && playerCount < 2 ? `
              <div style="color: #ff6b6b; font-size: 14px; margin-top: 10px;">
                Need at least 2 players to start
              </div>
            ` : ''}
            ${!canStart && lobbyData.require_ready && !allReady ? `
              <div style="color: #ffc800; font-size: 14px; margin-top: 10px;">
                Waiting for all players to ready up
              </div>
            ` : ''}
          ` : ''}
        </div>
      </div>
    `;

    const toggleReadyBtn = container.querySelector('#toggle-ready-btn');
    if (toggleReadyBtn) {
      toggleReadyBtn.addEventListener('click', handleToggleReady);
    }

    const startMatchBtn = container.querySelector('#start-match-btn');
    if (startMatchBtn && !startMatchBtn.disabled) {
      startMatchBtn.addEventListener('click', handleStartMatch);
    }
  }

  async function handleToggleReady() {
    const currentMember = members.find(m => m.user_id === currentUserId && m.role === 'player');
    if (!currentMember) return;

    try {
      const { error } = await supabase.rpc('set_friend_lobby_ready', {
        p_lobby_id: lobbyId,
        p_ready: !currentMember.is_ready
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error toggling ready:', error);
      alert('Failed to update ready status: ' + error.message);
    }
  }

  async function handleStartMatch() {
    try {
      const { error } = await supabase.rpc('start_friend_lobby', {
        p_lobby_id: lobbyId
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error starting match:', error);
      alert('Failed to start match: ' + error.message);
    }
  }

  function setupRealtime() {
    realtimeChannel = supabase
      .channel(`lobby:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_lobbies',
          filter: `id=eq.${lobbyId}`
        },
        (payload) => {
          console.log('Lobby changed:', payload);
          if (payload.new && payload.new.status === 'started') {
            onMatchStarted(lobbyId);
          }
          loadLobbyData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_lobby_members',
          filter: `lobby_id=eq.${lobbyId}`
        },
        (payload) => {
          console.log('Members changed:', payload);
          loadLobbyData();
        }
      )
      .subscribe();
  }

  await loadLobbyData();
  setupRealtime();

  return {
    cleanup: () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    }
  };
}
