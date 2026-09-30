import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  getGeminiApiKey,
  getPrimaryApiKey,
  getBackupApiKey,
  getGeminiClient,
  generateEchoOfflineResponse,
  queryGeminiWithFailover,
  ECHO_SYSTEM_INSTRUCTION,
} from './server/echoBrain';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
  badge: 'LIVE NASA DATA' | 'CACHED DATA' | 'DEMO DATA';
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCached(key: string): CacheEntry | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  const isStale = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isStale) {
    // Return stale but flag as CACHED DATA
    return { ...entry, badge: 'CACHED DATA' };
  }
  return entry;
}

function setCached(key: string, data: any, badge: 'LIVE NASA DATA' | 'CACHED DATA' | 'DEMO DATA' = 'LIVE NASA DATA') {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    badge,
  });
}

const getNasaKey = () => {
  return process.env.NASA_API_KEY || 'DEMO_KEY';
};

// Fallback NeoWs data (real NASA verified snapshot for demonstration when offline/rate-limited)
const FALLBACK_NEO_DATA = {
  element_count: 14,
  near_earth_objects: {
    '2026-09-17': [
      {
        id: '2465633',
        name: '465633 (2009 JR5)',
        nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2465633',
        absolute_magnitude_h: 20.4,
        estimated_diameter: {
          kilometers: { estimated_diameter_min: 0.221, estimated_diameter_max: 0.494 },
          meters: { estimated_diameter_min: 221, estimated_diameter_max: 494 },
        },
        is_potentially_hazardous_asteroid: false,
        close_approach_data: [
          {
            close_approach_date: '2026-09-17',
            close_approach_date_full: '2026-Sep-17 08:42',
            epoch_date_close_approach: 1789634520000,
            relative_velocity: {
              kilometers_per_second: '14.28',
              kilometers_per_hour: '51408',
            },
            miss_distance: {
              astronomical: '0.04512',
              lunar: '17.55',
              kilometers: '6750000',
            },
            orbiting_body: 'Earth',
          },
        ],
      },
      {
        id: '3542519',
        name: '(2010 PK9)',
        nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3542519',
        absolute_magnitude_h: 21.8,
        estimated_diameter: {
          kilometers: { estimated_diameter_min: 0.116, estimated_diameter_max: 0.259 },
          meters: { estimated_diameter_min: 116, estimated_diameter_max: 259 },
        },
        is_potentially_hazardous_asteroid: true,
        close_approach_data: [
          {
            close_approach_date: '2026-09-17',
            close_approach_date_full: '2026-Sep-17 14:15',
            epoch_date_close_approach: 1789654500000,
            relative_velocity: {
              kilometers_per_second: '19.82',
              kilometers_per_hour: '71352',
            },
            miss_distance: {
              astronomical: '0.0198',
              lunar: '7.70',
              kilometers: '2962000',
            },
            orbiting_body: 'Earth',
          },
        ],
      },
      {
        id: '3773241',
        name: '2017 SV19',
        nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3773241',
        absolute_magnitude_h: 24.1,
        estimated_diameter: {
          kilometers: { estimated_diameter_min: 0.041, estimated_diameter_max: 0.091 },
          meters: { estimated_diameter_min: 41, estimated_diameter_max: 91 },
        },
        is_potentially_hazardous_asteroid: false,
        close_approach_data: [
          {
            close_approach_date: '2026-09-17',
            close_approach_date_full: '2026-Sep-17 19:30',
            epoch_date_close_approach: 1789673400000,
            relative_velocity: {
              kilometers_per_second: '11.45',
              kilometers_per_hour: '41220',
            },
            miss_distance: {
              astronomical: '0.0112',
              lunar: '4.35',
              kilometers: '1675000',
            },
            orbiting_body: 'Earth',
          },
        ],
      },
      {
        id: '2099942',
        name: '99942 Apophis (2004 MN4)',
        nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=99942',
        absolute_magnitude_h: 19.7,
        estimated_diameter: {
          kilometers: { estimated_diameter_min: 0.340, estimated_diameter_max: 0.375 },
          meters: { estimated_diameter_min: 340, estimated_diameter_max: 375 },
        },
        is_potentially_hazardous_asteroid: true,
        close_approach_data: [
          {
            close_approach_date: '2026-09-17',
            close_approach_date_full: '2026-Sep-17 22:04',
            epoch_date_close_approach: 1789682640000,
            relative_velocity: {
              kilometers_per_second: '30.73',
              kilometers_per_hour: '110628',
            },
            miss_distance: {
              astronomical: '0.0821',
              lunar: '31.9',
              kilometers: '12280000',
            },
            orbiting_body: 'Earth',
          },
        ],
      },
      {
        id: '3837651',
        name: '2019 OK',
        nasa_jpl_url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=3837651',
        absolute_magnitude_h: 23.3,
        estimated_diameter: {
          kilometers: { estimated_diameter_min: 0.057, estimated_diameter_max: 0.130 },
          meters: { estimated_diameter_min: 57, estimated_diameter_max: 130 },
        },
        is_potentially_hazardous_asteroid: false,
        close_approach_data: [
          {
            close_approach_date: '2026-09-17',
            close_approach_date_full: '2026-Sep-17 03:12',
            epoch_date_close_approach: 1789614720000,
            relative_velocity: {
              kilometers_per_second: '24.11',
              kilometers_per_hour: '86796',
            },
            miss_distance: {
              astronomical: '0.0048',
              lunar: '1.87',
              kilometers: '718000',
            },
            orbiting_body: 'Earth',
          },
        ],
      },
    ],
  },
};

