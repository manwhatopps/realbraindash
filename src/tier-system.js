import { supabase } from './supabase-client.js';

const TIER_INFO = {
  unverified: {
    name: 'Unverified',
    badge: 'Unverified — KYC Required',
    color: '#F59E0B',
    icon: '⏳',
    description: 'Complete KYC to unlock cash play',
    features: ['Free play mode only', 'KYC verification required for cash matches'],
    limits: {
      deposit: '$0',
      withdrawal: '$0',
      cashMatches: false
    },
    requirements: [
      'Full legal name',
      'Date of birth (18+ required)',
      'Full address',
      'SSN last 4 digits',
      'Government ID scan',
      'Selfie verification'
    ]
  },
  T2: {
    name: 'Verified Competitor',
    badge: 'Tier 2 — Verified Competitor',
    color: '#22C55E',
    icon: '✓',
    description: 'Full KYC verified',
    features: [
      'All cash matches',
      'Deposits up to $2,500/month',
      'Withdrawals up to $5,000/month',
      'Standard tournaments',
      'Compete for real money'
    ],
    limits: {
      deposit: '$2,500/month',
      withdrawal: '$5,000/month',
      cashMatches: true,
      vipAccess: false
    },
    requirements: [
      'Full legal name',
      'Date of birth (18+ required)',
      'Full address',
      'SSN last 4 digits',
      'Government ID scan',
      'Selfie verification'
    ]
  },
  T3: {
    name: 'Elite Competitor',
    badge: 'Tier 3 — Elite Competitor',
    color: '#A855F7',
    icon: '👑',
    description: 'VIP & High Stakes',
    features: [
      'All T2 features',
      'High-stakes matches ($100+ buy-ins)',
      'VIP tournaments',
      'Sponsored events',
      'Influencer/streamer access',
      'Deposits up to $10,000/month',
      'Withdrawals up to $20,000/month',
      'Priority support'
    ],
    limits: {
      deposit: '$10,000/month',
      withdrawal: '$20,000/month',
      cashMatches: true,
      vipAccess: true
    },
    requirements: [
      'All T2 requirements met',
      'Proof of address (utility bill, bank statement)',
      'Proof of income/source of funds',
      '2FA enabled (mandatory)',
      'Manual compliance approval',
      'Enhanced background check'
    ]
  }
};

const STATUS_INFO = {
  unverified: {
    label: 'Unverified',
    color: '#9CA3AF',
    description: 'Verification not started'
  },
  pending: {
    label: 'Verification in Review',
    color: '#F59E0B',
    description: 'Your verification is being processed'
  },
  verified: {
    label: 'Verified',
    color: '#22C55E',
    description: 'Verification complete'
  },
  rejected: {
    label: 'Verification Failed',
    color: '#EF4444',
    description: 'Contact support for assistance'
  },
  review_required: {
    label: 'Extra Review Required',
    color: '#F59E0B',
    description: 'Additional information needed'
  }
};

let currentTierCache = null;

export async function getUserTier() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        tier: null,
        status: 'unverified',
        tierInfo: TIER_INFO.unverified,
        statusInfo: STATUS_INFO.unverified
      };
    }

    const { data, error } = await supabase
      .from('user_verification_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tier:', error);
    }

    const tier = data?.verification_tier || null;
    const status = data?.verification_status || 'unverified';

    currentTierCache = {
      tier,
      status,
      tierInfo: tier ? TIER_INFO[tier] : TIER_INFO.unverified,
      statusInfo: STATUS_INFO[status],
      profile: data
    };

    return currentTierCache;
  } catch (error) {
    console.error('Error in getUserTier:', error);
    return {
      tier: null,
      status: 'unverified',
      tierInfo: TIER_INFO.unverified,
      statusInfo: STATUS_INFO.unverified
    };
  }
}

export async function canUserAction(actionType, amountCents = 0) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return {
        allowed: false,
        code: 'NOT_AUTHENTICATED',
        reason: 'You must sign in to continue.',
        tier: 'unverified'
      };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-user-tier-action`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionType,
          amountCents
        })
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking user action:', error);
    return {
      allowed: false,
      code: 'ERROR',
      reason: 'Unable to verify permissions. Please try again.',
      tier: 'unverified'
    };
  }
}

export function showTierModal(result, onUpgrade) {
  const existingModal = document.getElementById('tierModal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'tierModal';
  modal.className = 'sheet';
  modal.style.display = 'grid';
  modal.setAttribute('aria-hidden', 'false');

  const tierInfo = TIER_INFO[result.tier] || TIER_INFO.unverified;

  let upgradeButton = '';
  let upgradeMessage = '';

  if (result.code === 'NEEDS_KYC') {
    upgradeButton = `<button class="btn" id="tierModalUpgrade" style="width:100%;margin-top:16px">Start KYC Verification</button>`;
    upgradeMessage = '<p style="color:var(--muted);margin-top:12px;font-size:0.875rem">Identity verification (KYC) is required for all cash play. Quick and secure.</p>';
  } else if (result.code === 'NEEDS_T3') {
    upgradeButton = `<button class="btn" id="tierModalUpgrade" style="width:100%;margin-top:16px">Upgrade to Tier 3</button>`;
    upgradeMessage = '<p style="color:var(--muted);margin-top:12px;font-size:0.875rem">Elite verification required for VIP access and high-stakes matches.</p>';
  } else if (result.code === 'LIMIT_EXCEEDED') {
    upgradeButton = `<button class="btn" id="tierModalUpgrade" style="width:100%;margin-top:16px">View Limits</button>`;
    upgradeMessage = '<p style="color:var(--muted);margin-top:12px;font-size:0.875rem">Check your verification page for details and upgrade options.</p>';
  }

  modal.innerHTML = `
    <div class="modal" style="max-width:500px">
      <button class="close" onclick="this.closest('.sheet').remove()" aria-label="Close">&times;</button>
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:56px;margin-bottom:16px">🔒</div>
        <h2 class="modal-title">Verification Required</h2>
        <div style="margin:20px 0">
          <span class="badge badge-tier-${result.tier.toLowerCase()}" style="display:inline-block">
            ${tierInfo.icon} ${tierInfo.badge}
          </span>
        </div>
        <p style="color:var(--txt);margin:16px 0;line-height:1.6">
          ${result.reason}
        </p>
        ${upgradeMessage}
      </div>
      ${upgradeButton}
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

  const upgradeBtn = modal.querySelector('#tierModalUpgrade');
  if (upgradeBtn && onUpgrade) {
    upgradeBtn.addEventListener('click', () => {
      modal.remove();
      onUpgrade();
    });
  }

  document.body.appendChild(modal);
}

export async function canUser(actionType, opts = {}) {
  const result = await canUserAction(actionType, opts.amountCents || 0);

  if (!result.allowed) {
    showTierModal(result, opts.onUpgrade || (() => {
      window.location.href = '/verification.html';
    }));
  }

  return result.allowed;
}

export function getTierBadgeHTML(tier, showIcon = true) {
  const info = tier ? TIER_INFO[tier] : TIER_INFO.unverified;
  if (!info) return '';
  return `
    <span class="badge badge-tier-${tier.toLowerCase()}">
      ${showIcon ? info.icon + ' ' : ''}${info.badge}
    </span>
  `;
}

export function getStatusBadgeHTML(status) {
  const info = STATUS_INFO[status] || STATUS_INFO.unverified;
  return `
    <span class="badge" style="background:${info.color}22;color:${info.color};border:1px solid ${info.color}55">
      ${info.label}
    </span>
  `;
}

export { TIER_INFO, STATUS_INFO };
