// src/data/nasaMissionMediaDatabase.ts

export type MissionMediaType = 'video' | 'image';

export interface MissionMediaItem {
  id: string;
  title: string;
  description: string;
  type: MissionMediaType;

  // NASA Images API search query.
  // We resolve the real NASA video URL at runtime.
  searchQuery: string;

  sourceUrl: string;

  missionId: string;
  chapterId: string;

  date?: string;
  posterUrl?: string;
}

export interface MissionDefinition {
  id: string;
  title: string;
  destination: 'Moon' | 'Mars' | 'Deep Space';
  year: string;
  description: string;
  chapters: MissionMediaItem[];
}

/*
|--------------------------------------------------------------------------
| NASA mission IDs used by the existing application
|--------------------------------------------------------------------------
*/

export const MISSION_ID_ALIASES: Record<string, string> = {
  apollo_11: 'apollo_11',
  'apollo-11': 'apollo_11',
  'apollo-11-lm': 'apollo_11',
  apollo11: 'apollo_11',

  surveyor_3: 'surveyor_3',
  'surveyor-3': 'surveyor_3',
  surveyor3: 'surveyor_3',

  apollo_15_lrv: 'apollo_15_lrv',
  'apollo-15-lrv': 'apollo_15_lrv',
  'lunar-roving-vehicle-15': 'apollo_15_lrv',
  'apollo-15': 'apollo_15_lrv',

  spirit_rover: 'spirit_rover',
  'spirit-rover': 'spirit_rover',
  spirit: 'spirit_rover',

  opportunity_rover: 'opportunity_rover',
  'opportunity-rover': 'opportunity_rover',
  opportunity: 'opportunity_rover',

  insight_lander: 'insight_lander',
  'insight-lander': 'insight_lander',
  insight: 'insight_lander',

  voyager_1: 'voyager_1',
  'voyager-1': 'voyager_1',
  voyager: 'voyager_1',

  pioneer_10: 'pioneer_10',
  'pioneer-10': 'pioneer_10',
  pioneer: 'pioneer_10',
};

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

const nasaVideo = (
  missionId: string,
  chapterId: string,
  id: string,
  title: string,
  description: string,
  searchQuery: string,
  date?: string
): MissionMediaItem => ({
  id,
  missionId,
  chapterId,
  type: 'video',
  title,
  description,
  searchQuery,
  sourceUrl: 'https://images.nasa.gov/',
  date,
});

/*
|--------------------------------------------------------------------------
| NASA MISSION MEDIA DATABASE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| We do NOT hard-code random MP4 URLs.
|
| The app searches NASA's official Images & Video Library and resolves
| the actual video asset at runtime.
|
|--------------------------------------------------------------------------
*/

