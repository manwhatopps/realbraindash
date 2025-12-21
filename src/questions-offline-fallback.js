/**
 * === OFFLINE FALLBACK QUESTION BANK ===
 *
 * This is ONLY used when:
 * - Network is unavailable
 * - Supabase edge functions fail
 * - Database query fails
 *
 * PRIMARY source is ALWAYS the database via get-questions edge function.
 *
 * This provides a minimal set of questions to keep the app functional offline.
 */

console.log('[Offline Fallback] Loading offline fallback question bank...');

// Minimal offline fallback question bank (10 questions per category)
const OFFLINE_FALLBACK_BANK = {
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
    },
    {
      question: "What is the speed of light?",
      choices: ["186,000 mph", "186,000 km/s", "300,000 km/s", "300,000 mph"],
      correctIndex: 2
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
    },
    {
      question: "Which movie won Best Picture at the 2020 Oscars?",
      choices: ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"],
      correctIndex: 2
    },
    {
      question: "What is the highest-grossing film of all time (unadjusted)?",
      choices: ["Titanic", "Avatar", "Avengers: Endgame", "Star Wars"],
      correctIndex: 1
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
    },
    {
      question: "Which country has the most time zones?",
      choices: ["Russia", "USA", "China", "France"],
      correctIndex: 3
    }
  ],

  // Add mixed as a merge of all categories
  mixed: []
};

// Build mixed category from all others
OFFLINE_FALLBACK_BANK.mixed = Object.values(OFFLINE_FALLBACK_BANK)
  .filter(arr => arr.length > 0)
  .flat()
  .sort(() => Math.random() - 0.5);

/**
 * Get offline fallback questions for a category.
 * Only used when online sources fail.
 *
 * @param {string} categoryKey - Category key like "sports", "science", etc.
 * @param {number} count - Number of questions to return
 * @returns {Array} Array of question objects
 */
export function getOfflineFallbackQuestions(categoryKey, count = 10) {
  console.warn('[Offline Fallback] Using offline fallback questions for', categoryKey);

  let pool = OFFLINE_FALLBACK_BANK[categoryKey];

  // Fallback to mixed if category not found
  if (!pool || pool.length === 0) {
    console.warn('[Offline Fallback] Category not found, using mixed');
    pool = OFFLINE_FALLBACK_BANK.mixed;
  }

  if (!pool || pool.length === 0) {
    console.error('[Offline Fallback] No offline questions available!');
    return [];
  }

  // Shuffle and return requested count
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Export the bank for debugging/inspection
export const OFFLINE_BANK = OFFLINE_FALLBACK_BANK;

console.log('[Offline Fallback] ✓ Offline fallback loaded with',
  Object.keys(OFFLINE_FALLBACK_BANK).length, 'categories');
