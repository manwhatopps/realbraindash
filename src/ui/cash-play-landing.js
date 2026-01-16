export function createCashPlayLanding(container, onJoinPublic, onPlayWithFriends) {
  container.innerHTML = `
    <div style="max-width: 600px; margin: 40px auto; padding: 20px;">
      <h1 style="text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 40px; color: #fff;">
        Cash Play
      </h1>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <button id="join-public-btn" style="
          width: 100%;
          padding: 30px;
          font-size: 20px;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        ">
          Join Public Lobby
        </button>

        <button id="play-friends-btn" style="
          width: 100%;
          padding: 30px;
          font-size: 20px;
          font-weight: bold;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        ">
          Play with Friends
        </button>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #888; font-size: 14px;">
        <p>Join Public Lobby: Compete against random players</p>
        <p>Play with Friends: Create private matches up to 12 players</p>
      </div>
    </div>
  `;

  const joinPublicBtn = container.querySelector('#join-public-btn');
  const playFriendsBtn = container.querySelector('#play-friends-btn');

  joinPublicBtn.addEventListener('mouseenter', () => {
    joinPublicBtn.style.transform = 'translateY(-2px)';
    joinPublicBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  joinPublicBtn.addEventListener('mouseleave', () => {
    joinPublicBtn.style.transform = 'translateY(0)';
    joinPublicBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  });

  playFriendsBtn.addEventListener('mouseenter', () => {
    playFriendsBtn.style.transform = 'translateY(-2px)';
    playFriendsBtn.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.6)';
  });

  playFriendsBtn.addEventListener('mouseleave', () => {
    playFriendsBtn.style.transform = 'translateY(0)';
    playFriendsBtn.style.boxShadow = '0 4px 15px rgba(245, 87, 108, 0.4)';
  });

  joinPublicBtn.addEventListener('click', onJoinPublic);
  playFriendsBtn.addEventListener('click', onPlayWithFriends);
}
