# Google OAuth Test Guide

**Status**: Temporary test button active on homepage

---

## Overview

A temporary test button has been added to the homepage to verify that Google OAuth works correctly without interference from Web3 wallet extensions (MetaMask, Phantom, Bybit, etc.).

---

## What Was Added

### 1. Test Button on Homepage

Located below the main tagline:
- Red button labeled "🧪 Test Google Login"
- Helper text: "Temporary test button - check browser console for OAuth flow results"

### 2. OAuth Test Script

Automatic console logging for:
- OAuth flow initialization
- Wallet blocker status verification
- Success/error messages
- Token details (partial, for security)
- Auth state changes

---

## How to Use

### Step 1: Open Browser Console

Before clicking the button:
1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Clear any existing logs (optional)

### Step 2: Verify Wallet Blocker

On page load, you should see:
```
[OAuth Test] Initializing Google OAuth test...
[OAuth Test] Supabase URL: https://dguhvsjrqnpeonfhotty.supabase.co
[OAuth Test] Wallet blocker active: {ethereum: undefined, solana: undefined, bybitWallet: undefined}
[OAuth Test] Test button ready. Click "Test Google Login" to start.
```

This confirms wallets are blocked.

### Step 3: Click Test Button

Click "🧪 Test Google Login"

You should see:
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

### Step 4: Google Sign-In

The page will redirect to Google's sign-in:
1. Select or enter your Google account
2. Grant permissions if prompted
3. Wait for redirect back to the app

### Step 5: Success Confirmation

After successful login, you'll see:
```
[OAuth Test] ========================================
[OAuth Test] Auth state changed: SIGNED_IN
[OAuth Test] ========================================
[OAuth Test] ✅ Successfully signed in!
[OAuth Test] User: {id: '...', email: 'user@example.com', ...}
[OAuth Test] Access Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[OAuth Test] Refresh Token (first 50 chars): v1.MBz3Iq...
[OAuth Test] Provider: google
[OAuth Test] Email: user@example.com
[OAuth Test] Full session object: {...}
[OAuth Test] ========================================
```

Plus a success alert:
```
✅ Google OAuth Success!

User: user@example.com
Provider: google

Check console for full token details.
```

---

## What to Check

### Success Indicators

1. **No Wallet Interference**
   - `ethereum: undefined`
   - `solana: undefined`
   - `bybitWallet: undefined`

2. **OAuth Flow Starts**
   - "OAuth flow initiated successfully"
   - Redirect to Google happens

3. **Successful Return**
   - Auth state changes to `SIGNED_IN`
   - User email appears in console
   - Access token logged (partial)
   - Alert shows success message

### Error Indicators

If something fails, you'll see:
```
[OAuth Test] ❌ Error initiating OAuth: {...}
[OAuth Test] Error details: {message: '...', status: ..., name: '...'}
```

Plus an alert with the error message.

---

## Common Issues

### Issue 1: Wallet Extensions Interfering

**Symptoms:**
- OAuth popup blocked
- Redirect fails
- Console shows wallet objects (not undefined)

**Fix:**
- Refresh page
- Verify wallet blocker script ran first
- Check console for wallet status on load

### Issue 2: OAuth Configuration Error

**Symptoms:**
- "OAuth Error: Invalid client ID"
- "Redirect URI mismatch"

**Fix:**
- Verify Google OAuth Client ID in Supabase dashboard
- Check authorized redirect URIs include:
  - `https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback`
  - `http://localhost:5173` (for development)

### Issue 3: Popup Blocked

**Symptoms:**
- Browser blocks OAuth popup
- No redirect happens

**Fix:**
- Allow popups for this site
- Try again

---

## Console Output Reference

### On Page Load
```
[OAuth Test] Initializing Google OAuth test...
[OAuth Test] Supabase URL: https://dguhvsjrqnpeonfhotty.supabase.co
[OAuth Test] Wallet blocker active: {ethereum: undefined, solana: undefined, bybitWallet: undefined}
[OAuth Test] Test button ready. Click "Test Google Login" to start.
```

