const ALLOWED_DEV_HOSTS = ['localhost', '127.0.0.1', 'local.stackblitz.io'];

const DEV_MODE = window.__DEV_MODE__ === true;
const DEV_BYPASS_AUTH = DEV_MODE;
const DEV_AUTO_KYC_APPROVAL = DEV_MODE;
const DEV_FAKE_BALANCE = 10000;

function isDevHostAllowed() {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  return ALLOWED_DEV_HOSTS.includes(hostname) ||
         hostname.includes('stackblitz') ||
         hostname.includes('webcontainer');
}

function validateDevMode() {
  if (DEV_MODE && !isDevHostAllowed()) {
    throw new Error(
      '🚨 DEV MODE BLOCKED ON NON-LOCALHOST 🚨\n' +
      'Dev mode can only run on localhost, 127.0.0.1, or StackBlitz environments.\n' +
      `Current hostname: ${window.location.hostname}\n` +
      'This is a security measure to prevent dev mode from running in production.'
    );
  }
}

function initDevMode() {
  if (!DEV_MODE) return;

  validateDevMode();

  console.warn(
    '%c⚠️ DEV MODE ENABLED ⚠️',
    'background: #ff6b6b; color: white; font-size: 20px; padding: 10px; font-weight: bold;'
  );
  console.warn('DEV MODE is active. This should NEVER happen in production.');
  console.warn('Features enabled:');
  console.warn('  - Bypass authentication');
  console.warn('  - Auto-approve KYC');
  console.warn('  - Fake wallet balance: $' + (DEV_FAKE_BALANCE / 100).toFixed(2));
  console.warn('  - Test data flag on all transactions');
}

function createDevUser() {
  if (!DEV_MODE) return null;

  return {
    id: 'dev-user-00000000-0000-0000-0000-000000000001',
    email: 'dev@braindash.local',
    user_metadata: {
      name: 'Developer Test Account',
      avatar: '🛠️'
    },
    kyc_status: 'verified',
    geo_allowed: true,
    balance_cents: DEV_FAKE_BALANCE,
    is_dev_user: true
  };
}

function getDevUser() {
  if (!DEV_MODE) return null;

  if (!window.DEV_USER) {
    window.DEV_USER = createDevUser();
  }

  return window.DEV_USER;
}

function canPlayCash(user) {
  if (DEV_MODE && DEV_BYPASS_AUTH) {
    console.log('[DEV MODE] Bypassing cash play checks');
    return true;
  }

  if (!user) return false;

  return user.kyc_status === 'verified' && user.geo_allowed === true;
}

function isTestMode() {
  return DEV_MODE;
}

function showDevBadge() {
  // DEV MODE badge hidden per user request
  // Internal dev mode logic still works for testing, but no UI banner
  return;
}

if (typeof window !== 'undefined') {
  try {
    initDevMode();
    if (DEV_MODE) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showDevBadge);
      } else {
        showDevBadge();
      }
    }
  } catch (error) {
    console.error('DEV MODE initialization error:', error);
    alert(error.message);
    throw error;
  }
}

export {
  DEV_MODE,
  DEV_BYPASS_AUTH,
  DEV_AUTO_KYC_APPROVAL,
  DEV_FAKE_BALANCE,
  validateDevMode,
  getDevUser,
  canPlayCash,
  isTestMode,
  showDevBadge
};
