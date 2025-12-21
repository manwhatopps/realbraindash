// BrainDash Royale - Global Question Bank Registry
// Generates 300 Easy (7s), 300 Medium (10s), 300 Hard (10s) questions per category

// === Global registry for ALL categories ===
// Each key -> { easy: Question[], medium: Question[], hard: Question[] }
window.__QBANKS__ = window.__QBANKS__ || {};

// Register a builder for a category (call from your category modules)
function registerBankBuilder(categoryKey, builderFn) {
  // builderFn must return { easy, medium, hard }
  window.__QBANKS__.__builders = window.__QBANKS__.__builders || {};
  window.__QBANKS__.__builders[categoryKey] = builderFn;
}

// Build (once) and cache a bank for a category
function getOrBuildBank(categoryKey, seedStr = 'royale-default-seed') {
  if (!window.__QBANKS__[categoryKey]) {
    const builders = window.__QBANKS__.__builders || {};
    const build = builders[categoryKey];
    if (typeof build !== 'function') {
      // No local builder registered — return empty sets (your online fetch can fill later)
      return (window.__QBANKS__[categoryKey] = { easy: [], medium: [], hard: [] });
    }
    window.__QBANKS__[categoryKey] = build(seedStr);
  }
  return window.__QBANKS__[categoryKey];
}

