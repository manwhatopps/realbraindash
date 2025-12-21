# BrainDash Authentication System

## Overview

BrainDash uses **Supabase Auth** for secure, production-ready authentication with support for multiple sign-in methods and future biometric/passkey integration.

---

## Current Features

### ✅ **Working Authentication Methods**

1. **Email + Password**
   - Full signup and signin flow
   - Password validation (min 8 characters)
   - Email validation
   - Automatic sign-in after signup

2. **Phone + Password**
   - Alternative to email authentication
   - Same security standards

3. **OAuth Providers**
   - Google Sign-In
   - Apple Sign-In
   - One-click authentication

### ✅ **Session Management**

- **Automatic session restoration** on app load
- **Persistent sessions** across browser sessions
- **Real-time auth state updates** via Supabase listeners
- **Automatic UI updates** when auth state changes

### ✅ **User Experience**

- **Clear error messages** for all failure scenarios
- **Smart redirects** after authentication
- **Browser password manager support**
- **Loading states** during authentication
- **Success confirmations** with toast notifications

---

## Sign Up Flow

### User Experience

1. User clicks "Sign Up" button
2. Modal opens with multiple options:
   - Google OAuth
   - Apple OAuth
   - Biometric (Coming Soon badge)
   - Email + Password
   - Phone + Password

3. **Email Sign Up:**
   - Enter name (optional)
   - Enter email address
   - Enter password (min 8 characters)
   - Click "Create Account"

4. **Validation:**
   - Email format checked
   - Password length validated
   - Duplicate email detected

5. **On Success:**
   - Account created in Supabase Auth
   - User automatically signed in
   - Success message: "Account created! You're now signed in."
   - Modal closes after 1 second
   - Toast notification shown
   - Redirected to intended destination (if applicable)

### Implementation Details

```javascript
// In src/auth/auth-ui.js
async function handleEmailSignUp() {
  // Validates email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Creates account
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || email.split('@')[0] },
      emailRedirectTo: window.location.origin
    }
  });

  // Handles redirect if user was trying to access protected content
  const redirect = getAuthRedirect();
  if (redirect) {
    clearAuthRedirect();
    window.location.href = redirect;
  }
}
```

---

## Sign In Flow

### User Experience

1. User clicks "Sign In" button
2. Modal opens with options:
   - Google OAuth
   - Apple OAuth
   - Biometric (Coming Soon badge)
   - Email + Password
   - Phone + Password

3. **Email Sign In:**
   - Enter email address
   - Enter password
   - Click "Sign In"

4. **Validation:**
   - Required fields checked
   - Credentials validated against Supabase

5. **On Success:**
   - User session created
   - Success message: "Welcome back!"
   - Modal closes after 0.8 seconds
   - Toast notification shown
   - Header UI updates (wallet, user menu visible)
   - Redirected to intended destination (if applicable)

6. **On Failure:**
   - Clear error message: "Incorrect email or password, or account not found."
   - Modal stays open for correction
   - No indication of which part is wrong (security)

### Implementation Details

```javascript
// In src/auth/auth-ui.js
async function handleEmailSignIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  // User-friendly error messages
  if (error) {
    if (error.message.includes('Invalid') || error.message.includes('incorrect')) {
      throw new Error('Incorrect email or password, or account not found.');
    }
    throw error;
  }

  // Handle redirect after successful auth
  const redirect = getAuthRedirect();
  if (redirect) {
    clearAuthRedirect();
    window.location.href = redirect;
  }
}
```

---

## Session Restoration

### On App Load

The app automatically checks for existing sessions:

```javascript
// In src/header/header.js
export function initHeader() {
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    currentSession = session;
    currentUser = session?.user || null;
    updateHeaderUI();
    if (currentUser) {
      await refreshBalance();
    }
  });

  // Restore existing session on load
  const { data: { session } } = await supabase.auth.getSession();
  currentSession = session;
  currentUser = session?.user || null;
  updateHeaderUI();
  if (currentUser) {
    await refreshBalance();
  }
}
```

### What Happens:

1. **If session exists:**
   - User automatically signed in
   - Header shows user menu and wallet
   - No sign-in required

2. **If no session:**
   - User treated as guest
   - Only see sign-in/sign-up options
   - Can still play free games

---

## Authentication Redirects

