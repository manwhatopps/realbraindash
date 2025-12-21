/**
 * === NEW CATEGORY-BASED QUESTION BANK ===
 *
 * This is the SINGLE SOURCE OF TRUTH for all trivia questions.
 * Used by Free Play, Cash Challenge, and Test Cash Challenge.
 *
 * NO OTHER QUESTION GENERATOR SHOULD BE USED.
 */

console.log('[Questions] Loading new category-based question bank...');

// === CATEGORY-BASED QUESTION BANK ===
const QUESTION_BANK = {
  sports: [
    {
      question: "Which country won the FIFA World Cup in 2018?",
      choices: ["Brazil", "Germany", "France", "Argentina"],
      correctIndex: 2
    },
    {
      question: "In basketball, how many points is a free throw worth?",
      choices: ["1", "2", "3", "4"],
      correctIndex: 0
    },
    {
      question: "Which NBA legend is known as 'His Airness'?",
      choices: ["Kobe Bryant", "LeBron James", "Michael Jordan", "Magic Johnson"],
      correctIndex: 2
    },
    {
      question: "How many players are on a soccer team on the field?",
      choices: ["9", "10", "11", "12"],
      correctIndex: 2
    },
    {
      question: "Which sport uses a puck instead of a ball?",
      choices: ["Soccer", "Hockey", "Basketball", "Tennis"],
      correctIndex: 1
    },
    {
      question: "In which sport would you perform a slam dunk?",
      choices: ["Volleyball", "Basketball", "Tennis", "Baseball"],
      correctIndex: 1
    },
    {
      question: "How many Grand Slam tournaments are there in tennis?",
      choices: ["2", "3", "4", "5"],
      correctIndex: 2
    },
    {
      question: "Which country hosted the 2016 Summer Olympics?",
      choices: ["China", "Brazil", "UK", "Russia"],
      correctIndex: 1
    },
    {
      question: "What color card does a referee show for a serious foul in soccer?",
      choices: ["Yellow", "Red", "Green", "Blue"],
      correctIndex: 1
    },
    {
      question: "How many points is a touchdown worth in American football?",
      choices: ["3", "6", "7", "10"],
      correctIndex: 1
    }
  ],

  politics: [
    {
      question: "What is the primary purpose of a constitution?",
      choices: [
        "To list all citizens",
        "To establish the framework of government",
        "To set tax rates",
        "To choose political parties"
      ],
      correctIndex: 1
    },
    {
      question: "Which branch of government interprets laws?",
      choices: ["Executive", "Legislative", "Judicial", "Military"],
      correctIndex: 2
    },
    {
      question: "How many senators does each U.S. state have?",
      choices: ["1", "2", "4", "Varies by population"],
      correctIndex: 1
    },
    {
      question: "What is the term length for a U.S. President?",
      choices: ["2 years", "4 years", "6 years", "8 years"],
      correctIndex: 1
    },
    {
      question: "Which document begins with 'We the People'?",
      choices: ["Declaration of Independence", "Bill of Rights", "U.S. Constitution", "Magna Carta"],
      correctIndex: 2
    },
    {
      question: "What is the minimum age to be U.S. President?",
      choices: ["30", "35", "40", "45"],
      correctIndex: 1
    },
    {
      question: "How many branches are in the U.S. government?",
      choices: ["2", "3", "4", "5"],
      correctIndex: 1
    },
    {
      question: "What is the capital of the United States?",
      choices: ["New York", "Washington D.C.", "Philadelphia", "Boston"],
      correctIndex: 1
    },
    {
      question: "Who is the commander-in-chief of the U.S. military?",
      choices: ["Secretary of Defense", "Chairman of Joint Chiefs", "The President", "Speaker of the House"],
      correctIndex: 2
    },
    {
      question: "How many justices sit on the U.S. Supreme Court?",
      choices: ["7", "9", "11", "13"],
      correctIndex: 1
    }
  ],

  business: [
    {
      question: "What does ROI stand for in business?",
      choices: [
        "Rate of Interest",
        "Return on Investment",
        "Revenue on Income",
        "Risk of Increase"
      ],
      correctIndex: 1
    },
    {
      question: "What is the primary goal of a for-profit business?",
      choices: ["Hiring employees", "Generating profit", "Filing taxes", "Building offices"],
      correctIndex: 1
    },
    {
      question: "What does CEO stand for?",
      choices: [
        "Central Executive Officer",
        "Chief Executive Officer",
        "Corporate Enterprise Officer",
        "Company Equity Officer"
      ],
      correctIndex: 1
    },
    {
      question: "What is a stock dividend?",
      choices: [
        "A tax on stocks",
        "A payment to shareholders",
        "A stock price increase",
        "A company merger"
      ],
      correctIndex: 1
    },
    {
      question: "What does IPO stand for?",
      choices: [
        "Initial Public Offering",
        "Internal Profit Operation",
        "Investment Portfolio Option",
        "International Price Order"
      ],
      correctIndex: 0
    },
    {
      question: "What is GDP?",
      choices: [
        "Government Development Plan",
        "Gross Domestic Product",
        "Global Distribution Program",
        "General Data Protection"
      ],
      correctIndex: 1
    },
    {
      question: "What is inflation?",
      choices: [
        "Increase in prices over time",
        "Decrease in prices over time",
        "Stable prices",
        "Government spending"
      ],
      correctIndex: 0
    },
    {
      question: "What is a monopoly?",
      choices: [
        "Many small competitors",
        "One dominant seller",
        "Government ownership",
        "No sellers"
      ],
      correctIndex: 1
    },
    {
      question: "What does LLC stand for?",
      choices: [
        "Limited Liability Company",
        "Large Local Corporation",
        "Legal License Contract",
        "Long-term Loan Credit"
      ],
      correctIndex: 0
    },
    {
      question: "What is supply and demand?",
      choices: [
        "A pricing theory",
        "A tax system",
        "A trade agreement",
        "A stock market"
      ],
      correctIndex: 0
    }
  ],

  music: [
    {
      question: "Which artist is known as the 'King of Pop'?",
      choices: ["Prince", "Elvis Presley", "Michael Jackson", "Freddie Mercury"],
      correctIndex: 2
    },
    {
      question: "Which band sang 'Bohemian Rhapsody'?",
      choices: ["The Beatles", "Led Zeppelin", "Queen", "Pink Floyd"],
      correctIndex: 2
    },
    {
      question: "Who is known as the 'Queen of Soul'?",
      choices: ["Whitney Houston", "Aretha Franklin", "Diana Ross", "Tina Turner"],
      correctIndex: 1
    },
    {
      question: "Which instrument has 88 keys?",
      choices: ["Guitar", "Violin", "Piano", "Organ"],
      correctIndex: 2
    },
    {
      question: "What genre is Bob Marley associated with?",
      choices: ["Jazz", "Reggae", "Blues", "Rock"],
      correctIndex: 1
    },
    {
      question: "Which rapper's real name is Marshall Mathers?",
      choices: ["Dr. Dre", "Snoop Dogg", "Eminem", "50 Cent"],
      correctIndex: 2
    },
    {
      question: "What is the highest female singing voice?",
      choices: ["Alto", "Soprano", "Mezzo", "Contralto"],
      correctIndex: 1
    },
    {
      question: "Which band had a hit with 'Stairway to Heaven'?",
      choices: ["The Rolling Stones", "Led Zeppelin", "The Who", "Aerosmith"],
      correctIndex: 1
    },
    {
      question: "What nationality is classical composer Mozart?",
      choices: ["German", "Italian", "Austrian", "French"],
      correctIndex: 2
    },
    {
      question: "Which instrument is Jimi Hendrix famous for playing?",
      choices: ["Drums", "Piano", "Guitar", "Saxophone"],
      correctIndex: 2
    }
  ],

  movies: [
    {
      question: "Which movie features the quote, 'I'll be back'?",
      choices: ["Die Hard", "The Terminator", "RoboCop", "Predator"],
      correctIndex: 1
    },
    {
      question: "Who directed 'Jurassic Park'?",
      choices: ["George Lucas", "James Cameron", "Steven Spielberg", "Ridley Scott"],
      correctIndex: 2
    },
    {
      question: "What is the highest-grossing film of all time (adjusted for inflation)?",
      choices: ["Titanic", "Avatar", "Gone with the Wind", "Star Wars"],
      correctIndex: 2
    },
    {
      question: "Which movie won Best Picture at the 2020 Oscars?",
      choices: ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"],
      correctIndex: 2
    },
    {
      question: "Who played Iron Man in the Marvel Cinematic Universe?",
      choices: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"],
      correctIndex: 2
    },
    {
      question: "What year was the first 'Star Wars' movie released?",
      choices: ["1975", "1977", "1980", "1983"],
      correctIndex: 1
    },
    {
      question: "Which actor played Jack in 'Titanic'?",
      choices: ["Brad Pitt", "Leonardo DiCaprio", "Tom Cruise", "Johnny Depp"],
      correctIndex: 1
    },
    {
      question: "What is the name of the hobbit played by Elijah Wood?",
      choices: ["Bilbo", "Frodo", "Sam", "Pippin"],
      correctIndex: 1
    },
    {
      question: "Which movie features a character named Forrest Gump?",
      choices: ["Forrest Gump", "Rain Man", "Philadelphia", "Cast Away"],
      correctIndex: 0
    },
    {
      question: "Who directed 'The Dark Knight'?",
      choices: ["Zack Snyder", "Christopher Nolan", "Tim Burton", "Sam Raimi"],
      correctIndex: 1
    }
  ],

  history: [
    {
      question: "In which year did World War II end?",
      choices: ["1942", "1945", "1948", "1950"],
      correctIndex: 1
    },
    {
      question: "Who was the first President of the United States?",
      choices: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"],
      correctIndex: 1
    },
    {
      question: "What year did the Berlin Wall fall?",
      choices: ["1987", "1989", "1991", "1993"],
      correctIndex: 1
    },
    {
      question: "Which civilization built the pyramids?",
      choices: ["Romans", "Greeks", "Egyptians", "Mayans"],
      correctIndex: 2
    },
    {
      question: "What year did Christopher Columbus reach the Americas?",
      choices: ["1492", "1500", "1520", "1450"],
      correctIndex: 0
    },
    {
      question: "Who was the first person to walk on the moon?",
      choices: ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Yuri Gagarin"],
      correctIndex: 1
    },
    {
      question: "In what year did the United States declare independence?",
      choices: ["1774", "1776", "1778", "1780"],
      correctIndex: 1
    },
    {
      question: "Who wrote the Declaration of Independence?",
      choices: ["George Washington", "Benjamin Franklin", "Thomas Jefferson", "John Adams"],
      correctIndex: 2
    },
    {
      question: "What was the name of the ship that brought the Pilgrims to America?",
      choices: ["Santa Maria", "Mayflower", "Nina", "Pinta"],
      correctIndex: 1
    },
    {
      question: "Which war was fought between the North and South in the United States?",
      choices: ["Revolutionary War", "Civil War", "War of 1812", "Spanish-American War"],
      correctIndex: 1
    }
  ],

  geography: [
    {
      question: "What is the largest ocean on Earth?",
      choices: ["Atlantic Ocean", "Pacific Ocean", "Indian Ocean", "Arctic Ocean"],
      correctIndex: 1
    },
    {
      question: "What is the capital of France?",
      choices: ["London", "Paris", "Berlin", "Rome"],
      correctIndex: 1
    },
    {
      question: "Which continent is the largest by area?",
      choices: ["Africa", "North America", "Asia", "Europe"],
      correctIndex: 2
    },
    {
      question: "What is the longest river in the world?",
      choices: ["Amazon", "Nile", "Mississippi", "Yangtze"],
      correctIndex: 1
    },
    {
      question: "Which country has the most time zones?",
      choices: ["Russia", "USA", "China", "France"],
      correctIndex: 3
    },
    {
      question: "What is the smallest country in the world?",
      choices: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
      correctIndex: 1
    },
    {
      question: "Mount Everest is located in which mountain range?",
      choices: ["Andes", "Alps", "Himalayas", "Rockies"],
      correctIndex: 2
    },
    {
      question: "Which desert is the largest hot desert in the world?",
      choices: ["Gobi", "Kalahari", "Sahara", "Arabian"],
      correctIndex: 2
    },
    {
      question: "What is the capital of Japan?",
      choices: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
      correctIndex: 2
    },
    {
      question: "Which U.S. state is the largest by area?",
      choices: ["Texas", "California", "Alaska", "Montana"],
      correctIndex: 2
    }
  ],

  science: [
    {
      question: "What is the chemical symbol for water?",
      choices: ["O2", "H2O", "CO2", "HO"],
      correctIndex: 1
    },
    {
      question: "What planet is known as the Red Planet?",
      choices: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1
    },
    {
      question: "What is the speed of light?",
      choices: ["186,000 mph", "186,000 km/s", "300,000 km/s", "300,000 mph"],
      correctIndex: 2
    },
    {
      question: "What is the powerhouse of the cell?",
      choices: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
      correctIndex: 1
    },
    {
      question: "How many bones are in the adult human body?",
      choices: ["186", "206", "226", "246"],
      correctIndex: 1
    },
    {
      question: "What is the largest planet in our solar system?",
      choices: ["Saturn", "Jupiter", "Neptune", "Uranus"],
      correctIndex: 1
    },
    {
      question: "What gas do plants absorb from the atmosphere?",
      choices: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      correctIndex: 2
    },
    {
      question: "What is the hardest natural substance on Earth?",
      choices: ["Gold", "Iron", "Diamond", "Titanium"],
      correctIndex: 2
    },
    {
      question: "What type of animal is a dolphin?",
      choices: ["Fish", "Mammal", "Reptile", "Amphibian"],
      correctIndex: 1
    },
    {
      question: "What is the freezing point of water in Celsius?",
      choices: ["-10°C", "0°C", "10°C", "32°C"],
      correctIndex: 1
    }
  ],

  pop_culture: [
    {
      question: "Which social media platform is known for short 15-60 second videos?",
      choices: ["Instagram", "Facebook", "TikTok", "Twitter"],
      correctIndex: 2
    },
    {
      question: "Who is known as 'The Rock' in entertainment?",
      choices: ["Vin Diesel", "John Cena", "Dwayne Johnson", "Jason Statham"],
      correctIndex: 2
    },
    {
      question: "Which TV show features the character Walter White?",
      choices: ["The Wire", "Breaking Bad", "Mad Men", "The Sopranos"],
      correctIndex: 1
    },
    {
      question: "What year did the first iPhone release?",
      choices: ["2005", "2007", "2009", "2011"],
      correctIndex: 1
    },
    {
      question: "Which streaming service created 'Stranger Things'?",
      choices: ["Hulu", "Amazon Prime", "Netflix", "Disney+"],
      correctIndex: 2
    },
    {
      question: "Who won the first season of American Idol?",
      choices: ["Carrie Underwood", "Kelly Clarkson", "Ruben Studdard", "Fantasia"],
      correctIndex: 1
    },
    {
      question: "What is the name of the coffee shop in 'Friends'?",
      choices: ["Central Perk", "Starbucks", "Coffee House", "Cafe Latte"],
      correctIndex: 0
    },
    {
      question: "Which Marvel movie was the first in the MCU?",
      choices: ["Captain America", "Thor", "Iron Man", "Hulk"],
      correctIndex: 2
    },
    {
      question: "What is the highest-grossing video game franchise?",
      choices: ["Call of Duty", "Grand Theft Auto", "Mario", "Pokemon"],
      correctIndex: 3
    },
    {
      question: "Which singer's real name is Stefani Germanotta?",
      choices: ["Madonna", "Lady Gaga", "Katy Perry", "Rihanna"],
      correctIndex: 1
    }
  ],

  mixed: [
    // Mixed pool will be auto-generated from all categories if needed
  ]
};

