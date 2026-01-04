import { supabase } from '../supabase-client.js';
import { switchToSignUp, switchToSignIn } from '../header/header.js';

let authRedirectPath = null;

export function initAuth() {
  console.log('[Auth] Initializing auth UI');

  setupSignUpListeners();
  setupSignInListeners();
  setupOAuthListeners();
  setupBiometricUI();
}

export function setAuthRedirect(path) {
  authRedirectPath = path;
  sessionStorage.setItem('auth_redirect', path);
}

export function getAuthRedirect() {
  return authRedirectPath || sessionStorage.getItem('auth_redirect');
}

export function clearAuthRedirect() {
  authRedirectPath = null;
  sessionStorage.removeItem('auth_redirect');
}

function setupSignUpListeners() {
  const emailSignUpForm = document.getElementById('emailSignUpForm');
  const phoneSignUpForm = document.getElementById('phoneSignUpForm');
  const switchToSignInLink = document.querySelectorAll('[data-switch="signin"]');
  const signUpTabEmail = document.getElementById('signUpTabEmail');
  const signUpTabPhone = document.getElementById('signUpTabPhone');

  signUpTabEmail?.addEventListener('click', () => {
    document.getElementById('emailSignUpSection')?.classList.remove('hidden');
    document.getElementById('phoneSignUpSection')?.classList.add('hidden');
    signUpTabEmail.classList.add('active-tab');
    signUpTabPhone?.classList.remove('active-tab');
  });

  signUpTabPhone?.addEventListener('click', () => {
    document.getElementById('phoneSignUpSection')?.classList.remove('hidden');
    document.getElementById('emailSignUpSection')?.classList.add('hidden');
    signUpTabPhone.classList.add('active-tab');
    signUpTabEmail?.classList.remove('active-tab');
  });

  emailSignUpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleEmailSignUp();
  });

  phoneSignUpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handlePhoneSignUp();
  });

  switchToSignInLink.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchToSignIn();
    });
  });
}

function setupSignInListeners() {
  const emailSignInForm = document.getElementById('emailSignInForm');
  const phoneSignInForm = document.getElementById('phoneSignInForm');
  const switchToSignUpLink = document.querySelectorAll('[data-switch="signup"]');
  const signInTabEmail = document.getElementById('signInTabEmail');
  const signInTabPhone = document.getElementById('signInTabPhone');

  signInTabEmail?.addEventListener('click', () => {
    document.getElementById('emailSignInSection')?.classList.remove('hidden');
    document.getElementById('phoneSignInSection')?.classList.add('hidden');
    signInTabEmail.classList.add('active-tab');
    signInTabPhone?.classList.remove('active-tab');
  });

  signInTabPhone?.addEventListener('click', () => {
    document.getElementById('phoneSignInSection')?.classList.remove('hidden');
    document.getElementById('emailSignInSection')?.classList.add('hidden');
    signInTabPhone.classList.add('active-tab');
    signInTabEmail?.classList.remove('active-tab');
  });

  emailSignInForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleEmailSignIn();
  });

  phoneSignInForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handlePhoneSignIn();
  });

  switchToSignUpLink.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchToSignUp();
    });
  });
}

function setupOAuthListeners() {
  const googleBtns = document.querySelectorAll('[data-oauth="google"]');
  const appleBtns = document.querySelectorAll('[data-oauth="apple"]');

  googleBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleOAuth('google');
    });
  });

  appleBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleOAuth('apple');
    });
  });
}

async function handleEmailSignUp() {
  const nameInput = document.getElementById('signUpName');
  const emailInput = document.getElementById('signUpEmail');
  const passwordInput = document.getElementById('signUpPassword');
  const messageEl = document.getElementById('emailSignUpMessage');

  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!email) {
    showMessage(messageEl, 'Please enter your email address', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage(messageEl, 'Please enter a valid email address', 'error');
    return;
  }

  if (!password) {
    showMessage(messageEl, 'Please enter a password', 'error');
    return;
  }

  if (password.length < 8) {
    showMessage(messageEl, 'Password must be at least 8 characters long', 'error');
    return;
  }

  showMessage(messageEl, 'Creating your account...', 'info');

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw error;
    }

    if (data?.user) {
      showMessage(messageEl, "Account created! You're now signed in.", 'success');

      setTimeout(() => {
        closeAuthModals();
        showToast('Welcome to BrainDash!');

        const redirect = getAuthRedirect();
        if (redirect) {
          clearAuthRedirect();
          window.location.href = redirect;
        }
      }, 1000);
    }
  } catch (error) {
    console.error('[Auth] Sign up error:', error);
    const userMessage = error.message || 'Unable to create account. Please try again.';
    showMessage(messageEl, userMessage, 'error');
  }
}

async function handlePhoneSignUp() {
  const nameInput = document.getElementById('signUpPhoneName');
  const phoneInput = document.getElementById('signUpPhone');
  const passwordInput = document.getElementById('signUpPhonePassword');
  const messageEl = document.getElementById('phoneSignUpMessage');

  const name = nameInput?.value.trim();
  const phone = phoneInput?.value.trim();
  const password = passwordInput?.value;

  if (!phone || !password) {
    showMessage(messageEl, 'Please fill in all required fields', 'error');
    return;
  }

  if (password.length < 8) {
    showMessage(messageEl, 'Password must be at least 8 characters', 'error');
    return;
  }

  showMessage(messageEl, 'Creating account...', 'info');

  try {
    const { data, error } = await supabase.auth.signUp({
      phone,
      password,
      options: {
        data: {
          name: name || phone
        }
      }
    });

    if (error) throw error;

    showMessage(messageEl, 'Account created successfully!', 'success');
    closeAuthModals();
    showToast('Welcome to BrainDash!');
  } catch (error) {
    console.error('[Auth] Phone sign up error:', error);
    showMessage(messageEl, error.message || 'Sign up failed', 'error');
  }
}

