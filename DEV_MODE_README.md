# BrainDash DEV MODE Documentation

## Overview

DEV MODE is a **strictly controlled** development environment that allows testing the complete cash play experience without authentication, KYC verification, or real money transactions.

**⚠️ CRITICAL SECURITY NOTICE:**
- DEV MODE can **ONLY** run on localhost, 127.0.0.1, or StackBlitz environments
- DEV MODE is **BLOCKED** on all other hostnames
- DEV MODE will **NEVER** work in production builds
- All test data is flagged with `is_test = true` in the database

---

## How DEV MODE Works

### 1. Environment Detection

DEV MODE is controlled by the `window.__DEV_MODE__` flag:

```javascript
// In cash-matches.html
window.__DEV_MODE__ = true;  // Enable dev mode
```

### 2. Hostname Protection

DEV MODE automatically validates the hostname before activating:

```javascript
const ALLOWED_DEV_HOSTS = ['localhost', '127.0.0.1', 'local.stackblitz.io'];
```

**If DEV MODE is enabled on a non-allowed hostname, the app will:**
1. Throw an error
2. Display an alert
3. Block all functionality
4. Log the security violation

### 3. Fake Dev User

When DEV MODE is active, a fake user is automatically created:

```javascript
{
  id: 'dev-user-00000000-0000-0000-0000-000000000001',
  email: 'dev@braindash.local',
  user_metadata: {
    name: 'Developer Test Account',
    avatar: '🛠️'
  },
  kyc_status: 'verified',
  geo_allowed: true,
  balance_cents: 10000,  // $100.00
  is_dev_user: true
}
```

### 4. Bypassed Checks

When DEV MODE is active:

✅ **Authentication** - No sign-in required
✅ **KYC Verification** - Automatically approved
✅ **Geo-blocking** - All locations allowed
✅ **Wallet Balance** - Fake balance of $100.00
✅ **Payment Processing** - No real payments

### 5. Test Data Flagging

All data created in DEV MODE is marked with `is_test = true`:

- `cash_matches.is_test = true`
- `wallet_ledger.is_test = true`
- `cash_match_players.is_test = true`
- `cash_match_escrows.is_test = true`

---

## How to Use DEV MODE

### Starting Dev Mode

1. **Open the app locally:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Navigate to cash matches:**
   ```
   http://localhost:5173/cash-matches.html
   ```

3. **DEV MODE automatically activates:**
   - You'll see a **DEV MODE badge** in the top-right corner
   - Console will show dev mode warnings
   - Wallet displays $100.00 fake balance
   - No sign-in required

### Using Cash Matches in Dev Mode

1. **Create a Match:**
   - Click "Create Match" tab
   - Fill out match settings
   - Click "Create Match" button
   - Match created with test data

2. **Join a Match:**
   - Open in another browser tab/window
   - Both sessions use same dev user
   - Can test multiplayer flow

3. **Play the Match:**
   - Answer trivia questions
   - Scores automatically submitted
   - Results calculated server-side
   - Payouts processed (test mode)

4. **View Results:**
   - See final placements
   - Check payout amounts
   - Wallet updated with test funds

---

## Visual Indicators

### DEV MODE Badge

When DEV MODE is active, you'll see this badge:

```
┌─────────────────┐
│  🛠️ DEV MODE   │
│  User: dev-user │
│  Balance: $100  │
└─────────────────┘
```

**Location:** Top-right corner, always visible
**Style:** Orange gradient, pulsing animation
**Tooltip:** "Development Mode Active - NO real money"

### Console Warnings

```
⚠️ DEV MODE ENABLED ⚠️
DEV MODE is active. This should NEVER happen in production.
Features enabled:
  - Bypass authentication
  - Auto-approve KYC
  - Fake wallet balance: $100.00
  - Test data flag on all transactions
```

---

## Security Protections

### 1. Hostname Validation

