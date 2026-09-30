import React from 'react';
import { ToastNotification } from '../hooks/useProgress';
import { Award, Zap, CheckCircle2 } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss && onDismiss(toast.id)}
          className="pointer-events-auto bg-[#0b1329]/95 border border-cyan-500/40 rounded-xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-md transition-all duration-300 transform translate-y-0 cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              {toast.badgeName ? (
                <Award className="w-5 h-5 text-amber-400" />
              ) : toast.xp ? (
                <Zap className="w-5 h-5 text-cyan-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-white tracking-wide">{toast.title}</h4>
                {toast.xp && (
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    +{toast.xp} XP
                  </span>
                )}
              </div>
              {toast.subtitle && (
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed truncate">{toast.subtitle}</p>
              )}
              {toast.badgeName && (
                <div className="mt-2 text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Badge: {toast.badgeName}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
