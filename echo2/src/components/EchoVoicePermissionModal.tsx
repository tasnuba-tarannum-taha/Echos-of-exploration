import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Volume2, Radio, Sparkles, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface EchoVoicePermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export const EchoVoicePermissionModal: React.FC<EchoVoicePermissionModalProps> = ({
  isOpen,
  onAllow,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Blurred Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDeny}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#070e22]/95 border border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] backdrop-blur-xl text-white overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onDeny}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with Mascot Teaser */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
              <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] uppercase tracking-widest mb-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                NASA MUSEUM AI COMPANION
              </div>
              <h3 className="font-['Rajdhani'] font-bold text-2xl text-white tracking-wide">
                ACTIVATE VOICE WITH ECHO
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Echo can fly across the museum, guide you through Moon & Mars landing sites, and answer questions using natural voice synthesis.
          </p>

          {/* 3 Permission Pillars */}
          <div className="space-y-3 mb-8">
            <div className="p-3.5 rounded-2xl bg-[#030712]/80 border border-cyan-950/80 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  1. MICROPHONE ACCESS
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Listens for the wake phrase <span className="text-cyan-300 font-semibold">"Hey Echo"</span> to assist without needing clicks.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#030712]/80 border border-cyan-950/80 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-blue-950 text-blue-400 border border-blue-500/30 shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  2. SPEECH RECOGNITION
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Understands commands like <span className="text-cyan-300 font-semibold">"Take me to Moon Mission"</span>, <span className="text-cyan-300 font-semibold">"Open Apollo 11"</span>, or <span className="text-cyan-300 font-semibold">"Start Quiz"</span>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#030712]/80 border border-cyan-950/80 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  3. VOICE SYNTHESIS
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Echo explains planetary artifacts with warm, authentic voice audio in student-friendly English.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                audioService.playTelemetryPing();
                onAllow();
              }}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Allow Echo</span>
            </button>

            <button
              onClick={onDeny}
              className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border border-slate-700/60"
            >
              Continue with Keyboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
