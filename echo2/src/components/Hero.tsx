import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Compass,
  Sparkles,
  Orbit,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  ExternalLink,
  Layers,
  Radio,
  Video,
  Globe,
  Info,
  CheckCircle2,
  Sliders,
  Eye,
  EyeOff,
  Gauge,
  Activity,
} from 'lucide-react';
import { RealisticGlobe } from './RealisticGlobe';
import { NasaSourceBadge } from './NasaSourceBadge';
import { FEATURED_EARTH_VIDEO, CURATED_EARTH_VIDEOS } from '../data/nasaEarthVideos';
import { NasaEarthVideo } from '../types';

interface HeroProps {
  onExploreMissions: () => void;
  onOpenHardwareAtlas: () => void;
  onBeginJourney?: () => void;
  onScrollToArchive: () => void;
}

type EarthViewMode = 'video' | 'data' | 'live';

export const Hero: React.FC<HeroProps> = ({
  onExploreMissions,
  onOpenHardwareAtlas,
  onBeginJourney,
  onScrollToArchive,
}) => {
  const [viewMode, setViewMode] = useState<EarthViewMode>('video');
  const [activeVideo, setActiveVideo] = useState<NasaEarthVideo>(FEATURED_EARTH_VIDEO);
  const [selectedQuality, setSelectedQuality] = useState<'mobile' | 'medium' | 'large'>('medium');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [autoplayFailed, setAutoplayFailed] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoOpacity, setVideoOpacity] = useState<number>(0.7); // 0.4 = Dim, 0.7 = Balanced, 0.95 = Vivid
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);
  const [liveIssData, setLiveIssData] = useState<{ velocity: number; altitude: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (viewMode !== 'live') return;
    const fetchIss = () => {
      fetch('/api/nasa/live/iss')
        .then((r) => r.json())
        .then((d) => {
          if (d?.data) {
            setLiveIssData({
              velocity: Math.round(d.data.velocity || 27600),
              altitude: Math.round(d.data.altitude || 408),
              lat: parseFloat((d.data.latitude || 0).toFixed(2)),
              lng: parseFloat((d.data.longitude || 0).toFixed(2)),
            });
          }
        })
        .catch(() => {});
    };
    fetchIss();
    const interval = setInterval(fetchIss, 4000);
    return () => clearInterval(interval);
  }, [viewMode]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute stream URL
  const currentStreamUrl =
    selectedQuality === 'mobile'
      ? activeVideo.streamQuality.mobile
      : selectedQuality === 'large' && activeVideo.streamQuality.large
      ? activeVideo.streamQuality.large
      : activeVideo.streamQuality.medium;

  // Background starfield animation (serves as base underneath video or when video is hidden)
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const starCount = 180;
    const stars: Array<{ x: number; y: number; size: number; alpha: number; speed: number }> = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.015 + 0.005,
      });
    }

    let time = 0;
    const render = () => {
      time += 1;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Radial dark nebula
      const grad = ctx.createRadialGradient(
        width * 0.65,
        height * 0.45,
        40,
        width * 0.65,
        height * 0.45,
        width * 0.6
      );
      grad.addColorStop(0, 'rgba(12, 35, 75, 0.35)');
      grad.addColorStop(0.6, 'rgba(3, 7, 24, 0.2)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Stars
      for (const s of stars) {
        const twinkle = Math.sin(time * s.speed + s.x) * 0.3 + 0.7;
        ctx.fillStyle = '#e2e8f0';
        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha * twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // IntersectionObserver to pause video when Hero is offscreen
  useEffect(() => {
    const hero = heroSectionRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return;
        if (entry.isIntersecting) {
          if (isPlaying) {
            videoRef.current.play().catch(() => setAutoplayFailed(true));
          }
        } else {
          videoRef.current.pause();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [isPlaying]);

  // Handle Autoplay attempts on mount or URL switch
  useEffect(() => {
    if (viewMode !== 'video') return;
    const v = videoRef.current;
    if (!v) return;

    v.muted = isMuted;
    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setAutoplayFailed(false);
        })
        .catch(() => {
          // Autoplay was blocked by browser policy
          setAutoplayFailed(true);
          setIsPlaying(false);
        });
    }
  }, [currentStreamUrl, viewMode, isMuted]);

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayFailed(false);
        })
        .catch(() => setAutoplayFailed(true));
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

  const handleManualPlay = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
    videoRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setAutoplayFailed(false);
      })
      .catch((e) => console.warn('Manual play failed:', e));
  };

  return (
    <section
      ref={heroSectionRef}
      className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden bg-[#020617]"
    >
      {/* Deep Space Background Canvas (base layer) */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* 4K NASA ORBITAL VIDEO BACKGROUND */}
      {viewMode === 'video' && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            ref={videoRef}
            key={currentStreamUrl}
            src={currentStreamUrl}
            poster={activeVideo.posterUrl}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            onLoadedData={() => {
              if (videoRef.current && videoRef.current.currentTime < 8.5 && activeVideo.id === 'earth-in-4k-expedition-65') {
                videoRef.current.currentTime = 8.5;
              }
              setVideoLoaded(true);
              setAutoplayFailed(false);
            }}
            onTimeUpdate={() => {
              if (videoRef.current && videoRef.current.currentTime < 8.5 && activeVideo.id === 'earth-in-4k-expedition-65') {
                videoRef.current.currentTime = 8.5;
              }
            }}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 scale-105"
            style={{ opacity: videoLoaded ? videoOpacity : 0 }}
          />

          {/* Cinematic Scrim & Contrast Gradients for 100% typography legibility */}
          {!cinemaMode && (
            <>
              {/* Left Column Heavy Darkening for pristine readable text */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/95 via-[#020617]/80 to-[#020617]/35 pointer-events-none" />
              {/* Top & Bottom blends into navbar and next section */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/70 pointer-events-none" />
              {/* Radial subtle cyan glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(6,182,212,0.15),transparent_65%)] pointer-events-none" />
              {/* Scanline atmospheric texture */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_4px] opacity-25 pointer-events-none" />
            </>
          )}

          {/* Cinema mode lighter overlay so the video shines brightly */}
          {cinemaMode && (
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/85 via-transparent to-[#020617]/40 pointer-events-none" />
          )}
        </div>
      )}

      {/* Atmospheric Horizon Glow if video is disabled or in data mode */}
      {viewMode !== 'video' && (
        <div className="absolute top-0 right-0 w-3/5 h-full bg-gradient-to-l from-cyan-950/20 via-blue-950/10 to-transparent pointer-events-none z-0" />
      )}

      {/* Autoplay resume banner (if browser blocks unmuted/autoplay) */}
      {autoplayFailed && viewMode === 'video' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            onClick={handleManualPlay}
            className="px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase shadow-[0_0_25px_rgba(6,182,212,0.6)] flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Click to Resume NASA Background Video</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* CINEMA IMMERSION MODE (Shows unobstructed background video) */}
      {/* ======================================================== */}
      {cinemaMode ? (
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col justify-between">
          {/* Top Cinema HUD Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 bg-slate-950/80 border border-cyan-500/40 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <NasaSourceBadge type="REAL NASA VIDEO" size="sm" />
              <span className="text-xs font-mono text-cyan-300 font-medium">
                {activeVideo.title}
              </span>
            </div>

            <button
              onClick={() => setCinemaMode(false)}
              className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-white text-xs font-mono tracking-wider uppercase backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <EyeOff className="w-4 h-4 text-cyan-400" />
              <span>Exit Cinema Mode</span>
            </button>
          </div>

          {/* Center Space Callout */}
          <div className="text-center my-auto py-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-black/60 border border-cyan-500/30 backdrop-blur-md mb-3">
              <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest">
                4K EARTH OBSERVATION • INTERNATIONAL SPACE STATION
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-['Rajdhani'] font-bold text-white uppercase tracking-wider drop-shadow-md">
              THE BLUE PLANET IN MOTION
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto mt-2 drop-shadow">
              Captured by NASA astronauts aboard Expedition 65 from 408 km above Earth.
            </p>
          </div>

          {/* Bottom Floating Control Dock */}
          <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-wrap items-center justify-between gap-4">
            {/* Play & Audio */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePlay}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all font-bold cursor-pointer"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
              </button>

              <button
                onClick={handleToggleMute}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white transition-colors cursor-pointer flex items-center gap-2"
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-amber-300" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-300" />
                )}
                <span className="text-xs font-mono text-slate-300">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-800 pl-3">
                {(['mobile', 'medium', 'large'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      selectedQuality === q
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white bg-slate-900/60'
                    }`}
                  >
                    {q === 'mobile' ? 'Mobile' : q === 'medium' ? '1080p' : '4K UHD'}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {CURATED_EARTH_VIDEOS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveVideo(v);
                    setIsPlaying(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
                    activeVideo.id === v.id
                      ? 'bg-cyan-500/90 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {v.id === 'earth-in-4k-expedition-65'
                    ? '4K EXPEDITION 65'
                    : v.id === 'iss-hdev-external-survey'
                    ? 'ISS HDEV CAMERA'
                    : v.id === 'iss-orbital-horizon-ambient'
                    ? 'ORBITAL HORIZON'
                    : 'EARTH DAY 4K'}
                </button>
              ))}
            </div>

            {/* Brightness Presets & Exit */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1">
                {[
                  { label: 'Dim', val: 0.4 },
                  { label: 'Normal', val: 0.7 },
                  { label: 'Vivid', val: 0.95 },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={() => setVideoOpacity(b.val)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                      videoOpacity === b.val ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCinemaMode(false)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Back to Exhibition
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* STANDARD HERO VIEW (With video in background)             */
        /* ======================================================== */
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column: Mission Narrative & Actions */}
          <div className={`w-full ${viewMode === 'video' ? 'lg:max-w-3xl' : 'lg:w-1/2'} text-left space-y-6`}>
            {/* Main Typography */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-[0.3em] uppercase">
                <Orbit className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '18s' }} />
                <span>Abandoned But Not Forgotten</span>
              </div>

              <h1 className="font-['Rajdhani'] font-bold text-4xl sm:text-6xl xl:text-7xl text-white tracking-wider uppercase leading-none drop-shadow-lg">
                THE MACHINES <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200">
                  WE LEFT BEHIND
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-200 font-normal leading-relaxed max-w-2xl pt-2 drop-shadow">
                “Every mission ends. <span className="text-cyan-200 font-medium">The discoveries remain.</span>”
              </p>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl drop-shadow">
                Journey through the robotic landers, rovers, seismometers, and deep-space probes humanity left resting on the lunar basalt, Martian sand, and interstellar vacuum.
              </p>
            </div>

            {/* Earth View Mode Toggle */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider uppercase">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>EARTH VIEW:</span>
              </div>

              <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-md gap-1">
                <button
                  id="earth-view-video-btn"
                  onClick={() => setViewMode('video')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === 'video'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>CINEMATIC VIDEO</span>
                </button>

                <button
                  id="earth-view-data-btn"
                  onClick={() => setViewMode('data')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === 'data'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>NASA DATA</span>
                </button>

                <button
                  id="earth-view-live-btn"
                  onClick={() => setViewMode('live')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    viewMode === 'live'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>LIVE STREAM</span>
                </button>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                id="hero-explore-missions-btn"
                onClick={onExploreMissions}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] flex items-center gap-3 cursor-pointer"
              >
                <span>EXPLORE MISSIONS</span>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="hero-begin-hardware-atlas-btn"
                onClick={onOpenHardwareAtlas}
                className="px-7 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 text-white font-bold text-sm tracking-wider uppercase transition-all flex items-center gap-2.5 cursor-pointer backdrop-blur-md hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>BEGIN HARDWARE ATLAS</span>
              </button>
            </div>

            {/* Destinations pill list */}
            <div className="pt-2 flex items-center gap-4 text-xs font-mono tracking-widest uppercase">
              <span className="text-cyan-400">MOON</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400">MARS</span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-400">DEEP SPACE</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Stage (Only displayed in 3D Data or Live Stream mode) */}
          {viewMode !== 'video' && (
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative">
              {/* 2. NASA DATA MODE (3D Interactive WebGL Globe with Real NASA Earthdata layers) */}
              {viewMode === 'data' && (
                <div className="relative w-80 h-80 sm:w-96 sm:h-96 xl:w-[460px] xl:h-[460px] flex items-center justify-center">
                {/* Orbital telemetry ring */}
                <div
                  className="absolute inset-0 rounded-full border border-cyan-500/20 border-dashed animate-spin pointer-events-none"
                  style={{ animationDuration: '40s' }}
                />
                <div className="absolute -inset-4 rounded-full border border-cyan-400/10 pointer-events-none" />

                {/* Authentic 3D WebGL Earth Globe with Real NASA Data Layer Switcher */}
                <RealisticGlobe
                  type="earth"
                  size={460}
                  interactive={true}
                  showLayerSwitcher={true}
                  className="w-full h-full"
                />

                {/* Origin Telemetry Tag */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#0b1329]/95 border border-cyan-500/40 rounded-lg px-4 py-1.5 text-center backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)] pointer-events-none">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <NasaSourceBadge type="NASA EARTHDATA" size="sm" />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                    DEPARTURE POINT
                  </span>
                  <span className="text-xs font-semibold text-white tracking-wider">
                    PLANET EARTH (1.0 AU)
                  </span>
                </div>
              </div>
            )}

            {/* 3. LIVE STREAM MODE (ISS Live Earth Viewing Feed) */}
            {viewMode === 'live' && (
              <div className="relative w-full max-w-xl aspect-[16/10] rounded-3xl overflow-hidden border border-cyan-500/50 bg-slate-950 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col justify-between">
                {/* Header Overlay */}
                <div className="absolute top-0 inset-x-0 p-3.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <NasaSourceBadge type="LIVE NASA STREAM" size="sm" />
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1.5 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      LIVE NASA API
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 font-medium">
                    {liveIssData
                      ? `${Math.abs(liveIssData.lat)}° ${liveIssData.lat >= 0 ? 'N' : 'S'}, ${Math.abs(liveIssData.lng)}° ${liveIssData.lng >= 0 ? 'E' : 'W'}`
                      : 'ISS ORBIT 408 KM'}
                  </span>
                </div>

                {/* Real Live Video Embed */}
                <iframe
                  src="https://www.youtube-nocookie.com/embed/P9C25Un7xaM?autoplay=1&mute=1&playsinline=1"
                  title="NASA Live ISS Earth View"
                  className="w-full h-full object-cover border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />

                {/* Footer Telemetry Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-3.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3 sm:gap-5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">SPEED</span>
                      <span className="text-white font-bold">
                        {liveIssData ? `${liveIssData.velocity.toLocaleString()} km/h` : '27,580 km/h'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ALTITUDE</span>
                      <span className="text-amber-300 font-bold">
                        {liveIssData ? `${liveIssData.altitude} km` : '418 km'}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-slate-400 block text-[9px]">ORBIT PERIOD</span>
                      <span className="text-cyan-300 font-bold">92.68 min</span>
                    </div>
                  </div>

                  <a
                    href="https://plus.nasa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>NASA+</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Scroll Indicator to Earth From Above section */}
      <div className="relative z-10 w-full py-4 border-t border-slate-800/60 bg-[#020617]/70 flex items-center justify-center backdrop-blur-md">
        <button
          onClick={onScrollToArchive}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-300 tracking-widest uppercase transition-colors cursor-pointer"
        >
          <span>Scroll down to explore Earth from Above & the Mission Archive</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
};
