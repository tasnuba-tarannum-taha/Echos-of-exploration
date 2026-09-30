import React, { useState, useMemo } from 'react';
import { Search, Filter, Rocket, MapPin, Calendar, Clock, CheckCircle2, ChevronRight, Sparkles, Tag, Lock } from 'lucide-react';
import { MISSIONS_DATA } from '../data/missions';
import { Destination, HardwareType, MissionStatus } from '../types';

interface MissionCatalogProps {
  onSelectMission: (missionId: string) => void;
  completedMissions: string[];
  unlockedMissions?: string[];
  chaptersCompleted?: Record<string, number[]>;
  initialDestinationFilter?: Destination | 'All';
}

const MissionCardBanner: React.FC<{ mission: typeof MISSIONS_DATA[0]; isCompleted: boolean }> = ({ mission, isCompleted }) => {
  const [imgSrc, setImgSrc] = useState<string>(mission.images[0]?.url || 'https://images-assets.nasa.gov/image/as15-88-11866/as15-88-11866~large.jpg');
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const handleImageError = () => {
    const nextIdx = fallbackIndex + 1;
    if (mission.images && mission.images[nextIdx]?.url) {
      setFallbackIndex(nextIdx);
      setImgSrc(mission.images[nextIdx].url);
    } else if (imgSrc !== 'https://images-assets.nasa.gov/image/as15-88-11866/as15-88-11866~large.jpg') {
      setImgSrc('https://images-assets.nasa.gov/image/as15-88-11866/as15-88-11866~large.jpg');
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="relative w-full h-48 bg-slate-950 overflow-hidden">
      {!hasError ? (
        <img
          src={imgSrc}
          alt={mission.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#070e22] to-slate-950 p-4 text-center">
          <Rocket className="w-8 h-8 text-cyan-400/60 mb-2 animate-pulse" />
          <span className="text-[11px] font-mono text-cyan-300 font-bold tracking-wider uppercase">
            {mission.title}
          </span>
          <span className="text-[9px] font-mono text-slate-400 mt-1">
            NASA Telemetry Archive
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070e22] via-transparent to-black/50" />

      {/* Top Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-black/80 text-cyan-300 border border-cyan-500/30">
          {mission.destination}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/80 text-amber-300 border border-amber-500/30">
          {mission.hardwareType}
        </span>
      </div>

      <div className="absolute top-3 right-3">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            EXPLORED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/40">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            +100 XP
          </span>
        )}
      </div>

      {/* Year pill */}
      <div className="absolute bottom-3 left-3 text-xs font-mono font-bold text-white bg-black/70 px-2 py-0.5 rounded border border-slate-800">
        YEAR {mission.year}
      </div>
    </div>
  );
};

export const MissionCatalog: React.FC<MissionCatalogProps> = ({
  onSelectMission,
  completedMissions,
  unlockedMissions,
  chaptersCompleted = {},
  initialDestinationFilter = 'All',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<Destination | 'All'>(initialDestinationFilter);
  const [selectedHardware, setSelectedHardware] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const filteredMissions = useMemo(() => {
    return MISSIONS_DATA.filter((m) => {
      // Destination filter
      if (selectedDestination !== 'All' && m.destination !== selectedDestination) return false;

      // Hardware filter
      if (selectedHardware !== 'All' && m.hardwareType !== selectedHardware) return false;

      // Status filter
      if (selectedStatus !== 'All' && m.status !== selectedStatus) return false;

      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchSubtitle = m.subtitle.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        const matchSci = m.science.summary.toLowerCase().includes(q);
        const matchLoc = m.location.name.toLowerCase().includes(q);
        const matchYear = m.year.toString().includes(q);
        if (!matchTitle && !matchSubtitle && !matchDesc && !matchSci && !matchLoc && !matchYear) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedDestination, selectedHardware, selectedStatus]);

  const destinations: Array<Destination | 'All'> = ['All', 'Moon', 'Mars', 'Deep Space'];
  const hardwareTypes = ['All', 'Descent Stage', 'Lander', 'Rover', 'Spacecraft Probe'];
  const statuses = ['All', 'Complete', 'Ended', 'Active'];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase">
          <Rocket className="w-3.5 h-3.5 text-cyan-400" />
          <span>VERIFIED HARDWARE ARCHIVE</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-5xl text-white tracking-wider uppercase">
              EXPLORE ALL MISSIONS
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl">
              Examine the historical robotic sentinels and crewed descent equipment permanently stationed across the Moon, Mars, and deep space.
            </p>
          </div>
          <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-2 rounded-lg border border-cyan-800/60 self-start md:self-auto">
            SHOWING {filteredMissions.length} OF {MISSIONS_DATA.length} MISSIONS
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#070e22]/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl backdrop-blur-md">
        {/* Search input */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="mission-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search missions, hardware types, locations, science discoveries (e.g. 'Spirit', 'silica', 'Tranquility', '1969')..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white uppercase"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800/60">
          {/* Destination */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Destination:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {destinations.map((dest) => (
                <button
                  key={dest}
                  onClick={() => setSelectedDestination(dest)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                    selectedDestination === dest
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>

          {/* Hardware */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Hardware:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {hardwareTypes.map((hw) => (
                <button
                  key={hw}
                  onClick={() => setSelectedHardware(hw)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                    selectedHardware === hw
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {hw}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Status:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Missions */}
      {filteredMissions.length === 0 ? (
        <div className="bg-[#070e22] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-base text-slate-300">No missions match your search query or selected filter criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDestination('All');
              setSelectedHardware('All');
              setSelectedStatus('All');
            }}
            className="px-4 py-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((mission) => {
            const isCompleted = completedMissions.includes(mission.id);
            const isUnlocked = !unlockedMissions || unlockedMissions.includes(mission.id);
            const passedChapters = chaptersCompleted[mission.id] || [];

            return (
              <div
                key={mission.id}
                id={`mission-card-${mission.id}`}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectMission(mission.id);
                  }
                }}
                className={`group relative bg-[#070e22]/90 border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  !isUnlocked
                    ? 'border-slate-800/60 opacity-80 cursor-not-allowed'
                    : 'border-slate-800/80 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.18)] hover:-translate-y-1 cursor-pointer'
                }`}
              >
                {/* Lock Overlay if mission is locked */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 text-center space-y-2.5">
                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
                      Mission Locked
                    </div>
                    <p className="text-xs text-slate-300 max-w-[220px]">
                      Complete preceding mission checkpoints (score ≥ 5/10 on chapters) to unlock.
                    </p>
                  </div>
                )}

                {/* Image Banner */}
                <MissionCardBanner mission={mission} isCompleted={isCompleted} />

                {/* Content Body */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
                      {mission.missionNumber} • {mission.status}
                    </div>
                    <h3 className="font-['Rajdhani'] font-bold text-xl text-white tracking-wide group-hover:text-cyan-300 transition-colors uppercase leading-tight">
                      {mission.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {mission.subtitle}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{mission.location.name}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {passedChapters.length > 0 && !isCompleted
                          ? `${passedChapters.length}/7 CHAPTERS CERTIFIED`
                          : `${mission.hardwareComponents.length} COMPONENTS TO INSPECT`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                        <span>OPEN STORY</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
