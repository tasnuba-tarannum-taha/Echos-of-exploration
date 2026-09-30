export interface QuizQuestion {
  id: string;
  difficulty: 'Easy' | 'Medium';
  category: 'Moon' | 'Mars' | 'Engineering' | 'Science';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
  badgeRewardId?: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    difficulty: 'Easy',
    category: 'Moon',
    question: 'Which part of the Apollo 11 "Eagle" spacecraft was left behind on the Moon when Neil Armstrong and Buzz Aldrin blasted off?',
    options: [
      'The Command Module Columbia',
      'The Lunar Module Descent Stage',
      'The Saturn V Rocket First Stage',
      'The Lunar Rover Buggy'
    ],
    correctIndex: 1,
    explanation: 'The lower octagonal Lunar Module Descent Stage served as the launch pad for the Ascent Stage and remains permanently at Tranquility Base.',
    xpReward: 20,
    badgeRewardId: 'badge-moon-walker',
  },
  {
    id: 'q2',
    difficulty: 'Easy',
    category: 'Moon',
    question: 'In 1969, Apollo 12 astronauts walked across the Moon to inspect which robotic probe that landed 2.5 years earlier?',
    options: [
      'Surveyor 3',
      'Sputnik 1',
      'Voyager 1',
      'Viking 1'
    ],
    correctIndex: 0,
    explanation: 'Apollo 12 astronauts Pete Conrad and Alan Bean landed within 163 meters of Surveyor 3 and brought its TV camera back to Earth for analysis.',
    xpReward: 20,
  },
  {
    id: 'q3',
    difficulty: 'Medium',
    category: 'Moon',
    question: 'What was the name of the Soviet Union’s tub-shaped 8-wheeled robot, the first remote-controlled rover on another world?',
    options: [
      'Sojourner',
      'Lunokhod 1',
      'Phobos 2',
      'Zond 5'
    ],
    correctIndex: 1,
    explanation: 'Lunokhod 1 landed in November 1970 and drove 10.5 km across Mare Imbrium, transmitting thousands of TV photos back to Earth.',
    xpReward: 30,
  },
  {
    id: 'q4',
    difficulty: 'Easy',
    category: 'Mars',
    question: 'What was the name of the very first wheeled robotic rover ever driven on Mars in 1997, which was the size of a microwave oven?',
    options: [
      'Curiosity',
      'Perseverance',
      'Sojourner',
      'Spirit'
    ],
    correctIndex: 2,
    explanation: 'Sojourner rover arrived aboard the Mars Pathfinder airbag lander on July 4, 1997, and proved rovers could survive on the Red Planet.',
    xpReward: 20,
    badgeRewardId: 'badge-rover-expert',
  },
  {
    id: 'q5',
    difficulty: 'Medium',
    category: 'Mars',
    question: 'What did the Opportunity rover discover at Meridiani Planum that looked like tiny spherical blueberries?',
    options: [
      'Frozen liquid water ice cubes',
      'Iron-rich hematite spherules formed in ancient water',
      'Volcanic glass diamonds',
      'Fossilized micro-meteorites'
    ],
    correctIndex: 1,
    explanation: 'These hematite concretions (dubbed "blueberries") formed by precipitation inside ancient groundwater, providing key evidence of a watery ancient Mars.',
    xpReward: 30,
    badgeRewardId: 'badge-mars-explorer',
  },
  {
    id: 'q6',
    difficulty: 'Easy',
    category: 'Mars',
    question: 'Why did the solar-powered Mars rovers Spirit and Opportunity eventually lose power after years of exploration?',
    options: [
      'Their gasoline fuel ran out',
      'Martian dust coated their solar panels and blocked sunlight',
      'Their computer chips melted in the Martian heat',
      'They were struck by giant asteroids'
    ],
    correctIndex: 1,
    explanation: 'Fine Martian dust continuously settles from the atmosphere. Without wind "cleaning events," dust slowly choked solar power output over the years.',
    xpReward: 25,
  },
  {
    id: 'q7',
    difficulty: 'Medium',
    category: 'Engineering',
    question: 'How did NASA safely deliver the 1-ton nuclear-powered Curiosity rover to the Martian surface without airbags?',
    options: [
      'A parachute that floated gently directly to the dirt',
      'A rocket-powered "Sky Crane" that lowered it on nylon tether cables',
      'A massive spring that bounced it into a crater',
      'An inflatable bouncy castle'
    ],
    correctIndex: 1,
    explanation: 'Curiosity used an audacious "Sky Crane" descent stage that hovered on retro-rockets and lowered the rover gently onto its wheels before flying away.',
    xpReward: 30,
  },
  {
    id: 'q8',
    difficulty: 'Medium',
    category: 'Science',
    question: 'What special sensitive instrument did the InSight lander place directly onto the Martian ground with its robotic arm?',
    options: [
      'A laser cannon to zap rocks',
      'A SEIS ultra-sensitive seismometer to detect "Marsquakes"',
      'A rain gauge to catch thunderstorms',
      'A giant speaker to play music'
    ],
    correctIndex: 1,
    explanation: 'InSight deployed the SEIS seismometer under a wind and thermal shield, recording more than 1,300 Marsquakes and mapping the Martian core.',
    xpReward: 30,
  },
  {
    id: 'q9',
    difficulty: 'Easy',
    category: 'Mars',
    question: 'Which robotic flying partner accompanied the Perseverance rover to test the very first powered flight on another planet?',
    options: [
      'Dragonfly',
      'Ingenuity Helicopter',
      'Voyager Falcon',
      'Apollo Drone'
    ],
    correctIndex: 1,
    explanation: 'The Ingenuity Mars Helicopter made 72 historic powered flights in the razor-thin Martian atmosphere, proving aerial scouting is possible.',
    xpReward: 25,
  },
  {
    id: 'q10',
    difficulty: 'Medium',
    category: 'Science',
    question: 'Why are discarded lunar artifacts like Apollo descent stages and retroreflectors still in pristine condition after over 50 years?',
    options: [
      'They are enclosed in air-conditioned glass domes',
      'The Moon has no atmosphere, no wind, no liquid rain, and no rust corrosion',
      'Robots regularly wax and polish the spacecraft',
      'They are buried beneath 100 meters of concrete'
    ],
    correctIndex: 1,
    explanation: 'Because the Moon has no atmosphere or liquid water, there is no wind erosion, oxygen, or moisture to cause rust. Only solar radiation and micrometeorites weather the metal!',
    xpReward: 35,
    badgeRewardId: 'badge-space-historian',
  },
];