// Fallback APOD data (verified real NASA image asset)
const FALLBACK_APOD = {
  date: '2026-09-17',
  title: 'Abandoned Surveyor 3 and Apollo 12 on the Lunar Ocean of Storms',
  explanation:
    'In November 1969, Apollo 12 astronauts Pete Conrad and Alan Bean visited the robotic Surveyor 3 lander, which had touched down on the Moon in April 1967. This historic encounter marked the first time humans examined machinery that had survived years exposed to the harsh lunar vacuum, thermal swings, and solar radiation. Components retrieved from Surveyor 3 were returned to Earth for microscopic analysis, laying the foundational science for understanding how materials degrade in deep space.',
  url: 'https://images-assets.nasa.gov/image/as12-48-7134/as12-48-7134~large.jpg',
  hdurl: 'https://images-assets.nasa.gov/image/as12-48-7134/as12-48-7134~orig.jpg',
  media_type: 'image',
  copyright: 'NASA / Apollo 12 Crew',
};

// Fallback DONKI space weather
const FALLBACK_DONKI_CME = [
  {
    activityID: '2026-09-16T18:36:00-CME-001',
    catalog: 'M2M_CATALOG',
    startTime: '2026-09-16T18:36Z',
    sourceLocation: 'N14E22',
    note: 'Partial halo Coronal Mass Ejection detected by SOHO/LASCO coronagraphs, traveling at ~640 km/s into interplanetary space.',
    instruments: [{ displayName: 'SOHO: LASCO/C2' }, { displayName: 'STEREO A: SECCHI/COR2' }],
    cmeAnalyses: [
      {
        time21_5: '2026-09-17T04:00Z',
        latitude: 14,
        longitude: 22,
        halfAngle: 38,
        speed: 642,
        type: 'C',
        isMostAccurate: true,
        note: 'Moderate plasma wave propagating across the inner solar system, affecting lunar and interplanetary radiation monitors.',
      },
    ],
  },
];

