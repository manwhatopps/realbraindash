import { supabase } from './supabase-client.js';

let currentUser = null;

supabase.auth.onAuthStateChange((event, session) => {
  (async () => {
    currentUser = session?.user || null;
    if (currentUser) {
      await refreshBalance();
    }
  })();
});

export async function refreshBalance() {
  if (!currentUser) return;

  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet_balance`,
      {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const dollars = ((data.balance_cents || 0) / 100).toFixed(2);

      const balanceEl = document.getElementById('walletBalance');
      if (balanceEl) {
        balanceEl.textContent = `Balance: $${dollars}`;

        const hideBalance = localStorage.getItem('hideBalance') === 'true';
        balanceEl.style.display = hideBalance ? 'none' : 'inline-flex';
      }

      const headerBalanceEl = document.getElementById('headerWalletBalance');
      if (headerBalanceEl) {
        headerBalanceEl.textContent = `$${dollars}`;
      }

      const mobileBalanceEl = document.getElementById('headerMobileWalletBalance');
      if (mobileBalanceEl) {
        mobileBalanceEl.textContent = `$${dollars}`;
      }
    }
  } catch (error) {
    console.error('Failed to refresh balance:', error);
  }
}

export function initWalletUI() {
  const openDepositBtn = document.getElementById('openDeposit');
  const openWithdrawBtn = document.getElementById('openWithdraw');
  const depositModal = document.getElementById('depositModal');
  const withdrawModal = document.getElementById('withdrawModal');
  const closeDepositBtn = document.getElementById('closeDeposit');
  const closeWithdrawBtn = document.getElementById('closeWithdraw');
  const payStripeLinkBtn = document.getElementById('payStripeLink');
  const doWithdrawBtn = document.getElementById('doWithdraw');
  const toggleBalanceBtn = document.getElementById('toggleBalance');
  const balanceEl = document.getElementById('walletBalance');

  function showModal(modal) {
    modal?.classList.remove('hidden');
  }

  function hideModal(modal) {
    modal?.classList.add('hidden');
  }

  // Initialize balance visibility
  const hideBalance = localStorage.getItem('hideBalance') === 'true';
  if (balanceEl) {
    balanceEl.style.display = hideBalance ? 'none' : 'inline-flex';
  }
  if (toggleBalanceBtn) {
    toggleBalanceBtn.textContent = hideBalance ? '👁️' : '🙈';
  }

  // Toggle balance visibility
  toggleBalanceBtn?.addEventListener('click', () => {
    const currentlyHidden = localStorage.getItem('hideBalance') === 'true';
    const newHidden = !currentlyHidden;

    localStorage.setItem('hideBalance', String(newHidden));

    if (balanceEl) {
      balanceEl.style.display = newHidden ? 'none' : 'inline-flex';
    }

    toggleBalanceBtn.textContent = newHidden ? '👁️' : '🙈';
  });

  openDepositBtn?.addEventListener('click', () => {
    if (!currentUser) {
      alert('Please sign in to deposit funds');
      return;
    }
    showModal(depositModal);
  });

  openWithdrawBtn?.addEventListener('click', () => {
    if (!currentUser) {
      alert('Please sign in to withdraw funds');
      return;
    }
    showModal(withdrawModal);
  });

  closeDepositBtn?.addEventListener('click', () => hideModal(depositModal));
  closeWithdrawBtn?.addEventListener('click', () => hideModal(withdrawModal));

  payStripeLinkBtn?.addEventListener('click', async () => {
    const amountInput = document.getElementById('depAmount');
    const amount = Math.max(1, Math.floor(Number(amountInput.value) || 10));

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        alert('Please sign in first');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe_create_checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount_cents: amount * 100 })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Deposit failed');
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Failed to initiate deposit');
    }
  });

  doWithdrawBtn?.addEventListener('click', async () => {
    const amountInput = document.getElementById('wdAmount');
    const amount = Math.max(1, Math.floor(Number(amountInput.value) || 10));

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        alert('Please sign in first');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet_withdraw`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount_cents: amount * 100 })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Withdrawal failed');
        return;
      }

      alert('Withdrawal requested. You\'ll be notified when paid.');
      hideModal(withdrawModal);
      await refreshBalance();
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Failed to request withdrawal');
    }
  });

  setInterval(() => {
    if (currentUser) refreshBalance();
  }, 10000);
}
