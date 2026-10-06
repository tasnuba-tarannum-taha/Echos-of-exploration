import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Award,
  Cpu,
  ExternalLink,
  Globe2,
  HelpCircle,
  History,
  Microscope,
  Radio,
  Rocket,
  Route,
  ShieldCheck,
  Trophy,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import type { DataSourceBadge, Mission, MissionImage } from '../types';
import { NasaVideoPlayer } from './NasaVideoPlayer';
import { NasaSourceBadge } from './NasaSourceBadge';
import { NasaMediaContainer } from './NasaMediaContainer';
import { ChapterEvaluationQuiz } from './ChapterEvaluationQuiz';

export const ECHO_CHAPTER_SYSTEM_INSTRUCTION = `
Every mission has exactly seven independent top-level chapters.
Never place another seven-stage timeline inside Chapter 02.
Every chapter must use verified real NASA photography, archive footage,
telemetry, or scientifically documented NASA media. Do not use generic
3D animations as chapter media. Use visually equivalent verified NASA
archive media only when mission-specific media is unavailable.

Voice Mode ON: hide the chat window, speak one concise sentence, and
cancel audio before moving to another chapter or response.
Chat Mode ON: show the chat window, provide rich descriptions, and mute
speech synthesis.
`;

interface MissionDetailProps {
  mission: Mission;
  onBack: () => void;
  onCompleteMission: (missionId: string) => void;
  onInspectHardware: (componentId: string) => void;
  onDiscoverFact: (factId: string, xp: number) => void;
  inspectedComponents: string[];
  discoveredFacts: string[];
  isCompleted: boolean;
  onNavigateToMission?: (missionId: string) => void;
  initialChapter?: number;
  onChapterChange?: (chapterIndex: number) => void;
  onOpenEcho?: (prompt?: string) => void;
  completedChapters?: number[];
  onCompleteChapter?: (missionId: string, chapterIndex: number, score: number) => void;
}

const chapters = [
  {
    id: 'origin',
    number: '01',
    title: 'WHY WAS IT BUILT?',
    mediaTitle: 'LAUNCH & PRE-LAUNCH ARCHIVE FOOTAGE',
    mediaDescription:
      'Authentic NASA launch, pad, preparation, or cleanroom documentation from the mission archive.',
  },
  {
    id: 'journey',
    number: '02',
    title: 'THE JOURNEY',
    mediaTitle: 'TRANSIT FLIGHT PATH & TRAJECTORY IMAGERY',
    mediaDescription:
      'Clean transit, cruise, approach, and target-corridor media. This chapter is a standalone chapter and never contains nested stages.',
  },
  {
    id: 'machine',
    number: '03',
    title: 'MEET THE MACHINE',
    mediaTitle: 'CLEANROOM HARDWARE & PAYLOAD PHOTOGRAPHY',
    mediaDescription:
      'High-resolution NASA documentation of the spacecraft, rover, lander, instruments, and payload hardware.',
  },
  {
    id: 'science',
    number: '04',
    title: 'THE SCIENCE',
    mediaTitle: 'RAW DISCOVERY IMAGERY & SPECTRAL EVIDENCE',
    mediaDescription:
      'Mission photography and verified scientific observations behind the mission’s discoveries.',
  },
  {
    id: 'environment',
    number: '05',
    title: 'THE ENVIRONMENT',
    mediaTitle: 'SURFACE PANORAMA & HORIZON PHOTOGRAPHY',
    mediaDescription:
      'Real surface terrain, horizon, lighting, dust, and planetary environment imagery from NASA archives.',
  },
  {
    id: 'fate',
    number: '06',
    title: 'WHAT HAPPENED?',
    mediaTitle: 'FINAL EVENT ARCHIVE & TELEMETRY RECORD',
    mediaDescription:
      'Historical imagery, final observations, and the last verified mission status or telemetry record.',
  },
  {
    id: 'legacy',
    number: '07',
    title: 'THE LEGACY',
    mediaTitle: 'ORBITAL IMAGERY & RESTING COORDINATES',
    mediaDescription:
      'NASA orbital imagery and documented final coordinates showing where the machine remains.',
  },
];

const chapterIcons = [Rocket, Route, Cpu, Microscope, Globe2, Radio, History];

const NASA_ARCHIVE_FALLBACK: MissionImage = {
  url: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg',
  title: 'Apollo 11 Lunar Module Eagle on the Moon',
  date: 'July 20, 1969',
  source: 'NASA Johnson Space Center',
  badge: 'NASA PHOTO',
  originalUrl: 'https://images.nasa.gov/details-as11-40-5903',
  caption:
    'Verified NASA photographic archive fallback showing the Apollo 11 Lunar Module Eagle on the lunar surface at Tranquility Base.',
  isOfficialNasa: true,
};

const getChapterImage = (
  mission: Mission,
  chapterIndex: number,
  offset: number = 0
): MissionImage => {
  const pool =
    mission.images && mission.images.length > 0
      ? mission.images
      : [NASA_ARCHIVE_FALLBACK];

  return (
    pool[(chapterIndex + offset) % pool.length] || NASA_ARCHIVE_FALLBACK
  );
};

