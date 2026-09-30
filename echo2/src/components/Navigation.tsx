import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Compass, Rocket, Radio, Trophy, Info, Menu, X, ShieldAlert, Globe } from 'lucide-react';
import { audioService } from '../services/audioService';

import { LevelInfo } from '../types';

interface NavigationProps {
  currentTab?: string;
  activeTab?: string;
  onNavigate?: (tab: string, param?: string) => void;
  onSelectTab?: (tab: string) => void;
  xp: number;
  level?: number;
  currentLevelInfo?: LevelInfo;
  unlockedBadgesCount?: number;
  totalBadgesCount?: number;
  onStartDemoTour?: () => void;
  isTourActive?: boolean;
  onOpenEcho?: () => void;
  onQuickUnlockDemo?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  activeTab,
  onNavigate,
  onSelectTab,
  xp,
  level = 1,
  currentLevelInfo,
  unlockedBadgesCount,
  totalBadgesCount,
  onStartDemoTour,
  isTourActive = false,
  onOpenEcho,
  onQuickUnlockDemo,
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(() => audioService.getSoundEnabled());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const active = activeTab || currentTab || 'explore';
  const handleNav = (tabId: string) => {
    if (onSelectTab) onSelectTab(tabId);
    if (onNavigate) onNavigate(tabId);
  };

  const handleToggleSound = () => {
    const newState = audioService.toggleSound();
    setSoundOn(newState);
  };

  const navItems = [
    { id: 'explore', label: 'EXPLORE', icon: Compass },
    { id: 'journey', label: 'ASTRONAUT JOURNEY', icon: Sparkles },
    { id: 'atlas', label: 'HARDWARE ATLAS', icon: Globe },
    { id: 'missions', label: 'MISSIONS', icon: Rocket },
    { id: 'nasa-feeds', label: 'LIVE NASA', icon: Radio },
    { id: 'badges', label: 'BADGES', icon: Trophy },
  ];

  const levelNum = currentLevelInfo ? currentLevelInfo.level : level;
  const levelName = currentLevelInfo
    ? currentLevelInfo.title
    : levelNum === 1
    ? 'LUNAR PIONEER'
    : levelNum === 2
    ? 'MARTIAN NAVIGATOR'
    : 'DEEP SPACE ARCHIVIST';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/90 border-b border-cyan-950/80 backdrop-blur-md transition-colors">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div
          id="nav-brand-logo"
          onClick={() => handleNav('explore')}
          className="cursor-pointer group flex flex-col justify-center select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] group-hover:scale-125 transition-transform"></div>
            <span className="font-['Rajdhani'] font-bold text-xl sm:text-2xl tracking-[0.2em] text-white group-hover:text-cyan-300 transition-colors uppercase">
              ECHOES OF EXPLORATION
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 pl-5 uppercase">
            A GLOBAL JOURNEY BEYOND BOUNDARIES
          </span>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-850/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_6px_#06b6d4]"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Telemetry Controls & XP */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* XP & Level Badge */}
          <button
            id="nav-progress-btn"
            onClick={() => handleNav('badges')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/40 transition-colors text-left"
            title="View Explorer Rank & Badges"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">LVL {levelNum}</span>
                <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/50 px-1 rounded border border-amber-800/60">
                  {levelName}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 tracking-wide">
                {xp.toLocaleString()} <span className="text-[10px] text-slate-400">XP</span>
              </span>
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            id="nav-sound-toggle-btn"
            onClick={handleToggleSound}
            aria-label={soundOn ? 'Sound On' : 'Sound Off'}
            className={`p-2 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
              soundOn
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={soundOn ? 'Atmospheric Audio: ON (Click to Mute)' : 'Atmospheric Audio: MUTED (Click to Enable Drone)'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden xl:inline text-[11px] uppercase">{soundOn ? 'Audio ON' : 'Mute'}</span>
          </button>

          {/* Ask Echo Header Button */}
          {onOpenEcho && (
            <button
              id="nav-echo-btn"
              onClick={onOpenEcho}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-200 text-xs font-semibold tracking-wide uppercase transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] cursor-pointer"
              title="Ask Echo — Gemini AI Space Guide"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask Echo</span>
            </button>
          )}

          {/* Tour Mode Button */}
          {onStartDemoTour && (
            <button
              id="nav-demo-tour-btn"
              onClick={onStartDemoTour}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
                isTourActive
                  ? 'bg-rose-950/80 hover:bg-rose-900/90 border-rose-500/60 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border-amber-500/40 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              }`}
              title={isTourActive ? 'Exit Guided Tour' : 'Launch Guided Tour'}
            >
              {isTourActive ? (
                <>
                  <X className="w-3.5 h-3.5 text-rose-400" />
                  <span>Exit Tour</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Tour Mode</span>
                </>
              )}
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            id="nav-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070e22] border-b border-cyan-950 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  handleNav(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wider uppercase transition-colors ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            {onOpenEcho && (
              <button
                onClick={() => {
                  onOpenEcho();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Ask Echo AI Space Guide
              </button>
            )}

            {onStartDemoTour && (
              <button
                onClick={() => {
                  onStartDemoTour();
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border ${
                  isTourActive
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}
              >
                {isTourActive ? (
                  <>
                    <X className="w-4 h-4 text-rose-400" />
                    Exit Guided Tour
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Launch Guided Tour
                  </>
                )}
              </button>
            )}
              {onQuickUnlockDemo && (
                <button
                  onClick={() => {
                    onQuickUnlockDemo();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono uppercase tracking-wider"
                >
                  Unlock All Missions For Review
                </button>
              )}
            </div>
        </div>
      )}
    </header>
  );
};
