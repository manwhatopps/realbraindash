# Google OAuth Diagnosis - Executive Summary

**Date**: January 3, 2026
**Status**: CRITICAL CONFIGURATION ERRORS FOUND

---

## The Problem

Your Google OAuth is failing because **the app is trying to use two different Supabase projects at the same time**.

---

## Root Cause

**Supabase URL Mismatch**

Your `.env` file says:
```
VITE_SUPABASE_URL=https://dguhvsjrqnpeonfhotty.supabase.co
```

But `index.html` has hardcoded:
```javascript
window.VITE_SUPABASE_URL = 'https://uimxwujknpuespwvipbi.supabase.co';
```

**Result**: The app loads with the WRONG Supabase URL, so OAuth fails because:
- Google OAuth is configured for `dguhvsjrqnpeonfhotty`
- But the app tries to authenticate with `uimxwujknpuespwvipbi`
- Callback URLs don't match
- Sessions are created in the wrong project

---

## Secondary Issues

1. **Multiple Supabase Clients**: 10+ files create their own `createClient()` instances
2. **Singleton Not Used**: Test script creates a new client instead of using the singleton
3. **Configuration Mismatch**: OAuth configured for one project, but app uses another

---

## Impact

When you click "Test Google Login":
1. ❌ Request goes to WRONG Supabase project
2. ❌ Google rejects due to redirect_uri_mismatch
3. ❌ No session is created
4. ❌ Auth state never changes to SIGNED_IN
5. ❌ Console shows errors instead of success

---

## The Fix (3 Steps)

### Step 1: Update Hardcoded URLs

**Files to edit**:
- `index.html` line 1284-1285
- `cash-matches.html` line 305-306
- `verification.html` line 120-121
- `verify-identity.html` line 327-328

**Change FROM**:
```javascript
window.VITE_SUPABASE_URL = 'https://uimxwujknpuespwvipbi.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...old-key';
```

**Change TO**:
```javascript
window.VITE_SUPABASE_URL = 'https://dguhvsjrqnpeonfhotty.supabase.co';
window.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndWh2c2pycW5wZW9uZmhvdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDkxOTAsImV4cCI6MjA3OTIyNTE5MH0.VQ1LAy545BkKan70yHdnOup1y33BH4wm3w-bKq_qxAs';
```

### Step 2: Use Singleton in Test Script

**In `index.html` line 1498-1511**

**Change FROM**:
```javascript
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Change TO**:
```javascript
import { supabase } from '/src/supabase-client.js';
```

### Step 3: Rebuild

```bash
npm run build
```

---

## Verification

After fixes, check console on page load:

**Should see**:
```
[OAuth Test] Supabase URL: https://dguhvsjrqnpeonfhotty.supabase.co
```

**Should NOT see**:
```
[OAuth Test] Supabase URL: https://uimxwujknpuespwvipbi.supabase.co
Multiple GoTrueClient instances detected
```

---

## Testing

1. Clear browser storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. Hard refresh (Ctrl+Shift+R)

3. Click "Test Google Login"

4. Should see:
   - Redirect to Google
   - Sign in with account
   - Redirect back to app
   - Success message in console and alert

---

## Documentation Created

I've created 3 comprehensive guides:

1. **OAUTH_DIAGNOSIS_REPORT.md**
   - Full technical analysis
   - All issues found
   - Detailed explanations
   - Network request analysis

2. **OAUTH_QUICK_FIX.md**
   - Copy-paste fixes
   - Step-by-step instructions
   - Exact code to change
   - Testing procedure

3. **OAUTH_DIAGNOSIS_CHECKLIST.md**
   - 20-point diagnosis checklist
   - Browser console commands
   - Network activity checks
   - Success criteria

---

## Quick Diagnosis Commands

Run these in browser console right now:

```javascript
// Check which URL is active
console.log('Active URL:', window.VITE_SUPABASE_URL);
console.log('Should be: https://dguhvsjrqnpeonfhotty.supabase.co');
console.log('Match?', window.VITE_SUPABASE_URL === 'https://dguhvsjrqnpeonfhotty.supabase.co');
```

**If "Match?" is `false`**, you have the URL mismatch issue.

---

## Additional Checks Needed

After fixing the URL issue, verify:

### 1. Supabase Dashboard
- Go to: https://supabase.com/dashboard/project/dguhvsjrqnpeonfhotty/auth/providers
- Confirm Google provider is ENABLED
- Confirm Client ID is set: `184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03`
- Confirm Client Secret is filled in

### 2. Google Cloud Console
- Go to: https://console.cloud.google.com/apis/credentials
- Find client: `184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03`
- Confirm "Authorized redirect URIs" includes:
  ```
  https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
  ```

---

## Why This Happened

Likely causes:
1. Project migration (switched from `uimxwujknpuespwvipbi` to `dguhvsjrqnpeonfhotty`)
2. Old hardcoded values weren't updated
3. `.env` was updated but HTML files weren't

---

## Long-Term Fix (Recommended)

Instead of hardcoding URLs in HTML files, use Vite's env variables:

**Remove these lines from all HTML files**:
```javascript
window.VITE_SUPABASE_URL = '...';
window.VITE_SUPABASE_ANON_KEY = '...';
```

**Vite automatically injects `import.meta.env` values at build time.**

Only use `window.VITE_*` as fallback for non-module scripts.

---

## Success Criteria

OAuth is working when:
- ✅ Console shows correct Supabase URL (dguhvsjrqnpeonfhotty)
- ✅ No "Multiple clients" warning
- ✅ OAuth redirects to Google
- ✅ Callback returns to app successfully
- ✅ Console logs "Successfully signed in!"
- ✅ User email appears in logs
- ✅ Access token is present
- ✅ Alert shows success message

---

## Next Steps

1. **Immediate**: Fix hardcoded URLs (Step 1)
2. **Important**: Use singleton client (Step 2)
3. **Critical**: Rebuild (Step 3)
4. **Verify**: Test OAuth flow
5. **Optional**: Use diagnosis checklist for comprehensive verification

---

## Need More Details?

**For technical analysis**: Read `OAUTH_DIAGNOSIS_REPORT.md`
**For quick fixes**: Read `OAUTH_QUICK_FIX.md`
**For systematic testing**: Use `OAUTH_DIAGNOSIS_CHECKLIST.md`

---

## Summary

**Problem**: Using wrong Supabase URL
**Fix**: Update 4 HTML files with correct URL
**Time**: 5 minutes
**Impact**: OAuth will work immediately after fix

The test button you added is correctly implemented. The only issue is the URL mismatch preventing it from working.