// === CANONICAL BRAINDASH CATEGORIES ===
// Single source of truth for ALL modes: Free Play, Cash Challenge, Test Cash Challenge
// label = what we show to users
// key   = internal key used by the question system / AI / QUESTION_BANK
const TRIVIA_CATEGORIES = [
  { label: "Sports", key: "sports", icon: "🏈" },
  { label: "Politics", key: "politics", icon: "🏛️" },
  { label: "Business & Economics", key: "business", icon: "💼" },
  { label: "Music", key: "music", icon: "🎵" },
  { label: "Movies", key: "movies", icon: "🎬" },
  { label: "History", key: "history", icon: "📜" },
  { label: "Geography", key: "geography", icon: "🗺️" },
  { label: "Science", key: "science", icon: "🔬" },
  { label: "Pop Culture", key: "pop_culture", icon: "🎭" },
  { label: "Mixed", key: "mixed", icon: "🎲" }
];

// === CATEGORY MAP: LABEL → KEY ===
// UI label -> internal key in QUESTION_BANK
const TRIVIA_CATEGORY_MAP = TRIVIA_CATEGORIES.reduce((map, c) => {
  map[c.label] = c.key;
  return map;
}, {});

/**
 * Returns a shuffled array of questions for a given category.
 * Falls back to "mixed" or any available category if needed.
 *
 * @param {string} categoryKey - key like "sports", "movies", etc.
 * @param {number} count - how many questions to return
 * @returns {Array} Array of question objects
 */
