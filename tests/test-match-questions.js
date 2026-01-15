/**
 * Test Script for Match Questions System
 *
 * This script demonstrates how to test the create-match-questions Edge Function
 * Run this from the command line after setting up your environment.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://uhhpldqfwkrulhlgkfhn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Test 1: Create questions for a new match
 */
async function testCreateMatchQuestions() {
  console.log('\n=== TEST 1: Create Match Questions ===\n');

  // Generate a test match ID
  const matchId = crypto.randomUUID();
  const category = 'Sports';
  const playerIds = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID()
  ];
  const mode = 'free';

  console.log('Match ID:', matchId);
  console.log('Category:', category);
  console.log('Players:', playerIds.length);
  console.log('Mode:', mode);

  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/create-match-questions`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        matchId,
        category,
        playerIds,
        mode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Request failed:', error);
      return null;
    }

    const result = await response.json();

    console.log('\n✅ Success!');
    console.log('Questions created:', result.questions.length);
    console.log('Cached:', result.cached);
    console.log('\nDifficulty distribution:');

    const difficulties = result.questions.reduce((acc, q) => {
      acc[q.question.difficulty] = (acc[q.question.difficulty] || 0) + 1;
      return acc;
    }, {});

    console.log('  Easy:', difficulties.easy || 0);
    console.log('  Medium:', difficulties.medium || 0);
    console.log('  Hard:', difficulties.hard || 0);

    console.log('\nFirst question:');
    console.log('  Round:', result.questions[0].roundNo);
    console.log('  Difficulty:', result.questions[0].question.difficulty);
    console.log('  Prompt:', result.questions[0].question.prompt.substring(0, 80) + '...');

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

/**
 * Test 2: Verify idempotency (calling twice returns cached result)
 */
async function testIdempotency(matchId, category, playerIds, mode) {
  console.log('\n=== TEST 2: Idempotency Check ===\n');

  console.log('Calling with same match ID again...');

  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/create-match-questions`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        matchId,
        category,
        playerIds,
        mode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Request failed:', error);
      return;
    }

    const result = await response.json();

    if (result.cached) {
      console.log('✅ Idempotency verified! Questions were returned from cache');
    } else {
      console.log('⚠️  Warning: Expected cached result but got fresh questions');
    }

    console.log('Questions returned:', result.questions.length);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test 3: Verify difficulty schedule
 */
async function testDifficultySchedule(questions) {
  console.log('\n=== TEST 3: Difficulty Schedule Verification ===\n');

  const expectedSchedule = [
    'easy', 'easy', 'easy', 'easy', 'easy',      // Q1-Q5
    'medium', 'medium', 'medium',                // Q6-Q8
    'hard', 'hard'                               // Q9-Q10
  ];

  let allCorrect = true;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const expected = expectedSchedule[i];
    const actual = question.question.difficulty;
    const match = expected === actual;

    if (!match) {
      allCorrect = false;
    }

    const status = match ? '✅' : '❌';
    console.log(`${status} Q${i + 1}: Expected ${expected}, Got ${actual}`);
  }

  if (allCorrect) {
    console.log('\n✅ All difficulties match the expected schedule!');
  } else {
    console.log('\n❌ Some difficulties do not match the schedule');
  }
}

/**
 * Test 4: Check for duplicate questions
 */
async function testNoDuplicates(questions) {
  console.log('\n=== TEST 4: Duplicate Check ===\n');

  const questionIds = questions.map(q => q.question.id);
  const uniqueIds = new Set(questionIds);

  if (questionIds.length === uniqueIds.size) {
    console.log('✅ No duplicate questions found');
    console.log(`   All ${questionIds.length} questions are unique`);
  } else {
    console.log('❌ Duplicate questions detected!');
    console.log(`   Total: ${questionIds.length}, Unique: ${uniqueIds.size}`);

    // Find duplicates
    const duplicates = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
    console.log('   Duplicate IDs:', duplicates);
  }
}

/**
 * Test 5: Invalid input handling
 */
async function testInvalidInputs() {
  console.log('\n=== TEST 5: Invalid Input Handling ===\n');

  const tests = [
    {
      name: 'Invalid category',
      body: {
        matchId: crypto.randomUUID(),
        category: 'InvalidCategory',
        playerIds: [crypto.randomUUID()],
        mode: 'free'
      },
      expectedError: 'Invalid category'
    },
    {
      name: 'Empty playerIds',
      body: {
        matchId: crypto.randomUUID(),
        category: 'Sports',
        playerIds: [],
        mode: 'free'
      },
      expectedError: 'non-empty array'
    },
    {
      name: 'Invalid mode',
      body: {
        matchId: crypto.randomUUID(),
        category: 'Sports',
        playerIds: [crypto.randomUUID()],
        mode: 'invalid'
      },
      expectedError: 'mode must be'
    }
  ];

  for (const test of tests) {
    try {
      const functionUrl = `${SUPABASE_URL}/functions/v1/create-match-questions`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(test.body)
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error.includes(test.expectedError)) {
          console.log(`✅ ${test.name}: Correctly rejected`);
        } else {
          console.log(`⚠️  ${test.name}: Rejected but unexpected error: ${error.error}`);
        }
      } else {
        console.log(`❌ ${test.name}: Should have been rejected but succeeded`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Unexpected error: ${error.message}`);
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Match Questions System - Test Suite      ║');
  console.log('╚════════════════════════════════════════════╝');

  // Test 1: Create questions
  const result = await testCreateMatchQuestions();

  if (result) {
    // Test 2: Idempotency
    await testIdempotency(
      result.matchId,
      result.category,
      ['player1', 'player2', 'player3'], // Use dummy IDs for test
      'free'
    );

    // Test 3: Difficulty schedule
    await testDifficultySchedule(result.questions);

    // Test 4: No duplicates
    await testNoDuplicates(result.questions);
  }

  // Test 5: Invalid inputs
  await testInvalidInputs();

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  Test Suite Complete                       ║');
  console.log('╚════════════════════════════════════════════╝\n');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testCreateMatchQuestions, testIdempotency, testDifficultySchedule, testNoDuplicates, testInvalidInputs };