// -------------------- RNG (deterministic) --------------------
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffleInPlace(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function distinct(a, b, c, d) {
  return new Set([String(a), String(b), String(c), String(d)]).size === 4;
}

function clampLen(s, n = 120) {
  return s.length <= n ? s : s.slice(0, n - 1);
}

function gcd(a, b) {
  while (b) {
    [a, b] = [b, a % b];
  }
  return Math.abs(a);
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function xorshift32Seed(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  return h >>> 0;
}

const TIME_LIMIT_MS = { Easy: 7000, Medium: 10000, Hard: 15000 };

// -------------------- Option Generators --------------------
function makeOptions(rng, correct, deltas = [-2, -1, 1, 2], noNeg = true, noZero = false) {
  const opts = new Set([String(correct)]);
  const attempt = () => {
    const delta = pick(rng, deltas);
    let v = correct + delta;
    if (noNeg && v < 0) v = correct + Math.abs(delta);
    if (noZero && v === 0) v += 1;
    return v;
  };
  let attempts = 0;
  while (opts.size < 4 && attempts < 100) {
    attempts++;
    const v = attempt();
    if (!opts.has(String(v))) opts.add(String(v));
  }
  while (opts.size < 4) {
    const fallback = correct + seededInt(rng, -50, 50);
    if (fallback !== correct && !opts.has(String(fallback))) {
      opts.add(String(fallback));
    }
  }
  const arr = Array.from(opts).map(x => Number.isNaN(Number(x)) ? x : Number(x));
  shuffleInPlace(rng, arr);
  const correctIndex = arr.findIndex(x => String(x) === String(correct));
  return { arr, correctLetter: ['A', 'B', 'C', 'D'][correctIndex] };
}

function makeStringRatioOptions(rng, correct, deltas) {
  const [a, b] = correct.split(':').map(Number);
  const opts = new Set([correct]);
  const attempt = () => {
    const which = pick(rng, ['left', 'right']);
    const d = pick(rng, deltas);
    const na = which === 'left' ? Math.max(1, a + d) : a;
    const nb = which === 'right' ? Math.max(1, b + d) : b;
    return `${na}:${nb}`;
  };
  let attempts = 0;
  while (opts.size < 4 && attempts < 50) {
    attempts++;
    const v = attempt();
    if (!opts.has(v)) opts.add(v);
  }
  while (opts.size < 4) {
    opts.add(`${a + seededInt(rng, -3, 3)}:${b}`);
  }
  const arr = Array.from(opts);
  shuffleInPlace(rng, arr);
  const correctIndex = arr.findIndex(v => v === correct);
  return { arr, correctLetter: ['A', 'B', 'C', 'D'][correctIndex] };
}

function fracOptions(rng, correct, total) {
  const opts = new Set([correct]);
  const attempt = () => {
    const n = Math.max(2, total + pick(rng, [-2, -1, 1, 2]));
    return `1/${n}`;
  };
  let attempts = 0;
  while (opts.size < 4 && attempts < 50) {
    attempts++;
    const v = attempt();
    if (!opts.has(v)) opts.add(v);
  }
  while (opts.size < 4) {
    opts.add(`1/${Math.max(2, total + seededInt(rng, -5, 5))}`);
  }
  const arr = Array.from(opts);
  shuffleInPlace(rng, arr);
  const correctIndex = arr.findIndex(v => v === correct);
  return { arr, correctLetter: ['A', 'B', 'C', 'D'][correctIndex] };
}

// -------------------- Question Generators --------------------
async function loadEasyMathQuestions() {
  try {
    const response = await fetch('/src/easy_math_500.json');
    const questions = await response.json();
    return questions;
  } catch (error) {
    console.error('Failed to load easy math questions:', error);
    return [];
  }
}

function genEasy(rng, category) {
  const staticQuestions = window.__STATIC_EASY_MATH__ || [];

  if (staticQuestions.length === 0) {
    console.warn('No static easy math questions loaded, returning empty array');
    return [];
  }

  const items = staticQuestions.map((q, idx) => {
    const answerIndex = q.options.findIndex(opt => opt === q.answer);
    const correctLetter = ['A', 'B', 'C', 'D'][answerIndex];

    return {
      category,
      difficulty: 'Easy',
      question: q.question,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      option_d: q.options[3],
      correct_option: correctLetter,
      time_limit_ms: TIME_LIMIT_MS.Easy
    };
  });

  return items;
}

function genMedium(rng, category) {
  const staticQuestions = window.__STATIC_MEDIUM_MATH__ || [];

  if (staticQuestions.length === 0) {
    console.warn('No static medium math questions loaded, returning empty array');
    return [];
  }

  const items = staticQuestions.map((q, idx) => {
    const answerIndex = q.options.findIndex(opt => opt === q.answer);
    const correctLetter = ['A', 'B', 'C', 'D'][answerIndex];

    return {
      category,
      difficulty: 'Medium',
      question: q.question,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      option_d: q.options[3],
      correct_option: correctLetter,
      time_limit_ms: TIME_LIMIT_MS.Medium
    };
  });

  return items;
}

function genHard(rng, category) {
  const items = [];
  const seen = new Set();

  const builders = [
    () => {
      const a = seededInt(rng, 2, 12), b = seededInt(rng, 2, 12), c = seededInt(rng, 2, 12);
      const ans = a * b - c;
      return { q: `${a} × ${b} − ${c} = ?`, ans };
    },
    () => {
      const a = seededInt(rng, 3, 20), b = seededInt(rng, 3, 20), c = seededInt(rng, 2, 9), d = seededInt(rng, 1, 20);
      const ans = (a + b) * c - d;
      return { q: `(${a} + ${b}) × ${c} − ${d} = ?`, ans };
    },
    () => {
      const x = seededInt(rng, 6, 20), y = seededInt(rng, 2, 5);
      const A = x + y, B = x - y;
      const ans = A * A - B * B;
      return { q: `${A}² − ${B}² = ?`, ans };
    },
    () => {
      const total = seededInt(rng, 4, 12);
      const ans = `1/${total}`;
      const { arr, correctLetter } = fracOptions(rng, ans, total);
      return { q: `Bag: ${total - 1} red, 1 blue. P(blue) = ?`, ans, optionsOverride: { arr, correctLetter } };
    },
    () => {
      const base = pick(rng, [30, 35, 40, 45, 50, 55, 60, 65]);
      const which = pick(rng, ['comp', 'supp']);
      const ans = which === 'comp' ? 90 - base : 180 - base;
      return { q: which === 'comp' ? `Complement of ${base}° = ?` : `Supplement of ${base}° = ?`, ans };
    },
    () => {
      const a = seededInt(rng, 3, 12), b = seededInt(rng, 3, 12);
      const ans = lcm(a, b);
      return { q: `LCM(${a}, ${b}) = ?`, ans };
    },
    () => {
      const a = seededInt(rng, 8, 50), b = seededInt(rng, 8, 50);
      const ans = gcd(a, b);
      return { q: `GCD(${a}, ${b}) = ?`, ans };
    },
    () => {
      const k = seededInt(rng, 5, 30), m = seededInt(rng, 35, 80);
      const ans = m - k;
      return { q: `If x + ${k} = ${m}, x = ?`, ans };
    },
    () => {
      const a = seededInt(rng, 2, 12), x = seededInt(rng, 3, 15);
      const b = a * x;
      return { q: `If ${a}x = ${b}, x = ?`, ans: x };
    },
  ];

  let attempts = 0;
  while (items.length < 300 && attempts < 5000) {
    attempts++;
    const r = pick(rng, builders)();
    const key = `${r.q}|${r.ans}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (r.optionsOverride) {
      const [A, B, C, D] = r.optionsOverride.arr.map(String);
      items.push({
        category,
        difficulty: 'Hard',
        question: clampLen(r.q),
        option_a: A,
        option_b: B,
        option_c: C,
        option_d: D,
        correct_option: r.optionsOverride.correctLetter,
        time_limit_ms: TIME_LIMIT_MS.Hard
      });
      continue;
    }

    const { arr, correctLetter } = makeOptions(rng, r.ans, [-30, -15, -5, -1, 1, 5, 15, 30], true, false);
    if (!distinct(arr[0], arr[1], arr[2], arr[3])) continue;

    const [A, B, C, D] = arr.map(String);
    items.push({
      category,
      difficulty: 'Hard',
      question: clampLen(r.q),
      option_a: A,
      option_b: B,
      option_c: C,
      option_d: D,
      correct_option: correctLetter,
      time_limit_ms: TIME_LIMIT_MS.Hard
    });
  }
  return items;
}

// -------------------- Main API --------------------
export function buildMathBank(seedStr = 'math-royale-v1') {
  const cat = 'Math';
  const seed = xorshift32Seed(seedStr);
  const easy = genEasy(mulberry32(seed ^ 0xA5A5), cat);
  const medium = genMedium(mulberry32(seed ^ 0x5A5A), cat);
  const hard = genHard(mulberry32(seed ^ 0xC3C3), cat);
  return { easy, medium, hard };
}

// Generic offline loader (works for ANY category)
export async function getQuestionsOffline(cfg) {
  // cfg: { categories: string[] (>=1), difficulty: 'Easy'|'Medium'|'Hard', numQuestions, seed }
  // For multi-category selection, we concatenate pools from all chosen categories
  const pools = [];
  const seed = xorshift32Seed(cfg.seed || 'friend-seed');
  const rng = mulberry32(seed);

  for (const cat of cfg.categories) {
    const bank = getOrBuildBank(cat.toLowerCase(), 'royale-default-seed');
    const pool = (cfg.difficulty === 'Easy' ? bank.easy :
                 cfg.difficulty === 'Medium' ? bank.medium : bank.hard)
                 // Guarantee timer on each item (in case a bank lacks it)
                 .map(q => ({ ...q, time_limit_ms: TIME_LIMIT_MS[cfg.difficulty] }));
    pools.push(...pool);
  }

  // If no local banks exist for some categories, pools could be empty
  const merged = pools.slice();
  shuffleInPlace(rng, merged);
  return merged.slice(0, cfg.numQuestions);
}

// Legacy export for backwards compatibility
export async function getMathQuestionsOffline(cfg) {
  return getQuestionsOffline({ ...cfg, categories: ['math'] });
}

// Initialize static easy math questions
(async () => {
  try {
    const response = await fetch('/src/easy_math_500.json');
    const questions = await response.json();
    window.__STATIC_EASY_MATH__ = questions;
    console.log(`Loaded ${questions.length} static easy math questions`);
  } catch (error) {
    console.error('Failed to load easy math questions:', error);
    window.__STATIC_EASY_MATH__ = [];
  }
})();

// Initialize static medium math questions
(async () => {
  try {
    const response = await fetch('/src/medium_math_500.json');
    const questions = await response.json();
    window.__STATIC_MEDIUM_MATH__ = questions;
    console.log(`Loaded ${questions.length} static medium math questions`);
  } catch (error) {
    console.error('Failed to load medium math questions:', error);
    window.__STATIC_MEDIUM_MATH__ = [];
  }
})();

// Register Math builder
registerBankBuilder('math', (seed) => buildMathBank(seed));

// Export registry functions for use by other modules
export { registerBankBuilder, getOrBuildBank };
