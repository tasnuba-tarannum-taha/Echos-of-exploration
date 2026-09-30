import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  Compass,
  X,
  Radio,
  Zap,
  RotateCcw,
  CheckCircle2,
  Orbit,
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { echoMemory, EchoMemoryData } from '../services/echoMemory';
import { voiceAssistant, VoiceCommandAction, VoiceState } from '../services/voiceAssistant';
import { queryEcho } from '../services/echoService';
import { EchoContext } from '../types';
import { EchoVoicePermissionModal } from './EchoVoicePermissionModal';
import { Echo3DCompanion } from './Echo3DCompanion';

export type EchoEmotion = 'happy' | 'curious' | 'thinking' | 'excited' | 'sleepy' | 'celebrating';

interface EchoBotProps {
  activeTab: string;
  isChatOpen: boolean;
  onOpenChat?: (prompt?: string) => void;
  onToggleChat?: () => void;
  onNavigate?: (tab: string, param?: string) => void;
  onAddXp?: (amount: number, reason: string) => void;
  selectedMissionTitle?: string;
  isChatLoading?: boolean;
  completedMissionsCount?: number;
  factsDiscoveredCount?: number;
  isVoiceMode?: boolean;
  onModeChange?: (mode: 'voice' | 'chat') => void;
}

