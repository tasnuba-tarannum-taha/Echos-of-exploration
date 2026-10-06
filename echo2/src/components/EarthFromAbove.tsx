import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  ExternalLink,
  Search,
  Compass,
  Sparkles,
  Info,
  Radio,
  Layers,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { NasaEarthVideo } from '../types';
import { FEATURED_EARTH_VIDEO, CURATED_EARTH_VIDEOS } from '../data/nasaEarthVideos';
import { NasaSourceBadge } from './NasaSourceBadge';
import { searchNASAVideos, fetchNasaAssetStreams, NormalizedNasaVideo } from '../services/nasaApi';

export const EarthFromAbove: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<NasaEarthVideo>(FEATURED_EARTH_VIDEO);
  const [selectedQuality, setSelectedQuality] = useState<'mobile' | 'medium' | 'large'>('large');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string>('00:00');
  const [isLoadingStream, setIsLoadingStream] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<NormalizedNasaVideo[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine actual stream URL based on selected quality (prioritize 4K)
  const currentStreamUrl =
    selectedQuality === 'mobile'
      ? activeVideo.streamQuality.mobile
      : selectedQuality === 'large'
      ? activeVideo.streamQuality.large || activeVideo.streamQuality.orig || activeVideo.streamQuality.medium
      : activeVideo.streamQuality.medium;

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Handle Mute/Unmute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Time update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setVideoProgress(dur > 0 ? (current / dur) * 100 : 0);

    const mins = Math.floor(current / 60);
    const secs = Math.floor(current % 60);
    setCurrentTimeFormatted(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
  };

  // Switch to another video
  const handleSelectVideo = (video: NasaEarthVideo) => {
    setIsLoadingStream(true);
    setActiveVideo(video);
    setIsPlaying(true);
  };

  // Search NASA Video Archive
  const handleSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await searchNASAVideos(q);
      if (res.success && res.data.items.length > 0) {
        setSearchResults(res.data.items);
      } else {
        setSearchResults([]);
        setSearchError('No NASA videos found for this query. Try "Earth ISS", "Aurora", or "Earth orbit".');
      }
    } catch {
      setSearchError('Unable to connect to NASA Video Library API.');
    } finally {
      setIsSearching(false);
    }
  };

  // Load stream for a search result item
  const handlePlaySearchResult = async (item: NormalizedNasaVideo) => {
    setIsLoadingStream(true);
    const streams = await fetchNasaAssetStreams(item.nasaId);
    if (streams && streams.videoUrl) {
      const newVideo: NasaEarthVideo = {
        id: item.nasaId,
        nasaId: item.nasaId,
        title: item.title,
        subtitle: `NASA Image & Video Archive (${item.center})`,
        description: item.description,
        date: item.date,
        center: item.center,
        originalUrl: item.sourceUrl,
        streamUrl: streams.videoUrl,
        streamQuality: {
          mobile: streams.streamQuality?.mobile || streams.videoUrl,
          medium: streams.streamQuality?.medium || streams.videoUrl,
          large: streams.streamQuality?.large || streams.videoUrl,
        },
        posterUrl: item.thumbnail,
        category: 'NASA Search Result',
        badge: 'REAL NASA VIDEO',
      };
      setActiveVideo(newVideo);
      setIsPlaying(true);
      // Scroll to video player smoothly
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setSearchError('Video stream for this asset is not currently streamable. Please select another item.');
    }
    setIsLoadingStream(false);
  };

  return (
    <section id="earth-from-above-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <NasaSourceBadge type="REAL NASA VIDEO" size="md" />
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
              EARTH OBSERVATION ARCHIVE
            </span>
          </div>
          <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-4xl lg:text-5xl text-white uppercase tracking-wider">
            EARTH FROM ABOVE
          </h2>
          <p className="text-slate-300 text-base sm:text-lg font-light italic">
            “See our home planet as spacecraft and astronauts see it.”
          </p>
        </div>

        {/* Orbit Telemetry Pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400 self-start md:self-auto">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div>
            <span className="text-slate-500 uppercase">ISS Orbit: </span>
            <span className="text-cyan-300 font-bold">408 KM ALT</span>
            <span className="text-slate-600 mx-2">|</span>
            <span className="text-cyan-300 font-bold">27,600 KM/H</span>
          </div>
        </div>
      </div>

      {/* Main Video Theater */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Video Player (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div
            ref={containerRef}
            className="group relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex items-center justify-center"
          >
            {/* Real NASA Video Stream */}
            <video
              ref={videoRef}
              key={currentStreamUrl}
              src={currentStreamUrl}
              poster={activeVideo.posterUrl}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              onTimeUpdate={() => {
                handleTimeUpdate();
                if (videoRef.current && videoRef.current.currentTime < 8.5 && activeVideo.id === 'earth-in-4k-expedition-65') {
                  videoRef.current.currentTime = 8.5;
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  if (videoRef.current.currentTime < 8.5 && activeVideo.id === 'earth-in-4k-expedition-65') {
                    videoRef.current.currentTime = 8.5;
                  }
                  setVideoDuration(videoRef.current.duration);
                  setIsLoadingStream(false);
                }
              }}
              onWaiting={() => setIsLoadingStream(true)}
              onPlaying={() => setIsLoadingStream(false)}
              className="w-full h-full object-cover"
            />

            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Loading Indicator */}
            {isLoadingStream && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center pointer-events-none z-20">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-cyan-300 tracking-widest uppercase">
                    STREAMING NASA VIDEO...
                  </span>
                </div>
              </div>
            )}

            {/* Top Bar inside Video Player */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <NasaSourceBadge type="REAL NASA VIDEO" size="sm" />
                <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-slate-700 text-slate-300 font-mono text-[11px] backdrop-blur-md">
                  {activeVideo.category || 'ISS Cupola'}
                </span>
              </div>

              {/* Quality Selector */}
              <div className="flex items-center gap-1 bg-black/70 border border-slate-700/80 rounded-lg p-1 backdrop-blur-md">
                {(['mobile', 'medium', 'large'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                      selectedQuality === q
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {q === 'mobile' ? 'Mobile' : q === 'medium' ? '1080p' : '4K'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 space-y-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
              {/* Progress Scrub Bar */}
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden cursor-pointer">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-150"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-1 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
                    <span className="text-[10px] font-mono">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
                  </button>

                  <span className="font-mono text-slate-300 text-xs hidden sm:inline">
                    {currentTimeFormatted} / {activeVideo.duration || 'Orbit Loop'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeVideo.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-mono tracking-wider uppercase transition-colors"
                  >
                    <span>WATCH ORIGINAL NASA VIDEO</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    aria-label="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Video Information Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide font-['Rajdhani']">
                  {activeVideo.title}
                </h3>
                {activeVideo.subtitle && (
                  <p className="text-xs text-cyan-400 font-mono tracking-wider">{activeVideo.subtitle}</p>
                )}
              </div>

              <a
                href={activeVideo.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
              >
                <span>WATCH ORIGINAL NASA VIDEO</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{activeVideo.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div>
                <span className="text-slate-500 block uppercase">SOURCE</span>
                <span className="text-slate-200 font-medium">{activeVideo.center}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase">ACQUISITION DATE</span>
                <span className="text-slate-200 font-medium">{activeVideo.date}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase">NASA ARCHIVE ID</span>
                <span className="text-cyan-300 font-mono truncate block" title={activeVideo.nasaId}>
                  {activeVideo.nasaId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase">VERIFICATION</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OFFICIAL NASA ASSET
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Curated Collection & NASA Video Search (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Curated NASA ISS Video Collection */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                CURATED NASA ISS FOOTAGE
              </span>
              <span className="text-[10px] font-mono text-slate-500">4 ARCHIVED</span>
            </div>

            <div className="space-y-2.5">
              {CURATED_EARTH_VIDEOS.map((v, idx) => {
                const isCurrent = activeVideo.id === v.id;
                return (
                  <button
                    key={`curated-footage-${v.id}-${idx}`}
                    onClick={() => handleSelectVideo(v)}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-950/60 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Thumbnail preview */}
                    <div className="relative w-20 h-14 rounded overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={v.posterUrl}
                        alt={v.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isCurrent ? (
                        <div className="absolute inset-0 bg-cyan-900/40 flex items-center justify-center">
                          <Play className="w-4 h-4 text-cyan-300 fill-cyan-300" />
                        </div>
                      ) : (
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[9px] font-mono text-slate-300">
                          {v.duration}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/60 font-bold">
                          NASA VIDEO
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{v.date.slice(0, 4)}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{v.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{v.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic NASA Video Library Search */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                SEARCH NASA VIDEO ARCHIVE
              </span>
              <span className="text-[10px] font-mono text-slate-500">LIVE API</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 'Earth ISS', 'Aurora'..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </form>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Earth ISS', 'Aurora from space', 'Earth observation', 'City lights from space'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    handleSearch(tag);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Search Results */}
            {searchError && (
              <p className="text-xs font-mono text-amber-400/90 pt-2">{searchError}</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 pt-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {searchResults.length} Results from NASA Library:
                </span>
                {searchResults.map((item, idx) => (
                  <button
                    key={`search-item-${item.nasaId || ''}-${idx}`}
                    onClick={() => handlePlaySearchResult(item)}
                    className="w-full p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-12 h-10 object-cover rounded bg-slate-900 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-10 rounded bg-slate-900 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs text-white truncate font-medium">{item.title}</h5>
                      <span className="text-[10px] font-mono text-cyan-400 block">{item.date} • {item.center}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
