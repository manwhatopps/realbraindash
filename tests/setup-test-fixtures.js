/**
 * Test Fixtures Setup Script
 *
 * Creates test users, lobbies, and data needed for negative security tests.
 * Run this ONCE before running the negative test suite.
 *
 * Usage: node tests/setup-test-fixtures.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupTestFixtures() {
  console.log('Setting up test fixtures...\n');

  try {
    // === CREATE TEST USERS ===
    console.log('[1/5] Creating test users...');

    const testUser1Email = `test-user-1-${Date.now()}@braindash.test`;
    const testUser2Email = `test-user-2-${Date.now()}@braindash.test`;
    const testUser3Email = `test-user-frozen-${Date.now()}@braindash.test`;

    const { data: user1, error: u1Error } = await supabase.auth.admin.createUser({
      email: testUser1Email,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    const { data: user2, error: u2Error } = await supabase.auth.admin.createUser({
      email: testUser2Email,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    const { data: user3, error: u3Error } = await supabase.auth.admin.createUser({
      email: testUser3Email,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (u1Error || u2Error || u3Error) {
      throw new Error('Failed to create test users');
    }

    const user1Id = user1.user.id;
    const user2Id = user2.user.id;
    const user3Id = user3.user.id;

    console.log(`  ✓ User 1: ${testUser1Email} (${user1Id})`);
    console.log(`  ✓ User 2: ${testUser2Email} (${user2Id})`);
    console.log(`  ✓ User 3: ${testUser3Email} (${user3Id}) [will be frozen]`);

    // === SETUP USER ELIGIBILITY ===
    console.log('\n[2/5] Setting up user eligibility (KYC)...');

    await supabase.from('user_eligibility').upsert([
      {
        user_id: user1Id,
        kyc_tier: 'tier1_basic',
        kyc_status: 'approved',
        max_stake_cents: 10000,
        withdrawals_locked: false,
      },
      {
        user_id: user2Id,
        kyc_tier: 'tier1_basic',
        kyc_status: 'approved',
        max_stake_cents: 10000,
        withdrawals_locked: false,
      },
      {
        user_id: user3Id,
        kyc_tier: 'unverified',
        kyc_status: 'pending',
        max_stake_cents: 0,
        withdrawals_locked: true,
      },
    ]);

    console.log('  ✓ KYC status set for all users');

    // === CREATE WALLETS ===
    console.log('\n[3/5] Creating wallets with balances...');

    await supabase.from('wallet_balance').upsert([
      {
        user_id: user1Id,
        available_cents: 50000, // $500
        locked_cents: 0,
      },
      {
        user_id: user2Id,
        available_cents: 25000, // $250
        locked_cents: 0,
      },
      {
        user_id: user3Id,
        available_cents: 10000, // $100
        locked_cents: 0,
      },
    ]);

    // Create ledger entries for deposits
    await supabase.from('wallet_ledger').insert([
      {
        user_id: user1Id,
        transaction_type: 'deposit',
        amount_cents: 50000,
        balance_after_cents: 50000,
        description: 'Test deposit',
      },
      {
        user_id: user2Id,
        transaction_type: 'deposit',
        amount_cents: 25000,
        balance_after_cents: 25000,
        description: 'Test deposit',
      },
    ]);

    console.log(`  ✓ User 1: $500.00 available`);
    console.log(`  ✓ User 2: $250.00 available`);
    console.log(`  ✓ User 3: $100.00 available`);

    // === CREATE TEST LOBBY ===
    console.log('\n[4/5] Creating test lobby...');

    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .insert({
        host_user_id: user1Id,
        category: 'Science',
        stake_cents: 500, // $5
        max_players: 4,
        current_players: 1,
        state: 'waiting_for_players',
        is_cash_match: true,
        rake_percentage: 10,
      })
      .select()
      .single();

    if (lobbyError) {
      throw new Error(`Failed to create lobby: ${lobbyError.message}`);
    }

    const lobbyId = lobby.id;
    console.log(`  ✓ Lobby created: ${lobbyId} ($5 stake, Science, 4 players max)`);

    // === FREEZE USER 3 ===
    console.log('\n[5/5] Freezing test user 3...');

    await supabase.from('account_freezes').insert({
      user_id: user3Id,
      freeze_type: 'hard',
      reason: 'Test account - intentionally frozen for negative testing',
    });

    console.log(`  ✓ User 3 frozen for testing`);

    // === GET USER TOKENS ===
    console.log('\n[6/5] Generating JWT tokens...');
    console.log('Note: You need to sign in to get actual JWT tokens.\n');

    // Save fixtures to file
    const fixtures = {
      users: {
        user1: {
          email: testUser1Email,
          password: 'TestPassword123!',
          id: user1Id,
        },
        user2: {
          email: testUser2Email,
          password: 'TestPassword123!',
          id: user2Id,
        },
        user3: {
          email: testUser3Email,
          password: 'TestPassword123!',
          id: user3Id,
          frozen: true,
        },
      },
      lobby: {
        id: lobbyId,
        stake_cents: 500,
        host_user_id: user1Id,
      },
      supabase_url: SUPABASE_URL,
    };

    const fs = await import('fs/promises');
    await fs.writeFile(
      'tests/test-fixtures.json',
      JSON.stringify(fixtures, null, 2)
    );

    console.log('\n✅ Test fixtures created successfully!');
    console.log('   Saved to: tests/test-fixtures.json');
    console.log('\nNext steps:');
    console.log('1. Run: node tests/get-tokens.js (to get JWT tokens)');
    console.log('2. Run: node tests/negative-security-tests-executable.js');

  } catch (error) {
    console.error('\n❌ Error setting up fixtures:', error.message);
    process.exit(1);
  }
}

setupTestFixtures();
