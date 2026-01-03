# Google OAuth Diagnosis Checklist

Use this checklist to systematically diagnose OAuth issues.

---

## ✅ Supabase Client Setup

### Check #1: Count Supabase Client Instances

Run in browser console:
```javascript
// This won't give exact count, but check localStorage
console.log(Object.keys(localStorage).filter(k => k.includes('supabase')));
```

**Expected**: Single key for auth session
**Problem if**: Multiple keys with different project IDs

### Check #2: Verify Active Supabase URL

Run in browser console:
```javascript
console.log('window.VITE_SUPABASE_URL:', window.VITE_SUPABASE_URL);
console.log('Matches .env?', window.VITE_SUPABASE_URL === 'https://dguhvsjrqnpeonfhotty.supabase.co');
```

**Expected**:
```
window.VITE_SUPABASE_URL: https://dguhvsjrqnpeonfhotty.supabase.co
Matches .env? true
```

**Problem if**: Shows `uimxwujknpuespwvipbi` or `false`

### Check #3: Verify Singleton Usage

Search codebase:
```bash
grep -r "createClient" src/ --include="*.js" | grep -v "node_modules"
```

**Expected**: Only in `src/supabase-client.js`
**Problem if**: Multiple files create clients

---

## ✅ Google OAuth Configuration

### Check #4: Supabase Dashboard - Google Provider Enabled

1. Go to: https://supabase.com/dashboard/project/dguhvsjrqnpeonfhotty/auth/providers
2. Find "Google" in provider list
3. Check:
   - [ ] Google provider is ENABLED (toggle is ON)
   - [ ] Client ID is set: `184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03`
   - [ ] Client Secret is set (shows as "••••••••")
   - [ ] No error messages displayed

### Check #5: Supabase Dashboard - Redirect URLs

1. Go to: https://supabase.com/dashboard/project/dguhvsjrqnpeonfhotty/auth/url-configuration
2. Check "Site URL":
   - [ ] Set to your production domain OR `http://localhost:5173` for dev
