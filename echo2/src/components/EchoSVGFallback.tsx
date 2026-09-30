import React from 'react';
import { VoiceState } from '../services/voiceAssistant';
import { EchoEmotion } from './EchoBot';

interface EchoSVGFallbackProps {
  emotion: EchoEmotion;
  voiceState: VoiceState;
  isWaving: boolean;
  isHovered: boolean;
}

export const EchoSVGFallback: React.FC<EchoSVGFallbackProps> = ({
  emotion,
  voiceState,
  isWaving,
  isHovered,
}) => {
  return (
    <div className="relative w-52 h-[220px] flex items-center justify-center select-none pointer-events-none filter drop-shadow-[0_15px_35px_rgba(6,182,212,0.45)]">
      {/* Deep floor ion plasma levitation glow */}
      <div className="absolute bottom-1 w-24 h-5 bg-cyan-400/50 rounded-full blur-lg animate-pulse" />

      {/* Floating Fairy Levitation Container */}
      <div className="relative w-44 h-48 flex items-center justify-center animate-bounce duration-[2800ms]">
        
        {/* Glowing Translucent Fairy Wings on Back */}
        <div className="absolute -left-7 top-10 w-16 h-20 bg-gradient-to-r from-cyan-300/40 via-blue-400/30 to-white/60 rounded-full blur-[0.5px] border border-cyan-300/70 shadow-[0_0_20px_#22d3ee] -rotate-12 animate-pulse origin-bottom-right" />
        <div className="absolute -right-7 top-10 w-16 h-20 bg-gradient-to-l from-cyan-300/40 via-blue-400/30 to-white/60 rounded-full blur-[0.5px] border border-cyan-300/70 shadow-[0_0_20px_#22d3ee] rotate-12 animate-pulse origin-bottom-left" />

        {/* Holographic Quantum Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/30 via-blue-500/10 to-transparent rounded-full blur-2xl animate-pulse" />

        {/* Sleek Robot Fairy Head & Compact Lightweight Torso */}
        <div className="absolute inset-x-4 top-2 bottom-6 bg-gradient-to-b from-slate-50 via-slate-200 to-slate-400 rounded-[38px] shadow-[inset_0_4px_12px_rgba(255,255,255,1),0_15px_35px_rgba(6,182,212,0.4)] border-2 border-white/90 flex flex-col items-center justify-center overflow-hidden">
          
          {/* Top NASA Signal Antenna with Glowing Beacon */}
          <div className="absolute -top-4 flex flex-col items-center">
            <div className="w-1 h-3.5 bg-slate-500 rounded-t-sm" />
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_18px_#22d3ee,0_0_6px_#ffffff] animate-ping" />
          </div>

          {/* OLED Holographic Visor Screen */}
          <div className="w-32 h-16 bg-gradient-to-b from-slate-950 via-[#020617] to-[#080e1a] rounded-2xl border-2 border-cyan-400/80 shadow-[inset_0_3px_12px_rgba(6,182,212,0.5),0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center relative overflow-hidden">
            
            {/* Visor Glass Reflection Arc */}
            <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-cyan-300/40 to-transparent rounded-t-2xl" />

            {/* Glowing Blush Cheeks When Hovered (Shy Robot Fairy) */}
            {isHovered && (
              <div className="absolute inset-x-3 bottom-1.5 flex justify-between px-2 pointer-events-none z-10 animate-pulse">
                <div className="w-5 h-2 bg-pink-500/85 rounded-full blur-[2px] shadow-[0_0_8px_#ec4899]" />
                <div className="w-5 h-2 bg-pink-500/85 rounded-full blur-[2px] shadow-[0_0_8px_#ec4899]" />
              </div>
            )}

            {/* Dynamic Facial Expressions & State Visualizers */}
            {isHovered ? (
              /* Shy bashful closed happy eyes (> <) */
              <div className="flex items-center gap-5">
                <div className="w-5 h-2.5 border-t-2 border-pink-300 rounded-t-full shadow-[0_0_8px_#f472b6] rotate-6" />
                <div className="w-5 h-2.5 border-t-2 border-pink-300 rounded-t-full shadow-[0_0_8px_#f472b6] -rotate-6" />
              </div>
            ) : voiceState === 'listening' ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-cyan-400 bg-cyan-400/30 animate-ping shadow-[0_0_10px_#22d3ee]" />
                <div className="w-5 h-5 rounded-full border-2 border-cyan-400 bg-cyan-400/30 animate-ping delay-150 shadow-[0_0_10px_#22d3ee]" />
              </div>
            ) : voiceState === 'processing' ? (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce shadow-[0_0_8px_#f59e0b]" />
                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce delay-100 shadow-[0_0_8px_#22d3ee]" />
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce delay-200 shadow-[0_0_8px_#10b981]" />
              </div>
            ) : voiceState === 'speaking' ? (
              <div className="flex items-center gap-1.5 px-3">
                <div className="w-1.5 h-6 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
                <div className="w-1.5 h-9 bg-cyan-200 rounded-full animate-pulse delay-75 shadow-[0_0_12px_#ffffff]" />
                <div className="w-1.5 h-7 bg-cyan-400 rounded-full animate-pulse delay-150 shadow-[0_0_10px_#22d3ee]" />
              </div>
            ) : emotion === 'thinking' ? (
              <div className="flex items-center gap-5">
                <div className="w-6 h-3 border-t-2 border-cyan-300 rounded-t-full shadow-[0_0_8px_#22d3ee]" />
                <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] animate-pulse" />
              </div>
            ) : emotion === 'curious' ? (
              <div className="flex items-center gap-5">
                <div className="w-6 h-3 border-t-2 border-cyan-300 rounded-t-full -rotate-12 shadow-[0_0_8px_#22d3ee]" />
                <div className="w-4 h-5 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />
              </div>
            ) : (
              /* Large Expressive Glowing Robot Fairy Eyes */
              <div className="flex items-center gap-6">
                <div className="relative w-6 h-7 bg-[#030712] rounded-full border border-cyan-400/60 shadow-[inset_0_2px_6px_rgba(6,182,212,0.8),0_0_8px_rgba(6,182,212,0.5)] flex items-start justify-end p-1">
                  <div className="w-2.5 h-2.5 bg-cyan-200 rounded-full shadow-[0_0_8px_#22d3ee]" />
                </div>
                <div className="relative w-6 h-7 bg-[#030712] rounded-full border border-cyan-400/60 shadow-[inset_0_2px_6px_rgba(6,182,212,0.8),0_0_8px_rgba(6,182,212,0.5)] flex items-start justify-end p-1">
                  <div className="w-2.5 h-2.5 bg-cyan-200 rounded-full shadow-[0_0_8px_#22d3ee]" />
                </div>
              </div>
            )}
          </div>

          {/* Chest NASA Emblem & Arc Reactor Core */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/60 text-[8px] font-mono font-bold text-blue-300 tracking-wider">
              NASA
            </div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_16px_#06b6d4] animate-pulse flex items-center justify-center border border-white/80">
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_6px_white]" />
            </div>
          </div>
        </div>

        {/* Tiny Articulated Robot Arms */}
        <div
          className={`absolute left-1 top-18 w-3.5 h-10 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-full shadow-md transition-transform duration-300 border border-slate-300 ${
            isWaving ? '-rotate-45 translate-y-[-6px]' : 'rotate-12'
          }`}
        />
        <div className="absolute right-1 top-18 w-3.5 h-10 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-full shadow-md -rotate-12 border border-slate-300" />

        {/* Bottom Plasma Hover Thrust */}
        <div className="absolute bottom-0 w-16 h-3.5 bg-cyan-400 rounded-full blur-md opacity-95 animate-pulse shadow-[0_0_20px_#22d3ee]" />
      </div>
    </div>
  );
};

