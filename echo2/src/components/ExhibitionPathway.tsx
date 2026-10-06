import React, { useEffect } from 'react';
import {
  Compass,
  Globe,
  Rocket,
  Radio,
  Sparkles,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { audioService } from '../services/audioService';

export interface ExhibitionPathwayProps {
  currentTab: string;
  onNavigateTab: (tabId: string) => void;
}

export const EXHIBITION_STAGES = [
  {
    id: 'explore',
    stepNumber: 1,
    label: 'Explore',
    title: 'Earth & Destinations',
    desc: 'Orbital views, landing sites & realms',
    icon: Compass,
    accent: 'cyan',
  },
  {
    id: 'atlas',
    stepNumber: 2,
    label: 'Hardware Atlas',
    title: 'Planetary Coordinates',
    desc: 'Surface maps & resting hardware',
    icon: Globe,
    accent: 'blue',
  },
  {
    id: 'missions',
    stepNumber: 3,
    label: 'Missions',
    title: 'Historical Archive',
    desc: 'Machine dossiers, timelines & specs',
    icon: Rocket,
    accent: 'indigo',
  },
  {
    id: 'nasa-feeds',
    stepNumber: 4,
    label: 'Live NASA',
    title: 'Real-Time Telemetry',
    desc: 'APOD, asteroid radar & space weather',
    icon: Radio,
    accent: 'amber',
  },
  {
    id: 'journey',
    stepNumber: 5,
    label: 'Astronaut Journey',
    title: 'Flight Simulator',
    desc: 'Apollo Lunar Lander & Galaxy arcade',
    icon: Sparkles,
    accent: 'purple',
  },
  {
    id: 'badges',
    stepNumber: 6,
    label: 'Badges',
    title: 'Honors & Ranks',
    desc: 'Explorer XP, rank promotions & trophies',
    icon: Trophy,
    accent: 'emerald',
  },
] as const;

export const ExhibitionPathway: React.FC<ExhibitionPathwayProps> = ({
  currentTab,
  onNavigateTab,
}) => {
  // Map mission-detail back to missions index for the pathway
  const effectiveTab = currentTab === 'mission-detail' ? 'missions' : currentTab;
  const currentIndex = EXHIBITION_STAGES.findIndex((s) => s.id === effectiveTab);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStage = EXHIBITION_STAGES[safeIndex];

  const prevStage = safeIndex > 0 ? EXHIBITION_STAGES[safeIndex - 1] : null;
  const nextStage = safeIndex < EXHIBITION_STAGES.length - 1 ? EXHIBITION_STAGES[safeIndex + 1] : null;

  // Keyboard shortcut support [1-6]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6) {
        const targetStage = EXHIBITION_STAGES[num - 1];
        if (targetStage && targetStage.id !== currentTab) {
          audioService.playTelemetryPing();
          onNavigateTab(targetStage.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, onNavigateTab]);

  const handleStepClick = (tabId: string) => {
    audioService.playTelemetryPing();
    onNavigateTab(tabId);
  };

  return (
    <section
      id="exhibition-pathway-bar"
      aria-label="Exhibition Pathway Navigation"
      className="w-full bg-[#050b1d]/90 border-t border-b border-cyan-950/70 py-6 px-4 sm:px-6 lg:px-8 my-8 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Pathway Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
            <h3 className="font-['Rajdhani'] font-bold text-sm tracking-[0.2em] text-white uppercase">
              EXHIBITION PATHWAY
            </h3>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              STAGE {safeIndex + 1} OF 6: {currentStage.label.toUpperCase()}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Press keys <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">1</kbd> - <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">6</kbd> to jump wings</span>
          </div>
        </div>

        {/* 6-Stage Breadcrumb Pathway */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {EXHIBITION_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCurrent = stage.id === effectiveTab;
            const isPast = idx < safeIndex;

            return (
              <button
                key={stage.id}
                onClick={() => handleStepClick(stage.id)}
                className={`relative p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : isPast
                    ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850/70'
                    : 'bg-slate-950/40 border-slate-850 hover:border-slate-700 hover:bg-slate-900/50 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Step indicator */}
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : isPast
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    0{stage.stepNumber}
                  </span>

                  {isPast ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isCurrent
                          ? 'text-cyan-300'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                  )}
                </div>

                <div>
                  <div
                    className={`text-xs font-['Rajdhani'] font-bold tracking-wider uppercase transition-colors line-clamp-1 ${
                      isCurrent
                        ? 'text-white'
                        : 'text-slate-300 group-hover:text-cyan-300'
                    }`}
                  >
                    {stage.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 font-mono">
                    {stage.title}
                  </div>
                </div>

                {isCurrent && (
                  <span className="absolute -bottom-px left-4 right-4 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_6px_#06b6d4]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Prev / Next Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {prevStage ? (
            <button
              onClick={() => handleStepClick(prevStage.id)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Previous: {prevStage.label}</span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextStage ? (
            <button
              onClick={() => handleStepClick(nextStage.id)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>Next Wing: {nextStage.label}</span>
              <ArrowRight className="w-4 h-4 fill-slate-950" />
            </button>
          ) : (
            <button
              onClick={() => handleStepClick('explore')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>Revisit Exhibition: Explore</span>
              <ArrowRight className="w-4 h-4 fill-slate-950" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
