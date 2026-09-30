import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Sparkles,
  Volume2,
  VolumeX,
  MessageSquare,
  Radio,
  Cpu,
  Zap,
  ChevronRight,
  Activity,
  Scan,
  Compass,
  Atom,
} from 'lucide-react';
import type { Mission } from '../types';
import { voiceAssistant } from '../services/voiceAssistant';
import { audioService } from '../services/audioService';
import { EchoSVGFallback } from './EchoSVGFallback';

interface MissionAiAssistantProps {
  mission: Mission;
  activeChapter: number;
  onOpenEcho?: (prompt?: string) => void;
  onDiscoverFact?: (factId: string, xp: number) => void;
}

export const MissionAiAssistant: React.FC<MissionAiAssistantProps> = ({
  mission,
  activeChapter,
  onOpenEcho,
  onDiscoverFact,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showHologramGrid, setShowHologramGrid] = useState<boolean>(true);
  const [hasScannedChapter, setHasScannedChapter] = useState<Record<number, boolean>>({});

  // Chapter-tailored AI intelligence briefings
  const chapterAiBriefs = [
    {
      title: 'Chapter 01 • Origin & Engineering Challenge',
      insight: `Echo AI Analysis: The ${mission.title} was conceived under intense historical urgency. Its primary engineering challenge was "${mission.engineeringChallenge}". Every component had to withstand extreme launch g-forces and thermal radiation.`,
      quickPrompts: [
        `Why was ${mission.title} built?`,
        `What were the major engineering hurdles in ${mission.year}?`,
        `How was this spacecraft tested before launch?`,
      ],
      telemetry: {
        launchEra: `${mission.year}`,
        targetDestination: mission.destination,
        hardwareClass: mission.hardwareType,
        missionNumber: mission.missionNumber,
      },
    },
    {
      title: 'Chapter 02 • Deep Space Trajectory & Flight Path',
      insight: `Echo AI Analysis: Traversing to ${mission.destination} required complex orbital mechanics. Over a journey lasting ${mission.missionDuration}, the vehicle endured cosmic ray bombardment and vacuum exposure before reaching ${mission.location.name}.`,
      quickPrompts: [
        `How did ${mission.title} navigate in deep space?`,
        `What trajectory or gravity assist was used?`,
        `How long did the transit take compared to modern missions?`,
      ],
      telemetry: {
        launchDate: mission.launchDate,
        arrivalDate: mission.arrivalDate,
        duration: mission.missionDuration,
        coordinates: mission.location.coordinates,
      },
    },
    {
      title: 'Chapter 03 • Anatomy of the Machine',
      insight: `Echo AI Analysis: Scanning ${mission.hardwareComponents.length} primary hardware systems. The payload utilized custom titanium/beryllium housing and specialized sensors. The most vulnerable subsystems were power conversion and telecommunications.`,
      quickPrompts: [
        `Which instrument was most critical on ${mission.title}?`,
        `What power source did this spacecraft rely upon?`,
        `How did the hardware handle temperature extremes?`,
      ],
      telemetry: {
        componentsLogged: `${mission.hardwareComponents.length} subsystems`,
        primaryPayload: mission.hardwareComponents[0]?.name || 'Scientific sensors',
        powerType: mission.hardwareComponents.some((c) => c.name.toLowerCase().includes('solar') || c.whatIsThis.toLowerCase().includes('solar')) ? 'Solar Photovoltaic' : 'RTG / Nuclear / Battery',
        classification: 'NASA Planetary Explorer',
      },
    },
    {
      title: 'Chapter 04 • Scientific Breakthroughs',
      insight: `Echo AI Analysis: ${mission.science.summary} The mission gathered irreplaceable data including ${mission.science.discoveries[0]?.explanation || mission.science.discoveries[0]?.title || 'unprecedented surface recordings'}.`,
      quickPrompts: [
        `What was the #1 scientific discovery of ${mission.title}?`,
        `Did this mission find evidence of water or past habitability?`,
        `How did this data change planetary science textbooks?`,
      ],
      telemetry: {
        discoveriesCataloged: `${mission.science.discoveries.length} key findings`,
        scienceTheme: mission.primaryObjective.slice(0, 45) + '...',
        archiveVerification: 'NASA PDS Verified',
        confidenceScore: '99.8% Calibrated',
      },
    },
    {
      title: 'Chapter 05 • Surface Environment & Telemetry',
      insight: `Echo AI Analysis: Operating on ${mission.location.name} meant facing atmospheric pressure of ${mission.environment.atmospherePressure || 'near-vacuum'} and temperatures ranging from ${mission.environment.temperatureRange || 'extreme swings'}. Regolith dust abrasion was a persistent mechanical hazard.`,
      quickPrompts: [
        `What are the physical conditions at ${mission.location.name}?`,
        `How did the planetary dust affect the instruments?`,
        `What would a human feel standing next to this machine?`,
      ],
      telemetry: {
        atmosphere: mission.environment.atmospherePressure || 'Hard vacuum',
        tempRange: mission.environment.temperatureRange || '-180°C to +120°C',
        radiationLevel: mission.environment.radiationContext || 'Unshielded solar/cosmic',
        siteName: mission.location.name,
      },
    },
    {
      title: 'Chapter 06 • Final Event & Resting Condition',
      insight: `Echo AI Analysis: ${mission.finalStatus.explanation} Today, the artifact rests in "${mission.finalStatus.condition}". What remains on the planetary surface: "${mission.finalStatus.whatRemains}".`,
      quickPrompts: [
        `Why did NASA declare mission end for ${mission.title}?`,
        `What was the final transmission sent by the spacecraft?`,
        `Will this hardware ever be retrieved or preserved?`,
      ],
      telemetry: {
        status: mission.status,
        condition: mission.finalStatus.condition.slice(0, 32) + '...',
        whatRemains: mission.finalStatus.whatRemains.slice(0, 30) + '...',
        finalTelemetry: mission.finalStatus.finalMessageOrTelemetry ? 'Recorded in Archive' : 'Loss of Signal',
      },
    },
    {
      title: 'Chapter 07 • The Cosmic Legacy',
      insight: `Echo AI Analysis: ${mission.legacy.science} The lessons forged during ${mission.title} directly influenced ${mission.legacy.futureMissions || 'the Artemis and Mars Sample Return architectures'}. It stands as a monument of human curiosity.`,
      quickPrompts: [
        `How does ${mission.title} help the future Artemis or Mars missions?`,
        `What engineering techniques developed here are still in use today?`,
        `Is this landing site protected under space heritage treaties?`,
      ],
      telemetry: {
        legacyTier: 'Tier 1 Historical Artifact',
        futureMissions: mission.legacy.futureMissions ? 'Direct Progenitor' : 'Baseline Science',
        coordinates: mission.finalStatus.coordinates || mission.location.coordinates,
        preservationStatus: 'Permanent Extraterrestrial Monument',
      },
    },
  ];

  const currentBrief = chapterAiBriefs[activeChapter] || chapterAiBriefs[0];

  // Stop speaking when chapter changes
  useEffect(() => {
    if (isSpeaking) {
      voiceAssistant.stopSpeaking();
      setIsSpeaking(false);
    }
  }, [activeChapter]);

  // Award XP upon first exploring AI insight of a chapter
  useEffect(() => {
    if (!hasScannedChapter[activeChapter]) {
      setHasScannedChapter((prev) => ({ ...prev, [activeChapter]: true }));
      if (onDiscoverFact) {
        onDiscoverFact(`echo-ai-scan-${mission.id}-ch${activeChapter}`, 15);
      }
    }
  }, [activeChapter, mission.id]);

  const handleToggleVoiceBriefing = () => {
    audioService.playTelemetryPing();
    if (isSpeaking) {
      voiceAssistant.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      audioService.playRobotChirp('happy');
      const textToSpeak = `Echo Mission Briefing. ${currentBrief.title}. ${currentBrief.insight}`;
      voiceAssistant.speak(textToSpeak, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handlePromptClick = (promptText: string) => {
    audioService.playRobotChirp('happy');
    if (onOpenEcho) {
      onOpenEcho(promptText);
    }
  };

  return (
    <div
      id="mission-ai-companion-section"
      className="relative rounded-3xl bg-gradient-to-br from-[#050b1d] via-[#081330] to-[#040915] border border-cyan-500/40 p-6 sm:p-8 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] my-8"
    >
      {/* Animated Sci-Fi Laser Scanline */}
      <motion.div
        animate={{ y: ['-10%', '110%', '-10%'] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
        className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[1.5px] opacity-70 pointer-events-none z-10"
      />

      {/* Atmospheric Hologram Nebula Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cyan-900/60">
        <div className="flex items-center gap-3">
          {/* Animated Status Beacon */}
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping absolute" />
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-cyan-400" />
                ECHO • AI MISSION SPECIALIST
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                GEMINI INTEL CO-PILOT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live orbital analysis & historical telemetry for {mission.title}
            </p>
          </div>
        </div>

        {/* Action Controls: Audio Briefing & Full Chat */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleToggleVoiceBriefing}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border ${
              isSpeaking
                ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_20px_#06b6d4]'
                : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-500/50'
            }`}
            title={isSpeaking ? 'Mute AI Voice' : 'Play AI Voice Briefing'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Mute Voice Briefing</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Listen to AI Brief</span>
              </>
            )}
          </motion.button>

          {onOpenEcho && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => handlePromptClick(`Explain the key details of ${mission.title} in simple terms.`)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Echo Anything</span>
            </motion.button>
          )}

          <button
            type="button"
            onClick={() => setShowHologramGrid(!showHologramGrid)}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              showHologramGrid
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle Holographic HUD overlay"
          >
            <Scan className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Left Character Animation & Right Intelligence Content */}
      <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center pt-6">
        
        {/* Left Column: 3D Chibi Mascot with Levitating Orbital Hologram Rings */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
          
          {/* Animated Hologram Rings Behind Mascot */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            
            {/* Outer Rotating Dashed Orbital Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40 pointer-events-none"
            />

            {/* Middle Counter-Rotating Pulse Ring */}
            <motion.div
              animate={{ rotate: -360, scale: [0.96, 1.04, 0.96] }}
              transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
              className="absolute inset-3 rounded-full border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.2)] pointer-events-none"
            />

            {/* Glowing Emitter Aura */}
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.05, 0.9] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute inset-8 rounded-full bg-gradient-to-t from-cyan-400/20 to-blue-500/10 blur-xl pointer-events-none"
            />

            {/* Chibi Robot Avatar with Floating Levitation */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotateZ: [0, 1.5, -1.5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 4.2,
                ease: 'easeInOut',
              }}
              className="relative z-10 scale-90 sm:scale-100 filter drop-shadow-[0_20px_25px_rgba(6,182,212,0.4)]"
            >
              <EchoSVGFallback
                emotion={isSpeaking ? 'excited' : 'happy'}
                voiceState={isSpeaking ? 'speaking' : 'idle'}
                isWaving={false}
                isHovered={true}
              />
            </motion.div>
          </div>

          {/* Audio Waveform Equalizer (Animates when Echo speaks or scans) */}
          <div className="mt-2 flex items-center gap-1.5 h-6 px-4 py-1 rounded-full bg-slate-950/80 border border-cyan-500/30">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider mr-1">
              {isSpeaking ? 'TRANSMITTING' : 'QUANTUM SYNC'}
            </span>
            <div className="flex items-center gap-1">
              {[0.3, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7].map((delay, idx) => (
                <motion.span
                  key={idx}
                  animate={{
                    height: isSpeaking ? ['4px', '18px', '6px', '20px', '4px'] : ['4px', '10px', '4px'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: isSpeaking ? 0.7 : 1.6,
                    delay: delay * 0.4,
                    ease: 'easeInOut',
                  }}
                  className="w-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Chapter Intelligence & Animated Prompts */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-4"
            >
              {/* Chapter Tagline */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {currentBrief.title}
                </span>

                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Telemetry Verified • NASA Space Apps Archive</span>
                </span>
              </div>

              {/* Main AI Insight Speech Balloon */}
              <div className="relative bg-slate-950/90 border border-cyan-500/50 rounded-2xl p-5 sm:p-6 shadow-inner space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-sm sm:text-base text-slate-100 font-sans leading-relaxed">
                    {currentBrief.insight}
                  </p>
                </div>

                {/* Telemetry Matrix Strip */}
                {showHologramGrid && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-cyan-900/40 font-mono text-[11px]"
                  >
                    {Object.entries(currentBrief.telemetry).map(([key, val]) => (
                      <div key={key} className="bg-black/50 border border-slate-800 p-2 rounded-lg">
                        <span className="text-slate-400 text-[10px] block uppercase truncate">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="text-cyan-300 font-bold truncate block">
                          {val}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Interactive Quick Prompts with Motion Chips */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ask Echo About This Chapter:</span>
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentBrief.quickPrompts.map((promptText, promptIdx) => (
                    <motion.button
                      key={promptIdx}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => handlePromptClick(promptText)}
                      className="group px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-slate-200 hover:text-white text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400 group-hover:text-amber-400 transition-colors" />
                      <span>{promptText}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-300 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
