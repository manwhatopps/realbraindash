/**
 * APP CONFIGURATION
 *
 * Central configuration for app behavior, including App Store review mode.
 */

console.log('[App Config] Loading configuration...');

// REVIEW MODE - Set to true when submitting to App Store for review
// When true:
// - Cash modes are hidden/disabled
// - Only Free Play is available
// - Ads are disabled (stubs only)
const REVIEW_MODE = false; // SET TO TRUE FOR APP STORE REVIEW

// AD CONFIGURATION
const AD_CONFIG = {
  enabled: !REVIEW_MODE, // Ads disabled in review mode
  interstitialFrequency: 3, // Show interstitial every N Free Play sessions
  rewardedEnabled: false, // Rewarded ads not implemented yet
  testMode: true, // Use test ads in development
};

// CASH MODE CONFIGURATION
const CASH_MODE_CONFIG = {
  enabled: !REVIEW_MODE, // Cash modes disabled in review mode
  testModeVisible: !REVIEW_MODE, // Test Cash mode disabled in review
  requireVerification: true, // Always require ID verification for real cash
  minimumDeposit: 5.00, // Minimum deposit amount in USD
  minimumWithdrawal: 10.00, // Minimum withdrawal amount in USD
};

// FREE PLAY CONFIGURATION
const FREE_PLAY_CONFIG = {
  enabled: true, // Always available
  guestMode: true, // Allow guest play without login
  maxSessionsPerDay: null, // No limit
  offlineMode: true, // Allow offline question fallback
};

// FEATURE FLAGS
const FEATURES = {
  biometricAuth: false, // Coming soon
  socialSharing: false, // Not implemented
  leaderboards: false, // Not implemented
  achievements: false, // Not implemented
};

// ENVIRONMENT
const ENV = {
  isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  isProduction: !window.location.hostname.includes('localhost'),
  version: '1.0.0',
  buildDate: '2026-01-15',
};

// LOG CONFIGURATION
console.log('[App Config] ========================================');
console.log('[App Config] REVIEW MODE:', REVIEW_MODE);
console.log('[App Config] Environment:', ENV.isDevelopment ? 'Development' : 'Production');
console.log('[App Config] Cash Modes:', CASH_MODE_CONFIG.enabled ? 'ENABLED' : 'DISABLED');
console.log('[App Config] Ads:', AD_CONFIG.enabled ? 'ENABLED' : 'DISABLED');
console.log('[App Config] Version:', ENV.version);
console.log('[App Config] ========================================');

// EXPORT CONFIGURATION
window.APP_CONFIG = {
  REVIEW_MODE,
  AD_CONFIG,
  CASH_MODE_CONFIG,
  FREE_PLAY_CONFIG,
  FEATURES,
  ENV,
};

// REVIEW MODE WARNING
if (REVIEW_MODE) {
  console.warn('⚠️ [App Config] REVIEW MODE IS ACTIVE');
  console.warn('⚠️ [App Config] Cash modes and ads are DISABLED');
  console.warn('⚠️ [App Config] Set REVIEW_MODE = false for normal operation');
}

console.log('[App Config] ✓ Configuration loaded');
