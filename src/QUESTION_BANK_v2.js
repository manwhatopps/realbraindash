const QUESTION_BANK = {
  sports: [
    {
      question: "Which NFL team has won the most Super Bowls?",
      choices: [{"id": "A", "text": "New England Patriots"}, {"id": "B", "text": "Pittsburgh Steelers"}, {"id": "C", "text": "Dallas Cowboys"}, {"id": "D", "text": "San Francisco 49ers"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "The Patriots have won 6 Super Bowls."
    },
    {
      question: "How many players are on a basketball court per team during an NBA game?",
      choices: [{"id": "A", "text": "4"}, {"id": "B", "text": "5"}, {"id": "C", "text": "6"}, {"id": "D", "text": "7"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "5 players per team are on the court at a time."
    },
    {
      question: "In which country did the modern Olympic Games originate?",
      choices: [{"id": "A", "text": "Italy"}, {"id": "B", "text": "France"}, {"id": "C", "text": "Greece"}, {"id": "D", "text": "England"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The modern Olympics began in Athens, Greece in 1896."
    },
    {
      question: "What is the diameter of a basketball hoop in inches?",
      choices: [{"id": "A", "text": "16"}, {"id": "B", "text": "18"}, {"id": "C", "text": "20"}, {"id": "D", "text": "22"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "An NBA hoop is 18 inches in diameter."
    },
    {
      question: "Which country won the 2018 FIFA World Cup?",
      choices: [{"id": "A", "text": "Brazil"}, {"id": "B", "text": "Germany"}, {"id": "C", "text": "France"}, {"id": "D", "text": "Croatia"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "France defeated Croatia 4-2 in the final."
    },
    {
      question: "How many holes are in a standard round of golf?",
      choices: [{"id": "A", "text": "9"}, {"id": "B", "text": "12"}, {"id": "C", "text": "18"}, {"id": "D", "text": "21"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A standard round of golf consists of 18 holes."
    },
    {
      question: "Which tennis player has won the most Grand Slam singles titles in men's tennis?",
      choices: [{"id": "A", "text": "Roger Federer"}, {"id": "B", "text": "Rafael Nadal"}, {"id": "C", "text": "Novak Djokovic"}, {"id": "D", "text": "Pete Sampras"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Novak Djokovic holds the record with 24 Grand Slam titles."
    },
    {
      question: "What sport is played at Wimbledon?",
      choices: [{"id": "A", "text": "Cricket"}, {"id": "B", "text": "Tennis"}, {"id": "C", "text": "Squash"}, {"id": "D", "text": "Badminton"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Wimbledon is the oldest and most prestigious tennis tournament."
    },
    {
      question: "In baseball, how many strikes does it take to strike out a batter?",
      choices: [{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "5"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Three strikes result in a strikeout."
    },
    {
      question: "Which country hosted the 2016 Summer Olympics?",
      choices: [{"id": "A", "text": "China"}, {"id": "B", "text": "Japan"}, {"id": "C", "text": "Brazil"}, {"id": "D", "text": "Australia"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The 2016 Summer Olympics were held in Rio de Janeiro, Brazil."
    },
    {
      question: "How long is a standard marathon in miles?",
      choices: [{"id": "A", "text": "24.2"}, {"id": "B", "text": "25.1"}, {"id": "C", "text": "26.2"}, {"id": "D", "text": "27.3"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A marathon is 26.2 miles (42.195 km)."
    },
    {
      question: "Which sport uses a puck?",
      choices: [{"id": "A", "text": "Lacrosse"}, {"id": "B", "text": "Field Hockey"}, {"id": "C", "text": "Ice Hockey"}, {"id": "D", "text": "Polo"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Ice hockey uses a hard rubber puck."
    },
    {
      question: "How many points is a touchdown worth in American football?",
      choices: [{"id": "A", "text": "3"}, {"id": "B", "text": "5"}, {"id": "C", "text": "6"}, {"id": "D", "text": "7"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A touchdown is worth 6 points."
    },
    {
      question: "What is the maximum score in a single game of ten-pin bowling?",
      choices: [{"id": "A", "text": "200"}, {"id": "B", "text": "250"}, {"id": "C", "text": "300"}, {"id": "D", "text": "350"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A perfect game in bowling scores 300 points (12 consecutive strikes)."
    },
    {
      question: "Which swimmer has won the most Olympic gold medals ever?",
      choices: [{"id": "A", "text": "Mark Spitz"}, {"id": "B", "text": "Ian Thorpe"}, {"id": "C", "text": "Michael Phelps"}, {"id": "D", "text": "Ryan Lochte"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Michael Phelps won 23 Olympic gold medals."
    },
    {
      question: "In soccer, what does it mean when a player receives a red card?",
      choices: [{"id": "A", "text": "Warning issued"}, {"id": "B", "text": "Substitution allowed"}, {"id": "C", "text": "Player is ejected"}, {"id": "D", "text": "Free kick awarded"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A red card results in the player being sent off the field."
    },
    {
      question: "How many events are in a decathlon?",
      choices: [{"id": "A", "text": "8"}, {"id": "B", "text": "10"}, {"id": "C", "text": "12"}, {"id": "D", "text": "14"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A decathlon consists of 10 track and field events."
    },
    {
      question: "What is the name of the trophy awarded to the NHL champion?",
      choices: [{"id": "A", "text": "Conn Smythe Trophy"}, {"id": "B", "text": "Hart Trophy"}, {"id": "C", "text": "Stanley Cup"}, {"id": "D", "text": "Presidents Trophy"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Stanley Cup is awarded to the NHL playoff champion."
    },
    {
      question: "In volleyball, how many players are on each side of the net?",
      choices: [{"id": "A", "text": "4"}, {"id": "B", "text": "5"}, {"id": "C", "text": "6"}, {"id": "D", "text": "7"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Each volleyball team has 6 players on the court."
    },
    {
      question: "Which country invented basketball?",
      choices: [{"id": "A", "text": "USA"}, {"id": "B", "text": "Canada"}, {"id": "C", "text": "England"}, {"id": "D", "text": "Australia"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Basketball was invented by Canadian-American James Naismith in the USA in 1891."
    },
    {
      question: "How many laps make up a standard 1500m race on a 400m track?",
      choices: [{"id": "A", "text": "2.5"}, {"id": "B", "text": "3"}, {"id": "C", "text": "3.75"}, {"id": "D", "text": "4"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "3.75 laps of a 400m track equals 1500m."
    },
    {
      question: "What is the highest belt color in traditional judo?",
      choices: [{"id": "A", "text": "Brown"}, {"id": "B", "text": "Black"}, {"id": "C", "text": "Red"}, {"id": "D", "text": "White"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The red belt (12th dan) is the highest in judo, though black belt (1st-10th dan) is most recognized."
    },
    {
      question: "Which Formula 1 team has won the most Constructors Championships?",
      choices: [{"id": "A", "text": "McLaren"}, {"id": "B", "text": "Williams"}, {"id": "C", "text": "Ferrari"}, {"id": "D", "text": "Mercedes"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Ferrari has won the most Constructors Championships in F1 history."
    },
    {
      question: "In American football, how many points is a field goal worth?",
      choices: [{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "4"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A successful field goal is worth 3 points."
    },
    {
      question: "What is the term for scoring three goals in a single soccer match?",
      choices: [{"id": "A", "text": "Triple"}, {"id": "B", "text": "Hat trick"}, {"id": "C", "text": "Treble"}, {"id": "D", "text": "Triple threat"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Scoring three goals in one match is called a hat trick."
    },
    {
      question: "Which country has won the most Rugby World Cup titles?",
      choices: [{"id": "A", "text": "England"}, {"id": "B", "text": "New Zealand"}, {"id": "C", "text": "Australia"}, {"id": "D", "text": "South Africa"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "New Zealand (All Blacks) has won the Rugby World Cup three times."
    },
    {
      question: "How wide is a standard tennis court in feet?",
      choices: [{"id": "A", "text": "27"}, {"id": "B", "text": "36"}, {"id": "C", "text": "42"}, {"id": "D", "text": "54"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A singles tennis court is 27 feet wide; doubles is 36 feet wide."
    },
    {
      question: "In boxing, how long is a standard round?",
      choices: [{"id": "A", "text": "2 minutes"}, {"id": "B", "text": "3 minutes"}, {"id": "C", "text": "4 minutes"}, {"id": "D", "text": "5 minutes"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A standard professional boxing round is 3 minutes."
    },
    {
      question: "What is the national sport of Japan?",
      choices: [{"id": "A", "text": "Judo"}, {"id": "B", "text": "Karate"}, {"id": "C", "text": "Sumo"}, {"id": "D", "text": "Baseball"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Sumo is considered Japan's national sport."
    },
    {
      question: "How many players are on a baseball team's field at one time?",
      choices: [{"id": "A", "text": "8"}, {"id": "B", "text": "9"}, {"id": "C", "text": "10"}, {"id": "D", "text": "11"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "9 players field at a time in baseball."
    },
    {
      question: "Which country won the most gold medals at the 2020 Tokyo Olympics?",
      choices: [{"id": "A", "text": "China"}, {"id": "B", "text": "Russia"}, {"id": "C", "text": "Great Britain"}, {"id": "D", "text": "USA"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The USA won the most gold medals at the Tokyo 2020 Olympics."
    },
    {
      question: "What is the name of the starting position in swimming races?",
      choices: [{"id": "A", "text": "Lane position"}, {"id": "B", "text": "Starting block"}, {"id": "C", "text": "Dive platform"}, {"id": "D", "text": "Ready stance"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Swimmers start from the starting block."
    },
    {
      question: "In cricket, how many balls are in a standard over?",
      choices: [{"id": "A", "text": "4"}, {"id": "B", "text": "5"}, {"id": "C", "text": "6"}, {"id": "D", "text": "8"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A standard cricket over consists of 6 balls."
    },
    {
      question: "Which city hosted the first modern Summer Olympics in 1896?",
      choices: [{"id": "A", "text": "London"}, {"id": "B", "text": "Paris"}, {"id": "C", "text": "Rome"}, {"id": "D", "text": "Athens"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The first modern Olympics were held in Athens, Greece in 1896."
    },
    {
      question: "What is the length of an Olympic swimming pool in meters?",
      choices: [{"id": "A", "text": "25"}, {"id": "B", "text": "50"}, {"id": "C", "text": "75"}, {"id": "D", "text": "100"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "An Olympic swimming pool is 50 meters long."
    },
    {
      question: "How many points is a safety worth in American football?",
      choices: [{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "4"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A safety scores 2 points for the defensive team."
    },
    {
      question: "In golf, what term describes completing a hole one stroke under par?",
      choices: [{"id": "A", "text": "Eagle"}, {"id": "B", "text": "Birdie"}, {"id": "C", "text": "Bogey"}, {"id": "D", "text": "Albatross"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A birdie is one stroke under par."
    },
    {
      question: "Which athlete has won the most Olympic medals overall?",
      choices: [{"id": "A", "text": "Carl Lewis"}, {"id": "B", "text": "Usain Bolt"}, {"id": "C", "text": "Michael Phelps"}, {"id": "D", "text": "Larisa Latynina"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Michael Phelps holds the record with 28 Olympic medals total."
    },
    {
      question: "What color jersey does the leader wear in the Tour de France?",
      choices: [{"id": "A", "text": "Red"}, {"id": "B", "text": "Green"}, {"id": "C", "text": "Yellow"}, {"id": "D", "text": "White"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Tour de France leader wears the yellow jersey (maillot jaune)."
    },
    {
      question: "How many periods are in a standard NHL hockey game?",
      choices: [{"id": "A", "text": "2"}, {"id": "B", "text": "3"}, {"id": "C", "text": "4"}, {"id": "D", "text": "5"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A standard NHL game has 3 periods of 20 minutes each."
    },
    {
      question: "What is the term for a score of zero in tennis?",
      choices: [{"id": "A", "text": "Nil"}, {"id": "B", "text": "Zero"}, {"id": "C", "text": "Love"}, {"id": "D", "text": "Zip"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Zero points in tennis is called 'love'."
    },
    {
      question: "In which sport would you perform a slam dunk?",
      choices: [{"id": "A", "text": "Volleyball"}, {"id": "B", "text": "Basketball"}, {"id": "C", "text": "Handball"}, {"id": "D", "text": "Water polo"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A slam dunk is a basketball move where the ball is pushed directly through the hoop."
    },
    {
      question: "How many feet are between bases in Major League Baseball?",
      choices: [{"id": "A", "text": "80"}, {"id": "B", "text": "90"}, {"id": "C", "text": "100"}, {"id": "D", "text": "110"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "MLB bases are 90 feet apart."
    },
    {
      question: "Which nation invented the sport of rugby?",
      choices: [{"id": "A", "text": "Scotland"}, {"id": "B", "text": "Ireland"}, {"id": "C", "text": "England"}, {"id": "D", "text": "Wales"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Rugby originated in Rugby, England in the 1820s."
    },
    {
      question: "In soccer, how long is a standard half?",
      choices: [{"id": "A", "text": "30 minutes"}, {"id": "B", "text": "40 minutes"}, {"id": "C", "text": "45 minutes"}, {"id": "D", "text": "50 minutes"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Each half of a soccer match is 45 minutes."
    },
    {
      question: "What is the surface of the US Open tennis tournament?",
      choices: [{"id": "A", "text": "Grass"}, {"id": "B", "text": "Clay"}, {"id": "C", "text": "Hard court"}, {"id": "D", "text": "Carpet"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The US Open is played on hard courts (DecoTurf)."
    },
    {
      question: "Which team won Super Bowl LVII in 2023?",
      choices: [{"id": "A", "text": "Philadelphia Eagles"}, {"id": "B", "text": "Kansas City Chiefs"}, {"id": "C", "text": "Cincinnati Bengals"}, {"id": "D", "text": "San Francisco 49ers"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Kansas City Chiefs defeated the Philadelphia Eagles 38-35."
    },
    {
      question: "How many players are on each side in a game of water polo?",
      choices: [{"id": "A", "text": "5"}, {"id": "B", "text": "6"}, {"id": "C", "text": "7"}, {"id": "D", "text": "8"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Each water polo team has 7 players in the water."
    },
    {
      question: "What Olympic event combines cross-country skiing and rifle shooting?",
      choices: [{"id": "A", "text": "Nordic Combined"}, {"id": "B", "text": "Biathlon"}, {"id": "C", "text": "Pentathlon"}, {"id": "D", "text": "Decathlon"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The biathlon combines cross-country skiing and rifle shooting."
    },
    {
      question: "In bowling, what is it called when you knock all pins down on the second ball?",
      choices: [{"id": "A", "text": "Spare"}, {"id": "B", "text": "Strike"}, {"id": "C", "text": "Split"}, {"id": "D", "text": "Turkey"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Knocking all remaining pins on the second throw is a spare."
    },
  ],
  politics: [
    {
      question: "How many members are in the U.S. House of Representatives?",
      choices: [{"id": "A", "text": "100"}, {"id": "B", "text": "270"}, {"id": "C", "text": "435"}, {"id": "D", "text": "538"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The House of Representatives has 435 members."
    },
    {
      question: "Which amendment to the U.S. Constitution abolished slavery?",
      choices: [{"id": "A", "text": "11th"}, {"id": "B", "text": "12th"}, {"id": "C", "text": "13th"}, {"id": "D", "text": "14th"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The 13th Amendment abolished slavery in 1865."
    },
    {
      question: "Who was the first female Speaker of the U.S. House of Representatives?",
      choices: [{"id": "A", "text": "Hillary Clinton"}, {"id": "B", "text": "Condoleezza Rice"}, {"id": "C", "text": "Nancy Pelosi"}, {"id": "D", "text": "Madeleine Albright"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Nancy Pelosi became the first female Speaker in 2007."
    },
    {
      question: "How long is a U.S. Senator's term?",
      choices: [{"id": "A", "text": "2 years"}, {"id": "B", "text": "4 years"}, {"id": "C", "text": "6 years"}, {"id": "D", "text": "8 years"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "U.S. Senators serve 6-year terms."
    },
    {
      question: "Which body ratifies treaties in the United States?",
      choices: [{"id": "A", "text": "House of Representatives"}, {"id": "B", "text": "Supreme Court"}, {"id": "C", "text": "Senate"}, {"id": "D", "text": "President alone"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Senate must ratify treaties by a two-thirds vote."
    },
    {
      question: "What is the minimum age to become President of the United States?",
      choices: [{"id": "A", "text": "25"}, {"id": "B", "text": "30"}, {"id": "C", "text": "35"}, {"id": "D", "text": "40"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Constitution requires the President to be at least 35 years old."
    },
    {
      question: "Which political party uses the elephant as its symbol?",
      choices: [{"id": "A", "text": "Democratic Party"}, {"id": "B", "text": "Green Party"}, {"id": "C", "text": "Republican Party"}, {"id": "D", "text": "Libertarian Party"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Republican Party is symbolized by the elephant."
    },
    {
      question: "How many justices sit on the U.S. Supreme Court?",
      choices: [{"id": "A", "text": "7"}, {"id": "B", "text": "8"}, {"id": "C", "text": "9"}, {"id": "D", "text": "11"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Supreme Court has 9 justices."
    },
    {
      question: "What document established the framework for the U.S. government?",
      choices: [{"id": "A", "text": "The Declaration of Independence"}, {"id": "B", "text": "The Magna Carta"}, {"id": "C", "text": "The Constitution"}, {"id": "D", "text": "The Bill of Rights"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The U.S. Constitution establishes the structure of the federal government."
    },
    {
      question: "Which branch of government has the power to declare war?",
      choices: [{"id": "A", "text": "Executive"}, {"id": "B", "text": "Judicial"}, {"id": "C", "text": "Legislative"}, {"id": "D", "text": "Military"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Only Congress (the legislative branch) has the power to formally declare war."
    },
    {
      question: "What is the term for a proposed law before it is passed?",
      choices: [{"id": "A", "text": "Act"}, {"id": "B", "text": "Bill"}, {"id": "C", "text": "Statute"}, {"id": "D", "text": "Ordinance"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A proposed law is called a bill until it is signed into law."
    },
    {
      question: "Who becomes President if both the President and Vice President are unable to serve?",
      choices: [{"id": "A", "text": "Secretary of State"}, {"id": "B", "text": "Senate Majority Leader"}, {"id": "C", "text": "Speaker of the House"}, {"id": "D", "text": "Attorney General"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Speaker of the House is third in the presidential line of succession."
    },
    {
      question: "How many votes does a candidate need in the Electoral College to win the presidency?",
      choices: [{"id": "A", "text": "218"}, {"id": "B", "text": "270"}, {"id": "C", "text": "300"}, {"id": "D", "text": "538"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A candidate needs 270 electoral votes to win the presidency."
    },
    {
      question: "What is the name of the lower house of the British Parliament?",
      choices: [{"id": "A", "text": "House of Lords"}, {"id": "B", "text": "House of Commons"}, {"id": "C", "text": "Parliament House"}, {"id": "D", "text": "House of Windsor"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The House of Commons is the lower house of the UK Parliament."
    },
    {
      question: "Which amendment gave women the right to vote in the U.S.?",
      choices: [{"id": "A", "text": "15th"}, {"id": "B", "text": "17th"}, {"id": "C", "text": "19th"}, {"id": "D", "text": "21st"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The 19th Amendment granted women the right to vote in 1920."
    },
    {
      question: "What is the term for a government controlled by a single ruler with absolute power?",
      choices: [{"id": "A", "text": "Democracy"}, {"id": "B", "text": "Oligarchy"}, {"id": "C", "text": "Autocracy"}, {"id": "D", "text": "Theocracy"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "An autocracy is a system where one person holds unlimited political power."
    },
    {
      question: "Which country has the world's oldest written constitution still in use?",
      choices: [{"id": "A", "text": "France"}, {"id": "B", "text": "United Kingdom"}, {"id": "C", "text": "United States"}, {"id": "D", "text": "Switzerland"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The U.S. Constitution, ratified in 1788, is the world's oldest written national constitution still in use."
    },
    {
      question: "What is the name of the U.S. federal budget bill that funds the government?",
      choices: [{"id": "A", "text": "Reconciliation Bill"}, {"id": "B", "text": "Appropriations Bill"}, {"id": "C", "text": "Authorization Bill"}, {"id": "D", "text": "Resolution Bill"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Appropriations bills fund the U.S. federal government."
    },
    {
      question: "How many stars are on the United States flag?",
      choices: [{"id": "A", "text": "48"}, {"id": "B", "text": "49"}, {"id": "C", "text": "50"}, {"id": "D", "text": "52"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The U.S. flag has 50 stars, one for each state."
    },
    {
      question: "Which country has a government system called a parliamentary democracy?",
      choices: [{"id": "A", "text": "United States"}, {"id": "B", "text": "China"}, {"id": "C", "text": "Canada"}, {"id": "D", "text": "North Korea"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Canada operates as a parliamentary democracy with a Prime Minister as head of government."
    },
    {
      question: "What is the process called when Congress removes a President from office?",
      choices: [{"id": "A", "text": "Recall"}, {"id": "B", "text": "Impeachment"}, {"id": "C", "text": "Veto"}, {"id": "D", "text": "Dissolution"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The impeachment process is used to remove a President from office."
    },
    {
      question: "Which U.S. president signed the Civil Rights Act of 1964?",
      choices: [{"id": "A", "text": "John F. Kennedy"}, {"id": "B", "text": "Dwight Eisenhower"}, {"id": "C", "text": "Lyndon B. Johnson"}, {"id": "D", "text": "Richard Nixon"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "President Lyndon B. Johnson signed the Civil Rights Act of 1964."
    },
    {
      question: "What is the name of the Russian parliament?",
      choices: [{"id": "A", "text": "Duma"}, {"id": "B", "text": "Reichstag"}, {"id": "C", "text": "Diet"}, {"id": "D", "text": "Knesset"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "The Russian parliament is called the State Duma."
    },
    {
      question: "Which amendment protects freedom of speech in the U.S.?",
      choices: [{"id": "A", "text": "First"}, {"id": "B", "text": "Second"}, {"id": "C", "text": "Fourth"}, {"id": "D", "text": "Fifth"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "The First Amendment protects freedom of speech, religion, and the press."
    },
    {
      question: "What is the term for when a president refuses to sign a bill into law?",
      choices: [{"id": "A", "text": "Filibuster"}, {"id": "B", "text": "Veto"}, {"id": "C", "text": "Pocket veto"}, {"id": "D", "text": "Override"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A president uses a veto to reject legislation passed by Congress."
    },
    {
      question: "Which body confirms presidential appointments to the Supreme Court?",
      choices: [{"id": "A", "text": "House of Representatives"}, {"id": "B", "text": "Senate"}, {"id": "C", "text": "Both chambers"}, {"id": "D", "text": "Electoral College"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Senate confirms Supreme Court nominations."
    },
    {
      question: "What is the capital city of Australia?",
      choices: [{"id": "A", "text": "Sydney"}, {"id": "B", "text": "Melbourne"}, {"id": "C", "text": "Brisbane"}, {"id": "D", "text": "Canberra"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Canberra is the capital of Australia, chosen as a compromise between Sydney and Melbourne."
    },
    {
      question: "Which party controlled the U.S. Senate after the 2020 elections?",
      choices: [{"id": "A", "text": "Republican"}, {"id": "B", "text": "Democratic"}, {"id": "C", "text": "Independent"}, {"id": "D", "text": "Split 50-50 with VP tiebreak"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Senate was split 50-50 with Vice President Harris casting the tiebreaking vote, giving Democrats control."
    },
    {
      question: "What is the term for a political system where religious leaders govern?",
      choices: [{"id": "A", "text": "Autocracy"}, {"id": "B", "text": "Plutocracy"}, {"id": "C", "text": "Theocracy"}, {"id": "D", "text": "Oligarchy"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A theocracy is governed by religious authority."
    },
    {
      question: "Which U.S. document begins with 'We the People'?",
      choices: [{"id": "A", "text": "Declaration of Independence"}, {"id": "B", "text": "Bill of Rights"}, {"id": "C", "text": "Constitution"}, {"id": "D", "text": "Emancipation Proclamation"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Preamble to the U.S. Constitution begins with 'We the People.'"
    },
    {
      question: "How many terms can a U.S. President serve?",
      choices: [{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "Unlimited"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The 22nd Amendment limits presidents to two terms."
    },
    {
      question: "What is the name of Israel's parliament?",
      choices: [{"id": "A", "text": "Majlis"}, {"id": "B", "text": "Knesset"}, {"id": "C", "text": "Sejm"}, {"id": "D", "text": "Riksdag"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Israel's parliament is called the Knesset."
    },
    {
      question: "Which U.S. agency is responsible for collecting federal taxes?",
      choices: [{"id": "A", "text": "FEC"}, {"id": "B", "text": "SEC"}, {"id": "C", "text": "IRS"}, {"id": "D", "text": "FTC"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Internal Revenue Service (IRS) collects federal taxes."
    },
    {
      question: "What is the term for a vote by the electorate on a single political question?",
      choices: [{"id": "A", "text": "Election"}, {"id": "B", "text": "Referendum"}, {"id": "C", "text": "Caucus"}, {"id": "D", "text": "Primary"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A referendum puts a single political question directly to voters."
    },
    {
      question: "Which country's leader is called the Chancellor?",
      choices: [{"id": "A", "text": "France"}, {"id": "B", "text": "Italy"}, {"id": "C", "text": "Germany"}, {"id": "D", "text": "Spain"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Germany's head of government is called the Federal Chancellor."
    },
    {
      question: "What does NATO stand for?",
      choices: [{"id": "A", "text": "North American Treaty Organization"}, {"id": "B", "text": "North Atlantic Treaty Organization"}, {"id": "C", "text": "National Alliance Treaty Organization"}, {"id": "D", "text": "Northern Allied Treaty Order"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "NATO stands for North Atlantic Treaty Organization."
    },
    {
      question: "Which U.S. president served the longest term?",
      choices: [{"id": "A", "text": "Abraham Lincoln"}, {"id": "B", "text": "Theodore Roosevelt"}, {"id": "C", "text": "Franklin D. Roosevelt"}, {"id": "D", "text": "Harry Truman"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "FDR served four terms from 1933 until his death in 1945."
    },
    {
      question: "What is the term for a government in which the people hold power directly?",
      choices: [{"id": "A", "text": "Republic"}, {"id": "B", "text": "Monarchy"}, {"id": "C", "text": "Direct Democracy"}, {"id": "D", "text": "Constitutional Democracy"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "In a direct democracy, citizens vote directly on policy issues."
    },
    {
      question: "What percentage of Senate votes is needed to override a presidential veto?",
      choices: [{"id": "A", "text": "51%"}, {"id": "B", "text": "60%"}, {"id": "C", "text": "67%"}, {"id": "D", "text": "75%"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A two-thirds (67%) majority in both chambers is required to override a veto."
    },
    {
      question: "Which amendment repealed Prohibition in the United States?",
      choices: [{"id": "A", "text": "18th"}, {"id": "B", "text": "19th"}, {"id": "C", "text": "20th"}, {"id": "D", "text": "21st"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The 21st Amendment repealed the 18th Amendment, ending Prohibition in 1933."
    },
    {
      question: "What is the name of France's head of state?",
      choices: [{"id": "A", "text": "Prime Minister"}, {"id": "B", "text": "Chancellor"}, {"id": "C", "text": "President"}, {"id": "D", "text": "Premier"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "France's head of state is the President of the Republic."
    },
    {
      question: "Which U.S. city is home to the Supreme Court?",
      choices: [{"id": "A", "text": "New York"}, {"id": "B", "text": "Philadelphia"}, {"id": "C", "text": "Boston"}, {"id": "D", "text": "Washington D.C."}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Supreme Court is located in Washington D.C."
    },
    {
      question: "What is the term for a government run by the wealthy elite?",
      choices: [{"id": "A", "text": "Meritocracy"}, {"id": "B", "text": "Plutocracy"}, {"id": "C", "text": "Oligarchy"}, {"id": "D", "text": "Aristocracy"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A plutocracy is governed by the wealthy."
    },
    {
      question: "How many representatives does each state have in the U.S. Senate?",
      choices: [{"id": "A", "text": "1"}, {"id": "B", "text": "2"}, {"id": "C", "text": "3"}, {"id": "D", "text": "Based on population"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Each state has exactly two senators regardless of population."
    },
    {
      question: "What is the name of the UK's head of government?",
      choices: [{"id": "A", "text": "President"}, {"id": "B", "text": "Chancellor"}, {"id": "C", "text": "Prime Minister"}, {"id": "D", "text": "Premier"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The UK's head of government is the Prime Minister."
    },
    {
      question: "Which amendment guarantees the right to bear arms in the U.S.?",
      choices: [{"id": "A", "text": "First"}, {"id": "B", "text": "Second"}, {"id": "C", "text": "Third"}, {"id": "D", "text": "Fourth"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Second Amendment protects the right to keep and bear arms."
    },
    {
      question: "What is the term for the practice of redrawing electoral district boundaries to favor one party?",
      choices: [{"id": "A", "text": "Filibuster"}, {"id": "B", "text": "Gerrymandering"}, {"id": "C", "text": "Lobbying"}, {"id": "D", "text": "Redistricting"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Gerrymandering refers to manipulating district boundaries for political advantage."
    },
    {
      question: "Which country has a government called a constitutional monarchy?",
      choices: [{"id": "A", "text": "China"}, {"id": "B", "text": "Iran"}, {"id": "C", "text": "United Kingdom"}, {"id": "D", "text": "Saudi Arabia"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The UK is a constitutional monarchy where the monarch's powers are limited by the constitution."
    },
    {
      question: "How many articles are in the original U.S. Constitution?",
      choices: [{"id": "A", "text": "5"}, {"id": "B", "text": "7"}, {"id": "C", "text": "10"}, {"id": "D", "text": "12"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The original U.S. Constitution has 7 articles."
    },
    {
      question: "What is the official residence of the U.S. President?",
      choices: [{"id": "A", "text": "Capitol Building"}, {"id": "B", "text": "Pentagon"}, {"id": "C", "text": "White House"}, {"id": "D", "text": "Blair House"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The White House is the official residence and office of the U.S. President."
    },
  ],
  business: [
    {
      question: "What does GDP stand for?",
      choices: [{"id": "A", "text": "Gross Domestic Product"}, {"id": "B", "text": "General Development Plan"}, {"id": "C", "text": "Gross Debt Portfolio"}, {"id": "D", "text": "Global Distribution Price"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "GDP measures the total value of goods and services produced in a country."
    },
    {
      question: "What type of company sells shares to the public on a stock exchange?",
      choices: [{"id": "A", "text": "Sole proprietorship"}, {"id": "B", "text": "Partnership"}, {"id": "C", "text": "Private limited company"}, {"id": "D", "text": "Public limited company"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "A public limited company (PLC) can sell shares on a stock exchange."
    },
    {
      question: "What is the term for the interest rate at which banks borrow from the Federal Reserve?",
      choices: [{"id": "A", "text": "Prime rate"}, {"id": "B", "text": "Discount rate"}, {"id": "C", "text": "Federal funds rate"}, {"id": "D", "text": "LIBOR"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The discount rate is the interest rate the Federal Reserve charges banks."
    },
    {
      question: "Which company was the first to reach a $1 trillion market cap?",
      choices: [{"id": "A", "text": "Microsoft"}, {"id": "B", "text": "Google"}, {"id": "C", "text": "Amazon"}, {"id": "D", "text": "Apple"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Apple became the first U.S. company to reach a $1 trillion market cap in 2018."
    },
    {
      question: "What does ROI stand for in business?",
      choices: [{"id": "A", "text": "Rate of Interest"}, {"id": "B", "text": "Return on Investment"}, {"id": "C", "text": "Revenue over Income"}, {"id": "D", "text": "Risk of Investment"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "ROI measures the profitability of an investment relative to its cost."
    },
    {
      question: "What is the term for a market with only one seller?",
      choices: [{"id": "A", "text": "Oligopoly"}, {"id": "B", "text": "Duopoly"}, {"id": "C", "text": "Monopoly"}, {"id": "D", "text": "Monopsony"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A monopoly exists when a single company dominates the entire market."
    },
    {
      question: "Which financial statement shows a company's revenues and expenses?",
      choices: [{"id": "A", "text": "Balance sheet"}, {"id": "B", "text": "Cash flow statement"}, {"id": "C", "text": "Income statement"}, {"id": "D", "text": "Equity statement"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The income statement shows revenues, expenses, and profit or loss."
    },
    {
      question: "What does the Dow Jones Industrial Average track?",
      choices: [{"id": "A", "text": "500 large U.S. companies"}, {"id": "B", "text": "30 large U.S. companies"}, {"id": "C", "text": "All NYSE companies"}, {"id": "D", "text": "Top 100 tech companies"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Dow tracks 30 large, publicly-owned companies in the U.S."
    },
    {
      question: "What is the term for buying a company using mostly borrowed money?",
      choices: [{"id": "A", "text": "IPO"}, {"id": "B", "text": "LBO"}, {"id": "C", "text": "M&A"}, {"id": "D", "text": "SPO"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A leveraged buyout (LBO) uses significant amounts of debt to finance the acquisition."
    },
    {
      question: "Which economic theory argues that the government should not interfere in the economy?",
      choices: [{"id": "A", "text": "Keynesian economics"}, {"id": "B", "text": "Monetarism"}, {"id": "C", "text": "Laissez-faire"}, {"id": "D", "text": "Mercantilism"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Laissez-faire economics advocates for minimal government intervention."
    },
    {
      question: "What is inflation?",
      choices: [{"id": "A", "text": "A decrease in the money supply"}, {"id": "B", "text": "A rise in unemployment"}, {"id": "C", "text": "A general increase in prices over time"}, {"id": "D", "text": "A rise in interest rates"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Inflation is the rate at which prices for goods and services rise over time."
    },
    {
      question: "What does B2B stand for in business?",
      choices: [{"id": "A", "text": "Back to Basics"}, {"id": "B", "text": "Business to Business"}, {"id": "C", "text": "Business to Buyer"}, {"id": "D", "text": "Budget to Budget"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "B2B refers to transactions between businesses rather than between a business and consumer."
    },
    {
      question: "What is a bond?",
      choices: [{"id": "A", "text": "A share of company ownership"}, {"id": "B", "text": "A loan made by an investor to a borrower"}, {"id": "C", "text": "A type of mutual fund"}, {"id": "D", "text": "A futures contract"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A bond is a fixed-income instrument representing a loan from an investor to a borrower."
    },
    {
      question: "Which country has the world's largest economy by GDP?",
      choices: [{"id": "A", "text": "China"}, {"id": "B", "text": "Japan"}, {"id": "C", "text": "Germany"}, {"id": "D", "text": "United States"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The United States has the world's largest economy by nominal GDP."
    },
    {
      question: "What is the term for the total revenue a company earns before expenses?",
      choices: [{"id": "A", "text": "Net income"}, {"id": "B", "text": "Gross revenue"}, {"id": "C", "text": "Operating income"}, {"id": "D", "text": "EBITDA"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Gross revenue is the total income before any deductions."
    },
    {
      question: "What does NASDAQ stand for?",
      choices: [{"id": "A", "text": "National Association of Securities Dealers Automated Quotations"}, {"id": "B", "text": "North American Stock Dealers and Quotes"}, {"id": "C", "text": "National Automated Stock Deal And Quote"}, {"id": "D", "text": "None of the above"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "NASDAQ stands for National Association of Securities Dealers Automated Quotations."
    },
    {
      question: "What is a bear market?",
      choices: [{"id": "A", "text": "A market rising more than 20%"}, {"id": "B", "text": "A market falling more than 20%"}, {"id": "C", "text": "A flat, sideways market"}, {"id": "D", "text": "A market with high volatility"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A bear market is defined as a decline of 20% or more from recent highs."
    },
    {
      question: "What is the term for the value of all assets minus all liabilities?",
      choices: [{"id": "A", "text": "Gross profit"}, {"id": "B", "text": "Net worth"}, {"id": "C", "text": "Operating capital"}, {"id": "D", "text": "Working capital"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Net worth (or equity) equals total assets minus total liabilities."
    },
    {
      question: "Which company created the iPhone?",
      choices: [{"id": "A", "text": "Samsung"}, {"id": "B", "text": "Google"}, {"id": "C", "text": "Microsoft"}, {"id": "D", "text": "Apple"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Apple launched the first iPhone in 2007."
    },
    {
      question: "What does VC stand for in startup investing?",
      choices: [{"id": "A", "text": "Variable Cost"}, {"id": "B", "text": "Value Chain"}, {"id": "C", "text": "Venture Capital"}, {"id": "D", "text": "Virtual Company"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "VC stands for venture capital, funding provided to early-stage companies."
    },
    {
      question: "What is the Federal Reserve?",
      choices: [{"id": "A", "text": "The U.S. Treasury Department"}, {"id": "B", "text": "The U.S. central banking system"}, {"id": "C", "text": "The government's investment fund"}, {"id": "D", "text": "The stock market regulator"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Federal Reserve is the central banking system of the United States."
    },
    {
      question: "What is a stock dividend?",
      choices: [{"id": "A", "text": "Interest paid on a bond"}, {"id": "B", "text": "A portion of company profits distributed to shareholders"}, {"id": "C", "text": "A fee for buying stock"}, {"id": "D", "text": "A penalty for selling stock"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A dividend is a distribution of a company's earnings to shareholders."
    },
    {
      question: "What is the term for a startup valued at over $1 billion?",
      choices: [{"id": "A", "text": "Decacorn"}, {"id": "B", "text": "Unicorn"}, {"id": "C", "text": "Gazelle"}, {"id": "D", "text": "Dragon"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A startup valued at over $1 billion is called a unicorn."
    },
    {
      question: "What does EBITDA stand for?",
      choices: [{"id": "A", "text": "Earnings Before Interest, Taxes, Depreciation, and Amortization"}, {"id": "B", "text": "Earnings Based on Interest, Taxes, Dividends, and Assets"}, {"id": "C", "text": "Equity Before Income Tax Deductions and Allowances"}, {"id": "D", "text": "None of the above"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "EBITDA measures a company's core profitability before non-cash and financing costs."
    },
    {
      question: "What is a hedge fund?",
      choices: [{"id": "A", "text": "A government savings program"}, {"id": "B", "text": "A type of mutual fund for retail investors"}, {"id": "C", "text": "An alternative investment fund using advanced strategies"}, {"id": "D", "text": "A real estate investment fund"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Hedge funds use aggressive strategies including leverage and short-selling to generate returns."
    },
    {
      question: "What is supply and demand?",
      choices: [{"id": "A", "text": "A government pricing policy"}, {"id": "B", "text": "An economic model explaining price determination in a market"}, {"id": "C", "text": "A business inventory system"}, {"id": "D", "text": "A type of contract"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Supply and demand describes the relationship between product availability and consumer desire."
    },
    {
      question: "What is the S&P 500?",
      choices: [{"id": "A", "text": "A stock index of 500 large U.S. companies"}, {"id": "B", "text": "The top 500 global companies"}, {"id": "C", "text": "A government bond index"}, {"id": "D", "text": "A commodity price index"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "The S&P 500 tracks 500 large-cap U.S. publicly traded companies."
    },
    {
      question: "What is the term for when a company buys back its own stock?",
      choices: [{"id": "A", "text": "Stock split"}, {"id": "B", "text": "Share repurchase"}, {"id": "C", "text": "Dividend reinvestment"}, {"id": "D", "text": "Secondary offering"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A share repurchase or buyback reduces the number of outstanding shares."
    },
    {
      question: "What does SaaS stand for?",
      choices: [{"id": "A", "text": "Software as a Service"}, {"id": "B", "text": "Sales and Service"}, {"id": "C", "text": "System as a Solution"}, {"id": "D", "text": "Subscription and Software"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "SaaS refers to software delivered over the internet on a subscription basis."
    },
    {
      question: "What is the term for a rapid increase in the price of an asset beyond its intrinsic value?",
      choices: [{"id": "A", "text": "Bull market"}, {"id": "B", "text": "Market correction"}, {"id": "C", "text": "Speculative bubble"}, {"id": "D", "text": "Inflation"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A speculative bubble occurs when asset prices rise far above their fundamental value."
    },
    {
      question: "What is working capital?",
      choices: [{"id": "A", "text": "Total assets minus total liabilities"}, {"id": "B", "text": "Current assets minus current liabilities"}, {"id": "C", "text": "Operating income minus taxes"}, {"id": "D", "text": "Total revenue minus costs"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Working capital is current assets minus current liabilities, measuring short-term liquidity."
    },
    {
      question: "Which company founded in 1994 became the world's largest online retailer?",
      choices: [{"id": "A", "text": "eBay"}, {"id": "B", "text": "Alibaba"}, {"id": "C", "text": "Amazon"}, {"id": "D", "text": "Walmart"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Amazon was founded by Jeff Bezos in 1994 and grew to become the largest online retailer."
    },
    {
      question: "What is the term for the fee a stock broker charges for executing a trade?",
      choices: [{"id": "A", "text": "Dividend"}, {"id": "B", "text": "Premium"}, {"id": "C", "text": "Commission"}, {"id": "D", "text": "Spread"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A commission is the fee brokers charge for facilitating buy or sell transactions."
    },
    {
      question: "What does M&A stand for?",
      choices: [{"id": "A", "text": "Management and Accounting"}, {"id": "B", "text": "Mergers and Acquisitions"}, {"id": "C", "text": "Money and Assets"}, {"id": "D", "text": "Market and Analysis"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "M&A refers to the consolidation of companies through mergers and acquisitions."
    },
    {
      question: "What is a recession?",
      choices: [{"id": "A", "text": "Two consecutive quarters of negative GDP growth"}, {"id": "B", "text": "A 10% drop in stock prices"}, {"id": "C", "text": "An increase in unemployment above 10%"}, {"id": "D", "text": "A government budget deficit"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "A recession is typically defined as two consecutive quarters of negative GDP growth."
    },
    {
      question: "What is the term for money owed by a company to creditors?",
      choices: [{"id": "A", "text": "Assets"}, {"id": "B", "text": "Equity"}, {"id": "C", "text": "Liabilities"}, {"id": "D", "text": "Revenue"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Liabilities are obligations a company owes to outside parties."
    },
    {
      question: "Which business metric measures how quickly a company collects payment from customers?",
      choices: [{"id": "A", "text": "Inventory turnover"}, {"id": "B", "text": "Days sales outstanding"}, {"id": "C", "text": "Current ratio"}, {"id": "D", "text": "Debt-to-equity ratio"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Days sales outstanding (DSO) measures the average time to collect payment after a sale."
    },
    {
      question: "What is compound interest?",
      choices: [{"id": "A", "text": "Interest calculated only on the principal"}, {"id": "B", "text": "Interest earned on both principal and previously earned interest"}, {"id": "C", "text": "A fixed interest rate"}, {"id": "D", "text": "Interest charged on late payments"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Compound interest earns returns on both the original principal and accumulated interest."
    },
    {
      question: "What does P/E ratio measure?",
      choices: [{"id": "A", "text": "Profit vs Expenses"}, {"id": "B", "text": "Price relative to earnings per share"}, {"id": "C", "text": "Projected Earnings"}, {"id": "D", "text": "Product to Employee ratio"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The price-to-earnings ratio compares a company's stock price to its earnings per share."
    },
    {
      question: "What is the term for the process of spreading investments to reduce risk?",
      choices: [{"id": "A", "text": "Speculation"}, {"id": "B", "text": "Hedging"}, {"id": "C", "text": "Diversification"}, {"id": "D", "text": "Arbitrage"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Diversification reduces risk by spreading investments across different assets."
    },
    {
      question: "What is the gig economy?",
      choices: [{"id": "A", "text": "An economy based on manufacturing"}, {"id": "B", "text": "A system of short-term contracts or freelance work"}, {"id": "C", "text": "A digital marketplace economy"}, {"id": "D", "text": "An economy dominated by large corporations"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The gig economy is characterized by short-term, flexible work arrangements."
    },
    {
      question: "Which company created Google?",
      choices: [{"id": "A", "text": "Larry Page and Sergey Brin"}, {"id": "B", "text": "Bill Gates and Paul Allen"}, {"id": "C", "text": "Steve Jobs and Steve Wozniak"}, {"id": "D", "text": "Mark Zuckerberg and Eduardo Saverin"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Google was founded by Larry Page and Sergey Brin in 1998."
    },
    {
      question: "What is a mutual fund?",
      choices: [{"id": "A", "text": "A government savings program"}, {"id": "B", "text": "A pooled investment vehicle managed by professionals"}, {"id": "C", "text": "A type of savings account"}, {"id": "D", "text": "A corporate bond"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A mutual fund pools money from many investors to purchase a diversified portfolio."
    },
    {
      question: "What does KPI stand for?",
      choices: [{"id": "A", "text": "Key Performance Indicator"}, {"id": "B", "text": "Key Profit Index"}, {"id": "C", "text": "Known Performance Issue"}, {"id": "D", "text": "Key Price Information"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "KPIs are measurable values that demonstrate how effectively a company achieves objectives."
    },
    {
      question: "What is the term for a company's first sale of stock to the public?",
      choices: [{"id": "A", "text": "Secondary offering"}, {"id": "B", "text": "Stock split"}, {"id": "C", "text": "IPO"}, {"id": "D", "text": "Rights issue"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "An Initial Public Offering (IPO) is when a company first sells shares to the public."
    },
    {
      question: "What is arbitrage?",
      choices: [{"id": "A", "text": "Investing in bonds"}, {"id": "B", "text": "Simultaneously buying and selling assets to profit from price differences"}, {"id": "C", "text": "Short-selling stocks"}, {"id": "D", "text": "Trading commodity futures"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Arbitrage exploits price differences of the same asset in different markets."
    },
    {
      question: "What is the term for a company's net income divided by its total equity?",
      choices: [{"id": "A", "text": "ROA"}, {"id": "B", "text": "ROE"}, {"id": "C", "text": "P/E ratio"}, {"id": "D", "text": "Debt ratio"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Return on Equity (ROE) measures profitability relative to shareholders' equity."
    },
    {
      question: "Which sector does Apple belong to?",
      choices: [{"id": "A", "text": "Healthcare"}, {"id": "B", "text": "Energy"}, {"id": "C", "text": "Technology"}, {"id": "D", "text": "Financial services"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Apple is classified in the technology sector."
    },
    {
      question: "What is a startup's runway?",
      choices: [{"id": "A", "text": "Its marketing strategy"}, {"id": "B", "text": "How long it can operate before running out of cash"}, {"id": "C", "text": "Its growth rate"}, {"id": "D", "text": "Its customer acquisition plan"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Runway is the amount of time a startup can operate at its current burn rate before needing more funding."
    },
    {
      question: "What does B2C stand for?",
      choices: [{"id": "A", "text": "Business to Corporation"}, {"id": "B", "text": "Budget to Cost"}, {"id": "C", "text": "Business to Consumer"}, {"id": "D", "text": "Back to Core"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "B2C refers to businesses that sell products or services directly to consumers."
    },
  ],
  music: [
    {
      question: "Which artist released the album 'Thriller' in 1982?",
      choices: [{"id": "A", "text": "Prince"}, {"id": "B", "text": "Michael Jackson"}, {"id": "C", "text": "David Bowie"}, {"id": "D", "text": "Elton John"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Thriller by Michael Jackson is the best-selling album of all time."
    },
    {
      question: "What is the name of the scale consisting only of whole steps?",
      choices: [{"id": "A", "text": "Pentatonic scale"}, {"id": "B", "text": "Minor scale"}, {"id": "C", "text": "Chromatic scale"}, {"id": "D", "text": "Whole tone scale"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "A whole tone scale is made entirely of whole steps with no half steps."
    },
    {
      question: "Which band was Freddie Mercury the lead singer of?",
      choices: [{"id": "A", "text": "Led Zeppelin"}, {"id": "B", "text": "The Rolling Stones"}, {"id": "C", "text": "Queen"}, {"id": "D", "text": "The Who"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Freddie Mercury was the legendary lead vocalist of Queen."
    },
    {
      question: "What does BPM stand for in music?",
      choices: [{"id": "A", "text": "Bass Per Minute"}, {"id": "B", "text": "Beats Per Measure"}, {"id": "C", "text": "Beats Per Minute"}, {"id": "D", "text": "Beat Production Method"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "BPM measures tempo \u2014 the number of beats occurring in one minute."
    },
    {
      question: "Which composer wrote the 'Four Seasons'?",
      choices: [{"id": "A", "text": "Bach"}, {"id": "B", "text": "Mozart"}, {"id": "C", "text": "Vivaldi"}, {"id": "D", "text": "Beethoven"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Antonio Vivaldi composed The Four Seasons around 1720."
    },
    {
      question: "What is the lowest male singing voice called?",
      choices: [{"id": "A", "text": "Tenor"}, {"id": "B", "text": "Baritone"}, {"id": "C", "text": "Bass"}, {"id": "D", "text": "Alto"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Bass is the lowest male vocal range."
    },
    {
      question: "Which instrument does a guitarist use to pluck strings?",
      choices: [{"id": "A", "text": "Bow"}, {"id": "B", "text": "Plectrum (pick)"}, {"id": "C", "text": "Hammer"}, {"id": "D", "text": "Rosin"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A plectrum or pick is used to strum or pluck guitar strings."
    },
    {
      question: "How many strings does a standard guitar have?",
      choices: [{"id": "A", "text": "4"}, {"id": "B", "text": "5"}, {"id": "C", "text": "6"}, {"id": "D", "text": "7"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A standard acoustic or electric guitar has 6 strings."
    },
    {
      question: "Which legendary musician is known as 'The King of Rock and Roll'?",
      choices: [{"id": "A", "text": "Chuck Berry"}, {"id": "B", "text": "Jerry Lee Lewis"}, {"id": "C", "text": "Elvis Presley"}, {"id": "D", "text": "Little Richard"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Elvis Presley earned the title 'The King of Rock and Roll.'"
    },
    {
      question: "What is the term for a musical piece for one performer?",
      choices: [{"id": "A", "text": "Duet"}, {"id": "B", "text": "Trio"}, {"id": "C", "text": "Solo"}, {"id": "D", "text": "Quartet"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A solo is a musical composition performed by a single musician."
    },
    {
      question: "Which American city is considered the birthplace of jazz?",
      choices: [{"id": "A", "text": "Chicago"}, {"id": "B", "text": "New York"}, {"id": "C", "text": "Memphis"}, {"id": "D", "text": "New Orleans"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Jazz originated in New Orleans, Louisiana in the late 19th and early 20th centuries."
    },
    {
      question: "What do you call the speed of a piece of music?",
      choices: [{"id": "A", "text": "Pitch"}, {"id": "B", "text": "Tempo"}, {"id": "C", "text": "Rhythm"}, {"id": "D", "text": "Dynamics"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Tempo refers to the pace or speed at which a piece of music is played."
    },
    {
      question: "Which band released 'Bohemian Rhapsody' in 1975?",
      choices: [{"id": "A", "text": "The Beatles"}, {"id": "B", "text": "Led Zeppelin"}, {"id": "C", "text": "Queen"}, {"id": "D", "text": "Pink Floyd"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Bohemian Rhapsody was released by Queen on their album A Night at the Opera."
    },
    {
      question: "What is the name of the musical notation symbol indicating a note is to be held?",
      choices: [{"id": "A", "text": "Staccato"}, {"id": "B", "text": "Fermata"}, {"id": "C", "text": "Slur"}, {"id": "D", "text": "Tie"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A fermata tells the performer to hold the note longer than its normal duration."
    },
    {
      question: "How many keys are on a standard piano?",
      choices: [{"id": "A", "text": "72"}, {"id": "B", "text": "80"}, {"id": "C", "text": "88"}, {"id": "D", "text": "96"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A standard modern piano has 88 keys \u2014 52 white and 36 black."
    },
    {
      question: "Which rapper released 'The Marshall Mathers LP'?",
      choices: [{"id": "A", "text": "Jay-Z"}, {"id": "B", "text": "Nas"}, {"id": "C", "text": "Eminem"}, {"id": "D", "text": "DMX"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Eminem released The Marshall Mathers LP in 2000."
    },
    {
      question: "What is the term for playing notes separately and distinctly?",
      choices: [{"id": "A", "text": "Legato"}, {"id": "B", "text": "Vibrato"}, {"id": "C", "text": "Staccato"}, {"id": "D", "text": "Pizzicato"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Staccato indicates notes should be played short and detached."
    },
    {
      question: "Which female artist is known as the 'Queen of Pop'?",
      choices: [{"id": "A", "text": "Whitney Houston"}, {"id": "B", "text": "Mariah Carey"}, {"id": "C", "text": "Madonna"}, {"id": "D", "text": "Celine Dion"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Madonna is widely referred to as the Queen of Pop."
    },
    {
      question: "What is the time signature for a waltz?",
      choices: [{"id": "A", "text": "4/4"}, {"id": "B", "text": "2/4"}, {"id": "C", "text": "3/4"}, {"id": "D", "text": "6/8"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A waltz is in 3/4 time \u2014 three beats per measure."
    },
    {
      question: "Which instrument is Yo-Yo Ma famous for playing?",
      choices: [{"id": "A", "text": "Violin"}, {"id": "B", "text": "Viola"}, {"id": "C", "text": "Cello"}, {"id": "D", "text": "Double bass"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Yo-Yo Ma is a world-renowned cellist."
    },
    {
      question: "What genre of music originated in Jamaica in the 1960s?",
      choices: [{"id": "A", "text": "Salsa"}, {"id": "B", "text": "Reggae"}, {"id": "C", "text": "Ska"}, {"id": "D", "text": "Calypso"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Reggae music developed in Jamaica in the late 1960s."
    },
    {
      question: "Who wrote the opera 'Carmen'?",
      choices: [{"id": "A", "text": "Verdi"}, {"id": "B", "text": "Puccini"}, {"id": "C", "text": "Bizet"}, {"id": "D", "text": "Mozart"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Georges Bizet composed Carmen, which premiered in Paris in 1875."
    },
    {
      question: "Which band consisted of John, Paul, George, and Ringo?",
      choices: [{"id": "A", "text": "The Rolling Stones"}, {"id": "B", "text": "The Beach Boys"}, {"id": "C", "text": "The Beatles"}, {"id": "D", "text": "The Kinks"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Beatles featured John Lennon, Paul McCartney, George Harrison, and Ringo Starr."
    },
    {
      question: "What is the term for the highness or lowness of a sound?",
      choices: [{"id": "A", "text": "Tempo"}, {"id": "B", "text": "Volume"}, {"id": "C", "text": "Pitch"}, {"id": "D", "text": "Timbre"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Pitch describes how high or low a sound is based on its frequency."
    },
    {
      question: "Which music streaming platform was founded in 2006 in Sweden?",
      choices: [{"id": "A", "text": "Apple Music"}, {"id": "B", "text": "Tidal"}, {"id": "C", "text": "Deezer"}, {"id": "D", "text": "Spotify"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Spotify was founded in Stockholm, Sweden in 2006."
    },
    {
      question: "What is a chord?",
      choices: [{"id": "A", "text": "A single note held for a long time"}, {"id": "B", "text": "Three or more notes played simultaneously"}, {"id": "C", "text": "A sequence of notes played one after another"}, {"id": "D", "text": "A rhythmic pattern"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A chord is formed by playing three or more notes simultaneously."
    },
    {
      question: "Which famous violinist was known as the 'Devil's Violinist'?",
      choices: [{"id": "A", "text": "Itzhak Perlman"}, {"id": "B", "text": "Niccol\u00f2 Paganini"}, {"id": "C", "text": "Joshua Bell"}, {"id": "D", "text": "David Oistrakh"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Niccol\u00f2 Paganini earned the nickname due to his extraordinary virtuosity."
    },
    {
      question: "What is the musical term for gradually getting louder?",
      choices: [{"id": "A", "text": "Decrescendo"}, {"id": "B", "text": "Fortissimo"}, {"id": "C", "text": "Crescendo"}, {"id": "D", "text": "Diminuendo"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Crescendo means to gradually increase in volume."
    },
    {
      question: "Which music genre blends rhythm and blues with pop?",
      choices: [{"id": "A", "text": "Country"}, {"id": "B", "text": "Soul"}, {"id": "C", "text": "Funk"}, {"id": "D", "text": "R&B Pop"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Soul music combines R&B rhythms with gospel-influenced melodies and pop sensibilities."
    },
    {
      question: "What is the name of the percussion instrument with metal keys struck by mallets?",
      choices: [{"id": "A", "text": "Xylophone"}, {"id": "B", "text": "Marimba"}, {"id": "C", "text": "Glockenspiel"}, {"id": "D", "text": "Vibraphone"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The glockenspiel has metal bars and produces a bright, bell-like sound."
    },
    {
      question: "Which artist released 'Lemonade' in 2016?",
      choices: [{"id": "A", "text": "Rihanna"}, {"id": "B", "text": "Taylor Swift"}, {"id": "C", "text": "Beyonc\u00e9"}, {"id": "D", "text": "Adele"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Beyonc\u00e9 released the visual album Lemonade in April 2016."
    },
    {
      question: "What is the standard tuning for the lowest string on a guitar?",
      choices: [{"id": "A", "text": "A"}, {"id": "B", "text": "D"}, {"id": "C", "text": "E"}, {"id": "D", "text": "G"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The lowest (thickest) string on a standard-tuned guitar is E."
    },
    {
      question: "Which composer wrote Symphony No. 5 in C minor?",
      choices: [{"id": "A", "text": "Mozart"}, {"id": "B", "text": "Brahms"}, {"id": "C", "text": "Beethoven"}, {"id": "D", "text": "Schubert"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Ludwig van Beethoven composed Symphony No. 5, famous for its four-note opening motif."
    },
    {
      question: "What does the Italian musical term 'piano' mean?",
      choices: [{"id": "A", "text": "Slow"}, {"id": "B", "text": "Fast"}, {"id": "C", "text": "Loud"}, {"id": "D", "text": "Soft"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Piano means soft or quiet in Italian music notation."
    },
    {
      question: "Which rock band is known for the albums 'Led Zeppelin IV' and 'Physical Graffiti'?",
      choices: [{"id": "A", "text": "Black Sabbath"}, {"id": "B", "text": "Deep Purple"}, {"id": "C", "text": "Led Zeppelin"}, {"id": "D", "text": "Aerosmith"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Led Zeppelin is one of the most influential rock bands of all time."
    },
    {
      question: "What is the name of the drum pattern that defines hip-hop music?",
      choices: [{"id": "A", "text": "Breakbeat"}, {"id": "B", "text": "Boom bap"}, {"id": "C", "text": "808 bass"}, {"id": "D", "text": "Hi-hat roll"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The boom bap drum pattern \u2014 heavy kick and snare \u2014 defines classic hip-hop."
    },
    {
      question: "Which singer is known as 'The Voice'?",
      choices: [{"id": "A", "text": "Frank Sinatra"}, {"id": "B", "text": "Nat King Cole"}, {"id": "C", "text": "Tony Bennett"}, {"id": "D", "text": "Bing Crosby"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Frank Sinatra was famously nicknamed 'The Voice.'"
    },
    {
      question: "What is a capella music?",
      choices: [{"id": "A", "text": "Music with only piano accompaniment"}, {"id": "B", "text": "Singing without instrumental accompaniment"}, {"id": "C", "text": "Music with only string instruments"}, {"id": "D", "text": "A type of classical composition"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A cappella refers to vocal music performed without instrumental accompaniment."
    },
    {
      question: "Which country is the origin of the tango?",
      choices: [{"id": "A", "text": "Spain"}, {"id": "B", "text": "Brazil"}, {"id": "C", "text": "Mexico"}, {"id": "D", "text": "Argentina"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The tango originated in Buenos Aires, Argentina in the late 19th century."
    },
    {
      question: "What is the name of Bob Dylan's most celebrated song about social change?",
      choices: [{"id": "A", "text": "The Times They Are A-Changin'"}, {"id": "B", "text": "Blowin' in the Wind"}, {"id": "C", "text": "Like a Rolling Stone"}, {"id": "D", "text": "Mr. Tambourine Man"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Blowin' in the Wind (1963) became an anthem of the civil rights movement."
    },
    {
      question: "How many strings does a standard violin have?",
      choices: [{"id": "A", "text": "3"}, {"id": "B", "text": "4"}, {"id": "C", "text": "5"}, {"id": "D", "text": "6"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A violin has 4 strings tuned G, D, A, E."
    },
    {
      question: "What is the term for the musical symbol that raises a note by a half step?",
      choices: [{"id": "A", "text": "Flat"}, {"id": "B", "text": "Natural"}, {"id": "C", "text": "Sharp"}, {"id": "D", "text": "Double sharp"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A sharp (#) raises the pitch of a note by a semitone."
    },
    {
      question: "Which music festival is held annually in Glastonbury, England?",
      choices: [{"id": "A", "text": "Coachella"}, {"id": "B", "text": "Lollapalooza"}, {"id": "C", "text": "Glastonbury Festival"}, {"id": "D", "text": "Reading Festival"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Glastonbury Festival of Contemporary Performing Arts takes place in Somerset, England."
    },
    {
      question: "What instrument does a percussionist play?",
      choices: [{"id": "A", "text": "String instruments"}, {"id": "B", "text": "Wind instruments"}, {"id": "C", "text": "Rhythm and percussion instruments"}, {"id": "D", "text": "Keyboard instruments"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Percussionists play instruments that produce sound by being struck, shaken, or scraped."
    },
    {
      question: "Who is known as the 'Godfather of Soul'?",
      choices: [{"id": "A", "text": "Ray Charles"}, {"id": "B", "text": "Stevie Wonder"}, {"id": "C", "text": "James Brown"}, {"id": "D", "text": "Marvin Gaye"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "James Brown earned the title 'Godfather of Soul' for his influence on R&B and funk."
    },
    {
      question: "What does 'forte' mean in music?",
      choices: [{"id": "A", "text": "Slow"}, {"id": "B", "text": "Soft"}, {"id": "C", "text": "Loud"}, {"id": "D", "text": "Fast"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Forte (f) is the Italian term meaning loud or strong."
    },
    {
      question: "Which singer released '21' \u2014 one of the best-selling albums of all time?",
      choices: [{"id": "A", "text": "Adele"}, {"id": "B", "text": "Amy Winehouse"}, {"id": "C", "text": "Duffy"}, {"id": "D", "text": "Leona Lewis"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Adele's album 21 (2011) sold over 31 million copies worldwide."
    },
    {
      question: "What is the difference between major and minor keys in music?",
      choices: [{"id": "A", "text": "Major is louder"}, {"id": "B", "text": "Minor sounds darker or sadder, major sounds brighter or happier"}, {"id": "C", "text": "Major is faster"}, {"id": "D", "text": "Minor uses more instruments"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Minor keys typically evoke a darker or sadder mood compared to the brighter major keys."
    },
    {
      question: "Which Grammy-winning artist is known as 'The Weekend'?",
      choices: [{"id": "A", "text": "Drake"}, {"id": "B", "text": "Frank Ocean"}, {"id": "C", "text": "The Weeknd"}, {"id": "D", "text": "Khalid"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Weeknd (Abel Tesfaye) is a Canadian singer known for Blinding Lights and Starboy."
    },
    {
      question: "What is the name of the award given at the annual music ceremony in the U.S.?",
      choices: [{"id": "A", "text": "BRIT Award"}, {"id": "B", "text": "Mercury Prize"}, {"id": "C", "text": "Grammy Award"}, {"id": "D", "text": "American Music Award"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Grammy Awards are presented by the Recording Academy and recognize achievement in the music industry."
    },
  ],
  movies: [
    {
      question: "Which film won the first Academy Award for Best Picture?",
      choices: [{"id": "A", "text": "Sunrise"}, {"id": "B", "text": "Wings"}, {"id": "C", "text": "All Quiet on the Western Front"}, {"id": "D", "text": "Cimarron"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Wings (1927) won the first Academy Award for Best Picture in 1929."
    },
    {
      question: "Who directed 'Schindler's List'?",
      choices: [{"id": "A", "text": "Martin Scorsese"}, {"id": "B", "text": "Francis Ford Coppola"}, {"id": "C", "text": "Steven Spielberg"}, {"id": "D", "text": "Oliver Stone"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Steven Spielberg directed Schindler's List (1993), which won 7 Academy Awards."
    },
    {
      question: "Which movie features the quote 'I'll be back'?",
      choices: [{"id": "A", "text": "RoboCop"}, {"id": "B", "text": "Die Hard"}, {"id": "C", "text": "The Terminator"}, {"id": "D", "text": "Predator"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Arnold Schwarzenegger delivers this iconic line in The Terminator (1984)."
    },
    {
      question: "What is the highest-grossing film of all time (not adjusted for inflation)?",
      choices: [{"id": "A", "text": "Titanic"}, {"id": "B", "text": "Avatar"}, {"id": "C", "text": "Avengers: Endgame"}, {"id": "D", "text": "Avatar: The Way of Water"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Avatar: The Way of Water surpassed Avatar in 2023 to become the highest-grossing film."
    },
    {
      question: "Who played Iron Man in the Marvel Cinematic Universe?",
      choices: [{"id": "A", "text": "Chris Evans"}, {"id": "B", "text": "Chris Hemsworth"}, {"id": "C", "text": "Robert Downey Jr."}, {"id": "D", "text": "Mark Ruffalo"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Robert Downey Jr. portrayed Tony Stark / Iron Man across 10 MCU films."
    },
    {
      question: "Which animated film features the song 'Let It Go'?",
      choices: [{"id": "A", "text": "Tangled"}, {"id": "B", "text": "Brave"}, {"id": "C", "text": "Moana"}, {"id": "D", "text": "Frozen"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Let It Go is from Disney's Frozen (2013)."
    },
    {
      question: "What year was 'The Godfather' released?",
      choices: [{"id": "A", "text": "1969"}, {"id": "B", "text": "1972"}, {"id": "C", "text": "1974"}, {"id": "D", "text": "1976"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Godfather directed by Francis Ford Coppola was released in 1972."
    },
    {
      question: "Which actress has won the most Academy Awards for Best Actress?",
      choices: [{"id": "A", "text": "Meryl Streep"}, {"id": "B", "text": "Katharine Hepburn"}, {"id": "C", "text": "Cate Blanchett"}, {"id": "D", "text": "Bette Davis"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Katharine Hepburn won four Best Actress Oscars \u2014 more than any other performer."
    },
    {
      question: "Which studio produced the 'Toy Story' franchise?",
      choices: [{"id": "A", "text": "DreamWorks"}, {"id": "B", "text": "Disney"}, {"id": "C", "text": "Pixar"}, {"id": "D", "text": "Universal"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Pixar Animation Studios produced the Toy Story franchise."
    },
    {
      question: "What film features a character called 'the Joker' played by Heath Ledger?",
      choices: [{"id": "A", "text": "Batman Begins"}, {"id": "B", "text": "Batman Forever"}, {"id": "C", "text": "The Dark Knight"}, {"id": "D", "text": "Joker"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Heath Ledger's portrayal of the Joker in The Dark Knight (2008) won him a posthumous Oscar."
    },
    {
      question: "Who directed 'Pulp Fiction'?",
      choices: [{"id": "A", "text": "Martin Scorsese"}, {"id": "B", "text": "Joel Coen"}, {"id": "C", "text": "Quentin Tarantino"}, {"id": "D", "text": "David Fincher"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Quentin Tarantino wrote and directed Pulp Fiction (1994)."
    },
    {
      question: "Which film franchise features the character James Bond?",
      choices: [{"id": "A", "text": "Mission: Impossible"}, {"id": "B", "text": "Jason Bourne"}, {"id": "C", "text": "James Bond (007)"}, {"id": "D", "text": "The Spy Who Loved Me"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "James Bond is the central character in the 007 film franchise."
    },
    {
      question: "What is the name of the fictional African country in 'Black Panther'?",
      choices: [{"id": "A", "text": "Zamunda"}, {"id": "B", "text": "Genovia"}, {"id": "C", "text": "Wakanda"}, {"id": "D", "text": "Narnia"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Wakanda is the fictional African nation in Marvel's Black Panther."
    },
    {
      question: "Which film features the line 'You can't handle the truth!'?",
      choices: [{"id": "A", "text": "A Few Good Men"}, {"id": "B", "text": "The Firm"}, {"id": "C", "text": "Philadelphia"}, {"id": "D", "text": "JFK"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Jack Nicholson delivers this iconic line in A Few Good Men (1992)."
    },
    {
      question: "Who directed 'Jurassic Park'?",
      choices: [{"id": "A", "text": "George Lucas"}, {"id": "B", "text": "James Cameron"}, {"id": "C", "text": "Steven Spielberg"}, {"id": "D", "text": "Ron Howard"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Steven Spielberg directed Jurassic Park (1993)."
    },
    {
      question: "Which animated Disney film is set in ancient China?",
      choices: [{"id": "A", "text": "Raya and the Last Dragon"}, {"id": "B", "text": "Mulan"}, {"id": "C", "text": "Encanto"}, {"id": "D", "text": "Moana"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Mulan (1998) is set in ancient China and is based on the legend of Hua Mulan."
    },
    {
      question: "What does CGI stand for in filmmaking?",
      choices: [{"id": "A", "text": "Computer Generated Images"}, {"id": "B", "text": "Creative Graphics Interface"}, {"id": "C", "text": "Cinema Grade Imagery"}, {"id": "D", "text": "Color Graphics Inclusion"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "CGI stands for Computer Generated Imagery, used to create visual effects."
    },
    {
      question: "Which movie features a time-traveling DeLorean?",
      choices: [{"id": "A", "text": "The Terminator"}, {"id": "B", "text": "Interstellar"}, {"id": "C", "text": "Back to the Future"}, {"id": "D", "text": "Looper"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Back to the Future (1985) features a time machine built into a DeLorean DMC-12."
    },
    {
      question: "Who played Forrest Gump in the 1994 film?",
      choices: [{"id": "A", "text": "John Travolta"}, {"id": "B", "text": "Tom Hanks"}, {"id": "C", "text": "Kevin Costner"}, {"id": "D", "text": "Denzel Washington"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Tom Hanks won his second consecutive Oscar for playing Forrest Gump."
    },
    {
      question: "Which film series features the fictional spy organization SPECTRE?",
      choices: [{"id": "A", "text": "Mission: Impossible"}, {"id": "B", "text": "James Bond"}, {"id": "C", "text": "The Bourne Series"}, {"id": "D", "text": "Kingsman"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "SPECTRE is the criminal organization that serves as the main antagonist in several James Bond films."
    },
    {
      question: "What is the highest award given at the Cannes Film Festival?",
      choices: [{"id": "A", "text": "Golden Globe"}, {"id": "B", "text": "Palme d'Or"}, {"id": "C", "text": "Golden Lion"}, {"id": "D", "text": "Silver Bear"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Palme d'Or is the top prize awarded at the Cannes Film Festival."
    },
    {
      question: "Which actress played Katniss Everdeen in 'The Hunger Games'?",
      choices: [{"id": "A", "text": "Kristen Stewart"}, {"id": "B", "text": "Emma Watson"}, {"id": "C", "text": "Jennifer Lawrence"}, {"id": "D", "text": "Shailene Woodley"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Jennifer Lawrence starred as Katniss Everdeen in The Hunger Games franchise."
    },
    {
      question: "Who composed the iconic score for 'Star Wars'?",
      choices: [{"id": "A", "text": "Hans Zimmer"}, {"id": "B", "text": "Ennio Morricone"}, {"id": "C", "text": "John Williams"}, {"id": "D", "text": "Howard Shore"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "John Williams composed the Star Wars theme and has scored all main saga films."
    },
    {
      question: "Which film won the Academy Award for Best Picture in 2020?",
      choices: [{"id": "A", "text": "1917"}, {"id": "B", "text": "Joker"}, {"id": "C", "text": "Once Upon a Time in Hollywood"}, {"id": "D", "text": "Parasite"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Parasite by Bong Joon-ho became the first non-English film to win Best Picture."
    },
    {
      question: "Which actor played the role of Neo in 'The Matrix'?",
      choices: [{"id": "A", "text": "Will Smith"}, {"id": "B", "text": "Tom Cruise"}, {"id": "C", "text": "Keanu Reeves"}, {"id": "D", "text": "Laurence Fishburne"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Keanu Reeves played Thomas A. Anderson / Neo in The Matrix trilogy."
    },
    {
      question: "What year was the first 'Star Wars' film released?",
      choices: [{"id": "A", "text": "1975"}, {"id": "B", "text": "1977"}, {"id": "C", "text": "1979"}, {"id": "D", "text": "1980"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Star Wars: A New Hope was released on May 25, 1977."
    },
    {
      question: "Which film features the character of Hannibal Lecter?",
      choices: [{"id": "A", "text": "Psycho"}, {"id": "B", "text": "The Silence of the Lambs"}, {"id": "C", "text": "Se7en"}, {"id": "D", "text": "American Psycho"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Hannibal Lecter, played by Anthony Hopkins, appears in The Silence of the Lambs (1991)."
    },
    {
      question: "Which studio produced the 'Spider-Man' films starring Tobey Maguire?",
      choices: [{"id": "A", "text": "Marvel Studios"}, {"id": "B", "text": "Disney"}, {"id": "C", "text": "Sony Pictures"}, {"id": "D", "text": "Universal"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Sony Pictures produced the Sam Raimi Spider-Man trilogy (2002-2007)."
    },
    {
      question: "Who played the title character in the 2019 film 'Joker'?",
      choices: [{"id": "A", "text": "Heath Ledger"}, {"id": "B", "text": "Jared Leto"}, {"id": "C", "text": "Joaquin Phoenix"}, {"id": "D", "text": "Jack Nicholson"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Joaquin Phoenix won the Academy Award for Best Actor for his role in Joker (2019)."
    },
    {
      question: "What is the name of the whale in 'Free Willy'?",
      choices: [{"id": "A", "text": "Shamu"}, {"id": "B", "text": "Keiko"}, {"id": "C", "text": "Willy"}, {"id": "D", "text": "Orca"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The orca in Free Willy (1993) is named Willy."
    },
    {
      question: "Which director is known for films like 'Inception' and 'Interstellar'?",
      choices: [{"id": "A", "text": "Ridley Scott"}, {"id": "B", "text": "Christopher Nolan"}, {"id": "C", "text": "David Fincher"}, {"id": "D", "text": "Denis Villeneuve"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Christopher Nolan directed both Inception (2010) and Interstellar (2014)."
    },
    {
      question: "What genre is 'The Shawshank Redemption'?",
      choices: [{"id": "A", "text": "Thriller"}, {"id": "B", "text": "Horror"}, {"id": "C", "text": "Drama"}, {"id": "D", "text": "Action"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Shawshank Redemption (1994) is a drama about life in prison and hope."
    },
    {
      question: "Who voices Woody in the Toy Story films?",
      choices: [{"id": "A", "text": "Tom Hanks"}, {"id": "B", "text": "Tim Allen"}, {"id": "C", "text": "John Ratzenberger"}, {"id": "D", "text": "Don Rickles"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Tom Hanks has voiced Woody in all four Toy Story films."
    },
    {
      question: "Which city is 'La La Land' set in?",
      choices: [{"id": "A", "text": "New York"}, {"id": "B", "text": "San Francisco"}, {"id": "C", "text": "Los Angeles"}, {"id": "D", "text": "Chicago"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "La La Land (2016) is set in Los Angeles and features the entertainment industry."
    },
    {
      question: "What is the name of the shark in 'Finding Nemo'?",
      choices: [{"id": "A", "text": "Anchor"}, {"id": "B", "text": "Chum"}, {"id": "C", "text": "Bruce"}, {"id": "D", "text": "Jaws"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The great white shark in Finding Nemo (2003) is named Bruce."
    },
    {
      question: "Which film features the fictional country of Genovia?",
      choices: [{"id": "A", "text": "Shrek"}, {"id": "B", "text": "The Princess Diaries"}, {"id": "C", "text": "Enchanted"}, {"id": "D", "text": "A Cinderella Story"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Genovia is the fictional kingdom in The Princess Diaries (2001)."
    },
    {
      question: "Who played T'Challa / Black Panther in the MCU?",
      choices: [{"id": "A", "text": "Michael B. Jordan"}, {"id": "B", "text": "Idris Elba"}, {"id": "C", "text": "Chadwick Boseman"}, {"id": "D", "text": "Sterling K. Brown"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Chadwick Boseman portrayed King T'Challa until his passing in 2020."
    },
    {
      question: "What is the runtime of 'Avengers: Endgame'?",
      choices: [{"id": "A", "text": "2 hours 30 minutes"}, {"id": "B", "text": "2 hours 45 minutes"}, {"id": "C", "text": "3 hours 2 minutes"}, {"id": "D", "text": "3 hours 15 minutes"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Avengers: Endgame (2019) runs for 3 hours and 2 minutes."
    },
    {
      question: "In which film does a character say 'Here's looking at you, kid'?",
      choices: [{"id": "A", "text": "Gone with the Wind"}, {"id": "B", "text": "Citizen Kane"}, {"id": "C", "text": "Casablanca"}, {"id": "D", "text": "Rebecca"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Humphrey Bogart's Rick Blaine says this famous line in Casablanca (1942)."
    },
    {
      question: "Which streaming service released 'Squid Game'?",
      choices: [{"id": "A", "text": "HBO Max"}, {"id": "B", "text": "Amazon Prime"}, {"id": "C", "text": "Netflix"}, {"id": "D", "text": "Disney+"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Squid Game was released on Netflix in September 2021."
    },
    {
      question: "What is the name of the robot in 'WALL-E'?",
      choices: [{"id": "A", "text": "R2-D2"}, {"id": "B", "text": "EVE"}, {"id": "C", "text": "WALL-E"}, {"id": "D", "text": "HAL"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "WALL-E is the name of the waste-collecting robot in the 2008 Pixar film."
    },
    {
      question: "Who directed 'Get Out' (2017)?",
      choices: [{"id": "A", "text": "Spike Lee"}, {"id": "B", "text": "Ryan Coogler"}, {"id": "C", "text": "Jordan Peele"}, {"id": "D", "text": "Barry Jenkins"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Jordan Peele wrote and directed Get Out, winning the Oscar for Best Original Screenplay."
    },
    {
      question: "In 'The Lion King', what is the name of Simba's father?",
      choices: [{"id": "A", "text": "Scar"}, {"id": "B", "text": "Mufasa"}, {"id": "C", "text": "Rafiki"}, {"id": "D", "text": "Zazu"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Mufasa is Simba's father and king of the Pride Lands."
    },
    {
      question: "Which film won Best Picture at the 2022 Academy Awards?",
      choices: [{"id": "A", "text": "The Power of the Dog"}, {"id": "B", "text": "Belfast"}, {"id": "C", "text": "CODA"}, {"id": "D", "text": "Drive My Car"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "CODA won the Academy Award for Best Picture at the 2022 Oscars."
    },
    {
      question: "What nationality was director Alfred Hitchcock?",
      choices: [{"id": "A", "text": "American"}, {"id": "B", "text": "Australian"}, {"id": "C", "text": "British"}, {"id": "D", "text": "Canadian"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Alfred Hitchcock was born in Leytonstone, England."
    },
    {
      question: "Which superhero film features Gotham City?",
      choices: [{"id": "A", "text": "Superman"}, {"id": "B", "text": "Batman"}, {"id": "C", "text": "Spider-Man"}, {"id": "D", "text": "Iron Man"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Gotham City is the fictional home city of Batman."
    },
    {
      question: "Who played the role of Ellen Ripley in 'Alien'?",
      choices: [{"id": "A", "text": "Linda Hamilton"}, {"id": "B", "text": "Sigourney Weaver"}, {"id": "C", "text": "Jamie Lee Curtis"}, {"id": "D", "text": "Jodie Foster"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Sigourney Weaver created one of cinema's most iconic heroines as Ellen Ripley."
    },
    {
      question: "What is the subtitle of the second 'Hunger Games' film?",
      choices: [{"id": "A", "text": "Mockingjay"}, {"id": "B", "text": "Catching Fire"}, {"id": "C", "text": "The Quarter Quell"}, {"id": "D", "text": "The Victory Tour"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Hunger Games: Catching Fire (2013) is the second film in the franchise."
    },
    {
      question: "Which film featured the first CGI main character?",
      choices: [{"id": "A", "text": "Jurassic Park"}, {"id": "B", "text": "The Abyss"}, {"id": "C", "text": "Terminator 2"}, {"id": "D", "text": "Tron"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Jurassic Park (1993) broke ground with fully CGI-animated dinosaurs as central characters."
    },
    {
      question: "Who plays the role of Hermione Granger in the Harry Potter film series?",
      choices: [{"id": "A", "text": "Bonnie Wright"}, {"id": "B", "text": "Evanna Lynch"}, {"id": "C", "text": "Emma Watson"}, {"id": "D", "text": "Katie Leung"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Emma Watson portrayed Hermione Granger throughout all eight Harry Potter films."
    },
  ],
  history: [
    {
      question: "In which year did World War II end?",
      choices: [{"id": "A", "text": "1943"}, {"id": "B", "text": "1944"}, {"id": "C", "text": "1945"}, {"id": "D", "text": "1946"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "World War II ended in 1945 with Germany surrendering in May and Japan in September."
    },
    {
      question: "Who was the first man to walk on the moon?",
      choices: [{"id": "A", "text": "Buzz Aldrin"}, {"id": "B", "text": "Yuri Gagarin"}, {"id": "C", "text": "Neil Armstrong"}, {"id": "D", "text": "John Glenn"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Neil Armstrong became the first human to walk on the moon on July 20, 1969."
    },
    {
      question: "Which ancient wonder of the world still stands today?",
      choices: [{"id": "A", "text": "Hanging Gardens of Babylon"}, {"id": "B", "text": "Colossus of Rhodes"}, {"id": "C", "text": "Great Pyramid of Giza"}, {"id": "D", "text": "Lighthouse of Alexandria"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Great Pyramid of Giza is the only ancient wonder of the world still largely intact."
    },
    {
      question: "Who wrote the Communist Manifesto?",
      choices: [{"id": "A", "text": "Vladimir Lenin"}, {"id": "B", "text": "Joseph Stalin"}, {"id": "C", "text": "Karl Marx and Friedrich Engels"}, {"id": "D", "text": "Leon Trotsky"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Karl Marx and Friedrich Engels published The Communist Manifesto in 1848."
    },
    {
      question: "What event triggered the start of World War I?",
      choices: [{"id": "A", "text": "Germany invaded France"}, {"id": "B", "text": "Japan attacked Pearl Harbor"}, {"id": "C", "text": "Assassination of Archduke Franz Ferdinand"}, {"id": "D", "text": "The sinking of the Lusitania"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The assassination of Archduke Franz Ferdinand of Austria on June 28, 1914 triggered WWI."
    },
    {
      question: "Which empire was ruled by Julius Caesar?",
      choices: [{"id": "A", "text": "Greek Empire"}, {"id": "B", "text": "Ottoman Empire"}, {"id": "C", "text": "Roman Empire"}, {"id": "D", "text": "Persian Empire"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Julius Caesar was a Roman general and statesman of the Roman Republic and Empire."
    },
    {
      question: "Who was the first President of the United States?",
      choices: [{"id": "A", "text": "John Adams"}, {"id": "B", "text": "Thomas Jefferson"}, {"id": "C", "text": "Benjamin Franklin"}, {"id": "D", "text": "George Washington"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "George Washington served as the first U.S. President from 1789 to 1797."
    },
    {
      question: "In which country did the Industrial Revolution begin?",
      choices: [{"id": "A", "text": "France"}, {"id": "B", "text": "Germany"}, {"id": "C", "text": "United States"}, {"id": "D", "text": "Britain"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Industrial Revolution began in Britain in the mid-18th century."
    },
    {
      question: "What was the name of the ship that sank on its maiden voyage in 1912?",
      choices: [{"id": "A", "text": "Britannic"}, {"id": "B", "text": "Olympic"}, {"id": "C", "text": "Lusitania"}, {"id": "D", "text": "Titanic"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "RMS Titanic sank on April 15, 1912 after hitting an iceberg."
    },
    {
      question: "Who led the Cuban Revolution?",
      choices: [{"id": "A", "text": "Che Guevara"}, {"id": "B", "text": "Ra\u00fal Castro"}, {"id": "C", "text": "Fidel Castro"}, {"id": "D", "text": "Camilo Cienfuegos"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Fidel Castro led the Cuban Revolution that overthrew the Batista government in 1959."
    },
    {
      question: "What year did the Berlin Wall fall?",
      choices: [{"id": "A", "text": "1987"}, {"id": "B", "text": "1988"}, {"id": "C", "text": "1989"}, {"id": "D", "text": "1990"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Berlin Wall fell on November 9, 1989."
    },
    {
      question: "Which civilization built the Machu Picchu citadel?",
      choices: [{"id": "A", "text": "Aztec"}, {"id": "B", "text": "Mayan"}, {"id": "C", "text": "Incan"}, {"id": "D", "text": "Olmec"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Machu Picchu was built by the Inca Empire in the 15th century."
    },
    {
      question: "Who was the first female Prime Minister of the United Kingdom?",
      choices: [{"id": "A", "text": "Theresa May"}, {"id": "B", "text": "Angela Merkel"}, {"id": "C", "text": "Margaret Thatcher"}, {"id": "D", "text": "Indira Gandhi"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Margaret Thatcher served as UK Prime Minister from 1979 to 1990."
    },
    {
      question: "What was the name of the project that developed the first atomic bomb?",
      choices: [{"id": "A", "text": "Project Anvil"}, {"id": "B", "text": "Operation Overlord"}, {"id": "C", "text": "The Manhattan Project"}, {"id": "D", "text": "Operation Trinity"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Manhattan Project was the U.S.-led program that developed the first nuclear weapons during WWII."
    },
    {
      question: "Which country was the first to give women the right to vote?",
      choices: [{"id": "A", "text": "United States"}, {"id": "B", "text": "United Kingdom"}, {"id": "C", "text": "Australia"}, {"id": "D", "text": "New Zealand"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "New Zealand was the first self-governing country to grant women the right to vote in 1893."
    },
    {
      question: "Who was the Egyptian queen who had affairs with Julius Caesar and Mark Antony?",
      choices: [{"id": "A", "text": "Nefertiti"}, {"id": "B", "text": "Hatshepsut"}, {"id": "C", "text": "Cleopatra"}, {"id": "D", "text": "Nefertari"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Cleopatra VII was the last active ruler of the Ptolemaic Kingdom of Egypt."
    },
    {
      question: "In which year did the American Civil War begin?",
      choices: [{"id": "A", "text": "1858"}, {"id": "B", "text": "1860"}, {"id": "C", "text": "1861"}, {"id": "D", "text": "1863"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The American Civil War began on April 12, 1861 with the Confederate attack on Fort Sumter."
    },
    {
      question: "Who was the leader of Nazi Germany during World War II?",
      choices: [{"id": "A", "text": "Heinrich Himmler"}, {"id": "B", "text": "Hermann G\u00f6ring"}, {"id": "C", "text": "Joseph Goebbels"}, {"id": "D", "text": "Adolf Hitler"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Adolf Hitler served as Chancellor and F\u00fchrer of Nazi Germany from 1933 to 1945."
    },
    {
      question: "What ancient structure was built to protect China from northern invasions?",
      choices: [{"id": "A", "text": "The Forbidden City"}, {"id": "B", "text": "The Great Wall of China"}, {"id": "C", "text": "The Summer Palace"}, {"id": "D", "text": "The Temple of Heaven"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Great Wall of China was built over centuries to protect against nomadic invasions from the north."
    },
    {
      question: "Who was the first European to reach the Americas in 1492?",
      choices: [{"id": "A", "text": "Ferdinand Magellan"}, {"id": "B", "text": "Amerigo Vespucci"}, {"id": "C", "text": "Vasco da Gama"}, {"id": "D", "text": "Christopher Columbus"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Christopher Columbus reached the Americas on October 12, 1492 during his first voyage."
    },
    {
      question: "Which revolution took place in France in 1789?",
      choices: [{"id": "A", "text": "The Industrial Revolution"}, {"id": "B", "text": "The French Revolution"}, {"id": "C", "text": "The Glorious Revolution"}, {"id": "D", "text": "The American Revolution"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The French Revolution began in 1789, overthrowing the monarchy and establishing a republic."
    },
    {
      question: "What was the name of the first artificial satellite launched into space?",
      choices: [{"id": "A", "text": "Explorer 1"}, {"id": "B", "text": "Vostok 1"}, {"id": "C", "text": "Sputnik 1"}, {"id": "D", "text": "Luna 1"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Soviet Union launched Sputnik 1 on October 4, 1957, the first artificial Earth satellite."
    },
    {
      question: "Which U.S. President issued the Emancipation Proclamation?",
      choices: [{"id": "A", "text": "Ulysses S. Grant"}, {"id": "B", "text": "Andrew Johnson"}, {"id": "C", "text": "Abraham Lincoln"}, {"id": "D", "text": "James Buchanan"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "President Abraham Lincoln issued the Emancipation Proclamation on January 1, 1863."
    },
    {
      question: "In what year did India gain independence from Britain?",
      choices: [{"id": "A", "text": "1945"}, {"id": "B", "text": "1947"}, {"id": "C", "text": "1949"}, {"id": "D", "text": "1952"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "India gained independence on August 15, 1947."
    },
    {
      question: "What was the name of the first human spaceflight mission?",
      choices: [{"id": "A", "text": "Apollo 11"}, {"id": "B", "text": "Mercury-Redstone 3"}, {"id": "C", "text": "Vostok 1"}, {"id": "D", "text": "Gemini 1"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Vostok 1 carried Yuri Gagarin into space on April 12, 1961 \u2014 the first human spaceflight."
    },
    {
      question: "Which empire was the largest in history by land area?",
      choices: [{"id": "A", "text": "Roman Empire"}, {"id": "B", "text": "British Empire"}, {"id": "C", "text": "Mongol Empire"}, {"id": "D", "text": "Ottoman Empire"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Mongol Empire was the largest contiguous land empire in history."
    },
    {
      question: "Who was South Africa's first Black president?",
      choices: [{"id": "A", "text": "Desmond Tutu"}, {"id": "B", "text": "Thabo Mbeki"}, {"id": "C", "text": "Nelson Mandela"}, {"id": "D", "text": "Walter Sisulu"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Nelson Mandela became South Africa's first Black president in 1994."
    },
    {
      question: "What was the name of the economic policy in the U.S. that helped recovery from the Great Depression?",
      choices: [{"id": "A", "text": "The Fair Deal"}, {"id": "B", "text": "The New Deal"}, {"id": "C", "text": "The Square Deal"}, {"id": "D", "text": "The Great Society"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "President Franklin D. Roosevelt's New Deal was a series of programs to aid recovery from the Depression."
    },
    {
      question: "In which year did the Soviet Union collapse?",
      choices: [{"id": "A", "text": "1989"}, {"id": "B", "text": "1990"}, {"id": "C", "text": "1991"}, {"id": "D", "text": "1992"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Soviet Union officially dissolved on December 25, 1991."
    },
    {
      question: "Which country was the first to land a spacecraft on the moon?",
      choices: [{"id": "A", "text": "United States"}, {"id": "B", "text": "Soviet Union"}, {"id": "C", "text": "China"}, {"id": "D", "text": "France"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Soviet Luna 9 was the first spacecraft to successfully soft-land on the moon in 1966."
    },
    {
      question: "Who was the leader of the civil rights movement in the United States?",
      choices: [{"id": "A", "text": "Malcolm X"}, {"id": "B", "text": "Thurgood Marshall"}, {"id": "C", "text": "John Lewis"}, {"id": "D", "text": "Martin Luther King Jr."}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Dr. Martin Luther King Jr. was the most visible leader of the American civil rights movement."
    },
    {
      question: "What was the name of the disease that killed approximately 50 million people in 1918?",
      choices: [{"id": "A", "text": "Bubonic Plague"}, {"id": "B", "text": "Typhoid Fever"}, {"id": "C", "text": "Spanish Flu"}, {"id": "D", "text": "Cholera"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The 1918 Spanish Flu pandemic infected 500 million people and killed an estimated 50 million."
    },
    {
      question: "Which European explorer first circumnavigated the globe?",
      choices: [{"id": "A", "text": "Christopher Columbus"}, {"id": "B", "text": "Hern\u00e1n Cort\u00e9s"}, {"id": "C", "text": "Vasco da Gama"}, {"id": "D", "text": "Ferdinand Magellan"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Ferdinand Magellan's expedition (1519-1522) was the first to circumnavigate the globe, though he died en route."
    },
    {
      question: "Where was Napoleon Bonaparte born?",
      choices: [{"id": "A", "text": "France"}, {"id": "B", "text": "Italy"}, {"id": "C", "text": "Spain"}, {"id": "D", "text": "Corsica"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Napoleon was born on the island of Corsica on August 15, 1769."
    },
    {
      question: "What was the name of the policy of racial segregation in South Africa?",
      choices: [{"id": "A", "text": "Jim Crow"}, {"id": "B", "text": "Apartheid"}, {"id": "C", "text": "Segregation"}, {"id": "D", "text": "Discrimination"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Apartheid was the system of institutionalized racial segregation in South Africa from 1948 to 1994."
    },
    {
      question: "Which battle ended Napoleon's rule in Europe?",
      choices: [{"id": "A", "text": "Battle of Trafalgar"}, {"id": "B", "text": "Battle of Austerlitz"}, {"id": "C", "text": "Battle of Waterloo"}, {"id": "D", "text": "Battle of Leipzig"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Napoleon was decisively defeated at the Battle of Waterloo on June 18, 1815."
    },
    {
      question: "Who invented the printing press in the 15th century?",
      choices: [{"id": "A", "text": "Leonardo da Vinci"}, {"id": "B", "text": "Nicolaus Copernicus"}, {"id": "C", "text": "Johannes Gutenberg"}, {"id": "D", "text": "Galileo Galilei"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Johannes Gutenberg invented the movable-type printing press around 1440."
    },
    {
      question: "In what year did the United States declare independence?",
      choices: [{"id": "A", "text": "1774"}, {"id": "B", "text": "1775"}, {"id": "C", "text": "1776"}, {"id": "D", "text": "1777"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The United States declared independence from Britain on July 4, 1776."
    },
    {
      question: "Which country did Germany invade to start World War II?",
      choices: [{"id": "A", "text": "France"}, {"id": "B", "text": "Belgium"}, {"id": "C", "text": "Austria"}, {"id": "D", "text": "Poland"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Germany's invasion of Poland on September 1, 1939 marked the beginning of World War II."
    },
    {
      question: "Who was the first woman to win a Nobel Prize?",
      choices: [{"id": "A", "text": "Rosalind Franklin"}, {"id": "B", "text": "Dorothy Hodgkin"}, {"id": "C", "text": "Marie Curie"}, {"id": "D", "text": "Lise Meitner"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Marie Curie won the Nobel Prize in Physics in 1903 and later in Chemistry in 1911."
    },
    {
      question: "What was the name of the ship on which Charles Darwin traveled to develop his theory of evolution?",
      choices: [{"id": "A", "text": "HMS Victory"}, {"id": "B", "text": "HMS Endeavour"}, {"id": "C", "text": "HMS Beagle"}, {"id": "D", "text": "HMS Discovery"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Darwin sailed on HMS Beagle from 1831 to 1836, observing species that led to his theory."
    },
    {
      question: "Which civilization constructed the Colosseum in Rome?",
      choices: [{"id": "A", "text": "Greek"}, {"id": "B", "text": "Byzantine"}, {"id": "C", "text": "Ottoman"}, {"id": "D", "text": "Roman"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Roman Colosseum was built between 70-80 AD under emperors Vespasian and Titus."
    },
    {
      question: "What was the name of the first president of the Soviet Union?",
      choices: [{"id": "A", "text": "Joseph Stalin"}, {"id": "B", "text": "Leon Trotsky"}, {"id": "C", "text": "Vladimir Lenin"}, {"id": "D", "text": "Nikita Khrushchev"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Vladimir Lenin was the first leader of the Soviet Union from 1917 until his death in 1924."
    },
    {
      question: "In which year was the Magna Carta signed?",
      choices: [{"id": "A", "text": "1066"}, {"id": "B", "text": "1215"}, {"id": "C", "text": "1348"}, {"id": "D", "text": "1453"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Magna Carta was signed by King John of England at Runnymede on June 15, 1215."
    },
    {
      question: "What was the name of the trading network connecting China to Europe?",
      choices: [{"id": "A", "text": "The Spice Route"}, {"id": "B", "text": "The Amber Road"}, {"id": "C", "text": "The Silk Road"}, {"id": "D", "text": "The Trans-Saharan Route"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Silk Road was an ancient network of trade routes connecting East Asia to Europe."
    },
    {
      question: "Who was the first Emperor of unified China?",
      choices: [{"id": "A", "text": "Kublai Khan"}, {"id": "B", "text": "Genghis Khan"}, {"id": "C", "text": "Qin Shi Huang"}, {"id": "D", "text": "Emperor Wu"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Qin Shi Huang unified China in 221 BC and became its first emperor."
    },
    {
      question: "Which country was known as the 'sick man of Europe' in the 19th century?",
      choices: [{"id": "A", "text": "Austria-Hungary"}, {"id": "B", "text": "Spain"}, {"id": "C", "text": "Ottoman Empire"}, {"id": "D", "text": "France"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Ottoman Empire was nicknamed the 'sick man of Europe' due to its declining power."
    },
    {
      question: "What was the name of the U.S. spy plane shot down over the Soviet Union in 1960?",
      choices: [{"id": "A", "text": "SR-71"}, {"id": "B", "text": "B-52"}, {"id": "C", "text": "U-2"}, {"id": "D", "text": "F-86"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Lockheed U-2 spy plane was shot down over Soviet territory in the 1960 U-2 incident."
    },
    {
      question: "Who led the march to the sea during the American Civil War?",
      choices: [{"id": "A", "text": "Ulysses S. Grant"}, {"id": "B", "text": "George McClellan"}, {"id": "C", "text": "William Sherman"}, {"id": "D", "text": "Philip Sheridan"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "General William Tecumseh Sherman led his famous March to the Sea through Georgia in 1864."
    },
    {
      question: "What is the name of the ancient Egyptian writing system using pictorial symbols?",
      choices: [{"id": "A", "text": "Cuneiform"}, {"id": "B", "text": "Hieroglyphics"}, {"id": "C", "text": "Linear B"}, {"id": "D", "text": "Sanskrit"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Hieroglyphics was the formal writing system used in Ancient Egypt."
    },
  ],
  geography: [
    {
      question: "What is the longest river in the world?",
      choices: [{"id": "A", "text": "Amazon"}, {"id": "B", "text": "Mississippi"}, {"id": "C", "text": "Yangtze"}, {"id": "D", "text": "Nile"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Nile River, stretching approximately 6,650 km, is generally considered the world's longest river."
    },
    {
      question: "Which country has the largest land area in the world?",
      choices: [{"id": "A", "text": "China"}, {"id": "B", "text": "Canada"}, {"id": "C", "text": "USA"}, {"id": "D", "text": "Russia"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Russia is the world's largest country by land area at 17.1 million km\u00b2."
    },
    {
      question: "What is the smallest country in the world by area?",
      choices: [{"id": "A", "text": "Monaco"}, {"id": "B", "text": "Nauru"}, {"id": "C", "text": "San Marino"}, {"id": "D", "text": "Vatican City"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Vatican City covers only 0.44 km\u00b2, making it the world's smallest country."
    },
    {
      question: "Which is the world's most populous country?",
      choices: [{"id": "A", "text": "India"}, {"id": "B", "text": "China"}, {"id": "C", "text": "USA"}, {"id": "D", "text": "Indonesia"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "India surpassed China in 2023 to become the world's most populous nation."
    },
    {
      question: "What is the capital city of Canada?",
      choices: [{"id": "A", "text": "Toronto"}, {"id": "B", "text": "Vancouver"}, {"id": "C", "text": "Montreal"}, {"id": "D", "text": "Ottawa"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Ottawa is the capital of Canada, located in Ontario."
    },
    {
      question: "Which continent is the Sahara Desert located on?",
      choices: [{"id": "A", "text": "Asia"}, {"id": "B", "text": "Middle East"}, {"id": "C", "text": "Australia"}, {"id": "D", "text": "Africa"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Sahara Desert, the world's largest hot desert, is located in North Africa."
    },
    {
      question: "What is the name of the sea between Europe and Africa?",
      choices: [{"id": "A", "text": "Red Sea"}, {"id": "B", "text": "Black Sea"}, {"id": "C", "text": "Mediterranean Sea"}, {"id": "D", "text": "Caspian Sea"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Mediterranean Sea borders southern Europe, northern Africa, and western Asia."
    },
    {
      question: "Which mountain range separates Europe and Asia?",
      choices: [{"id": "A", "text": "Alps"}, {"id": "B", "text": "Carpathians"}, {"id": "C", "text": "Urals"}, {"id": "D", "text": "Caucasus"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Ural Mountains form the traditional boundary between Europe and Asia."
    },
    {
      question: "What is the world's smallest continent?",
      choices: [{"id": "A", "text": "Europe"}, {"id": "B", "text": "Antarctica"}, {"id": "C", "text": "Australia"}, {"id": "D", "text": "South America"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Australia is both a country and the world's smallest continent."
    },
    {
      question: "Which country has the most natural lakes in the world?",
      choices: [{"id": "A", "text": "Russia"}, {"id": "B", "text": "USA"}, {"id": "C", "text": "Finland"}, {"id": "D", "text": "Canada"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Canada has over 60% of the world's natural lakes \u2014 more than 2 million."
    },
    {
      question: "What is the capital of Brazil?",
      choices: [{"id": "A", "text": "S\u00e3o Paulo"}, {"id": "B", "text": "Rio de Janeiro"}, {"id": "C", "text": "Bras\u00edlia"}, {"id": "D", "text": "Salvador"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Bras\u00edlia has been Brazil's capital since 1960, replacing Rio de Janeiro."
    },
    {
      question: "Which is the deepest lake in the world?",
      choices: [{"id": "A", "text": "Caspian Sea"}, {"id": "B", "text": "Lake Superior"}, {"id": "C", "text": "Lake Victoria"}, {"id": "D", "text": "Lake Baikal"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Lake Baikal in Siberia, Russia is the world's deepest lake at 1,642 meters."
    },
    {
      question: "What is the largest desert in the world?",
      choices: [{"id": "A", "text": "Sahara"}, {"id": "B", "text": "Arabian"}, {"id": "C", "text": "Gobi"}, {"id": "D", "text": "Antarctic"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Antarctica is technically the world's largest desert (cold desert) at 14.2 million km\u00b2."
    },
    {
      question: "Which ocean is the smallest in the world?",
      choices: [{"id": "A", "text": "Indian Ocean"}, {"id": "B", "text": "Southern Ocean"}, {"id": "C", "text": "Arctic Ocean"}, {"id": "D", "text": "Atlantic Ocean"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Arctic Ocean is the world's smallest and shallowest ocean."
    },
    {
      question: "What is the capital of Japan?",
      choices: [{"id": "A", "text": "Osaka"}, {"id": "B", "text": "Kyoto"}, {"id": "C", "text": "Hiroshima"}, {"id": "D", "text": "Tokyo"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Tokyo is the capital and largest city of Japan."
    },
    {
      question: "Which country does the Amazon rainforest primarily span?",
      choices: [{"id": "A", "text": "Colombia"}, {"id": "B", "text": "Peru"}, {"id": "C", "text": "Venezuela"}, {"id": "D", "text": "Brazil"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Approximately 60% of the Amazon rainforest is located in Brazil."
    },
    {
      question: "What is the name of the strait connecting the Atlantic and Pacific Oceans?",
      choices: [{"id": "A", "text": "Strait of Gibraltar"}, {"id": "B", "text": "Strait of Magellan"}, {"id": "C", "text": "Drake Passage"}, {"id": "D", "text": "Bering Strait"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The Strait of Magellan, discovered by Ferdinand Magellan, connects the two oceans at the tip of South America."
    },
    {
      question: "Which country has the longest coastline in the world?",
      choices: [{"id": "A", "text": "Russia"}, {"id": "B", "text": "Norway"}, {"id": "C", "text": "USA"}, {"id": "D", "text": "Canada"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Canada has the world's longest coastline at approximately 202,080 km."
    },
    {
      question: "What is the capital city of Australia?",
      choices: [{"id": "A", "text": "Sydney"}, {"id": "B", "text": "Melbourne"}, {"id": "C", "text": "Brisbane"}, {"id": "D", "text": "Canberra"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Canberra is Australia's capital, chosen as a compromise between Sydney and Melbourne."
    },
    {
      question: "Which African country has the largest population?",
      choices: [{"id": "A", "text": "South Africa"}, {"id": "B", "text": "Kenya"}, {"id": "C", "text": "Ethiopia"}, {"id": "D", "text": "Nigeria"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Nigeria is Africa's most populous nation with over 220 million people."
    },
    {
      question: "What is the name of the world's largest coral reef system?",
      choices: [{"id": "A", "text": "Florida Reef"}, {"id": "B", "text": "Mesoamerican Barrier Reef"}, {"id": "C", "text": "Great Barrier Reef"}, {"id": "D", "text": "Red Sea Coral Reef"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Australia's Great Barrier Reef is the world's largest coral reef system, spanning over 2,300 km."
    },
    {
      question: "Which European country is shaped like a boot?",
      choices: [{"id": "A", "text": "Spain"}, {"id": "B", "text": "Greece"}, {"id": "C", "text": "Portugal"}, {"id": "D", "text": "Italy"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Italy is famously shaped like a boot, extending into the Mediterranean Sea."
    },
    {
      question: "What is the world's highest waterfall?",
      choices: [{"id": "A", "text": "Niagara Falls"}, {"id": "B", "text": "Victoria Falls"}, {"id": "C", "text": "Iguazu Falls"}, {"id": "D", "text": "Angel Falls"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Angel Falls in Venezuela is the world's highest uninterrupted waterfall at 979 meters."
    },
    {
      question: "Which country has the most UNESCO World Heritage Sites?",
      choices: [{"id": "A", "text": "China"}, {"id": "B", "text": "France"}, {"id": "C", "text": "Spain"}, {"id": "D", "text": "Italy"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Italy has the most UNESCO World Heritage Sites of any country."
    },
    {
      question: "What is the capital of South Africa's legislative branch?",
      choices: [{"id": "A", "text": "Johannesburg"}, {"id": "B", "text": "Pretoria"}, {"id": "C", "text": "Cape Town"}, {"id": "D", "text": "Durban"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Cape Town is South Africa's legislative capital, home to the Parliament."
    },
    {
      question: "Which two countries share the longest international border?",
      choices: [{"id": "A", "text": "Russia and China"}, {"id": "B", "text": "USA and Mexico"}, {"id": "C", "text": "Brazil and Argentina"}, {"id": "D", "text": "USA and Canada"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The US-Canada border stretches 8,891 km \u2014 the world's longest international border."
    },
    {
      question: "What is the name of the volcanic island chain in the Pacific known as the Ring of Fire?",
      choices: [{"id": "A", "text": "Hawaiian Islands"}, {"id": "B", "text": "Galapagos Islands"}, {"id": "C", "text": "Aleutian Islands"}, {"id": "D", "text": "Mariana Islands"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Aleutian Islands form a key part of the Pacific Ring of Fire."
    },
    {
      question: "Which river runs through Egypt and empties into the Mediterranean?",
      choices: [{"id": "A", "text": "Congo"}, {"id": "B", "text": "Zambezi"}, {"id": "C", "text": "Niger"}, {"id": "D", "text": "Nile"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Nile flows northward through Egypt and empties into the Mediterranean Sea."
    },
    {
      question: "What is the name of the sea between Saudi Arabia and Africa?",
      choices: [{"id": "A", "text": "Persian Gulf"}, {"id": "B", "text": "Arabian Sea"}, {"id": "C", "text": "Indian Ocean"}, {"id": "D", "text": "Red Sea"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Red Sea separates the Arabian Peninsula from northeastern Africa."
    },
    {
      question: "Which country is home to the Eiffel Tower?",
      choices: [{"id": "A", "text": "Belgium"}, {"id": "B", "text": "Italy"}, {"id": "C", "text": "Spain"}, {"id": "D", "text": "France"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Eiffel Tower is located in Paris, France."
    },
    {
      question: "What is the name of the peninsula shared by Spain and Portugal?",
      choices: [{"id": "A", "text": "Italian Peninsula"}, {"id": "B", "text": "Balkan Peninsula"}, {"id": "C", "text": "Scandinavian Peninsula"}, {"id": "D", "text": "Iberian Peninsula"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Spain and Portugal share the Iberian Peninsula in southwestern Europe."
    },
    {
      question: "Which South American country is home to the Galapagos Islands?",
      choices: [{"id": "A", "text": "Peru"}, {"id": "B", "text": "Colombia"}, {"id": "C", "text": "Chile"}, {"id": "D", "text": "Ecuador"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Galapagos Islands are an archipelago belonging to Ecuador."
    },
    {
      question: "What is the name of the mountain range running through South America?",
      choices: [{"id": "A", "text": "Rockies"}, {"id": "B", "text": "Sierra Madre"}, {"id": "C", "text": "Appalachians"}, {"id": "D", "text": "Andes"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Andes is the world's longest continental mountain range, running through western South America."
    },
    {
      question: "Which country has the largest area in South America?",
      choices: [{"id": "A", "text": "Argentina"}, {"id": "B", "text": "Colombia"}, {"id": "C", "text": "Peru"}, {"id": "D", "text": "Brazil"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Brazil is the largest country in South America, covering 8.5 million km\u00b2."
    },
    {
      question: "What is the name of the body of water between mainland China and Taiwan?",
      choices: [{"id": "A", "text": "South China Sea"}, {"id": "B", "text": "East China Sea"}, {"id": "C", "text": "Taiwan Strait"}, {"id": "D", "text": "Luzon Strait"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Taiwan Strait separates the island of Taiwan from mainland China."
    },
    {
      question: "Which country has the largest population in Europe?",
      choices: [{"id": "A", "text": "Germany"}, {"id": "B", "text": "France"}, {"id": "C", "text": "United Kingdom"}, {"id": "D", "text": "Russia"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Russia has the largest population in Europe with approximately 145 million people."
    },
    {
      question: "What is the name of the plateau that covers much of Tibet?",
      choices: [{"id": "A", "text": "Deccan Plateau"}, {"id": "B", "text": "Iranian Plateau"}, {"id": "C", "text": "Tibetan Plateau"}, {"id": "D", "text": "Mongolian Plateau"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Tibetan Plateau is the world's highest plateau, averaging 4,500 meters above sea level."
    },
    {
      question: "Which ocean lies between Africa and Australia?",
      choices: [{"id": "A", "text": "Pacific Ocean"}, {"id": "B", "text": "Atlantic Ocean"}, {"id": "C", "text": "Arctic Ocean"}, {"id": "D", "text": "Indian Ocean"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Indian Ocean is bounded by Africa to the west and Australia to the east."
    },
    {
      question: "What is the capital of Argentina?",
      choices: [{"id": "A", "text": "Montevideo"}, {"id": "B", "text": "Santiago"}, {"id": "C", "text": "Lima"}, {"id": "D", "text": "Buenos Aires"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Buenos Aires is the capital and largest city of Argentina."
    },
    {
      question: "Which is the largest island in the world?",
      choices: [{"id": "A", "text": "Borneo"}, {"id": "B", "text": "Madagascar"}, {"id": "C", "text": "New Guinea"}, {"id": "D", "text": "Greenland"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Greenland is the world's largest island with an area of 2.16 million km\u00b2."
    },
    {
      question: "What is the name of the narrow strip of land connecting North and South America?",
      choices: [{"id": "A", "text": "Isthmus of Tehuantepec"}, {"id": "B", "text": "Panama Canal"}, {"id": "C", "text": "Isthmus of Panama"}, {"id": "D", "text": "Darien Gap"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Isthmus of Panama is the narrow strip of land connecting North and South America."
    },
    {
      question: "Which country contains the most time zones?",
      choices: [{"id": "A", "text": "Russia"}, {"id": "B", "text": "USA"}, {"id": "C", "text": "China"}, {"id": "D", "text": "France"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "France has 12 time zones due to its overseas territories, the most of any country."
    },
    {
      question: "What is the name of the large Japanese island that includes Tokyo?",
      choices: [{"id": "A", "text": "Shikoku"}, {"id": "B", "text": "Kyushu"}, {"id": "C", "text": "Hokkaido"}, {"id": "D", "text": "Honshu"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Honshu is Japan's largest island, home to Tokyo, Osaka, and most of Japan's population."
    },
    {
      question: "Which country is home to Kilimanjaro, Africa's highest mountain?",
      choices: [{"id": "A", "text": "Kenya"}, {"id": "B", "text": "Uganda"}, {"id": "C", "text": "Ethiopia"}, {"id": "D", "text": "Tanzania"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Mount Kilimanjaro is located in northeastern Tanzania, near the Kenyan border."
    },
    {
      question: "What is the world's largest bay?",
      choices: [{"id": "A", "text": "Bay of Bengal"}, {"id": "B", "text": "Hudson Bay"}, {"id": "C", "text": "Gulf of Mexico"}, {"id": "D", "text": "Bay of Biscay"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "The Bay of Bengal is the world's largest bay, covering approximately 2.17 million km\u00b2."
    },
    {
      question: "Which country has the most islands in the world?",
      choices: [{"id": "A", "text": "Indonesia"}, {"id": "B", "text": "Philippines"}, {"id": "C", "text": "Canada"}, {"id": "D", "text": "Sweden"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Sweden has over 220,000 islands, the most of any country in the world."
    },
    {
      question: "What is the name of the world's longest mountain range?",
      choices: [{"id": "A", "text": "Himalayas"}, {"id": "B", "text": "Rocky Mountains"}, {"id": "C", "text": "Alps"}, {"id": "D", "text": "Andes"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Andes in South America is the world's longest continental mountain range at about 7,000 km."
    },
    {
      question: "Which country is home to the ancient ruins of Petra?",
      choices: [{"id": "A", "text": "Egypt"}, {"id": "B", "text": "Israel"}, {"id": "C", "text": "Syria"}, {"id": "D", "text": "Jordan"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Petra is a famous archaeological city in southern Jordan."
    },
    {
      question: "What is the name of the archipelago where Darwin developed his theory of evolution?",
      choices: [{"id": "A", "text": "Canary Islands"}, {"id": "B", "text": "Maldives"}, {"id": "C", "text": "Galapagos Islands"}, {"id": "D", "text": "Hawaiian Islands"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Charles Darwin made key observations on the Galapagos Islands that informed his theory of evolution."
    },
    {
      question: "Which country has the largest economy in Africa?",
      choices: [{"id": "A", "text": "South Africa"}, {"id": "B", "text": "Kenya"}, {"id": "C", "text": "Ethiopia"}, {"id": "D", "text": "Nigeria"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Nigeria has the largest economy in Africa by GDP."
    },
  ],
  science: [
    {
      question: "What is the most abundant gas in Earth's atmosphere?",
      choices: [{"id": "A", "text": "Oxygen"}, {"id": "B", "text": "Carbon Dioxide"}, {"id": "C", "text": "Argon"}, {"id": "D", "text": "Nitrogen"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Nitrogen makes up approximately 78% of Earth's atmosphere."
    },
    {
      question: "What is the speed of light in a vacuum?",
      choices: [{"id": "A", "text": "300,000 km/s"}, {"id": "B", "text": "150,000 km/s"}, {"id": "C", "text": "450,000 km/s"}, {"id": "D", "text": "600,000 km/s"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Light travels at approximately 299,792 km/s (about 300,000 km/s) in a vacuum."
    },
    {
      question: "What is the powerhouse of the cell?",
      choices: [{"id": "A", "text": "Nucleus"}, {"id": "B", "text": "Ribosome"}, {"id": "C", "text": "Endoplasmic reticulum"}, {"id": "D", "text": "Mitochondria"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Mitochondria produce ATP (energy) through cellular respiration."
    },
    {
      question: "What is the chemical formula for water?",
      choices: [{"id": "A", "text": "HO"}, {"id": "B", "text": "H2O"}, {"id": "C", "text": "H2O2"}, {"id": "D", "text": "H3O"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Water consists of two hydrogen atoms and one oxygen atom (H\u2082O)."
    },
    {
      question: "Which planet is closest to the Sun?",
      choices: [{"id": "A", "text": "Venus"}, {"id": "B", "text": "Earth"}, {"id": "C", "text": "Mars"}, {"id": "D", "text": "Mercury"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Mercury is the closest planet to the Sun, orbiting at an average distance of 58 million km."
    },
    {
      question: "What is the atomic number of carbon?",
      choices: [{"id": "A", "text": "4"}, {"id": "B", "text": "6"}, {"id": "C", "text": "8"}, {"id": "D", "text": "12"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Carbon has an atomic number of 6, meaning it has 6 protons in its nucleus."
    },
    {
      question: "What is the process by which plants make food using sunlight?",
      choices: [{"id": "A", "text": "Respiration"}, {"id": "B", "text": "Transpiration"}, {"id": "C", "text": "Fermentation"}, {"id": "D", "text": "Photosynthesis"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Photosynthesis uses sunlight, CO\u2082, and water to produce glucose and oxygen."
    },
    {
      question: "What is Newton's first law of motion?",
      choices: [{"id": "A", "text": "F=ma"}, {"id": "B", "text": "Objects in motion stay in motion unless acted upon by an external force"}, {"id": "C", "text": "Energy cannot be created or destroyed"}, {"id": "D", "text": "Every action has an equal and opposite reaction"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Newton's first law is the law of inertia \u2014 objects continue in their state unless a net force acts on them."
    },
    {
      question: "What is the half-life of Carbon-14?",
      choices: [{"id": "A", "text": "1,000 years"}, {"id": "B", "text": "5,730 years"}, {"id": "C", "text": "10,000 years"}, {"id": "D", "text": "50,000 years"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Carbon-14 has a half-life of approximately 5,730 years, used in radiocarbon dating."
    },
    {
      question: "Which organ in the human body produces insulin?",
      choices: [{"id": "A", "text": "Liver"}, {"id": "B", "text": "Kidney"}, {"id": "C", "text": "Stomach"}, {"id": "D", "text": "Pancreas"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The pancreas produces insulin to regulate blood sugar levels."
    },
    {
      question: "What is DNA?",
      choices: [{"id": "A", "text": "A type of protein"}, {"id": "B", "text": "A molecule carrying genetic information"}, {"id": "C", "text": "A cellular organelle"}, {"id": "D", "text": "A type of RNA"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "DNA (deoxyribonucleic acid) is a molecule that carries genetic instructions for development and function."
    },
    {
      question: "What is the periodic table's symbol for gold?",
      choices: [{"id": "A", "text": "Ag"}, {"id": "B", "text": "Go"}, {"id": "C", "text": "Gd"}, {"id": "D", "text": "Au"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Gold's symbol Au comes from the Latin word 'aurum'."
    },
    {
      question: "Which scientist developed the theory of general relativity?",
      choices: [{"id": "A", "text": "Isaac Newton"}, {"id": "B", "text": "Niels Bohr"}, {"id": "C", "text": "Stephen Hawking"}, {"id": "D", "text": "Albert Einstein"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Albert Einstein published the theory of general relativity in 1915."
    },
    {
      question: "What is the name of the force that keeps planets in orbit around the Sun?",
      choices: [{"id": "A", "text": "Electromagnetic force"}, {"id": "B", "text": "Nuclear force"}, {"id": "C", "text": "Centrifugal force"}, {"id": "D", "text": "Gravity"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Gravity is the force that keeps planets in elliptical orbits around the Sun."
    },
    {
      question: "What is the process of a liquid turning into a gas?",
      choices: [{"id": "A", "text": "Condensation"}, {"id": "B", "text": "Sublimation"}, {"id": "C", "text": "Melting"}, {"id": "D", "text": "Evaporation"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Evaporation is the process by which a liquid converts to its gaseous state."
    },
    {
      question: "Which element has the chemical symbol 'O'?",
      choices: [{"id": "A", "text": "Osmium"}, {"id": "B", "text": "Oganesson"}, {"id": "C", "text": "Osmium"}, {"id": "D", "text": "Oxygen"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "O is the symbol for Oxygen on the periodic table."
    },
    {
      question: "How many chromosomes do humans normally have?",
      choices: [{"id": "A", "text": "23"}, {"id": "B", "text": "44"}, {"id": "C", "text": "46"}, {"id": "D", "text": "48"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Humans normally have 46 chromosomes arranged in 23 pairs."
    },
    {
      question: "What is the term for an organism that makes its own food?",
      choices: [{"id": "A", "text": "Heterotroph"}, {"id": "B", "text": "Decomposer"}, {"id": "C", "text": "Consumer"}, {"id": "D", "text": "Autotroph"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Autotrophs (like plants) produce their own food through photosynthesis or chemosynthesis."
    },
    {
      question: "What is the most abundant element in the universe?",
      choices: [{"id": "A", "text": "Helium"}, {"id": "B", "text": "Oxygen"}, {"id": "C", "text": "Carbon"}, {"id": "D", "text": "Hydrogen"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Hydrogen makes up approximately 75% of all normal matter in the universe by mass."
    },
    {
      question: "What is the name of the closest star to Earth besides the Sun?",
      choices: [{"id": "A", "text": "Betelgeuse"}, {"id": "B", "text": "Sirius"}, {"id": "C", "text": "Proxima Centauri"}, {"id": "D", "text": "Vega"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Proxima Centauri is the nearest star to our solar system at 4.24 light-years away."
    },
    {
      question: "What is the pH level of pure water?",
      choices: [{"id": "A", "text": "5"}, {"id": "B", "text": "6"}, {"id": "C", "text": "7"}, {"id": "D", "text": "8"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Pure water has a neutral pH of 7."
    },
    {
      question: "Which type of rock is formed from cooled magma?",
      choices: [{"id": "A", "text": "Sedimentary"}, {"id": "B", "text": "Metamorphic"}, {"id": "C", "text": "Limestone"}, {"id": "D", "text": "Igneous"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Igneous rocks form when magma or lava cools and solidifies."
    },
    {
      question: "What is the name of the scale used to measure earthquake magnitude?",
      choices: [{"id": "A", "text": "Beaufort Scale"}, {"id": "B", "text": "Fujita Scale"}, {"id": "C", "text": "Richter Scale"}, {"id": "D", "text": "Mohs Scale"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Richter Scale (now Moment Magnitude Scale) measures the energy released by earthquakes."
    },
    {
      question: "How many bones are in the adult human body?",
      choices: [{"id": "A", "text": "186"}, {"id": "B", "text": "196"}, {"id": "C", "text": "206"}, {"id": "D", "text": "216"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The adult human body has 206 bones."
    },
    {
      question: "What is the term for the bending of light as it passes from one medium to another?",
      choices: [{"id": "A", "text": "Reflection"}, {"id": "B", "text": "Diffraction"}, {"id": "C", "text": "Absorption"}, {"id": "D", "text": "Refraction"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Refraction is the bending of light when it passes between mediums of different densities."
    },
    {
      question: "Which planet has the most moons in our solar system?",
      choices: [{"id": "A", "text": "Jupiter"}, {"id": "B", "text": "Uranus"}, {"id": "C", "text": "Neptune"}, {"id": "D", "text": "Saturn"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Saturn has the most confirmed moons with 146, surpassing Jupiter's 95."
    },
    {
      question: "What is the term for a substance that speeds up a chemical reaction without being consumed?",
      choices: [{"id": "A", "text": "Inhibitor"}, {"id": "B", "text": "Solvent"}, {"id": "C", "text": "Catalyst"}, {"id": "D", "text": "Reactant"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "A catalyst increases the rate of a chemical reaction without being permanently altered."
    },
    {
      question: "What is the name of the boundary between Earth's crust and mantle?",
      choices: [{"id": "A", "text": "Gutenberg discontinuity"}, {"id": "B", "text": "Conrad discontinuity"}, {"id": "C", "text": "Mohorovi\u010di\u0107 discontinuity"}, {"id": "D", "text": "Lehmann discontinuity"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Mohorovi\u010di\u0107 discontinuity (Moho) marks the boundary between Earth's crust and mantle."
    },
    {
      question: "Which gas is primarily responsible for the greenhouse effect?",
      choices: [{"id": "A", "text": "Oxygen"}, {"id": "B", "text": "Nitrogen"}, {"id": "C", "text": "Argon"}, {"id": "D", "text": "Carbon Dioxide"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Carbon dioxide (CO\u2082) is the primary greenhouse gas driving human-caused climate change."
    },
    {
      question: "What is the name of the force that opposes the relative motion of two surfaces?",
      choices: [{"id": "A", "text": "Tension"}, {"id": "B", "text": "Normal force"}, {"id": "C", "text": "Gravity"}, {"id": "D", "text": "Friction"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Friction is the force that resists the sliding of surfaces against each other."
    },
    {
      question: "What is the function of red blood cells?",
      choices: [{"id": "A", "text": "Fight infection"}, {"id": "B", "text": "Produce antibodies"}, {"id": "C", "text": "Aid in clotting"}, {"id": "D", "text": "Transport oxygen"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Red blood cells carry oxygen from the lungs to tissues throughout the body."
    },
    {
      question: "Which subatomic particle has a negative charge?",
      choices: [{"id": "A", "text": "Neutron"}, {"id": "B", "text": "Proton"}, {"id": "C", "text": "Positron"}, {"id": "D", "text": "Electron"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Electrons carry a negative electrical charge."
    },
    {
      question: "What is the chemical symbol for iron?",
      choices: [{"id": "A", "text": "Ir"}, {"id": "B", "text": "In"}, {"id": "C", "text": "Fi"}, {"id": "D", "text": "Fe"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Iron's symbol Fe comes from the Latin word 'ferrum'."
    },
    {
      question: "What is the name of the longest bone in the human body?",
      choices: [{"id": "A", "text": "Tibia"}, {"id": "B", "text": "Humerus"}, {"id": "C", "text": "Spine"}, {"id": "D", "text": "Femur"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The femur (thigh bone) is the longest and strongest bone in the human body."
    },
    {
      question: "What is the name of the process by which a caterpillar becomes a butterfly?",
      choices: [{"id": "A", "text": "Mitosis"}, {"id": "B", "text": "Metamorphosis"}, {"id": "C", "text": "Meiosis"}, {"id": "D", "text": "Molting"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Metamorphosis is the biological process of transformation from larva to adult form."
    },
    {
      question: "Which vitamin is produced by the body when exposed to sunlight?",
      choices: [{"id": "A", "text": "Vitamin A"}, {"id": "B", "text": "Vitamin B12"}, {"id": "C", "text": "Vitamin C"}, {"id": "D", "text": "Vitamin D"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The skin synthesizes Vitamin D when exposed to ultraviolet B (UVB) radiation from sunlight."
    },
    {
      question: "What type of energy does the Sun primarily emit?",
      choices: [{"id": "A", "text": "Nuclear energy"}, {"id": "B", "text": "Chemical energy"}, {"id": "C", "text": "Electrical energy"}, {"id": "D", "text": "Electromagnetic (light) energy"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Sun primarily emits electromagnetic radiation including visible light and infrared energy."
    },
    {
      question: "What is the name of the scale used to measure hardness of minerals?",
      choices: [{"id": "A", "text": "Richter Scale"}, {"id": "B", "text": "Beaufort Scale"}, {"id": "C", "text": "Mohs Hardness Scale"}, {"id": "D", "text": "pH Scale"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The Mohs Hardness Scale ranks minerals from 1 (talc) to 10 (diamond)."
    },
    {
      question: "What is the study of heredity and variation in living organisms?",
      choices: [{"id": "A", "text": "Ecology"}, {"id": "B", "text": "Biochemistry"}, {"id": "C", "text": "Physiology"}, {"id": "D", "text": "Genetics"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Genetics is the branch of biology concerned with genes, heredity, and genetic variation."
    },
    {
      question: "Which law states that energy cannot be created or destroyed?",
      choices: [{"id": "A", "text": "Newton's First Law"}, {"id": "B", "text": "Ohm's Law"}, {"id": "C", "text": "First Law of Thermodynamics"}, {"id": "D", "text": "Boyle's Law"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The First Law of Thermodynamics states that energy can only be transferred or transformed, not created or destroyed."
    },
    {
      question: "What is the name of the organ that filters blood in the human body?",
      choices: [{"id": "A", "text": "Liver"}, {"id": "B", "text": "Spleen"}, {"id": "C", "text": "Pancreas"}, {"id": "D", "text": "Kidney"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The kidneys filter blood, removing waste products and excess substances as urine."
    },
    {
      question: "What is a black hole?",
      choices: [{"id": "A", "text": "A region of space where matter is very cold"}, {"id": "B", "text": "A collapsed star with gravity so strong light cannot escape"}, {"id": "C", "text": "An empty void in space"}, {"id": "D", "text": "A supernova remnant"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "A black hole is a region of spacetime where gravity is so strong that nothing, not even light, can escape."
    },
    {
      question: "Which planet is known as the Red Planet?",
      choices: [{"id": "A", "text": "Venus"}, {"id": "B", "text": "Jupiter"}, {"id": "C", "text": "Saturn"}, {"id": "D", "text": "Mars"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Mars appears reddish due to iron oxide (rust) on its surface."
    },
    {
      question: "What is the name of the molecule that carries genetic instructions from DNA to ribosomes?",
      choices: [{"id": "A", "text": "tRNA"}, {"id": "B", "text": "rRNA"}, {"id": "C", "text": "mRNA"}, {"id": "D", "text": "ATP"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Messenger RNA (mRNA) carries the genetic code from DNA to ribosomes for protein synthesis."
    },
    {
      question: "What is the boiling point of water at sea level in Celsius?",
      choices: [{"id": "A", "text": "90\u00b0C"}, {"id": "B", "text": "95\u00b0C"}, {"id": "C", "text": "98\u00b0C"}, {"id": "D", "text": "100\u00b0C"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Water boils at 100\u00b0C (212\u00b0F) at standard atmospheric pressure (sea level)."
    },
    {
      question: "What is the study of the universe beyond Earth's atmosphere?",
      choices: [{"id": "A", "text": "Geology"}, {"id": "B", "text": "Meteorology"}, {"id": "C", "text": "Oceanography"}, {"id": "D", "text": "Astronomy"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Astronomy is the scientific study of celestial objects, space, and the universe."
    },
    {
      question: "How many elements are on the periodic table?",
      choices: [{"id": "A", "text": "108"}, {"id": "B", "text": "112"}, {"id": "C", "text": "118"}, {"id": "D", "text": "124"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "The periodic table currently contains 118 confirmed chemical elements."
    },
    {
      question: "What is the name of the process where DNA copies itself?",
      choices: [{"id": "A", "text": "Transcription"}, {"id": "B", "text": "Translation"}, {"id": "C", "text": "Mutation"}, {"id": "D", "text": "Replication"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "DNA replication is the process by which a double-stranded DNA molecule is duplicated."
    },
    {
      question: "What is the name of the theory explaining the movement of Earth's tectonic plates?",
      choices: [{"id": "A", "text": "Continental Shift"}, {"id": "B", "text": "Plate Tectonics"}, {"id": "C", "text": "Seafloor Spreading"}, {"id": "D", "text": "Geodynamics"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "The theory of plate tectonics explains how the lithosphere is divided into moving plates."
    },
    {
      question: "Which organ controls the body's hormones and is called the 'master gland'?",
      choices: [{"id": "A", "text": "Thyroid"}, {"id": "B", "text": "Adrenal gland"}, {"id": "C", "text": "Hypothalamus"}, {"id": "D", "text": "Pituitary gland"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The pituitary gland is called the master gland because it controls other endocrine glands."
    },
  ],
  pop_culture: [
    {
      question: "Which TV show features the fictional town of Hawkins, Indiana?",
      choices: [{"id": "A", "text": "The Walking Dead"}, {"id": "B", "text": "Black Mirror"}, {"id": "C", "text": "American Horror Story"}, {"id": "D", "text": "Stranger Things"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Stranger Things is set in the fictional Hawkins, Indiana and premiered on Netflix in 2016."
    },
    {
      question: "Who plays the character Daenerys Targaryen in Game of Thrones?",
      choices: [{"id": "A", "text": "Sophie Turner"}, {"id": "B", "text": "Natalie Dormer"}, {"id": "C", "text": "Lena Headey"}, {"id": "D", "text": "Emilia Clarke"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Emilia Clarke portrayed Daenerys Targaryen throughout all 8 seasons of Game of Thrones."
    },
    {
      question: "What is the name of Tony Stark's AI assistant in Iron Man?",
      choices: [{"id": "A", "text": "WALL-E"}, {"id": "B", "text": "HAL"}, {"id": "C", "text": "JARVIS"}, {"id": "D", "text": "FRIDAY"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "JARVIS (Just A Rather Very Intelligent System) is Tony Stark's AI in the early MCU films."
    },
    {
      question: "Which social media platform is known for short video content?",
      choices: [{"id": "A", "text": "Instagram"}, {"id": "B", "text": "Twitter"}, {"id": "C", "text": "Pinterest"}, {"id": "D", "text": "TikTok"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "TikTok became the world's most downloaded app, known for its short-form video content."
    },
    {
      question: "What is the name of the fictional school in Harry Potter?",
      choices: [{"id": "A", "text": "Beauxbatons"}, {"id": "B", "text": "Durmstrang"}, {"id": "C", "text": "Camelot"}, {"id": "D", "text": "Hogwarts"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Hogwarts School of Witchcraft and Wizardry is the main setting of the Harry Potter series."
    },
    {
      question: "Which video game franchise features a character called Master Chief?",
      choices: [{"id": "A", "text": "Call of Duty"}, {"id": "B", "text": "Gears of War"}, {"id": "C", "text": "Destiny"}, {"id": "D", "text": "Halo"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Master Chief (John-117) is the protagonist of the Halo video game series."
    },
    {
      question: "What is the real name of the rapper known as Eminem?",
      choices: [{"id": "A", "text": "Eric Matthews"}, {"id": "B", "text": "Michael Mathers"}, {"id": "C", "text": "Shawn Carter"}, {"id": "D", "text": "Marshall Mathers"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Eminem's real name is Marshall Bruce Mathers III."
    },
    {
      question: "Which streaming service produces 'The Crown'?",
      choices: [{"id": "A", "text": "HBO"}, {"id": "B", "text": "Amazon Prime"}, {"id": "C", "text": "Disney+"}, {"id": "D", "text": "Netflix"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Crown is a Netflix original series about the British Royal Family."
    },
    {
      question: "What is the name of the fictional kingdom in 'Frozen'?",
      choices: [{"id": "A", "text": "Agrabah"}, {"id": "B", "text": "Motunui"}, {"id": "C", "text": "Andalasia"}, {"id": "D", "text": "Arendelle"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Frozen is set in the kingdom of Arendelle, inspired by Norway."
    },
    {
      question: "Who is the host of 'The Daily Show' as of 2025?",
      choices: [{"id": "A", "text": "Trevor Noah"}, {"id": "B", "text": "Jon Stewart"}, {"id": "C", "text": "Stephen Colbert"}, {"id": "D", "text": "Jordan Klepper"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Jon Stewart returned to host The Daily Show in 2024 on a part-time basis."
    },
    {
      question: "What is the name of Batman's butler?",
      choices: [{"id": "A", "text": "James"}, {"id": "B", "text": "Arthur"}, {"id": "C", "text": "Alfred"}, {"id": "D", "text": "Edwin"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Alfred Pennyworth is Batman's loyal butler and confidant."
    },
    {
      question: "Which Kardashian sister became a billionaire through her beauty brand?",
      choices: [{"id": "A", "text": "Kourtney"}, {"id": "B", "text": "Khlo\u00e9"}, {"id": "C", "text": "Kendall"}, {"id": "D", "text": "Kim"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Kim Kardashian became a billionaire through her SKIMS and KKW Beauty brands."
    },
    {
      question: "What is the name of the fictional land in 'The Lord of the Rings'?",
      choices: [{"id": "A", "text": "Narnia"}, {"id": "B", "text": "Neverland"}, {"id": "C", "text": "Asgard"}, {"id": "D", "text": "Middle-earth"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "J.R.R. Tolkien's saga takes place in the fictional world of Middle-earth."
    },
    {
      question: "Which app allows users to share photos and videos with followers?",
      choices: [{"id": "A", "text": "Snapchat"}, {"id": "B", "text": "Reddit"}, {"id": "C", "text": "Twitter"}, {"id": "D", "text": "Instagram"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Instagram is a photo and video sharing social network owned by Meta."
    },
    {
      question: "What is Taylor Swift's most-streamed song on Spotify as of 2024?",
      choices: [{"id": "A", "text": "Shake It Off"}, {"id": "B", "text": "Love Story"}, {"id": "C", "text": "Cruel Summer"}, {"id": "D", "text": "Anti-Hero"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Anti-Hero from Midnights became Taylor Swift's most-streamed song on Spotify."
    },
    {
      question: "Who created the TV series 'Breaking Bad'?",
      choices: [{"id": "A", "text": "Ryan Murphy"}, {"id": "B", "text": "J.J. Abrams"}, {"id": "C", "text": "Shonda Rhimes"}, {"id": "D", "text": "Vince Gilligan"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Vince Gilligan created Breaking Bad, which aired on AMC from 2008 to 2013."
    },
    {
      question: "Which video game features the character Link and Princess Zelda?",
      choices: [{"id": "A", "text": "Final Fantasy"}, {"id": "B", "text": "Metroid"}, {"id": "C", "text": "Castlevania"}, {"id": "D", "text": "The Legend of Zelda"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Legend of Zelda is Nintendo's action-adventure franchise featuring Link and Princess Zelda."
    },
    {
      question: "What is the name of the superhero alter ego of Peter Parker?",
      choices: [{"id": "A", "text": "Batman"}, {"id": "B", "text": "Iron Man"}, {"id": "C", "text": "Captain America"}, {"id": "D", "text": "Spider-Man"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Peter Parker transforms into Spider-Man after being bitten by a radioactive spider."
    },
    {
      question: "Who starred as Walter White in 'Breaking Bad'?",
      choices: [{"id": "A", "text": "Bryan Cranston"}, {"id": "B", "text": "Aaron Paul"}, {"id": "C", "text": "Dean Norris"}, {"id": "D", "text": "Bob Odenkirk"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Bryan Cranston won four Emmy Awards for his portrayal of Walter White."
    },
    {
      question: "What is the name of the fictional country where 'Black Panther' is set?",
      choices: [{"id": "A", "text": "Sokovia"}, {"id": "B", "text": "Genosha"}, {"id": "C", "text": "Latveria"}, {"id": "D", "text": "Wakanda"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Wakanda is the fictional African nation in Marvel's Black Panther."
    },
    {
      question: "Which celebrity couple was known as 'Kimye'?",
      choices: [{"id": "A", "text": "Kim Kardashian and Kanye West"}, {"id": "B", "text": "Kim Basinger and Alec Baldwin"}, {"id": "C", "text": "Katy Perry and Russell Brand"}, {"id": "D", "text": "Kylie Jenner and Travis Scott"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Kim Kardashian and Kanye West were nicknamed 'Kimye' during their marriage."
    },
    {
      question: "What is the name of the coffee shop in the TV show 'Friends'?",
      choices: [{"id": "A", "text": "The Peach Pit"}, {"id": "B", "text": "Central Perk"}, {"id": "C", "text": "Java Hut"}, {"id": "D", "text": "The Beanery"}],
      correctIndex: 1,
      correctChoiceId: "B",
      explanation: "Central Perk is the iconic coffee shop where the Friends cast hangs out."
    },
    {
      question: "Which artist released the album 'Renaissance' in 2022?",
      choices: [{"id": "A", "text": "Rihanna"}, {"id": "B", "text": "Cardi B"}, {"id": "C", "text": "Nicki Minaj"}, {"id": "D", "text": "Beyonc\u00e9"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Beyonc\u00e9 released the dance album Renaissance in July 2022."
    },
    {
      question: "What is the name of the fictional detective in the BBC show 'Sherlock'?",
      choices: [{"id": "A", "text": "Hercule Poirot"}, {"id": "B", "text": "Philip Marlowe"}, {"id": "C", "text": "Sherlock Holmes"}, {"id": "D", "text": "John Watson"}],
      correctIndex: 2,
      correctChoiceId: "C",
      explanation: "Benedict Cumberbatch plays Sherlock Holmes in the BBC series Sherlock."
    },
    {
      question: "Which platform is known for the gaming community and live streaming?",
      choices: [{"id": "A", "text": "Vimeo"}, {"id": "B", "text": "YouTube Gaming"}, {"id": "C", "text": "Mixer"}, {"id": "D", "text": "Twitch"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Twitch is the leading live streaming platform, especially popular for gaming content."
    },
    {
      question: "What is the real name of pop star Lady Gaga?",
      choices: [{"id": "A", "text": "Stefani Joanne Angelina Germanotta"}, {"id": "B", "text": "Alicia Moore"}, {"id": "C", "text": "Aubrey Graham"}, {"id": "D", "text": "Melissa Jefferson"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Lady Gaga's birth name is Stefani Joanne Angelina Germanotta."
    },
    {
      question: "Which TV show features the character Michael Scott?",
      choices: [{"id": "A", "text": "Parks and Recreation"}, {"id": "B", "text": "Brooklyn Nine-Nine"}, {"id": "C", "text": "What We Do in the Shadows"}, {"id": "D", "text": "The Office"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Michael Scott, played by Steve Carell, is the regional manager in The Office (US version)."
    },
    {
      question: "Who is the creator of the Harry Potter series?",
      choices: [{"id": "A", "text": "Suzanne Collins"}, {"id": "B", "text": "Stephenie Meyer"}, {"id": "C", "text": "Philip Pullman"}, {"id": "D", "text": "J.K. Rowling"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "J.K. Rowling wrote the Harry Potter book series starting with The Philosopher's Stone in 1997."
    },
    {
      question: "What is the name of the fictional wizard school rival to Hogwarts?",
      choices: [{"id": "A", "text": "Ilvermorny"}, {"id": "B", "text": "Castelobruxo"}, {"id": "C", "text": "Beauxbatons"}, {"id": "D", "text": "Durmstrang"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Durmstrang Institute is one of the rival wizarding schools featured in Harry Potter."
    },
    {
      question: "Which fast food chain is known for its golden arches logo?",
      choices: [{"id": "A", "text": "Burger King"}, {"id": "B", "text": "Wendy's"}, {"id": "C", "text": "Chick-fil-A"}, {"id": "D", "text": "McDonald's"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "McDonald's golden arches are one of the most recognized logos in the world."
    },
    {
      question: "What is the name of Elon Musk's electric car company?",
      choices: [{"id": "A", "text": "Rivian"}, {"id": "B", "text": "Lucid"}, {"id": "C", "text": "NIO"}, {"id": "D", "text": "Tesla"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Tesla was co-founded by Elon Musk and has become the world's leading electric vehicle company."
    },
    {
      question: "Which superhero is known as the 'Man of Steel'?",
      choices: [{"id": "A", "text": "Batman"}, {"id": "B", "text": "Thor"}, {"id": "C", "text": "Captain America"}, {"id": "D", "text": "Superman"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Superman is nicknamed the Man of Steel due to his near-invulnerability."
    },
    {
      question: "What is the name of the popular reality show where contestants compete to be 'the last one standing'?",
      choices: [{"id": "A", "text": "Big Brother"}, {"id": "B", "text": "The Amazing Race"}, {"id": "C", "text": "The Bachelor"}, {"id": "D", "text": "Survivor"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Survivor premiered in 2000 and remains one of the longest-running reality shows."
    },
    {
      question: "Which internet meme features a dog with internal monologue text in Comic Sans?",
      choices: [{"id": "A", "text": "Grumpy Cat"}, {"id": "B", "text": "Keyboard Cat"}, {"id": "C", "text": "This Is Fine"}, {"id": "D", "text": "Doge"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Doge meme features a Shiba Inu dog with broken English phrases in Comic Sans."
    },
    {
      question: "What is the name of Ariana Grande's best-selling fragrance?",
      choices: [{"id": "A", "text": "Cloud"}, {"id": "B", "text": "Thank U Next"}, {"id": "C", "text": "7 Rings"}, {"id": "D", "text": "God Is a Woman"}],
      correctIndex: 0,
      correctChoiceId: "A",
      explanation: "Cloud by Ariana Grande became one of the best-selling celebrity fragrances."
    },
    {
      question: "Which TV series is set in the fictional Westeros?",
      choices: [{"id": "A", "text": "The Witcher"}, {"id": "B", "text": "Vikings"}, {"id": "C", "text": "Merlin"}, {"id": "D", "text": "Game of Thrones"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Game of Thrones (and House of the Dragon) is set in the fictional continent of Westeros."
    },
    {
      question: "Who plays the Mandalorian in the Disney+ series?",
      choices: [{"id": "A", "text": "Oscar Isaac"}, {"id": "B", "text": "John Boyega"}, {"id": "C", "text": "Riz Ahmed"}, {"id": "D", "text": "Pedro Pascal"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Pedro Pascal plays the title character in The Mandalorian on Disney+."
    },
    {
      question: "What is the name of the virtual world in 'Ready Player One'?",
      choices: [{"id": "A", "text": "The Grid"}, {"id": "B", "text": "The Matrix"}, {"id": "C", "text": "Cyberspace"}, {"id": "D", "text": "The OASIS"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The OASIS is the immersive virtual reality world in Ernest Cline's Ready Player One."
    },
    {
      question: "Which celebrity launched the Fenty Beauty brand?",
      choices: [{"id": "A", "text": "Kylie Jenner"}, {"id": "B", "text": "Kim Kardashian"}, {"id": "C", "text": "Cardi B"}, {"id": "D", "text": "Rihanna"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Rihanna launched Fenty Beauty in 2017, praised for its inclusive shade range."
    },
    {
      question: "What is the name of the competition show where amateur singers compete for a record deal?",
      choices: [{"id": "A", "text": "The Voice"}, {"id": "B", "text": "X Factor"}, {"id": "C", "text": "America's Got Talent"}, {"id": "D", "text": "American Idol"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "American Idol premiered in 2002 and launched the careers of Kelly Clarkson and Carrie Underwood."
    },
    {
      question: "Which actor plays Tony Soprano in 'The Sopranos'?",
      choices: [{"id": "A", "text": "Joe Pesci"}, {"id": "B", "text": "Ray Liotta"}, {"id": "C", "text": "Robert De Niro"}, {"id": "D", "text": "James Gandolfini"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "James Gandolfini played Tony Soprano in the acclaimed HBO series The Sopranos."
    },
    {
      question: "What is the best-selling video game console of all time?",
      choices: [{"id": "A", "text": "Nintendo Switch"}, {"id": "B", "text": "Xbox 360"}, {"id": "C", "text": "Game Boy"}, {"id": "D", "text": "PlayStation 2"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The PlayStation 2 sold over 155 million units, making it the best-selling console of all time."
    },
    {
      question: "Who is the creator of the 'Avatar: The Last Airbender' animated series?",
      choices: [{"id": "A", "text": "Rebecca Sugar"}, {"id": "B", "text": "Pendleton Ward"}, {"id": "C", "text": "Craig McCracken"}, {"id": "D", "text": "Michael DiMartino and Bryan Konietzko"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Avatar: The Last Airbender was created by Michael DiMartino and Bryan Konietzko for Nickelodeon."
    },
    {
      question: "What is the name of the fictional town in 'Schitt's Creek'?",
      choices: [{"id": "A", "text": "Pawnee"}, {"id": "B", "text": "Letterkenny"}, {"id": "C", "text": "Stars Hollow"}, {"id": "D", "text": "Schitt's Creek"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Rose family moves to the small town of Schitt's Creek in the Canadian sitcom."
    },
    {
      question: "Which reality show features celebrity pairs learning to dance?",
      choices: [{"id": "A", "text": "America's Got Talent"}, {"id": "B", "text": "So You Think You Can Dance"}, {"id": "C", "text": "American Idol"}, {"id": "D", "text": "Dancing with the Stars"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Dancing with the Stars pairs celebrities with professional dancers in a competition format."
    },
    {
      question: "What is the name of the company founded by Jeff Bezos that went to space?",
      choices: [{"id": "A", "text": "SpaceX"}, {"id": "B", "text": "Virgin Galactic"}, {"id": "C", "text": "Rocket Lab"}, {"id": "D", "text": "Blue Origin"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Jeff Bezos founded Blue Origin, which successfully launched him to space in 2021."
    },
    {
      question: "Which actress played Elle Woods in 'Legally Blonde'?",
      choices: [{"id": "A", "text": "Cameron Diaz"}, {"id": "B", "text": "Drew Barrymore"}, {"id": "C", "text": "Jennifer Aniston"}, {"id": "D", "text": "Reese Witherspoon"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Reese Witherspoon starred as the iconic Elle Woods in Legally Blonde (2001)."
    },
    {
      question: "What is the name of the fictional town in the TV show 'Gilmore Girls'?",
      choices: [{"id": "A", "text": "Mystic Falls"}, {"id": "B", "text": "Beacon Hills"}, {"id": "C", "text": "Pawnee"}, {"id": "D", "text": "Stars Hollow"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Gilmore Girls is set in the fictional town of Stars Hollow, Connecticut."
    },
    {
      question: "Which famous rapper released the album 'The College Dropout' in 2004?",
      choices: [{"id": "A", "text": "Jay-Z"}, {"id": "B", "text": "Lil Wayne"}, {"id": "C", "text": "Drake"}, {"id": "D", "text": "Kanye West"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "Kanye West's debut album The College Dropout was released in February 2004."
    },
    {
      question: "What is the name of the Marvel Comics team that includes Captain America, Iron Man, and Thor?",
      choices: [{"id": "A", "text": "X-Men"}, {"id": "B", "text": "Guardians of the Galaxy"}, {"id": "C", "text": "Fantastic Four"}, {"id": "D", "text": "The Avengers"}],
      correctIndex: 3,
      correctChoiceId: "D",
      explanation: "The Avengers is Marvel's premier superhero team featuring their most powerful heroes."
    },
  ],
};

// Normalize choices to plain strings for runtime use
const QUESTION_BANK_NORMALIZED = {};
for (const [cat, questions] of Object.entries(QUESTION_BANK)) {
  QUESTION_BANK_NORMALIZED[cat] = questions.map(q => ({
    question: q.question,
    choices: q.choices.map(c => (typeof c === 'object' && c.text ? c.text : c)),
    correctIndex: q.correctIndex
  }));
}

window.QUESTION_BANK_V2 = QUESTION_BANK_NORMALIZED;