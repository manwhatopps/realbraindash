# Google OAuth Diagnosis Report

**Date**: January 3, 2026
**Status**: CRITICAL ISSUES FOUND

---

## Executive Summary

Your Google OAuth is failing due to **URL mismatch** and **multiple Supabase client instances**. The application is trying to use TWO different Supabase projects simultaneously, and creating 10+ separate client instances across the codebase.

---

## CRITICAL ISSUES

### 🚨 Issue #1: WRONG SUPABASE URL (HIGHEST PRIORITY)

**Problem**: Your application is using TWO different Supabase instances:

**In `.env` file**:
```
VITE_SUPABASE_URL=https://dguhvsjrqnpeonfhotty.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...VQ1LAy545BkKan70yHdnOup1y33BH4wm3w-bKq_qxAs
```

**BUT hardcoded in `index.html` line 1284-1285**:
```javascript
window.VITE_SUPABASE_URL = 'https://uimxwujknpuespwvipbi.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...ZKXbrtYr47DqESnoOXgxjvS0pjEHpzuQ0BHAM8QpzWw';
```

**Impact**:
- OAuth is configured in ONE Supabase project (dguhvsjrqnpeonfhotty)
- But the app is trying to authenticate with ANOTHER project (uimxwujknpuespwvipbi)
- Google OAuth callback URL doesn't match
- Session tokens from one project won't work with the other

**Files with OLD URL hardcoded**:
1. `index.html` - line 1284-1285
2. `dist/index.html` - line 1230-1231
3. `cash-matches.html` - line 305-306
4. `verification.html` - line 120-121
5. `verify-identity.html` - line 327-328

---

### 🚨 Issue #2: Multiple Supabase Client Instances

**Problem**: The warning "Multiple GoTrueClient instances detected" appears because you're creating 10+ separate Supabase clients.

**Client Creation Locations**:

1. ✅ **GOOD** - `src/supabase-client.js` (singleton, exported)
   ```javascript
   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

2. ❌ **BAD** - `src/main.js` line 104
   ```javascript
   const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
   ```

3. ❌ **BAD** - `src/braindash-royale.js` line 5
   ```javascript
   const supabase = createClient(supabaseUrl, supabaseKey);
   ```

4. ❌ **BAD** - `src/cash-matches-sdk.js` line 7
   ```javascript
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
   ```

5. ❌ **BAD** - `src/cash-matches-app.js` (5+ instances!)
   - Line 118: `const supabase = createClient(...)`
   - Line 230: `const supabase = createClient(...)`
   - Line 395: `const supabase = createClient(...)`
   - Line 530: `const supabase = createClient(...)`
   - Line 655: `const supabase = createClient(...)`

6. ❌ **BAD** - `src/trivia-question-fetcher.js` line 35
   ```javascript
   const supabase = createClient(supabaseUrl, supabaseKey);
   ```

7. ❌ **BAD** - `index.html` line 1511 (YOUR TEST SCRIPT)
   ```javascript
   const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

8. ❌ **BAD** - `kyc-success.html` line 42
   ```javascript
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
   ```

9. ❌ **BAD** - `verify-identity.html` line 166
   ```javascript
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
   ```

10. ❌ **BAD** - `cash-challenge-test.html` line 290
    ```javascript
    const supabase = createClient(...);
    ```

**Files that DO IT RIGHT**:
- ✅ `src/auth/auth-ui.js` - imports singleton
- ✅ `src/header/header.js` - imports singleton
- ✅ `src/wallet-ui.js` - imports singleton
- ✅ `src/tier-system.js` - imports singleton

---

### 🚨 Issue #3: OAuth Configuration Mismatch

**Current Setup**:

Your test button uses:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

BUT on runtime, these get overridden by the hardcoded values in lines 1284-1285!

**What happens**:
1. Vite loads `.env`: `dguhvsjrqnpeonfhotty.supabase.co`
2. Browser executes line 1284: Overrides to `uimxwujknpuespwvipbi.supabase.co`
3. OAuth test button tries to use `.env` values (already overridden!)
4. **Result**: OAuth uses WRONG Supabase project

---

## Supabase Client Setup Analysis

### Current Initialization Code

**Singleton Client** (`src/supabase-client.js`):
```javascript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
```

**Status**: ✅ This is CORRECT, but not consistently used!

---

## Google OAuth Configuration Check

### What You Configured (Test Script)

