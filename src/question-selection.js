console.log('Question selection module loaded');

// Question pools by category
const questionPools = {
  math: { easy: [], medium: [], hard: [] },
  sports: { easy: [], medium: [], hard: [] },
  // Add more categories as JSON files become available
};

let usedQuestionIndices = new Set();

// Load all available question files
async function loadQuestions() {
  try {
    console.log('[Question Selection] Loading question files...');

    // Load math questions
    const [easyMathResponse, mediumMathResponse] = await Promise.all([
      fetch('/src/easy_math_500.json'),
      fetch('/src/medium_math_500.json')
    ]);

    questionPools.math.easy = await easyMathResponse.json();
    questionPools.math.medium = await mediumMathResponse.json();
    questionPools.math.hard = []; // No hard math yet

    console.log('[Question Selection] Loaded math questions:', {
      easy: questionPools.math.easy.length,
      medium: questionPools.math.medium.length,
      hard: questionPools.math.hard.length
    });

    // Load sports questions
    try {
      const sportsResponse = await fetch('/src/sports_easy_60.json');
      const sportsQuestions = await sportsResponse.json();

      // All sports questions are easy difficulty, use them for all difficulties
      questionPools.sports.easy = sportsQuestions;
      questionPools.sports.medium = sportsQuestions; // Reuse for medium
      questionPools.sports.hard = sportsQuestions;   // Reuse for hard

      console.log('[Question Selection] Loaded sports questions:', sportsQuestions.length);
    } catch (err) {
      console.warn('[Question Selection] Sports questions not available:', err);
    }

  } catch (error) {
    console.error('[Question Selection] Failed to load questions:', error);
  }
}

loadQuestions();

window.nextQuestion = async function({ categories = [], difficulty = null } = {}) {
  console.log('[Question Selection] === nextQuestion called ===');
  console.log('[Question Selection] categories:', categories);
  console.log('[Question Selection] difficulty:', difficulty);

  // Determine which category pool to use
  let categoryKey = null;

  if (Array.isArray(categories) && categories.length > 0) {
    // Use the first category from the array
    categoryKey = categories[0];
    console.log('[Question Selection] Using category from array:', categoryKey);
  }

  // Default to math if no category or category not found
  if (!categoryKey || !questionPools[categoryKey]) {
    console.log('[Question Selection] No valid category provided or category not found in pools');
    console.log('[Question Selection] Requested category:', categoryKey);
    console.log('[Question Selection] Available pools:', Object.keys(questionPools));
    console.log('[Question Selection] Defaulting to math');
    categoryKey = 'math';
  } else {
    console.log('[Question Selection] ✓ Valid category found:', categoryKey);
  }

  const categoryPool = questionPools[categoryKey];

  // Select difficulty pool
  let questionPool = categoryPool.medium;

  if (difficulty === 'easy') {
    questionPool = categoryPool.easy;
  } else if (difficulty === 'hard') {
    questionPool = categoryPool.hard.length > 0 ? categoryPool.hard : categoryPool.medium;
  } else if (difficulty === 'normal' || difficulty === 'medium') {
    questionPool = categoryPool.medium;
  }

  console.log('[Question Selection] Selected pool:', categoryKey, difficulty, 'size:', questionPool.length);

  if (questionPool.length === 0) {
    console.warn('[Question Selection] No questions available for category:', categoryKey, 'difficulty:', difficulty);
    return { question: null, done: true };
  }

  // Find an unused question
  let attempts = 0;
  let questionIndex = -1;
  const maxAttempts = questionPool.length * 2;

  while (attempts < maxAttempts) {
    questionIndex = Math.floor(Math.random() * questionPool.length);

    const key = `${categoryKey}-${difficulty}-${questionIndex}`;
    if (!usedQuestionIndices.has(key)) {
      break;
    }

    attempts++;
  }

  if (attempts >= maxAttempts) {
    console.log('[Question Selection] All questions used, clearing cache');
    usedQuestionIndices.clear();
    questionIndex = Math.floor(Math.random() * questionPool.length);
  }

  const key = `${categoryKey}-${difficulty}-${questionIndex}`;
  usedQuestionIndices.add(key);

  const rawQuestion = questionPool[questionIndex];

  const correctIndex = rawQuestion.options.indexOf(rawQuestion.answer) + 1;

  const question = {
    id: `${categoryKey}-${difficulty}-${questionIndex}`,
    prompt: rawQuestion.question,
    choices: rawQuestion.options,
    correct_index: correctIndex,
    time_limit_ms: difficulty === 'easy' ? 7000 : 10000,
    category: categoryKey,
    difficulty: rawQuestion.difficulty || difficulty || 'medium'
  };

  console.log('[Question Selection] === Returning question ===');
  console.log('[Question Selection] Question category:', question.category);
  console.log('[Question Selection] Question prompt:', question.prompt.substring(0, 50) + '...');

  return { question, done: false };
};

console.log('[Question Selection] window.nextQuestion registered');