async function handleEmailSignIn() {
  const emailInput = document.getElementById('signInEmail');
  const passwordInput = document.getElementById('signInPassword');
  const messageEl = document.getElementById('emailSignInMessage');

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!email) {
    showMessage(messageEl, 'Please enter your email address', 'error');
    return;
  }

  if (!password) {
    showMessage(messageEl, 'Please enter your password', 'error');
    return;
  }

  showMessage(messageEl, 'Signing in...', 'info');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid') || error.message.includes('incorrect')) {
        throw new Error('Incorrect email or password, or account not found.');
      }
      throw error;
    }

    showMessage(messageEl, 'Welcome back!', 'success');

    setTimeout(() => {
      closeAuthModals();
      showToast('Signed in successfully!');

      const redirect = getAuthRedirect();
      if (redirect) {
        clearAuthRedirect();
        window.location.href = redirect;
      }
    }, 800);
  } catch (error) {
    console.error('[Auth] Sign in error:', error);
    const userMessage = error.message || 'Unable to sign in. Please check your credentials.';
    showMessage(messageEl, userMessage, 'error');
  }
}

async function handlePhoneSignIn() {
  const phoneInput = document.getElementById('signInPhone');
  const passwordInput = document.getElementById('signInPhonePassword');
  const messageEl = document.getElementById('phoneSignInMessage');

  const phone = phoneInput?.value.trim();
  const password = passwordInput?.value;

  if (!phone || !password) {
    showMessage(messageEl, 'Please enter your phone and password', 'error');
    return;
  }

  showMessage(messageEl, 'Signing in...', 'info');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password
    });

    if (error) throw error;

    showMessage(messageEl, 'Welcome back!', 'success');
    closeAuthModals();
    showToast('Signed in successfully!');
  } catch (error) {
    console.error('[Auth] Phone sign in error:', error);
    showMessage(messageEl, error.message || 'Sign in failed', 'error');
  }
}

async function handleOAuth(provider) {
  try {
    console.log(`[Auth] ✅ ${provider} OAuth started`);
    console.log('[Auth] Using Supabase Site URL for redirect');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider
    });

    if (error) {
      console.error(`[Auth] ❌ ${provider} OAuth error:`, error);
      throw error;
    }

    console.log(`[Auth] ✅ Redirected to ${provider}`);
  } catch (error) {
    console.error(`[Auth] ${provider} OAuth error:`, error);
    showToast(`${provider} sign in failed. Please try again.`);
  }
}

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

function closeAuthModals() {
  const signInSheet = document.getElementById('signInSheet');
  const signUpSheet = document.getElementById('signUpSheet');

  if (signInSheet) {
    signInSheet.style.display = 'none';
    signInSheet.setAttribute('aria-hidden', 'true');
  }

  if (signUpSheet) {
    signUpSheet.style.display = 'none';
    signUpSheet.setAttribute('aria-hidden', 'true');
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }
}

function setupBiometricUI() {
  const biometricSignInBtn = document.getElementById('biometricSignIn');
  const biometricSignUpBtn = document.getElementById('biometricSignUpBtn');

  if (biometricSignInBtn) {
    biometricSignInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showBiometricComingSoon();
    });
  }

  if (biometricSignUpBtn) {
    biometricSignUpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showBiometricComingSoon();
    });
  }
}

function showBiometricComingSoon() {
  const modal = document.createElement('div');
  modal.className = 'sheet';
  modal.style.display = 'grid';
  modal.setAttribute('aria-hidden', 'false');

  modal.innerHTML = `
    <div class="modal" style="max-width:400px">
      <button class="close" onclick="this.closest('.sheet').remove()" aria-label="Close">&times;</button>
      <div style="text-align:center;padding:20px">
        <div style="font-size:48px;margin-bottom:16px">🔐</div>
        <h2 class="modal-title">Biometric Login Coming Soon</h2>
        <p style="color:var(--muted);margin-top:16px;line-height:1.6">
          Face ID, Touch ID, and passkey login will be available soon on supported devices.
          This feature will provide quick and secure access to your account.
        </p>
        <p style="color:var(--muted);margin-top:12px;font-size:0.875rem">
          For now, please continue using email and password to sign in.
        </p>
        <button class="btn" onclick="this.closest('.sheet').remove()" style="margin-top:24px;width:100%">
          Got it
        </button>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}

export async function getUserBiometricPreferences() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_biometric_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Auth] Error fetching biometric preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Auth] Error:', error);
    return null;
  }
}

export async function updateBiometricPreferences(preferences) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const existing = await getUserBiometricPreferences();

    if (existing) {
      const { data, error } = await supabase
        .from('user_biometric_preferences')
        .update(preferences)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('user_biometric_preferences')
        .insert({
          user_id: user.id,
          ...preferences
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('[Auth] Error updating biometric preferences:', error);
    throw error;
  }
}

export function initAuthUI() {
  return initAuth();
}
