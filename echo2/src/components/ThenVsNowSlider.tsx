import React, { useState, useRef } from 'react';
import { Calendar, Clock, Sliders, Sparkles, Layers, ShieldCheck, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface CompareItem {
  id: string;
  name: string;
  destination: string;
  launchYear: number;
  missionEndYear: number;
  currentYear: number;
  thenTitle: string;
  thenDesc: string;
  thenImg: string;
  nowTitle: string;
  nowDesc: string;
  nowImg: string;
  weatheringFactor: string;
  structuralIntegrity: string;
}

const COMPARISON_ITEMS: CompareItem[] = [
  {
    id: 'apollo-11',
    name: 'Apollo 11 Descent Stage',
    destination: 'Moon',
    launchYear: 1969,
    missionEndYear: 1969,
    currentYear: 2026,
    thenTitle: 'JULY 1969 • OPERATIONAL TOUCHDOWN',
    thenDesc: 'Pristine gold Kapton thermal blankets, shiny aluminum alloy struts, clean landing pads in untouched lunar regolith.',
    thenImg: 'https://images-assets.nasa.gov/image/as11-40-5927/as11-40-5927~orig.jpg',
    nowTitle: '2026 • 57 YEARS IN LUNAR VACUUM',
    nowDesc: 'Kapton foil browned and embrittled by intense solar ultraviolet radiation; descent engine bell coated in micrometeorite spallation.',
    nowImg: 'https://images-assets.nasa.gov/image/as11-40-5886/as11-40-5886~orig.jpg',
    weatheringFactor: 'Solar UV radiation, -130°C to +120°C thermal cycling, continuous micrometeorite impacts.',
    structuralIntegrity: '94% Intact (Descent chassis, leg struts, and MESA remain structurally sound).',
  },
  {
    id: 'surveyor-3',
    name: 'Surveyor 3 Robot Lander',
    destination: 'Moon',
    launchYear: 1967,
    missionEndYear: 1967,
    currentYear: 2026,
    thenTitle: 'APRIL 1967 • FRESH ROBOTIC SCOUT',
    thenDesc: 'Bright white painted tubular frame, functioning TV scanning mirror, solar panel deployed upward toward the sun.',
    thenImg: 'https://images-assets.nasa.gov/image/as12-48-7134/as12-48-7134~orig.jpg',
    nowTitle: '2026 • 59 YEARS RESTING IN CRATER',
    nowDesc: 'Surface discoloration confirmed by Apollo 12 astronauts; camera mirror scratched by lunar dust kicked up during landings.',
    nowImg: 'https://images-assets.nasa.gov/image/as12-48-7121/as12-48-7121~orig.jpg',
    weatheringFactor: 'Direct lunar solar wind bombardment, severe thermal expansion/contraction.',
    structuralIntegrity: '90% Intact (TV camera and sample scoop were retrieved and returned to Earth).',
  },
  {
    id: 'opportunity',
    name: 'Opportunity Rover (MER-B)',
    destination: 'Mars',
    launchYear: 2004,
    missionEndYear: 2018,
    currentYear: 2026,
    thenTitle: 'JANUARY 2004 • GLEAMING SOLAR WINGS',
    thenDesc: 'Dark purple silicon photovoltaic arrays generating over 900 watt-hours of electrical energy per Martian Sol.',
    thenImg: 'https://images-assets.nasa.gov/image/PIA05560/PIA05560~orig.jpg',
    nowTitle: '2026 • 22 YEARS IN MARTIAN DUST',
    nowDesc: 'Solar wings completely obscured by a thick blanket of reddish ferric iron dust; parked silently on the rim of Endeavour Crater.',
    nowImg: 'https://images-assets.nasa.gov/image/PIA22222/PIA22222~orig.jpg',
    weatheringFactor: 'Atmospheric dust deposition, global dust storms, -96°C nighttime cold.',
    structuralIntegrity: '98% Intact (Zero biological corrosion or rust, preserved indefinitely in dry CO₂).',
  },
  {
    id: 'insight',
    name: 'InSight Mars Lander',
    destination: 'Mars',
    launchYear: 2018,
    missionEndYear: 2022,
    currentYear: 2026,
    thenTitle: 'NOVEMBER 2018 • CLEAN SOLAR ARRAYS',
    thenDesc: 'Twin circular UltraFlex solar panels generating 5,000 watt-hours daily; pristine white SEIS dome deployed on the ground.',
    thenImg: 'https://images-assets.nasa.gov/image/PIA22872/PIA22872~orig.jpg',
    nowTitle: '2026 • DUST-COVERED QUIETUDE',
    nowDesc: 'Solar panels heavily coated with fine atmospheric silt; SEIS wind dome sits in quiet repose on the Elysium plain.',
    nowImg: 'https://images-assets.nasa.gov/image/PIA25622/PIA25622~orig.jpg',
    weatheringFactor: 'Dust fall rate of ~0.3% per Sol; loss of sunlight led to battery depletion.',
    structuralIntegrity: '99% Intact (All chassis components and robotic arm locked in place).',
  },
];

interface ThenVsNowSliderProps {
  initialItemId?: string;
}

export const ThenVsNowSlider: React.FC<ThenVsNowSliderProps> = ({ initialItemId = 'apollo-11' }) => {
  const [selectedId, setSelectedId] = useState<string>(initialItemId);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeItem = COMPARISON_ITEMS.find((c) => c.id === selectedId) || COMPARISON_ITEMS[0];
  const elapsedYears = activeItem.currentYear - activeItem.launchYear;

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = Math.round((x / rect.width) * 100);
    setSliderPosition(pct);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="w-full bg-[#030712] border border-cyan-950/90 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>THEN VS NOW • ARCHIVAL COMPARISON SLIDER</span>
          </div>
          <h3 className="font-['Rajdhani'] font-bold text-3xl sm:text-4xl text-white uppercase tracking-wide">
            THE TOLL OF EXTRATERRESTRIAL TIME
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Drag the divider to peel back decades of vacuum exposure, solar ultraviolet radiation, and Martian dust storms.
          </p>
        </div>

        {/* Spacecraft Picker Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {COMPARISON_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedId(item.id);
                setSliderPosition(50);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-mono whitespace-nowrap uppercase tracking-wider transition-all cursor-pointer ${
                selectedId === item.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.name.split('(')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Elapsed Years Counter Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#070e22] border border-cyan-900/40 rounded-2xl font-mono text-center">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block">LAUNCH YEAR</span>
          <span className="text-xl font-bold text-white">{activeItem.launchYear}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block">PRESENT YEAR</span>
          <span className="text-xl font-bold text-cyan-400">2026</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-amber-400 uppercase tracking-widest block">ELAPSED TIME</span>
          <span className="text-xl font-bold text-amber-300">{elapsedYears} YEARS</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest block">DESTINATION</span>
          <span className="text-xl font-bold text-emerald-300 uppercase">{activeItem.destination}</span>
        </div>
      </div>

      {/* Visual Interactive Split Slider Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            LEFT: {activeItem.thenTitle}
          </span>
          <span className="text-amber-400 font-bold flex items-center gap-1.5">
            RIGHT: {activeItem.nowTitle}
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </span>
        </div>

        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative w-full aspect-[16/9] max-h-[520px] rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl select-none cursor-ew-resize bg-black"
        >
          {/* RIGHT IMAGE (NOW / PRESENT DAY) */}
          <img
            src={activeItem.nowImg}
            alt={activeItem.nowTitle}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* LEFT IMAGE (THEN / DURING MISSION) - CLIPPED */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={activeItem.thenImg}
              alt={activeItem.thenTitle}
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                height: '100%',
              }}
            />
            {/* Left Badge Overlay */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase">
              THEN • OPERATIONAL
            </div>
          </div>

          {/* Right Badge Overlay */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/50 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
            NOW • PRESENT REST
          </div>

          {/* Divider Bar & Drag Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 shadow-[0_0_15px_#06b6d4] z-20 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#030712] border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_#06b6d4]">
              <Sliders className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>

        {/* Range Scrubber Below */}
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>OPERATIONAL ERA ({activeItem.launchYear})</span>
            <span className="text-cyan-400 font-bold">SLIDE TO REVEAL TIME LAPSE: {sliderPosition}%</span>
            <span>PRESENT DAY ({activeItem.currentYear})</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Weathering & Structural Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="bg-[#070e22] border border-cyan-900/40 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block">
            THEN: MISSION AT ITS PEAK
          </span>
          <p className="text-sm text-slate-300 leading-relaxed">
            {activeItem.thenDesc}
          </p>
          <div className="pt-2 text-xs font-mono text-slate-400">
            Structural Condition: <span className="text-emerald-400 font-bold">100% Factory Specification</span>
          </div>
        </div>

        <div className="bg-[#070e22] border border-amber-900/40 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
            NOW: {elapsedYears} YEARS LATER
          </span>
          <p className="text-sm text-slate-300 leading-relaxed">
            {activeItem.nowDesc}
          </p>
          <div className="pt-2 text-xs font-mono text-slate-400">
            Primary Weathering Factor: <span className="text-amber-300">{activeItem.weatheringFactor}</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Preservation Estimate: <span className="text-cyan-300 font-bold">{activeItem.structuralIntegrity}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