export const EchoBot: React.FC<EchoBotProps> = ({
  activeTab,
  isChatOpen,
  onOpenChat,
  onToggleChat,
  onNavigate,
  onAddXp,
  selectedMissionTitle,
  isChatLoading = false,
  completedMissionsCount = 0,
  factsDiscoveredCount = 0,
  isVoiceMode = false,
  onModeChange,
}) => {
  // Mode Selection: Voice Mode vs Chat Mode (only one can be active at a time)
  const [mode, setMode] = useState<'voice' | 'chat'>(isVoiceMode ? 'voice' : 'chat');

  // Mascot Emotion & Body Language
  const [emotion, setEmotion] = useState<EchoEmotion>('happy');
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [isWaving, setIsWaving] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Position & Draggable
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const mem = echoMemory.get();
    return mem.position || { x: 0, y: 0 };
  });

  // Tooltip & Telemetry State
  const [tooltipDismissed, setTooltipDismissed] = useState<boolean>(false);
  const [tooltipMessageIndex, setTooltipMessageIndex] = useState<number>(0);
  const [sectorAlert, setSectorAlert] = useState<string | null>(null);
  const [welcomeGreeting, setWelcomeGreeting] = useState<string>('');

  // Voice State
  const [voicePermissionModalOpen, setVoicePermissionModalOpen] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceSubtitle, setVoiceSubtitle] = useState<string | null>(null);

  // Autonomous Navigation Warp Sequence State
  const [isNavigatingWarp, setIsNavigatingWarp] = useState<boolean>(false);
  const [warpTargetCoords, setWarpTargetCoords] = useState<{ x: number; y: number } | null>(null);
  const [portalActive, setPortalActive] = useState<boolean>(false);
  const [isEnteringPage, setIsEnteringPage] = useState<boolean>(false);
  const [isHologramActive, setIsHologramActive] = useState<boolean>(false);

  // Cursor Tracking for Micro-Interactions
  const [cursorOffset, setCursorOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inactivity Timer for Sleep Mode
  const lastInteractionRef = useRef<number>(Date.now());
  const dragRef = useRef<HTMLDivElement>(null);
  const prevTabRef = useRef<string>(activeTab);
  const prevCompletedCountRef = useRef<number>(completedMissionsCount);
  const prevFactsCountRef = useRef<number>(factsDiscoveredCount);

  // Rotating Tooltip Messages
  const tooltipMessages =
    activeTab === 'mission-detail'
      ? [
          `Analyzing ${selectedMissionTitle || 'mission'} telemetry! 🛰️`,
          'Check the animated AI Specialist panel above for chapter briefs!',
          'Ask me about what remains on the surface or why it ended!',
          'Click "Listen to AI Brief" to hear me speak this chapter!',
        ]
      : [
          welcomeGreeting || 'Hi Explorer 👋',
          'I know every forgotten rover on Moon & Mars!',
          'Say: "Hey Echo, take me to Moon Mission"!',
          'Double-click me to return to base dock!',
          'Switch between 🎙 Voice Mode and 💬 Chat Mode anytime!',
        ];

  // Initialize Memory & Welcome
  useEffect(() => {
    const greeting = echoMemory.getWelcomeGreeting();
    setWelcomeGreeting(greeting);

    // Check voice permission preference
    const mem = echoMemory.get();
    if (!mem.voicePermission) {
      // First launch: show voice permission prompt after 2.5s
      const promptTimer = setTimeout(() => {
        setVoicePermissionModalOpen(true);
      }, 2500);
      return () => clearTimeout(promptTimer);
    } else if (mem.voicePermission === 'granted' && isVoiceMode) {
      voiceAssistant.enableVoiceMode();
    }
  }, []);

  // Synchronize Mode change with parent
  useEffect(() => {
    if (isVoiceMode && mode !== 'voice') {
      setMode('voice');
    } else if (!isVoiceMode && mode !== 'chat') {
      setMode('chat');
    }
  }, [isVoiceMode]);

  // Voice State synchronization
  useEffect(() => {
    const unsubscribeState = voiceAssistant.onStateChange((state) => {
      setVoiceState(state);
      if (state === 'listening') {
        setEmotion('curious');
      } else if (state === 'processing') {
        setEmotion('thinking');
      } else if (state === 'speaking') {
        setEmotion('happy');
      } else if (state === 'idle') {
        setEmotion('happy');
      }
    });

    const unsubscribeTranscript = voiceAssistant.onTranscript((text, isFinal) => {
      setVoiceSubtitle(text);
      if (isFinal) {
        setTimeout(() => setVoiceSubtitle(null), 4000);
      }
    });

    return () => {
      unsubscribeState();
      unsubscribeTranscript();
    };
  }, []);

  // Periodic Eye Blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (emotion !== 'sleepy') {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 180);
      }
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, [emotion]);

  // Periodic Natural Wave / Idle Tricks
  useEffect(() => {
    const idleTricks = setInterval(() => {
      if (emotion === 'sleepy' || isDragging || isNavigatingWarp) return;

      const roll = Math.random();
      if (roll < 0.45) {
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 1200);
      } else if (roll < 0.65) {
        setIsFlipping(true);
        audioService.playRobotChirp('happy');
        setTimeout(() => setIsFlipping(false), 850);
      }
    }, 15000);

    return () => clearInterval(idleTricks);
  }, [emotion, isDragging, isNavigatingWarp]);

  // Tooltip Rotation Interval
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setTooltipMessageIndex((prev) => (prev + 1) % tooltipMessages.length);
    }, 7000);
    return () => clearInterval(messageInterval);
  }, [tooltipMessages.length]);

  // Mouse Move & Inactivity Tracking
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      lastInteractionRef.current = Date.now();
      if (emotion === 'sleepy') {
        setEmotion('happy');
        audioService.playRobotChirp('wake');
      }

      const botEl = dragRef.current;
      if (botEl) {
        const rect = botEl.getBoundingClientRect();
        const botCenterX = rect.left + rect.width / 2;
        const botCenterY = rect.top + rect.height / 2;
        const dx = (e.clientX - botCenterX) / window.innerWidth;
        const dy = (e.clientY - botCenterY) / window.innerHeight;
        setCursorOffset({
          x: Math.max(-6, Math.min(6, dx * 12)),
          y: Math.max(-5, Math.min(5, dy * 10)),
        });
      }
    };

    const handlePointerDown = () => {
      lastInteractionRef.current = Date.now();
      if (emotion === 'sleepy') {
        setEmotion('happy');
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handlePointerDown);

    const inactivityCheck = setInterval(() => {
      const idleTime = Date.now() - lastInteractionRef.current;
      if (idleTime > 45000 && emotion !== 'sleepy' && !isChatOpen && !isNavigatingWarp) {
        setEmotion('sleepy');
      }
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      clearInterval(inactivityCheck);
    };
  }, [emotion, isChatOpen, isNavigatingWarp]);

  // Page-specific reaction animations
  useEffect(() => {
    if (activeTab !== prevTabRef.current) {
      prevTabRef.current = activeTab;
      setTooltipDismissed(false);
      setSectorAlert(`Entered ${activeTab.toUpperCase()} Sector`);
      const timer = setTimeout(() => setSectorAlert(null), 3200);

      // Page animations:
      // Home: Orbit title flyby
      // Atlas: Curious inspection
      // Mission: Project hologram
      // Timeline / Badges: Celebrate
      if (activeTab === 'explore') {
        setEmotion('happy');
      } else if (activeTab === 'atlas') {
        setEmotion('curious');
      } else if (activeTab === 'mission-detail') {
        setEmotion('curious');
        setIsHologramActive(true);
        setTimeout(() => setIsHologramActive(false), 4000);
      } else if (activeTab === 'badges') {
        setEmotion('celebrating');
        setIsSpinning(true);
        audioService.playCelebrationCheer();
        setTimeout(() => {
          setIsSpinning(false);
          setEmotion('happy');
        }, 2200);
      }

      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // React to Mission Completed
  useEffect(() => {
    if (completedMissionsCount > prevCompletedCountRef.current) {
      prevCompletedCountRef.current = completedMissionsCount;
      setEmotion('celebrating');
      setIsSpinning(true);
      audioService.playCelebrationCheer();
      setTimeout(() => {
        setIsSpinning(false);
        setEmotion('happy');
      }, 2500);
    }
  }, [completedMissionsCount]);

  // React to Facts Discovered
  useEffect(() => {
    if (factsDiscoveredCount > prevFactsCountRef.current) {
      prevFactsCountRef.current = factsDiscoveredCount;
      setEmotion('excited');
      audioService.playDiscoveryChime();
      setTimeout(() => {
        setEmotion('happy');
      }, 2000);
    }
  }, [factsDiscoveredCount]);

  // Sync with Chat loading
  useEffect(() => {
    if (isChatLoading) {
      setEmotion('thinking');
    } else if (isChatOpen) {
      setEmotion('happy');
    }
  }, [isChatLoading, isChatOpen]);

  /**
   * Autonomous Navigation Sequence
   * 1. Echo says: "Opening Moon Mission."
   * 2. Echo flies to the Moon navigation button.
   * 3. Makes the button glow.
   * 4. Triggers the route automatically.
   * 5. Enters the new page with a landing animation.
   * 6. Waves after landing.
   * User does not click anything!
   */
  const executeAutonomousNavigation = useCallback(
    async (targetTab: string, speechText: string, param?: string) => {
      if (isNavigatingWarp) return;
      setIsNavigatingWarp(true);
      setEmotion('excited');
      setVoiceSubtitle(speechText);

      // Step 1: Echo voice announcement
      audioService.playRobotChirp('happy');
      voiceAssistant.speak(speechText);

      // Step 2: Locate target DOM button coordinates
      let targetEl: HTMLElement | null = null;

      if (param === 'Moon') {
        targetEl = document.getElementById('dest-explore-btn-moon') || document.getElementById('nav-link-missions');
      } else if (param === 'Mars') {
        targetEl = document.getElementById('dest-explore-btn-mars') || document.getElementById('nav-link-missions');
      } else if (targetTab === 'mission-detail') {
        targetEl = document.getElementById('nav-link-missions') || document.getElementById('nav-brand-logo');
      } else {
        const targetNavId = targetTab === 'badges' ? 'nav-progress-btn' : `nav-link-${targetTab}`;
        targetEl = document.getElementById(targetNavId) || document.getElementById('nav-brand-logo');
      }

      let targetX = 0;
      let targetY = -420;

      if (targetEl && dragRef.current) {
        const botRect = dragRef.current.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        targetX = targetRect.left + targetRect.width / 2 - (botRect.left + botRect.width / 2);
        targetY = targetRect.top + targetRect.height / 2 - (botRect.top + botRect.height / 2);
      }

      setWarpTargetCoords({ x: targetX, y: targetY });

      // Step 3: Button glows with luminous portal
      setTimeout(() => {
        setPortalActive(true);
        if (targetEl) {
          targetEl.classList.add('ring-4', 'ring-cyan-400', 'shadow-[0_0_40px_#06b6d4]', 'scale-105', 'transition-all');
        }
        audioService.playWarpSwoosh();
      }, 550);

      // Step 4: Disappear into portal & trigger route automatically!
      setTimeout(() => {
        if (targetEl) {
          targetEl.classList.remove('ring-4', 'ring-cyan-400', 'shadow-[0_0_40px_#06b6d4]', 'scale-105', 'transition-all');
        }
        setPortalActive(false);

        if (onNavigate) {
          onNavigate(targetTab, param);
        }

        // Step 5: Reset coordinates to enter new page from above with landing thruster
        setPosition({ x: 0, y: -260 });
        setIsEnteringPage(true);
        setIsNavigatingWarp(false);
        setWarpTargetCoords(null);

        // Step 6: Touchdown smoothly into base dock and wave!
        setTimeout(() => {
          setPosition({ x: 0, y: 0 });
          echoMemory.clearPosition();
          setIsEnteringPage(false);
          setIsWaving(true);
          audioService.playRobotChirp('happy');
          setTimeout(() => setIsWaving(false), 1500);
        }, 350);
      }, 1250);
    },
    [isNavigatingWarp, onNavigate]
  );

  /**
   * Handles parsed voice commands
   */
  const handleVoiceCommand = useCallback(
    async (action: VoiceCommandAction) => {
      if (action.type === 'navigate' && action.targetTab) {
        const speech = action.speechText || `Opening ${action.targetTab}.`;
        executeAutonomousNavigation(action.targetTab, speech, action.catalogFilter || action.missionId);
      } else if (action.type === 'stop') {
        setEmotion('happy');
        setVoiceSubtitle(action.speechText || 'Standing by.');
        voiceAssistant.speak(action.speechText || 'Standing by.');
      } else if (action.type === 'ask' && action.query) {
        setEmotion('thinking');
        setVoiceSubtitle(`Consulting NASA Archives: "${action.query}"`);
        audioService.playRobotChirp('curious');

        const echoContext: EchoContext = {
          pageType: (activeTab as any) || 'explore',
          location: selectedMissionTitle,
        };

        const res = await queryEcho(action.query, echoContext);
        if (res.success && res.data?.simple) {
          setVoiceSubtitle(res.data.simple);
          setEmotion('happy');
          voiceAssistant.speak(res.data.simple);
        } else {
          const fallback = 'I searched deep space archives. Try asking about Apollo 11, Perseverance, or the Moon map!';
          setVoiceSubtitle(fallback);
          voiceAssistant.speak(fallback);
        }
      }
    },
    [activeTab, executeAutonomousNavigation, selectedMissionTitle]
  );

  // Keep the voice service pointed at the LATEST handler. (It used to be registered once
  // on mount, so voice commands ran with stale page/mission context.)
  useEffect(() => {
    voiceAssistant.setCommandHandler(handleVoiceCommand);
  }, [handleVoiceCommand]);

  // Permission Modal Handlers
  const handleAllowVoice = async () => {
    setVoicePermissionModalOpen(false);
    echoMemory.set({ voicePermission: 'granted' });
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      // continues
    }
    voiceAssistant.enableVoiceMode();
    setMode('voice');
    onModeChange?.('voice');
    audioService.playRobotChirp('happy');
    voiceAssistant.speak('Voice Mode initialized! I am listening continuously. Say "Hey Echo, take me to Moon Mission".');
  };

  const handleDenyVoice = () => {
    setVoicePermissionModalOpen(false);
    echoMemory.set({ voicePermission: 'denied' });
    voiceAssistant.disableVoiceMode();
    setMode('chat');
    onModeChange?.('chat');
  };

  /**
   * Segmented Toggle Handlers:
   * Only one mode can be active.
   * Voice OFF automatically enables Chat.
   * Voice ON hides text chat input.
   */
  const handleSelectMode = (newMode: 'voice' | 'chat') => {
    if (newMode === 'voice') {
      if (mode === 'voice') {
        // Toggle OFF if already in voice mode
        voiceAssistant.disableVoiceMode();
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setMode('chat');
        onModeChange?.('chat');
        return;
      }
      const mem = echoMemory.get();
      if (mem.voicePermission !== 'granted') {
        setVoicePermissionModalOpen(true);
      } else {
        voiceAssistant.enableVoiceMode();
        setMode('voice');
        onModeChange?.('voice');
      }
    } else {
      voiceAssistant.disableVoiceMode();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setMode('chat');
      onModeChange?.('chat');
      // In Chat mode, open chat window if not already open
      if (!isChatOpen && onOpenChat) {
        onOpenChat();
      }
    }
  };

  const handleBotClick = () => {
    if (emotion === 'sleepy') {
      setEmotion('happy');
      audioService.playRobotChirp('wake');
      return;
    }
    audioService.playTelemetryPing();
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 650);

    if (mode === 'chat') {
      if (onToggleChat) {
        onToggleChat();
      } else if (onOpenChat) {
        onOpenChat();
      }
    } else {
      // In Voice mode, trigger quick voice interaction prompt
      voiceAssistant.speak('Echo standing by! Where shall we fly today? Moon, Mars, or Hardware Atlas?');
    }
  };

  // Double click resets to base dock
  const handleDoubleClick = () => {
    setPosition({ x: 0, y: 0 });
    echoMemory.clearPosition();
    audioService.playRobotChirp('happy');
    setIsFlipping(true);
    setTimeout(() => setIsFlipping(false), 800);
  };

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    const newX = position.x + info.offset.x;
    const newY = position.y + info.offset.y;
    setPosition({ x: newX, y: newY });
    echoMemory.savePosition(newX, newY);
  };

  return (
    <>
      {/* Voice Permission Glass Modal */}
      <EchoVoicePermissionModal
        isOpen={voicePermissionModalOpen}
        onAllow={handleAllowVoice}
        onDeny={handleDenyVoice}
      />

      {/* Persistent Floating Mascot Anchor Container */}
      <motion.div
        ref={dragRef}
        id="echo-persistent-mascot-container"
        drag
        dragMomentum={false}
        dragElastic={0.12}
        onDragStart={() => {
          setIsDragging(true);
          setEmotion('curious');
        }}
        onDragEnd={handleDragEnd}
        animate={{
          x: warpTargetCoords ? warpTargetCoords.x : position.x,
          y: warpTargetCoords ? warpTargetCoords.y : position.y,
          scale: isNavigatingWarp ? 0.2 : 1,
          opacity: isNavigatingWarp ? 0.25 : 1,
        }}
        transition={{
          type: 'spring',
          damping: isNavigatingWarp ? 16 : 24,
          stiffness: isNavigatingWarp ? 170 : 250,
        }}
        onDoubleClick={handleDoubleClick}
        className="fixed bottom-7 right-7 z-40 flex flex-col items-end pointer-events-none select-none touch-none"
      >
        {/* Real-time Voice / Telemetry Subtitle Capsule */}
        <AnimatePresence>
          {voiceSubtitle && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="pointer-events-auto mb-3 max-w-[280px] sm:max-w-[340px] px-4 py-2.5 rounded-2xl bg-[#030712]/95 border border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.45)] backdrop-blur-xl text-left"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-mono text-[9px] font-bold text-cyan-300 uppercase tracking-widest">
                    {voiceState === 'listening'
                      ? '🎙 LISTENING TO VOICE'
                      : voiceState === 'processing'
                      ? '⚡ ANALYZING COMMAND'
                      : 'ECHO VOICE TRANSMISSION'}
                  </span>
                </div>
                <button
                  onClick={() => voiceAssistant.replayLastSpeech()}
                  title="Replay Audio"
                  className="text-cyan-300 hover:text-cyan-100 p-1 rounded transition-colors text-[10px] font-mono flex items-center gap-1 bg-cyan-950/60 border border-cyan-500/40 px-1.5 py-0.5 cursor-pointer"
                >
                  🔊 Replay
                </button>
              </div>
              <p className="font-mono text-xs text-cyan-100 italic leading-relaxed">
                "{voiceSubtitle}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sector Navigation Alert Pill */}
        <AnimatePresence>
          {sectorAlert && !voiceSubtitle && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="mb-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 font-mono text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)] backdrop-blur-md"
            >
              {sectorAlert}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Segmented Mode Toggle (🎙 Voice Mode | 💬 Chat Mode) */}
        <div className="pointer-events-auto mb-2 flex items-center gap-1.5 p-1 rounded-2xl bg-[#070e22]/95 border border-cyan-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-xl">
          <button
            id="echo-mode-voice-toggle"
            onClick={() => handleSelectMode('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              mode === 'voice'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
            title="Continuous voice mode: say 'Hey Echo, take me to Moon Mission'"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>🎙 Voice</span>
          </button>
          <button
            id="echo-mode-chat-toggle"
            onClick={() => handleSelectMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
              mode === 'chat'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
            title="Chat mode: type messages in chat input"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>💬 Chat</span>
          </button>
        </div>

        {/* Live Microphone Status Pill (When Voice Mode is ON) */}
        {mode === 'voice' && (
          <div className="pointer-events-auto mb-2 px-3 py-1 rounded-full bg-[#030714]/90 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                voiceState === 'listening'
                  ? 'bg-cyan-400 animate-ping'
                  : voiceState === 'processing'
                  ? 'bg-amber-400 animate-pulse'
                  : voiceState === 'speaking'
                  ? 'bg-emerald-400 animate-bounce'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300">
              {voiceState === 'listening'
                ? '🎙 LISTENING'
                : voiceState === 'processing'
                ? '⚡ PROCESSING'
                : voiceState === 'speaking'
                ? '🌊 SPEAKING'
                : '💤 IDLE'}
            </span>
          </div>
        )}

        {/* Speech Tooltip Balloon */}
        <AnimatePresence>
          {!isChatOpen && !tooltipDismissed && !voiceSubtitle && !isDragging && !isNavigatingWarp && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto mb-3 max-w-[270px] sm:max-w-[310px] bg-[#070e22]/95 border border-cyan-500/50 rounded-2xl p-4 shadow-[0_12px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-xl text-left relative"
            >
              {/* Dismiss Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltipDismissed(true);
                }}
                className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800/50 transition-colors cursor-pointer"
                title="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Header with Live Status */}
              <div className="flex items-center justify-between pr-5 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
                    ECHO • AI COMPANION
                  </span>
                </div>
              </div>

              {/* Rotating Message */}
              <p className="text-xs text-slate-200 leading-relaxed font-sans pr-2 min-h-[36px]">
                {tooltipMessages[tooltipMessageIndex]}
              </p>

              {/* Quick Actions */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleBotClick()}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{mode === 'voice' ? 'Talk' : 'Chat'}</span>
                </button>

                <button
                  onClick={() => {
                    executeAutonomousNavigation('missions', 'Opening Moon Mission.', 'Moon');
                  }}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Moon Mission</span>
                </button>

                <button
                  onClick={() => {
                    executeAutonomousNavigation('atlas', 'Opening Hardware Atlas.');
                  }}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span>Atlas</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Pixar-Quality Floating Robot Companion */}
        <div
          className="pointer-events-auto cursor-grab active:cursor-grabbing relative group"
          onClick={handleBotClick}
          onMouseEnter={() => {
            setIsHovered(true);
            if (emotion !== 'sleepy') setIsWaving(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsWaving(false);
          }}
        >
          {/* Blue circular pulse ring around Echo during Listening state */}
          {mode === 'voice' && voiceState === 'listening' && (
            <motion.div
              animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="absolute inset-0 -m-4 rounded-full border-2 border-cyan-400 shadow-[0_0_35px_#06b6d4] pointer-events-none"
            />
          )}

          {/* Celebratory Star Particles */}
          {emotion === 'celebrating' && (
            <div className="absolute -top-6 inset-x-0 flex justify-center gap-2 pointer-events-none z-10">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-cyan-300 animate-bounce" />
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          )}

          {/* Hologram Emitter Projection Beam for Mission detail page */}
          {(isHologramActive || activeTab === 'mission-detail') && (
            <div className="absolute -top-16 inset-x-0 flex flex-col items-center pointer-events-none">
              <motion.div
                animate={{ opacity: [0.35, 0.75, 0.35], scaleX: [0.92, 1.08, 0.92] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                className="w-24 h-16 bg-gradient-to-t from-cyan-500/40 via-cyan-400/20 to-transparent clip-path-[polygon(50%_100%,0%_0%,100%_0%)]"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                className="w-16 h-1 rounded-full bg-cyan-300 blur-[1px] shadow-[0_0_12px_#22d3ee] -mt-1"
              />
            </div>
          )}

          {/* Active Mission Orbital Scan Ring */}
          {activeTab === 'mission-detail' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
              className="absolute inset-0 -m-3 rounded-full border border-dashed border-cyan-400/40 pointer-events-none"
            />
          )}

          {/* Three.js 3D Character Canvas */}
          <Echo3DCompanion
            emotion={emotion}
            voiceState={voiceState}
            isWaving={isWaving}
            isFlipping={isFlipping}
            isBlinking={isBlinking}
            isHovered={isHovered}
            cursorOffset={cursorOffset}
          />
        </div>
      </motion.div>
    </>
  );
};