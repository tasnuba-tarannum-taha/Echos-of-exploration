// src/components/NasaMediaContainer.tsx

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  Play,
  Pause,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Satellite,
  Video,
  Radio,
  Activity,
  Maximize,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';

import {
  loadMissionMedia,
  getMissionMedia,
  getSatelliteVideo,
  SatelliteVideoInfo,
} from '../data/nasaMissionMediaDatabase';

interface NasaMediaContainerProps {
  missionId: string;
  chapterId?: string;
  chapterKey?: string;
  className?: string;
}

export const NasaMediaContainer: React.FC<NasaMediaContainerProps> = ({
  missionId,
  chapterId,
  chapterKey,
  className = '',
}) => {
  const activeChapterId = chapterId || chapterKey || 'chapter_1';

  // Feed modes: 'archive' (chapter specific NASA archive) vs 'satellite' (orbital satellite video)
  const [feedMode, setFeedMode] = useState<'archive' | 'satellite'>('archive');
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [nasaTitle, setNasaTitle] = useState<string | null>(null);
  const [nasaId, setNasaId] = useState<string | null>(null);
  const [satelliteData, setSatelliteData] = useState<SatelliteVideoInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showTelemetryHUD, setShowTelemetryHUD] = useState(true);
  const [timeCode, setTimeCode] = useState('00:00:00');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mission = getMissionMedia(missionId);
  const destination = mission?.destination || 'Moon';

  // Simulated live telemetry clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tc = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 100);
      setTimeCode(tc);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Fetch or switch video based on feedMode and activeChapterId
  const loadVideo = async (mode: 'archive' | 'satellite' = feedMode) => {
    setLoading(true);

    try {
      const sat = getSatelliteVideo(destination);
      setSatelliteData(sat);

      if (mode === 'satellite') {
        // Satellite Feed Mode
        setVideoUrl(sat.videoUrl);
        setPosterUrl(sat.posterUrl);
        setNasaTitle(sat.title);
        setNasaId(sat.nasaId);
      } else {
        // Mission Archive Mode: query NASA API for the specific chapter
        const result = await loadMissionMedia(missionId, activeChapterId);

        if (result && result.videoUrl) {
          setVideoUrl(result.videoUrl);
          setPosterUrl(result.posterUrl);
          setNasaTitle(result.nasaTitle || result.media?.title || mission?.title || 'NASA Mission Footage');
          setNasaId(result.nasaId);
        } else {
          // Guaranteed fallback to satellite/archive so player always functions
          setVideoUrl(sat.videoUrl);
          setPosterUrl(sat.posterUrl);
          setNasaTitle(sat.title);
          setNasaId(sat.nasaId);
        }
      }
    } catch (err) {
      console.warn('[NASA MEDIA] Fallback to satellite video stream', err);
      const sat = getSatelliteVideo(destination);
      setVideoUrl(sat.videoUrl);
      setPosterUrl(sat.posterUrl);
      setNasaTitle(sat.title);
      setNasaId(sat.nasaId);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideo(feedMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, chapterId, chapterKey, feedMode]);

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-cyan-900/60 bg-[#020617] shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Top HUD Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-950/80 bg-slate-950/90 px-4 py-2.5 backdrop-blur-md">
        {/* Left: Feed Mode Selector */}
        <div className="flex items-center gap-1.5 rounded-lg bg-black/60 p-1 border border-cyan-950">
          <button
            type="button"
            onClick={() => setFeedMode('archive')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              feedMode === 'archive'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mission Footage</span>
          </button>

          <button
            type="button"
            onClick={() => setFeedMode('satellite')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              feedMode === 'satellite'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Satellite className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Satellite Feed</span>
          </button>
        </div>

        {/* Center / Right: Telemetry Lock Badge & HUD Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-cyan-400/80 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-900/40">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>DSN LINK: 8.4 GHz</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">TELEMETRY LOCKED</span>
          </div>

          <button
            type="button"
            onClick={() => setShowTelemetryHUD(!showTelemetryHUD)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
              showTelemetryHUD
                ? 'border-cyan-500/50 text-cyan-300 bg-cyan-950/50'
                : 'border-slate-800 text-slate-400 bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            {showTelemetryHUD ? 'HUD: ON' : 'HUD: OFF'}
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-video w-full bg-black overflow-hidden group">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Radio className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="mt-4 text-xs font-mono text-cyan-300 tracking-wider uppercase">
              Connecting to NASA Video Server...
            </p>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              Resolving {feedMode === 'satellite' ? 'Orbital Satellite Stream' : 'Archive Stream'}
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              key={videoUrl || 'fallback-video'}
              className="h-full w-full object-contain cursor-pointer"
              playsInline
              preload="metadata"
              poster={posterUrl || undefined}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={handleTogglePlay}
            >
              {videoUrl && <source src={videoUrl} type="video/mp4" />}
              Your browser does not support HTML5 video.
            </video>

            {/* Subtle Scanning Radar Line Animation */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
              <div className="w-full h-1 bg-gradient-to-b from-cyan-400/80 to-transparent animate-[scan_6s_linear_infinite]" />
            </div>

            {/* Futuristic Corner Reticle Markers */}
            <div className="pointer-events-none absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/70" />
            <div className="pointer-events-none absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400/70" />
            <div className="pointer-events-none absolute bottom-12 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400/70" />
            <div className="pointer-events-none absolute bottom-12 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/70" />

            {/* Interactive Telemetry HUD Overlay (Top-Left & Top-Right) */}
            <AnimatePresence>
              {showTelemetryHUD && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 p-4 flex flex-col justify-between"
                >
                  {/* Top HUD Line */}
                  <div className="flex items-start justify-between">
                    <div className="bg-black/75 backdrop-blur-md rounded-lg border border-cyan-500/30 p-2.5 space-y-1 shadow-lg pointer-events-auto">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                          {feedMode === 'satellite' ? 'ORBITAL SATELLITE TELEMETRY' : 'NASA ARCHIVE FEED'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white max-w-sm line-clamp-1">
                        {nasaTitle}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-0.5">
                        <span>SYS: DSN-GOLDSTONE</span>
                        <span>•</span>
                        <span>RES: 1080P PRORES</span>
                      </div>
                    </div>

                    <div className="bg-black/75 backdrop-blur-md rounded-lg border border-cyan-500/30 px-3 py-1.5 text-right font-mono space-y-0.5 shadow-lg">
                      <div className="text-[9px] text-cyan-400 uppercase tracking-wider">
                        MISSION TIME CODE
                      </div>
                      <div className="text-xs text-white font-bold tracking-widest">
                        {timeCode}
                      </div>
                      {feedMode === 'satellite' && satelliteData && (
                        <div className="text-[9px] text-emerald-400">
                          {satelliteData.orbitalAltitude}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Play Button Overlay (when paused) */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleTogglePlay}
                        className="pointer-events-auto w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:bg-cyan-500/30 transition-all cursor-pointer"
                      >
                        <Play className="w-7 h-7 fill-cyan-400 ml-1" />
                      </motion.button>
                    </div>
                  )}

                  {/* Bottom Sub-HUD info */}
                  <div className="flex items-end justify-between text-[10px] font-mono text-slate-400">
                    <div className="bg-black/60 px-2 py-1 rounded border border-white/10 backdrop-blur-sm">
                      CAM: {feedMode === 'satellite' ? 'HIGH-RESOLUTION OPTICAL ORBITAL SCANNER' : 'PRIME TELEVISION PAYLOAD'}
                    </div>

                    {nasaId && (
                      <a
                        href={`https://images.nasa.gov/details/${nasaId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950 transition-colors"
                      >
                        <span>NASA ID: {nasaId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Playback Control Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 flex items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-white hover:text-cyan-300 transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-white hover:text-cyan-300 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => loadVideo(feedMode)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-white hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Reload NASA Stream"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Audio/Signal Waveform animation */}
              <div className="hidden sm:flex items-center gap-0.5">
                {[4, 8, 14, 6, 12, 18, 10, 15, 7, 13, 9, 16, 5, 11].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isPlaying ? [h * 0.4, h, h * 0.5] : 3 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6 + (i % 3) * 0.2,
                      ease: 'easeInOut',
                    }}
                    className="w-1 bg-cyan-400/80 rounded-full"
                    style={{ height: h }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-white hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Description & Satellite Telemetry Footnote */}
      <div className="p-4 border-t border-cyan-950/80 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-cyan-300 font-semibold uppercase tracking-wider">
              {feedMode === 'satellite'
                ? `ACTIVE SATELLITE: ${satelliteData?.satelliteName || 'Orbital Reconnaissance'}`
                : `AUTHENTIC NASA ARCHIVE: ${nasaTitle || mission?.title}`}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed max-w-2xl">
            {feedMode === 'satellite'
              ? satelliteData?.description
              : 'Directly sourced from the official NASA Image and Video Library with active telemetry and high-definition orbital tracking.'}
          </p>
        </div>

        {feedMode === 'satellite' && satelliteData?.agency && (
          <div className="shrink-0 text-right font-mono text-[10px] text-slate-400">
            <span className="text-cyan-400">{satelliteData.agency}</span>
            <div className="text-slate-500">{satelliteData.telemetryChannel}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NasaMediaContainer;