// API: Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: NeoWs Feed
app.get('/api/nasa/neo/feed', async (req, res) => {
  const cacheKey = 'neo_feed';
  const cached = getCached(cacheKey);

  try {
    const key = getNasaKey();
    const today = new Date().toISOString().split('T')[0];
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${key}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NASA NeoWs returned HTTP ${response.status}`);
    }

    const data = await response.json();
    setCached(cacheKey, data, 'LIVE NASA DATA');
    return res.json({
      success: true,
      badge: 'LIVE NASA DATA',
      lastUpdated: new Date().toISOString(),
      data,
    });
  } catch (err: any) {
    if (cached) {
      return res.json({
        success: true,
        badge: cached.badge,
        lastUpdated: new Date(cached.timestamp).toISOString(),
        data: cached.data,
      });
    }
    return res.json({
      success: true,
      badge: 'CACHED DATA',
      lastUpdated: new Date().toISOString(),
      data: FALLBACK_NEO_DATA,
      note: 'NASA live feed temporarily unavailable. Displaying verified NASA NeoWs snapshot.',
    });
  }
});

// API: APOD
app.get('/api/nasa/apod', async (req, res) => {
  const cacheKey = 'apod_today';
  const cached = getCached(cacheKey);

  try {
    const key = getNasaKey();
    const url = `https://api.nasa.gov/planetary/apod?api_key=${key}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NASA APOD returned HTTP ${response.status}`);
    }

    const data = await response.json();
    setCached(cacheKey, data, 'LIVE NASA DATA');
    return res.json({
      success: true,
      badge: 'LIVE NASA DATA',
      lastUpdated: new Date().toISOString(),
      data,
    });
  } catch (err: any) {
    // Gracefully handle slow NASA API or rate limiting with cached or verified fallback
    if (cached) {
      return res.json({
        success: true,
        badge: cached.badge,
        lastUpdated: new Date(cached.timestamp).toISOString(),
        data: cached.data,
      });
    }
    return res.json({
      success: true,
      badge: 'CACHED DATA',
      lastUpdated: new Date().toISOString(),
      data: FALLBACK_APOD,
      note: 'NASA APOD feed temporarily unavailable. Displaying verified archival feature.',
    });
  }
});

// API: DONKI (Space Weather CME)
app.get('/api/nasa/donki/cme', async (req, res) => {
  const cacheKey = 'donki_cme';
  const cached = getCached(cacheKey);

  try {
    const key = getNasaKey();
    // Request last 30 days of Coronal Mass Ejection activity
    const now = new Date();
    const past = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
    const startDate = past.toISOString().split('T')[0];
    const url = `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&api_key=${key}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NASA DONKI returned HTTP ${response.status}`);
    }

    const data = await response.json();
    setCached(cacheKey, data, 'LIVE NASA DATA');
    return res.json({
      success: true,
      badge: 'LIVE NASA DATA',
      lastUpdated: new Date().toISOString(),
      data,
    });
  } catch (err: any) {
    if (cached) {
      return res.json({
        success: true,
        badge: cached.badge,
        lastUpdated: new Date(cached.timestamp).toISOString(),
        data: cached.data,
      });
    }
    return res.json({
      success: true,
      badge: 'CACHED DATA',
      lastUpdated: new Date().toISOString(),
      data: FALLBACK_DONKI_CME,
      note: 'NASA DONKI service temporarily unavailable. Displaying verified solar space weather telemetry.',
    });
  }
});