```javascript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

**OAuth Settings**:
- Provider: ✅ 'google' (correct)
- Redirect: ✅ `window.location.origin` (dynamic, good)
- Access Type: ✅ 'offline' (for refresh tokens)
- Prompt: ✅ 'consent' (always show consent screen)

### Expected Callback URLs

**For Supabase Project in `.env`** (dguhvsjrqnpeonfhotty):
```
https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
```

**But hardcoded URL points to** (uimxwujknpuespwvipbi):
```
https://uimxwujknpuespwvipbi.supabase.co/auth/v1/callback
```

**Problem**: Your Google OAuth Client ID is configured for ONE of these, but not both!

---

## Browser Console Logs to Check

### Expected Console Messages

On page load, you should see:
```
[OAuth Test] Initializing Google OAuth test...
[OAuth Test] Supabase URL: https://dguhvsjrqnpeonfhotty.supabase.co
[OAuth Test] Wallet blocker active: {ethereum: undefined, ...}
```

**BUT you're probably seeing**:
```
[OAuth Test] Supabase URL: https://uimxwujknpuespwvipbi.supabase.co
```
(Wrong URL!)

### Console Warnings to Look For

1. **Multiple Client Warning**:
   ```
   Multiple GoTrueClient instances detected in the same browser context.
   ```
   Cause: 10+ `createClient()` calls

2. **CORS Errors**:
   ```
   Access to fetch at 'https://accounts.google.com/o/oauth2/...' has been blocked by CORS policy
   ```
   Cause: Redirect URL mismatch

3. **OAuth Errors**:
   ```
   Error 400: redirect_uri_mismatch
   ```
   Cause: Google OAuth Client ID not configured for the hardcoded Supabase URL

4. **Session Errors**:
   ```
   AuthSessionMissingError: Auth session missing!
   ```
   Cause: Session created in one Supabase project, but app expects another

---

## Network Activity Analysis

### Expected Network Requests

1. **OAuth Initiation**:
   ```
   POST https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/authorize
   Status: 200 OK
   Response: { url: 'https://accounts.google.com/o/oauth2/v2/auth?...' }
   ```

2. **Google Sign-In**:
   ```
   GET https://accounts.google.com/o/oauth2/v2/auth?client_id=...
   Status: 302 Redirect
   ```

3. **OAuth Callback**:
   ```
   GET https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback?code=...
   Status: 302 Redirect to window.location.origin
   ```

4. **Session Creation**:
   ```
   POST https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/token
   Status: 200 OK
   Response: { access_token: '...', refresh_token: '...' }
   ```

### What You're Probably Seeing

1. ❌ Request to **uimxwujknpuespwvipbi** instead of **dguhvsjrqnpeonfhotty**
2. ❌ Status 400 or 403 from Google OAuth
3. ❌ No callback received
4. ❌ No session created

---

## Session Handling Check

### Current Auth State Listener

```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    console.log('[OAuth Test] ✅ Successfully signed in!');
    console.log('[OAuth Test] User:', session.user);
    // ...
  }
});
```

**Problem**: This listener is attached to a NEW client instance, not the singleton!

**Impact**: Even if OAuth succeeds, other parts of the app won't know because they use different client instances.

---

## Redirect URL Configuration

### What Should Be in Supabase Dashboard

**For project dguhvsjrqnpeonfhotty**:

**Authorized Redirect URLs**:
```
http://localhost:5173
http://localhost:5173/
https://your-production-domain.com
https://your-production-domain.com/
```

**Site URL**:
```
http://localhost:5173 (for dev)
https://your-production-domain.com (for prod)
```

### What Should Be in Google Cloud Console

**For Client ID 184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03**:

**Authorized JavaScript Origins**:
```
http://localhost:5173
https://your-production-domain.com
https://dguhvsjrqnpeonfhotty.supabase.co
```

**Authorized Redirect URIs**:
```
http://localhost:5173
https://your-production-domain.com
https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
```

**Problem**: If these include `uimxwujknpuespwvipbi` but NOT `dguhvsjrqnpeonfhotty`, OAuth will fail!

---

## Step-by-Step Failure Analysis

### What Happens When You Click "Test Google Login"

1. ✅ Button click triggers OAuth
2. ✅ Test script reads `import.meta.env.VITE_SUPABASE_URL`
3. ❌ But `window.VITE_SUPABASE_URL` was already overridden to wrong URL
4. ❌ OAuth request goes to **uimxwujknpuespwvipbi** instead of **dguhvsjrqnpeonfhotty**
5. ❌ Google OAuth callback URL doesn't match
6. ❌ Error: `redirect_uri_mismatch` or `invalid_client`
7. ❌ No session created
8. ❌ Auth state never changes to SIGNED_IN

---

## Root Cause Summary

**Primary Cause**: URL mismatch between `.env` and hardcoded values

**Secondary Causes**:
1. Multiple Supabase client instances
2. OAuth configuration for wrong Supabase project
3. Test script creates its own client (not using singleton)
4. Environment variables being overridden at runtime

---

## Required Fixes (In Priority Order)

### FIX #1: Update Hardcoded Supabase URLs (HIGHEST PRIORITY)

**Files to update**:

1. `index.html` line 1284-1285:
   ```javascript
   // CHANGE FROM:
   window.VITE_SUPABASE_URL = 'https://uimxwujknpuespwvipbi.supabase.co';
   window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...old-key';

   // CHANGE TO:
   window.VITE_SUPABASE_URL = 'https://dguhvsjrqnpeonfhotty.supabase.co';
   window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndWh2c2pycW5wZW9uZmhvdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDkxOTAsImV4cCI6MjA3OTIyNTE5MH0.VQ1LAy545BkKan70yHdnOup1y33BH4wm3w-bKq_qxAs';
   ```

2. `cash-matches.html` line 305-306 (same change)
3. `verification.html` line 120-121 (same change)
4. `verify-identity.html` line 327-328 (same change)

### FIX #2: Use Singleton Client in Test Script

**In `index.html` line 1497-1511**:

```javascript
// CHANGE FROM:
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// CHANGE TO:
import { supabase } from '/src/supabase-client.js';
```

This eliminates one client instance and ensures consistency.

### FIX #3: Consolidate All Client Creation

**Files that need to import singleton instead**:

1. `src/main.js` - Remove `createClient`, import `supabase` from `./supabase-client.js`
2. `src/braindash-royale.js` - Same
3. `src/cash-matches-sdk.js` - Same
4. `src/cash-matches-app.js` - Remove ALL 5+ `createClient` calls
5. `src/trivia-question-fetcher.js` - Same
6. All HTML files - Same

**Goal**: ONE AND ONLY ONE `createClient()` call in entire app (in supabase-client.js)

### FIX #4: Verify Google OAuth Configuration

**In Supabase Dashboard** (dguhvsjrqnpeonfhotty project):

1. Go to Authentication → Providers
2. Find Google provider
3. Verify Client ID: `184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03`
4. Add Client Secret (if not already set)
5. Save

**In Google Cloud Console**:

1. Go to APIs & Services → Credentials
2. Find OAuth Client ID `184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03`
3. Add Authorized Redirect URI:
   ```
   https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
   ```
4. Save

### FIX #5: Rebuild After Changes

```bash
npm run build
```

This updates `dist/index.html` with correct values.

---

## Testing Procedure After Fixes

### 1. Clear Browser State
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
```

