import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, Sparkles, CheckCircle2, Info, ChevronRight, Layers } from 'lucide-react';
import { HardwareComponent, Mission } from '../types';

interface HardwareInspectorProps {
  mission: Mission;
  inspectedComponents: string[];
  onInspect: (componentId: string) => void;
}

export const HardwareInspector: React.FC<HardwareInspectorProps> = ({
  mission,
  inspectedComponents,
  onInspect,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<HardwareComponent | null>(
    mission.hardwareComponents[0] || null
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(mission.hardwareComponents.map((c) => c.category)))];

  const handleSelectComponent = (comp: HardwareComponent) => {
    setSelectedComponent(comp);
    onInspect(comp.id);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  // SVG Renderers tailored to hardware type
  const renderHardwareSvg = () => {
    const isRover = mission.hardwareType === 'Rover';
    const isLander = mission.hardwareType === 'Lander';
    const isDescent = mission.hardwareType === 'Descent Stage';
    const isSpacecraft = mission.hardwareType === 'Spacecraft Probe';

    return (
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full select-none transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <defs>
          <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="goldFoil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Grid Lines */}
        <g stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" opacity="0.4">
          <line x1="100" y1="50" x2="100" y2="550" />
          <line x1="250" y1="50" x2="250" y2="550" />
          <line x1="400" y1="50" x2="400" y2="550" />
          <line x1="550" y1="50" x2="550" y2="550" />
          <line x1="700" y1="50" x2="700" y2="550" />
          <line x1="50" y1="150" x2="750" y2="150" />
          <line x1="50" y1="300" x2="750" y2="300" />
          <line x1="50" y1="450" x2="750" y2="450" />
        </g>

        {/* Hardware Schematic Drawing */}
        {isDescent && (
          // Apollo Lunar Module Descent Stage
          <g transform="translate(150, 80)">
            {/* Landing legs */}
            <line x1="100" y1="350" x2="30" y2="460" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
            <line x1="400" y1="350" x2="470" y2="460" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
            <line x1="250" y1="350" x2="250" y2="470" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" />
            {/* Footpads */}
            <ellipse cx="30" cy="465" rx="35" ry="8" fill="#64748b" stroke="#38bdf8" strokeWidth="2" />
            <ellipse cx="470" cy="465" rx="35" ry="8" fill="#64748b" stroke="#38bdf8" strokeWidth="2" />
            <ellipse cx="250" cy="475" rx="40" ry="10" fill="#64748b" stroke="#38bdf8" strokeWidth="2" />
            {/* Octagonal chassis coated in gold kapton */}
            <polygon points="120,200 380,200 450,280 430,360 70,360 50,280" fill="url(#goldFoil)" stroke="#f59e0b" strokeWidth="3" />
            {/* Central Descent Engine Bell */}
            <polygon points="210,360 290,360 320,430 180,430" fill="url(#metalGrad)" stroke="#38bdf8" strokeWidth="2" />
            {/* MESA bay */}
            <rect x="290" y="240" width="80" height="70" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
            {/* Plaque on ladder leg */}
            <rect x="235" y="270" width="30" height="25" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
          </g>
        )}

        {isRover && (
          // Spirit / Opportunity / LRV Rover Schematic
          <g transform="translate(100, 60)">
            {/* Solar arrays */}
            <polygon points="180,220 420,220 520,300 80,300" fill="url(#solarGrad)" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Mast */}
            <line x1="300" y1="220" x2="300" y2="100" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
            {/* Pancam head */}
            <rect x="270" y="70" width="60" height="30" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="285" cy="85" r="7" fill="#06b6d4" />
            <circle cx="315" cy="85" r="7" fill="#06b6d4" />
            {/* Rocker-Bogie Legs */}
            <polyline points="200,320 150,380 90,440" stroke="#cbd5e1" strokeWidth="8" fill="none" strokeLinecap="round" />
            <polyline points="400,320 450,380 510,440" stroke="#cbd5e1" strokeWidth="8" fill="none" strokeLinecap="round" />
            <polyline points="300,320 300,440" stroke="#cbd5e1" strokeWidth="8" fill="none" strokeLinecap="round" />
            {/* Wheels */}
            <circle cx="90" cy="440" r="28" fill="url(#metalGrad)" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="300" cy="440" r="28" fill="url(#metalGrad)" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="510" cy="440" r="28" fill="url(#metalGrad)" stroke="#f59e0b" strokeWidth="2.5" />
            {/* Robotic IDD Arm */}
            <polyline points="200,310 140,340 100,380 130,410" stroke="#94a3b8" strokeWidth="7" fill="none" strokeLinecap="round" />
            <circle cx="130" cy="410" r="12" fill="#e2e8f0" stroke="#06b6d4" strokeWidth="2" />
            {/* High Gain Antenna Dish */}
            <ellipse cx="420" cy="180" rx="35" ry="15" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
          </g>
        )}

        {isLander && (
          // InSight / Surveyor Lander Schematic
          <g transform="translate(120, 60)">
            {/* Tripod or landing legs */}
            <line x1="200" y1="360" x2="80" y2="470" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
            <line x1="360" y1="360" x2="480" y2="470" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
            <ellipse cx="80" cy="475" rx="30" ry="8" fill="#64748b" stroke="#38bdf8" strokeWidth="2" />
            <ellipse cx="480" cy="475" rx="30" ry="8" fill="#64748b" stroke="#38bdf8" strokeWidth="2" />
            {/* Lander main deck */}
            <rect x="180" y="280" width="200" height="80" rx="10" fill="url(#metalGrad)" stroke="#94a3b8" strokeWidth="3" />
            {/* Circular UltraFlex Solar Panels */}
            <circle cx="90" cy="280" r="70" fill="url(#solarGrad)" stroke="#38bdf8" strokeWidth="2.5" opacity="0.9" />
            <circle cx="470" cy="280" r="70" fill="url(#solarGrad)" stroke="#38bdf8" strokeWidth="2.5" opacity="0.9" />
            {/* SEIS Seismometer Dome on surface */}
            <ellipse cx="280" cy="460" rx="35" ry="20" fill="#f8fafc" stroke="#f59e0b" strokeWidth="2.5" />
            {/* Tether cable */}
            <path d="M 280,360 Q 260,410 280,440" stroke="#f59e0b" strokeWidth="3" fill="none" strokeDasharray="3 3" />
            {/* Robotic Arm */}
            <polyline points="220,280 180,210 250,180" stroke="#94a3b8" strokeWidth="7" fill="none" strokeLinecap="round" />
          </g>
        )}

        {isSpacecraft && (
          // Voyager / Pioneer Interstellar Spacecraft Probe
          <g transform="translate(120, 60)">
            {/* Large 3.7m Parabolic Dish */}
            <ellipse cx="280" cy="180" rx="190" ry="60" fill="url(#metalGrad)" stroke="#38bdf8" strokeWidth="3" />
            <ellipse cx="280" cy="180" rx="140" ry="40" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <circle cx="280" cy="180" r="22" fill="#0284c7" />
            {/* Feed horn tripod */}
            <line x1="280" y1="180" x2="280" y2="70" stroke="#cbd5e1" strokeWidth="5" />
            {/* Spacecraft bus decagon */}
            <polygon points="200,240 360,240 380,340 180,340" fill="#0f172a" stroke="#94a3b8" strokeWidth="3" />
            {/* Golden Record on probe flank */}
            <circle cx="340" cy="360" r="32" fill="url(#goldFoil)" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="340" cy="360" r="5" fill="#000" />
            {/* RTG Plutonium Boom */}
            <line x1="180" y1="280" x2="50" y2="340" stroke="#94a3b8" strokeWidth="7" />
            <rect x="20" y="320" width="45" height="50" fill="#475569" stroke="#f59e0b" strokeWidth="2" />
          </g>
        )}

        {/* Hotspot Pins mapped to coordinates */}
        {mission.hardwareComponents.map((comp) => {
          if (selectedCategory !== 'All' && comp.category !== selectedCategory) return null;

          const isInspected = inspectedComponents.includes(comp.id);
          const isSelected = selectedComponent?.id === comp.id;

          // Convert percentage coordinates to 800x600 viewBox
          const pinX = (comp.position.x / 100) * 800;
          const pinY = (comp.position.y / 100) * 600;

          return (
            <g
              key={comp.id}
              className="cursor-pointer group"
              onClick={() => handleSelectComponent(comp)}
            >
              {/* Outer pulsing ping */}
              <circle
                cx={pinX}
                cy={pinY}
                r={isSelected ? 18 : 12}
                fill="none"
                stroke={isSelected ? '#06b6d4' : isInspected ? '#10b981' : '#f59e0b'}
                strokeWidth={isSelected ? 3 : 1.5}
                className={isSelected ? 'animate-ping' : ''}
                opacity={isSelected ? 0.8 : 0.5}
              />
              {/* Core Pin */}
              <circle
                cx={pinX}
                cy={pinY}
                r={8}
                fill={isSelected ? '#06b6d4' : isInspected ? '#10b981' : '#f59e0b'}
                filter="url(#glow)"
              />
              {/* Pin inner indicator */}
              <circle cx={pinX} cy={pinY} r={3} fill="#ffffff" />

              {/* Pin Label Tag */}
              <text
                x={pinX + 14}
                y={pinY + 4}
                fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                fontSize="12"
                fontFamily="JetBrains Mono, monospace"
                fontWeight={isSelected ? 'bold' : 'normal'}
                className="select-none"
              >
                {comp.name}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="w-full bg-[#030712] border border-cyan-950 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="font-['Rajdhani'] font-bold text-xl sm:text-2xl text-white tracking-wider uppercase">
            HARDWARE INSPECTOR: {mission.title}
          </h3>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Multi-column Inspector Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[460px]">
        {/* Left / Center: Interactive SVG Schematic Stage */}
        <div className="lg:col-span-7 relative bg-[#070e22] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {/* Zoom Toolbar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/70 border border-slate-700 rounded-lg p-1 backdrop-blur-md">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-cyan-300 rounded hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-cyan-300 rounded hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-300 hover:text-cyan-300 rounded hover:bg-slate-800"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-cyan-400 px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          {/* Interactive Schematic SVG */}
          <div className="w-full h-full max-h-[500px] flex items-center justify-center">
            {renderHardwareSvg()}
          </div>

          {/* Disclaimer badge */}
          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-400 bg-black/80 px-2.5 py-1 rounded border border-slate-800">
            INTERACTIVE SCHEMATIC VISUALIZATION
          </div>
        </div>

        {/* Right Column: Selected Component Dossier */}
        <div className="lg:col-span-5 bg-[#070e22] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
          {selectedComponent ? (
            <div className="space-y-6">
              {/* Component Title & Category */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800">
                    {selectedComponent.category}
                  </span>
                  {inspectedComponents.includes(selectedComponent.id) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      INSPECTED (+25 XP)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      CLICK TO INSPECT
                    </span>
                  )}
                </div>
                <h4 className="font-['Rajdhani'] font-bold text-2xl text-white tracking-wide uppercase">
                  {selectedComponent.name}
                </h4>
              </div>

              {/* Three Core Questions Required by Prompt */}
              <div className="space-y-4">
                {/* 1. What is this? */}
                <div className="space-y-1">
                  <h5 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    WHAT IS THIS?
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-3 border-l border-cyan-900/60">
                    {selectedComponent.whatIsThis}
                  </p>
                </div>

                {/* 2. How did it work? */}
                <div className="space-y-1">
                  <h5 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    HOW DID IT WORK?
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-3 border-l border-amber-900/60">
                    {selectedComponent.howItWorked}
                  </p>
                </div>

                {/* 3. Why was it important? */}
                <div className="space-y-1">
                  <h5 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    WHY WAS IT IMPORTANT?
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-3 border-l border-emerald-900/60">
                    {selectedComponent.whyImportant}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-6 text-slate-400">
              <p className="text-sm">Click any component pin on the schematic to inspect its engineering design and science impact.</p>
            </div>
          )}

          {/* Component Selector List */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              SELECT COMPONENT TO FOCUS:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {mission.hardwareComponents.map((comp) => {
                const isSelected = selectedComponent?.id === comp.id;
                const isDone = inspectedComponents.includes(comp.id);
                return (
                  <button
                    key={comp.id}
                    onClick={() => handleSelectComponent(comp)}
                    className={`text-left p-2 rounded-lg text-xs font-mono truncate transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60'
                        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{comp.name}</span>
                      {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
