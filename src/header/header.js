import { supabase } from '../supabase-client.js';
import { refreshBalance } from '../wallet-ui.js';
import { getUserTier, getTierBadgeHTML } from '../tier-system.js';

let currentUser = null;
let currentSession = null;

export function initHeader() {
  console.log('[Header] Initializing');

  supabase.auth.onAuthStateChange((event, session) => {
    (async () => {
      currentSession = session;
      currentUser = session?.user || null;
      updateHeaderUI();
      if (currentUser) {
        await refreshBalance();
      }
    })();
  });

  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    currentSession = session;
    currentUser = session?.user || null;
    updateHeaderUI();
    if (currentUser) {
      await refreshBalance();
    }
  })();

  setupHeaderEventListeners();
}

function updateHeaderUI() {
  const guestControls = document.getElementById('headerGuestControls');
  const authControls = document.getElementById('headerAuthControls');
  const oldWalletStrip = document.getElementById('oldWalletStrip');
  const mobileGuestSection = document.getElementById('headerMobileGuestSection');
  const mobileAuthSection = document.getElementById('headerMobileAuthSection');

  if (currentUser) {
    if (guestControls) guestControls.style.display = 'none';
    if (authControls) authControls.style.display = 'flex';
    if (oldWalletStrip) oldWalletStrip.style.display = 'none';
    if (mobileGuestSection) mobileGuestSection.style.display = 'none';
    if (mobileAuthSection) mobileAuthSection.style.display = 'block';

    const userNameEl = document.getElementById('headerUserName');
    if (userNameEl) {
      const email = currentUser.email || 'User';
      const displayName = email.split('@')[0];
      userNameEl.textContent = displayName;
    }

    const userAvatarEl = document.getElementById('headerUserAvatar');
    if (userAvatarEl) {
      const email = currentUser.email || 'U';
      userAvatarEl.textContent = email.charAt(0).toUpperCase();
    }

    (async () => {
      const tierData = await getUserTier();
      const tierBadgeEl = document.getElementById('headerTierBadge');
      if (tierBadgeEl && tierData) {
        tierBadgeEl.innerHTML = getTierBadgeHTML(tierData.tier, false);
        tierBadgeEl.style.display = 'inline-flex';
      }
    })();
  } else {
    if (guestControls) guestControls.style.display = 'flex';
    if (authControls) authControls.style.display = 'none';
    if (oldWalletStrip) oldWalletStrip.style.display = 'none';
    if (mobileGuestSection) mobileGuestSection.style.display = 'block';
    if (mobileAuthSection) mobileAuthSection.style.display = 'none';
  }
}

function setupHeaderEventListeners() {
  const signInBtn = document.getElementById('headerSignIn');
  const signUpBtn = document.getElementById('headerSignUp');
  const walletPill = document.getElementById('headerWalletPill');
  const userMenuBtn = document.getElementById('headerUserMenuBtn');
  const userMenu = document.getElementById('headerUserMenu');
  const signOutBtn = document.getElementById('headerSignOut');
  const mobileMenuBtn = document.getElementById('headerMobileMenuBtn');
  const mobileMenu = document.getElementById('headerMobileMenu');
  const mobileSignIn = document.getElementById('headerMobileSignIn');
  const mobileSignUp = document.getElementById('headerMobileSignUp');
  const mobileSignOut = document.getElementById('headerMobileSignOut');
  const walletDeposit = document.querySelectorAll('[data-action="deposit"]');
  const walletWithdraw = document.querySelectorAll('[data-action="withdraw"]');

  const rulesBtn = document.getElementById('headerRulesBtn');
  const helpBtn = document.getElementById('headerHelpBtn');
  const termsBtn = document.getElementById('headerTermsBtn');
  const mobileRulesBtn = document.getElementById('headerMobileRulesBtn');
  const mobileHelpBtn = document.getElementById('headerMobileHelpBtn');
  const mobileTermsBtn = document.getElementById('headerMobileTermsBtn');

  signInBtn?.addEventListener('click', () => {
    openAuthModal('signin');
  });

  signUpBtn?.addEventListener('click', () => {
    openAuthModal('signup');
  });

  mobileSignIn?.addEventListener('click', () => {
    closeMobileMenu();
    openAuthModal('signin');
  });

  mobileSignUp?.addEventListener('click', () => {
    closeMobileMenu();
    openAuthModal('signup');
  });

  walletPill?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleWalletMenu();
  });

  userMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUserMenu();
  });

  signOutBtn?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    // Clear OAuth success flag so it can show again on next sign-in
    sessionStorage.removeItem('bd_oauth_success_shown');
    closeUserMenu();
    window.location.href = '/';
  });

  mobileSignOut?.addEventListener('click', async () => {
    closeMobileMenu();
    await supabase.auth.signOut();
    // Clear OAuth success flag so it can show again on next sign-in
    sessionStorage.removeItem('bd_oauth_success_shown');
    window.location.href = '/';
  });

  mobileMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });

  document.addEventListener('click', () => {
    closeUserMenu();
    closeWalletMenu();
  });

  rulesBtn?.addEventListener('click', () => {
    showInfoModal('rules');
  });

  helpBtn?.addEventListener('click', () => {
    showInfoModal('help');
  });

  termsBtn?.addEventListener('click', () => {
    showInfoModal('terms');
  });

  mobileRulesBtn?.addEventListener('click', () => {
    closeMobileMenu();
    showInfoModal('rules');
  });

  mobileHelpBtn?.addEventListener('click', () => {
    closeMobileMenu();
    showInfoModal('help');
  });

  mobileTermsBtn?.addEventListener('click', () => {
    closeMobileMenu();
    showInfoModal('terms');
  });

  walletDeposit.forEach(btn => {
    btn.addEventListener('click', () => {
      closeWalletMenu();
      closeMobileMenu();
      const depositBtn = document.getElementById('openDeposit');
      if (depositBtn) depositBtn.click();
    });
  });

  walletWithdraw.forEach(btn => {
    btn.addEventListener('click', () => {
      closeWalletMenu();
      closeMobileMenu();
      const withdrawBtn = document.getElementById('openWithdraw');
      if (withdrawBtn) withdrawBtn.click();
    });
  });
}