export const NASA_MISSION_MEDIA_DATABASE: Record<string, MissionDefinition> = {

  // ============================================================
  // APOLLO 11
  // ============================================================

  apollo_11: {
    id: 'apollo_11',
    title: 'Apollo 11 Lunar Module',
    destination: 'Moon',
    year: '1969',
    description:
      'The Apollo 11 mission carried humans to the lunar surface for the first crewed Moon landing.',
    chapters: [

      nasaVideo(
        'apollo_11',
        'chapter_1',
        'apollo11_launch',
        'Apollo 11 Launch',
        'Historic Apollo 11 Saturn V launch footage.',
        'Apollo 11 launch',
        'July 16, 1969'
      ),

      nasaVideo(
        'apollo_11',
        'chapter_2',
        'apollo11_liftoff',
        'Apollo 11 Liftoff',
        'NASA archive footage covering the beginning of the Apollo 11 mission.',
        'Apollo 11 Saturn V',
        '1969'
      ),

      nasaVideo(
        'apollo_11',
        'chapter_3',
        'apollo11_lunar_module',
        'Lunar Module Eagle',
        'Apollo 11 Lunar Module and mission footage.',
        'Apollo 11 Lunar Module Eagle',
        '1969'
      ),

      nasaVideo(
        'apollo_11',
        'chapter_4',
        'apollo11_landing',
        'Apollo 11 Moon Landing',
        'Historic footage associated with the first human lunar landing.',
        'Apollo 11 Moon landing',
        'July 20, 1969'
      ),

      nasaVideo(
        'apollo_11',
        'chapter_5',
        'apollo11_surface',
        'Tranquility Base',
        'Apollo 11 lunar surface exploration footage.',
        'Apollo 11 lunar surface',
        '1969'
      ),

      nasaVideo(
        'apollo_11',
        'chapter_6',
        'apollo11_ascent',
        'Lunar Module Ascent',
        'Apollo 11 ascent from the lunar surface.',
        'Apollo 11 lunar module ascent',
        '1969'
      ),

      nasaVideo(
        'apollo_11',
        'chapter_7',
        'apollo11_return',
        'Apollo 11 Return',
        'Archive material from the return portion of Apollo 11.',
        'Apollo 11 return to Earth',
        '1969'
      ),
    ],
  },

  // ============================================================
  // SURVEYOR 3
  // ============================================================

  surveyor_3: {
    id: 'surveyor_3',
    title: 'Surveyor 3 Robotic Lander',
    destination: 'Moon',
    year: '1967',
    description:
      'Surveyor 3 was an unmanned lunar lander that investigated the lunar surface before Apollo.',
    chapters: [

      nasaVideo(
        'surveyor_3',
        'chapter_1',
        'surveyor3_mission',
        'Surveyor 3 Mission',
        'NASA archive material related specifically to Surveyor 3.',
        'Surveyor 3',
        '1967'
      ),

      nasaVideo(
        'surveyor_3',
        'chapter_2',
        'surveyor3_landing',
        'Surveyor 3 Lunar Landing',
        'Footage and archive material concerning the Surveyor 3 landing.',
        'Surveyor 3 lunar landing',
        'April 20, 1967'
      ),

      nasaVideo(
        'surveyor_3',
        'chapter_3',
        'surveyor3_surface',
        'Surveyor 3 Surface Operations',
        'NASA archive material about Surveyor 3 surface investigations.',
        'Surveyor 3 lunar surface',
        '1967'
      ),

      nasaVideo(
        'surveyor_3',
        'chapter_4',
        'surveyor3_apollo15',
        'Surveyor 3 Apollo 12 Investigation',
        'Archive material concerning the later investigation of Surveyor 3.',
        'Surveyor 3 Apollo 12',
        '1969'
      ),
    ],
  },

  // ============================================================
  // APOLLO 15 LRV
  // ============================================================

  apollo_15_lrv: {
    id: 'apollo_15_lrv',
    title: 'Apollo 15 Lunar Roving Vehicle',
    destination: 'Moon',
    year: '1971',
    description:
      'Apollo 15 introduced the Lunar Roving Vehicle for extended surface exploration.',
    chapters: [

      nasaVideo(
        'apollo_15_lrv',
        'chapter_1',
        'apollo15_launch',
        'Apollo 15 Launch',
        'Apollo 15 launch archive footage.',
        'Apollo 15 launch',
        'July 26, 1971'
      ),

      nasaVideo(
        'apollo_15_lrv',
        'chapter_2',
        'apollo15_lrv',
        'Lunar Roving Vehicle',
        'Apollo 15 Lunar Roving Vehicle operations.',
        'Apollo 15 Lunar Roving Vehicle',
        '1971'
      ),

      nasaVideo(
        'apollo_15_lrv',
        'chapter_3',
        'apollo15_surface',
        'Apollo 15 Lunar Surface',
        'Apollo 15 astronauts exploring the lunar surface.',
        'Apollo 15 lunar surface',
        '1971'
      ),

      nasaVideo(
        'apollo_15_lrv',
        'chapter_4',
        'apollo15_hadley',
        'Hadley-Apennine Exploration',
        'Apollo 15 exploration of the Hadley-Apennine region.',
        'Apollo 15 Hadley Apennine',
        '1971'
      ),
    ],
  },

  // ============================================================
  // SPIRIT
  // ============================================================

  spirit_rover: {
    id: 'spirit_rover',
    title: 'Spirit Mars Exploration Rover',
    destination: 'Mars',
    year: '2004',
    description:
      'Spirit explored Gusev Crater and investigated the geology of Mars.',
    chapters: [

      nasaVideo(
        'spirit_rover',
        'chapter_1',
        'spirit_launch',
        'Spirit Rover Launch',
        'NASA footage associated with the launch of Spirit.',
        'Mars Exploration Rover Spirit launch',
        '2003'
      ),

      nasaVideo(
        'spirit_rover',
        'chapter_2',
        'spirit_arrival',
        'Spirit Arrives at Mars',
        'Archive footage covering Spirit arrival and landing operations.',
        'Spirit rover Mars landing',
        '2004'
      ),

      nasaVideo(
        'spirit_rover',
        'chapter_3',
        'spirit_rover',
        'Spirit Rover on Mars',
        'Spirit rover exploration and operations.',
        'Spirit rover Mars',
        '2004'
      ),

      nasaVideo(
        'spirit_rover',
        'chapter_4',
        'spirit_hills',
        'Spirit and Columbia Hills',
        'Spirit exploration of Columbia Hills.',
        'Spirit rover Columbia Hills',
        '2005'
      ),

      nasaVideo(
        'spirit_rover',
        'chapter_5',
        'spirit_panorama',
        'Spirit Mars Panorama',
        'NASA material documenting Spirit observations on Mars.',
        'Spirit rover Mars panorama',
        '2006'
      ),

      nasaVideo(
        'spirit_rover',
        'chapter_6',
        'spirit_operations',
        'Spirit Rover Operations',
        'Spirit mission operations and rover activity.',
        'Spirit rover mission operations',
        '2007'
      ),

      nasaVideo(
        'spirit_rover',
        'chapter_7',
        'spirit_legacy',
        'Spirit Mission Legacy',
        'NASA archive material covering the Spirit rover mission.',
        'Spirit Mars rover mission',
        '2010'
      ),
    ],
  },

  // ============================================================
  // OPPORTUNITY
  // ============================================================

  opportunity_rover: {
    id: 'opportunity_rover',
    title: 'Opportunity Mars Exploration Rover',
    destination: 'Mars',
    year: '2004',
    description:
      'Opportunity explored Mars for more than a decade and investigated evidence of ancient water.',
    chapters: [

      nasaVideo(
        'opportunity_rover',
        'chapter_1',
        'opportunity_launch',
        'Opportunity Launch',
        'NASA footage associated with the Mars Exploration Rover Opportunity launch.',
        'Mars Exploration Rover Opportunity launch',
        '2003'
      ),

      nasaVideo(
        'opportunity_rover',
        'chapter_2',
        'opportunity_landing',
        'Opportunity Landing',
        'Archive material related to Opportunity landing on Mars.',
        'Opportunity rover Mars landing',
        '2004'
      ),

      nasaVideo(
        'opportunity_rover',
        'chapter_3',
        'opportunity_mars',
        'Opportunity on Mars',
        'Opportunity rover exploration footage and mission material.',
        'Opportunity rover Mars',
        '2004'
      ),

      nasaVideo(
        'opportunity_rover',
        'chapter_4',
        'opportunity_craters',
        'Opportunity Crater Exploration',
        'Opportunity investigations of Martian craters.',
        'Opportunity rover crater Mars',
        '2004'
      ),

      nasaVideo(
        'opportunity_rover',
        'chapter_5',
        'opportunity_victoria',
        'Victoria Crater',
        'Opportunity exploration near Victoria Crater.',
        'Opportunity rover Victoria Crater',
        '2006'
      ),

      nasaVideo(
        'opportunity_rover',
        'chapter_6',
        'opportunity_endeavour',
        'Endeavour Crater',
        'Opportunity exploration around Endeavour Crater.',
        'Opportunity rover Endeavour Crater',
        '2011'
      ),

      nasaVideo(
        'opportunity_rover',
        'chapter_7',
        'opportunity_final',
        'Opportunity Final Mission',
        'NASA archive material covering the final phase of the Opportunity mission.',
        'Opportunity rover final mission',
        '2018'
      ),
    ],
  },

  // ============================================================
  // INSIGHT
  // ============================================================

  insight_lander: {
    id: 'insight_lander',
    title: 'InSight Mars Lander',
    destination: 'Mars',
    year: '2018',
    description:
      'NASA InSight studied the interior structure and seismic activity of Mars.',
    chapters: [

      nasaVideo(
        'insight_lander',
        'chapter_1',
        'insight_launch',
        'InSight Launch',
        'NASA footage of the InSight mission launch.',
        'NASA InSight launch',
        '2018'
      ),

      nasaVideo(
        'insight_lander',
        'chapter_2',
        'insight_landing',
        'InSight Mars Landing',
        'NASA footage from the InSight landing.',
        'InSight Mars landing',
        'November 26, 2018'
      ),

      nasaVideo(
        'insight_lander',
        'chapter_3',
        'insight_surface',
        'InSight on Mars',
        'InSight surface operations on Mars.',
        'InSight Mars surface',
        '2018'
      ),

      nasaVideo(
        'insight_lander',
        'chapter_4',
        'insight_seismic',
        'Marsquakes',
        'InSight mission material about seismic activity on Mars.',
        'InSight Marsquakes',
        '2019'
      ),

      nasaVideo(
        'insight_lander',
        'chapter_5',
        'insight_interior',
        'Inside Mars',
        'NASA material explaining InSight investigations of the Martian interior.',
        'NASA InSight interior Mars',
        '2020'
      ),
    ],
  },

  // ============================================================
  // VOYAGER 1
  // ============================================================

  voyager_1: {
    id: 'voyager_1',
    title: 'Voyager 1 Interstellar Spacecraft',
    destination: 'Deep Space',
    year: '1977',
    description:
      'Voyager 1 is a NASA spacecraft exploring the outer Solar System and interstellar space.',
    chapters: [

      nasaVideo(
        'voyager_1',
        'chapter_1',
        'voyager1_launch',
        'Voyager 1 Launch',
        'NASA archive material about the launch of Voyager 1.',
        'Voyager 1 launch',
        '1977'
      ),

      nasaVideo(
        'voyager_1',
        'chapter_2',
        'voyager1_jupiter',
        'Voyager 1 at Jupiter',
        'Voyager 1 observations of Jupiter.',
        'Voyager 1 Jupiter',
        '1979'
      ),

      nasaVideo(
        'voyager_1',
        'chapter_3',
        'voyager1_saturn',
        'Voyager 1 at Saturn',
        'Voyager 1 observations of Saturn.',
        'Voyager 1 Saturn',
        '1980'
      ),

      nasaVideo(
        'voyager_1',
        'chapter_4',
        'voyager1_interstellar',
        'Voyager 1 Interstellar Mission',
        'NASA material concerning Voyager 1 and interstellar space.',
        'Voyager 1 interstellar space',
        '2012'
      ),
    ],
  },

  // ============================================================
  // PIONEER 10
  // ============================================================

  pioneer_10: {
    id: 'pioneer_10',
    title: 'Pioneer 10 Deep Space Spacecraft',
    destination: 'Deep Space',
    year: '1972',
    description:
      'Pioneer 10 was the first spacecraft to travel through the asteroid belt and make close observations of Jupiter.',
    chapters: [

      nasaVideo(
        'pioneer_10',
        'chapter_1',
        'pioneer10_launch',
        'Pioneer 10 Launch',
        'NASA archive material concerning Pioneer 10 launch.',
        'Pioneer 10 launch',
        '1972'
      ),

      nasaVideo(
        'pioneer_10',
        'chapter_2',
        'pioneer10_jupiter',
        'Pioneer 10 at Jupiter',
        'Pioneer 10 observations of Jupiter.',
        'Pioneer 10 Jupiter',
        '1973'
      ),

      nasaVideo(
        'pioneer_10',
        'chapter_3',
        'pioneer10_asteroid',
        'Asteroid Belt Passage',
        'Mission material related to Pioneer 10 asteroid belt exploration.',
        'Pioneer 10 asteroid belt',
        '1972'
      ),

      nasaVideo(
        'pioneer_10',
        'chapter_4',
        'pioneer10_deep_space',
        'Pioneer 10 Deep Space',
        'NASA archive material concerning Pioneer 10 deep-space operations.',
        'Pioneer 10 deep space',
        '1970s'
      ),
    ],
  },
};

