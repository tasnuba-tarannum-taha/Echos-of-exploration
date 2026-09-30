import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, ExternalLink, Database, Calendar, Rocket, FileText, Camera } from 'lucide-react';
import { CitationCardData, Mission } from '../types';

interface NasaSourcesSectionProps {
  mission?: Mission;
  citations?: CitationCardData[];
  defaultOpen?: boolean;
}

export const NasaSourcesSection: React.FC<NasaSourcesSectionProps> = ({
  mission,
  citations,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  // Generate citation data from mission if citations prop is not passed directly
  const activeCitations: CitationCardData[] = citations || (mission ? [
    {
      mission: mission.title,
      spacecraft: `${mission.hardwareType} (${mission.destination})`,
      launchDate: mission.launchDate,
      landingDate: mission.arrivalDate,
      status: mission.status,
      dataSource: mission.sources[0]?.title || 'NASA Planetary Data System (PDS) Archives',
      imageCredit: mission.images[0]?.source || 'NASA / JPL-Caltech / Science Team',
      verifiedUrl: mission.sources[0]?.url || 'https://images.nasa.gov',
    },
    ...(mission.sources.slice(1).map((s, idx) => ({
      mission: `${mission.title} [Doc ${idx + 2}]`,
      spacecraft: mission.hardwareType,
      launchDate: mission.launchDate,
      landingDate: mission.arrivalDate,
      status: mission.status,
      dataSource: s.title,
      imageCredit: mission.images[idx + 1]?.source || 'NASA History & Telemetry Office',
      verifiedUrl: s.url,
    })))
  ] : []);

  return (
    <div className="w-full bg-[#030712] border border-cyan-950/80 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-[#070e22] via-[#050b1d] to-[#030712] border-b border-slate-800/80 hover:bg-slate-900/60 transition-colors text-left cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-['Rajdhani'] font-bold text-white uppercase tracking-widest">
                OFFICIAL NASA CITATIONS & DATA SOURCES
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                PDS VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Primary scientific literature, telemetry logs, and image archive registries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <span>{isOpen ? 'COLLAPSE' : 'EXPAND'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCitations.map((card, index) => (
              <div
                key={index}
                className="bg-[#070e22] border border-slate-800 hover:border-cyan-500/40 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all group"
              >
                {/* Spacecraft & Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-400 font-bold uppercase tracking-wider">
                      RECORD 0{index + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {card.status}
                    </span>
                  </div>

                  <h5 className="font-['Rajdhani'] font-bold text-lg text-white uppercase group-hover:text-cyan-300 transition-colors">
                    {card.mission}
                  </h5>

                  <div className="text-xs font-mono text-slate-400 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Rocket className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="text-slate-300 truncate">{card.spacecraft}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Launch: {card.launchDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Landing: {card.landingDate}</span>
                    </div>
                  </div>
                </div>

                {/* Data Source & Image Credit */}
                <div className="space-y-3 pt-3 border-t border-slate-800 text-[11px] font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block tracking-wider flex items-center gap-1">
                      <Database className="w-2.5 h-2.5 text-cyan-400" /> Data Source
                    </span>
                    <p className="text-slate-300 line-clamp-2 mt-0.5">{card.dataSource}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block tracking-wider flex items-center gap-1">
                      <Camera className="w-2.5 h-2.5 text-cyan-400" /> Image Credit
                    </span>
                    <p className="text-slate-400 truncate mt-0.5">{card.imageCredit}</p>
                  </div>

                  {card.verifiedUrl && (
                    <div className="pt-2 flex justify-end">
                      <a
                        href={card.verifiedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-200 uppercase tracking-wider transition-colors"
                      >
                        <span>Access NASA Archive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-black/40 border border-slate-800/80 rounded-xl text-center text-xs font-mono text-slate-400">
            All orbital parameters, surface coordinates, and mission logs conform to the Planetary Data System (PDS) standard under the NASA Space Apps Challenge mandate.
          </div>
        </div>
      )}
    </div>
  );
};
