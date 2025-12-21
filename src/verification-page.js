import { getUserTier, TIER_INFO, STATUS_INFO } from './tier-system.js';

async function init() {
  const tierData = await getUserTier();
  renderCurrentTier(tierData);
  renderTierGrid(tierData.tier);
  setupEventListeners(tierData);
}

function renderCurrentTier(tierData) {
  const { tier, status, tierInfo, statusInfo, profile } = tierData;

  const badgeClass = tier ? `badge-tier-${tier.toLowerCase()}` : 'badge-tier-unverified';

  document.getElementById('currentTierBadge').innerHTML = `
    <div style="font-size:2rem;margin:12px 0">${tierInfo.icon}</div>
    <span class="badge ${badgeClass}">${tierInfo.badge}</span>
  `;

  document.getElementById('currentStatusBadge').innerHTML = `
    <span class="badge" style="background:${statusInfo.color}22;color:${statusInfo.color};border:1px solid ${statusInfo.color}55">
      ${statusInfo.label}
    </span>
  `;

  if (status === 'pending') {
    document.getElementById('statusBanner').innerHTML = `
      <div class="status-banner pending">
        <span style="font-size:24px">⏳</span>
        <div>
          <strong>Verification in Progress</strong>
          <p style="margin:4px 0 0 0;font-size:0.875rem">Your verification is being reviewed. This typically takes 1-2 business days.</p>
        </div>
      </div>
    `;
  } else if (status === 'verified') {
    document.getElementById('statusBanner').innerHTML = `
      <div class="status-banner verified">
        <span style="font-size:24px">✓</span>
        <div>
          <strong>Verification Complete</strong>
          <p style="margin:4px 0 0 0;font-size:0.875rem">Your ${tierInfo.name} status is active and all features are unlocked.</p>
        </div>
      </div>
    `;
  } else if (status === 'rejected') {
    document.getElementById('statusBanner').innerHTML = `
      <div class="status-banner rejected">
        <span style="font-size:24px">⚠️</span>
        <div>
          <strong>Verification Failed</strong>
          <p style="margin:4px 0 0 0;font-size:0.875rem">Your verification could not be completed. Please contact support for assistance.</p>
        </div>
      </div>
    `;
  }

  document.getElementById('depositLimit').textContent = tierInfo.limits.deposit;
  document.getElementById('withdrawLimit').textContent = tierInfo.limits.withdrawal;
  document.getElementById('cashMatchStatus').textContent = tierInfo.limits.cashMatches ? '✓ Unlocked' : '🔒 Locked';

  if (tierInfo.features && tierInfo.features.length > 0) {
    document.getElementById('currentTierFeatures').innerHTML = `
      <h3 style="font-size:1.125rem;font-weight:600;margin:20px 0 12px 0">What You Can Do</h3>
      <ul class="feature-list">
        ${tierInfo.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    `;
  }
}

function renderTierGrid(currentTier) {
  const tierGrid = document.getElementById('tierGrid');
  const tiers = currentTier ? ['T2', 'T3'] : ['unverified', 'T2', 'T3'];

  tierGrid.innerHTML = tiers.map(tier => {
    const info = TIER_INFO[tier];
    if (!info) return '';
    const isCurrent = tier === currentTier || (!currentTier && tier === 'unverified');
    const isLocked = getTierOrder(tier) > getTierOrder(currentTier);
    const isLower = getTierOrder(tier) < getTierOrder(currentTier);

    let cardClass = 'tier-card';
    if (isCurrent) cardClass += ' current';
    if (isLocked) cardClass += ' locked';

    return `
      <div class="${cardClass}" data-tier="${tier}">
        <div class="tier-icon">${info.icon}</div>
        <div class="tier-name">${info.name}</div>
        <div class="tier-desc">${info.description}</div>
        ${isCurrent ? '<div style="color:var(--accent2);font-weight:600;font-size:0.875rem;margin-top:8px">● Current Tier</div>' : ''}
        ${isLocked ? '<div style="color:var(--muted);font-weight:600;font-size:0.875rem;margin-top:8px">🔒 Locked</div>' : ''}
        ${isLower ? '<div style="color:var(--dim);font-weight:600;font-size:0.875rem;margin-top:8px">✓ Completed</div>' : ''}
      </div>
    `;
  }).join('');
}

