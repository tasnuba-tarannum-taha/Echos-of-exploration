import React from 'react';
import { Orbit, Sparkles, ShieldCheck, Heart, Github, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#020617] text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Theme */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-['Rajdhani'] font-bold text-xl tracking-wider uppercase">
              <Orbit className="w-5 h-5 text-cyan-400" />
              <span>Echoes of Exploration</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md font-sans">
              An interactive digital museum chronicling the forgotten hardware humanity left behind on the Moon, Mars, and deep space. Built for the 2026 NASA Space Apps Challenge.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Every mission ends. The discoveries remain.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 font-mono text-xs">
            <span className="text-white uppercase font-bold tracking-wider block">NAVIGATION</span>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-cyan-300 transition-colors cursor-pointer">
                  1. Explore (Destinations Hub)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('atlas')} className="hover:text-cyan-300 transition-colors cursor-pointer">
                  2. Hardware Atlas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('missions')} className="hover:text-cyan-300 transition-colors cursor-pointer">
                  3. Missions Archive
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('nasa-feeds')} className="hover:text-cyan-300 transition-colors cursor-pointer">
                  4. Live NASA Telemetry
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('journey')} className="hover:text-cyan-300 transition-colors cursor-pointer text-cyan-400 font-semibold">
                  5. Astronaut Journey (Moon Game)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('badges')} className="hover:text-cyan-300 transition-colors cursor-pointer">
                  6. Badges & Honors
                </button>
              </li>
            </ul>
          </div>

          {/* NASA APIs & Attribution */}
          <div className="space-y-2 font-mono text-xs">
            <span className="text-white uppercase font-bold tracking-wider block">DATA & ATTRIBUTION</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Powered by NASA Open APIs:
            </p>
            <div className="space-y-1 text-[11px] text-cyan-400/90">
              <div>• APOD (Astronomy Picture of the Day)</div>
              <div>• NeoWs (Near Earth Object Web Service)</div>
              <div>• DONKI (Space Weather Database)</div>
              <div>• NASA Image and Video Library</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            © 2026 NASA Space Apps Challenge Submission • Public Domain Space Science Education
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Scientifically Verified NASA Records</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