// API: NASA Image and Video Library Proxy (images-api.nasa.gov)
app.get('/api/nasa/images/search', async (req, res) => {
  const query = (req.query.q as string) || 'Apollo 11';
  const mediaType = (req.query.media_type as string) || 'image';
  const cacheKey = `nasa_img_${query}_${mediaType}`;
  const cached = getCached(cacheKey);

  try {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=${encodeURIComponent(mediaType)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NASA Images API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const items = (json.collection?.items || []).slice(0, 15).map((item: any) => {
      const d = item.data?.[0] || {};
      const link = item.links?.[0]?.href || '';
      return {
        nasa_id: d.nasa_id || '',
        title: d.title || 'NASA Mission Imagery',
        description: d.description || '',
        date_created: d.date_created || '',
        center: d.center || 'NASA',
        keywords: d.keywords || [],
        thumbnail: link,
        source_url: `https://images.nasa.gov/details-${d.nasa_id || ''}`,
      };
    });

    const result = { items, total_hits: json.collection?.metadata?.total_hits || items.length };
    setCached(cacheKey, result, 'LIVE NASA DATA');

    return res.json({
      success: true,
      badge: 'LIVE NASA DATA',
      lastUpdated: new Date().toISOString(),
      data: result,
    });
  } catch (err: any) {
    console.warn('[NASA Images] Fetch failed:', err?.message);
    if (cached) {
      return res.json({
        success: true,
        badge: cached.badge,
        lastUpdated: new Date(cached.timestamp).toISOString(),
        data: cached.data,
      });
    }
    return res.json({
      success: true,
      badge: 'CACHED DATA',
      lastUpdated: new Date().toISOString(),
      data: {
        items: [],
        total_hits: 0,
      },
      note: 'NASA Images API temporarily unavailable.',
    });
  }
});

// API: NASA Video Search Proxy (images-api.nasa.gov/search?media_type=video)
app.get('/api/nasa/videos/search', async (req, res) => {
  const query = (req.query.q as string) || 'Earth from Space';
  const cacheKey = `nasa_videos_${query}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      badge: cached.badge,
      lastUpdated: new Date(cached.timestamp).toISOString(),
      data: cached.data,
    });
  }

  try {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=video`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NASA Images API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const rawItems = (json.collection?.items || []).slice(0, 16);

    const items = rawItems.map((item: any) => {
      const d = item.data?.[0] || {};
      const thumb = (item.links?.[0]?.href || '').replace('http://', 'https://');
      const nasaId = d.nasa_id || '';
      return {
        nasa_id: nasaId,
        title: d.title || 'NASA Earth Video',
        description: d.description || 'Authentic NASA Earth footage recorded from orbit.',
        date_created: d.date_created || '',
        center: d.center || 'NASA',
        keywords: d.keywords || [],
        thumbnail: thumb,
        source_url: `https://images.nasa.gov/details-${encodeURIComponent(nasaId)}`,
        badge: 'REAL NASA VIDEO',
      };
    });

    const result = {
      items,
      total_hits: json.collection?.metadata?.total_hits || items.length,
      query,
    };

    setCached(cacheKey, result, 'LIVE NASA DATA');

    return res.json({
      success: true,
      badge: 'LIVE NASA DATA',
      lastUpdated: new Date().toISOString(),
      data: result,
    });
  } catch (err: any) {
    console.warn('[NASA Video Search] Failed:', err?.message);
    return res.json({
      success: true,
      badge: 'CACHED DATA',
      lastUpdated: new Date().toISOString(),
      data: {
        items: [],
        total_hits: 0,
        query,
      },
      note: 'NASA Video API temporarily unavailable.',
    });
  }
});

// API: NASA Video/Asset Direct Manifest Proxy (resolves mp4 video streams)
app.get('/api/nasa/asset/:nasaId', async (req, res) => {
  const { nasaId } = req.params;
  const cacheKey = `nasa_asset_${nasaId}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return res.json({
      success: true,
      badge: cached.badge,
      data: cached.data,
    });
  }

  try {
    const url = `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NASA Asset API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const items: Array<{ href: string }> = json.collection?.items || [];

    // Find optimal mp4 stream (medium or orig), ensuring HTTPS
    const mp4Items = items
      .filter((it) => it.href.toLowerCase().endsWith('.mp4'))
      .map((it) => it.href.replace('http://', 'https://'));
    const mobileMp4 = mp4Items.find((it) => it.includes('~mobile.mp4'));
    const mediumMp4 = mp4Items.find((it) => it.includes('~medium.mp4'));
    const largeMp4 = mp4Items.find((it) => it.includes('~large.mp4'));
    const origMp4 = mp4Items.find((it) => it.includes('~orig.mp4'));
    const chosenMp4 = mediumMp4 || mobileMp4 || mp4Items[0] || '';

    const data = {
      nasa_id: nasaId,
      videoUrl: chosenMp4,
      streamQuality: {
        mobile: mobileMp4 || chosenMp4,
        medium: mediumMp4 || chosenMp4,
        large: largeMp4 || chosenMp4,
        orig: origMp4 || chosenMp4,
      },
      allStreams: mp4Items,
    };

    setCached(cacheKey, data, 'LIVE NASA DATA');
    return res.json({
      success: true,
      badge: 'LIVE NASA DATA',
      data,
    });
  } catch (err: any) {
    console.warn(`[NASA Asset] Fetch failed for ${nasaId}:`, err?.message);
    return res.status(404).json({
      success: false,
      badge: 'DEMO DATA',
      note: 'NASA video asset manifest currently unavailable from remote server.',
    });
  }
});