```javascript
function validateDevMode() {
  if (DEV_MODE && !isDevHostAllowed()) {
    throw new Error('🚨 DEV MODE BLOCKED ON NON-LOCALHOST 🚨');
  }
}
```

**Blocked on:**
- Production domains
- Staging domains (unless explicitly allowed)
- Any public hosting
- Custom domains

**Allowed on:**
- localhost
- 127.0.0.1
- StackBlitz environments
- WebContainer environments

### 2. Build-Time Protection

Production builds should **NOT** include `window.__DEV_MODE__ = true`:

**Development:**
```html
<script>
  window.__DEV_MODE__ = true;  // ✅ OK for dev
</script>
```

**Production:**
```html
<script>
  // __DEV_MODE__ NOT SET ❌ Defaults to false
</script>
```

### 3. Test Data Isolation

All test data is queryable separately:

```sql
-- View only production data
SELECT * FROM production_cash_matches;
SELECT * FROM production_wallet_ledger;

-- Clean up test data
SELECT cleanup_test_data();
```

---

## API Behavior in DEV MODE

### Authentication

**Normal Mode:**
```javascript
const token = await supabase.auth.getSession();
// Throws error if not authenticated
```

**DEV MODE:**
```javascript
const token = 'dev-mode-fake-token';
// Always returns fake token
```

### Wallet Balance

**Normal Mode:**
```javascript
const wallet = await supabase
  .from('user_wallets')
  .select('*')
  .eq('user_id', user.id);
// Returns actual balance
```

**DEV MODE:**
```javascript
const wallet = { balance_cents: 10000 };
// Returns fake $100 balance
```

### canPlayCash() Helper

**Normal Mode:**
```javascript
function canPlayCash(user) {
  return user?.kyc_status === 'verified' && user?.geo_allowed === true;
}
```

**DEV MODE:**
```javascript
function canPlayCash(user) {
  return true;  // Always allowed
}
```

---

## Cleaning Up Test Data

### Automatic Cleanup

Test data is automatically flagged, so production queries ignore it:

```sql
-- This excludes test data automatically
SELECT * FROM production_cash_matches;
```

### Manual Cleanup

To remove all test data:

```sql
SELECT cleanup_test_data();
```

**This will delete:**
- All matches where `is_test = true`
- All match players in test matches
- All escrows for test matches
- All wallet ledger entries where `is_test = true`

---

## Troubleshooting

### "DEV MODE BLOCKED ON NON-LOCALHOST"

**Problem:** You're trying to run DEV MODE on a non-allowed hostname.

**Solution:**
1. Make sure you're accessing via `localhost` or `127.0.0.1`
2. If using StackBlitz, the domain should be auto-detected
3. Do NOT try to bypass this - it's a security feature

### Dev User Not Working

**Problem:** Seeing authentication errors despite DEV MODE being on.

**Check:**
1. Open browser console
2. Look for: `⚠️ DEV MODE ENABLED ⚠️`
3. Verify `window.__DEV_MODE__` is `true`
4. Check for hostname validation errors

**Fix:**
```javascript
// In console:
window.__DEV_MODE__ = true;
location.reload();
```

### Badge Not Showing

**Problem:** DEV MODE badge not visible.

**Check:**
1. Is `window.__DEV_MODE__ = true`?
2. Check browser console for errors
3. Inspect DOM for `#dev-mode-badge`

**Manual trigger:**
```javascript
import { showDevBadge } from '/src/dev/dev-mode.js';
showDevBadge();
```

### Test Data in Production

**Problem:** Test matches appearing in production.

**Solution:**
1. Use filtered views:
   ```sql
   SELECT * FROM production_cash_matches;
   ```

2. Add filters to queries:
   ```sql
   SELECT * FROM cash_matches WHERE is_test = false;
   ```

3. Clean up:
   ```sql
   SELECT cleanup_test_data();
   ```

---

## Production Checklist

Before deploying to production, ensure:

