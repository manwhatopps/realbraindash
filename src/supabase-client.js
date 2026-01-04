import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://dguhvsjrqnpeonfhotty.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndWh2c2pycW5wZW9uZmhvdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDkxOTAsImV4cCI6MjA3OTIyNTE5MH0.VQ1LAy545BkKan70yHdnOup1y33BH4wm3w-bKq_qxAs';

// SINGLETON Supabase client - production-safe configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Redirect-only OAuth (NO popups, NO iframes)
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storageKey: 'braindash-auth',
  },
  global: {
    headers: {
      'X-Client-Info': 'braindash-web'
    }
  }
});

// Log client initialization (once only)
console.log('[Supabase] Client initialized (singleton)');
console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Flow type: PKCE (redirect-only)');

// Warn if multiple clients are created
if (window.__SUPABASE_CLIENT_INITIALIZED__) {
  console.warn('[Supabase] ⚠️ Multiple client instances detected! Use the singleton from supabase-client.js');
} else {
  window.__SUPABASE_CLIENT_INITIALIZED__ = true;
}
