import React from 'react';
import { Lock, Unlock, ArrowRight, CheckCircle2, Orbit } from 'lucide-react';
import { Destination } from '../types';
import { MISSIONS_DATA } from '../data/missions';
import { PlanetCanvas } from './PlanetCanvas';
import { RealisticGlobe } from './RealisticGlobe';
import { NasaSourceBadge } from './NasaSourceBadge';

interface DestinationHubProps {
  level: number;
  completedMissions: string[];
  onSelectDestination: (dest: Destination) => void;
  onEnterMission: (missionId: string) => void;
}

export const DestinationHub: React.FC<DestinationHubProps> = ({
  level,
  completedMissions,
  onSelectDestination,
  onEnterMission,
}) => {
  const destinations: Array<{
    id: Destination;
    title: string;
    subtitle: string;
    description: string;
    levelRequired: number;
    canvasType: 'moon' | 'mars' | 'deep-space';
    gradient: string;
    badgeColor: string;
  }> = [
    {
      id: 'Moon',
      title: 'THE MOON',
      subtitle: 'Earth’s Desolate Silent Companion',
      description:
        'Fifty-five years after Apollo, descent stages, electric buggies, and robotic scouts remain preserved in pristine vacuum on the basaltic maria.',
      levelRequired: 1,
      canvasType: 'moon',
      gradient: 'from-slate-900 to-slate-950',
      badgeColor: 'text-slate-300 border-slate-600 bg-slate-800/60',
    },
    {
      id: 'Mars',
      title: 'MARS',
      subtitle: 'The Rust-Colored Ancient World',
      description:
        'Rovers that survived years past their warranties, buried in red volcanic dust storms, having answered humanity’s profound question about ancient water.',
      levelRequired: 2,
      canvasType: 'mars',
      gradient: 'from-amber-950/40 to-slate-950',
      badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-950/60',
    },
    {
      id: 'Deep Space',
      title: 'DEEP SPACE',
      subtitle: 'The Interstellar Frontier',
      description:
        'Robotic messengers carrying gold plaques and phonograph records, cruising past the edge of the heliosphere toward distant constellations.',
      levelRequired: 3,
      canvasType: 'deep-space',
      gradient: 'from-indigo-950/40 to-slate-950',
      badgeColor: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/60',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase">
          <Orbit className="w-3.5 h-3.5 text-cyan-400" />
          <span>EXPLORATION DESTINATIONS</span>
        </div>
        <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-5xl text-white tracking-wider uppercase">
          CHOOSE YOUR ARCHIVE REALM
        </h2>
        <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
          Select a celestial domain to inspect the hardware humanity left behind. Complete missions on the Moon to unlock Mars, and venture outward to Deep Space.
        </p>
      </div>

      {/* Destination Cards Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {destinations.map((dest) => {
          const destMissions = MISSIONS_DATA.filter((m) => m.destination === dest.id);
          const completedCount = destMissions.filter((m) => completedMissions.includes(m.id)).length;
          const pct = Math.round((completedCount / destMissions.length) * 100);
          const isUnlocked = level >= dest.levelRequired;

          return (
            <div
              key={dest.id}
              id={`dest-card-${dest.id.toLowerCase().replace(' ', '-')}`}
              className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden bg-gradient-to-b ${dest.gradient} ${
                isUnlocked
                  ? 'border-slate-700/80 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                  : 'border-slate-800/40 opacity-75'
              }`}
            >
              {/* Planetary Globe Stage (3D Realistic WebGL Globe for Moon & Mars) */}
              <div className="relative w-full h-64 flex items-center justify-center p-2 bg-gradient-to-b from-black/70 to-transparent">
                <div className="w-52 h-52 flex items-center justify-center">
                  {dest.id === 'Moon' || dest.id === 'Mars' ? (
                    <RealisticGlobe
                      type={dest.id === 'Moon' ? 'moon' : 'mars'}
                      size={208}
                      interactive={true}
                    />
                  ) : (
                    <PlanetCanvas type="deep-space" size={208} />
                  )}
                </div>

                {/* NASA Source Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <NasaSourceBadge
                    type={
                      dest.id === 'Moon'
                        ? 'NASA SCIENTIFIC VISUALIZATION'
                        : dest.id === 'Mars'
                        ? 'NASA SCIENTIFIC VISUALIZATION'
                        : 'NASA ARCHIVE'
                    }
                    size="sm"
                  />
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                      <Unlock className="w-3 h-3" />
                      AVAILABLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900/90 border border-slate-700 text-slate-400">
                      <Lock className="w-3 h-3" />
                      UNLOCKS AT LVL {dest.levelRequired}
                    </span>
                  )}
                </div>

                {/* Progress pill */}
                <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-xs font-mono text-slate-300 bg-black/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span>{destMissions.length} MISSIONS</span>
                  <span className="text-cyan-300 font-bold">{pct}% EXPLORED</span>
                </div>
              </div>

              {/* Information Body */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-['Rajdhani'] font-bold text-2xl text-white tracking-wider uppercase">
                      {dest.title}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-cyan-400/90 tracking-wide uppercase">
                    {dest.subtitle}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {dest.description}
                  </p>
                </div>

                {/* Mission Quick List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase block">
                    ARCHIVAL CATALOG:
                  </span>
                  {destMissions.slice(0, 3).map((m) => {
                    const isDone = completedMissions.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => isUnlocked && onEnterMission(m.id)}
                        className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md transition-colors ${
                          isUnlocked
                            ? 'hover:bg-cyan-950/40 cursor-pointer text-slate-200 hover:text-cyan-300'
                            : 'text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="truncate pr-2">{m.title}</span>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">+{100} XP</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Enter Button */}
                <button
                  id={`dest-explore-btn-${dest.id.toLowerCase().replace(' ', '-')}`}
                  disabled={!isUnlocked}
                  onClick={() => onSelectDestination(dest.id)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isUnlocked
                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{isUnlocked ? `EXPLORE ${dest.title}` : `LOCKED (COMPLETE LEVEL ${dest.levelRequired - 1})`}</span>
                  {isUnlocked && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