- [ ] `window.__DEV_MODE__` is **NOT SET** or set to `false`
- [ ] Hostname validation is in place
- [ ] Test data is cleaned from database
- [ ] All dev-only code is behind `if (DEV_MODE)` checks
- [ ] Build process removes dev flags
- [ ] Environment variables are production values

---

## Implementation Details

### File Structure

```
src/
├── dev/
│   └── dev-mode.js          # DEV MODE configuration & helpers
├── cash-matches-sdk.js       # SDK with DEV MODE integration
└── cash-matches-app.js       # App with DEV MODE integration

cash-matches.html             # HTML with DEV MODE flag
```

### Key Functions

**`/src/dev/dev-mode.js`:**
- `DEV_MODE` - Boolean flag for dev mode
- `getDevUser()` - Returns fake dev user
- `canPlayCash(user)` - Bypasses checks in dev mode
- `validateDevMode()` - Checks hostname
- `showDevBadge()` - Displays dev mode indicator
- `isTestMode()` - Returns if in test mode

**Integration Points:**
- `cashMatchesSDK.getAuthToken()` - Returns fake token
- `cashMatchesSDK.getUserWallet()` - Returns fake wallet
- `cash-matches-app.js init()` - Loads dev user

### Database Schema

**New columns:**
- `cash_matches.is_test BOOLEAN DEFAULT false`
- `wallet_ledger.is_test BOOLEAN DEFAULT false`
- `cash_match_players.is_test BOOLEAN DEFAULT false`
- `cash_match_escrows.is_test BOOLEAN DEFAULT false`

**New views:**
- `production_cash_matches` - Excludes test data
- `production_wallet_ledger` - Excludes test data

**New functions:**
- `cleanup_test_data()` - Removes all test data

---

## Best Practices

### DO:
✅ Use DEV MODE for local testing
✅ Test full cash match flows
✅ Verify UI/UX without real money
✅ Test multi-player scenarios
✅ Clean up test data periodically

### DON'T:
❌ Enable DEV MODE in production
❌ Commit `__DEV_MODE__ = true` to production code
❌ Bypass hostname validation
❌ Mix test and production data
❌ Use DEV MODE for actual gameplay

---

## Example Usage

### Testing a 1v1 Match

**Terminal 1:**
```bash
npm run dev
# Opens http://localhost:5173
```

**Browser 1:**
1. Navigate to `/cash-matches.html`
2. See DEV MODE badge
3. Click "Create Match"
4. Set: $5 entry, 2 players, winner-take-all
5. Create match

**Browser 2 (incognito/different browser):**
1. Navigate to `/cash-matches.html`
2. Same dev user loads
3. Click "Browse Matches"
4. Join the match created in Browser 1

**Both browsers:**
1. Host starts match
2. Answer questions
3. View results automatically
4. Check payouts

All data is marked `is_test = true` in database.

---

## FAQ

**Q: Can I use DEV MODE in staging?**
A: Not by default. You must add your staging hostname to `ALLOWED_DEV_HOSTS`.

**Q: How do I disable DEV MODE?**
A: Remove or set `window.__DEV_MODE__ = false` in the HTML file.

**Q: Does DEV MODE work with real Supabase?**
A: Yes, but all data is flagged as test data.

**Q: Can multiple devs use DEV MODE simultaneously?**
A: Yes, but they all use the same fake `dev-user` ID.

**Q: What happens if I forget to disable DEV MODE in production?**
A: Hostname validation will **block** it. The app will throw an error.

**Q: Can I change the fake balance?**
A: Yes, modify `DEV_FAKE_BALANCE` in `/src/dev/dev-mode.js`.

**Q: Are Edge Functions affected by DEV MODE?**
A: Not directly. Edge Functions receive fake auth tokens but process normally.

---

## Support

For issues with DEV MODE:

1. Check browser console for errors
2. Verify hostname is allowed
3. Ensure `window.__DEV_MODE__ = true`
4. Review this documentation
5. Check database for test data conflicts

---

**Last Updated:** November 17, 2025
**Version:** 1.0.0
**Status:** Production Ready