/*
|--------------------------------------------------------------------------
| SATELLITE & ORBITAL VIDEOS (OFFICIAL NASA ARCHIVES)
|--------------------------------------------------------------------------
*/

export interface SatelliteVideoInfo {
  satelliteName: string;
  destination: string;
  agency: string;
  videoUrl: string;
  posterUrl: string;
  title: string;
  description: string;
  nasaId: string;
  orbitalAltitude: string;
  telemetryChannel: string;
}

export const VERIFIED_SATELLITE_VIDEOS: Record<string, SatelliteVideoInfo> = {
  Moon: {
    satelliteName: 'Lunar Reconnaissance Orbiter (LRO)',
    destination: 'Moon',
    agency: 'NASA / Goddard Space Flight Center',
    videoUrl:
      'https://images-assets.nasa.gov/video/GSFC_20190618_LRO_m13229_10Years/GSFC_20190618_LRO_m13229_10Years~medium.mp4',
    posterUrl:
      'https://images-assets.nasa.gov/video/GSFC_20190618_LRO_m13229_10Years/GSFC_20190618_LRO_m13229_10Years~medium.jpg',
    title: 'LRO Satellite: 10 Years of Ultra-High-Resolution Lunar Orbital Telemetry',
    description:
      'Official NASA Goddard satellite video documenting LRO mapping lunar impact basins, permanently shadowed craters, and historic Apollo landing sites from a 50 km polar orbit.',
    nasaId: 'GSFC_20190618_LRO_m13229_10Years',
    orbitalAltitude: '50 km Lunar Polar Orbit',
    telemetryChannel: 'Ka-Band 40 Mbps Direct-to-Earth',
  },
  Mars: {
    satelliteName: 'Mars Reconnaissance Orbiter (MRO)',
    destination: 'Mars',
    agency: 'NASA / Jet Propulsion Laboratory (JPL)',
    videoUrl:
      'https://images-assets.nasa.gov/video/JPL-20211115-MARSf-0001-Hows the Weather on Mars/JPL-20211115-MARSf-0001-Hows the Weather on Mars~medium.mp4',
    posterUrl:
      'https://images-assets.nasa.gov/image/PIA04850/PIA04850~large.jpg',
    title: 'MRO Satellite: Mars Orbital Meteorology and Surface Mapping',
    description:
      'NASA JPL satellite orbital imaging and atmospheric data tracking dust storms, polar ice cap variations, and rover traverse regions across Mars.',
    nasaId: 'JPL-20211115-MARSf-0001',
    orbitalAltitude: '255 × 320 km Sun-Synchronous Martian Orbit',
    telemetryChannel: 'X-Band Deep Space Network Interlink',
  },
  'Deep Space': {
    satelliteName: 'Voyager Deep Space & Hubble Space Telescope',
    destination: 'Deep Space',
    agency: 'NASA / JPL / STScI',
    videoUrl:
      'https://images-assets.nasa.gov/video/JPL-20240425-VOYAGEf-0001-Voyager 1 Team Reacts to Receiving Engineering Data From Spacecraft/JPL-20240425-VOYAGEf-0001-Voyager 1 Team Reacts to Receiving Engineering Data From Spacecraft~medium.mp4',
    posterUrl:
      'https://images-assets.nasa.gov/image/PIA17049/PIA17049~large.jpg',
    title: 'Interstellar Signal Telemetry & Deep Space Network Tracking',
    description:
      'Authentic NASA Jet Propulsion Laboratory engineering capture showing DSN radio dish synchronization receiving telemetry packets from outer heliosphere space.',
    nasaId: 'JPL-20240425-VOYAGEf-0001',
    orbitalAltitude: '24+ Billion Kilometers (Interstellar)',
    telemetryChannel: 'S-Band / X-Band 8.4 GHz DSN Goldstone',
  },
  Earth: {
    satelliteName: 'Landsat 8/9 & Sentinel-6 Earth Observation Satellite',
    destination: 'Earth',
    agency: 'NASA / USGS / ESA',
    videoUrl:
      'https://images-assets.nasa.gov/video/GSFC_20171031_Landsat_m12754_whiskbroom/GSFC_20171031_Landsat_m12754_whiskbroom~medium.mp4',
    posterUrl:
      'https://images-assets.nasa.gov/video/GSFC_20171031_Landsat_m12754_whiskbroom/GSFC_20171031_Landsat_m12754_whiskbroom~medium.jpg',
    title: 'Landsat Satellite: Continuous Multispectral Earth Observation',
    description:
      'NASA Goddard satellite telemetry highlighting orbital sensor calibration and global terrestrial scanning at 705 km altitude.',
    nasaId: 'GSFC_20171031_Landsat_m12754_whiskbroom',
    orbitalAltitude: '705 km Sun-Synchronous Low Earth Orbit',
    telemetryChannel: 'X-Band Downlink 384 Mbps',
  },
};

