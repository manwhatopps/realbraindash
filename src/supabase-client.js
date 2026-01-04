import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORRECT PROJECT: uhhpldqfwkrulhlgkfhn
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uhhpldqfwkrulhlgkfhn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// SAFETY CHECK: Prevent using wrong project
if (supabaseUrl.includes('dguhvsjrqnpeonfhotty')) {
  console.error('❌ [Supabase] CRITICAL ERROR: Using wrong project (dguhvsjrqnpeonfhotty)!');
  console.error('❌ [Supabase] Must use project: uhhpldqfwkrulhlgkfhn');
  throw new Error('Wrong Supabase project configured! Expected uhhpldqfwkrulhlgkfhn, got dguhvsjrqnpeonfhotty');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [Supabase] Missing environment variables!');
  console.error('❌ [Supabase] Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  throw new Error('Supabase configuration missing! Check .env file');
}

if (!supabaseUrl.includes('uhhpldqfwkrulhlgkfhn')) {
  console.warn('⚠️ [Supabase] URL does not contain expected project ref: uhhpldqfwkrulhlgkfhn');
}

// SINGLETON Supabase client - production-safe configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Redirect-only OAuth (NO popups, NO iframes)
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: window.localStorage,
    storageKey: 'braindash-auth',
  },
  global: {
    headers: {
      'X-Client-Info': 'braindash-web'
    }
  }
});

// Log client initialization (once only)
console.log('[Supabase] ✅ Client initialized (singleton)');
console.log('[Supabase] ✅ URL:', supabaseUrl);
console.log('[Supabase] ✅ Project ref:', supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]);
console.log('[Supabase] Flow type: PKCE (redirect-only)');

// Warn if multiple clients are created
if (window.__SUPABASE_CLIENT_INITIALIZED__) {
  console.warn('[Supabase] ⚠️ Multiple client instances detected! Use the singleton from supabase-client.js');
} else {
  window.__SUPABASE_CLIENT_INITIALIZED__ = true;
}
