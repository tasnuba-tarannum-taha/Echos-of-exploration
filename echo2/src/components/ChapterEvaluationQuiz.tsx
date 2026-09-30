import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  BookOpen,
} from 'lucide-react';
import { getChapterQuestions, ChapterQuestion } from '../data/missionChapterQuestions';
import { audioService } from '../services/audioService';

interface ChapterEvaluationQuizProps {
  missionId: string;
  missionTitle: string;
  chapterIndex: number;
  chapterTitle: string;
  isChapterCompleted: boolean;
  onPassChapter: (score: number) => void;
  onNextChapter?: () => void;
  isFinalChapter?: boolean;
  onCompleteMission?: () => void;
}

export const ChapterEvaluationQuiz: React.FC<ChapterEvaluationQuizProps> = ({
  missionId,
  missionTitle,
  chapterIndex,
  chapterTitle,
  isChapterCompleted,
  onPassChapter,
  onNextChapter,
  isFinalChapter = false,
  onCompleteMission,
}) => {
  const questions: ChapterQuestion[] = React.useMemo(() => {
    return getChapterQuestions(missionId, chapterIndex);
  }, [missionId, chapterIndex]);

  // Selected answer map: questionId -> selected option index
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [hasNotifiedPass, setHasNotifiedPass] = useState<boolean>(isChapterCompleted);

  // Reset local quiz state when mission or chapter changes
  useEffect(() => {
    setSelectedAnswers({});
    setHasNotifiedPass(isChapterCompleted);
  }, [missionId, chapterIndex, isChapterCompleted]);

  // Calculate score
  const score = Object.entries(selectedAnswers).reduce((acc, [qId, selectedIdx]) => {
    const q = questions.find((item) => item.id === qId);
    if (q && q.correctIndex === selectedIdx) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const answeredCount = Object.keys(selectedAnswers).length;
  const isPassed = score >= 5 || isChapterCompleted;
  const isAllAnswered = answeredCount === questions.length;
  const isFailed = isAllAnswered && score < 5;

  const handleSelectOption = (qId: string, optIdx: number, correctIdx: number) => {
    // If already answered this question, do not allow changing
    if (selectedAnswers[qId] !== undefined) return;

    const newSelected = { ...selectedAnswers, [qId]: optIdx };
    setSelectedAnswers(newSelected);

    const isCorrect = optIdx === correctIdx;
    if (isCorrect) {
      audioService.playTelemetryPing();
    } else {
      audioService.playClick();
    }

    // Recompute score with new selection
    const newScore = Object.entries(newSelected).reduce((acc, [currQId, selected]) => {
      const q = questions.find((item) => item.id === currQId);
      if (q && q.correctIndex === selected) {
        return acc + 1;
      }
      return acc;
    }, 0);

    // If reaches 5 or more and hasn't notified pass yet
    if (newScore >= 5 && !hasNotifiedPass) {
      setHasNotifiedPass(true);
      onPassChapter(newScore);
      audioService.playDiscoveryChime();
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    audioService.playClick();
  };

  return (
    <section
      id={`chapter-${chapterIndex}-evaluation`}
      className="mt-10 rounded-2xl bg-gradient-to-b from-[#0a122c] to-[#040816] border border-cyan-500/30 p-6 sm:p-8 space-y-6 shadow-[0_0_35px_rgba(6,182,212,0.15)]"
    >
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase tracking-widest">
              Chapter {chapterIndex + 1} Knowledge Check
            </span>
            <span className="text-xs font-mono text-slate-400">
              10 Flight Verification Questions
            </span>
          </div>

          <h3 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase tracking-wide flex items-center gap-2">
            <span>Certification Evaluation:</span>
            <span className="text-cyan-400">{chapterTitle}</span>
          </h3>

          <p className="text-xs text-slate-400">
            Answer the 10 telemetry questions below. <strong className="text-cyan-300">Score at least 5/10 right</strong> to grant flight clearance and unlock the next {isFinalChapter ? 'mission' : 'chapter'}.
          </p>
        </div>

        {/* Score & Status Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-black/60 border border-slate-800 rounded-xl px-4 py-3 text-center space-y-0.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Score (Target: ≥ 5/10)
            </div>
            <div className="text-2xl font-bold font-mono">
              <span className={score >= 5 ? 'text-emerald-400' : 'text-cyan-400'}>
                {score}
              </span>
              <span className="text-slate-500 text-lg"> / 10</span>
            </div>
          </div>

          <div
            className={`px-4 py-3 rounded-xl border flex items-center gap-2.5 text-xs font-mono font-bold uppercase tracking-wider ${
              isPassed
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : isFailed
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            {isPassed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>CLEARED ({score}/10)</span>
              </>
            ) : isFailed ? (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>SCORE &lt; 5 (RETRY)</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>IN PROGRESS ({answeredCount}/10)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Passing threshold: 5 correct answers (50%)</span>
          <span>
            {answeredCount} of 10 answered • {score} right
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
          {/* Threshold marker at 50% */}
          <div
            className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-400/70 z-10"
            title="Passing mark (5/10)"
          />
          <div
            className={`h-full transition-all duration-300 ${
              score >= 5 ? 'bg-gradient-to-r from-cyan-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'
            }`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Pass Banner if criteria met */}
      <AnimatePresence>
        {isPassed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl bg-gradient-to-r from-emerald-950/80 via-cyan-950/60 to-slate-950 border border-emerald-500/50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Flight Clearance Approved ({score}/10 Right)</span>
                </div>
                <p className="text-xs text-slate-300">
                  {isFinalChapter
                    ? 'All requirements satisfied! Final mission completion is now unlocked.'
                    : `Chapter ${chapterIndex + 1} certified. Chapter ${chapterIndex + 2} is now unlocked and available.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {!isFinalChapter && onNextChapter && (
                <button
                  type="button"
                  onClick={onNextChapter}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Proceed to Chapter {chapterIndex + 2}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {isFinalChapter && onCompleteMission && (
                <button
                  type="button"
                  onClick={onCompleteMission}
                  className="flex-1 sm:flex-initial px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>Claim Mission Complete (+100 XP)</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failure Banner if user answered all and score < 5 */}
      <AnimatePresence>
        {isFailed && !isPassed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-rose-950/60 border border-rose-500/50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-bold text-rose-300 uppercase tracking-widest">
                  Passing Score Not Met ({score}/10 Right)
                </div>
                <p className="text-xs text-slate-300">
                  At least 5 correct answers are required to unlock the next chapter. Review the chapter content above and retake the evaluation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetQuiz}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs uppercase flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Evaluation</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10 Questions Grid */}
      <div className="space-y-6 pt-2">
        {questions.map((q, qIndex) => {
          const selectedOption = selectedAnswers[q.id];
          const hasAnswered = selectedOption !== undefined;
          const isCorrect = hasAnswered && selectedOption === q.correctIndex;
          const isWrong = hasAnswered && selectedOption !== q.correctIndex;

          return (
            <div
              key={q.id}
              className={`rounded-xl border transition-all p-4 sm:p-5 space-y-4 ${
                hasAnswered
                  ? isCorrect
                    ? 'bg-[#06191f]/80 border-emerald-500/40'
                    : 'bg-[#1a0c16]/80 border-rose-500/40'
                  : 'bg-[#030712] border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 mt-0.5 ${
                      hasAnswered
                        ? isCorrect
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-900 text-cyan-400 border border-slate-800'
                    }`}
                  >
                    Q{qIndex + 1}
                  </span>
                  <h4 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                    {q.question}
                  </h4>
                </div>

                {hasAnswered && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">CORRECT</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 text-xs font-mono font-bold">
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">INCORRECT</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((optText, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isThisCorrect = optIdx === q.correctIndex;

                  let optClass = 'bg-[#070e22] border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-cyan-500/40 cursor-pointer';

                  if (hasAnswered) {
                    if (isThisCorrect) {
                      optClass = 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 font-medium';
                    } else if (isSelected) {
                      optClass = 'bg-rose-950/80 border-rose-500/80 text-rose-200 font-medium';
                    } else {
                      optClass = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60 cursor-default';
                    }
                  }

                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(q.id, optIdx, q.correctIndex)}
                      className={`text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-start gap-2.5 ${optClass}`}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[11px] font-bold shrink-0 mt-0.5 ${
                          hasAnswered && isThisCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : hasAnswered && isSelected
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="leading-snug">{optText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Banner */}
              {hasAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg bg-black/60 border border-slate-800/80 p-3.5 space-y-1 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-cyan-400 uppercase">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>NASA Technical Archive Reference:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5">
                    {q.explanation}
                  </p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-slate-400">
          Flight Evaluation Target: <strong className="text-cyan-300">5 / 10 Right Answers</strong> ({score}/10 currently achieved)
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleResetQuiz}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Reset Answers
            </button>
          )}

          {!isFinalChapter && onNextChapter && isPassed && (
            <button
              type="button"
              onClick={onNextChapter}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer ml-auto"
            >
              <span>Next Chapter ({chapterIndex + 2})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {isFinalChapter && onCompleteMission && isPassed && (
            <button
              type="button"
              onClick={onCompleteMission}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer ml-auto"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>Mark Mission Complete (+100 XP)</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