### 2. Check Console on Page Load
Should see:
```
[OAuth Test] Supabase URL: https://dguhvsjrqnpeonfhotty.supabase.co
```
(Not uimxwujknpuespwvipbi!)

### 3. Check for Warnings
Should NOT see:
```
Multiple GoTrueClient instances detected
```

### 4. Test OAuth Flow
1. Click "Test Google Login"
2. Should redirect to Google
3. Select account
4. Should redirect back
5. Should see success message

### 5. Verify Network Requests
All requests should go to:
```
https://dguhvsjrqnpeonfhotty.supabase.co
```

NOT to:
```
https://uimxwujknpuespwvipbi.supabase.co
```

---

## Quick Diagnosis Commands

Run these in browser console to diagnose:

```javascript
// Check which Supabase URL is active
console.log('window.VITE_SUPABASE_URL:', window.VITE_SUPABASE_URL);
console.log('import.meta.env.VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL);

// Check current session
const { data } = await supabase.auth.getSession();
console.log('Current session:', data.session);

// Check which URL the client is using
console.log('Supabase client URL:', supabase.supabaseUrl);

// Count how many clients exist
console.log('Check localStorage for multiple auth tokens');
console.log(Object.keys(localStorage).filter(k => k.includes('supabase')));
```

---

## Expected vs Actual Behavior

### Expected (After Fixes)

1. Page loads with correct Supabase URL
2. No "Multiple clients" warning
3. OAuth button triggers Google sign-in
4. Redirects to correct callback URL
5. Session is created successfully
6. All app components see the same session

### Actual (Current State)

1. ❌ Page loads with WRONG Supabase URL (hardcoded old one)
2. ❌ "Multiple clients" warning appears
3. ❌ OAuth button tries to use wrong Supabase project
4. ❌ Google rejects due to redirect URI mismatch
5. ❌ No session created
6. ❌ App components use different client instances

---

## Summary

Your Google OAuth is failing because:

1. **URL Mismatch**: App uses two different Supabase projects
2. **Multiple Clients**: 10+ separate Supabase clients created
3. **Configuration Mismatch**: OAuth configured for one project, but app uses another
4. **Override Issues**: `.env` values overridden by hardcoded wrong values

**Fix Priority**:
1. Update all hardcoded URLs to match `.env`
2. Use singleton client everywhere
3. Verify Google OAuth configuration in Supabase dashboard
4. Rebuild and test

Once these fixes are applied, Google OAuth should work correctly.
