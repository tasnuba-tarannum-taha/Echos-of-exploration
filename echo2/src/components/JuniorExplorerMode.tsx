import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  Printer,
  ChevronRight,
  RotateCcw,
  Zap,
  ShieldCheck,
  Rocket,
  Download,
} from 'lucide-react';
import { QUIZ_QUESTIONS, QuizQuestion } from '../data/quizQuestions';
import { audioService } from '../services/audioService';
import { echoMemory } from '../services/echoMemory';

interface JuniorExplorerModeProps {
  xp: number;
  onAddXp?: (amount: number, reason: string) => void;
  onUnlockBadge?: (badgeId: string) => void;
}

export const JuniorExplorerMode: React.FC<JuniorExplorerModeProps> = ({
  xp,
  onAddXp,
  onUnlockBadge,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('Cadet Explorer');
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  const totalQuestions = QUIZ_QUESTIONS?.length || 10;
  const safeIdx = Math.max(0, Math.min(currentIdx, totalQuestions - 1));
  const question: QuizQuestion = (QUIZ_QUESTIONS && QUIZ_QUESTIONS[safeIdx]) ? QUIZ_QUESTIONS[safeIdx] : QUIZ_QUESTIONS[0];
  const progressPct = Math.round(((safeIdx + 1) / totalQuestions) * 100);

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !question) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption === question.correctIndex;
    if (isCorrect) {
      audioService.playTelemetryPing();
      audioService.playRobotChirp('happy');
      setScore((prev) => prev + 1);
      if (onAddXp) {
        onAddXp(question.xpReward, `Passed Quiz Question ${safeIdx + 1}`);
      }
      if (question.badgeRewardId) {
        if (!earnedBadges.includes(question.badgeRewardId)) {
          setEarnedBadges((prev) => [...prev, question.badgeRewardId!]);
        }
        if (onUnlockBadge) {
          onUnlockBadge(question.badgeRewardId);
        }
      }
    } else {
      audioService.playRobotChirp('curious');
    }
  };

  const handleNextQuestion = () => {
    if (safeIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz finished
      setQuizFinished(true);
      echoMemory.recordQuizScore(score + (selectedOption === question.correctIndex ? 1 : 0));
      audioService.playCelebrationCheer();
      if (onAddXp) {
        onAddXp(50, 'Completed NASA Space School');
      }
      if (onUnlockBadge) {
        onUnlockBadge('badge-space-historian');
      }
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#070e22] via-[#091533] to-[#040817] border border-cyan-500/30 rounded-3xl shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <h3 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white uppercase tracking-wider">
              NASA SPACE SCHOOL
            </h3>
          </div>
          <p className="text-xs font-mono text-slate-400">
            10 interactive questions testing knowledge of Moon landings, Mars rovers, and abandoned NASA technology.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>ACCUMULATED XP: {xp}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            SCORE: {score} / 10
          </div>
        </div>
      </div>

      {!quizFinished ? (
        /* Quiz Active Screen */
        <div className="bg-[#030712] border border-cyan-950/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Progress Bar & Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold uppercase tracking-wider">
                QUESTION {currentIdx + 1} OF {QUIZ_QUESTIONS.length}
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                  question.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {question.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                  {question.category}
                </span>
                <span className="text-amber-400 font-bold">+{question.xpReward} XP</span>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h4 className="font-['Rajdhani'] font-bold text-xl sm:text-2xl text-white leading-snug">
              {question.question}
            </h4>
          </div>

          {/* 4 Interactive Option Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = isAnswerSubmitted && idx === question.correctIndex;
              const isWrong = isAnswerSubmitted && isSelected && idx !== question.correctIndex;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`p-4 rounded-2xl border text-left transition-all font-mono text-xs sm:text-sm flex items-start gap-3 cursor-pointer ${
                    isCorrect
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : isWrong
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                      : isSelected
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-[#070e22] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-black/40 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                  {isWrong && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Explanation Box on Submit */}
          {isAnswerSubmitted && (
            <div className={`p-5 rounded-2xl border flex items-start gap-3 ${
              selectedOption === question.correctIndex
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}>
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-1 flex-1">
                <span className="font-mono text-xs font-bold uppercase tracking-wider block">
                  {selectedOption === question.correctIndex ? 'OUTSTANDING WORK!' : 'FACT CHECK & ARCHIVE LOG:'}
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {question.explanation}
                </p>
                {selectedOption === question.correctIndex ? (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-300/90 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>ECHO: &ldquo;Beep-boop! Stellar deduction, Explorer! Telemetry verified!&rdquo;</span>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-rose-500/20 text-[11px] font-mono text-amber-300/90 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>ECHO: &ldquo;Recalibrating sensors! Even Apollo engineers learned through telemetry—now we know!&rdquo;</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs font-mono text-slate-400">
              {isAnswerSubmitted
                ? (selectedOption === question.correctIndex ? `+${question.xpReward} XP CREDITED` : 'TRY HARDER ON NEXT LOG')
                : 'SELECT AN OPTION AND SUBMIT'}
            </span>

            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Confirm Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <span>{currentIdx < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'View Space Apps Certificate'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Completion & Certificate Screen */
        <div className="space-y-8">
          {/* Certificate Print Area */}
          <div
            id="junior-explorer-certificate"
            className="w-full bg-[#030712] border-4 border-amber-500/60 rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden"
          >
            {/* Background Seal Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Award className="w-[500px] h-[500px] text-amber-300" />
            </div>

            {/* Corner Decorative Badges */}
            <div className="flex items-center justify-between text-xs font-mono text-amber-400 uppercase tracking-widest border-b border-amber-500/30 pb-4">
              <span>NASA SPACE APPS CHALLENGE</span>
              <span>CHALLENGE: ABANDONED BUT NOT FORGOTTEN</span>
              <span>2026 ARCHIVE</span>
            </div>

            {/* Title Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-950/80 border-2 border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.4)] mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-5xl text-white tracking-wider uppercase">
                CERTIFICATE OF EXPLORATION
              </h2>
              <p className="text-xs sm:text-sm font-mono text-cyan-300 tracking-widest uppercase">
                OFFICIALLY CONFERRED FOR DISTINGUISHED SCHOLARSHIP IN EXTRATERRESTRIAL ARTIFACTS
              </p>
            </div>

            {/* Student Name Input / Display */}
            <div className="space-y-2 max-w-md mx-auto py-2">
              <label className="text-xs font-mono text-slate-400 uppercase block">RECIPIENT NAME:</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter Student Name"
                className="w-full text-center font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white bg-[#070e22] border-b-2 border-amber-400 px-4 py-2 focus:outline-none focus:border-cyan-400 uppercase tracking-wider"
              />
            </div>

            {/* Commendation Text */}
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Has successfully mastered the historical, technical, and scientific records of human space hardware left behind across the Moon and Mars, earning a score of{' '}
              <span className="text-amber-400 font-bold">{score} / 10</span> and gaining entry into the official NASA Space Apps Junior Explorer Guild.
            </p>

            {/* Badges Earned Ribbon */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold uppercase">
                Moon Walker Medal
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold uppercase">
                Rover Expert Badge
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold uppercase">
                Space Historian Credential
              </span>
            </div>

            {/* Signatures & Seal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-amber-500/30 text-xs font-mono text-slate-400">
              <div>
                <div className="font-['Rajdhani'] font-bold text-lg text-white">ECHO</div>
                <div className="border-t border-slate-700 pt-1">MUSEUM AI CURATOR</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400 flex items-center justify-center text-amber-300 text-xs font-bold">
                  SEAL
                </div>
                <div className="pt-1 text-[10px] text-amber-300 uppercase">OFFICIAL SPACE APPS 2026</div>
              </div>
              <div>
                <div className="font-['Rajdhani'] font-bold text-lg text-white">MARCH 2026</div>
                <div className="border-t border-slate-700 pt-1">DATE OF CONFERRAL</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handlePrintCertificate}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Certificate</span>
            </button>

            <button
              onClick={handleRestartQuiz}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Challenge</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
