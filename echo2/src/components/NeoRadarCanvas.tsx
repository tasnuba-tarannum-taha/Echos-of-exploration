import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck, Compass, Info, ExternalLink } from 'lucide-react';
import { NeoData } from '../types';
import { NasaSourceBadge } from './NasaSourceBadge';

interface NeoRadarCanvasProps {
  neos: NeoData[];
  onSelectNeo?: (neo: NeoData) => void;
  className?: string;
}

export const NeoRadarCanvas: React.FC<NeoRadarCanvasProps> = ({
  neos,
  onSelectNeo,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNeo, setSelectedNeo] = useState<NeoData | null>(neos[0] || null);
  const [hoveredNeo, setHoveredNeo] = useState<NeoData | null>(null);

  useEffect(() => {
    if (neos.length > 0 && !selectedNeo) {
      setSelectedNeo(neos[0]);
    }
  }, [neos, selectedNeo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angleOffset = 0;

    const render = () => {
      angleOffset += 0.003;
      const w = (canvas.width = canvas.clientWidth);
      const h = (canvas.height = canvas.clientHeight);
      const cx = w / 2;
      const cy = h / 2;
      const maxRadarRadius = Math.min(cx, cy) * 0.88;

      ctx.clearRect(0, 0, w, h);

      // Deep Space radar sweep gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadarRadius);
      bgGrad.addColorStop(0, '#030816');
      bgGrad.addColorStop(0.6, '#02050f');
      bgGrad.addColorStop(1, '#000206');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Radar Grid Circles (Lunar Distance multipliers)
      const ldRings = [
        { mult: 0.25, label: '1 LD (384,400 KM)' },
        { mult: 0.5, label: '5 LD (1.92M KM)' },
        { mult: 0.75, label: '10 LD (3.84M KM)' },
        { mult: 1.0, label: '20 LD (7.68M KM)' },
      ];

      ctx.lineWidth = 1;
      ldRings.forEach((ring) => {
        const r = maxRadarRadius * ring.mult;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.font = '10px monospace';
        ctx.fillText(ring.label, cx + 6, cy - r + 12);
      });
      ctx.setLineDash([]);

      // Radar Crosshairs
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx - maxRadarRadius, cy);
      ctx.lineTo(cx + maxRadarRadius, cy);
      ctx.moveTo(cx, cy - maxRadarRadius);
      ctx.lineTo(cx, cy + maxRadarRadius);
      ctx.stroke();

      // Radar Sweep Line
      const sweepAngle = angleOffset * 2.5;
      const sweepX = cx + Math.cos(sweepAngle) * maxRadarRadius;
      const sweepY = cy + Math.sin(sweepAngle) * maxRadarRadius;
      const sweepGrad = ctx.createLinearGradient(cx, cy, sweepX, sweepY);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.strokeStyle = sweepGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Center: Earth Sphere
      const earthRadius = 14;
      const earthGrad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, earthRadius);
      earthGrad.addColorStop(0, '#38bdf8');
      earthGrad.addColorStop(0.5, '#0284c7');
      earthGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2);
      ctx.fill();

      // Earth Glow
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, earthRadius + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EARTH', cx, cy + 24);

      // Render Asteroid Positions & Orbit Trajectories
      neos.forEach((neo, idx) => {
        // Distance normalized: max miss distance is around 25M km
        const missDistKm = parseFloat(neo.missDistanceKm) || 5000000;
        const normalizedDist = Math.min(0.95, Math.max(0.2, missDistKm / 28000000));
        const orbitR = maxRadarRadius * normalizedDist;

        // Orbital angle calculation
        const baseAngle = (idx * (Math.PI * 2) / Math.max(1, neos.length)) + angleOffset * 0.4;
        const ax = cx + Math.cos(baseAngle) * orbitR;
        const ay = cy + Math.sin(baseAngle) * orbitR;

        const isSelected = selectedNeo?.id === neo.id;
        const isHazardous = neo.isPotentiallyHazardous;

        // Elliptical trajectory segment
        ctx.strokeStyle = isSelected
          ? 'rgba(6, 182, 212, 0.7)'
          : isHazardous
          ? 'rgba(239, 68, 68, 0.25)'
          : 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.setLineDash(isSelected ? [4, 4] : [2, 4]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, orbitR, orbitR * 0.85, baseAngle * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Velocity vector arrow
        const velKmH = parseFloat(neo.relativeVelocityKmh) || 35000;
        const vecLen = Math.min(24, Math.max(10, (velKmH / 100000) * 25));
        const velAngle = baseAngle + Math.PI / 2;
        ctx.strokeStyle = isHazardous ? '#f87171' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + Math.cos(velAngle) * vecLen, ay + Math.sin(velAngle) * vecLen);
        ctx.stroke();

        // Asteroid Beacon
        const dotRadius = isSelected ? 6 : Math.max(3.5, Math.min(8, (neo.estimatedDiameterMeters.max / 150) * 4));
        ctx.fillStyle = isHazardous ? '#ef4444' : isSelected ? '#06b6d4' : '#cbd5e1';
        ctx.beginPath();
        ctx.arc(ax, ay, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pulse ring for hazardous or selected
        if (isHazardous || isSelected) {
          const pulseR = dotRadius + (Math.sin(angleOffset * 8 + idx) * 4 + 4);
          ctx.strokeStyle = isHazardous ? 'rgba(239, 68, 68, 0.6)' : 'rgba(6, 182, 212, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ax, ay, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Asteroid Label
        ctx.fillStyle = isSelected ? '#38bdf8' : isHazardous ? '#fca5a5' : '#94a3b8';
        ctx.font = isSelected ? 'bold 11px monospace' : '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(neo.name.replace(/[()]/g, ''), ax + dotRadius + 4, ay + 3);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [neos, selectedNeo]);

  return (
    <div className={`flex flex-col lg:flex-row gap-6 bg-[#040816] border border-cyan-950 rounded-2xl p-4 sm:p-6 shadow-2xl ${className}`}>
      {/* Interactive Radar Screen Stage */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] rounded-xl overflow-hidden border border-cyan-500/30 bg-black flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full absolute inset-0 cursor-crosshair" />

        {/* Top Badges per strict Prompt rules */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap pointer-events-none">
          <NasaSourceBadge type="NASA LIVE DATA" size="sm" />
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/90 text-amber-300 border border-amber-500/40">
            VISUALIZATION — NOT TO SCALE
          </span>
        </div>

        {/* Center Orientation Tag */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase bg-black/70 px-2 py-1 rounded border border-slate-800">
            RADAR COVERAGE: 20 LUNAR DISTANCES (~7.68M KM)
          </span>
        </div>
      </div>

      {/* Selected Asteroid Telemetry Dossier */}
      {selectedNeo && (
        <div className="w-full lg:w-80 bg-[#070e24] border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                TARGET TELEMETRY
              </span>
              {selectedNeo.isPotentiallyHazardous ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  HAZARDOUS
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  SAFE PASSAGE
                </span>
              )}
            </div>

            <div>
              <h4 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase">
                {selectedNeo.name}
              </h4>
              <p className="text-[11px] font-mono text-slate-400">
                NASA JPL Small-Body Database ID: {selectedNeo.id}
              </p>
            </div>

            {/* Spec breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>CLOSE APPROACH:</span>
                <span className="text-white font-bold">{selectedNeo.closeApproachDate}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>MISS DISTANCE:</span>
                <span className="text-cyan-300 font-bold">
                  {Number(selectedNeo.missDistanceKm).toLocaleString()} KM
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RELATIVE VELOCITY:</span>
                <span className="text-amber-300 font-bold">
                  {Number(selectedNeo.relativeVelocityKmh).toLocaleString()} KM/H
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>EST. DIAMETER:</span>
                <span className="text-emerald-300 font-bold">
                  {selectedNeo.estimatedDiameterMeters.min} - {selectedNeo.estimatedDiameterMeters.max} M
                </span>
              </div>
            </div>

            {/* Scale Indicator Comparison */}
            <div className="p-3 rounded-lg bg-black/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                DIAMETER SCALE COMPARISON
              </span>
              <p className="text-xs text-slate-300">
                {selectedNeo.estimatedDiameterMeters.max > 300
                  ? 'Equivalent to the height of the Eiffel Tower or Empire State Building.'
                  : selectedNeo.estimatedDiameterMeters.max > 80
                  ? 'Equivalent to a football stadium or commercial jetliner.'
                  : 'Equivalent to a passenger bus; would disintegrate in Earth’s upper atmosphere as a bolide.'}
              </p>
            </div>
          </div>

          {/* Asteroid Selector List */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              TRACK OTHER TARGETS ({neos.length})
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {neos.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNeo(n)}
                  className={`px-2 py-1 rounded text-[10px] font-mono uppercase whitespace-nowrap transition-colors border ${
                    selectedNeo.id === n.id
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {n.name.replace(/[()]/g, '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