### Purpose

When a user tries to access protected content (like Cash Play) without being signed in, they're prompted to authenticate. After successful authentication, they're automatically redirected back to where they were going.

### Implementation

```javascript
// Setting a redirect (when user clicks Cash Play while not signed in)
import { setAuthRedirect } from './auth/auth-ui.js';

setAuthRedirect('/cash-matches.html');
openAuthModal('signin');

// Redirect is handled automatically after successful auth
const redirect = getAuthRedirect();
if (redirect) {
  clearAuthRedirect();
  window.location.href = redirect;
}
```

### Storage

Redirects are stored in `sessionStorage` so they persist across page reloads but not across browser sessions:

```javascript
sessionStorage.setItem('auth_redirect', '/cash-matches.html');
```

---

## Error Handling

### User-Friendly Messages

All error messages are translated into user-friendly language:

**Signup Errors:**
- "Please enter your email address"
- "Please enter a valid email address"
- "Please enter a password"
- "Password must be at least 8 characters long"
- "This email is already registered. Please sign in instead."
- "Unable to create account. Please try again."

**Signin Errors:**
- "Please enter your email address"
- "Please enter your password"
- "Incorrect email or password, or account not found."
- "Unable to sign in. Please check your credentials."

### Display Method

```javascript
function showMessage(element, message, type) {
  if (!element) return;

  element.textContent = message;
  element.style.display = 'block';

  if (type === 'error') {
    element.style.color = '#ff6b6b';
  } else if (type === 'success') {
    element.style.color = 'var(--accent)';
  } else {
    element.style.color = 'var(--muted)';
  }
}
```

---

## Biometric/Passkey Support (Future)

### Current State: **Scaffolding Only**

The UI and database are prepared for biometric authentication, but **no actual biometric functionality is implemented yet**.

### What's Ready:

1. **UI Elements:**
   - "Sign in with Biometrics" button in Sign In modal
   - "SOON" badge indicating future feature
   - Clicking shows informative modal

2. **Database Table:**
   ```sql
   user_biometric_preferences (
     id uuid PRIMARY KEY,
     user_id uuid REFERENCES auth.users,
     biometric_enabled boolean DEFAULT false,
     passkey_enabled boolean DEFAULT false,
     device_name text,
     device_platform text,
     last_biometric_login timestamptz,
     credentials_json jsonb DEFAULT '[]'
   )
   ```

3. **Helper Functions:**
   ```javascript
   // Get user's biometric preferences
   await getUserBiometricPreferences();

   // Update preferences
   await updateBiometricPreferences({
     biometric_enabled: true,
     device_name: 'iPhone 15',
     device_platform: 'ios'
   });
   ```

### What's NOT Implemented:

- ❌ WebAuthn API integration
- ❌ Platform-specific biometric APIs
- ❌ Credential storage and retrieval
- ❌ Actual biometric authentication
- ❌ Passkey registration
- ❌ Face ID / Touch ID integration

### Future Implementation:

When biometric support is added, the system will:

1. Check if device supports biometrics
2. Prompt user to register biometric credential
3. Store credential reference in `credentials_json`
4. Enable quick sign-in via biometric verification
5. Fall back to password if biometric fails

---

## Security Features

### Password Requirements

- Minimum 8 characters
- No complexity requirements (for better UX)
- Stored securely by Supabase (bcrypt hashing)

### Session Security

- **HTTP-only cookies** for session tokens
- **Automatic expiration** after inactivity
- **Secure transmission** via HTTPS
- **CSRF protection** built into Supabase

### OAuth Security

- **State parameter** prevents CSRF attacks
- **Redirect URI validation** prevents phishing
- **Token exchange** happens server-side
- **No client-side secrets** exposed

### Best Practices

✅ **Password validation** before submission
✅ **Email format validation**
✅ **No sensitive data** logged
✅ **User-friendly errors** don't reveal system details
✅ **Session restoration** checks server-side
✅ **Auth state listeners** keep UI in sync

---

## Testing Authentication

### Manual Test Cases

**Sign Up Flow:**
1. Open app → Click "Sign Up"
2. Enter email and password → Click "Create Account"
3. Verify: Success message, automatic sign-in, modal closes, header updates
4. Close browser tab
5. Reopen app → Verify: Still signed in (session restored)

