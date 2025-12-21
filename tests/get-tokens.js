/**
 * Get JWT Tokens for Test Users
 *
 * Authenticates test users and saves their JWT tokens for use in negative tests.
 * Run this AFTER setup-test-fixtures.js
 *
 * Usage: node tests/get-tokens.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'fs/promises';

async function getTokens() {
  try {
    // Load fixtures
    const fixturesData = await readFile('tests/test-fixtures.json', 'utf8');
    const fixtures = JSON.parse(fixturesData);

    const SUPABASE_URL = fixtures.supabase_url;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_ANON_KEY) {
      console.error('Error: SUPABASE_ANON_KEY environment variable required');
      process.exit(1);
    }

    console.log('Authenticating test users...\n');

    const tokens = {};

    // Authenticate user 1
    const supabase1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: session1, error: e1 } = await supabase1.auth.signInWithPassword({
      email: fixtures.users.user1.email,
      password: fixtures.users.user1.password,
    });

    if (e1) {
      console.error('Failed to authenticate user 1:', e1.message);
    } else {
      tokens.user1_token = session1.session.access_token;
      console.log(`✓ User 1 authenticated: ${fixtures.users.user1.email}`);
    }

    // Authenticate user 2
    const supabase2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: session2, error: e2 } = await supabase2.auth.signInWithPassword({
      email: fixtures.users.user2.email,
      password: fixtures.users.user2.password,
    });

    if (e2) {
      console.error('Failed to authenticate user 2:', e2.message);
    } else {
      tokens.user2_token = session2.session.access_token;
      console.log(`✓ User 2 authenticated: ${fixtures.users.user2.email}`);
    }

    // Authenticate user 3 (frozen)
    const supabase3 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: session3, error: e3 } = await supabase3.auth.signInWithPassword({
      email: fixtures.users.user3.email,
      password: fixtures.users.user3.password,
    });

    if (e3) {
      console.error('Failed to authenticate user 3:', e3.message);
    } else {
      tokens.user3_token = session3.session.access_token;
      console.log(`✓ User 3 authenticated: ${fixtures.users.user3.email}`);
    }

    // Update fixtures with tokens
    fixtures.tokens = tokens;
    await writeFile('tests/test-fixtures.json', JSON.stringify(fixtures, null, 2));

    console.log('\n✅ Tokens saved to test-fixtures.json');
    console.log('\nReady to run tests: node tests/negative-security-tests-executable.js');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getTokens();
