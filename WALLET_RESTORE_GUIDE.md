# Web3 Wallet Restore Guide

**Purpose**: Block wallets during OAuth, restore them later for deposits

---

## Current Status

Wallets are **blocked by default** to prevent OAuth conflicts:
- `window.ethereum` → `undefined`
- `window.solana` → `undefined`
- `window.bybitWallet` → `undefined`

This lets Google and Apple login work perfectly.

---

## How to Restore Wallets (For Future Deposit Features)

When you're ready to add crypto deposits, use the built-in restore function:

### Option 1: Restore Individual Wallets

```javascript
// Restore MetaMask/Ethereum wallets
window.__RESTORE_WALLET__('ethereum');

// Restore Phantom/Solana wallets
window.__RESTORE_WALLET__('solana');

// Restore Bybit wallet
window.__RESTORE_WALLET__('bybitWallet');
```

### Option 2: Restore All Wallets

```javascript
function restoreAllWallets() {
  ['ethereum', 'solana', 'bybitWallet'].forEach(wallet => {
    window.__RESTORE_WALLET__(wallet);
  });
}

// Call when user navigates to deposit page
restoreAllWallets();
```

---

## Example: Deposit Page Implementation

### When User Opens Deposit Page

```javascript
// deposit-page.js
export function initDepositPage() {
  console.log('[Deposit] Restoring wallet support...');

  // Restore wallets
  window.__RESTORE_WALLET__('ethereum');
  window.__RESTORE_WALLET__('solana');

  // Wait for wallet extensions to re-inject
  setTimeout(() => {
    if (window.ethereum) {
      console.log('[Deposit] MetaMask available');
      setupEthereumDeposit();
    }

    if (window.solana) {
      console.log('[Deposit] Phantom available');
      setupSolanaDeposit();
    }
  }, 500);
}

function setupEthereumDeposit() {
  const connectBtn = document.getElementById('connectMetaMask');
  connectBtn.addEventListener('click', async () => {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      console.log('Connected:', accounts[0]);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  });
}

function setupSolanaDeposit() {
  const connectBtn = document.getElementById('connectPhantom');
  connectBtn.addEventListener('click', async () => {
    try {
      const resp = await window.solana.connect();
      console.log('Connected:', resp.publicKey.toString());
    } catch (error) {
      console.error('Connection failed:', error);
    }
  });
}
```

### When User Leaves Deposit Page

```javascript
// Re-block wallets to prevent OAuth conflicts
function reblockWallets() {
  Object.defineProperty(window, 'ethereum', {
    get: function() { return undefined; },
    set: function() { },
    configurable: true
  });

  Object.defineProperty(window, 'solana', {
    get: function() { return undefined; },
    set: function() { },
    configurable: true
  });

  console.log('[Deposit] Wallets re-blocked for OAuth protection');
}

// Call when navigating away from deposit page
window.addEventListener('beforeunload', reblockWallets);
```

---

## Testing Wallet Restore

### 1. Open Browser Console

```javascript
// Check wallet is blocked
console.log(window.ethereum); // undefined

// Restore wallet
window.__RESTORE_WALLET__('ethereum');

// Wait a moment for extension to re-inject
setTimeout(() => {
  console.log(window.ethereum); // Should show wallet object
}, 500);
```

### 2. Test MetaMask Connection

```javascript
// Restore and connect
window.__RESTORE_WALLET__('ethereum');

setTimeout(async () => {
  if (window.ethereum) {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    console.log('Connected to:', accounts[0]);
  } else {
    console.log('MetaMask not installed');
  }
}, 500);
```

---

## Important Notes

### Timing Matters

After calling `__RESTORE_WALLET__`, wait 500ms before using the wallet:

```javascript
// ❌ Wrong - wallet not ready yet
window.__RESTORE_WALLET__('ethereum');
const accounts = await window.ethereum.request(...); // Error!

// ✅ Correct - wait for re-injection
window.__RESTORE_WALLET__('ethereum');
setTimeout(async () => {
  const accounts = await window.ethereum.request(...); // Works!
}, 500);
```

### Page-Specific Restoration

Only restore wallets on pages that need them:

```javascript
// ✅ Good - restore only on deposit page
if (window.location.pathname === '/deposit') {
  window.__RESTORE_WALLET__('ethereum');
}

// ❌ Bad - restoring everywhere breaks OAuth
window.__RESTORE_WALLET__('ethereum'); // Don't do this globally!
```

### Re-block After Use

Re-block wallets when leaving deposit pages to keep OAuth working:

```javascript
// When navigating away from deposit
function cleanupDeposit() {
  Object.defineProperty(window, 'ethereum', {
    get: () => undefined,
    configurable: true
  });
}
```

---

## Wallet Detection

Check if wallets are available after restoring:

```javascript
function checkAvailableWallets() {
  window.__RESTORE_WALLET__('ethereum');
  window.__RESTORE_WALLET__('solana');

  setTimeout(() => {
    const available = {
      metamask: !!window.ethereum,
      phantom: !!window.solana,
      bybit: !!window.bybitWallet
    };

    console.log('Available wallets:', available);
    return available;
  }, 500);
}
```

---

## Why This Approach Works

### 1. OAuth Protected
- Wallets blocked during login
- Google/Apple OAuth works perfectly
- No extension interference

### 2. Flexible for Deposits
- Can restore wallets when needed
- User can connect wallet for deposits
- Crypto payments work normally

### 3. Secure by Default
- Blocked unless explicitly restored
- Controlled restoration on specific pages
- Can re-block after use

---

## Future Deposit Flow

When you're ready to add deposits:

1. **User clicks "Deposit"**
   - Navigate to deposit page
   - Call `window.__RESTORE_WALLET__('ethereum')`
   - Wait 500ms for wallet to become available

2. **User selects wallet**
   - Show "Connect MetaMask" button
   - User clicks and approves connection
   - Get wallet address

3. **User makes deposit**
   - Show deposit amount input
   - User initiates transfer
   - Wait for blockchain confirmation

4. **Update balance**
   - Verify transaction on blockchain
   - Credit user's BrainDash balance
   - Show success message

5. **User leaves deposit page**
   - Re-block wallet for OAuth protection
   - User returns to normal gameplay

---

## Console Messages

When the page loads:
```
[BrainDash] Web3 wallet injections blocked to prevent OAuth conflicts
[BrainDash] To restore wallets later, call: window.__RESTORE_WALLET__("ethereum")
```

When you restore a wallet:
```
[BrainDash] Wallet restored: ethereum
```

---

## Summary

**Right Now**: Wallets blocked, OAuth works ✅

**Later (Deposits)**: Call `window.__RESTORE_WALLET__('ethereum')` → wallets work ✅

**Best Practice**: Only restore wallets on deposit pages, keep them blocked elsewhere

---

This gives you the best of both worlds:
- OAuth works without conflicts
- Crypto deposits ready when you need them
- Full control over when wallets are available
