import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Radio,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Minimize2,
  Maximize2,
  HelpCircle,
} from 'lucide-react';
import { EchoContext, EchoMessage } from '../types';
import { checkEchoStatus, queryEcho } from '../services/echoService';
import { audioService } from '../services/audioService';
import { VoiceState } from '../services/voiceAssistant';
import { Echo3DCompanion } from './Echo3DCompanion';

interface EchoChatProps {
  isOpen: boolean;
  onToggle: () => void;
  context: EchoContext;
  onNavigateTab?: (tab: string, param?: string) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  hideFloatingButton?: boolean;
  onTypingChange?: (isTyping: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  isVoiceMode?: boolean;
  voiceStatus?: VoiceState;
}

export const EchoChat: React.FC<EchoChatProps> = ({
  isOpen,
  onToggle,
  context,
  onNavigateTab,
  initialPrompt,
  onClearInitialPrompt,
  hideFloatingButton = false,
  onTypingChange,
  onLoadingChange,
  isVoiceMode = false,
  voiceStatus = 'idle',
}) => {
  const [messages, setMessages] = useState<EchoMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Hi! I’m Echo, your AI companion and guide for Echoes of Exploration. Ask me anything—whether about science, history, coding, everyday questions, or the spacecraft, live NASA feeds, and secrets of this site.',
      simpleExplanation:
        'Hi! I’m Echo, your AI companion and guide for Echoes of Exploration. Ask me anything—whether about science, history, coding, everyday questions, or the spacecraft, live NASA feeds, and secrets of this site.',
      quickActions: ['Tell me about Apollo 11', 'What is Python?', 'How do I unlock Mars?', 'Launch Guided Tour'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [statusChecked, setStatusChecked] = useState<boolean>(false);
  const [expandedDeepIds, setExpandedDeepIds] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Check backend Gemini status on mount
  useEffect(() => {
    checkEchoStatus().then((res) => {
      setIsOnline(res.online);
      setStatusChecked(true);
    });
  }, []);

  // Handle external prompt trigger (e.g. from Tour button "Ask Echo about this step")
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const toggleDeep = (msgId: string) => {
    audioService.playTelemetryPing();
    setExpandedDeepIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    audioService.playTelemetryPing();

    const userMessage: EchoMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) {
      setInputValue('');
      if (onTypingChange) onTypingChange(false);
    }
    setIsLoading(true);
    if (onLoadingChange) onLoadingChange(true);

    try {
      const response = await queryEcho(text, context, messages);
      const data = response.data;

      const assistantMessage: EchoMessage = {
        id: `echo-${Date.now()}`,
        role: 'assistant',
        content: data.simple || 'Information retrieved.',
        simpleExplanation: data.simple,
        deepExplanation: data.deep,
        source: data.source,
        sourceUrl: data.sourceUrl,
        quickActions: data.quickActions,
        navigationAction: data.navigationAction,
        isOfflineNotice: response.isOfflineNotice,
        isError: response.isTemporaryError,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.online !== undefined) {
        setIsOnline(response.online);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `echo-err-${Date.now()}`,
          role: 'assistant',
          content: 'Echo is temporarily unavailable. You can continue exploring the museum exhibits uninterrupted.',
          simpleExplanation: 'Echo is temporarily unavailable. You can continue exploring the museum exhibits uninterrupted.',
          source: 'Echoes of Exploration Museum Telemetry',
          sourceUrl: 'https://images.nasa.gov',
          quickActions: ['Continue Exploring', 'View Missions', 'Open NEO Radar'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  const handleQuickAction = (actionText: string) => {
    handleSendMessage(actionText);
  };

  const handleExecuteNav = (navAction?: EchoMessage['navigationAction']) => {
    if (!navAction || !onNavigateTab) return;
    audioService.playTelemetryPing();
    onNavigateTab(navAction.targetTab, navAction.param);
  };

  // Generate context hint title
  const contextDescription = (() => {
    if (context.tourActive) {
      return `TOUR MODE • STEP ${context.tourStep || 1}`;
    }
    if (context.mission) {
      return `${context.mission.title} (${context.mission.destination})`;
    }
    if (context.selectedNEO) {
      return `NEO RADAR • ${context.selectedNEO.name}`;
    }
    if (context.selectedNASAImage) {
      const title = context.selectedNASAImage.title || 'ARCHIVE PHOTO';
      return `NASA PHOTO • ${title.slice(0, 24)}...`;
    }
    if (context.pageType === 'nasa-feeds') {
      return 'LIVE OBSERVATORY & NEO RADAR';
    }
    if (context.pageType === 'atlas') {
      return 'PLANETARY HARDWARE ATLAS';
    }
    if (context.pageType === 'journey') {
      return 'ASTRONAUT TRANSLUNAR JOURNEY';
    }
    if (context.pageType === 'badges') {
      return 'EXPLORER RANK & XP TELEMETRY';
    }
    return 'SURFACE EXPLORATION ARCHIVE';
  })();

  // Current suggested questions based on context
  const contextDefaultPills = (() => {
    if (context.tourActive) {
      return [
        'What do I do on this step?',
        'What does this exhibit show?',
        'How do I exit the tour?',
      ];
    }
    if (context.selectedNEO) {
      return [
        'Why does NASA track NEOs?',
        'What does potentially hazardous mean?',
        'How close will this asteroid get?',
      ];
    }
    if (context.mission) {
      return [
        'What did this machine discover?',
        'What happened to it?',
        'How do I inspect the hardware?',
        'What is a Sol?',
      ];
    }
    if (context.pageType === 'atlas') {
      return [
        'How many relics are on the Moon?',
        'Where is Curiosity located on Mars?',
        'Show me abandoned lunar rovers',
      ];
    }
    if (context.pageType === 'journey') {
      return [
        'How long does translunar transit take?',
        'What is Earth-Moon orbital injection?',
        'Tell me about Apollo translunar flight',
      ];
    }
    if (context.pageType === 'badges') {
      return [
        'How do I unlock Mars?',
        'How do I earn XP?',
        'What are the explorer ranks?',
      ];
    }
    return [
      'Tell me about Apollo 11',
      'What is Python?',
      'How do I unlock Mars?',
      'Launch Guided Tour',
    ];
  })();

  return (
    <>
      {/* Floating "ASK ECHO" Trigger Button (Bottom Right) */}
      {!isOpen && !hideFloatingButton && (
        <button
          id="echo-floating-btn"
          onClick={() => {
            audioService.playTelemetryPing();
            onToggle();
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#070e22] via-[#0b1a3d] to-[#04162e] hover:from-cyan-950 hover:to-indigo-950 border border-cyan-500/60 hover:border-cyan-400 text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105 cursor-pointer group"
          title="Ask Echo — Gemini AI Space Guide"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping absolute" />
            <Sparkles className="w-5 h-5 text-cyan-300 relative z-10 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-['Rajdhani'] font-bold text-xs sm:text-sm tracking-wider uppercase text-cyan-200">
              ASK ECHO
            </span>
            <span className="text-[9px] font-mono text-cyan-400/80 -mt-0.5 tracking-tight uppercase hidden sm:inline">
              AI Space Guide
            </span>
          </div>
        </button>
      )}

      {/* Echo Chat Drawer / Modal */}
      {isOpen && (
        <div
          id="echo-chat-panel"
          className={`fixed z-50 flex flex-col bg-[#050b1d]/95 border border-cyan-500/50 rounded-2xl sm:rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-xl transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'inset-3 sm:inset-6'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[440px] h-[580px] max-h-[calc(100vh-80px)]'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:px-5 sm:py-3.5 bg-gradient-to-r from-[#030712] via-[#071330] to-[#030712] border-b border-cyan-950/90 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-['Rajdhani'] font-bold text-lg text-white uppercase tracking-wider leading-none">
                    ECHO
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    AI SPACE GUIDE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-400 uppercase">
                    {isOnline ? 'ONLINE • GEMINI' : 'MUSEUM ARCHIVES'}
                  </span>
                </div>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors hidden sm:inline-flex"
                title={isExpanded ? 'Restore window size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                id="echo-close-btn"
                onClick={() => {
                  audioService.playTelemetryPing();
                  onToggle();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
                title="Close Echo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Banner */}
          <div className="px-4 py-2 bg-[#020511] border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="text-cyan-400/90 font-semibold tracking-wider truncate">
              CONTEXT: {contextDescription}
            </span>
            <span className="text-slate-500 uppercase shrink-0">NASA VERIFIED</span>
          </div>

          {/* Offline Notice Badge (if Gemini API key missing) */}
          {statusChecked && !isOnline && (
            <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/50 flex items-center justify-between gap-2 text-[11px] font-mono text-amber-300">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>ECHO OFFLINE — Add Gemini API key to enable live AI guide.</span>
              </div>
              <button
                onClick={() => {
                  audioService.playTelemetryPing();
                  onToggle();
                }}
                className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800/80 text-[9px] font-bold text-amber-100 uppercase tracking-wider shrink-0 transition-colors"
              >
                CONTINUE EXPLORING
              </button>
            </div>
          )}

          {/* Chat Messages Body or Voice Mode Center Stage */}
          <AnimatePresence mode="wait">
            {isVoiceMode ? (
              <motion.div
                key="voice-mode-stage"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#050b1d] via-[#091538] to-[#030712] relative overflow-hidden"
              >
                {/* Glowing backdrop and pulse ring */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 rounded-full bg-cyan-500/15 animate-ping absolute" />
                  <div className="w-72 h-72 rounded-full bg-blue-500/10 animate-pulse absolute blur-xl" />
                </div>

                {/* Prominent Center Robot */}
                <div className="relative z-10 transform scale-125 mb-6">
                  <Echo3DCompanion
                    emotion="happy"
                    voiceState={voiceStatus}
                    isWaving={true}
                    isFlipping={false}
                    isBlinking={false}
                    isHovered={true}
                  />
                </div>

                {/* Listening Indicator / Status */}
                <div className="relative z-10 space-y-2 mt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-200 font-mono text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>Listening... Speak naturally</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    Say "Hey Echo, take me to Moon Mission" or ask any space question.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat-mode-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const isExpandedDeep = expandedDeepIds.includes(msg.id);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                      >
                        {/* Bubble */}
                        <div
                          className={`rounded-2xl p-4 max-w-[88%] leading-relaxed ${
                            isUser
                              ? 'bg-cyan-950 text-cyan-100 border border-cyan-500/40 shadow-sm'
                              : 'bg-[#08122c] text-slate-200 border border-slate-700/60 shadow-md space-y-3'
                          }`}
                        >
                          {/* User Text */}
                          {isUser ? (
                            <p className="text-xs sm:text-sm font-medium">{msg.content}</p>
                          ) : (
                            <>
                              {/* Main Response Text */}
                              <div className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                                {msg.simpleExplanation || msg.content}
                              </div>

                              {/* Optional "GO DEEPER" Accordion Section */}
                              {msg.deepExplanation && (
                                <div className="pt-2 border-t border-slate-800/80">
                                  <button
                                    onClick={() => toggleDeep(msg.id)}
                                    className="w-full flex items-center justify-between text-[11px] font-mono text-amber-300 hover:text-amber-200 font-semibold uppercase tracking-wider py-1 cursor-pointer transition-colors"
                                  >
                                    <span>GO DEEPER (SCIENTIFIC / TECHNICAL DETAIL)</span>
                                    {isExpandedDeep ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  {isExpandedDeep && (
                                    <div className="mt-2 p-3 rounded-xl bg-[#020511] border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in duration-200">
                                      {msg.deepExplanation}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* "DID YOU KNOW?" Educational Box */}
                              {msg.didYouKnow && (
                                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/70 to-blue-950/50 border border-cyan-500/40 text-xs text-cyan-200 flex items-start gap-2 shadow-sm">
                                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                                      DID YOU KNOW?
                                    </span>
                                    <p className="text-slate-200 text-xs leading-relaxed">{msg.didYouKnow}</p>
                                  </div>
                                </div>
                              )}

                              {/* Source Attribution & Link (only if a real source is provided) */}
                              {msg.source && msg.source.trim() !== '' && (
                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono text-slate-400">
                                  <div className="flex items-center gap-1 truncate">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="truncate">SOURCE: {msg.source}</span>
                                  </div>
                                  {msg.sourceUrl && (
                                    <a
                                      href={msg.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 uppercase hover:underline"
                                    >
                                      <span>View Source</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* "ASK ME NEXT" - Exactly 3 Suggested Follow-Up Questions */}
                              {((msg.askMeNext && msg.askMeNext.length > 0) || (msg.quickActions && msg.quickActions.length > 0)) && (
                                <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                                  <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <HelpCircle className="w-3 h-3 text-cyan-400" />
                                    ASK ME NEXT:
                                  </span>
                                  <div className="flex flex-col gap-1.5">
                                    {(msg.askMeNext || msg.quickActions || []).slice(0, 3).map((action, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => handleQuickAction(action)}
                                        className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#030712] hover:bg-cyan-950 border border-slate-700/80 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer text-left flex items-center justify-between group"
                                      >
                                        <span>{action}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Actionable Navigation Link (if provided) */}
                              {msg.navigationAction && (
                                <div className="pt-1">
                                  <button
                                    onClick={() => handleExecuteNav(msg.navigationAction)}
                                    className="w-full py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                                  >
                                    <span>{msg.navigationAction.label}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <span className="text-[9px] font-mono text-slate-500 px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#08122c] border border-cyan-500/40 w-fit text-cyan-300 font-mono text-xs shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                      <span>Echo generating fast reply...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Action Suggestion Pills */}
                <div className="px-4 py-2 border-t border-slate-800/80 bg-[#030714] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {contextDefaultPills.map((pill, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(pill)}
                      disabled={isLoading}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200 text-[10px] font-mono transition-all cursor-pointer disabled:opacity-50"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Form or Voice Mode HUD */}
          {isVoiceMode ? (
            <div
              id="echo-chat-voice-mode-indicator"
              className="p-3.5 bg-gradient-to-r from-[#030714] via-[#051129] to-[#030714] border-t border-cyan-500/40 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2.5 text-cyan-300">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  voiceStatus === 'listening'
                    ? 'bg-cyan-400 animate-ping'
                    : voiceStatus === 'processing'
                    ? 'bg-amber-400 animate-pulse'
                    : voiceStatus === 'speaking'
                    ? 'bg-emerald-400 animate-bounce'
                    : 'bg-slate-500'
                }`} />
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  {voiceStatus === 'listening'
                    ? '🎙 Voice Mode: Listening... Speak naturally'
                    : voiceStatus === 'processing'
                    ? '⚡ Voice Mode: Analyzing command...'
                    : voiceStatus === 'speaking'
                    ? '🌊 Voice Mode: Echo speaking'
                    : '🎙 Voice Mode Active (Continuous)'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-cyan-300 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-1 h-2.5 bg-cyan-400 rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-[#030712] border-t border-cyan-950/90 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                id="echo-chat-input"
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (onTypingChange) onTypingChange(e.target.value.length > 0);
                }}
                placeholder="Ask Echo anything, explore missions, or ask about this page..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none font-sans"
              />
              <button
                id="echo-chat-submit-btn"
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
                title="Send message to Echo"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
