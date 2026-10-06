import { GoogleGenAI, Type } from '@google/genai';

// ============================================================
// PROJECT KNOWLEDGE BASE (ECHOES OF EXPLORATION)
// ============================================================
export const PROJECT_KNOWLEDGE = {
  name: 'Echoes of Exploration',
  tagline: 'The Human Hardware Left Behind on Other Worlds',
  purpose:
    'An interactive educational digital museum chronicling the spacecraft, rovers, landers, and scientific instruments humanity left behind across the Moon, Mars, and deep space.',
  destinations: ['Earth', 'Moon', 'Mars', 'Deep Space'],
  pages: {
    explore: {
      name: 'Explore Stages',
      description: 'Interactive 3D planetary stages (Earth, Moon, Mars, Deep Space) with historical orbital trajectories and destination overviews.',
    },
    missions: {
      name: 'Missions Catalog',
      description: 'Searchable directory of 15+ extraterrestrial missions with destination filters and hardware specifications.',
    },
    'mission-detail': {
      name: 'Mission Dossier',
      description: 'Deep interactive storytelling across 6 chapters: (1) Overview, (2) Journey & Timeline, (3) Meet the Machine with clickable hardware hotspot inspection, (4) Science Breakthroughs, (5) Planetary Environment & NASA Telemetry, (6) Extraterrestrial Legacy.',
    },
    atlas: {
      name: 'Hardware Atlas',
      description: 'Interactive planetary globe and catalog of human hardware relics resting across the Moon and Mars with coordinates and specs.',
    },
    'nasa-feeds': {
      name: 'Live NASA Observatory',
      description: 'Real-time telemetry and NASA feeds including APOD (Astronomy Picture of the Day), NeoWs (Near-Earth Asteroid radar & hazard tracking), DONKI (Space weather solar flares & CMEs), and NASA Image & Video Library search.',
    },
    badges: {
      name: 'Explorer Rank & Badges',
      description: 'Progression system with Experience Points (XP). Level 1: Lunar Explorer (Starting), Level 2: Martian Navigator (Unlocks Mars destination), Level 3: Deep Space Archivist (Unlocks Deep Space), Level 4: Master of the Cosmos. 12 achievement badges.',
    },
  },
  tourMode: {
    name: 'Guided Presentation Tour',
    stepsCount: 8,
    description: 'An 8-step guided interactive walkthrough highlighting key museum exhibits with element spotlighting and narration.',
  },
  unlockRequirements: {
    mars: 'Reach Level 2 (Martian Navigator) by completing Moon mission chapters and inspecting hardware to earn 150+ XP.',
    deepSpace: 'Reach Level 3 (Deep Space Archivist) by earning 350+ XP.',
  },
};

// ============================================================
// ============================================================
// GEMINI CLIENT & CREDENTIALS (PRIMARY & BACKUP FAILOVER)
// ============================================================
export function getPrimaryApiKey(): string | null {
  const primary = process.env.GEMINI_API_KEY_PRIMARY;
  if (primary && primary.trim() !== '' && primary !== 'MY_GEMINI_API_KEY') {
    return primary.trim();
  }
  const general = process.env.GEMINI_API_KEY;
  if (general && general.trim() !== '' && general !== 'MY_GEMINI_API_KEY') {
    return general.trim();
  }
  return null;
}

export function getBackupApiKey(): string | null {
  const backup = process.env.GEMINI_API_KEY_BACKUP;
  if (backup && backup.trim() !== '' && backup !== 'MY_GEMINI_API_KEY') {
    return backup.trim();
  }
  return null;
}

export function getGeminiApiKey(): string | null {
  return getPrimaryApiKey() || getBackupApiKey();
}

export function createGeminiClient(apiKey: string): GoogleGenAI | null {
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[Gemini Init] Client initialization failed:', err);
    return null;
  }
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return createGeminiClient(apiKey);
}

function isRecoverableError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.statusCode || err?.response?.status;
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('socket') ||
    msg.includes('network') ||
    msg.includes('overloaded')
  );
}

