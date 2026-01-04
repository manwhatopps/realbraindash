# OAuth Production Setup Guide

## Problem Solved
Fixed "refused to connect" error caused by Supabase Auth attempting localhost redirects in production.

## What Was Changed

### 1. Supabase Client (src/supabase-client.js)
- **SINGLETON pattern enforced** - warns if multiple clients created
- **PKCE flow** enabled (most secure OAuth flow)
- **Redirect-only** - no popups, no iframes, no embedded auth
- **Auto session detection** - handles OAuth returns automatically
- **Production-safe headers** - identifies client as "braindash-web"

### 2. Production Auth Guard (src/main.js)
- **Session restoration** on page load
- **OAuth return handling** with comprehensive logging
- **Error detection** for failed OAuth attempts
- **URL cleanup** after OAuth completes
- **Context-aware redirects** for free/cash play flows

### 3. OAuth Calls (src/auth/auth-ui.js & index.html)
- All OAuth calls use: `redirectTo: window.location.origin`
- No `skipBrowserRedirect`, `usePopup`, or iframe options
- Clean, production-ready implementation

## Supabase Dashboard Configuration Required

### Navigate to: Authentication → URL Configuration

**Site URL:**
```
Set dynamically using window.location.origin
For localhost: http://localhost:5173
For production: https://your-domain.com
```

**Redirect URLs (Add both):**
```
${window.location.origin}/*
https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
```

**Additional Redirect URLs:**
Add any custom domains or staging environments:
```
https://your-production-domain.com/*
https://staging.your-domain.com/*
```

### Google OAuth Provider Setup

1. **Enable Google Provider** in Supabase Dashboard
2. **Client ID:** Already configured (ends in apps.googleusercontent.com)
3. **Client Secret:** Ensure it's set in Supabase
4. **Authorized JavaScript Origins** in Google Console:
   - `http://localhost:5173`
   - `https://dguhvsjrqnpeonfhotty.supabase.co`
   - Your production domain

5. **Authorized Redirect URIs** in Google Console:
   - `https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback`

## How OAuth Flow Works Now

### User Clicks "Sign in with Google"

1. **Client calls:** `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. **Browser redirects to:** Google sign-in page
3. **User authenticates** with Google
4. **Google redirects to:** `https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback`
5. **Supabase processes** authentication
6. **Supabase redirects to:** `window.location.origin` (your app)
7. **Auth Guard detects** OAuth return via URL params
8. **Session established** and stored in localStorage
9. **URL cleaned** (removes OAuth params)
10. **User sees** success toast

## Testing Checklist

### Localhost Testing
- [ ] Open `http://localhost:5173`
- [ ] Click "Test Google Login" button
- [ ] Verify redirect to Google (not popup)
- [ ] Sign in with Google
- [ ] Return to localhost
- [ ] Check console logs for:
  - `[Auth Guard] OAuth redirect detected`
  - `[Auth Guard] ✅ Session established successfully!`
  - No errors about "refused to connect"
  - No warnings about multiple clients

### Production Testing
- [ ] Deploy to production domain
- [ ] Update Supabase redirect URLs to include production domain
- [ ] Test Google OAuth on production
- [ ] Verify session persists after page reload
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices

## Logging Reference

### Good Logs (OAuth Success)
```
[Supabase] Client initialized (singleton)
[Auth Guard] Initializing production auth guard...
[Auth Guard] OAuth redirect detected
[Auth Guard] ✅ Session established successfully!
[Auth Guard] User: user@example.com
[Auth Guard] Provider: google
```

### Warning Logs (Multiple Clients)
```
[Supabase] ⚠️ Multiple client instances detected!
```
**Action:** Find and remove duplicate `createClient()` calls

### Error Logs (OAuth Failed)
```
[Auth Guard] ❌ OAuth error: access_denied
[Auth Guard] ❌ Error getting session: ...
```
**Action:** Check Supabase dashboard configuration

## Security Features

1. **PKCE Flow** - Most secure OAuth flow, prevents authorization code interception
2. **No Popups** - Prevents popup blockers and phishing risks
3. **Session Validation** - Checks session on every page load
4. **Token Security** - Never logs full tokens (only first 50 chars in test mode)
5. **Wallet Blocker Preserved** - Web3 wallets still blocked, analytics work

## Common Issues

### "refused to connect" Error
**Cause:** Redirect URL not in allowlist
**Fix:** Add your domain to Supabase redirect URLs

### Multiple GoTrueClient Warnings
**Cause:** Duplicate `createClient()` calls
**Fix:** Always import singleton from `/src/supabase-client.js`

### Session Not Persisting
**Cause:** Storage key conflict or cookies blocked
**Fix:** Check localStorage, ensure cookies enabled

### OAuth Redirects to Wrong URL
**Cause:** `redirectTo` not set to `window.location.origin`
**Fix:** Update all OAuth calls to use dynamic origin

## Files Modified

- `src/supabase-client.js` - Singleton client with PKCE
- `src/main.js` - Production auth guard
- `src/auth/auth-ui.js` - Already correct (no changes needed)
- `index.html` - Enhanced OAuth test logging

## Next Steps

1. **Update Supabase Dashboard** with redirect URLs
2. **Test on localhost** with "Test Google Login" button
3. **Deploy to staging** and test again
4. **Deploy to production** and verify
5. **Monitor logs** for any issues
6. **Remove test button** after confirming OAuth works

## Support

If OAuth still fails:
1. Check browser console for error logs
2. Check Supabase dashboard logs (Authentication → Logs)
3. Verify Google OAuth credentials in Supabase settings
4. Ensure redirect URLs exactly match (no trailing slashes, correct protocol)
