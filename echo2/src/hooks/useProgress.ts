import { useState, useEffect, useCallback } from 'react';
import { UserProgress } from '../types';
import { BADGES_DATA } from '../data/missions';
import { audioService } from '../services/audioService';

const STORAGE_KEY = 'echoes_of_exploration_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  level: 1, // 1: Moon, 2: Mars, 3: Deep Space
  completedMissions: [],
  unlockedMissions: ['apollo-11-lm', 'surveyor-3', 'lunar-roving-vehicle-15'],
  badges: [],
  factsDiscovered: [],
  hardwareInspected: [],
  chaptersCompleted: {},
  hasCompletedEarthToMoon: false,
};

export interface ToastNotification {
  id: string;
  title: string;
  subtitle?: string;
  xp?: number;
  badgeName?: string;
  icon?: string;
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse saved progress', e);
    }
    return DEFAULT_PROGRESS;
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage', e);
    }
  }, [progress]);

  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const awardXp = useCallback(
    (amount: number, reason: string) => {
      setProgress((prev) => {
        const newXp = prev.xp + amount;
        return { ...prev, xp: newXp };
      });
      audioService.playTelemetryPing();
      showToast({
        title: `+${amount} XP Earned`,
        subtitle: reason,
        xp: amount,
      });
    },
    [showToast]
  );

  const unlockBadge = useCallback(
    (badgeId: string) => {
      const badgeDef = BADGES_DATA.find((b) => b.id === badgeId);
      if (!badgeDef) return;

      setProgress((prev) => {
        if (prev.badges.includes(badgeId)) return prev;
        return {
          ...prev,
          badges: [...prev.badges, badgeId],
          xp: prev.xp + 50,
        };
      });

      audioService.playDiscoveryChime();
      showToast({
        title: 'Badge Unlocked!',
        subtitle: badgeDef.name,
        badgeName: badgeDef.name,
        xp: 50,
      });
    },
    [showToast]
  );

  const completeChapter = useCallback(
    (missionId: string, chapterIndex: number, score?: number) => {
      // Must score at least 5 out of 10 to unlock
      if (score !== undefined && score < 5) return false;

      let isNew = false;
      setProgress((prev) => {
        const currentChapters = prev.chaptersCompleted[missionId] || [];
        if (currentChapters.includes(chapterIndex)) return prev;

        isNew = true;
        const updatedChapters = [...currentChapters, chapterIndex].sort((a, b) => a - b);
        return {
          ...prev,
          xp: prev.xp + 20,
          chaptersCompleted: {
            ...prev.chaptersCompleted,
            [missionId]: updatedChapters,
          },
        };
      });

      if (isNew) {
        audioService.playTelemetryPing();
        showToast({
          title: `Chapter ${chapterIndex + 1} Cleared!`,
          subtitle:
            chapterIndex < 6
              ? `Score: ${score !== undefined ? `${score}/10` : 'Passed'} • Chapter ${chapterIndex + 2} Unlocked (+20 XP)`
              : `Score: ${score !== undefined ? `${score}/10` : 'Passed'} • All Chapters Completed (+20 XP)`,
          xp: 20,
        });
      }

      return true;
    },
    [showToast]
  );

  const inspectHardware = useCallback(
    (componentId: string) => {
      setProgress((prev) => {
        if (prev.hardwareInspected.includes(componentId)) return prev;
        const newInspected = [...prev.hardwareInspected, componentId];
        return {
          ...prev,
          hardwareInspected: newInspected,
        };
      });
      awardXp(25, 'Hardware Component Inspected');
    },
    [awardXp]
  );

  const discoverFact = useCallback(
    (factId: string, xpAmount: number = 15) => {
      setProgress((prev) => {
        if (prev.factsDiscovered.includes(factId)) return prev;
        return {
          ...prev,
          factsDiscovered: [...prev.factsDiscovered, factId],
        };
      });
      awardXp(xpAmount, 'Classified Fact Discovered');
    },
    [awardXp]
  );

  const completeMission = useCallback(
    (missionId: string) => {
      setProgress((prev) => {
        if (prev.completedMissions.includes(missionId)) return prev;

        const newCompleted = [...prev.completedMissions, missionId];
        let newLevel = prev.level;
        let newUnlocked = [...prev.unlockedMissions];

        // Progression unlocking - sequentially unlock next mission in catalog
        const MISSION_ORDER = [
          'apollo-11-lm',
          'surveyor-3',
          'lunar-roving-vehicle-15',
          'spirit-rover',
          'opportunity-rover',
          'insight-lander',
          'voyager-1',
          'pioneer-10',
        ];

        const currentIdx = MISSION_ORDER.indexOf(missionId);
        if (currentIdx !== -1 && currentIdx < MISSION_ORDER.length - 1) {
          const nextMission = MISSION_ORDER[currentIdx + 1];
          if (!newUnlocked.includes(nextMission)) {
            newUnlocked.push(nextMission);
          }
        }

        if (missionId === 'apollo-11-lm' || missionId === 'surveyor-3' || missionId === 'lunar-roving-vehicle-15') {
          // Unlock Mars
          if (newLevel < 2) newLevel = 2;
          if (!newUnlocked.includes('spirit-rover')) newUnlocked.push('spirit-rover');
        }

        if (missionId === 'spirit-rover' || missionId === 'opportunity-rover' || missionId === 'insight-lander') {
          // Unlock Deep Space
          if (newLevel < 3) newLevel = 3;
          if (!newUnlocked.includes('voyager-1')) newUnlocked.push('voyager-1');
        }

        return {
          ...prev,
          completedMissions: newCompleted,
          unlockedMissions: newUnlocked,
          level: newLevel,
          xp: prev.xp + 100,
        };
      });

      audioService.playDiscoveryChime();
      showToast({
        title: 'Mission Complete!',
        subtitle: '+100 XP & Next Mission Unlocked',
        xp: 100,
      });

      // Check badges
      if (missionId.startsWith('apollo') || missionId.startsWith('surveyor') || missionId.startsWith('lunar')) {
        unlockBadge('badge-lunar-pioneer');
      }
      if (missionId.includes('rover') || missionId.includes('insight')) {
        unlockBadge('badge-mars-explorer');
      }
      if (missionId.includes('voyager') || missionId.includes('pioneer')) {
        unlockBadge('badge-deep-space');
      }
    },
    [awardXp, unlockBadge, showToast]
  );

  const setEarthToMoonCompleted = useCallback(() => {
    setProgress((prev) => ({ ...prev, hasCompletedEarthToMoon: true }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    showToast({
      title: 'Progress Reset',
      subtitle: 'Exploration archive returned to baseline status.',
    });
  }, [showToast]);

  const unlockAllForDemo = useCallback(() => {
    setProgress({
      xp: 1250,
      level: 3,
      completedMissions: ['apollo-11-lm', 'surveyor-3', 'lunar-roving-vehicle-15', 'spirit-rover'],
      unlockedMissions: [
        'apollo-11-lm',
        'surveyor-3',
        'lunar-roving-vehicle-15',
        'spirit-rover',
        'opportunity-rover',
        'insight-lander',
        'voyager-1',
        'pioneer-10',
      ],
      badges: BADGES_DATA.map((b) => b.id),
      factsDiscovered: ['dyk-ap11-1', 'dyk-ap11-2', 'dyk-surv-1', 'dyk-spr-1', 'dyk-opp-1', 'dyk-ins-1', 'dyk-voy-1'],
      hardwareInspected: ['lm-engine', 'lm-legs', 'lm-plaque', 'pancam-mast', 'idd-arm', 'voy-golden-record'],
      chaptersCompleted: {
        'apollo-11-lm': [0, 1, 2, 3, 4, 5, 6],
        'spirit-rover': [0, 1, 2, 3, 4, 5, 6],
      },
      hasCompletedEarthToMoon: true,
    });
    audioService.playDiscoveryChime();
    showToast({
      title: 'Demo Mode Activated',
      subtitle: 'All destinations, hardware archives, and badges unlocked for evaluation.',
      xp: 1250,
    });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute LevelInfo
  const currentLevel = progress.level;
  const levelTitles = ['Cadet Surveyor', 'Lunar Pioneer', 'Martian Navigator', 'Deep Space Archivist'];
  const levelDescriptions = [
    'Begin your archival expedition on Earth and the Moon.',
    'Lunar surface unlocked. Preserving Apollo and Surveyor descent relics.',
    'Martian sands unlocked. Investigating robotic rovers and seismometers.',
    'Interstellar frontier unlocked. Tracking probes sailing beyond the heliosphere.',
  ];

  const minXp = (currentLevel - 1) * 300;
  const maxXp = currentLevel * 300;
  const xpInCurrentLevel = Math.max(0, progress.xp - minXp);
  const xpNeededForNext = Math.max(0, maxXp - progress.xp);
  const progressPct = Math.min(100, Math.round((xpInCurrentLevel / 300) * 100));

  const currentLevelInfo = {
    level: currentLevel,
    title: levelTitles[currentLevel - 1] || 'Deep Space Archivist',
    description: levelDescriptions[currentLevel - 1] || levelDescriptions[3],
    minXp,
    maxXp,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPct,
  };

  const populatedBadges = BADGES_DATA.map((b) => ({
    ...b,
    title: b.name,
    unlocked: progress.badges.includes(b.id),
  }));

  return {
    progress: {
      ...progress,
      badges: progress.badges,
    },
    currentLevelInfo,
    populatedBadges,
    toasts,
    removeToast,
    addXp: awardXp,
    awardXp,
    unlockBadge,
    inspectHardware,
    discoverFact,
    completeChapter,
    completeMission,
    setEarthToMoonCompleted,
    resetProgress,
    unlockAllForDemo,
  };
}
