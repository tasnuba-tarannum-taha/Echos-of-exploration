export type Destination = 'Moon' | 'Mars' | 'Deep Space';

export type HardwareType =
  | 'Lander'
  | 'Rover'
  | 'Descent Stage'
  | 'Instrument Package'
  | 'Spacecraft Probe'
  | 'Orbiter / Impactor';

export type MissionStatus = 'Complete' | 'Ended' | 'Communication Lost' | 'Active' | 'Silent';

export type DataSourceBadge =
  | 'REAL NASA VIDEO'
  | 'NASA VIDEO'
  | 'LIVE NASA DATA'
  | 'NASA LIVE DATA'
  | 'LIVE NASA STREAM'
  | 'NASA PHOTO'
  | 'NASA SCIENTIFIC VISUALIZATION'
  | 'NASA DATA VISUALIZATION'
  | 'NASA EARTHDATA'
  | 'NASA/JPL'
  | 'NASA/JPL SOURCE'
  | 'NASA ARCHIVE'
  | '3D VISUALIZATION'
  | 'INTERACTIVE VISUALIZATION'
  | 'ILLUSTRATIVE VISUAL'
  | 'CACHED DATA'
  | 'DEMO DATA'
  | 'VERIFIED SOURCE';

export interface NasaEarthVideo {
  id: string;
  nasaId: string;
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  center: string;
  originalUrl: string;
  streamUrl: string;
  streamQuality: {
    mobile: string;
    medium: string;
    large?: string;
    orig?: string;
  };
  posterUrl: string;
  duration?: string;
  category?: string;
  badge: 'REAL NASA VIDEO' | 'NASA VIDEO' | 'NASA SCIENTIFIC VISUALIZATION';
}

export interface NasaVideo {
  url: string;
  title: string;
  date: string;
  source: string;
  badge: 'NASA VIDEO' | 'NASA SCIENTIFIC VISUALIZATION';
  nasaId?: string;
  originalUrl: string;
  description?: string;
  duration?: string;
  posterUrl?: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  category: 'Optics & Vision' | 'Power & Energy' | 'Communications' | 'Mobility & Structure' | 'Science Payload';
  position: { x: number; y: number }; // Percentage 0-100 for interactive schematic hotspot
  whatIsThis: string;
  howItWorked: string;
  whyImportant: string;
}

export interface MissionTimelineEvent {
  date: string;
  sol?: number;
  title: string;
  description: string;
  importance: string;
  type: 'launch' | 'arrival' | 'science' | 'milestone' | 'final';
}

export interface SolMilestone {
  sol: number;
  date: string;
  title: string;
  description: string;
  highlight?: string;
}

export interface ScientificDiscovery {
  id: string;
  title: string;
  explanation: string;
  impact: string;
  category: 'Geology' | 'Astrobiology' | 'Atmospheric' | 'Cosmology' | 'Planetary Interior';
}

export interface MissionImage {
  url: string;
  title: string;
  date: string;
  source: string;
  nasaId?: string;
  camera?: string;
  badge?: DataSourceBadge;
  originalUrl?: string;
  isOfficialNasa?: boolean;
  caption: string;
  isVisualization?: boolean;
}

export interface MissionSource {
  title: string;
  url: string;
  type: 'NASA Mission' | 'NASA Image' | 'JPL Archive' | 'Scientific Data';
  verified: boolean;
}

export interface MissionLocation {
  name: string;
  coordinates: string;
  latitude: number;
  longitude: number;
  terrain: string;
  environmentContext: string;
  distanceTraveledKm?: number;
  elevationMeters?: number;
}

export interface MissionFinalStatus {
  date: string;
  sol?: number;
  explanation: string;
  condition: string;
  locationName: string;
  coordinates?: string;
  finalMessageOrTelemetry?: string;
  whyItEnded: string;
  whatRemains: string;
}

export interface MissionLegacy {
  science: string;
  engineering: string;
  discoveries: string;
  futureMissions: string;
}

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  missionNumber: string;
  destination: Destination;
  hardwareType: HardwareType;
  year: number;
  launchDate: string;
  arrivalDate: string;
  missionDuration: string;
  status: MissionStatus;
  primaryObjective: string;
  engineeringChallenge: string;
  missionPurpose: string;
  description: string;
  science: {
    summary: string;
    discoveries: ScientificDiscovery[];
  };
  environment: {
    surfaceType: string;
    temperatureRange: string;
    atmospherePressure: string;
    radiationContext: string;
    illumination: string;
    terrainNotes: string;
  };
  legacy: MissionLegacy;
  finalStatus: MissionFinalStatus;
  location: MissionLocation;
  timeline: MissionTimelineEvent[];
  solTimeline?: SolMilestone[];
  hardwareComponents: HardwareComponent[];
  images: MissionImage[];
  video?: NasaVideo;
  sources: MissionSource[];
  unlockRequirement: {
    level: number;
    requiredMissionId?: string;
  };
  didYouKnow: Array<{
    id: string;
    fact: string;
    xp: number;
  }>;
}

export interface LevelInfo {
  level: number;
  title: string;
  description: string;
  minXp: number;
  maxXp: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  progressPct: number;
}

