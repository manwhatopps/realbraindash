# Google OAuth - Quick Test Guide

## 🚀 Start Testing (2 minutes)

### Step 1: Configure Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/dguhvsjrqnpeonfhotty/auth/url-configuration
2. Set **Site URL** to: `http://localhost:5173`
3. Add **Redirect URLs:**
   ```
   http://localhost:5173
   http://localhost:5173/**
   https://dguhvsjrqnpeonfhotty.supabase.co/auth/v1/callback
   ```
4. Click **Save**

### Step 2: Start Dev Server
```bash
npm run dev
```

### Step 3: Open Browser
Navigate to: `http://localhost:5173`

### Step 4: Open DevTools Console
- Chrome/Edge: `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)
- Firefox: `F12` or `Cmd+Option+K` (Mac)
- Safari: Enable Dev Menu first, then `Cmd+Option+C`

### Step 5: Click "Test Google Login"
Look for the button on the page (if it exists) or use the Google sign-in option in the auth modal.

## ✅ Expected Console Output

### When you click the button:
```
[OAuth Test] ✅ Google OAuth started
[OAuth Test] Using Supabase Site URL (auto redirect)
[OAuth Test] ✅ Redirected to Google
```

Then browser redirects to Google sign-in page.

### After signing in with Google:
Browser returns to localhost and shows:
```
[Auth Guard] OAuth redirect detected
[Auth Guard] ✅ Returned from Google
[Auth Guard] ✅ Supabase session created
[Auth Guard] User: your.email@gmail.com
[Auth Guard] Provider: google
```

### Reload the page (Cmd+R or F5):
```
[Supabase] Client initialized (singleton)
[Auth Guard] ✅ Existing session found
[Auth Guard] User: your.email@gmail.com
[Auth Guard] Session valid until: [timestamp]
```

## ❌ What Should NOT Appear

- ❌ "Multiple GoTrueClient instances detected"
- ❌ "Cannot redefine property"
- ❌ "refused to connect"
- ❌ "400 Bad Request"
- ❌ "ERR_BLOCKED_BY_RESPONSE"
- ❌ Any chmln.js errors
- ❌ Any wallet blocker errors

## 🐛 Common Issues & Fixes

### Issue: OAuth doesn't redirect
**Check:** Supabase Site URL is set to `http://localhost:5173`

### Issue: 400 Bad Request
**Check:** Redirect URLs in Supabase include `http://localhost:5173`

### Issue: Session lost after reload
**Check:** Cookies enabled, not in private mode

### Issue: "Multiple GoTrueClient" warning
**Check:** No extra `createClient()` calls (should only be in `supabase-client.js`)

## 🔍 Verify Single Client

Run in browser console:
```javascript
console.log(window.__SUPABASE_CLIENT_INITIALIZED__);
// Should output: true (only once)
```

## 📱 Test in Different Contexts

### Test 1: Fresh Session
1. Clear browser data
2. Reload page
3. Sign in with Google
4. Verify session created

### Test 2: Session Persistence
1. Sign in with Google
2. Reload page
3. Verify session restored

### Test 3: Sign Out
1. Sign out (if button exists)
2. Verify session cleared
3. Sign in again
4. Verify new session created

## 🎯 Success Criteria

If you see all these, OAuth is working:
- ✅ Google sign-in page loads
- ✅ Returns to localhost after sign-in
- ✅ Console shows "Supabase session created"
- ✅ Email appears in console
- ✅ Session persists after reload
- ✅ No error messages

## 📸 Screenshot Checklist

Take screenshots of:
1. Console showing "OAuth started"
2. Google sign-in page
3. Console showing "session created"
4. Console after page reload (session restored)

## 🚀 Ready for Production

Once localhost works:
1. Update Supabase Site URL to production domain
2. Add production domain to redirect URLs
3. Test on staging first
4. Deploy to production

## 📞 Need Help?

Check these files:
- `GOOGLE_OAUTH_FIX_COMPLETE.md` - Full implementation details
- `OAUTH_PRODUCTION_SETUP.md` - Production configuration guide
- Supabase logs: https://supabase.com/dashboard/project/dguhvsjrqnpeonfhotty/logs/auth-logs
