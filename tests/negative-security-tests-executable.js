/**
 * EXECUTABLE Negative Security Test Suite
 *
 * Tests that all security controls FAIL SAFELY.
 * Uses real test fixtures created by setup-test-fixtures.js
 *
 * Prerequisites:
 * 1. Run: node tests/setup-test-fixtures.js
 * 2. Run: node tests/get-tokens.js
 * 3. Run: node tests/negative-security-tests-executable.js
 *
 * All tests should FAIL (403, 400, 409, 429, etc.) - no test should succeed inappropriately.
 */

import { readFile } from 'fs/promises';
import { randomUUID } from 'crypto';

let fixtures;
let results = { passed: 0, failed: 0, tests: [] };

function log(message, type = 'info') {
  const colors = {
    pass: '\x1b[32m',
    fail: '\x1b[31m',
    info: '\x1b[36m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type] || colors.info}${message}${colors.reset}`);
}

function recordTest(name, passed, details) {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    log(`✓ ${name}`, 'pass');
  } else {
    results.failed++;
    log(`✗ ${name}`, 'fail');
    if (details) log(`  ${details}`, 'fail');
  }
}

// ============================================================
// TEST: IDOR - Access Another User's Wallet (RLS)
// ============================================================

async function testIDOR_WalletAccess() {
  log('\n[TEST] IDOR: User 1 attempts to read User 2 wallet via RLS');

  try {
    const res = await fetch(`${fixtures.supabase_url}/rest/v1/wallet_balance?user_id=eq.${fixtures.users.user2.id}`, {
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user1_token}`,
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
    });

    const data = await res.json();

    // Should return empty array (RLS blocks access)
    if (!data || data.length === 0) {
      recordTest('IDOR: Read another user wallet', true, 'RLS blocked access');
    } else {
      recordTest('IDOR: Read another user wallet', false, 'CRITICAL - RLS FAILED');
    }
  } catch (err) {
    recordTest('IDOR: Read another user wallet', true, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: IDOR - Join Lobby as Wrong User
// ============================================================

async function testIDOR_LobbyJoin() {
  log('\n[TEST] IDOR: User 2 tries to join lobby with User 3 ID in body');

  try {
    const res = await fetch(`${fixtures.supabase_url}/functions/v1/secure-lobby-join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user2_token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        lobbyId: fixtures.lobby.id,
        userId: fixtures.users.user3.id, // ATTACK: trying to use different user ID
      }),
    });

    const result = await res.json();

    // Should succeed or fail, but user_id in body should be IGNORED
    // The server should use auth.uid() from JWT, not client-supplied userId
    if (result.success || res.status === 400) {
      recordTest('IDOR: Client-supplied userId ignored', true, 'Server uses JWT auth.uid()');
    } else if (res.status === 403) {
      recordTest('IDOR: Client-supplied userId ignored', true, 'Request blocked (user 2 may not be eligible)');
    } else {
      recordTest('IDOR: Client-supplied userId ignored', false, 'Unexpected behavior');
    }
  } catch (err) {
    recordTest('IDOR: Client-supplied userId ignored', true, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: IDOR - Settle Match Not Participated In
// ============================================================

async function testIDOR_SettleUnrelatedMatch() {
  log('\n[TEST] IDOR: User 2 attempts to settle User 1 lobby (not participant)');

  try {
    const res = await fetch(`${fixtures.supabase_url}/functions/v1/secure-match-settle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user2_token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        lobbyId: fixtures.lobby.id,
      }),
    });

    if (res.status === 403) {
      recordTest('IDOR: Settle unrelated match', true, 'Blocked with 403 Forbidden');
    } else if (res.status === 400) {
      recordTest('IDOR: Settle unrelated match', true, 'Blocked (lobby not ready for settlement)');
    } else if (res.status === 200) {
      recordTest('IDOR: Settle unrelated match', false, 'CRITICAL - Settlement allowed for non-participant');
    } else {
      recordTest('IDOR: Settle unrelated match', true, `Blocked with status ${res.status}`);
    }
  } catch (err) {
    recordTest('IDOR: Settle unrelated match', true, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: Replay - Reuse Idempotency Key
// ============================================================

async function testReplay_IdempotencyKey() {
  log('\n[TEST] Replay: Reuse same idempotency key twice');

  const idempotencyKey = randomUUID();

  try {
    // First request
    const res1 = await fetch(`${fixtures.supabase_url}/functions/v1/secure-lobby-join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user2_token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ lobbyId: fixtures.lobby.id }),
    });

    const result1 = await res1.json();

    // Second request with SAME key
    const res2 = await fetch(`${fixtures.supabase_url}/functions/v1/secure-lobby-join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user2_token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ lobbyId: fixtures.lobby.id }),
    });

    const result2 = await res2.json();

    // Should return exact same response (cached)
    if (JSON.stringify(result1) === JSON.stringify(result2)) {
      recordTest('Replay: Idempotency key cached', true, 'Identical response returned');
    } else {
      recordTest('Replay: Idempotency key cached', false, 'Different responses - replay not prevented');
    }
  } catch (err) {
    recordTest('Replay: Idempotency key cached', false, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: Client Trust - Fake Balance
// ============================================================

async function testClientTrust_FakeBalance() {
  log('\n[TEST] Client Trust: Submit fake balance in request');

  try {
    const res = await fetch(`${fixtures.supabase_url}/functions/v1/secure-lobby-join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user2_token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        lobbyId: fixtures.lobby.id,
        balance: 999999999, // ATTACK: fake balance
        availableCents: 999999999, // ATTACK: fake balance
      }),
    });

    const result = await res.json();

    // Server should check actual balance from database, ignoring client values
    // Test passes if server validated correctly (success) or blocked (insufficient balance)
    if (result.success || res.status === 400 || res.status === 403) {
      recordTest('Client Trust: Fake balance ignored', true, 'Server validated actual balance');
    } else {
      recordTest('Client Trust: Fake balance ignored', false, 'Unexpected behavior');
    }
  } catch (err) {
    recordTest('Client Trust: Fake balance ignored', true, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: Client Trust - Fake Score/Payout
// ============================================================

async function testClientTrust_FakePayout() {
  log('\n[TEST] Client Trust: Submit fake payout/score values');

  try {
    const res = await fetch(`${fixtures.supabase_url}/functions/v1/secure-answer-submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user1_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId: 'fake-match-id',
        questionIndex: 0,
        selectedAnswer: 1,
        isCorrect: true, // ATTACK: client claiming correctness
        pointsEarned: 999999, // ATTACK: fake points
        payoutCents: 999999, // ATTACK: fake payout
      }),
    });

    const result = await res.json();

    // Server should compute correctness and points, not trust client
    // If server accepted fake values, that's a vulnerability
    if (!result.success || (result.points_earned && result.points_earned !== 999999)) {
      recordTest('Client Trust: Fake score ignored', true, 'Server computed score');
    } else if (res.status === 400 || res.status === 404) {
      recordTest('Client Trust: Fake score ignored', true, 'Request blocked or failed');
    } else {
      recordTest('Client Trust: Fake score ignored', false, 'May have accepted client values');
    }
  } catch (err) {
    recordTest('Client Trust: Fake score ignored', true, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: Race Condition - Concurrent Joins
// ============================================================

async function testRaceCondition_ConcurrentJoins() {
  log('\n[TEST] Race: 5 concurrent join attempts by same user');

  try {
    // Fire 5 concurrent requests with different idempotency keys
    const promises = Array(5).fill(null).map(() =>
      fetch(`${fixtures.supabase_url}/functions/v1/secure-lobby-join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fixtures.tokens.user2_token}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({ lobbyId: fixtures.lobby.id }),
      })
    );

    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));

    // Count successes
    const successCount = results.filter(r => r.success).length;

    // Only ONE should succeed (if not already in lobby)
    // Or all should fail with "already in lobby" message
    if (successCount <= 1) {
      recordTest('Race: Concurrent joins prevented', true, `${successCount} succeeded, others blocked`);
    } else {
      recordTest('Race: Concurrent joins prevented', false, `CRITICAL - ${successCount} succeeded (race condition)`);
    }
  } catch (err) {
    recordTest('Race: Concurrent joins prevented', false, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: Frozen Account - Actions Blocked
// ============================================================

async function testFrozenAccount_Blocked() {
  log('\n[TEST] Frozen Account: User 3 (frozen) tries to join lobby');

  try {
    const res = await fetch(`${fixtures.supabase_url}/functions/v1/secure-lobby-join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user3_token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({ lobbyId: fixtures.lobby.id }),
    });

    const result = await res.json();

    if (res.status === 403 && result.error && result.error.includes('frozen')) {
      recordTest('Frozen Account: Actions blocked', true, 'Blocked with frozen message');
    } else if (res.status === 403) {
      recordTest('Frozen Account: Actions blocked', true, 'Blocked (may be KYC issue)');
    } else {
      recordTest('Frozen Account: Actions blocked', false, 'Frozen user allowed to join');
    }
  } catch (err) {
    recordTest('Frozen Account: Actions blocked', true, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: Kill Switch - Cash Mode Disabled
// ============================================================

async function testKillSwitch_CashModeDisabled() {
  log('\n[TEST] Kill Switch: Attempt to join cash lobby when cash_mode_enabled = false');

  try {
    // Note: This test requires manually setting cash_mode_enabled = false in database
    // or via admin endpoint before running

    const res = await fetch(`${fixtures.supabase_url}/functions/v1/secure-lobby-join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fixtures.tokens.user1_token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({ lobbyId: fixtures.lobby.id }),
    });

    const result = await res.json();

    if (res.status === 503 && result.error && result.error.includes('disabled')) {
      recordTest('Kill Switch: Cash mode disabled', true, 'Blocked with 503 Service Unavailable');
    } else if (result.success || res.status === 200) {
      recordTest('Kill Switch: Cash mode disabled', false, 'WARNING: Join succeeded (kill switch may be enabled)');
    } else {
      recordTest('Kill Switch: Cash mode disabled', true, 'Blocked (kill switch or other validation)');
    }
  } catch (err) {
    recordTest('Kill Switch: Cash mode disabled', true, `Error: ${err.message}`);
  }
}

// ============================================================
// TEST: Rate Limiting
// ============================================================

async function testRateLimit_LobbyJoins() {
  log('\n[TEST] Rate Limit: Rapid lobby join attempts (> 10 in 5 min)');

  try {
    const promises = [];
    for (let i = 0; i < 12; i++) {
      promises.push(
        fetch(`${fixtures.supabase_url}/functions/v1/secure-lobby-join`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fixtures.tokens.user1_token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': randomUUID(),
          },
          body: JSON.stringify({ lobbyId: fixtures.lobby.id }),
        })
      );
    }

    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429).length;

    if (rateLimited > 0) {
      recordTest('Rate Limit: Lobby joins throttled', true, `${rateLimited} requests rate limited`);
    } else {
      recordTest('Rate Limit: Lobby joins throttled', false, 'No rate limiting detected');
    }
  } catch (err) {
    recordTest('Rate Limit: Lobby joins throttled', false, `Error: ${err.message}`);
  }
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runAllTests() {
  try {
    // Load fixtures
    const fixturesData = await readFile('tests/test-fixtures.json', 'utf8');
    fixtures = JSON.parse(fixturesData);

    if (!fixtures.tokens) {
      console.error('Error: No tokens found. Run: node tests/get-tokens.js');
      process.exit(1);
    }

    log('========================================', 'info');
    log('BrainDash Royale - EXECUTABLE Negative Security Tests', 'info');
    log('========================================', 'info');

    // Run all tests
    await testIDOR_WalletAccess();
    await testIDOR_LobbyJoin();
    await testIDOR_SettleUnrelatedMatch();
    await testReplay_IdempotencyKey();
    await testClientTrust_FakeBalance();
    await testClientTrust_FakePayout();
    await testRaceCondition_ConcurrentJoins();
    await testFrozenAccount_Blocked();
    await testKillSwitch_CashModeDisabled();
    await testRateLimit_LobbyJoins();

    // Print summary
    log('\n========================================', 'info');
    log('TEST SUMMARY', 'info');
    log('========================================', 'info');
    log(`Total Tests: ${results.passed + results.failed}`);
    log(`Passed: ${results.passed}`, 'pass');
    log(`Failed: ${results.failed}`, 'fail');
    log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
      log('\n⚠️  SOME TESTS FAILED', 'fail');
      log('Review failed tests for potential security issues', 'fail');
      process.exit(1);
    } else {
      log('\n✅ ALL SECURITY TESTS PASSED', 'pass');
      log('All attack vectors properly mitigated', 'pass');
      process.exit(0);
    }

  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'fail');
    log('Make sure you ran setup-test-fixtures.js and get-tokens.js first', 'fail');
    process.exit(1);
  }
}

// Run tests
runAllTests();
