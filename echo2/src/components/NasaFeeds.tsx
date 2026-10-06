import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Image as ImageIcon,
  AlertTriangle,
  Sun,
  Search,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { ApodData, NeoData, SolarFlareData, NasaImageItem } from '../types';
import {
  getNasaApod,
  getNearEarthAsteroids,
  getSolarFlares,
  searchNasaImages,
} from '../services/nasaApi';
import { NasaSourceBadge } from './NasaSourceBadge';
import { NeoRadarCanvas } from './NeoRadarCanvas';

interface NasaFeedsProps {
  initialTab?: 'apod' | 'neows' | 'donki' | 'library';
}

export const NasaFeeds: React.FC<NasaFeedsProps> = ({ initialTab = 'apod' }) => {
  const [activeTab, setActiveTab] = useState<'apod' | 'neows' | 'donki' | 'library'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // APOD state
  const [apod, setApod] = useState<ApodData | null>(null);
  const [apodLoading, setApodLoading] = useState<boolean>(true);
  const [apodImgError, setApodImgError] = useState<boolean>(false);

  // NeoWs state
  const [neos, setNeos] = useState<NeoData[]>([]);
  const [neosLoading, setNeosLoading] = useState<boolean>(true);

  // DONKI state
  const [flares, setFlares] = useState<SolarFlareData[]>([]);
  const [flaresLoading, setFlaresLoading] = useState<boolean>(true);

  // Image Library search state
  const [searchQuery, setSearchQuery] = useState<string>('Apollo 11');
  const [searchResults, setSearchResults] = useState<NasaImageItem[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load APOD
    getNasaApod()
      .then((data: ApodData) => {
        setApod(data);
        setApodLoading(false);
      })
      .catch(() => setApodLoading(false));

    // Load NeoWs
    getNearEarthAsteroids()
      .then((data: NeoData[]) => {
        setNeos(data);
        setNeosLoading(false);
      })
      .catch(() => setNeosLoading(false));

    // Load DONKI
    getSolarFlares()
      .then((data: SolarFlareData[]) => {
        setFlares(data);
        setFlaresLoading(false);
      })
      .catch(() => setFlaresLoading(false));

    // Initial search
    executeSearch('Apollo 11');
  }, []);

  const executeSearch = (q: string) => {
    if (!q.trim()) return;
    setSearchLoading(true);
    searchNasaImages(q)
      .then((res: any) => {
        const rawItems = res?.data?.items || (Array.isArray(res) ? res : []);
        const formatted: NasaImageItem[] = rawItems.map((it: any) => {
          const itemData = it.data?.[0] || it;
          const linkData = it.links?.[0] || {};
          const photoUrl =
            it.thumbnail ||
            it.href ||
            linkData.href ||
            itemData.href ||
            (it.nasa_id
              ? `https://images-assets.nasa.gov/image/${it.nasa_id}/${it.nasa_id}~medium.jpg`
              : '');
          return {
            nasa_id: it.nasa_id || itemData.nasa_id || `NASA-${Math.random().toString(36).substring(2, 8)}`,
            title: it.title || itemData.title || 'NASA Exploration Artifact',
            description: it.description || itemData.description || itemData.title || '',
            date_created: (it.date_created || itemData.date_created || '1969-07-20').slice(0, 10),
            href: photoUrl,
          };
        });
        setSearchResults(formatted);
        setSearchLoading(false);
      })
      .catch(() => setSearchLoading(false));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>LIVE OBSERVATORY TELEMETRY</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-5xl text-white tracking-wider uppercase">
              NASA DATA FEEDS & OBSERVATORY
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl">
              Live telemetry, near-Earth asteroid radar tracks, solar flare space weather warnings, and deep NASA image archive searches.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-800/60 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>NASA OPEN API CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Feed Tabs Navigation */}
      <div className="bg-[#070e22] border border-slate-800 rounded-2xl p-2 overflow-x-auto shadow-lg">
        <div className="flex items-center gap-2 min-w-[620px]">
          <button
            id="nasa-tab-btn-apod"
            onClick={() => setActiveTab('apod')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'apod'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>Astronomy Picture (APOD)</span>
          </button>

          <button
            id="nasa-tab-btn-neows"
            onClick={() => setActiveTab('neows')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'neows'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Satellite className="w-4 h-4 text-amber-400" />
            <span>Asteroid Radar (NeoWs)</span>
          </button>

          <button
            id="nasa-tab-btn-donki"
            onClick={() => setActiveTab('donki')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'donki'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sun className="w-4 h-4 text-rose-400" />
            <span>Space Weather (DONKI)</span>
          </button>

          <button
            id="nasa-tab-btn-library"
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'library'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>NASA Archive Search</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}

      {/* 1. APOD PANEL */}
      {activeTab === 'apod' && (
        <div className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {apodLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
              RETRIEVING LATEST NASA APOD TELEMETRY...
            </div>
          ) : apod ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Media Container */}
              <div className="lg:col-span-7 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative">
                <div className="absolute top-3 left-3 z-10">
                  <NasaSourceBadge
                    type={apod.media_type === 'video' ? 'NASA VIDEO' : 'NASA PHOTO'}
                    size="sm"
                  />
                </div>
                {apod.media_type === 'video' ? (
                  <iframe
                    src={apod.url}
                    title={apod.title}
                    className="w-full aspect-video"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={
                      apodImgError
                        ? 'https://images-assets.nasa.gov/image/as12-48-7121/as12-48-7121~large.jpg'
                        : (apod.hdurl || apod.url)
                    }
                    alt={apod.title}
                    className="w-full h-auto object-cover max-h-[540px]"
                    loading="eager"
                    onError={() => {
                      if (!apodImgError) {
                        setApodImgError(true);
                      }
                    }}
                  />
                )}
                <div className="p-3 bg-black/90 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800">
                  <span>DATE: {apod.date}</span>
                  <span>MEDIA: {apod.media_type.toUpperCase()}</span>
                  {apod.copyright && <span className="truncate max-w-[200px]">CREDIT: {apod.copyright}</span>}
                </div>
              </div>

              {/* Dossier info */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">
                      ASTRONOMY PICTURE OF THE DAY
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{apod.date}</span>
                  </div>
                  <h3 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white uppercase">
                    {apod.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-72 overflow-y-auto pr-2">
                  {apod.explanation}
                </p>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={apod.hdurl || apod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase hover:bg-cyan-900 transition-colors"
                    >
                      <span>View Full HD</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href="https://apod.nasa.gov/apod/astropix.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono uppercase hover:text-white transition-colors"
                    >
                      <span>APOD NASA Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">NASA GODDARD SPACE FLIGHT CENTER</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-10 font-mono text-xs">
              Unable to load live APOD stream. Please check connection.
            </div>
          )}
        </div>
      )}

      {/* 2. NEOWS PANEL WITH RADAR & REAL DATA */}
      {activeTab === 'neows' && (
        <div id="neo-radar-container" className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <NasaSourceBadge type="NASA LIVE DATA" size="sm" />
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 uppercase">
                  VISUALIZATION — NOT TO SCALE
                </span>
              </div>
              <h3 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white uppercase">
                NEAR-EARTH ASTEROIDS (NEOWS) RADAR
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Real-time tracking of near-Earth objects passing within lunar orbital ranges, powered by NASA Jet Propulsion Laboratory (JPL) Center for Near-Earth Object Studies (CNEOS).
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/60 self-start sm:self-auto">
              TRACKING {neos.length} ACTIVE TRAJECTORIES
            </span>
          </div>

          {neosLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-400" />
              ACQUIRING LIVE ORBITAL RADAR TRACKS FROM NASA JPL...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Authentic NEO Orbital Radar Visualizer */}
              <NeoRadarCanvas neos={neos} />

              {/* Data Table / List of Bodies with JPL Verification */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    TELEMETRY LOGS & JPL SMALL-BODY DATABASE
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">DATA UPDATES EVERY 24H</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {neos.map((neo) => (
                    <div
                      key={neo.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm uppercase font-mono">
                          {neo.name}
                        </span>
                        {neo.isPotentiallyHazardous ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            HAZARD
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                            NOMINAL
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>CLOSE APPROACH:</span>
                          <span className="text-slate-200">{neo.closeApproachDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>DISTANCE:</span>
                          <span className="text-amber-300 font-bold">
                            {Number(neo.missDistanceKm).toLocaleString()} KM
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>VELOCITY:</span>
                          <span className="text-cyan-300 font-bold">
                            {Number(neo.relativeVelocityKmh).toLocaleString()} KM/H
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex justify-end">
                        <a
                          href={neo.nasaJplUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 uppercase tracking-wider"
                        >
                          <span>JPL Orbit Viewer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DONKI SPACE WEATHER */}
      {activeTab === 'donki' && (
        <div className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase">
                DONKI SPACE WEATHER NOTIFICATIONS
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Solar flares, coronal mass ejections, and interplanetary geomagnetic radiation records.
              </p>
            </div>
            <span className="text-xs font-mono text-rose-400 bg-rose-950/40 px-3 py-1 rounded border border-rose-800/60 self-start sm:self-auto">
              SOLAR OBSERVATORY DATA
            </span>
          </div>

          {flaresLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-rose-400" />
              QUERYING SOLAR & HELIOSPHERIC OBSERVATORY...
            </div>
          ) : (
            <div className="space-y-4">
              {flares.map((fl) => (
                <div
                  key={fl.flrID}
                  className="bg-[#030712] border border-slate-800 rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        CLASS {fl.classType}
                      </span>
                      <h4 className="font-['Rajdhani'] font-bold text-xl text-white uppercase">
                        SOLAR FLARE EVENT: {fl.flrID}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      PEAK: {fl.peakTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-300 bg-black/40 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">BEGIN TIME</span>
                      <span>{fl.beginTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">SOURCE REGION</span>
                      <span>{fl.sourceLocation || 'Active Heliomagnetic Region'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">INSTRUMENT</span>
                      <span>GOES X-Ray Sensor</span>
                    </div>
                  </div>

                  {fl.note && (
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      {fl.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. NASA ARCHIVE SEARCH */}
      {activeTab === 'library' && (
        <div className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="space-y-3">
            <h3 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase">
              NASA IMAGE & VIDEO ARCHIVE SEARCH
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Query over 140,000 public domain imagery, video, and audio assets directly from NASA Image and Video Library.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch(searchQuery);
              }}
              className="flex gap-2 max-w-xl"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NASA archive (e.g. Apollo 11, Curiosity, Perseverance, Webb)..."
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-2"
              >
                {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>SEARCH</span>
              </button>
            </form>
          </div>

          {searchLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
              SEARCHING NASA MULTIMEDIA ARCHIVES...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {searchResults.slice(0, 12).map((item) => (
                <div
                  key={item.nasa_id}
                  className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={
                        item.href ||
                        (item.nasa_id ? `https://images-assets.nasa.gov/image/${item.nasa_id}/${item.nasa_id}~medium.jpg` : '')
                      }
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (item.nasa_id && !target.src.includes('~thumb')) {
                          target.src = `https://images-assets.nasa.gov/image/${item.nasa_id}/${item.nasa_id}~thumb.jpg`;
                        }
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <NasaSourceBadge type="NASA PHOTO" size="sm" />
                    </div>
                  </div>
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 block">{item.date_created}</span>
                      <h4 className="font-semibold text-xs text-white line-clamp-2 mt-0.5">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>ID: {item.nasa_id}</span>
                      <a
                        href={`https://images.nasa.gov/details-${encodeURIComponent(item.nasa_id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              No results found for “{searchQuery}”. Try searching for “Apollo”, “Curiosity”, or “Hubble”.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
