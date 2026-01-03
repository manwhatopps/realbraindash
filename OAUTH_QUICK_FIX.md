# Google OAuth Quick Fix Guide

**Execute these fixes in order to resolve OAuth issues immediately.**

---

## Fix #1: Update Hardcoded Supabase URLs

### index.html (Line 1284-1285)

**FIND**:
```javascript
window.VITE_SUPABASE_URL = 'https://uimxwujknpuespwvipbi.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbXh3dWprbnB1ZXNwd3ZpcGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc2NDcsImV4cCI6MjA3NzYwMzY0N30.ZKXbrtYr47DqESnoOXgxjvS0pjEHpzuQ0BHAM8QpzWw';
```

**REPLACE WITH**:
```javascript
window.VITE_SUPABASE_URL = 'https://dguhvsjrqnpeonfhotty.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndWh2c2pycW5wZW9uZmhvdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDkxOTAsImV4cCI6MjA3OTIyNTE5MH0.VQ1LAy545BkKan70yHdnOup1y33BH4wm3w-bKq_qxAs';
```

---

## Fix #2: Use Singleton Client in Test Script

### index.html (Line 1498-1511)

**FIND**:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[OAuth Test] Initializing Google OAuth test...');
console.log('[OAuth Test] Supabase URL:', supabaseUrl);
console.log('[OAuth Test] Wallet blocker active:', {
  ethereum: window.ethereum,
  solana: window.solana,
  bybitWallet: window.bybitWallet
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**REPLACE WITH**:
```javascript
import { supabase } from '/src/supabase-client.js';

console.log('[OAuth Test] Initializing Google OAuth test...');
console.log('[OAuth Test] Supabase URL:', supabase.supabaseUrl);
console.log('[OAuth Test] Wallet blocker active:', {
  ethereum: window.ethereum,
  solana: window.solana,
  bybitWallet: window.bybitWallet
});
```

---

## Fix #3: Update Other HTML Files

### cash-matches.html (Line 305-306)

**FIND**:
```javascript
window.VITE_SUPABASE_URL = 'https://uimxwujknpuespwvipbi.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbXh3dWprbnB1ZXNwd3ZpcGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc2NDcsImV4cCI6MjA3NzYwMzY0N30.ZKXbrtYr47DqESnoOXgxjvS0pjEHpzuQ0BHAM8QpzWw';
```

**REPLACE WITH**:
```javascript
window.VITE_SUPABASE_URL = 'https://dguhvsjrqnpeonfhotty.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndWh2c2pycW5wZW9uZmhvdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDkxOTAsImV4cCI6MjA3OTIyNTE5MH0.VQ1LAy545BkKan70yHdnOup1y33BH4wm3w-bKq_qxAs';
```

### verification.html (Line 120-121)

Same replacement as above.

### verify-identity.html (Line 327-328)

Same replacement as above.

---

## Fix #4: Rebuild

After making changes:

```bash
npm run build
```

---

## Fix #5: Verify Google OAuth in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/dguhvsjrqnpeonfhotty
2. Click Authentication → Providers
3. Find Google provider
4. Verify settings:
   - **Enabled**: YES
   - **Client ID**: 184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03
   - **Client Secret**: (must be filled in)
5. Click "Save"

---

## Fix #6: Verify Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find Client ID: 184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03
3. Click to edit
4. Under "Authorized redirect URIs", ensure these are listed:
   ```
   https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
   http://localhost:5173
   ```
5. Click "Save"

---

## Testing After Fixes

### 1. Clear Browser Data

```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
```

Then hard refresh (Ctrl+Shift+R).

### 2. Check Console

Should see:
```
[OAuth Test] Supabase URL: https://dguhvsjrqnpeonfhotty.supabase.co
```

Should NOT see:
```
Multiple GoTrueClient instances detected
```

### 3. Test OAuth

1. Click "🧪 Test Google Login"
2. Should redirect to Google
3. Sign in with Google account
4. Should redirect back to app
5. Console should show:
   ```
   [OAuth Test] ✅ Successfully signed in!
   [OAuth Test] User: user@example.com
   [OAuth Test] Provider: google
   ```

---

## If Still Failing

Run this in browser console:

```javascript
// Check active Supabase URL
console.log('Active URL:', window.VITE_SUPABASE_URL);

// Should output: https://dguhvsjrqnpeonfhotty.supabase.co
// If not, you missed updating a hardcoded value
```

Check Network tab for failed requests:
- Filter by "authorize" or "callback"
- Check which Supabase URL is being called
- Check response status codes

---

## Summary of Changes

**Files to modify**:
1. `index.html` (2 changes: hardcoded URL + use singleton)
2. `cash-matches.html` (1 change: hardcoded URL)
3. `verification.html` (1 change: hardcoded URL)
4. `verify-identity.html` (1 change: hardcoded URL)

**Commands to run**:
```bash
npm run build
```

**External verification**:
- Supabase dashboard (Google provider enabled)
- Google Cloud Console (redirect URIs configured)

**Testing**:
- Clear browser storage
- Hard refresh
- Test OAuth flow
- Verify success in console