3. Check "Redirect URLs":
   - [ ] Contains `http://localhost:5173` (for development)
   - [ ] Contains your production domain (if deployed)
   - [ ] Does NOT contain wildcards (they don't work well with OAuth)

### Check #6: Google Cloud Console - OAuth Client Configuration

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find client ID: `184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03`
3. Check "Authorized JavaScript origins":
   - [ ] Contains `http://localhost:5173`
   - [ ] Contains `https://dguhvsjrqnpeonfhotty.supabase.co`
   - [ ] Contains your production domain (if deployed)
4. Check "Authorized redirect URIs":
   - [ ] Contains `https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback`
   - [ ] Contains `http://localhost:5173` (for dev testing)
   - [ ] Does NOT contain `uimxwujknpuespwvipbi` (old project)

---

## ✅ Browser Console Logs

### Check #7: On Page Load

Open DevTools → Console, refresh page.

**Look for**:
```
[OAuth Test] Initializing Google OAuth test...
[OAuth Test] Supabase URL: https://dguhvsjrqnpeonfhotty.supabase.co
[OAuth Test] Wallet blocker active: {ethereum: undefined, solana: undefined, bybitWallet: undefined}
[OAuth Test] Test button ready. Click "Test Google Login" to start.
```

**✅ GOOD if**:
- URL is `dguhvsjrqnpeonfhotty`
- All wallets are `undefined`
- No errors appear

**❌ BAD if**:
- URL is `uimxwujknpuespwvipbi`
- Wallets are NOT undefined
- See: "Multiple GoTrueClient instances detected"
- See any TypeErrors or CORS warnings

### Check #8: On Button Click

Click "Test Google Login" button.

**Look for**:
```
[OAuth Test] ========================================
[OAuth Test] Starting Google OAuth flow...
[OAuth Test] Client ID: 184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03.apps.googleusercontent.com
[OAuth Test] Expected callback: https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
[OAuth Test] ========================================
[OAuth Test] ✅ OAuth flow initiated successfully!
[OAuth Test] Response data: {...}
[OAuth Test] Redirecting to Google...
```

**✅ GOOD if**:
- "OAuth flow initiated successfully"
- Redirects to Google sign-in page

**❌ BAD if**:
- See "❌ Error initiating OAuth"
- See error object logged
- Alert shows error message
- No redirect happens

### Check #9: After Google Sign-In

After selecting Google account and granting permissions.

**Look for**:
```
[OAuth Test] ========================================
[OAuth Test] Auth state changed: SIGNED_IN
[OAuth Test] ========================================
[OAuth Test] ✅ Successfully signed in!
[OAuth Test] User: {id: '...', email: 'user@example.com', ...}
[OAuth Test] Access Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[OAuth Test] Provider: google
[OAuth Test] Email: user@example.com
```

**Plus alert popup**:
```
✅ Google OAuth Success!

User: user@example.com
Provider: google

Check console for full token details.
```

**✅ GOOD if**:
- Event is "SIGNED_IN"
- User email is displayed
- Access token shown (partial)
- Alert appears with success message

**❌ BAD if**:
- No logs appear after redirect
- Event is "SIGNED_OUT" or undefined
- Session is null
- No alert appears

---

## ✅ Network Activity

### Check #10: OAuth Initiation Request

Open DevTools → Network → Filter: "authorize"

**Click "Test Google Login"**

**Look for request**:
```
POST https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/authorize
```

**Check**:
- [ ] Status: 200 OK
- [ ] Response contains: `{ "url": "https://accounts.google.com/o/oauth2/v2/auth?..." }`
- [ ] URL is `dguhvsjrqnpeonfhotty` (NOT `uimxwujknpuespwvipbi`)

**❌ BAD if**:
- Status: 400, 403, or 500
- Request goes to wrong Supabase project
- Response contains error message
- CORS error in console

### Check #11: Google OAuth Request

**Look for redirect**:
```
GET https://accounts.google.com/o/oauth2/v2/auth?
  client_id=184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03.apps.googleusercontent.com
  &redirect_uri=https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
  &response_type=code
  &scope=...
```

**Check**:
- [ ] Status: 200 or 302 (redirect)
- [ ] `client_id` matches your Google OAuth Client ID
- [ ] `redirect_uri` is `dguhvsjrqnpeonfhotty` (NOT `uimxwujknpuespwvipbi`)
- [ ] Google sign-in page loads

**❌ BAD if**:
- Status: 400 (Bad Request)
- Error: "redirect_uri_mismatch"
- Error: "invalid_client"
- Blank page or error page loads

### Check #12: OAuth Callback Request

**After signing in with Google**

**Look for request**:
```
GET https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback?code=...&state=...
```

**Check**:
- [ ] Status: 302 (redirect back to app)
- [ ] URL contains `code=` parameter
- [ ] Redirects to `window.location.origin`

**❌ BAD if**:
- Status: 400 or 403
- No `code` parameter
- Error message in URL
- Redirects to wrong domain

### Check #13: Token Exchange Request

**After callback**

**Look for request**:
```
POST https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/token
```

**Check**:
- [ ] Status: 200 OK
- [ ] Response contains: `{ "access_token": "...", "refresh_token": "...", "user": {...} }`
- [ ] User object has correct email

**❌ BAD if**:
- Status: 400 or 401
- Response contains error
- No access_token in response
- User is null

---

## ✅ Session Handling

### Check #14: Verify Session Created

Run in browser console (after successful OAuth):
```javascript
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('Error:', error);
```

**✅ GOOD if**:
```
Session: {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refresh_token: 'v1.MBz3...',
  user: {
    id: '...',
    email: 'user@example.com',
    app_metadata: { provider: 'google' }
  }
}
Error: null
```

**❌ BAD if**:
```
Session: null
Error: AuthSessionMissingError
```

### Check #15: Verify Session Persists

Refresh the page, then run:
```javascript
const { data } = await supabase.auth.getSession();
console.log('Session still valid:', !!data.session);
console.log('User:', data.session?.user?.email);
```

**✅ GOOD if**:
```
Session still valid: true
User: user@example.com
```

**❌ BAD if**:
```
Session still valid: false
User: undefined
```

### Check #16: Check Auth State Listener

Run in browser console:
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});

