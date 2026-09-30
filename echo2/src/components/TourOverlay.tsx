import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  MessageSquare,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { TourStep } from '../types';
import { TOUR_STEPS } from '../data/tourSteps';
import { audioService } from '../services/audioService';

interface TourOverlayProps {
  active: boolean;
  stepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onComplete: () => void;
  onAskEcho: (prompt: string) => void;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({
  active,
  stepIndex,
  onNext,
  onPrev,
  onExit,
  onComplete,
  onAskEcho,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(true);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [showCompletedModal, setShowCompletedModal] = useState<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const currentStep = TOUR_STEPS[stepIndex] || TOUR_STEPS[0];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  // Function to locate target element and calculate position
  const updatePosition = useCallback(() => {
    if (!active || showCompletedModal) return;

    const selector = currentStep.targetSelector;
    const el = document.querySelector(selector);

    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      setIsSearching(false);

      // Scroll element smoothly into view if needed
      const isInViewport =
        rect.top >= 80 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 80 &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);

      if (!isInViewport) {
        el.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'center',
        });
      }
    } else {
      setTargetRect(null);
      setIsSearching(true);
    }
  }, [active, currentStep, showCompletedModal]);

  // Polling / observing target element
  useEffect(() => {
    if (!active) return;

    updatePosition();

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      updatePosition();
      if (attempts > 20) {
        clearInterval(interval);
      }
    }, 120);

    const handleResize = () => updatePosition();
    const handleScroll = () => {
      const selector = currentStep.targetSelector;
      const el = document.querySelector(selector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [active, stepIndex, updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!showCompletedModal) {
          if (isLastStep) {
            setShowCompletedModal(true);
          } else {
            onNext();
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (!showCompletedModal && stepIndex > 0) {
          onPrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, stepIndex, isLastStep, showCompletedModal, onNext, onPrev, onExit]);

  // Calculate tooltip coordinates relative to target on desktop
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const isMobile = winW < 768;

    if (isMobile) {
      setTooltipPos(null);
      return;
    }

    const tRect = tooltipRef.current.getBoundingClientRect();
    const tWidth = tRect.width || 380;
    const tHeight = tRect.height || 260;

    let top = 0;
    let left = targetRect.left + targetRect.width / 2 - tWidth / 2;

    // Prefer positioning below unless too close to bottom
    if (targetRect.bottom + tHeight + 20 < winH) {
      top = targetRect.bottom + 16;
    } else if (targetRect.top - tHeight - 20 > 80) {
      top = targetRect.top - tHeight - 16;
    } else {
      // Beside
      top = Math.max(90, Math.min(winH - tHeight - 20, targetRect.top));
      if (targetRect.right + tWidth + 20 < winW) {
        left = targetRect.right + 16;
      } else {
        left = Math.max(16, targetRect.left - tWidth - 16);
      }
    }

    // Clamp horizontally
    left = Math.max(16, Math.min(winW - tWidth - 16, left));
    top = Math.max(85, Math.min(winH - tHeight - 16, top));

    setTooltipPos({ top, left });
  }, [targetRect, stepIndex]);

  if (!active) return null;

  const handleNextClick = () => {
    audioService.playTelemetryPing();
    if (isLastStep) {
      setShowCompletedModal(true);
    } else {
      onNext();
    }
  };

  const handleFinishTour = () => {
    audioService.playTelemetryPing();
    setShowCompletedModal(false);
    onComplete();
  };

  const handleAskEchoStep = () => {
    audioService.playTelemetryPing();
    onAskEcho(`What am I looking at in this tour step: "${currentStep.title}"? Can you explain what to do here?`);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto select-none" id="tour-guide-overlay">
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onExit}
      />

      {/* Target Element Highlight Box */}
      {targetRect && !showCompletedModal && (
        <div
          id="tour-target-highlight"
          className="fixed pointer-events-none rounded-xl border-2 border-cyan-400/90 shadow-[0_0_25px_rgba(6,182,212,0.6),inset_0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 z-50 animate-pulse"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        >
          {/* Corner telemetry brackets */}
          <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-300" />
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-300" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-300" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-300" />
        </div>
      )}

      {/* Tour Tooltip Card */}
      {!showCompletedModal ? (
        <div
          ref={tooltipRef}
          id="tour-step-card"
          className={`fixed z-50 w-full sm:w-[420px] max-w-[calc(100vw-32px)] bg-[#070e22]/95 border border-cyan-500/60 rounded-2xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-md transition-all duration-300 ${
            tooltipPos
              ? ''
              : 'bottom-4 left-1/2 -translate-x-1/2 sm:bottom-8'
          }`}
          style={
            tooltipPos
              ? {
                  top: `${tooltipPos.top}px`,
                  left: `${tooltipPos.left}px`,
                }
              : undefined
          }
        >
          {/* Top telemetry bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
                TOUR MODE • STEP {stepIndex + 1} OF {TOUR_STEPS.length}
              </span>
            </div>
            <button
              id="tour-exit-btn"
              onClick={onExit}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Exit Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="space-y-2 mb-5">
            <h3 className="font-['Rajdhani'] font-bold text-xl sm:text-2xl text-white tracking-wide uppercase leading-tight">
              {currentStep.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Action Row */}
          <div className="space-y-3">
            {/* Ask Echo shortcut button */}
            <button
              id="tour-ask-echo-btn"
              onClick={handleAskEchoStep}
              className="w-full py-2 px-3 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask Echo: "What am I supposed to do here?"</span>
            </button>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                id="tour-prev-btn"
                disabled={stepIndex === 0}
                onClick={onPrev}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-all ${
                  stepIndex === 0
                    ? 'opacity-40 text-slate-500 cursor-not-allowed'
                    : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="tour-skip-btn"
                  onClick={onExit}
                  className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 uppercase"
                >
                  Exit Tour
                </button>

                <button
                  id="tour-next-btn"
                  onClick={handleNextClick}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                >
                  <span>{isLastStep ? 'Complete' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TOUR COMPLETE MODAL */
        <div
          id="tour-completed-card"
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-[#070e22]/98 border border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-xl text-center space-y-5 animate-in fade-in zoom-in duration-300"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>TOUR COMPLETE • +25 XP AWARDED</span>
            </div>
            <h3 className="font-['Rajdhani'] font-bold text-3xl sm:text-4xl text-white uppercase tracking-wider">
              YOU'VE COMPLETED THE TOUR
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              You now have the knowledge to navigate NASA hardware archives, review scientific discoveries, analyze Martian and lunar landing sites, and track live asteroids.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left space-y-1.5 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ECHO AI SPACE GUIDE ACTIVATED</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Whenever you have questions about any spacecraft, rover, NASA photo, or planetary data, click "ASK ECHO" in the bottom right corner.
            </p>
          </div>

          <button
            id="tour-start-exploring-btn"
            onClick={handleFinishTour}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
          >
            <span>START EXPLORING</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
