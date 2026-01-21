/**
 * Seed Politics Intro Pack - 30 Curated Questions
 *
 * This script seeds the public.questions table with 30 curated
 * politics questions for the intro progression system.
 *
 * Run this server-side only.
 */

import { createClient } from '@supabase/supabase-js';

const POLITICS_INTRO_QUESTIONS = [
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Who was the first President of the United States?',
    correct_answer: 'George Washington',
    incorrect_answers: ['Thomas Jefferson', 'John Adams', 'Benjamin Franklin']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'How many branches are there in the U.S. government?',
    correct_answer: 'Three',
    incorrect_answers: ['Two', 'Four', 'Five']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the capital of the United States?',
    correct_answer: 'Washington, D.C.',
    incorrect_answers: ['New York City', 'Philadelphia', 'Boston']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Which document begins with "We the People"?',
    correct_answer: 'The U.S. Constitution',
    incorrect_answers: ['The Declaration of Independence', 'The Bill of Rights', 'The Federalist Papers']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'How many U.S. Senators does each state have?',
    correct_answer: 'Two',
    incorrect_answers: ['One', 'Three', 'It varies by population']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the minimum age to become President of the United States?',
    correct_answer: '35',
    incorrect_answers: ['30', '40', '45']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Which amendment gave women the right to vote?',
    correct_answer: '19th Amendment',
    incorrect_answers: ['15th Amendment', '21st Amendment', '13th Amendment']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'How many years is a U.S. Presidential term?',
    correct_answer: 'Four',
    incorrect_answers: ['Two', 'Six', 'Eight']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the name of the President\'s official residence?',
    correct_answer: 'The White House',
    incorrect_answers: ['The Capitol Building', 'Camp David', 'Blair House']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Who is the Commander in Chief of the U.S. military?',
    correct_answer: 'The President',
    incorrect_answers: ['The Secretary of Defense', 'The Chairman of the Joint Chiefs', 'The Vice President']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What are the first ten amendments to the Constitution called?',
    correct_answer: 'The Bill of Rights',
    incorrect_answers: ['The Federalist Papers', 'The Articles of Confederation', 'The Declaration of Rights']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'How many justices serve on the U.S. Supreme Court?',
    correct_answer: 'Nine',
    incorrect_answers: ['Seven', 'Eleven', 'Twelve']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What year was the Declaration of Independence signed?',
    correct_answer: '1776',
    incorrect_answers: ['1775', '1783', '1787']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Which political party is represented by a donkey?',
    correct_answer: 'Democratic Party',
    incorrect_answers: ['Republican Party', 'Independent Party', 'Green Party']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Which political party is represented by an elephant?',
    correct_answer: 'Republican Party',
    incorrect_answers: ['Democratic Party', 'Libertarian Party', 'Constitution Party']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'How many total members are in the U.S. House of Representatives?',
    correct_answer: '435',
    incorrect_answers: ['100', '535', '350']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Who becomes President if both the President and Vice President can no longer serve?',
    correct_answer: 'Speaker of the House',
    incorrect_answers: ['Secretary of State', 'President Pro Tempore of the Senate', 'Chief Justice']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the supreme law of the land in the United States?',
    correct_answer: 'The Constitution',
    incorrect_answers: ['The Declaration of Independence', 'Federal Law', 'Executive Orders']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'How many times can a President be elected?',
    correct_answer: 'Twice',
    incorrect_answers: ['Once', 'Three times', 'No limit']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the length of a U.S. Senator\'s term?',
    correct_answer: 'Six years',
    incorrect_answers: ['Four years', 'Two years', 'Eight years']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Which amendment abolished slavery?',
    correct_answer: '13th Amendment',
    incorrect_answers: ['14th Amendment', '15th Amendment', '16th Amendment']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the length of a U.S. House Representative\'s term?',
    correct_answer: 'Two years',
    incorrect_answers: ['Four years', 'Six years', 'One year']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Who presides over the U.S. Senate?',
    correct_answer: 'The Vice President',
    incorrect_answers: ['The President', 'The Speaker of the House', 'The Chief Justice']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the highest court in the United States?',
    correct_answer: 'The Supreme Court',
    incorrect_answers: ['The Court of Appeals', 'The District Court', 'The Circuit Court']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Which amendment guarantees freedom of speech?',
    correct_answer: 'First Amendment',
    incorrect_answers: ['Second Amendment', 'Fifth Amendment', 'Fourth Amendment']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What month are U.S. Presidential elections held?',
    correct_answer: 'November',
    incorrect_answers: ['October', 'December', 'January']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Who has the power to veto bills?',
    correct_answer: 'The President',
    incorrect_answers: ['The Vice President', 'The Supreme Court', 'The Senate Majority Leader']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the total number of U.S. Senators?',
    correct_answer: '100',
    incorrect_answers: ['50', '435', '535']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'Which body of Congress has the power to impeach the President?',
    correct_answer: 'House of Representatives',
    incorrect_answers: ['Senate', 'Supreme Court', 'Cabinet']
  },
  {
    category: 'politics',
    difficulty: 'easy',
    question: 'What is the minimum voting age in the United States?',
    correct_answer: '18',
    incorrect_answers: ['21', '16', '25']
  }
];

async function seedPoliticsIntro() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Starting Politics Intro seed...');
  console.log(`Total questions to seed: ${POLITICS_INTRO_QUESTIONS.length}`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const q of POLITICS_INTRO_QUESTIONS) {
    // Check if question already exists
    const { data: existing } = await supabase
      .from('questions')
      .select('id')
      .eq('question', q.question)
      .maybeSingle();

    if (existing) {
      skipCount++;
      continue;
    }

    // Insert question
    const { error } = await supabase
      .from('questions')
      .insert({
        category: q.category,
        difficulty: q.difficulty,
        question: q.question,
        correct_answer: q.correct_answer,
        incorrect_answers: q.incorrect_answers,
        is_intro: true,
        intro_pack: 'politics_intro_v1'
      });

    if (error) {
      console.error(`Error inserting question: ${q.question}`, error);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log('\n=== Seed Summary ===');
  console.log(`✅ Successfully inserted: ${successCount}`);
  console.log(`⏭️  Skipped (already exists): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('\nPolitics Intro pack ready!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPoliticsIntro()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

export { seedPoliticsIntro, POLITICS_INTRO_QUESTIONS };
