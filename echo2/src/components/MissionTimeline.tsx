import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Rocket,
  ShieldAlert,
  Wrench,
  Navigation,
  CheckCircle2,
  Radio,
  History,
  Compass,
} from 'lucide-react';
import { MissionTimelineEvent, SolMilestone, Mission } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { audioService } from '../services/audioService';

interface MissionTimelineProps {
  timeline: MissionTimelineEvent[];
  solTimeline?: SolMilestone[];
  isMars?: boolean;
  mission?: Mission;
}

export interface CinematicStage {
  id: string;
  stageNumber: string;
  name: 'Built' | 'Launch' | 'Journey' | 'Landing' | 'Discovery' | 'Final Signal' | 'Present Day';
  icon: any;
  date: string;
  title: string;
  description: string;
  significance: string;
  telemetryMetric: string;
}

export const MissionTimeline: React.FC<MissionTimelineProps> = ({
  timeline,
  solTimeline,
  isMars = false,
  mission,
}) => {
  const [activeTab, setActiveTab] = useState<'stages' | 'sol'>('stages');
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [selectedSolIndex, setSelectedSolIndex] = useState<number>(0);

  // Derive the 7 canonical story stages for the mission
  const stages: CinematicStage[] = [
    {
      id: 'stage-1-built',
      stageNumber: '01',
      name: 'Built',
      icon: Wrench,
      date: mission ? `Circa ${mission.year - 2}–${mission.year}` : '1960s–2000s',
      title: 'CLEANROOM ASSEMBLY & FABRICATION',
      description: mission?.engineeringChallenge
        ? `Engineered to survive extreme environments: ${mission.engineeringChallenge}`
        : 'Fabricated using aerospace aluminum alloys, beryllium optics, and gold Kapton thermal shielding under pristine cleanroom conditions.',
      significance: 'Passed thermal vacuum chamber tests, acoustic vibration tests, and mass spectrometer leak calibrations.',
      telemetryMetric: 'STRUCTURAL INTEGRITY: 100% FACTORY RATED',
    },
    {
      id: 'stage-2-launch',
      stageNumber: '02',
      name: 'Launch',
      icon: Rocket,
      date: mission?.launchDate || timeline.find((e) => e.type === 'launch')?.date || 'Launch Date',
      title: 'PAD IGNITION & EARTH ESCAPE',
      description: timeline.find((e) => e.type === 'launch')?.description ||
        `Blasted off from Cape Canaveral atop a high-thrust booster rocket, accelerating beyond Earth's escape velocity.`,
      significance: 'Orbital insertion confirmed and translunar/interplanetary cruise trajectory established.',
      telemetryMetric: 'VELOCITY: ~11.2 KM/S (EARTH ESCAPE VELOCITY)',
    },
    {
      id: 'stage-3-journey',
      stageNumber: '03',
      name: 'Journey',
      icon: Navigation,
      date: 'Interplanetary Cruise',
      title: 'THE SILENT DEEP SPACE CRUISE',
      description: `Traversed millions of kilometers of interplanetary vacuum, enduring intense solar storms and micrometeoroid streams while navigating by celestial star trackers.`,
      significance: 'Mid-course correction thruster burns precisely aligned the orbital trajectory with the planetary arrival corridor.',
      telemetryMetric: 'TRAJECTORY ACCURACY: < 0.001° DEVIATION',
    },
    {
      id: 'stage-4-landing',
      stageNumber: '04',
      name: 'Landing',
      icon: Compass,
      date: mission?.arrivalDate || timeline.find((e) => e.type === 'arrival')?.date || 'Arrival Date',
      title: 'ATMOSPHERIC ENTRY & EXTRATERRESTRIAL TOUCHDOWN',
      description: timeline.find((e) => e.type === 'arrival')?.description ||
        `Executed powered descent and touched down safely in extraterrestrial soil at ${mission?.location.name || 'the landing site'}.`,
      significance: 'Hardware confirmed alive and operational on an alien world without human hands present.',
      telemetryMetric: `COORDINATES: ${mission?.location.coordinates || 'TARGET LOCKED'}`,
    },
    {
      id: 'stage-5-discovery',
      stageNumber: '05',
      name: 'Discovery',
      icon: Sparkles,
      date: 'Operational Era',
      title: 'PEAK SCIENCE OPERATIONS & DISCOVERIES',
      description: mission?.science.summary ||
        `Gathered vital geological samples, transmitted high-resolution panoramas, and analyzed the elemental chemistry of alien soil.`,
      significance: mission?.science.discoveries[0]?.title
        ? `Major breakthrough: ${mission.science.discoveries[0].title}`
        : 'Rewrote solar system planetary science.',
      telemetryMetric: `PRIMARY OBJECTIVE: 100% ACCOMPLISHED`,
    },
    {
      id: 'stage-6-final-signal',
      stageNumber: '06',
      name: 'Final Signal',
      icon: Radio,
      date: mission?.finalStatus.date || timeline.find((e) => e.type === 'final')?.date || 'Final Sol',
      title: 'THE LAST SIGNAL & SILENCE',
      description: mission?.finalStatus.explanation ||
        `After exceeding design parameters, the machine transmitted its last historical telemetry packet before falling silent.`,
      significance: mission?.finalStatus.finalMessageOrTelemetry
        ? `Last recorded transmission: “${mission.finalStatus.finalMessageOrTelemetry}”`
        : 'The spacecraft completed its operational duty and transitioned into eternal repose.',
      telemetryMetric: 'COMMUNICATION STATUS: SIGNAL CARRIER LOST',
    },
    {
      id: 'stage-7-present-day',
      stageNumber: '07',
      name: 'Present Day',
      icon: History,
      date: '2026 (Present Day)',
      title: 'ETERNAL REST & HISTORIC LEGACY',
      description: mission?.finalStatus.condition ||
        `Preserved permanently on the surface under the stars, resting undisturbed as an immortal monument to human curiosity.`,
      significance: mission?.legacy.futureMissions ||
        'Informs the upcoming NASA Artemis expeditions and designated historic preservation covenants.',
      telemetryMetric: 'CURRENT CONDITION: RESTING IN VACUUM / PERPETUAL ARTIFACT',
    },
  ];

  const activeStage = stages[currentStageIdx] || stages[0];
  const selectedSol = solTimeline ? solTimeline[selectedSolIndex] : null;

  const handleNextStage = () => {
    if (currentStageIdx < stages.length - 1) {
      audioService.playTelemetryPing();
      setCurrentStageIdx((prev) => prev + 1);
    }
  };

  const handlePrevStage = () => {
    if (currentStageIdx > 0) {
      audioService.playTelemetryPing();
      setCurrentStageIdx((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full bg-[#030712] border border-cyan-950/90 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
      {/* Header & Sol Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white tracking-wider uppercase">
              CINEMATIC STORY TIMELINE
            </h3>
          </div>
          <p className="text-xs font-mono text-slate-400">
            The 7-stage epic chronicle: from cleanroom construction to deep space flight and permanent planetary rest.
          </p>
        </div>

        {/* Mode Switcher */}
        {isMars && solTimeline && solTimeline.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setActiveTab('stages')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'stages'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7-Stage Story
            </button>
            <button
              onClick={() => setActiveTab('sol')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'sol'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mars Sol Milestones
            </button>
          </div>
        )}
      </div>

      {activeTab === 'stages' ? (
        <div className="space-y-6">
          {/* Horizontal 7-Stage Stepper Rail */}
          <div className="relative py-2 overflow-x-auto pb-4">
            <div className="flex items-center gap-2 min-w-[780px]">
              {stages.map((stg, idx) => {
                const isCurrent = currentStageIdx === idx;
                const isCompleted = idx < currentStageIdx;
                const Icon = stg.icon;

                return (
                  <button
                    key={stg.id}
                    onClick={() => {
                      audioService.playTelemetryPing();
                      setCurrentStageIdx(idx);
                    }}
                    className={`flex-1 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        : isCompleted
                        ? 'bg-slate-900/90 border-slate-700/80 text-cyan-400/80'
                        : 'bg-[#070e22] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="font-bold text-cyan-400">STAGE {stg.stageNumber}</span>
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-300' : 'text-slate-400'}`} />
                      <span className="font-['Rajdhani'] font-bold text-xs uppercase tracking-wide truncate">
                        {stg.name}
                      </span>
                    </div>

                    {isCurrent && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animated Stage Counter & Progress Indicators */}
          <div className="flex items-center justify-between text-xs font-mono px-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">CHRONOLOGY SEQUENCE:</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-700">
                {currentStageIdx + 1} OF 7 STAGES
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevStage}
                disabled={currentStageIdx === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous Stage</span>
              </button>
              <button
                onClick={handleNextStage}
                disabled={currentStageIdx === stages.length - 1}
                className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 disabled:opacity-30 text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Next Stage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cinematic Stage Dossier Card with Motion Fade */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="bg-gradient-to-br from-[#070e22] via-[#050b1d] to-[#030712] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                    <span>STAGE {activeStage.stageNumber} OF 07</span>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">{activeStage.date}</span>
                  </div>
                  <h4 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white tracking-wide uppercase">
                    {activeStage.title}
                  </h4>
                </div>

                <div className="px-4 py-2 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs text-emerald-400 self-start md:self-auto">
                  {activeStage.telemetryMetric}
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {activeStage.description}
              </p>

              <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest block">
                    MISSION HISTORICAL SIGNIFICANCE:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeStage.significance}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Martian Sol Milestones (if Mars) */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {solTimeline?.map((solEvt, idx) => {
              const isSelected = selectedSolIndex === idx;
              return (
                <button
                  key={solEvt.sol}
                  onClick={() => setSelectedSolIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/70 border-amber-500/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-[#070e22] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-amber-400">SOL {solEvt.sol}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{solEvt.date}</div>
                  <div className="font-semibold text-xs text-white truncate mt-1">{solEvt.title}</div>
                </button>
              );
            })}
          </div>

          {selectedSol && (
            <div className="bg-[#070e22] border border-amber-900/40 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    MARTIAN SOL {selectedSol.sol} • {selectedSol.date}
                  </span>
                  <h4 className="font-['Rajdhani'] font-bold text-2xl text-white tracking-wide uppercase mt-1">
                    {selectedSol.title}
                  </h4>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {selectedSol.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
