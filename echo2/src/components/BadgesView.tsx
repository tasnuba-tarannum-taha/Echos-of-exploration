import React, { useState } from 'react';
import {
  Award,
  Lock,
  CheckCircle2,
  Trophy,
  RefreshCw,
  GraduationCap,
  Footprints,
  Cog,
  Compass,
  Moon,
  Radio,
  Image as ImageIcon,
  FlaskConical,
  ScrollText,
  Activity,
  Radar,
  Sparkles,
} from 'lucide-react';
import { Badge, LevelInfo } from '../types';
import { JuniorExplorerMode } from './JuniorExplorerMode';
import { audioService } from '../services/audioService';

interface BadgesViewProps {
  badges: Badge[];
  currentLevelInfo?: LevelInfo;
  xp: number;
  completedMissionsCount: number;
  onResetProgress: () => void;
  onAddXp?: (amount: number, reason: string) => void;
  onUnlockBadge?: (badgeId: string) => void;
}

export const BadgesView: React.FC<BadgesViewProps> = ({
  badges = [],
  currentLevelInfo,
  xp = 0,
  completedMissionsCount = 0,
  onResetProgress,
  onAddXp,
  onUnlockBadge,
}) => {
  const [activeTab, setActiveTab] = useState<'academy' | 'badges'>('academy');
  const unlockedBadges = badges.filter((b) => b.unlocked);

  const levelInfo: LevelInfo = currentLevelInfo || {
    level: 1,
    title: 'Cadet Surveyor',
    description: 'Begin your archival expedition on Earth and the Moon.',
    minXp: 0,
    maxXp: 300,
    xpInCurrentLevel: xp,
    xpNeededForNext: Math.max(0, 300 - xp),
    progressPct: Math.min(100, Math.round((xp / 300) * 100)),
  };

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Footprints':
        return <Footprints className="w-6 h-6 text-cyan-400" />;
      case 'Cog':
        return <Cog className="w-6 h-6 text-amber-400" />;
      case 'Compass':
        return <Compass className="w-6 h-6 text-rose-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-emerald-400" />;
      case 'Moon':
        return <Moon className="w-6 h-6 text-slate-200" />;
      case 'Radio':
        return <Radio className="w-6 h-6 text-indigo-400" />;
      case 'Image':
        return <ImageIcon className="w-6 h-6 text-blue-400" />;
      case 'FlaskConical':
        return <FlaskConical className="w-6 h-6 text-teal-400" />;
      case 'ScrollText':
        return <ScrollText className="w-6 h-6 text-yellow-400" />;
      case 'Activity':
        return <Activity className="w-6 h-6 text-pink-400" />;
      case 'Radar':
        return <Radar className="w-6 h-6 text-cyan-400" />;
      default:
        return <Award className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase">
          <Trophy className="w-3.5 h-3.5 text-cyan-400" />
          <span>JUNIOR EXPLORER GUILD & REPUTATION</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-5xl text-white tracking-wider uppercase">
              NASA SPACE SCHOOL
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl">
              Learn, test your knowledge, and earn recognition by investigating extraterrestrial hardware through NASA Space School.
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset all progress, XP, and badges back to Cadet level?')) {
                onResetProgress();
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-mono uppercase cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Level Rank Banner */}
      <div className="bg-gradient-to-r from-[#070e22] via-[#0d1c44] to-[#040817] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] shrink-0">
            <Award className="w-10 h-10 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                LEVEL {levelInfo.level} RANK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                {levelInfo.title}
              </span>
            </div>
            <h3 className="font-['Rajdhani'] font-bold text-3xl sm:text-4xl text-white uppercase">
              {levelInfo.title}
            </h3>
            <p className="text-xs text-slate-300">
              {levelInfo.description}
            </p>
          </div>
        </div>

        {/* Progress gauge */}
        <div className="w-full md:w-80 space-y-2 bg-black/40 border border-slate-800 p-4 rounded-xl font-mono">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">TOTAL XP:</span>
            <span className="text-cyan-300 font-bold">{xp} XP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${levelInfo.progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
            <span>{levelInfo.xpInCurrentLevel} XP</span>
            <span>{levelInfo.xpNeededForNext} XP TO NEXT LEVEL</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 bg-[#070e22] border border-slate-800 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => {
            audioService.playTelemetryPing();
            setActiveTab('academy');
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'academy'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>NASA SPACE SCHOOL (10 QUIZ QUESTIONS)</span>
        </button>

        <button
          onClick={() => {
            audioService.playTelemetryPing();
            setActiveTab('badges');
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>COLLECTED MEDALS ({unlockedBadges.length} / {badges.length})</span>
        </button>
      </div>

      {/* Main View: Academy Quiz or Badges */}
      <div className="w-full">
        {activeTab === 'academy' ? (
          <JuniorExplorerMode
            xp={xp}
            onAddXp={onAddXp}
            onUnlockBadge={onUnlockBadge}
          />
        ) : (
          /* Badges Grid */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase">
                COLLECTED MEDALS ({unlockedBadges.length} / {badges.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((b) => {
                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                      b.unlocked
                        ? 'bg-[#070e22] border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        : 'bg-[#030712] border-slate-800/80 opacity-65'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                        {renderBadgeIcon(b.icon)}
                      </div>
                      {b.unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                          <Lock className="w-3 h-3" />
                          LOCKED
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 mt-4 flex-1">
                      <h4 className="font-['Rajdhani'] font-bold text-xl text-white uppercase">
                        {b.title || b.name}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {b.description}
                      </p>
                    </div>

                    {b.unlocked && b.unlockedAt && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-cyan-400/80">
                        GRANTED: {new Date(b.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