### On Button Click
```
[OAuth Test] ========================================
[OAuth Test] Starting Google OAuth flow...
[OAuth Test] Client ID: 184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03.apps.googleusercontent.com
[OAuth Test] Expected callback: https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
[OAuth Test] ========================================
[OAuth Test] ✅ OAuth flow initiated successfully!
[OAuth Test] Response data: {provider: 'google', url: 'https://accounts.google.com/o/oauth2/v2/auth?...'}
[OAuth Test] Redirecting to Google...
```

### On Successful Sign-In
```
[OAuth Test] ========================================
[OAuth Test] Auth state changed: SIGNED_IN
[OAuth Test] ========================================
[OAuth Test] ✅ Successfully signed in!
[OAuth Test] User: {
  id: '12345678-1234-1234-1234-123456789abc',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'user@example.com',
  email_confirmed_at: '2026-01-03T...',
  ...
}
[OAuth Test] Access Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ...
[OAuth Test] Refresh Token (first 50 chars): v1.MBz3IqhZN2l...
[OAuth Test] Provider: google
[OAuth Test] Email: user@example.com
[OAuth Test] Full session object: {access_token: '...', refresh_token: '...', ...}
[OAuth Test] ========================================
```

### Auth State Events

The script also logs:
- `SIGNED_OUT` - When user signs out
- `TOKEN_REFRESHED` - When token is automatically refreshed
- `USER_UPDATED` - When user data changes

---

## Token Security

For security, tokens are only partially logged:
- Access Token: First 50 characters only
- Refresh Token: First 50 characters only

Full tokens are available in the session object but not printed to console in plain text.

To access full tokens (for testing):
```javascript
// In browser console after successful login
const { data } = await supabase.auth.getSession();
console.log('Full access token:', data.session.access_token);
```

---

## Configuration Details

### Google OAuth Client ID
```
184979617710-i9rcsvn3etaklq35ng3srofoiatj6v03.apps.googleusercontent.com
```

### Supabase Auth Callback URL
```
https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
```

### Redirect After Login
```
window.location.origin (returns to homepage)
```

### OAuth Scopes Requested
- Basic profile information
- Email address
- Offline access (for refresh tokens)

---

## Testing Checklist

- [ ] Page loads without errors
- [ ] Console shows wallet blocker active
- [ ] Test button appears on homepage
- [ ] Clicking button logs OAuth flow start
- [ ] Redirects to Google sign-in
- [ ] Can select/enter Google account
- [ ] Redirects back to homepage
- [ ] Console shows SIGNED_IN event
- [ ] Console shows user email
- [ ] Console shows access token (partial)
- [ ] Alert shows success message
- [ ] No wallet extension interference

---

## Removing the Test Button

When testing is complete, remove these sections from `index.html`:

### 1. Remove Button HTML (lines ~262-270)
```html
<!-- TEMPORARY: Google OAuth Test Button -->
<div style="margin-top:20px;text-align:center">
  ...
</div>
```

### 2. Remove Test Script (lines ~1496-1589)
```html
<!-- TEMPORARY: Google OAuth Test Script -->
<script type="module">
  ...
</script>
```

Then rebuild:
```bash
npm run build
```

---

## Next Steps

After confirming OAuth works:
1. Remove test button (see above)
2. Integrate OAuth into existing auth flows
3. Update header sign-in/sign-up buttons to use Google OAuth
4. Add Apple OAuth similarly if needed
5. Test with multiple browser extensions installed

---

## Summary

The test button verifies:
- Web3 wallets are successfully blocked
- Google OAuth initiates without interference
- User can sign in with Google account
- Tokens are received and logged
- Auth state changes are detected

All outputs are visible in browser console for debugging.