// Then trigger any auth action
```

**✅ GOOD if**:
- Listener fires for auth changes
- Event types logged correctly
- Session object populated

**❌ BAD if**:
- Listener never fires
- Session is always null
- Multiple listeners firing (indicates multiple clients)

---

## ✅ Additional Checks

### Check #17: Wallet Blocker Active

Run in browser console:
```javascript
console.log('ethereum:', window.ethereum);
console.log('solana:', window.solana);
console.log('bybitWallet:', window.bybitWallet);
```

**✅ GOOD if**:
```
ethereum: undefined
solana: undefined
bybitWallet: undefined
```

**❌ BAD if**:
Any of these are NOT undefined (wallet extension interfering)

### Check #18: Environment Variables Loaded

Run in browser console:
```javascript
console.log('window.VITE_SUPABASE_URL:', window.VITE_SUPABASE_URL);
console.log('window.VITE_SUPABASE_ANON_KEY:', window.VITE_SUPABASE_ANON_KEY?.substring(0, 50));
```

**✅ GOOD if**:
```
window.VITE_SUPABASE_URL: https://dguhvsjrqnpeonfhotty.supabase.co
window.VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX...
```

**❌ BAD if**:
- URL is `uimxwujknpuespwvipbi`
- Variables are undefined
- Variables are empty strings

### Check #19: No CORS Errors

Open DevTools → Console

**Filter**: "cors" or "CORS"

**✅ GOOD if**:
- No CORS errors appear

**❌ BAD if**:
```
Access to fetch at '...' has been blocked by CORS policy
```

### Check #20: localStorage Check

Run in browser console:
```javascript
const authKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
console.log('Auth-related localStorage keys:', authKeys);
authKeys.forEach(key => {
  const val = localStorage.getItem(key);
  console.log(key, ':', val?.substring(0, 100));
});
```

**✅ GOOD if**:
- Single key for current Supabase project
- Key contains `dguhvsjrqnpeonfhotty`

**❌ BAD if**:
- Multiple keys with different project IDs
- Keys contain `uimxwujknpuespwvipbi`
- No auth keys found

---

## 📊 Diagnosis Score

Count your ✅ and ❌ marks:

**20/20 ✅**: OAuth should work perfectly
**15-19 ✅**: Minor issues, OAuth might work intermittently
**10-14 ✅**: Significant issues, OAuth likely failing
**0-9 ✅**: Critical issues, OAuth definitely not working

---

## 🔴 Critical Issues (Fix Immediately)

If any of these are ❌, OAuth WILL NOT work:

- [ ] Check #2: Wrong Supabase URL (uimxwujknpuespwvipbi)
- [ ] Check #4: Google provider not enabled in Supabase
- [ ] Check #6: Redirect URIs not configured in Google Cloud Console
- [ ] Check #11: redirect_uri_mismatch error
- [ ] Check #13: Token exchange failing

---

## 🟡 Important Issues (Fix Soon)

If any of these are ❌, OAuth may work but with problems:

- [ ] Check #1: Multiple Supabase client instances
- [ ] Check #7: Multiple GoTrueClient warning
- [ ] Check #17: Wallet blocker not working
- [ ] Check #20: Multiple auth keys in localStorage

---

## 🟢 Minor Issues (Fix When Convenient)

These won't prevent OAuth from working:

- [ ] Check #15: Session not persisting (localStorage issue)
- [ ] Check #16: Auth listener not firing (multiple clients issue)
- [ ] Check #19: CORS warnings (usually informational)

---

## Quick Fix Priority

**Priority 1** (Do first):
1. Fix Supabase URL mismatch (Check #2)
2. Enable Google provider in Supabase (Check #4)
3. Configure redirect URIs in Google Cloud (Check #6)

**Priority 2** (Do next):
1. Consolidate to single Supabase client (Check #1, #7)
2. Clear old localStorage data (Check #20)
3. Verify wallet blocker working (Check #17)

**Priority 3** (Do last):
1. Test session persistence (Check #15)
2. Verify auth listener (Check #16)
3. Clean up any warnings (Check #19)

---

## Success Criteria

OAuth is working correctly when:

✅ All 20 checks pass
✅ Console shows successful OAuth flow
✅ Network tab shows 200 responses
✅ Session persists after refresh
✅ No errors or warnings in console
✅ User can sign in repeatedly without issues

---

## Still Having Issues?

If OAuth still fails after fixing all ❌ items:

1. **Clear everything**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
   Then hard refresh (Ctrl+Shift+R)

2. **Test in incognito mode** (rules out extension conflicts)

3. **Check Supabase logs**:
   - Go to: https://supabase.com/dashboard/project/dguhvsjrqnpeonfhotty/logs/auth-logs
   - Look for failed OAuth attempts
   - Check error messages

4. **Check Google Cloud Console logs**:
   - Go to: https://console.cloud.google.com/logs
   - Filter for your OAuth Client ID
   - Look for failed authorization attempts

5. **Verify OAuth consent screen**:
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Make sure it's published (not in testing)
   - Make sure app is not suspended

---

## Contact Support If...

After completing all fixes and checks, if OAuth still doesn't work:

**Supabase Support**:
- Dashboard shows provider enabled but OAuth fails
- Callback URL is correct but still getting errors
- Logs show unexpected errors

**Google Cloud Support**:
- Redirect URI mismatch despite correct configuration
- Client ID or secret issues
- Consent screen problems

Provide them with:
- This checklist (completed)
- Console logs
- Network request details
- Exact error messages