const getBadgeType = (
  image: MissionImage,
  preferred?: DataSourceBadge
): DataSourceBadge => {
  if (preferred) return preferred;
  if (image.badge) return image.badge;
  if (image.isVisualization) return 'NASA SCIENTIFIC VISUALIZATION';
  return 'NASA PHOTO';
};

interface ChapterHeadingProps {
  number: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const ChapterHeading: React.FC<ChapterHeadingProps> = ({
  number,
  title,
  subtitle,
  icon: Icon,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="relative border-b border-cyan-900/40 pb-6 overflow-hidden"
  >
    {/* Subtle ambient scanline highlight */}
    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none" />

    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 tracking-widest uppercase shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            CHAPTER {number}
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline-block">
            • FLIGHT RECORD DIRECTIVE
          </span>
        </div>

        <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-4xl text-white tracking-wider uppercase leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text">
          {title}
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl font-normal">
          {subtitle}
        </p>
      </div>

      <motion.div
        whileHover={{ scale: 1.12, rotate: 6 }}
        whileTap={{ scale: 0.95 }}
        className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-950/90 to-slate-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)] cursor-pointer group"
      >
        <Icon className="w-6 h-6 group-hover:text-cyan-200 transition-colors" />
      </motion.div>
    </div>

    {/* Animated bottom scan pulse line */}
    <div className="absolute bottom-0 left-0 h-[2px] w-28 bg-gradient-to-r from-cyan-400 via-cyan-500 to-transparent animate-pulse" />
  </motion.div>
);

interface ChapterMediaPanelProps {
  mission: Mission;
  chapterIndex: number;
  heading: string;
  description: string;
  offset?: number;
  useLaunchVideo?: boolean;
}