function openAuthModal(mode = 'signin') {
  const signInSheet = document.getElementById('signInSheet');
  const signUpSheet = document.getElementById('signUpSheet');

  if (mode === 'signup' && signUpSheet) {
    signUpSheet.style.display = 'grid';
    signUpSheet.setAttribute('aria-hidden', 'false');
  } else if (signInSheet) {
    signInSheet.style.display = 'grid';
    signInSheet.setAttribute('aria-hidden', 'false');
  }
}

export function switchToSignUp() {
  const signInSheet = document.getElementById('signInSheet');
  const signUpSheet = document.getElementById('signUpSheet');
  if (signInSheet) {
    signInSheet.style.display = 'none';
    signInSheet.setAttribute('aria-hidden', 'true');
  }
  if (signUpSheet) {
    signUpSheet.style.display = 'grid';
    signUpSheet.setAttribute('aria-hidden', 'false');
  }
}

export function switchToSignIn() {
  const signInSheet = document.getElementById('signInSheet');
  const signUpSheet = document.getElementById('signUpSheet');
  if (signUpSheet) {
    signUpSheet.style.display = 'none';
    signUpSheet.setAttribute('aria-hidden', 'true');
  }
  if (signInSheet) {
    signInSheet.style.display = 'grid';
    signInSheet.setAttribute('aria-hidden', 'false');
  }
}

function toggleWalletMenu() {
  const menu = document.getElementById('headerWalletMenu');
  if (!menu) return;

  const isHidden = menu.style.display === 'none' || !menu.style.display;
  menu.style.display = isHidden ? 'block' : 'none';

  closeUserMenu();
}

function closeWalletMenu() {
  const menu = document.getElementById('headerWalletMenu');
  if (menu) menu.style.display = 'none';
}

function toggleUserMenu() {
  const menu = document.getElementById('headerUserMenu');
  if (!menu) return;

  const isHidden = menu.style.display === 'none' || !menu.style.display;
  menu.style.display = isHidden ? 'block' : 'none';

  closeWalletMenu();
}

function closeUserMenu() {
  const menu = document.getElementById('headerUserMenu');
  if (menu) menu.style.display = 'none';
}

function toggleMobileMenu() {
  const menu = document.getElementById('headerMobileMenu');
  if (!menu) return;

  const isHidden = menu.style.display === 'none' || !menu.style.display;
  menu.style.display = isHidden ? 'flex' : 'none';
}

function closeMobileMenu() {
  const menu = document.getElementById('headerMobileMenu');
  if (menu) menu.style.display = 'none';
}