function getQuestionsForSession(categoryKey, count) {
  console.log("[QUESTIONS] === getQuestionsForSession ===");
  console.log("[QUESTIONS] categoryKey:", categoryKey);
  console.log("[QUESTIONS] count:", count);

  let pool = QUESTION_BANK[categoryKey];

  // If no pool exists for the key, fall back to "mixed" or any category.
  if (!pool || pool.length === 0) {
    console.warn("[QUESTIONS] Missing or empty pool for categoryKey:", categoryKey, "-> falling back to 'mixed'");
    pool = QUESTION_BANK["mixed"];

    // If mixed is also empty, build a simple merged pool from all categories.
    if (!pool || pool.length === 0) {
      console.log("[QUESTIONS] Building mixed pool from all categories");
      pool = Object.values(QUESTION_BANK)
        .filter(arr => Array.isArray(arr) && arr.length > 0)
        .flat();
    }
  }

  console.log("[QUESTIONS] Pool size for", categoryKey, ":", pool.length);

  // Shallow copy and shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  // Return first `count` questions (or fewer if not enough)
  const selected = shuffled.slice(0, count);

  console.log("[QUESTIONS] Selected", selected.length, "questions");
  console.log("[QUESTIONS] First question:", selected[0]?.question.substring(0, 50) + "...");

  return selected;
}

