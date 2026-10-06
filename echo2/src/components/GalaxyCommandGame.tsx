import React, { useEffect, useState, useRef } from 'react';
import { Rocket, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

interface GalaxyCommandGameProps {
  onAddXp?: (amount: number, reason: string) => void;
  onExit?: () => void;
}

export const GalaxyCommandGame: React.FC<GalaxyCommandGameProps> = ({
  onAddXp,
  onExit,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      iframeRef.current?.focus();
    }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'GALAXY_XP' && onAddXp) {
        onAddXp(event.data.amount || 100, event.data.reason || 'Galaxy Command Victory');
      }
      if (event.data.type === 'GALAXY_EXIT' && onExit) {
        onExit();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAddXp, onExit]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col font-sans transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#03061a] p-0'
          : 'max-w-6xl mx-auto space-y-3'
      }`}
    >
      {/* Top Controller Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d4ff] animate-pulse" />
          <span className="font-['Rajdhani'] font-bold text-lg text-white uppercase tracking-wider flex items-center gap-1.5">
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span>Galaxy Command</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 hidden sm:inline-block">
            PILOT SIMULATOR
          </span>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-slate-950 text-cyan-200 border border-cyan-500/30 hidden lg:inline-flex items-center gap-1.5 shadow-inner">
            <span className="text-amber-400 font-bold">▲ Up / W</span>: Fly Upward · Full 2D Flight
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Apollo Moon Lander</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded 2nd Game Container */}
      <div
        className={`relative w-full rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-[#03061a] ${
          isFullscreen ? 'flex-1 h-full rounded-none border-0' : 'h-[750px] sm:h-[820px]'
        }`}
      >
        <iframe
          ref={iframeRef}
          tabIndex={0}
          src="/galaxy-command.html"
          title="Galaxy Command Arcade Game"
          className="w-full h-full border-0 block"
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
};