const ChapterMediaPanel: React.FC<ChapterMediaPanelProps> = ({
  mission,
  chapterIndex,
  heading,
  description,
  offset = 0,
  useLaunchVideo = false,
}) => {
  const image = getChapterImage(mission, chapterIndex, offset);

  const video =
    useLaunchVideo && mission.video?.badge === 'NASA VIDEO'
      ? mission.video
      : null;

  const mediaUrl = video ? video.originalUrl : image.originalUrl;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-[#030712] border border-cyan-900/40 rounded-2xl overflow-hidden shadow-2xl relative"
    >
      {/* Top Media Header matching second picture */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 sm:p-5 border-b border-cyan-950/80 bg-slate-950/60 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CHAPTER MEDIA SECTION
            </span>
          </div>
          <h3 className="font-['Rajdhani'] font-bold text-xl sm:text-2xl text-white uppercase tracking-wide">
            {heading}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <NasaSourceBadge
            type={video ? 'NASA VIDEO' : getBadgeType(image)}
            size="sm"
          />
        </div>
      </div>

      {/* Embedded NASA Media Player with Satellite Feed Switcher */}
      <div className="relative bg-black">
        <NasaMediaContainer
          missionId={mission.id}
          chapterKey={`chapter_${chapterIndex + 1}`}
          className="w-full border-none rounded-none"
        />
      </div>

      {/* Footer Info Strip */}
      <div className="p-4 sm:p-5 space-y-3 bg-[#030712]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {video
                ? video.description ||
                  'Authentic NASA video archive selected for this chapter with orbital telemetry.'
                : image.caption}
            </p>

            {chapterIndex === 0 && !video && (
              <p className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                NASA API Video Interlink Active • High Definition Telemetry Ready
              </p>
            )}
          </div>

          {mediaUrl && (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 hover:bg-cyan-900/60 text-[11px] font-mono uppercase tracking-wider transition-all shrink-0 shadow-sm"
            >
              <span>Open NASA Record</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.section>
  );
};

interface ChapterImageStripProps {
  mission: Mission;
  chapterIndex: number;
  count?: number;
}

const ChapterImageStrip: React.FC<ChapterImageStripProps> = ({
  mission,
  chapterIndex,
  count = 2,
}) => {
  const images = Array.from({ length: count }, (_, index) =>
    getChapterImage(mission, chapterIndex, index + 1)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400/80 px-1">
        <span className="uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          SECONDARY NASA RECONNAISSANCE STILLS (2ND PIC / AUXILIARY ARCHIVE)
        </span>
        <span className="text-slate-500 uppercase">CALIBRATED DATA</span>
      </div>

      <div
        className={`grid gap-4 ${
          count === 1
            ? 'grid-cols-1'
            : count === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        {images.map((image, index) => (
          <motion.figure
            key={`${image.url}-${chapterIndex}-${index}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * index + 0.1 }}
            whileHover={{ y: -5, scale: 1.01 }}
            className="group relative bg-[#030712] border border-cyan-950/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-black">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  const target = event.target as HTMLImageElement;
                  if (target.src !== NASA_ARCHIVE_FALLBACK.url) {
                    target.src = NASA_ARCHIVE_FALLBACK.url;
                  }
                }}
              />

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Corner targeting marks */}
              <div className="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400/60" />
              <div className="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400/60" />
              <div className="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b border-l border-cyan-400/60" />
              <div className="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b border-r border-cyan-400/60" />

              <div className="absolute top-2.5 left-2.5">
                <NasaSourceBadge type={getBadgeType(image)} size="sm" />
              </div>

              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[9px] font-mono text-cyan-300 border border-cyan-500/30">
                FRAME #{chapterIndex + 1}.{index + 2}
              </div>
            </div>

            <figcaption className="p-4 space-y-2 bg-[#030712]/90 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400 uppercase">
                <span className="truncate text-cyan-400">{image.date}</span>
                <span className="shrink-0">{image.source}</span>
              </div>

              <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-cyan-200 transition-colors">
                {image.title}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {image.caption}
              </p>

              {image.originalUrl && (
                <div className="pt-1">
                  <a
                    href={image.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 hover:text-cyan-200 transition-colors"
                  >
                    <span>View NASA Asset Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </div>
  );
};

export const MissionDetail: React.FC<MissionDetailProps> = ({
  mission,
  onBack,
  onCompleteMission,
  onInspectHardware,
  onDiscoverFact,
  inspectedComponents,
  discoveredFacts,
  isCompleted,
  initialChapter,
  onChapterChange,
  onOpenEcho,
  completedChapters = [],
  onCompleteChapter,
}) => {
  const hasAuthenticVideo = mission.video?.badge === 'NASA VIDEO';

  const [activeChapter, setActiveChapter] = useState<number>(
    initialChapter !== undefined ? initialChapter : 0
  );
  const [showCompletionModal, setShowCompletionModal] =
    useState<boolean>(false);
  const [mediaMode, setMediaMode] = useState<'photo' | 'video'>(
    hasAuthenticVideo ? 'video' : 'photo'
  );
  const [lockWarningMessage, setLockWarningMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveChapter(initialChapter !== undefined ? initialChapter : 0);
  }, [mission.id, initialChapter]);

  React.useEffect(() => {
    setMediaMode(hasAuthenticVideo ? 'video' : 'photo');
  }, [mission.id, hasAuthenticVideo]);

  const [localCompletedChapters, setLocalCompletedChapters] = useState<number[]>(completedChapters);

  React.useEffect(() => {
    setLocalCompletedChapters(completedChapters);
  }, [completedChapters]);

  const effectiveCompletedChapters = React.useMemo(() => {
    return Array.from(new Set([...completedChapters, ...localCompletedChapters]));
  }, [completedChapters, localCompletedChapters]);

  const isChapterUnlocked = (chapterIdx: number): boolean => {
    if (chapterIdx === 0) return true;
    if (isCompleted) return true;
    return effectiveCompletedChapters.includes(chapterIdx - 1);
  };

  const handleSelectChapter = (chapterIndex: number) => {
    if (!isChapterUnlocked(chapterIndex)) {
      setLockWarningMessage(
        `Chapter ${chapterIndex + 1} is locked! Complete Chapter ${chapterIndex}'s checkpoint questions (score at least 5/10) to unlock.`
      );
      setTimeout(() => setLockWarningMessage(null), 4000);
      return;
    }
    setLockWarningMessage(null);
    setActiveChapter(chapterIndex);
    if (onChapterChange) {
      onChapterChange(chapterIndex);
    }
  };

  const handlePassChapter = (chapterIdx: number, score: number, autoOpenNext: boolean = true) => {
    // Immediately mark chapterIdx as cleared locally so next chapter unlocks instantly
    setLocalCompletedChapters((prev) => Array.from(new Set([...prev, chapterIdx])));

    if (onCompleteChapter) {
      onCompleteChapter(mission.id, chapterIdx, score);
    }

    // If score >= 5, automatically open the next chapter after brief celebratory delay
    if (autoOpenNext && chapterIdx < 6) {
      const nextIdx = chapterIdx + 1;
      setTimeout(() => {
        setActiveChapter(nextIdx);
        if (onChapterChange) {
          onChapterChange(nextIdx);
        }
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }, 1500);
    }
  };

  const allChaptersPassed = [0, 1, 2, 3, 4, 5, 6].every((idx) => effectiveCompletedChapters.includes(idx));
  const canCompleteMission = isCompleted || allChaptersPassed || effectiveCompletedChapters.includes(6);

  const handleFinishMission = () => {
    if (!canCompleteMission && !isCompleted) {
      const nextUnpassed = [0, 1, 2, 3, 4, 5, 6].find((idx) => !effectiveCompletedChapters.includes(idx)) ?? 0;
      setLockWarningMessage(
        `Mission Checkpoint: You must score at least 5/10 right on each chapter evaluation to unlock mission completion. You have certified ${effectiveCompletedChapters.length} of 7 chapters.`
      );
      setActiveChapter(nextUnpassed);
      setTimeout(() => {
        const el = document.getElementById(`chapter-${nextUnpassed}-evaluation`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    onCompleteMission(mission.id);
    setShowCompletionModal(true);
  };

  const heroImage = getChapterImage(mission, 0, 0);
  const heroVideo = hasAuthenticVideo ? mission.video : undefined;

  const launchEvent = mission.timeline.find((event) => event.type === 'launch');
  const arrivalEvent = mission.timeline.find(
    (event) => event.type === 'arrival'
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Return to Catalog</span>
        </button>

        <div className="flex items-center gap-3">
          {mission.sources && mission.sources[0] && (
            <a
              href={mission.sources[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
              title={`View ${mission.sources[0].title} on NASA Website`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official NASA Website</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 min-w-0">
            <span className="text-cyan-400 shrink-0">
              {mission.destination.toUpperCase()}
            </span>
            <span>/</span>
            <span className="text-white truncate">{mission.title}</span>
          </div>
        </div>
      </div>

      <section className="relative rounded-3xl bg-gradient-to-r from-[#070e22] via-[#091536] to-[#030712] border border-cyan-950 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase tracking-widest">
                {mission.destination}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40 uppercase tracking-widest">
                {mission.hardwareType}
              </span>

              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                {mission.missionNumber}
              </span>
            </div>

            <div>
              <h1 className="font-['Rajdhani'] font-bold text-3xl sm:text-5xl xl:text-6xl text-white tracking-wide uppercase leading-none">
                {mission.title}
              </h1>

              <p className="text-base sm:text-xl text-cyan-200 font-medium mt-2 leading-relaxed">
                {mission.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
              <div className="bg-black/40 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Launch
                </span>
                <span className="text-xs font-bold text-white font-mono">
                  {mission.launchDate}
                </span>
              </div>

              <div className="bg-black/40 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Arrival
                </span>
                <span className="text-xs font-bold text-white font-mono">
                  {mission.arrivalDate}
                </span>
              </div>

              <div className="bg-black/40 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Duration
                </span>
                <span className="text-xs font-bold text-white font-mono">
                  {mission.missionDuration}
                </span>
              </div>

              <div className="bg-black/40 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Status
                </span>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  {mission.status}
                </span>
              </div>
            </div>

            {/* Direct Official NASA Website Sources Strip */}
            {mission.sources && mission.sources.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NASA SOURCES:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <a
                    href={mission.officialNasaUrl || mission.sources[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 text-[11px] font-mono font-bold tracking-wider uppercase transition-colors shadow-sm"
                    title="Open Primary NASA Mission Portal"
                  >
                    <span>NASA Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  {mission.sources.map((s, idx) => {
                    const shortName = s.title
                      .replace(/^NASA\s+/, '')
                      .replace(/^Official\s+/, '')
                      .replace(/:.*/, '');
                    return (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[10px] font-mono uppercase tracking-wider transition-colors"
                        title={s.title}
                      >
                        <span className="truncate max-w-[130px]">{shortName}</span>
                        <ExternalLink className="w-2 h-2 text-slate-500" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-2">
            {heroVideo && (
              <div className="flex items-center justify-end gap-1.5 pb-1">
                <button
                  onClick={() => setMediaMode('video')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono tracking-wider uppercase transition-colors border cursor-pointer ${
                    mediaMode === 'video'
                      ? 'bg-red-950 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  NASA Video
                </button>

                <button
                  onClick={() => setMediaMode('photo')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono tracking-wider uppercase transition-colors border cursor-pointer ${
                    mediaMode === 'photo'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  NASA Photo
                </button>
              </div>
            )}

            {mediaMode === 'video' && heroVideo ? (
              <NasaVideoPlayer
                video={heroVideo}
                posterUrl={heroImage.url}
                className="w-full"
              />
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-[4/3] shadow-2xl group">
                <img
                  src={heroImage.url}
                  alt={heroImage.title}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    const target = event.target as HTMLImageElement;
                    if (target.src !== NASA_ARCHIVE_FALLBACK.url) {
                      target.src = NASA_ARCHIVE_FALLBACK.url;
                    }
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3">
                  <NasaSourceBadge type={getBadgeType(heroImage)} size="sm" />
                </div>

                <div className="absolute bottom-3 left-3 right-3 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-200 gap-3">
                    <span className="font-semibold truncate">
                      {heroImage.title}
                    </span>
                    <span className="text-slate-400 text-[10px] shrink-0">
                      {heroImage.date}
                    </span>
                  </div>

                  {heroImage.originalUrl && (
                    <a
                      href={heroImage.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 uppercase tracking-widest pt-1"
                    >
                      <span>View Original NASA Archive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <nav
        aria-label="Mission chapters"
        className="w-full bg-[#070e22] border border-slate-800 rounded-2xl p-2 overflow-x-auto shadow-lg"
      >
        <div className="flex items-center gap-2 min-w-[760px]">
          {chapters.map((chapter, chapterIndex) => {
            const isActive = activeChapter === chapterIndex;
            const ChapterIcon = chapterIcons[chapterIndex];
            const isUnlocked = isChapterUnlocked(chapterIndex);
            const isCertified = effectiveCompletedChapters.includes(chapterIndex);

            return (
              <motion.button
                key={chapter.id}
                type="button"
                whileHover={isUnlocked ? { scale: 1.02 } : undefined}
                whileTap={isUnlocked ? { scale: 0.98 } : undefined}
                onClick={() => handleSelectChapter(chapterIndex)}
                className={`relative flex-1 py-3 px-3 rounded-xl text-left transition-colors duration-200 overflow-hidden ${
                  !isUnlocked
                    ? 'opacity-60 bg-slate-950/60 border border-slate-900 cursor-not-allowed text-slate-500'
                    : isActive
                    ? 'text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent cursor-pointer'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeChapterHighlight"
                    className="absolute inset-0 bg-gradient-to-r from-cyan-950 via-cyan-900/40 to-cyan-950 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      !isUnlocked
                        ? 'text-slate-600'
                        : isCertified
                        ? 'text-emerald-400'
                        : isActive
                        ? 'text-cyan-300'
                        : 'text-slate-500'
                    }`}
                  >
                    CHAPTER {chapter.number}
                  </span>
                  <div className="flex items-center gap-1">
                    {isCertified && (
                      <span title="Chapter evaluation passed (≥ 5/10)">
                        <CheckCircle2
                          className="w-3 h-3 text-emerald-400 shrink-0"
                        />
                      </span>
                    )}
                    {!isUnlocked && (
                      <span title="Locked - pass previous chapter questions to unlock">
                        <Lock
                          className="w-3 h-3 text-amber-500/80 shrink-0"
                        />
                      </span>
                    )}
                    <ChapterIcon
                      className={`w-3.5 h-3.5 ${
                        !isUnlocked
                          ? 'opacity-40 text-slate-600'
                          : isActive
                          ? 'text-cyan-400'
                          : 'opacity-70'
                      }`}
                    />
                  </div>
                </div>

                <div className="relative z-10 font-['Rajdhani'] font-bold text-xs uppercase truncate mt-0.5">
                  {chapter.title}
                </div>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {lockWarningMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 p-3 bg-amber-950/70 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-mono shadow-lg"
        >
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{lockWarningMessage}</span>
        </motion.div>
      )}

      <main className="space-y-8">
        <AnimatePresence mode="wait">
          {activeChapter === 0 && (
            <motion.section
              key="chapter-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <ChapterHeading
                number="01"
                title="Why Was It Built?"
                subtitle={mission.primaryObjective}
                icon={Rocket}
              />

              <ChapterMediaPanel
                mission={mission}
                chapterIndex={0}
                heading={chapters[0].mediaTitle}
                description={chapters[0].mediaDescription}
                useLaunchVideo
              />

              <ChapterImageStrip mission={mission} chapterIndex={0} count={2} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -4, borderColor: 'rgba(6, 182, 212, 0.5)' }}
                  className="bg-[#030712] border border-slate-800/80 rounded-xl p-5 space-y-2 transition-all shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase block">
                      Mission Purpose
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {mission.missionPurpose}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -4, borderColor: 'rgba(251, 191, 36, 0.5)' }}
                  className="bg-[#030712] border border-slate-800/80 rounded-xl p-5 space-y-2 transition-all shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-amber-400 tracking-wider uppercase block">
                      Engineering Challenge
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {mission.engineeringChallenge}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -4, borderColor: 'rgba(52, 211, 153, 0.5)' }}
                  className="bg-[#030712] border border-slate-800/80 rounded-xl p-5 space-y-2 transition-all shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase block">
                      Primary Objective
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {mission.primaryObjective}
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-900/60 border border-slate-800 border-l-4 border-l-cyan-500 rounded-xl p-6 space-y-2"
              >
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">
                  Narrative Context
                </span>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {mission.description}
                </p>
              </motion.div>

              {/* Official NASA Source Records Spotlight */}
              {mission.sources && mission.sources.length > 0 && (
                <div className="bg-[#030712] border border-emerald-900/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        NASA Verification & Primary Sources
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50 uppercase">
                      {mission.sources.length} NASA Verified Records
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    All mission logs, engineering specs, and telemetry are cross-referenced with official NASA Planetary Data System (PDS) archives and JPL mission operations.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {mission.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/60 transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase block">
                            {src.type}
                          </span>
                          <span className="text-xs font-sans text-slate-200 group-hover:text-white truncate block">
                            {src.title}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <ChapterEvaluationQuiz
                missionId={mission.id}
                missionTitle={mission.title}
                chapterIndex={0}
                chapterTitle={chapters[0].title}
                isChapterCompleted={effectiveCompletedChapters.includes(0)}
                onPassChapter={(score) => handlePassChapter(0, score)}
                onNextChapter={() => handleSelectChapter(1)}
              />
            </motion.section>
          )}

          {activeChapter === 1 && (
            <motion.section
              key="chapter-1"
              id="mission-journey-anchor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <ChapterHeading
                number="02"
                title="The Journey"
                subtitle="A standalone transit chapter with verified launch, cruise, arrival, and target-site records. It does not contain another timeline."
                icon={Route}
              />

              <ChapterMediaPanel
                mission={mission}
                chapterIndex={1}
                heading={chapters[1].mediaTitle}
                description={chapters[1].mediaDescription}
              />

              <ChapterImageStrip mission={mission} chapterIndex={1} count={3} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Earth Departure',
                    val: mission.launchDate,
                    sub: launchEvent?.title || 'Launch phase documented',
                    color: 'text-white',
                    borderColor: 'hover:border-cyan-500/50',
                  },
                  {
                    label: 'Cruise Duration',
                    val: mission.missionDuration,
                    sub: 'Full mission duration including surface operations',
                    color: 'text-cyan-300',
                    borderColor: 'hover:border-cyan-400/50',
                  },
                  {
                    label: 'Arrival',
                    val: mission.arrivalDate,
                    sub: arrivalEvent?.title || 'Arrival phase documented',
                    color: 'text-white',
                    borderColor: 'hover:border-blue-500/50',
                  },
                  {
                    label: 'Destination',
                    val: mission.location.name,
                    sub: mission.location.coordinates,
                    color: 'text-amber-300 font-mono',
                    borderColor: 'hover:border-amber-500/50',
                  },
                ].map((metric, mIdx) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * mIdx + 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={`bg-[#030712] border border-slate-800 ${metric.borderColor} rounded-xl p-4 space-y-1 transition-all shadow-md`}
                  >
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                      {metric.label}
                    </span>
                    <p className={`text-sm font-bold font-mono ${metric.color}`}>
                      {metric.val}
                    </p>
                    <p className="text-xs text-slate-400">
                      {metric.sub}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-slate-900/60 border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-6 space-y-2"
              >
                <span className="text-xs font-mono text-blue-400 uppercase tracking-widest block">
                  Transit Record
                </span>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {launchEvent?.description || mission.description}
                </p>
              </motion.div>

              <ChapterEvaluationQuiz
                missionId={mission.id}
                missionTitle={mission.title}
                chapterIndex={1}
                chapterTitle={chapters[1].title}
                isChapterCompleted={effectiveCompletedChapters.includes(1)}
                onPassChapter={(score) => handlePassChapter(1, score)}
                onNextChapter={() => handleSelectChapter(2)}
              />
            </motion.section>
          )}

          {activeChapter === 2 && (
            <motion.section
              key="chapter-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <ChapterHeading
                number="03"
                title="Meet the Machine"
                subtitle="The engineering systems and payload hardware that made the mission possible."
                icon={Cpu}
              />

              <ChapterMediaPanel
                mission={mission}
                chapterIndex={2}
                heading={chapters[2].mediaTitle}
                description={chapters[2].mediaDescription}
                offset={1}
              />

              <ChapterImageStrip mission={mission} chapterIndex={2} count={2} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mission.hardwareComponents.map((component, cIdx) => {
                  const inspected = inspectedComponents.includes(component.id);

                  return (
                    <motion.article
                      key={component.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * cIdx + 0.1 }}
                      whileHover={{ y: -4, borderColor: 'rgba(6, 182, 212, 0.5)' }}
                      className="bg-[#030712] border border-slate-800 rounded-xl p-5 space-y-3 transition-colors shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Cpu className="w-3 h-3 text-cyan-400" />
                            {component.category}
                          </span>
                          <h3 className="font-['Rajdhani'] font-bold text-xl text-white uppercase mt-1">
                            {component.name}
                          </h3>
                        </div>

                        <motion.span
                          animate={inspected ? { scale: [1, 1.15, 1] } : {}}
                          className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider border ${
                            inspected
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {inspected ? '✓ Inspected' : 'Available'}
                        </motion.span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {component.whatIsThis}
                      </p>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {component.whyImportant}
                      </p>

                      <motion.button
                        whileHover={inspected ? {} : { scale: 1.03 }}
                        whileTap={inspected ? {} : { scale: 0.96 }}
                        type="button"
                        onClick={() => onInspectHardware(component.id)}
                        disabled={inspected}
                        className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                          inspected
                            ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-default'
                            : 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/70 hover:border-cyan-400'
                        }`}
                      >
                        {inspected ? 'Component Inspected' : 'Inspect Hardware (+XP)'}
                      </motion.button>
                    </motion.article>
                  );
                })}
              </div>

              <ChapterEvaluationQuiz
                missionId={mission.id}
                missionTitle={mission.title}
                chapterIndex={2}
                chapterTitle={chapters[2].title}
                isChapterCompleted={effectiveCompletedChapters.includes(2)}
                onPassChapter={(score) => handlePassChapter(2, score)}
                onNextChapter={() => handleSelectChapter(3)}
              />
            </motion.section>
          )}

          {activeChapter === 3 && (
            <motion.section
              key="chapter-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <ChapterHeading
                number="04"
                title="The Science"
                subtitle={mission.science.summary}
                icon={Microscope}
              />

              <ChapterMediaPanel
                mission={mission}
                chapterIndex={3}
                heading={chapters[3].mediaTitle}
                description={chapters[3].mediaDescription}
                offset={1}
              />

              <ChapterImageStrip mission={mission} chapterIndex={3} count={2} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mission.science.discoveries.map((discovery, dIdx) => (
                  <motion.article
                    key={discovery.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * dIdx + 0.1 }}
                    whileHover={{ y: -4, borderColor: 'rgba(6, 182, 212, 0.5)' }}
                    className="bg-[#030712] border border-slate-800 rounded-xl p-6 space-y-4 transition-all shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {discovery.category}
                      </span>

                      <span className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Discovery Verified
                      </span>
                    </div>

                    <h3 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase tracking-wide">
                      {discovery.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {discovery.explanation}
                    </p>

                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                        Why It Mattered
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {discovery.impact}
                      </p>
                    </div>
                  </motion.article>
                ))}
              </div>

              <ChapterEvaluationQuiz
                missionId={mission.id}
                missionTitle={mission.title}
                chapterIndex={3}
                chapterTitle={chapters[3].title}
                isChapterCompleted={effectiveCompletedChapters.includes(3)}
                onPassChapter={(score) => handlePassChapter(3, score)}
                onNextChapter={() => handleSelectChapter(4)}
              />
            </motion.section>
          )}

          {activeChapter === 4 && (
            <motion.section
              key="chapter-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <ChapterHeading
                number="05"
                title="The Environment"
                subtitle="The physical conditions and terrain encountered by the machine."
                icon={Globe2}
              />

              <ChapterMediaPanel
                mission={mission}
                chapterIndex={4}
                heading={chapters[4].mediaTitle}
                description={chapters[4].mediaDescription}
                offset={1}
              />

              <ChapterImageStrip mission={mission} chapterIndex={4} count={3} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Surface Type', val: mission.environment.surfaceType, mono: true, color: 'text-white' },
                  { label: 'Thermal Range', val: mission.environment.temperatureRange, mono: true, color: 'text-cyan-300 font-bold' },
                  { label: 'Atmospheric Pressure', val: mission.environment.atmospherePressure, mono: true, color: 'text-white' },
                  { label: 'Radiation Context', val: mission.environment.radiationContext, mono: false, color: 'text-slate-300' },
                  { label: 'Illumination', val: mission.environment.illumination, mono: false, color: 'text-slate-300' },
                  { label: 'Terrain Morphology', val: mission.environment.terrainNotes, mono: false, color: 'text-slate-300' },
                ].map((item, eIdx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * eIdx + 0.1 }}
                    whileHover={{ y: -3, borderColor: 'rgba(6, 182, 212, 0.4)' }}
                    className="bg-[#030712] border border-slate-800 p-4 rounded-xl space-y-1 transition-all shadow-md"
                  >
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                      {item.label}
                    </span>
                    <p className={`text-xs sm:text-sm ${item.color} ${item.mono ? 'font-mono' : 'leading-relaxed'}`}>
                      {item.val}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-black/50 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-5 space-y-2 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    Documented Location
                  </span>
                </div>
                <p className="text-sm text-white font-semibold">
                  {mission.location.name}
                </p>
                <p className="text-xs text-cyan-300 font-mono">
                  {mission.location.coordinates}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {mission.location.environmentContext}
                </p>
              </motion.div>

              <ChapterEvaluationQuiz
                missionId={mission.id}
                missionTitle={mission.title}
                chapterIndex={4}
                chapterTitle={chapters[4].title}
                isChapterCompleted={effectiveCompletedChapters.includes(4)}
                onPassChapter={(score) => handlePassChapter(4, score)}
                onNextChapter={() => handleSelectChapter(5)}
              />
            </motion.section>
          )}

          {activeChapter === 5 && (
            <motion.section
              key="chapter-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <ChapterHeading
                number="06"
                title="What Happened?"
                subtitle="The final condition, historical record, and final verified telemetry associated with the mission."
                icon={Radio}
              />

              <ChapterMediaPanel
                mission={mission}
                chapterIndex={5}
                heading={chapters[5].mediaTitle}
                description={chapters[5].mediaDescription}
                offset={1}
              />

              <ChapterImageStrip mission={mission} chapterIndex={5} count={2} />

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#030712] border border-amber-900/50 border-l-4 border-l-amber-500 rounded-xl p-6 space-y-3 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                      Why the Mission Ended
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                    {mission.finalStatus.explanation}
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ y: -3 }}
                    className="bg-[#030712] border border-slate-800 rounded-xl p-5 space-y-2 shadow-md"
                  >
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                      Current Resting Condition
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {mission.finalStatus.condition}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ y: -3 }}
                    className="bg-[#030712] border border-slate-800 rounded-xl p-5 space-y-2 shadow-md"
                  >
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                      What Remains on the Surface
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {mission.finalStatus.whatRemains}
                    </p>
                  </motion.div>
                </div>

                {mission.finalStatus.finalMessageOrTelemetry && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-black/60 border border-cyan-800/50 rounded-xl p-4 font-mono text-xs text-cyan-300 space-y-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  >
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>Final Historic Telemetry Record</span>
                    </div>
                    <p className="text-sm italic text-cyan-200">
                      “{mission.finalStatus.finalMessageOrTelemetry}”
                    </p>
                  </motion.div>
                )}
              </div>

              <ChapterEvaluationQuiz
                missionId={mission.id}
                missionTitle={mission.title}
                chapterIndex={5}
                chapterTitle={chapters[5].title}
                isChapterCompleted={effectiveCompletedChapters.includes(5)}
                onPassChapter={(score) => handlePassChapter(5, score)}
                onNextChapter={() => handleSelectChapter(6)}
              />
            </motion.section>
          )}

          {activeChapter === 6 && (
            <motion.section
              key="chapter-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[#070e22] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <ChapterHeading
                number="07"
                title="The Legacy"
                subtitle="Why the mission still matters to science, engineering, and future exploration."
                icon={History}
              />

              <ChapterMediaPanel
                mission={mission}
                chapterIndex={6}
                heading={chapters[6].mediaTitle}
                description={chapters[6].mediaDescription}
                offset={1}
              />

              <ChapterImageStrip mission={mission} chapterIndex={6} count={2} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Science Legacy', val: mission.legacy.science, color: 'text-cyan-400', border: 'border-l-cyan-500' },
                  { title: 'Engineering Legacy', val: mission.legacy.engineering, color: 'text-amber-400', border: 'border-l-amber-500' },
                  { title: 'Discoveries Legacy', val: mission.legacy.discoveries, color: 'text-emerald-400', border: 'border-l-emerald-500' },
                  { title: 'Future Missions', val: mission.legacy.futureMissions, color: 'text-sky-400', border: 'border-l-sky-500' },
                ].map((pillar, pIdx) => (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * pIdx + 0.1 }}
                    whileHover={{ y: -4, borderColor: 'rgba(6, 182, 212, 0.4)' }}
                    className={`bg-[#030712] border border-slate-800 ${pillar.border} border-l-4 rounded-xl p-6 space-y-2 shadow-lg transition-all`}
                  >
                    <span className={`text-xs font-mono font-bold ${pillar.color} uppercase tracking-wider block`}>
                      {pillar.title}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {pillar.val}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-black/50 border border-cyan-950 border-l-4 border-l-cyan-400 rounded-xl p-5 space-y-2 shadow-lg"
              >
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                  Resting Coordinates
                </span>
                <p className="text-sm text-white font-semibold">
                  {mission.finalStatus.locationName || mission.location.name}
                </p>
                <p className="text-xs text-cyan-300 font-mono">
                  {mission.finalStatus.coordinates || mission.location.coordinates}
                </p>
              </motion.div>

              <ChapterEvaluationQuiz
                missionId={mission.id}
                missionTitle={mission.title}
                chapterIndex={6}
                chapterTitle={chapters[6].title}
                isChapterCompleted={effectiveCompletedChapters.includes(6)}
                onPassChapter={(score) => handlePassChapter(6, score)}
                isFinalChapter={true}
                onCompleteMission={handleFinishMission}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <section className="bg-[#070e22] border border-cyan-900/40 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="font-['Rajdhani'] font-bold text-xl text-white uppercase tracking-wider">
            Did You Know?
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mission.didYouKnow.map((fact, fIdx) => {
            const isRevealed = discoveredFacts.includes(fact.id);

            return (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * fIdx }}
                whileHover={{ y: -3 }}
                className={`p-4 rounded-xl border transition-all ${
                  isRevealed
                    ? 'bg-cyan-950/30 border-cyan-500/40 text-slate-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-black/50 border-slate-800 text-slate-400'
                }`}
              >
                {isRevealed ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        Fact Discovered
                      </span>
                      <span className="text-emerald-400 font-bold">
                        +{fact.xp} XP Awarded
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {fact.fact}
                    </p>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono text-slate-400 uppercase block">
                        Classified Fact
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Unravel historic insight (+{fact.xp} XP)
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => onDiscoverFact(fact.id, fact.xp)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-mono uppercase cursor-pointer"
                    >
                      Reveal Fact
                    </motion.button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="mission-sources-section" className="bg-[#030712] border border-cyan-950/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-mono font-bold text-white uppercase tracking-widest">
                Official NASA / JPL Verified Sources
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                Primary documentation, scientific papers, and raw mission archives.
              </p>
            </div>
          </div>

          <NasaSourceBadge type="NASA/JPL" size="sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mission.sources.map((source, sourceIndex) => (
            <div
              key={`${source.url}-${sourceIndex}`}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                    {source.type}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>

                <h5 className="font-semibold text-white text-xs sm:text-sm font-sans line-clamp-2 group-hover:text-cyan-200 transition-colors">
                  {source.title}
                </h5>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  {source.url.includes('jpl.nasa.gov')
                    ? 'jpl.nasa.gov'
                    : source.url.includes('mars.nasa.gov')
                    ? 'mars.nasa.gov'
                    : source.url.includes('images.nasa.gov')
                    ? 'images.nasa.gov'
                    : source.url.includes('nssdc.gsfc.nasa.gov')
                    ? 'nssdc.gsfc.nasa.gov'
                    : source.url.includes('history.nasa.gov')
                    ? 'history.nasa.gov'
                    : source.url.includes('ntrs.nasa.gov')
                    ? 'ntrs.nasa.gov'
                    : 'nasa.gov'}
                </span>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-xs font-mono text-cyan-300 hover:text-cyan-200 uppercase tracking-wider transition-colors"
                >
                  <span>Open on NASA</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 uppercase cursor-pointer text-left"
        >
          ← Return to Missions
        </button>

        <button
          id="mission-complete-action-btn"
          type="button"
          onClick={handleFinishMission}
          className={`px-8 py-4 rounded-xl font-semibold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            isCompleted
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.35)]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>
            {isCompleted
              ? 'Mission Archive Explored'
              : 'Mark Mission Complete (+100 XP)'}
          </span>
        </button>
      </footer>

      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0b1329] border border-cyan-500/50 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase">
                Mission Accomplished
              </span>

              <h3 className="font-['Rajdhani'] font-bold text-3xl text-white uppercase">
                {mission.title}
              </h3>

              <p className="text-xs text-slate-300">
                You investigated the hardware, uncovered the science, and
                preserved the mission story.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-around font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">
                  Reward
                </span>
                <span className="text-base font-bold text-cyan-300">
                  +100 XP
                </span>
              </div>

              <div className="w-px h-8 bg-slate-800" />

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">
                  Badges
                </span>
                <span className="text-base font-bold text-amber-300">
                  Unlocked
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCompletionModal(false);
                onBack();
              }}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Return to Mission Catalog
            </button>
          </div>
        </div>
      )}
    </div>
  );
};