export interface Badge {
  id: string;
  name: string;
  title?: string;
  description: string;
  category: 'Moon' | 'Mars' | 'Deep Space' | 'Archivist' | 'Science' | 'Explorer';
  icon: string;
  criteria: string;
  unlocked?: boolean;
  unlockedAt?: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  completedMissions: string[];
  unlockedMissions: string[];
  badges: string[]; // Badge IDs
  factsDiscovered: string[]; // Fact IDs
  hardwareInspected: string[]; // Component IDs
  chaptersCompleted: Record<string, number[]>; // missionId -> chapter indices (0 to 6)
  hasCompletedEarthToMoon: boolean;
}

export interface NeoObject {
  id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date: string;
    close_approach_date_full: string;
    epoch_date_close_approach: number;
    relative_velocity: {
      kilometers_per_second: string;
      kilometers_per_hour: string;
    };
    miss_distance: {
      astronomical: string;
      lunar: string;
      kilometers: string;
    };
    orbiting_body: string;
  }>;
}

export interface ApodData {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright?: string;
}

export interface NeoData {
  id: string;
  name: string;
  isPotentiallyHazardous: boolean;
  estimatedDiameterMeters: { min: number; max: number };
  closeApproachDate: string;
  missDistanceKm: string;
  relativeVelocityKmh: string;
  nasaJplUrl: string;
}

export interface SolarFlareData {
  flrID: string;
  classType: string;
  beginTime: string;
  peakTime: string;
  sourceLocation?: string;
  note?: string;
}

export interface NasaImageItem {
  nasa_id: string;
  title: string;
  description: string;
  date_created: string;
  href: string;
}

export interface SpaceWeatherCME {
  activityID: string;
  startTime: string;
  sourceLocation: string;
  note: string;
  instruments?: Array<{ displayName: string }>;
  cmeAnalyses?: Array<{
    speed: number;
    halfAngle: number;
    latitude: number;
    longitude: number;
    type: string;
    note: string;
  }>;
}

export interface EchoContext {
  pageType: 'explore' | 'journey' | 'missions' | 'atlas' | 'mission-detail' | 'nasa-feeds' | 'badges';
  mission?: Mission | {
    id: string;
    title: string;
    subtitle: string;
    destination: string;
    hardwareType: string;
    year: number;
    launchDate: string;
    arrivalDate: string;
    missionDuration: string;
    status: string;
    location?: { name: string; coordinates?: string };
    scienceSummary?: string;
    finalStatusReason?: string;
    legacy?: any;
  };
  missionChapter?: number;
  destination?: string;
  hardware?: string;
  currentChapter?: { number: string; title: string };
  timelineEvent?: { date: string; title: string; description: string };
  selectedNASAImage?: {
    nasa_id?: string;
    title?: string;
    description?: string;
    date?: string;
    source?: string;
    url?: string;
  };
  selectedNASAData?: {
    temperature?: string;
    pressure?: string;
    radiation?: string;
    surfaceType?: string;
    illumination?: string;
  };
  selectedNEO?: {
    name: string;
    designation?: string;
    diameterMeters?: { min: number; max: number };
    closestApproach?: string;
    distanceKm?: string;
    velocityKmh?: string;
    isPotentiallyHazardous?: boolean;
    source?: string;
    sourceUrl?: string;
  };
  location?: string;
  sourceUrls?: Array<{ label: string; url: string }>;
  dataStatus?: string;
  tourActive?: boolean;
  tourStep?: number;
}

export interface EchoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  simpleExplanation?: string;
  deepExplanation?: string;
  source?: string;
  sourceUrl?: string;
  quickActions?: string[];
  didYouKnow?: string;
  askMeNext?: string[];
  navigationAction?: {
    targetTab: 'explore' | 'journey' | 'missions' | 'atlas' | 'mission-detail' | 'nasa-feeds' | 'badges';
    param?: string;
    label: string;
  };
  timestamp: string;
  isError?: boolean;
  isOfflineNotice?: boolean;
}

export interface AtlasHardwareItem {
  id: string;
  name: string;
  destination: 'Moon' | 'Mars';
  missionYear: number;
  status: 'Complete' | 'Resting' | 'Active' | 'Silent';
  purpose: string;
  discoveries: string;
  landingLocation: string;
  coordinates: string;
  lat: number;
  lng: number; // lat/long on celestial body
  currentCondition: string;
  funFact: string;
  spacecraftType: string;
  missionId?: string;
  launchDate: string;
  landingDate: string;
  dataSource: string;
  imageCredit: string;
}

export interface CitationCardData {
  mission: string;
  spacecraft: string;
  launchDate: string;
  landingDate: string;
  status: string;
  dataSource: string;
  imageCredit: string;
  verifiedUrl?: string;
}

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'navigate' | 'scroll' | 'switchChapter' | 'switchNasaTab';
  route: 'explore' | 'journey' | 'missions' | 'mission-detail' | 'nasa-feeds' | 'badges';
  routeParam?: string;
  chapterIndex?: number;
  nasaTab?: 'apod' | 'neows' | 'donki' | 'library';
  highlight: string;
  order: number;
}

export interface TourState {
  tourActive: boolean;
  tourStep: number;
  tourCompleted: boolean;
  tourSkipped: boolean;
}

