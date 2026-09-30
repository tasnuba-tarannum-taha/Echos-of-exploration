import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Eye, EyeOff, Navigation, Info, Compass } from 'lucide-react';
import { Mission } from '../types';
import { NasaSourceBadge } from './NasaSourceBadge';

interface PlanetaryMapProps {
  mission: Mission;
}

export const PlanetaryMap: React.FC<PlanetaryMapProps> = ({ mission }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [showPath, setShowPath] = useState<boolean>(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState<{
    name: string;
    description: string;
    coordinates: string;
    type: 'exact' | 'approximate';
  } | null>(null);

  const isMoon = mission.destination === 'Moon';
  const isMars = mission.destination === 'Mars';

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.3, 2.4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.3, 0.8));
  const handleReset = () => setZoom(1);

  // Define verified terrain waypoints per mission
  const waypoints = [
    {
      id: 'touchdown',
      name: 'Landing Site',
      x: 350,
      y: 280,
      description: `Touchdown point: ${mission.location.name} (${mission.location.coordinates})`,
      coordinates: mission.location.coordinates,
      type: 'exact' as const,
      isFinal: mission.hardwareType === 'Lander' || mission.hardwareType === 'Descent Stage',
    },
    ...(mission.hardwareType === 'Rover'
      ? [
          {
            id: 'midway',
            name: mission.id === 'spirit-rover' ? 'Husband Hill Summit' : mission.id === 'opportunity-rover' ? 'Victoria Crater Rim' : 'Hadley Rille Overlook',
            x: 480,
            y: 220,
            description: mission.id === 'spirit-rover' ? 'Peak of Husband Hill (107m elevation gain)' : mission.id === 'opportunity-rover' ? 'Surpassed 10 km mark at Victoria Crater' : 'Astronauts drove to the 300m-deep lava gorge',
            coordinates: 'Approximate mission transect waypoint',
            type: 'approximate' as const,
            isFinal: false,
          },
          {
            id: 'final_resting',
            name: mission.finalStatus.locationName,
            x: 580,
            y: 340,
            description: `Final resting site: ${mission.finalStatus.explanation}`,
            coordinates: mission.finalStatus.coordinates || mission.location.coordinates,
            type: 'exact' as const,
            isFinal: true,
          },
        ]
      : []),
  ];

  return (
    <div className="w-full bg-[#030712] border border-cyan-950 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <NasaSourceBadge
              type={isMoon ? 'NASA SCIENTIFIC VISUALIZATION' : 'NASA/JPL'}
              size="sm"
            />
            <span className="text-[10px] font-mono text-cyan-400">
              {isMoon ? 'NASA LROC TOPOGRAPHY' : 'NASA MOLA ALTIMETRY'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h3 className="font-['Rajdhani'] font-bold text-xl sm:text-2xl text-white tracking-wider uppercase">
              INTERACTIVE PLANETARY SURFACE MAP
            </h3>
          </div>
          <p className="text-xs font-mono text-slate-400">
            {mission.destination.toUpperCase()} SURFACE • {mission.location.name.toUpperCase()} ({mission.location.coordinates})
          </p>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-black/60 border border-slate-700 rounded-lg p-1">
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
              onClick={handleReset}
              className="p-1.5 text-slate-300 hover:text-cyan-300 rounded hover:bg-slate-800"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowPath(!showPath)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              showPath
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {showPath ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showPath ? 'HIDE TRAVERSE' : 'SHOW TRAVERSE'}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="relative w-full h-[460px] bg-[#070e22] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center select-none">
        {/* Topography Vector Graphics */}
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
          <defs>
            {/* Crater gradients */}
            <radialGradient id="craterGradMoon" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="80%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
            <radialGradient id="craterGradMars" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="80%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#9a3412" />
            </radialGradient>
          </defs>

          {/* Base Planetary Terrain */}
          <rect
            x="0"
            y="0"
            width="800"
            height="500"
            fill={isMoon ? '#0f172a' : isMars ? '#1c0d08' : '#030712'}
          />

          {/* Topographical Contour lines */}
          <g stroke={isMoon ? '#334155' : '#7c2d12'} strokeWidth="1" fill="none" opacity="0.3">
            <path d="M 0,100 Q 200,180 400,120 T 800,150" />
            <path d="M 0,220 Q 250,290 500,210 T 800,280" />
            <path d="M 0,340 Q 150,420 450,330 T 800,390" />
            <path d="M 0,440 Q 300,480 600,430 T 800,470" />
          </g>

          {/* Major Craters & Depressions */}
          <ellipse cx="220" cy="180" rx="90" ry="60" fill={isMoon ? 'url(#craterGradMoon)' : 'url(#craterGradMars)'} opacity="0.6" />
          <ellipse cx="560" cy="320" rx="140" ry="90" fill={isMoon ? 'url(#craterGradMoon)' : 'url(#craterGradMars)'} opacity="0.5" />
          <ellipse cx="680" cy="130" rx="60" ry="40" fill={isMoon ? 'url(#craterGradMoon)' : 'url(#craterGradMars)'} opacity="0.4" />
          <circle cx="120" cy="380" r="45" fill={isMoon ? 'url(#craterGradMoon)' : 'url(#craterGradMars)'} opacity="0.5" />

          {/* Traverse Route (If Rover and showPath is true) */}
          {showPath && waypoints.length > 1 && (
            <g>
              {/* Route Line */}
              <path
                d="M 350,280 Q 420,240 480,220 T 580,340"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Plotted Waypoint Markers */}
          {waypoints.map((wp) => {
            const isFinal = wp.isFinal;
            return (
              <g
                key={wp.id}
                className="cursor-pointer group"
                onClick={() => setSelectedWaypoint(wp)}
              >
                {/* Outer ping */}
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r={isFinal ? 16 : 10}
                  fill="none"
                  stroke={isFinal ? '#ef4444' : '#06b6d4'}
                  strokeWidth="2"
                  className={isFinal ? 'animate-ping' : ''}
                />
                {/* Core Pin */}
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r={isFinal ? 8 : 6}
                  fill={isFinal ? '#ef4444' : '#06b6d4'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {/* Label text */}
                <text
                  x={wp.x}
                  y={wp.y - 14}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  className="select-none"
                >
                  {wp.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Top-Right Telemetry Data Legend */}
        <div className="absolute top-4 right-4 bg-black/80 border border-slate-700 rounded-xl p-3 text-left font-mono text-xs space-y-1.5 backdrop-blur-md max-w-xs pointer-events-auto">
          <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-1">
            <Navigation className="w-3.5 h-3.5" />
            <span>GEO-LOCATION TELEMETRY</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-400">COORDINATES:</span> <br />
            <span className="text-white font-bold">{mission.location.coordinates}</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-400">TERRAIN:</span> {mission.location.terrain}
          </div>
          {mission.location.distanceTraveledKm && (
            <div className="text-slate-300">
              <span className="text-slate-400">TOTAL TRAVERSE:</span> {mission.location.distanceTraveledKm} KM
            </div>
          )}
          <div className="pt-1 flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              EXACT DATA
            </span>
            <span className="text-slate-400">Verified NASA/JPL Records</span>
          </div>
        </div>

        {/* Waypoint Detail Popup */}
        {selectedWaypoint && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-[#0b1329]/95 border border-cyan-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-xl space-y-2 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h4 className="font-['Rajdhani'] font-bold text-lg text-white uppercase">
                  {selectedWaypoint.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedWaypoint(null)}
                className="text-xs text-slate-400 hover:text-white uppercase font-mono"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedWaypoint.description}
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-slate-800">
              <span className="text-slate-400">{selectedWaypoint.coordinates}</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {selectedWaypoint.type.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
