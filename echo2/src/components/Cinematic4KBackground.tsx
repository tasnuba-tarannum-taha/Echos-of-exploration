import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useCinematicVideo } from '../context/CinematicVideoContext';
import { CURATED_EARTH_VIDEOS } from '../data/nasaEarthVideos';

interface Cinematic4KBackgroundProps {
  activeTab: string;
}

export const Cinematic4KBackground: React.FC<Cinematic4KBackgroundProps> = ({ activeTab }) => {
  const {
    activeVideo,
    selectedQuality,
    isPlaying,
    isMuted,
    videoOpacity,
    cinemaMode,
    videoLoaded,
    backgroundEnabled,
    currentStreamUrl,
    setActiveVideo,
    setSelectedQuality,
    togglePlay,
    toggleMute,
    setVideoOpacity,
    setCinemaMode,
    setVideoLoaded,
    videoRef,
  } = useCinematicVideo();

  const [hudOpen, setHudOpen] = useState<boolean>(false);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background starfield canvas animation
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

    const starCount = 140;
    const stars: Array<{ x: number; y: number; size: number; alpha: number; speed: number }> = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.012 + 0.004,
      });
    }

    let time = 0;
    const render = () => {
      time += 1;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Deep space radial nebula
      const grad = ctx.createRadialGradient(
        width * 0.65,
        height * 0.45,
        40,
        width * 0.65,
        height * 0.45,
        Math.max(width, height) * 0.85
      );
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      grad.addColorStop(0.35, 'rgba(30, 58, 138, 0.06)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.5)');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle twinkling stars
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

  // Determine scrim based on active tab and cinema mode
  // When in explore tab at top, Hero controls provide natural framing
  // When on other tabs (missions, atlas, etc.), deepen scrim to protect text contrast
  const isExplore = activeTab === 'explore';

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#020617]">
      {/* Base Cosmic Starfield Canvas */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* 4K NASA ORBITAL CINEMATIC VIDEO - ALWAYS PLAYING */}
      {backgroundEnabled && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
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
              if (
                videoRef.current &&
                videoRef.current.currentTime < 8.5 &&
                activeVideo.id === 'earth-in-4k-expedition-65'
              ) {
                videoRef.current.currentTime = 8.5;
              }
              setVideoLoaded(true);
            }}
            onCanPlay={() => setVideoLoaded(true)}
            onPlay={() => setVideoLoaded(true)}
            onError={() => {
              // Fallback if large stream has bandwidth glitch
              if (selectedQuality === 'large' && activeVideo.streamQuality.medium) {
                setSelectedQuality('medium');
              }
            }}
            onEnded={() => {
              // Guarantee uninterrupted playback loop
              if (videoRef.current) {
                videoRef.current.currentTime = activeVideo.id === 'earth-in-4k-expedition-65' ? 8.5 : 0;
                videoRef.current.play().catch(() => {});
              }
            }}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 scale-105"
            style={{
              opacity: cinemaMode
                ? Math.min(1, videoOpacity + 0.25)
                : isExplore
                ? videoOpacity
                : Math.max(0.35, videoOpacity * 0.75),
            }}
          />

          {/* Cinematic Scrim & Contrast Gradients for 100% Typography Legibility */}
          {!cinemaMode && isExplore && (
            <>
              {/* Left Column Heavy Darkening for readable hero text */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/95 via-[#020617]/80 to-[#020617]/35 pointer-events-none" />
              {/* Top & Bottom blends into navbar and next section */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/70 pointer-events-none" />
              {/* Radial subtle cyan glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(6,182,212,0.15),transparent_65%)] pointer-events-none" />
              {/* Atmospheric Scanline texture */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_4px] opacity-25 pointer-events-none" />
            </>
          )}

          {/* Ambient Deep-Space Veil when browsing other tabs (missions, atlas, badges) */}
          {!isExplore && !cinemaMode && (
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/85 via-[#020617]/75 to-[#020617]/90 pointer-events-none backdrop-blur-[1px]" />
          )}

          {/* Cinema mode lighter overlay */}
          {cinemaMode && (
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-transparent to-[#020617]/30 pointer-events-none" />
          )}
        </div>
      )}

      {/* Floating 4K Ambient Video Cockpit Pill (Bottom-Left) */}
      <div className="fixed bottom-5 left-5 z-40 pointer-events-auto">
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md overflow-hidden transition-all duration-300">
          {/* Collapsed HUD Bar */}
          <div className="flex items-center gap-2 p-2 px-3">
            {/* 4K Live Indicator */}
            <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-300 uppercase">
                4K UHD FEED
              </span>
            </div>

            {/* Play / Pause Toggle */}
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label={isPlaying ? 'Pause 4K Video' : 'Play 4K Video'}
              title={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
              title={isMuted ? 'Unmute Ambient Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-300" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-300" />}
            </button>

            {/* Feed Title Pill */}
            <span className="text-[11px] font-mono text-slate-300 truncate max-w-[130px] hidden sm:inline-block">
              {activeVideo.title.split('–')[0].replace('Earth Views from the ISS', 'ISS Orbit').trim()}
            </span>

            {/* Expand / Collapse Control Menu */}
            <button
              onClick={() => setHudOpen(!hudOpen)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer ml-1"
              title="Toggle 4K Video Controls"
            >
              {hudOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expanded Controls Drawer */}
          {hudOpen && (
            <div className="p-3 border-t border-slate-800/80 space-y-3 bg-[#030712]/95 text-xs font-mono">
              {/* Quality & Cinema Mode Bar */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                  STREAM QUALITY:
                </span>
                <div className="flex items-center gap-1">
                  {(['large', 'medium', 'mobile'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuality(q)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                        selectedQuality === q
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {q === 'large' ? '4K UHD' : q === 'medium' ? '1080p' : 'Mobile'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Switcher */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                  SWITCH NASA 4K ORBITAL FEED:
                </span>
                <div className="space-y-1">
                  {CURATED_EARTH_VIDEOS.map((v, idx) => {
                    const isCurrent = activeVideo.id === v.id;
                    return (
                      <button
                        key={`bg-stream-option-${v.id}-${idx}`}
                        onClick={() => setActiveVideo(v)}
                        className={`w-full text-left p-1.5 rounded-lg text-[11px] truncate flex items-center justify-between transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/50'
                            : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{v.title}</span>
                        {isCurrent && <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brightness Presets & Cinema Mode */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 uppercase mr-1">BRIGHTNESS:</span>
                  {[
                    { label: 'Dim', val: 0.4 },
                    { label: 'Normal', val: 0.7 },
                    { label: 'Vivid', val: 0.95 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setVideoOpacity(preset.val)}
                      className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                        Math.abs(videoOpacity - preset.val) < 0.1
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCinemaMode(!cinemaMode)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                    cinemaMode
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {cinemaMode ? 'CINEMA: ON' : 'CINEMA: OFF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