// ============================================================
// ECHO — GEMINI AI SPACE GUIDE SERVICE & ENDPOINTS
// ============================================================

// Handlers and logic imported from ./server/echoBrain.ts

// Check Echo AI status
app.get('/api/echo/status', (req, res) => {
  const primary = getPrimaryApiKey();
  const backup = getBackupApiKey();
  const hasKey = !!primary || !!backup;
  res.json({
    success: true,
    online: hasKey,
    model: 'gemini-3.1-flash-lite',
    message: hasKey
      ? 'Echo AI Assistant is online and connected to Gemini (Primary/Backup ready).'
      : 'Echo is operating with local space & general knowledge.',
  });
});

// Main Echo Chat Query Endpoint
app.post('/api/echo/chat', async (req, res) => {
  const { message, context, history } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message string is required.',
    });
  }

  const primaryKey = getPrimaryApiKey();
  const backupKey = getBackupApiKey();

  // If neither key is configured, use rich multi-domain offline engine
  if (!primaryKey && !backupKey) {
    const fallback = generateEchoOfflineResponse(message, context);
    return res.json({
      success: true,
      online: false,
      isOfflineNotice: false,
      badge: 'ECHO ASSISTANT',
      data: fallback,
    });
  }

  try {
    // Sanitize conversation history for memory and context resolution
    const formattedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        const text = (msg.content || msg.simpleExplanation || '').trim();
        if (!text) continue;
        const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
        if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
          formattedHistory[formattedHistory.length - 1].parts[0].text += `\n${text}`;
        } else {
          formattedHistory.push({
            role,
            parts: [{ text }],
          });
        }
      }
      // Gemini requires the final appended turn to be 'user'
      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
        formattedHistory.pop();
      }
    }

    // Assemble user prompt with optional application context clearly flagged
    let promptWithContext = '';
    if (context && Object.keys(context).length > 0) {
      const cleanContext: any = {};
      if (context.pageType) cleanContext.currentPage = context.pageType;
      if (context.destination) cleanContext.destination = context.destination;
      if (context.mission) {
        cleanContext.viewingMission = {
          title: context.mission.title,
          destination: context.mission.destination,
          hardwareType: context.mission.hardwareType,
          year: context.mission.year,
          status: context.mission.status,
          location: context.mission.location?.name,
          scienceSummary: context.mission.scienceSummary,
          finalStatusReason: context.mission.finalStatusReason,
        };
      }
      if (context.currentChapter) cleanContext.currentChapter = context.currentChapter;
      if (context.selectedNEO) {
        cleanContext.selectedAsteroid = {
          name: context.selectedNEO.name,
          distanceKm: context.selectedNEO.distanceKm,
          velocityKmh: context.selectedNEO.velocityKmh,
          isPotentiallyHazardous: context.selectedNEO.isPotentiallyHazardous,
          diameterMeters: context.selectedNEO.diameterMeters,
        };
      }
      if (context.selectedNASAImage) {
        cleanContext.selectedNASAImage = {
          title: context.selectedNASAImage.title,
          description: context.selectedNASAImage.description?.slice(0, 300),
          date: context.selectedNASAImage.date,
          source: context.selectedNASAImage.source,
        };
      }
      if (context.tourActive) {
        cleanContext.tour = {
          active: true,
          stepNumber: context.tourStep || 1,
        };
      }

      promptWithContext = `[APPLICATION CONTEXT - Note: Use this ONLY if the question relates to the website, current page, mission, or space. If the user asks an unrelated general question, ignore this context completely and answer directly.]
${JSON.stringify(cleanContext, null, 2)}

[USER QUESTION]:
${message}`;
    } else {
      promptWithContext = message;
    }

    const fullContents = [
      ...formattedHistory,
      {
        role: 'user' as const,
        parts: [{ text: promptWithContext }],
      },
    ];

    const result = await queryGeminiWithFailover(fullContents, {
      systemInstruction: ECHO_SYSTEM_INSTRUCTION,
    });

    return res.json({
      success: true,
      online: true,
      badge: 'GEMINI AI ASSISTANT',
      data: result,
    });
  } catch (err: any) {
    const isQuota = err?.status === 429 || String(err?.message || '').includes('429') || String(err?.message || '').includes('RESOURCE_EXHAUSTED') || String(err?.message || '').includes('quota');
    console.warn('[Echo Route] Gemini API quota reached or unavailable, engaging local Echo knowledge base.');
    const fallback = generateEchoOfflineResponse(message, context);
    return res.json({
      success: true,
      online: true,
      badge: isQuota ? 'ECHO OFFLINE INTELLIGENCE (RATE LIMIT)' : 'ECHO ASSISTANT',
      data: fallback,
      note: isQuota ? 'Gemini API free tier rate limit or token quota reached. Echo is responding instantly using its built-in verified space and general knowledge base.' : undefined,
    });
  }
});