export function getSatelliteVideo(destination?: string): SatelliteVideoInfo {
  if (destination && VERIFIED_SATELLITE_VIDEOS[destination]) {
    return VERIFIED_SATELLITE_VIDEOS[destination];
  }
  return VERIFIED_SATELLITE_VIDEOS['Moon'];
}

/*
|--------------------------------------------------------------------------
| API helpers
|--------------------------------------------------------------------------
*/

export function getMissionMedia(
  missionId: string
): MissionDefinition | undefined {
  if (!missionId) return NASA_MISSION_MEDIA_DATABASE.apollo_11;

  // Direct alias check
  const alias = MISSION_ID_ALIASES[missionId];
  if (alias && NASA_MISSION_MEDIA_DATABASE[alias]) {
    return NASA_MISSION_MEDIA_DATABASE[alias];
  }

  // Exact match
  if (NASA_MISSION_MEDIA_DATABASE[missionId]) {
    return NASA_MISSION_MEDIA_DATABASE[missionId];
  }

  // Normalize hyphens to underscores
  const cleanId = missionId.toLowerCase().replace(/-/g, '_');
  if (NASA_MISSION_MEDIA_DATABASE[cleanId]) {
    return NASA_MISSION_MEDIA_DATABASE[cleanId];
  }

  // Substring match
  for (const key of Object.keys(NASA_MISSION_MEDIA_DATABASE)) {
    if (cleanId.includes(key) || key.includes(cleanId)) {
      return NASA_MISSION_MEDIA_DATABASE[key];
    }
  }

  // Safe fallback to Apollo 11 so components never encounter null configuration
  return NASA_MISSION_MEDIA_DATABASE.apollo_11;
}

