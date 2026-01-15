/**
 * AD MANAGER
 *
 * Handles ad display logic for Free Play mode.
 * - Interstitial ads after Free Play sessions
 * - Rewarded ads (future)
 * - Respects REVIEW_MODE (no ads in review builds)
 */

console.log('[Ad Manager] Initializing...');

class AdManager {
  constructor() {
    this.config = window.APP_CONFIG?.AD_CONFIG || { enabled: false };
    this.sessionCount = 0;
    this.lastAdShown = 0;
    this.adProvider = null; // Will be AdMob, Google Ads, etc.

    console.log('[Ad Manager] Config:', this.config);

    if (!this.config.enabled) {
      console.log('[Ad Manager] Ads disabled (review mode or config)');
    }
  }

  /**
   * Initialize ad provider (AdMob, etc.)
   */
  async initialize() {
    if (!this.config.enabled) {
      console.log('[Ad Manager] Skipping ad provider initialization (disabled)');
      return;
    }

    console.log('[Ad Manager] Would initialize ad provider here');
    // TODO: Initialize AdMob or Google Ads SDK
    // For now, just use placeholders
  }

  /**
   * Track Free Play session completion
   */
  onFreePlayComplete() {
    if (!this.config.enabled) {
      return;
    }

    this.sessionCount++;
    console.log('[Ad Manager] Free Play session completed. Count:', this.sessionCount);

    // Show interstitial every N sessions
    if (this.sessionCount % this.config.interstitialFrequency === 0) {
      this.showInterstitial();
    }
  }

  /**
   * Show interstitial ad placeholder
   */
  showInterstitial() {
    if (!this.config.enabled) {
      return;
    }

    console.log('[Ad Manager] Showing interstitial ad placeholder');

    // Create placeholder ad overlay
    const adOverlay = document.createElement('div');
    adOverlay.id = 'ad-interstitial-overlay';
    adOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 100000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    adOverlay.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">📺</div>
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 12px;">
          Ad Placeholder
        </h2>
        <p style="font-size: 0.875rem; color: rgba(255,255,255,0.7); margin-bottom: 24px;">
          ${this.config.testMode ? '[TEST MODE] ' : ''}In production, an interstitial ad would appear here.
        </p>
        <p style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-bottom: 24px;">
          Ads support free play and help keep BrainDash free for everyone!
        </p>
        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 0.875rem; color: rgba(255,255,255,0.7);">
            Closing in <span id="ad-countdown">5</span>s...
          </div>
        </div>
        <button id="ad-close-btn" class="btn" style="background: var(--accent); color: var(--bg); min-width: 200px;" disabled>
          Close
        </button>
      </div>
    `;

    document.body.appendChild(adOverlay);
    this.lastAdShown = Date.now();

    // Countdown timer
    let countdown = 5;
    const countdownEl = document.getElementById('ad-countdown');
    const closeBtn = document.getElementById('ad-close-btn');

    const interval = setInterval(() => {
      countdown--;
      if (countdownEl) {
        countdownEl.textContent = countdown;
      }

      if (countdown <= 0) {
        clearInterval(interval);
        if (closeBtn) {
          closeBtn.disabled = false;
          closeBtn.style.opacity = '1';
        }
      }
    }, 1000);

    // Close button handler
    closeBtn?.addEventListener('click', () => {
      adOverlay.remove();
      console.log('[Ad Manager] Interstitial ad closed');
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      if (document.body.contains(adOverlay)) {
        adOverlay.remove();
        console.log('[Ad Manager] Interstitial ad auto-closed');
      }
    }, 10000);
  }

  /**
   * Show rewarded ad placeholder (future feature)
   */
  async showRewarded(rewardCallback) {
    if (!this.config.enabled || !this.config.rewardedEnabled) {
      console.log('[Ad Manager] Rewarded ads not enabled');
      rewardCallback(false);
      return;
    }

    console.log('[Ad Manager] Rewarded ads not yet implemented');
    rewardCallback(false);
  }

  /**
   * Check if enough time has passed since last ad
   */
  canShowAd() {
    if (!this.config.enabled) {
      return false;
    }

    const timeSinceLastAd = Date.now() - this.lastAdShown;
    const minInterval = 60000; // 1 minute minimum between ads

    return timeSinceLastAd >= minInterval;
  }

  /**
   * Get ad status for debugging
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      sessionCount: this.sessionCount,
      lastAdShown: this.lastAdShown,
      canShowAd: this.canShowAd(),
      nextAdIn: this.config.interstitialFrequency - (this.sessionCount % this.config.interstitialFrequency),
    };
  }
}

// Create singleton instance
const adManager = new AdManager();

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    adManager.initialize();
  });
} else {
  adManager.initialize();
}

// Export
window.AdManager = adManager;

console.log('[Ad Manager] ✓ Ad Manager initialized');
console.log('[Ad Manager] Status:', adManager.getStatus());