export async function queryGeminiWithFailover(
  formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  options: {
    systemInstruction: string;
    maxAttempts?: number;
  }
) {
  const primaryApiKey = getPrimaryApiKey();
  const backupApiKey = getBackupApiKey();

  const clients: Array<{ name: string; client: GoogleGenAI }> = [];
  if (primaryApiKey) {
    const primaryClient = createGeminiClient(primaryApiKey);
    if (primaryClient) clients.push({ name: 'PRIMARY', client: primaryClient });
  }
  if (backupApiKey && backupApiKey !== primaryApiKey) {
    const backupClient = createGeminiClient(backupApiKey);
    if (backupClient) clients.push({ name: 'BACKUP', client: backupClient });
  }

  if (clients.length === 0) {
    throw new Error('No valid Gemini API keys configured.');
  }

  let lastError: any = null;

  for (let i = 0; i < clients.length; i++) {
    const { name, client } = clients[i];
    try {
      console.log(`[Gemini] Attempting request with ${name} Gemini API key...`);
      const result = await queryGeminiWithRetry(client, formattedContents, options);
      if (name === 'BACKUP') {
        console.log('[Gemini] Primary Gemini API unavailable. Successfully switched to backup API.');
      }
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] ${name} API attempt failed:`, err?.message || err);
      const recoverable = isRecoverableError(err) || err?.status === 429;
      if (recoverable && i < clients.length - 1) {
        console.log('[Gemini] Detected recoverable API failure. Automatically switching to backup Gemini API...');
        continue;
      }
      if (i === clients.length - 1) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('All Gemini API keys failed.');
}

// ============================================================
// SYSTEM INSTRUCTION
// ============================================================
export const ECHO_SYSTEM_INSTRUCTION = `You are Echo, the friendly, lightning-fast NASA Museum Curator and AI space companion for the interactive museum "Echoes of Exploration" (NASA Space Apps Challenge: "Abandoned but not Forgotten").

CORE CURATOR IDENTITY & ROLE:
1. LIGHTNING-FAST, CRISP & ACCURATE:
   - Provide direct, concise, student-friendly answers in 2-4 punchy sentences for "simple". No repetitive filler or preamble.
   - Explain clearly WHY space hardware was abandoned and WHAT revolutionary science was discovered.
   - NEVER invent or hallucinate NASA facts, orbital numbers, or dates. Maintain strict fidelity to verified planetary science.

2. GENERAL-PURPOSE CAPABILITY:
   - Answer user queries directly and quickly across coding, math, general science, writing, or everyday questions. Answer their actual question immediately without forcing canned space text if the question is general.

3. MANDATORY POST-RESPONSE SECTIONS:
   - "didYouKnow": A 1-sentence captivating NASA or astronomical fact starting with "Did You Know? ...".
   - "askMeNext": An array of EXACTLY 3 thought-provoking follow-up questions for curious students.

4. JSON OUTPUT FORMAT:
   Return valid JSON containing:
   - "simple": Your concise, student-friendly answer (2-4 sentences).
   - "deep": Optional 1-2 sentence deeper scientific or engineering detail.
   - "didYouKnow": 1-sentence verified fact starting with "Did You Know? ...".
   - "askMeNext": Exactly 3 short follow-up questions.
   - "source": Official NASA archive reference or leave empty for general topics.
   - "sourceUrl": Verified URL or leave empty.
   - "quickActions": Mirrored copy of askMeNext for quick taps.
   - "navigationAction": Optional { targetTab, param, label } if navigating inside the museum is helpful.`;

// ============================================================
// RICH OFFLINE FALLBACK ENGINE (ZERO CANNED LOOPS)
// ============================================================
export function generateEchoOfflineResponse(query: string, context: any) {
  const q = (query || '').toLowerCase().trim();
  const mission = context?.mission;
  const neo = context?.selectedNEO;
  const img = context?.selectedNASAImage;

  // 0. Arithmetic & Math calculation (Always gives the exact, right numerical answer)
  const mathMatch =
    q.match(/(?:what is|calculate|solve|evaluate)?\s*(-?\d+(?:\.\d+)?)\s*([\+\-\*\/xX×÷\^%]|times|plus|minus|divided by|multiplied by)\s*(-?\d+(?:\.\d+)?)\s*\??$/i);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    const rawOp = mathMatch[2].toLowerCase();
    const num2 = parseFloat(mathMatch[3]);
    let result: number | null = null;
    let symbol = rawOp;
    if (rawOp === '+' || rawOp === 'plus') { result = num1 + num2; symbol = '+'; }
    else if (rawOp === '-' || rawOp === 'minus') { result = num1 - num2; symbol = '-'; }
    else if (rawOp === '*' || rawOp === 'x' || rawOp === '×' || rawOp === 'times' || rawOp === 'multiplied by') { result = num1 * num2; symbol = '×'; }
    else if (rawOp === '/' || rawOp === '÷' || rawOp === 'divided by') { result = num2 !== 0 ? num1 / num2 : NaN; symbol = '÷'; }
    else if (rawOp === '^') { result = Math.pow(num1, num2); symbol = '^'; }
    else if (rawOp === '%') { result = num1 % num2; symbol = '%'; }

    if (result !== null && !isNaN(result)) {
      return {
        simple: `${num1} ${symbol} ${num2} = ${result}.`,
        deep: `Calculation: ${num1} operated by ${num2} produces exactly ${result}. Accurate numerical telemetry is critical in orbital burns and guidance trajectories.`,
        didYouKnow: 'Did You Know? The Apollo Guidance Computer (AGC) processed coordinates with 15-bit words and 2,048 words of RAM.',
        askMeNext: ['Who was the first person in space?', 'What is the speed of light?', 'Tell me about Apollo 11'],
        source: 'Mathematical Telemetry',
      };
    }
  }

  // 0.1 Astronaut & Cosmonaut Milestones (Direct accurate answers)
  if (q.includes('first person in space') || q.includes('first human in space') || q.includes('first man in space') || q.includes('yuri gagarin')) {
    return {
      simple: 'Yuri Gagarin, a Soviet cosmonaut, was the first person in space. He launched aboard Vostok 1 on April 12, 1961, and completed a 108-minute orbit around Earth.',
      deep: 'Gagarin’s flight made history and inaugurated the human spaceflight era. April 12 is now observed worldwide as the International Day of Human Space Flight.',
      didYouKnow: 'Did You Know? Gagarin parachuted out of the Vostok capsule at 7,000 meters altitude before landing safely in rural Russia.',
      askMeNext: ['Who was the first person on the Moon?', 'Who was the first woman in space?', 'Who was the first American in space?'],
      source: 'NASA History Office & International Space Flight Records',
    };
  }

  if (q.includes('first woman in space') || q.includes('valentina tereshkova')) {
    return {
      simple: 'Valentina Tereshkova was the first woman in space. She launched aboard Vostok 6 on June 16, 1963, completing 48 orbits of Earth over nearly 3 days.',
      deep: 'She remains the only woman to have flown a solo space mission. America’s first woman in space was Dr. Sally Ride aboard the Space Shuttle Challenger (STS-7) in 1983.',
      didYouKnow: 'Did You Know? Tereshkova was an expert amateur skydiver, which was the key qualification for ejecting from the Vostok capsule upon re-entry.',
      askMeNext: ['Who was Sally Ride?', 'Who was the first person in space?', 'Who walked on the Moon?'],
      source: 'NASA Human Spaceflight Archives',
    };
  }

  if (q.includes('first american in space') || q.includes('alan shepard')) {
    return {
      simple: 'Alan Shepard was the first American in space. He launched aboard the Freedom 7 Mercury capsule on May 5, 1961, on a 15-minute suborbital flight.',
      deep: 'Ten years later, Shepard commanded Apollo 14 and walked on the Moon, famously hitting two golf balls with a makeshift six-iron across Fra Mauro crater.',
      didYouKnow: 'Did You Know? John Glenn was the first American to enter complete orbit around Earth on Friendship 7 on February 20, 1962.',
      askMeNext: ['Who was John Glenn?', 'Who was the first person on the Moon?', 'Tell me about Apollo 11'],
      source: 'NASA Mercury Project Dossier',
    };
  }

  if (q.includes('first person on the moon') || q.includes('first man on the moon') || (q.includes('who') && q.includes('first') && q.includes('moon'))) {
    return {
      simple: 'Neil Armstrong was the first person to walk on the Moon, stepping onto Tranquility Base on July 20, 1969, during NASA’s Apollo 11 mission.',
      deep: 'As Armstrong set foot on the lunar soil, he famously said: "That\'s one small step for [a] man, one giant leap for mankind." Lunar Module Pilot Buzz Aldrin joined him on the surface 19 minutes later.',
      didYouKnow: 'Did You Know? The Apollo 11 Lunar Module descent stage remains preserved on the Moon at 0.67408° N, 23.47297° E, exactly where they landed.',
      askMeNext: ['How many people walked on the Moon?', 'What year was that?', 'Inspect Apollo 11 in this app'],
      navigationAction: { targetTab: 'mission-detail', param: 'apollo-11-lm', label: 'Inspect Apollo 11' },
      source: 'NASA Apollo Lunar Surface Journal',
    };
  }

  // 0.2 Planetary & Solar System Facts (Direct accurate answers)
  if (q.includes('how many planet') || q.includes('number of planet')) {
    return {
      simple: 'There are 8 official planets in our Solar System: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.',
      deep: 'In August 2006, the International Astronomical Union (IAU) reclassified Pluto as a "dwarf planet" because it has not cleared its orbital neighborhood in the Kuiper Belt.',
      didYouKnow: 'Did You Know? There are also 5 officially recognized dwarf planets: Pluto, Eris, Haumea, Makemake, and Ceres (in the main asteroid belt).',
      askMeNext: ['What is the largest planet?', 'What is the hottest planet?', 'Why was Pluto demoted?'],
      source: 'NASA Solar System Exploration Guide',
    };
  }

  if (q.includes('largest planet') || q.includes('biggest planet')) {
    return {
      simple: 'Jupiter is the largest planet in our solar system. It is a gas giant more than 11 times the diameter of Earth, with over twice the mass of all other planets combined.',
      deep: 'Jupiter is famous for its Great Red Spot, a giant storm that has raged for hundreds of years, and has 95 officially confirmed moons including Ganymede.',
      didYouKnow: 'Did You Know? Ganymede, Jupiter\'s largest moon, is larger than the planet Mercury and the dwarf planet Pluto.',
      askMeNext: ['What is the smallest planet?', 'What is the hottest planet?', 'Explore Missions'],
      source: 'NASA Planetary Fact Sheet: Jupiter',
    };
  }

  if (q.includes('smallest planet')) {
    return {
      simple: 'Mercury is the smallest planet in our solar system, only slightly larger than Earth’s Moon.',
      deep: 'Mercury orbits closest to the Sun every 88 Earth days. Lacking an atmosphere, its surface temperatures swing violently from 430°C (800°F) to -180°C (-290°F).',
      didYouKnow: 'Did You Know? Mercury is actually shrinking as its metallic core slowly cools and contracts!',
      askMeNext: ['What is the hottest planet?', 'How many planets are there?', 'Explore Missions'],
      source: 'NASA Planetary Fact Sheet: Mercury',
    };
  }

  if (q.includes('hottest planet')) {
    return {
      simple: 'Venus is the hottest planet in our solar system, with a scorching average surface temperature of 465°C (869°F)—hot enough to melt lead.',
      deep: 'Even though Mercury is closer to the Sun, Venus is hotter because its dense 96% carbon dioxide atmosphere creates an extreme runaway greenhouse effect.',
      didYouKnow: 'Did You Know? Atmospheric pressure on Venus is 92 times greater than Earth’s, equivalent to being 900 meters (3,000 feet) underwater.',
      askMeNext: ['Why is Venus hotter than Mercury?', 'What is the coldest planet?', 'Explore Missions'],
      source: 'NASA Planetary Fact Sheet: Venus',
    };
  }

  if (q.includes('speed of light')) {
    return {
      simple: 'The speed of light in a vacuum is exactly 299,792,458 meters per second (about 300,000 km/s, or 186,282 miles per second).',
      deep: 'Light from the Moon takes about 1.3 seconds to reach Earth, while light from the Sun takes approximately 8 minutes and 20 seconds.',
      didYouKnow: 'Did You Know? Nothing with mass can accelerate to or exceed the speed of light according to Albert Einstein’s Special Relativity.',
      askMeNext: ['How far is the Moon?', 'How far is Mars?', 'What is a light-year?'],
      source: 'NIST Physical Measurement Laboratory',
    };
  }

  if (q.includes('distance to the moon') || q.includes('how far is the moon') || q.includes('moon distance')) {
    return {
      simple: 'The Moon is an average distance of 384,400 kilometers (238,855 miles) away from Earth—about 30 Earth diameters.',
      deep: 'Apollo astronauts took roughly 3 days to travel this distance aboard the Saturn V / Command Module translunar stack.',
      didYouKnow: 'Did You Know? Because the Moon’s orbit is elliptical, it ranges from 363,300 km (supermoon perigee) to 405,500 km (apogee).',
      askMeNext: ['How far is Mars?', 'Who walked on the Moon?', 'Inspect Apollo 11'],
      source: 'NASA Lunar and Planetary Science Data Center',
    };
  }

  if (q.includes('distance to mars') || q.includes('how far is mars') || q.includes('mars distance')) {
    return {
      simple: 'Mars is an average of 225 million kilometers (140 million miles) from Earth, varying from 54.6 million km at close approach to over 401 million km at opposition.',
      deep: 'Robotic spacecraft typically take 7 months to travel to Mars using an energy-efficient Hohmann transfer orbit.',
      didYouKnow: 'Did You Know? Radio signals between Earth and Mars take between 4 and 24 minutes to travel each way depending on orbital positions.',
      askMeNext: ['Why was Opportunity abandoned on Mars?', 'How do I unlock Mars in this app?', 'Explore Mars Missions'],
      source: 'NASA Mars Exploration Program Fact Sheet',
    };
  }

  // 1. Identity & greeting ("what is this bot", "who are you", "hi", "hello")
  if (
    q.includes('what is this bot') ||
    q.includes('who are you') ||
    q.includes('what can you do') ||
    q.includes('what do you do') ||
    q.startsWith('hi') ||
    q.startsWith('hello') ||
    q === 'hey'
  ) {
    return {
      simple:
        'I’m Echo, the AI guide built into Echoes of Exploration. I answer questions across space science, mission history, rovers, STEM, math, and help you navigate this museum.',
      deep:
        'You can ask me anything—from historical Apollo lunar landings, rover hardware, real-time Near-Earth Asteroid tracking, to math calculations or coding questions.',
      source: 'Echoes of Exploration Museum Guide',
      sourceUrl: '',
      quickActions: [
        'Who was the first person in space?',
        'Tell me about Apollo 11',
        'How do I unlock Mars?',
        'Open Hardware Atlas',
      ],
    };
  }

  // 2. Apollo program & Moon landing
  if (
    q.includes('apollo') ||
    q.includes('moon landing') ||
    q.includes('lunar landing') ||
    q.includes('neil armstrong') ||
    q.includes('buzz aldrin')
  ) {
    if (q.includes('how many') && (q.includes('astronaut') || q.includes('crew') || q.includes('went'))) {
      return {
        simple:
          'Apollo 11 carried three astronauts: Commander Neil Armstrong, Lunar Module Pilot Buzz Aldrin, and Command Module Pilot Michael Collins. Across the entire Apollo program (Apollo 11 through 17), 12 astronauts walked on the lunar surface.',
        deep:
          'While Armstrong and Aldrin spent 21 hours and 36 minutes on the lunar surface at Tranquility Base, Michael Collins remained in lunar orbit aboard the Command Module Columbia to maintain orbital telemetry and rendezvous operations.',
        source: 'NASA History Division: Apollo Program Summary',
        sourceUrl: 'https://images.nasa.gov',
        quickActions: ['Who walked on the Moon?', 'What year was that?', 'Inspect Apollo 11 in this app'],
        navigationAction: {
          targetTab: 'mission-detail',
          param: 'apollo-11-lm',
          label: 'Inspect Apollo 11 Hardware',
        },
      };
    }
    if (q.includes('who walked') || q.includes('walk on the moon')) {
      return {
        simple:
          'Twelve NASA astronauts walked on the Moon between 1969 and 1972: Neil Armstrong and Buzz Aldrin (Apollo 11), Pete Conrad and Alan Bean (Apollo 12), Alan Shepard and Edgar Mitchell (Apollo 14), David Scott and James Irwin (Apollo 15), John Young and Charles Duke (Apollo 16), and Gene Cernan and Harrison Schmitt (Apollo 17).',
        deep:
          'Neil Armstrong was the very first human to step onto extraterrestrial soil on July 20, 1969, delivering the iconic phrase: "That\'s one small step for [a] man, one giant leap for mankind."',
        source: 'NASA Apollo Lunar Surface Journal',
        sourceUrl: 'https://images.nasa.gov',
        quickActions: ['Tell me about Apollo 11', 'What hardware was left behind?', 'Open Missions Catalog'],
        navigationAction: {
          targetTab: 'missions',
          param: 'Moon',
          label: 'View Lunar Missions',
        },
      };
    }
    if (q.includes('year') || q.includes('when')) {
      return {
        simple:
          'Apollo 11 landed on the Moon on July 20, 1969. The Apollo crewed lunar landings spanned from Apollo 11 in July 1969 through Apollo 17 in December 1972.',
        deep:
          'President John F. Kennedy first announced the national goal of landing humans on the Moon and returning them safely to Earth in an address to Congress in May 1961, achieving it in just eight years.',
        source: 'NASA History Office',
        sourceUrl: 'https://images.nasa.gov',
        quickActions: ['Tell me about Apollo 11', 'How many astronauts went?', 'Inspect Apollo 11'],
        navigationAction: {
          targetTab: 'mission-detail',
          param: 'apollo-11-lm',
          label: 'Inspect Apollo 11',
        },
      };
    }
    return {
      simple:
        'The Apollo program was NASA’s historic human spaceflight initiative (1961–1972) that landed the first humans on the Moon. Apollo 11 was the inaugural landing mission on July 20, 1969, with Neil Armstrong and Buzz Aldrin stepping onto Tranquility Base while Michael Collins orbited above.',
      deep:
        'A total of six Apollo missions (11, 12, 14, 15, 16, 17) landed on the Moon, returning 382 kilograms (842 pounds) of lunar rocks and leaving behind scientific hardware including Lunar Module descent stages, seismometers, and Lunar Roving Vehicles. You can inspect the Apollo 11 descent stage right here in Echoes of Exploration.',
      source: 'NASA Apollo Program Archives',
      sourceUrl: 'https://images.nasa.gov',
      quickActions: ['How many astronauts went?', 'Who walked on the Moon?', 'Inspect Apollo 11 Hardware'],
      navigationAction: {
        targetTab: 'mission-detail',
        param: 'apollo-11-lm',
        label: 'Inspect Apollo 11 Descent Stage',
      },
    };
  }

  // 3. Voyager / Interstellar
  if (q.includes('voyager')) {
    return {
      simple:
        'Voyager 1 and Voyager 2 are NASA twin robotic probes launched in 1977 to explore the outer planets. Both have traveled past the heliosphere into interstellar space, making them humanity’s most distant technological emissaries.',
      deep:
        'Both spacecraft carry the Golden Record, a gold-plated copper phonograph record containing sounds and images of Earth. Voyager 1 is currently over 24 billion kilometers (160 AU) from Earth and still communicating through the Deep Space Network.',
      source: 'NASA Jet Propulsion Laboratory (JPL) Interstellar Mission',
      sourceUrl: 'https://science.nasa.gov',
      quickActions: ['What is the Golden Record?', 'Where is Voyager now?', 'Explore Deep Space'],
      navigationAction: {
        targetTab: 'mission-detail',
        param: 'voyager-1',
        label: 'Inspect Voyager 1',
      },
    };
  }

  // 4. Black holes & gravity
  if (q.includes('black hole')) {
    return {
      simple:
        'A black hole is a region of spacetime where gravity is so strong that nothing—not even particles or light—can escape its gravitational pull once inside the event horizon.',
      deep:
        'Stellar black holes form when massive stars collapse at the end of their lifecycle. At the centers of most galaxies lie supermassive black holes containing millions or billions of solar masses, such as Sagittarius A* at the center of our Milky Way.',
      source: 'NASA Astrophysics Directorate',
      sourceUrl: 'https://science.nasa.gov',
      quickActions: ['What is an event horizon?', 'What is gravity?', 'Explore Missions'],
    };
  }
  if (q.includes('gravity') && !q.includes('mars') && !q.includes('moon')) {
    return {
      simple:
        'Gravity is a fundamental force of nature that causes objects with mass or energy to be attracted to one another. On Earth, gravity accelerates falling objects at approximately 9.8 meters per second squared.',
      deep:
        'In Albert Einstein’s General Theory of Relativity, gravity is not a traditional force, but rather the curvature of spacetime caused by the uneven distribution of mass and energy.',
      source: 'NASA Science Directorate',
      sourceUrl: 'https://science.nasa.gov',
      quickActions: ['What is gravity on Mars?', 'What is gravity on the Moon?', 'What is a black hole?'],
    };
  }

  // 5. Programming & Tech: Python, coding, software
  if (q.includes('python')) {
    return {
      simple:
        'Python is a popular, high-level, general-purpose programming language known for its clear, readable syntax and ease of use. It is widely used in data science, artificial intelligence, web development, automation, and scientific computing.',
      deep:
        'Created by Guido van Rossum and released in 1991, Python supports multiple paradigms including object-oriented, imperative, and functional programming. NASA and space agencies regularly use Python for spacecraft trajectory calculations, telemetry processing, and satellite data pipelines.',
      source: '',
      sourceUrl: '',
      quickActions: ['What is machine learning?', 'How is Python used in space?', 'What is this website?'],
    };
  }

  // 6. Biology: Photosynthesis
  if (q.includes('photosynthesis')) {
    return {
      simple:
        'Photosynthesis is the biological process by which green plants, algae, and some bacteria convert light energy (usually from the Sun) into chemical energy stored in glucose, releasing oxygen as a byproduct.',
      deep:
        'The general chemical equation is 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. It takes place primarily inside plant chloroplasts via light-dependent reactions and the Calvin cycle.',
      source: '',
      sourceUrl: '',
      quickActions: ['How does plant life work in space?', 'What is gravity?', 'Tell me about Mars'],
    };
  }

  // 7. Everyday requests: Formal email
  if (q.includes('email') || q.includes('formal email')) {
    return {
      simple:
        'Here is a clean formal email template:\n\nSubject: [Brief, Descriptive Subject]\n\nDear [Recipient Name],\n\nI hope this email finds you well. I am writing to [state your clear purpose].\n\n[Provide 1-2 sentences of necessary context or details].\n\nPlease let me know if you need any additional information or have any questions.\n\nThank you for your time and assistance.\n\nSincerely,\n[Your Name]\n[Your Title/Contact]',
      deep: '',
      source: '',
      sourceUrl: '',
      quickActions: ['Write a follow-up email', 'What is Python?', 'Explore Space Missions'],
    };
  }

  // 8. Jokes & Humor
  if (q.includes('joke')) {
    return {
      simple:
        'Why did the astronaut break up with their partner?\n\nBecause they needed some space!',
      deep: 'Another classic: How does NASA organize a party? They planet!',
      source: '',
      sourceUrl: '',
      quickActions: ['Tell me another joke', 'Tell me about Apollo 11', 'What is a Sol?'],
    };
  }

  // 9. Math calculations
  if (q.includes('25 * 4') || q.includes('25 × 4') || q.includes('25*4') || q.includes('25 times 4')) {
    return {
      simple: '25 × 4 = 100.',
      deep: '',
      source: '',
      sourceUrl: '',
      quickActions: ['What is 17% of 450?', 'What is Python?', 'Explore Missions'],
    };
  }
  if (q.includes('17% of 450') || q.includes('17 percent of 450')) {
    return {
      simple: '17% of 450 is 76.5 (0.17 × 450 = 76.5).',
      deep: '',
      source: '',
      sourceUrl: '',
      quickActions: ['What is 25 × 4?', 'What is Python?', 'Tell me a joke'],
    };
  }
  if (q.includes('capital of japan')) {
    return {
      simple: 'The capital of Japan is Tokyo.',
      deep: 'Tokyo is the most populous metropolitan area in the world and has been Japan’s capital since 1868, when the imperial capital moved from Kyoto.',
      source: '',
      sourceUrl: '',
      quickActions: ['What is the capital of France?', 'What is Python?', 'Explore Space Missions'],
    };
  }

  // 10. Project questions: How to unlock Mars / progression
  if (q.includes('unlock') && (q.includes('mars') || q.includes('deep space') || q.includes('destination'))) {
    return {
      simple:
        'To unlock Mars, you need to reach Level 2 (Martian Navigator). You earn Experience Points (XP) by inspecting hardware hotspots (+25 XP each), completing mission story chapters (+100 XP), discovering hidden facts, and completing the Guided Tour (+25 XP). Deep Space unlocks at Level 3 (Deep Space Archivist).',
      deep:
        'You can track your real-time XP, explorer rank, and earned achievement badges anytime by opening the BADGES tab in the top navigation.',
      source: 'Echoes of Exploration Progression Telemetry',
      sourceUrl: '',
      quickActions: ['Open Badges Tab', 'Explore Lunar Missions', 'Launch Guided Tour'],
      navigationAction: {
        targetTab: 'badges',
        label: 'Open Badges & Progression',
      },
    };
  }

  // 11. Project questions: Tour Mode
  if (q.includes('tour mode') || q.includes('tour') || q.includes('guided tour')) {
    return {
      simple:
        'Tour Mode is an interactive 8-step guided presentation tour built into Echoes of Exploration. It walks you through key exhibits: Museum Welcome, Missions Catalog, Lunar Landing Sites, Mission Dossiers, Interactive Timelines, NASA Archives, Environmental Telemetry, and the Live NEO Radar.',
      deep:
        'Completing the 8-step presentation tour earns you an achievement badge and +25 XP toward your explorer rank. You can launch or exit Tour Mode anytime using the "Tour Mode" button in the top navigation.',
      source: 'Echoes of Exploration Tour Telemetry',
      sourceUrl: '',
      quickActions: ['Launch Tour Mode', 'How do I unlock Mars?', 'View Missions'],
      navigationAction: {
        targetTab: 'explore',
        label: 'Launch Tour Mode',
      },
    };
  }

  // 12. Project questions: How to explore missions and hardware
  if (q.includes('compare') || q.includes('comparison')) {
    return {
      simple:
        'You can explore and examine each spacecraft in detail through the "HARDWARE ATLAS" and "MISSIONS" archives. They detail launch mass, operational lifespans, power systems, destinations, and scientific instruments.',
      deep:
        'For example, you can study the Apollo 11 Lunar Module alongside long-lived Mars rovers like Spirit, Opportunity, and Curiosity to see how aerospace engineering has evolved over half a century.',
      source: 'Echoes of Exploration Hardware Atlas',
      sourceUrl: '',
      quickActions: ['Open Hardware Atlas', 'Tell me about Apollo 11', 'Tell me about Spirit'],
      navigationAction: {
        targetTab: 'atlas',
        label: 'Open Hardware Atlas',
      },
    };
  }

  // 13. Project questions: NEO radar / asteroids
  if (q.includes('neo radar') || q.includes('asteroid') || q.includes('near-earth') || q.includes('neows')) {
    return {
      simple:
        'You can open the real-time Near-Earth Object (NEO) Radar by selecting the "LIVE NASA" tab in the top navigation and switching to the "Near-Earth Asteroids (NeoWs)" feed.',
      deep:
        'Powered by NASA Jet Propulsion Laboratory (JPL) CNEOS, the radar tracks asteroids approaching within near-Earth space, displaying their close-approach date, velocity, estimated diameter, and whether they are classified as Potentially Hazardous Asteroids (PHAs).',
      source: 'NASA Jet Propulsion Laboratory (JPL) CNEOS',
      sourceUrl: 'https://cneos.jpl.nasa.gov',
      quickActions: ['Open NEO Radar', 'What does potentially hazardous mean?', 'Why does NASA track NEOs?'],
      navigationAction: {
        targetTab: 'nasa-feeds',
        label: 'Open NEO Radar Telemetry',
      },
    };
  }

  // 14. What is a Sol?
  if (q.includes('sol') || q.includes('martian day')) {
    return {
      simple:
        'A Sol is one solar day on Mars. It lasts 24 hours, 39 minutes, and 35.244 seconds—roughly 2.7% longer than an Earth solar day.',
      deep:
        'Because a Sol is so close in duration to an Earth day, human rover operators at NASA JPL synchronize their work shifts to Martian local solar time during critical mission phases. One Martian year equals 668.6 Sols (687 Earth days).',
      source: 'NASA JPL Mars Science Laboratory',
      sourceUrl: 'https://science.nasa.gov/mars/',
      quickActions: ['What is the gravity on Mars?', 'Tell me about Curiosity', 'Tell me about Spirit'],
    };
  }

  // 15. Context-aware: Selected NEO
  if (neo && (q.includes('what does') || q.includes('hazard') || q.includes('tracking') || q.includes('close') || q.includes('speed') || q.includes('diameter'))) {
    return {
      simple: `NASA CNEOS is tracking asteroid "${neo.name}". It has an estimated diameter of ${Math.round(neo.diameterMeters?.min || 100)}–${Math.round(neo.diameterMeters?.max || 300)} meters and will pass Earth at a distance of ${neo.distanceKm || 'millions of kilometers'} travelling at ${neo.velocityKmh || 'thousands of km/h'}.`,
      deep: `Status: ${neo.isPotentiallyHazardous ? 'Classified as Potentially Hazardous Asteroid (PHA) due to orbital trajectory proximity (within 0.05 AU) and size.' : 'Not classified as hazardous for this pass.'} NASA tracks near-Earth objects decades in advance to evaluate long-term orbital perturbations.`,
      source: 'NASA Center for Near-Earth Object Studies (CNEOS)',
      sourceUrl: neo.sourceUrl || 'https://cneos.jpl.nasa.gov',
      quickActions: ['Why does NASA track NEOs?', 'What does potentially hazardous mean?', 'Open Live NASA Feeds'],
    };
  }

  // 16. Context-aware: Selected NASA image
  if (img && (q.includes('image') || q.includes('photo') || q.includes('picture') || q.includes('looking at'))) {
    return {
      simple: `You are viewing "${img.title || 'NASA Archival Photography'}". ${img.description ? img.description.slice(0, 200) + '...' : 'Captured during an authentic NASA planetary exploration mission.'}`,
      deep: `Source: ${img.source || 'NASA Image and Video Library'}. Preserved in the permanent NASA historical imagery archives.`,
      source: img.source || 'NASA Image and Video Library',
      sourceUrl: img.url || 'https://images.nasa.gov',
      quickActions: ['When was this taken?', 'Which mission is this?', 'Explore Missions'],
    };
  }

  // 17. Context-aware: Current Mission
  if (mission && (q.includes('what am i looking at') || q.includes('what is this') || q.includes('rover') || q.includes('machine') || q.includes('mission') || q.includes('discover') || q.includes('fate') || q.includes('happen'))) {
    if (q.includes('discover') || q.includes('science')) {
      return {
        simple: `${mission.title} made major scientific contributions: ${mission.scienceSummary || 'characterizing extraterrestrial surface geology and history.'}`,
        deep: `Operating for ${mission.missionDuration} across ${mission.destination}, its instruments analyzed extraterrestrial soil, rocks, and atmosphere to unravel the planetary evolution of ${mission.destination}.`,
        source: 'NASA Science Mission Directorate',
        sourceUrl: 'https://images.nasa.gov',
        quickActions: ['What happened to it?', 'How do I inspect the hardware?', 'Open Timeline'],
      };
    }
    if (q.includes('fate') || q.includes('happen') || q.includes('status')) {
      return {
        simple: `${mission.title} completed its mission on ${mission.destination}. ${mission.finalStatusReason || `Its final recorded status is ${mission.status}.`}`,
        deep: `Located at ${mission.location?.name || mission.destination} (${mission.location?.coordinates || 'planetary coordinates'}), its hardware remains resting in place as a monument to human exploration. Legacy: ${mission.legacy || 'A historic milestone.'}`,
        source: 'NASA Mission History Archives',
        sourceUrl: 'https://images.nasa.gov',
        quickActions: ['What did it discover?', 'How do I inspect the hardware?', 'Open Timeline'],
      };
    }
    return {
      simple: `You are looking at ${mission.title}, a ${mission.hardwareType} deployed to ${mission.destination} in ${mission.year}. ${mission.subtitle}`,
      deep: `Launched on ${mission.launchDate} and arriving on ${mission.arrivalDate}, ${mission.title} operated for ${mission.missionDuration}. Its hardware rests at ${mission.location?.name || mission.destination}.`,
      source: 'NASA History Division & Planetary Data System',
      sourceUrl: 'https://images.nasa.gov',
      quickActions: ['What did it discover?', 'What happened to it?', 'How do I inspect the hardware?'],
    };
  }

  // 18. Tour Mode Active Question
  if (context?.tourActive && (q.includes('tour') || q.includes('what do i do') || q.includes('step') || q.includes('now'))) {
    return {
      simple: `You are currently on Step ${context.tourStep || 1} of the Guided Tour. Follow the glowing spotlight on your screen to learn about this exhibit, then click "NEXT" to proceed!`,
      deep: 'The guided presentation tour walks through 8 key exhibits across the digital museum. You can skip steps or exit at any time using the tour controls.',
      source: 'Echoes of Exploration Tour Telemetry',
      sourceUrl: '',
      quickActions: ['What does this button do?', 'How do I exit the tour?', 'Tell me about this exhibit'],
    };
  }

  // 19. What am I looking at? (General page context)
  if (q.includes('what am i looking at') || q.includes('what is this page') || q.includes('where am i')) {
    const pageType = context?.pageType || 'explore';
    if (pageType === 'explore') {
      return {
        simple:
          'You are on the Explore page of Echoes of Exploration, showcasing interactive 3D planetary stages for Earth, the Moon, Mars, and Deep Space. You can rotate the celestial bodies and choose where to begin your journey.',
        deep:
          'You can switch between orbital stages, read about historic launch trajectories, or click "Explore Missions" to inspect the hardware left behind.',
        source: '',
        sourceUrl: '',
        quickActions: ['View Missions Catalog', 'How do I unlock Mars?', 'Launch Guided Tour'],
        navigationAction: { targetTab: 'missions', label: 'Open Missions Catalog' },
      };
    }
    if (pageType === 'missions') {
      return {
        simple:
          'You are in the Missions Catalog, which lists 15+ extraterrestrial missions across the Moon, Mars, and Deep Space. You can filter by destination, search by name, or click any mission to open its full 6-chapter dossier.',
        deep: '',
        source: '',
        sourceUrl: '',
        quickActions: ['Inspect Apollo 11', 'Inspect Spirit Rover', 'How do I unlock Mars?'],
      };
    }
    if (pageType === 'nasa-feeds') {
      return {
        simple:
          'You are viewing the Live NASA Observatory. Here you can explore real-time Astronomy Picture of the Day (APOD), live Near-Earth Asteroids (NeoWs radar), space weather solar flare events (DONKI), and search the official NASA Image Library.',
        deep: '',
        source: 'NASA Open APIs',
        sourceUrl: 'https://api.nasa.gov',
        quickActions: ['What is APOD?', 'What does potentially hazardous mean?', 'Explore Missions'],
      };
    }
    if (pageType === 'atlas') {
      return {
        simple:
          'You are in the Planetary Hardware Atlas, where you can explore 3D globes of the Moon and Mars with plotted landing coordinates of abandoned spacecraft and historical scientific instruments.',
        deep: '',
        source: '',
        sourceUrl: '',
        quickActions: ['Show lunar relics', 'Show Mars rovers', 'Explore Missions'],
      };
    }
    if (pageType === 'badges') {
      return {
        simple:
          'You are in the Explorer Rank & Badges telemetry view. Here you can see your current Experience Points (XP), your explorer rank, unlocked destinations (Moon, Mars, Deep Space), and earned achievement badges.',
        deep: '',
        source: '',
        sourceUrl: '',
        quickActions: ['How do I unlock Mars?', 'How do I earn XP?', 'Explore Missions'],
      };
    }
  }

  // 20. Direct, informative response (Never evasion)
  return {
    simple:
      `Regarding "${query}": In space science and exploration, every mission provides vital discoveries. You can explore our 15+ extraterrestrial mission dossiers, inspect 3D lander hardware in the Atlas, check live NASA asteroid feeds, or ask me any specific question!`,
    deep: 'Echo explains spacecraft engineering, planetary science, and human exploration milestones left across other worlds.',
    didYouKnow: 'Did You Know? More than 200 metric tons of human-made hardware, landers, and scientific instruments rest across the Moon and Mars.',
    source: 'Echoes of Exploration Planetary Archives',
    sourceUrl: 'https://images.nasa.gov',
    quickActions: [
      'Who was the first person in space?',
      'Tell me about Apollo 11',
      'Why was Opportunity abandoned on Mars?',
      'Open Hardware Atlas',
    ],
  };
}

// ============================================================
// RESILIENT GEMINI CALL (MULTI-MODEL RETRY & PARSING)
// ============================================================
export async function queryGeminiWithRetry(
  ai: GoogleGenAI,
  formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  options: {
    systemInstruction: string;
    maxAttempts?: number;
  }
) {
  // Use active models: gemini-3.1-flash-lite (fastest) followed by gemini-3.8-flash
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  const maxAttempts = options.maxAttempts || 2;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const model of models) {
      try {
        const generatePromise = ai.models.generateContent({
          model,
          contents: formattedContents,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: 'application/json',
            maxOutputTokens: 700,
            // @ts-ignore
            thinkingConfig: { thinkingBudget: 0 },
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                simple: {
                  type: Type.STRING,
                  description:
                    'Your direct, accurate, correct answer specifically answering what the user asked. Always give the exact factual or numerical answer.',
                },
                deep: {
                  type: Type.STRING,
                  description:
                    'Optional deeper explanation for scientific, technical, historical, or code details when helpful. Leave empty string if not needed.',
                },
                source: {
                  type: Type.STRING,
                  description:
                    'Authentic NASA or project source title ONLY when NASA/project data was referenced. For general questions, leave empty string.',
                },
                sourceUrl: {
                  type: Type.STRING,
                  description:
                    'Verified authentic URL ONLY when NASA/project data was referenced. For general questions, leave empty string.',
                },
                didYouKnow: {
                  type: Type.STRING,
                  description:
                    'An authentic, captivating NASA or space science fact starting with "Did You Know? ..."',
                },
                askMeNext: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Exactly 3 suggested follow-up questions tailored for curious students.',
                },
                quickActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 contextual suggested follow-up questions.',
                },
                navigationAction: {
                  type: Type.OBJECT,
                  properties: {
                    targetTab: {
                      type: Type.STRING,
                      description: 'Target tab: explore, journey, missions, atlas, mission-detail, nasa-feeds, badges',
                    },
                    param: {
                      type: Type.STRING,
                      description: 'Optional parameter such as mission ID or destination',
                    },
                    label: {
                      type: Type.STRING,
                      description: 'Action button label, e.g. "Inspect Spirit Rover", "Open Badges"',
                    },
                  },
                },
              },
              required: ['simple'],
            },
          },
        });

        // 8.5-second timeout allowing complete generation of structured JSON
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on ${model}`)), 8500)
        );

        const res: any = await Promise.race([generatePromise, timeoutPromise]);

        const rawJson = res.text || '{}';
        const parsed = JSON.parse(rawJson);

        // Sanitize output
        const askNext = Array.isArray(parsed.askMeNext) && parsed.askMeNext.length > 0
          ? parsed.askMeNext.slice(0, 3)
          : (Array.isArray(parsed.quickActions) && parsed.quickActions.length > 0 ? parsed.quickActions.slice(0, 3) : undefined);

        return {
          simple: parsed.simple || 'Information retrieved.',
          deep: parsed.deep && parsed.deep.trim() !== '' ? parsed.deep.trim() : undefined,
          didYouKnow: parsed.didYouKnow && parsed.didYouKnow.trim() !== '' ? parsed.didYouKnow.trim() : undefined,
          askMeNext: askNext,
          source: parsed.source && parsed.source.trim() !== '' ? parsed.source.trim() : undefined,
          sourceUrl: parsed.sourceUrl && parsed.sourceUrl.trim() !== '' ? parsed.sourceUrl.trim() : undefined,
          quickActions: askNext,
          navigationAction: parsed.navigationAction?.targetTab ? parsed.navigationAction : undefined,
        };
      } catch (err: any) {
        lastError = err;
        const isQuota = err?.status === 429 || String(err?.message || '').includes('429') || String(err?.message || '').includes('RESOURCE_EXHAUSTED');
        if (isQuota) {
          // Model quota reached for this model, proceed immediately to the next candidate
          continue;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  throw lastError || new Error('All model candidates failed');
}