export function getMissionChapterMedia(
  missionId: string,
  chapterId: string
): MissionMediaItem | undefined {
  const mission = getMissionMedia(missionId);

  if (!mission) return undefined;

  const found = mission.chapters.find(
    (chapter) => chapter.chapterId === chapterId
  );

  // If specific chapter index not found, fallback to chapter 1 of that mission
  return found || mission.chapters[0];
}

/*
|--------------------------------------------------------------------------
| NASA Images API
|--------------------------------------------------------------------------
*/

const NASA_API =
  'https://images-api.nasa.gov/search';

/**
 * Searches NASA's official media library for the requested query.
 * Securely extracts playable HTTPS MP4 streams.
 */

export async function searchNASAVideo(
  searchQuery: string,
  destinationFallback: string = 'Moon'
): Promise<{
  videoUrl: string | null;
  posterUrl: string | null;
  title: string | null;
  nasaId: string | null;
}> {

  try {
    const params = new URLSearchParams({
      q: searchQuery,
      media_type: 'video',
      page_size: '6',
    });

    const response = await fetch(
      `${NASA_API}?${params.toString()}`
    );

    if (response.ok) {
      const data = await response.json();
      const collection = data?.collection;

      if (collection?.items?.length) {
        for (const item of collection.items) {
          const nasaId = item?.data?.[0]?.nasa_id || null;
          const title = item?.data?.[0]?.title || null;

          const previewImage =
            item?.links?.find(
              (link: any) =>
                link?.rel === 'preview' && link?.href
            )?.href?.replace(/^http:\/\//, 'https://') || null;

          const assetUrl = item?.href;
          if (!assetUrl) continue;

          try {
            const assetResponse = await fetch(assetUrl);
            if (!assetResponse.ok) continue;

            const assets = await assetResponse.json();

            // Assets can be strings (e.g. ["http://...mp4"]) or objects with .href
            const urls: string[] = (Array.isArray(assets) ? assets : [])
              .map((a: any) => (typeof a === 'string' ? a : a?.href || ''))
              .filter(Boolean)
              .map((u: string) => u.replace(/^http:\/\//, 'https://'));

            const mp4s = urls.filter((u) => u.toLowerCase().endsWith('.mp4'));

            const bestVideo =
              mp4s.find((u) => u.includes('~medium.mp4')) ||
              mp4s.find((u) => u.includes('~large.mp4')) ||
              mp4s.find((u) => u.includes('~mobile.mp4')) ||
              mp4s.find((u) => u.includes('~orig.mp4')) ||
              mp4s[0] ||
              urls.find(
                (u) =>
                  u.toLowerCase().endsWith('.webm') ||
                  u.toLowerCase().endsWith('.mov')
              );

            if (bestVideo) {
              return {
                videoUrl: bestVideo,
                posterUrl: previewImage,
                title,
                nasaId,
              };
            }
          } catch {
            // Continue searching next item
          }
        }
      }
    }
  } catch (error) {
    console.warn(`[NASA API] Search error for query "${searchQuery}":`, error);
  }

  // Graceful fallback to verified satellite/archive video so user always gets smooth video playback
  const satFallback = getSatelliteVideo(destinationFallback);
  return {
    videoUrl: satFallback.videoUrl,
    posterUrl: satFallback.posterUrl,
    title: satFallback.title,
    nasaId: satFallback.nasaId,
  };
}

/*
|--------------------------------------------------------------------------
| Load mission media
|--------------------------------------------------------------------------
*/

export async function loadMissionMedia(
  missionId: string,
  chapterId: string
): Promise<{
  media: MissionMediaItem | null;
  videoUrl: string | null;
  posterUrl: string | null;
  nasaTitle: string | null;
  nasaId: string | null;
}> {

  const media = getMissionChapterMedia(
    missionId,
    chapterId
  );

  const mission = getMissionMedia(missionId);
  const destination = mission?.destination || 'Moon';

  const result = await searchNASAVideo(
    media?.searchQuery || 'Apollo 11 launch',
    destination
  );

  return {
    media: media || null,
    videoUrl: result.videoUrl,
    posterUrl: result.posterUrl,
    nasaTitle: result.title,
    nasaId: result.nasaId,
  };
}

export default NASA_MISSION_MEDIA_DATABASE;