/**
 * Compatibility layer for old offline wizard's nextQuestion interface.
 * This allows Free Play (which uses the offline wizard) to work with the new question bank.
 *
 * @param {Object} params
 * @param {Array<string>} params.categories - array of category keys
 * @param {string} params.difficulty - difficulty level (ignored for now, all questions are same difficulty)
 * @returns {Promise<Object>} { question, done }
 */
let usedQuestionIndices = new Set();

window.nextQuestion = async function({ categories = [], difficulty = null } = {}) {
  console.log('[Questions] nextQuestion called (compatibility mode)');
  console.log('[Questions] categories:', categories);
  console.log('[Questions] difficulty:', difficulty);

  let categoryKey = null;

  if (Array.isArray(categories) && categories.length > 0) {
    categoryKey = categories[0];
    console.log('[Questions] Using category:', categoryKey);
  }

  // If no category or invalid, use mixed
  let pool = QUESTION_BANK[categoryKey];
  if (!pool || pool.length === 0) {
    console.log('[Questions] Category not found, using mixed pool');
    categoryKey = 'mixed';
    pool = QUESTION_BANK[categoryKey];

    // Build mixed pool if empty
    if (!pool || pool.length === 0) {
      pool = Object.values(QUESTION_BANK)
        .filter(arr => Array.isArray(arr) && arr.length > 0)
        .flat();
    }
  }

  if (pool.length === 0) {
    console.error('[Questions] No questions available!');
    return { question: null, done: true };
  }

  // Find an unused question
  let attempts = 0;
  let questionIndex = -1;
  const maxAttempts = pool.length * 2;

  while (attempts < maxAttempts) {
    questionIndex = Math.floor(Math.random() * pool.length);
    const key = `${categoryKey}-${questionIndex}`;

    if (!usedQuestionIndices.has(key)) {
      usedQuestionIndices.add(key);
      break;
    }
    attempts++;
  }

  if (attempts >= maxAttempts) {
    console.log('[Questions] All questions used, clearing cache');
    usedQuestionIndices.clear();
    questionIndex = Math.floor(Math.random() * pool.length);
  }

  const rawQuestion = pool[questionIndex];

  // Convert to offline wizard's expected format
  const question = {
    id: `${categoryKey}-${questionIndex}`,
    prompt: rawQuestion.question,
    choices: rawQuestion.choices,
    correct_index: rawQuestion.correctIndex + 1, // Wizard expects 1-based index
    time_limit_ms: 10000, // 10 seconds
    category: categoryKey,
    difficulty: difficulty || 'normal'
  };

  console.log('[Questions] Returning question:', question.prompt.substring(0, 50) + '...');
  console.log('[Questions] Category:', question.category);
  console.log('[Questions] Correct index:', question.correct_index);

  return { question, done: false };
};

// Export to window for global access
window.QUESTION_BANK = QUESTION_BANK;
window.TRIVIA_CATEGORIES = TRIVIA_CATEGORIES;
window.TRIVIA_CATEGORY_MAP = TRIVIA_CATEGORY_MAP;
window.getQuestionsForSession = getQuestionsForSession;

console.log('[Questions] ✓ New question bank loaded successfully');
console.log('[Questions] Available categories:', TRIVIA_CATEGORIES.map(c => c.label).join(', '));
console.log('[Questions] Total questions by category:', Object.keys(QUESTION_BANK).reduce((acc, key) => {
  acc[key] = QUESTION_BANK[key].length;
  return acc;
}, {}));
console.log('[Questions] ✓ Compatibility layer for nextQuestion() enabled');