function getTierOrder(tier) {
  return { unverified: 0, T2: 1, T3: 2 }[tier] || 0;
}

function setupEventListeners(tierData) {
  const tierCards = document.querySelectorAll('.tier-card');
  tierCards.forEach(card => {
    card.addEventListener('click', () => {
      const tier = card.dataset.tier;
      const tierOrder = getTierOrder(tier);
      const currentOrder = getTierOrder(tierData.tier);

      if (tierOrder > currentOrder) {
        showUpgradeCard(tier);
      }
    });
  });

  document.getElementById('startVerificationBtn')?.addEventListener('click', () => {
    showVerificationModal();
  });
}

function showUpgradeCard(tier) {
  const info = TIER_INFO[tier];
  const upgradeCard = document.getElementById('upgradeCard');

  document.getElementById('upgradeTierName').textContent = info.name;

  if (info.requirements && info.requirements.length > 0) {
    document.getElementById('upgradeRequirements').innerHTML = `
      <h3 style="font-size:1.125rem;font-weight:600;margin:20px 0 12px 0">Requirements</h3>
      <ul class="requirement-list">
        ${info.requirements.map(r => `<li>${r}</li>`).join('')}
      </ul>
      <h3 style="font-size:1.125rem;font-weight:600;margin:20px 0 12px 0">What You'll Unlock</h3>
      <ul class="feature-list">
        ${info.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    `;
  }

  upgradeCard.style.display = 'block';
  upgradeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showVerificationModal() {
  const modal = document.createElement('div');
  modal.className = 'sheet';
  modal.style.display = 'grid';
  modal.setAttribute('aria-hidden', 'false');

  modal.innerHTML = `
    <div class="modal" style="max-width:500px">
      <button class="close" onclick="this.closest('.sheet').remove()" aria-label="Close">&times;</button>
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:56px;margin-bottom:16px">🔐</div>
        <h2 class="modal-title">Identity Verification</h2>
        <p style="color:var(--muted);margin:16px 0;line-height:1.6">
          BrainDash uses industry-leading KYC providers to verify your identity quickly and securely.
        </p>
        <div class="info-box" style="text-align:left">
          <p><strong>What You'll Need:</strong></p>
          <ul style="list-style:none;padding:0;margin:8px 0 0 0">
            <li style="padding:4px 0">✓ Government-issued ID (Driver's License, Passport)</li>
            <li style="padding:4px 0">✓ Your phone or webcam for selfie</li>
            <li style="padding:4px 0">✓ 5 minutes of your time</li>
          </ul>
        </div>
        <p style="color:var(--muted);margin:16px 0;font-size:0.875rem">
          Your information is encrypted and never shared with third parties.
        </p>
        <div style="background:rgba(255,193,7,.1);border:1px solid rgba(255,193,7,.3);border-radius:12px;padding:16px;margin:16px 0">
          <p style="color:#F59E0B;margin:0;font-size:0.9375rem">
            <strong>⚠️ Coming Soon</strong><br>
            <span style="color:var(--muted);font-size:0.875rem">
              Automated verification will be available soon. For now, please contact support to start manual verification.
            </span>
          </p>
        </div>
      </div>
      <button class="btn" onclick="window.location.href='mailto:support@braindash.com?subject=Verification Request'" style="width:100%;margin-top:8px">
        Contact Support
      </button>
      <button class="btn btn-secondary" onclick="this.closest('.sheet').remove()" style="width:100%;margin-top:8px">
        Cancel
      </button>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}

init();