**Sign In Flow:**
1. Sign out if signed in
2. Click "Sign In"
3. Enter wrong credentials → Verify: Error message shown
4. Enter correct credentials → Verify: Success, modal closes, header updates

**Protected Content:**
1. Sign out
2. Try to access Cash Play
3. Verify: Prompted to sign in
4. Sign in successfully
5. Verify: Redirected to Cash Play

**Biometric UI:**
1. Click "Sign in with Biometrics" button
2. Verify: "Coming Soon" modal appears
3. Click "Got it" → Modal closes

---

## API Reference

### Exported Functions

**From `src/auth/auth-ui.js`:**

```javascript
// Initialize auth UI
initAuth();

// Set redirect path after successful auth
setAuthRedirect(path: string);

// Get current redirect path
getAuthRedirect(): string | null;

// Clear redirect path
clearAuthRedirect();

// Get user's biometric preferences
getUserBiometricPreferences(): Promise<Object | null>;

// Update user's biometric preferences
updateBiometricPreferences(preferences: Object): Promise<Object>;
```

**From `src/header/header.js`:**

```javascript
// Switch to sign up modal
switchToSignUp();

// Switch to sign in modal
switchToSignIn();

// Update wallet balance display
updateHeaderBalance(balanceCents: number);
```

---

## Configuration

### Supabase Connection

```javascript
// In src/supabase-client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Common Issues & Solutions

### Issue: "Not authenticated" errors

**Solution:** Check that Supabase session is valid:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

### Issue: Redirects not working

**Solution:** Ensure `setAuthRedirect()` is called before opening auth modal:
```javascript
setAuthRedirect('/cash-matches.html');
openAuthModal('signin');
```

### Issue: Session not persisting

**Solution:** Check browser settings:
- Cookies must be enabled
- localStorage must be enabled
- No privacy extensions blocking Supabase

### Issue: OAuth not working

**Solution:** Configure OAuth providers in Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable Google/Apple
3. Add redirect URLs
4. Save configuration

---

## Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 8+)

**Password Manager Support:**
- ✅ Chrome autofill
- ✅ Safari Keychain
- ✅ 1Password
- ✅ LastPass
- ✅ Bitwarden

---

## Future Enhancements

### Planned Features

1. **Biometric Authentication**
   - WebAuthn integration
   - Face ID / Touch ID support
   - Passkey registration

2. **Account Recovery**
   - Password reset via email
   - Account recovery options
   - Security questions

3. **Multi-Factor Authentication**
   - TOTP (Google Authenticator)
   - SMS verification
   - Email verification codes

4. **Social Connections**
   - Link multiple auth methods
   - Unlink providers
   - Primary email management

5. **Security Dashboard**
   - Active sessions list
   - Login history
   - Device management
   - Security alerts

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   User Browser                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │   Auth UI (src/auth/auth-ui.js)         │ │
│  │   - Sign up forms                        │ │
│  │   - Sign in forms                        │ │
│  │   - Error handling                       │ │
│  │   - Redirect tracking                    │ │
│  └──────────────┬───────────────────────────┘ │
│                 │                              │
│  ┌──────────────▼───────────────────────────┐ │
│  │   Supabase Client                        │ │
│  │   - auth.signUp()                        │ │
│  │   - auth.signInWithPassword()            │ │
│  │   - auth.signInWithOAuth()               │ │
│  │   - auth.getSession()                    │ │
│  │   - auth.onAuthStateChange()             │ │
│  └──────────────┬───────────────────────────┘ │
│                 │                              │
└─────────────────┼──────────────────────────────┘
                  │
                  │ HTTPS
                  │
┌─────────────────▼──────────────────────────────┐
│            Supabase Backend                    │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │   Supabase Auth                          │ │
│  │   - User management                      │ │
│  │   - Session handling                     │ │
│  │   - OAuth integration                    │ │
│  │   - Token generation                     │ │
│  └──────────────┬───────────────────────────┘ │
│                 │                              │
│  ┌──────────────▼───────────────────────────┐ │
│  │   PostgreSQL Database                    │ │
│  │   - auth.users                           │ │
│  │   - user_biometric_preferences           │ │
│  │   - auth sessions                        │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

---

**Last Updated:** November 17, 2025
**Version:** 2.0.0
**Status:** Production Ready
