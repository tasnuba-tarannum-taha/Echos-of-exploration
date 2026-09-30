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
} from 'lucide-react';
import { RealisticGlobe } from './RealisticGlobe';
import { NasaSourceBadge } from './NasaSourceBadge';
import { FEATURED_EARTH_VIDEO, CURATED_EARTH_VIDEOS } from '../data/nasaEarthVideos';
import { NasaEarthVideo } from '../types';

interface HeroProps {
  onBeginJourney: () => void;
  onExploreMissions: () => void;
  onScrollToArchive: () => void;
}

type EarthViewMode = 'video' | 'data' | 'live';

export const Hero: React.FC<HeroProps> = ({
  onBeginJourney,
  onExploreMissions,
  onScrollToArchive,
}) => {
  const [viewMode, setViewMode] = useState<EarthViewMode>('video');
  const [activeVideo, setActiveVideo] = useState<NasaEarthVideo>(FEATURED_EARTH_VIDEO);
  const [selectedQuality, setSelectedQuality] = useState<'mobile' | 'medium' | 'large'>('medium');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [autoplayFailed, setAutoplayFailed] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);

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

  // Background starfield animation
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

    const starCount = 200;
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
      grad.addColorStop(0, 'rgba(12, 35, 75, 0.3)');
      grad.addColorStop(0.6, 'rgba(3, 7, 24, 0.15)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
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
      {/* Deep Space Background Canvas */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Atmospheric Horizon Glow */}
      <div className="absolute top-0 right-0 w-3/5 h-full bg-gradient-to-l from-cyan-950/20 via-blue-950/10 to-transparent pointer-events-none z-0" />

      {/* Main Hero Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Column: Mission Narrative & Actions */}
        <div className="w-full lg:w-1/2 text-left space-y-6">
          {/* Challenge Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Built for the 2026 NASA Space Apps Challenge</span>
          </div>

          {/* Main Typography */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-[0.3em] uppercase">
              <Orbit className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '18s' }} />
              <span>Abandoned But Not Forgotten</span>
            </div>

            <h1 className="font-['Rajdhani'] font-bold text-4xl sm:text-6xl xl:text-7xl text-white tracking-wider uppercase leading-none">
              THE MACHINES <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200">
                WE LEFT BEHIND
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl pt-2">
              “Every mission ends. <span className="text-cyan-200 font-medium">The discoveries remain.</span>”
            </p>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Journey through the robotic landers, rovers, seismometers, and deep-space probes humanity left resting on the lunar basalt, Martian sand, and interstellar vacuum.
            </p>
          </div>

          {/* Earth View Mode Toggle */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider uppercase">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>EARTH VIEW:</span>
            </div>

            <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-md gap-1">
              <button
                id="earth-view-video-btn"
                onClick={() => setViewMode('video')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === 'data'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold shadow-[0_0_15px_rgba(20,184,166,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>NASA DATA</span>
              </button>

              <button
                id="earth-view-live-btn"
                onClick={() => setViewMode('live')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === 'live'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>LIVE STREAM</span>
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              id="hero-begin-journey-btn"
              onClick={onBeginJourney}
              className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm sm:text-base tracking-wider uppercase transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center gap-3 cursor-pointer"
            >
              <span>Begin The Journey</span>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              id="hero-explore-missions-btn"
              onClick={onExploreMissions}
              className="px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-white font-semibold text-sm tracking-wider uppercase transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Explore Missions</span>
            </button>
          </div>

          {/* Destinations pill list */}
          <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400 tracking-widest uppercase">
            <span className="text-cyan-400">MOON</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">MARS</span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-400">DEEP SPACE</span>
          </div>
        </div>

        {/* Right Column: Hero Visual Stage */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative">
          {/* 1. CINEMATIC VIDEO MODE (DEFAULT) */}
          {viewMode === 'video' && (
            <div className="relative w-full max-w-xl aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              {/* Authentic NASA Earth Video Player */}
              <video
                ref={videoRef}
                key={currentStreamUrl}
                src={currentStreamUrl}
                poster={activeVideo.posterUrl}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                onLoadedData={() => setVideoLoaded(true)}
                className="w-full h-full object-cover"
              />

              {/* Atmospheric Glow & Soft Vignette (never obscures Earth) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />

              {/* Orbital Telemetry Perimeter Ring */}
              <div className="absolute inset-0 rounded-3xl border border-cyan-500/20 pointer-events-none" />

              {/* Fallback Overlay if Autoplay is blocked by browser policy */}
              {autoplayFailed && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
                  <button
                    onClick={handleManualPlay}
                    className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2.5 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-black" />
                    <span>PLAY EARTH FROM SPACE</span>
                  </button>
                  <p className="text-xs text-slate-300 font-mono mt-3">
                    NASA International Space Station 4K Observation
                  </p>
                </div>
              )}

              {/* Top Badging & Source Information */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <NasaSourceBadge type="REAL NASA VIDEO" size="sm" />
                </div>

                <div className="flex items-center gap-1.5 bg-black/70 border border-slate-700/80 rounded-lg p-1 backdrop-blur-md">
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

              {/* Bottom Telemetry & Controls Bar */}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-3 bg-black/80 border border-slate-800 rounded-xl px-3 py-2 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlay}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleToggleMute}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                    )}
                    <span className="text-[10px] font-mono text-slate-300">
                      {isMuted ? 'MUTED' : 'ON'}
                    </span>
                  </button>

                  <div className="hidden sm:block border-l border-slate-700 pl-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">
                      SOURCE: NASA (ISS EXPEDITION 65)
                    </span>
                  </div>
                </div>

                <a
                  href={activeVideo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 tracking-wider uppercase transition-colors shrink-0"
                >
                  <span>VIEW ORIGINAL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Video Switcher Mini-Dock */}
              <div className="absolute top-12 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
                {CURATED_EARTH_VIDEOS.slice(0, 3).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setActiveVideo(v);
                      setIsPlaying(true);
                      setAutoplayFailed(false);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider text-left transition-all backdrop-blur-md cursor-pointer ${
                      activeVideo.id === v.id
                        ? 'bg-cyan-500/90 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-black/60 text-slate-300 hover:bg-black/80 hover:text-white border border-slate-800'
                    }`}
                  >
                    {v.id === 'earth-in-4k-expedition-65'
                      ? '4K EXPEDITION 65'
                      : v.id === 'iss-hdev-external-survey'
                      ? 'ISS HDEV CAMERA'
                      : 'ORBITAL HORIZON'}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <div className="relative w-full max-w-xl aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden border border-amber-500/40 bg-slate-950 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col justify-between p-6">
              {/* Header */}
              <div className="flex items-center justify-between z-10">
                <NasaSourceBadge type="LIVE NASA STREAM" size="sm" />
                <span className="text-xs font-mono text-amber-300">ISS ORBIT 408 KM</span>
              </div>

              {/* Center Live Stream Portal Information */}
              <div className="my-auto space-y-4 text-center z-10">
                <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <Radio className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white font-['Rajdhani'] tracking-wide">
                    OFFICIAL NASA ISS LIVE EARTH VIEW
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Live camera views from the International Space Station exterior payloads (EHDC and External Cameras). The ISS orbits Earth every 90 minutes.
                  </p>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-left text-xs font-mono bg-black/60 border border-slate-800 rounded-xl p-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">SPEED</span>
                    <span className="text-white font-bold">27,600 km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ALTITUDE</span>
                    <span className="text-white font-bold">408 km</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ORBIT PERIOD</span>
                    <span className="text-white font-bold">92.68 min</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="https://plus.nasa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
                  >
                    <span>OPEN OFFICIAL NASA LIVE STREAM</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setViewMode('video')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>WATCH 4K ARCHIVE FOOTAGE</span>
                  </button>
                </div>
              </div>

              {/* Footer Notice (honesty in live status) */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between z-10">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  During orbital night (approx. 45 min each 90 min), live view is dark.
                </span>
                <span className="text-emerald-400 font-bold">VERIFIED NASA FEED</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Scroll Indicator to Earth From Above section */}
      <div className="relative z-10 w-full py-4 border-t border-slate-800/60 bg-[#020617]/70 flex items-center justify-center">
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
