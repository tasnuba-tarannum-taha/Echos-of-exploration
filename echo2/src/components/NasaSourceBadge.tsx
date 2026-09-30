import React from 'react';
import { ExternalLink, ShieldCheck, Video, Image, Database, Globe, Eye, Sparkles } from 'lucide-react';
import { DataSourceBadge } from '../types';

interface NasaSourceBadgeProps {
  type: DataSourceBadge | 'ILLUSTRATIVE VISUAL' | '3D VISUALIZATION' | 'INTERACTIVE VISUALIZATION' | 'LIVE NASA STREAM';
  className?: string;
  size?: 'sm' | 'md';
}

export const NasaSourceBadge: React.FC<NasaSourceBadgeProps> = ({
  type,
  className = '',
  size = 'md',
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'REAL NASA VIDEO':
        return {
          icon: Video,
          label: 'REAL NASA VIDEO',
          colors: 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
          dot: 'bg-rose-400 animate-pulse',
        };
      case 'NASA VIDEO':
        return {
          icon: Video,
          label: 'NASA VIDEO',
          colors: 'bg-red-950/80 text-red-300 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
          dot: 'bg-red-400',
        };
      case 'LIVE NASA STREAM':
        return {
          icon: Video,
          label: 'NASA ISS STREAM',
          colors: 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
          dot: 'bg-amber-400 animate-ping',
        };
      case 'NASA PHOTO':
        return {
          icon: Image,
          label: 'NASA PHOTO',
          colors: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
          dot: 'bg-cyan-400',
        };
      case 'NASA SCIENTIFIC VISUALIZATION':
        return {
          icon: Sparkles,
          label: 'NASA SCIENTIFIC VISUALIZATION',
          colors: 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
          dot: 'bg-purple-400',
        };
      case 'NASA DATA VISUALIZATION':
        return {
          icon: Globe,
          label: 'NASA DATA VISUALIZATION',
          colors: 'bg-teal-950/90 text-teal-300 border-teal-500/40 shadow-[0_0_10px_rgba(20,184,166,0.25)]',
          dot: 'bg-teal-400',
        };
      case 'NASA EARTHDATA':
        return {
          icon: Globe,
          label: 'NASA EARTHDATA',
          colors: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
          dot: 'bg-emerald-400',
        };
      case 'NASA/JPL':
      case 'NASA/JPL SOURCE':
        return {
          icon: ShieldCheck,
          label: 'NASA/JPL',
          colors: 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
          dot: 'bg-amber-400',
        };
      case 'NASA LIVE DATA':
      case 'LIVE NASA DATA':
        return {
          icon: Database,
          label: 'NASA LIVE DATA',
          colors: 'bg-sky-950/80 text-sky-300 border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.25)]',
          dot: 'bg-sky-400 animate-pulse',
        };
      case '3D VISUALIZATION':
        return {
          icon: Eye,
          label: '3D VISUALIZATION',
          colors: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
          dot: 'bg-indigo-400',
        };
      case 'INTERACTIVE VISUALIZATION':
        return {
          icon: Eye,
          label: 'INTERACTIVE VISUALIZATION',
          colors: 'bg-cyan-950/90 text-cyan-200 border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]',
          dot: 'bg-cyan-300',
        };
      case 'ILLUSTRATIVE VISUAL':
        return {
          icon: Sparkles,
          label: 'ILLUSTRATIVE VISUAL',
          colors: 'bg-slate-900/90 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
        };
      case 'DEMO DATA':
      case 'CACHED DATA':
        return {
          icon: Database,
          label: type,
          colors: 'bg-slate-900/80 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
        };
      default:
        return {
          icon: Sparkles,
          label: type || 'NASA ARCHIVE',
          colors: 'bg-cyan-950/70 text-cyan-300 border-cyan-800',
          dot: 'bg-cyan-400',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1.5'
      : 'px-2.5 py-1 text-xs gap-2';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-wider uppercase rounded-full border backdrop-blur-md ${config.colors} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

interface NasaSourcePanelProps {
  title?: string;
  source: string;
  originalUrl?: string;
  badgeType?: DataSourceBadge | '3D VISUALIZATION';
  date?: string;
  nasaId?: string;
  camera?: string;
  className?: string;
}

export const NasaSourcePanel: React.FC<NasaSourcePanelProps> = ({
  title,
  source,
  originalUrl,
  badgeType = 'NASA PHOTO',
  date,
  nasaId,
  camera,
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-950/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-xs font-mono space-y-2 text-slate-300 shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">SOURCE VERIFICATION</span>
        {badgeType && <NasaSourceBadge type={badgeType} size="sm" />}
      </div>

      {title && (
        <p className="text-white font-semibold font-sans text-xs sm:text-sm line-clamp-1">{title}</p>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <div>
          <span className="text-slate-400">PROVIDER: </span>
          <span className="text-slate-200 font-medium">{source}</span>
        </div>
        {date && (
          <div>
            <span className="text-slate-400">DATE: </span>
            <span className="text-slate-200">{date}</span>
          </div>
        )}
        {nasaId && (
          <div>
            <span className="text-slate-400">NASA ID: </span>
            <span className="text-cyan-300 font-bold">{nasaId}</span>
          </div>
        )}
        {camera && (
          <div>
            <span className="text-slate-400">CAMERA: </span>
            <span className="text-amber-300 font-medium">{camera}</span>
          </div>
        )}
      </div>

      {originalUrl && (
        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-end">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono tracking-wider uppercase transition-colors"
          >
            <span>VIEW ORIGINAL SOURCE</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