export function updateHeaderBalance(balanceCents) {
  const balanceEl = document.getElementById('headerWalletBalance');
  if (balanceEl) {
    const dollars = ((balanceCents || 0) / 100).toFixed(2);
    balanceEl.textContent = `$${dollars}`;
  }
}

function showInfoModal(type) {
  const content = {
    rules: {
      title: 'Game Rules',
      body: `
        <h3 style="color:var(--accent2);margin-bottom:12px">How to Play</h3>
        <ul style="line-height:1.8;color:var(--txt);margin-left:20px">
          <li>Answer trivia questions as fast as possible</li>
          <li>Each correct answer earns you points</li>
          <li>Speed matters - faster answers = more points</li>
          <li>In elimination rounds, the slowest player is eliminated</li>
          <li>Last player standing wins!</li>
        </ul>

        <h3 style="color:var(--accent2);margin:20px 0 12px">Game Modes</h3>
        <ul style="line-height:1.8;color:var(--txt);margin-left:20px">
          <li><strong>Free Play:</strong> Practice mode with no stakes</li>
          <li><strong>Cash Play:</strong> Compete for real prizes (ID verification required)</li>
        </ul>
      `
    },
    help: {
      title: 'Help & Support',
      body: `
        <h3 style="color:var(--accent2);margin-bottom:12px">Getting Started</h3>
        <p style="line-height:1.8;color:var(--txt);margin-bottom:16px">
          New to BrainDash? Start with Free Play to get familiar with the game mechanics.
          When you're ready, sign up to save your progress and unlock Cash Play.
        </p>

        <h3 style="color:var(--accent2);margin-bottom:12px">Cash Play Requirements</h3>
        <ul style="line-height:1.8;color:var(--txt);margin-left:20px;margin-bottom:16px">
          <li>Create an account and verify your identity</li>
          <li>Deposit funds to your wallet</li>
          <li>Must be 18+ years old</li>
          <li>Available in select regions only</li>
        </ul>

        <h3 style="color:var(--accent2);margin-bottom:12px">Need More Help?</h3>
        <p style="line-height:1.8;color:var(--txt)">
          Contact us at <a href="mailto:support@braindash.com" style="color:var(--accent2)">support@braindash.com</a>
        </p>
      `
    },
    terms: {
      title: 'Terms & Conditions',
      body: `
        <h3 style="color:var(--accent2);margin-bottom:12px">Acceptance of Terms</h3>
        <p style="line-height:1.8;color:var(--txt);margin-bottom:16px">
          By accessing and using BrainDash, you accept and agree to be bound by the terms and provisions of this agreement.
        </p>

        <h3 style="color:var(--accent2);margin-bottom:12px">Cash Play</h3>
        <p style="line-height:1.8;color:var(--txt);margin-bottom:16px">
          Cash Play features involve real money. You must be 18 years or older and comply with all applicable laws in your jurisdiction.
          Identity verification is required for all Cash Play participants.
        </p>

        <h3 style="color:var(--accent2);margin-bottom:12px">Fair Play</h3>
        <p style="line-height:1.8;color:var(--txt);margin-bottom:16px">
          Cheating, collusion, or use of automated tools is strictly prohibited and will result in account termination
          and forfeiture of any funds or prizes.
        </p>

        <h3 style="color:var(--accent2);margin-bottom:12px">Privacy</h3>
        <p style="line-height:1.8;color:var(--txt);margin-bottom:16px">
          Your privacy is important to us. We collect and process personal data in accordance with our
          <a href="/legal/privacy.md" target="_blank" style="color:var(--accent2)">Privacy Policy</a>.
        </p>

        <p style="line-height:1.8;color:var(--muted);font-size:0.875rem;margin-top:24px">
          Last updated: November 2025<br>
          For full terms, visit <a href="/legal/terms.md" target="_blank" style="color:var(--accent2)">/legal/terms.md</a>
        </p>
      `
    }
  };

  const info = content[type];
  if (!info) return;

  const existingModal = document.getElementById('infoModal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'infoModal';
  modal.className = 'sheet';
  modal.style.display = 'grid';
  modal.setAttribute('aria-hidden', 'false');

  modal.innerHTML = `
    <div class="modal" style="max-height:85vh;overflow-y:auto">
      <button class="close" onclick="document.getElementById('infoModal').remove()" aria-label="Close">&times;</button>
      <h2 class="modal-title">${info.title}</h2>
      <div style="margin-top:20px">
        ${info.body}
      </div>
      <button class="btn" onclick="document.getElementById('infoModal').remove()" style="margin-top:24px;width:100%">Close</button>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}