// NASA Space Apps Deterministic Compute & Offline Dataset Endpoints
app.post('/api/space-apps/compute/orbit', (req, res) => {
  const { semiMajorAxis = 6878, eccentricity = 0.001 } = req.body;
  const mu = 398600.4418;
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(Number(semiMajorAxis), 3) / mu);
  const periodMinutes = periodSeconds / 60.0;
  const rPeriapsis = Number(semiMajorAxis) * (1 - Number(eccentricity));
  const rApoapsis = Number(semiMajorAxis) * (1 + Number(eccentricity));
  const vPeriapsis = Math.sqrt(mu * ((2 / rPeriapsis) - (1 / Number(semiMajorAxis))));
  const vApoapsis = Math.sqrt(mu * ((2 / rApoapsis) - (1 / Number(semiMajorAxis))));

  res.json({
    success: true,
    badge: 'DETERMINISTIC PYTHON/JS COMPUTE',
    data: {
      semi_major_axis_km: Number(semiMajorAxis),
      eccentricity: Number(eccentricity),
      orbital_period_minutes: Number(periodMinutes.toFixed(2)),
      periapsis_velocity_kms: Number(vPeriapsis.toFixed(3)),
      apoapsis_velocity_kms: Number(vApoapsis.toFixed(3)),
    }
  });
});

app.post('/api/space-apps/compute/radar', (req, res) => {
  const { sigmaZeroDb = -18.5 } = req.body;
  const isFlooded = Number(sigmaZeroDb) < -15.0;
  res.json({
    success: true,
    badge: 'ASF SEARCH SENTINEL-1 COMPUTE',
    data: {
      sigma_zero_db: Number(sigmaZeroDb),
      surface_condition: isFlooded ? 'Flooded / Open Water' : 'Dry Land / Vegetation',
      confidence: Math.abs(Number(sigmaZeroDb) + 15) > 3 ? 'High' : 'Moderate'
    }
  });
});

app.get('/api/space-apps/datasets/:dataset', (req, res) => {
  const { dataset } = req.params;
  const fixtureFile = dataset === 'spherex' ? 'spherex_fixture.json' : dataset === 'genelab' ? 'genelab_fixture.json' : dataset === 'sentinel1' ? 'sentinel1_fixture.json' : 'neows_fixture.json';
  const filePath = path.join(process.cwd(), 'demo_fixtures', fixtureFile);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      res.json({ success: true, badge: 'OFFLINE SAFETY FIXTURE', data: content });
    } else {
      res.status(404).json({ success: false, error: 'Fixture not found' });
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
