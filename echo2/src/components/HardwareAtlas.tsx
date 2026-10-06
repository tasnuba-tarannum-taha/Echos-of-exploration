import React, { useState, useRef } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Rocket,
  Info,
  ChevronRight,
  X,
  Globe2,
  Move,
  Navigation,
} from 'lucide-react';
import { ATLAS_HARDWARE_ITEMS } from '../data/atlasHardware';
import { AtlasHardwareItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { audioService } from '../services/audioService';

import moonBasemap from '../assets/images/nasa_moon_basemap_1789815744261.jpg';
import marsBasemap from '../assets/images/nasa_mars_basemap_1789815759718.jpg';

interface HardwareAtlasProps {
  onSelectMission?: (missionId: string) => void;
  onOpenEcho?: (prompt: string) => void;
}

export const HardwareAtlas: React.FC<HardwareAtlasProps> = ({
  onSelectMission,
  onOpenEcho,
}) => {
  const [activeBody, setActiveBody] = useState<'Moon' | 'Mars'>('Moon');
  const [selectedHardware, setSelectedHardware] = useState<AtlasHardwareItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const filteredItems = ATLAS_HARDWARE_ITEMS.filter((item) => item.destination === activeBody);

  // Convert lat (-90 to +90) and lng (-180 to +180) into map coordinates % (0 to 100)
  const getCoordinatesPct = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return {
      x: Math.max(3, Math.min(97, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  /**
   * Smooth fly-to marker centering
   */
  const handleSelectMarker = (item: AtlasHardwareItem) => {
    audioService.playTelemetryPing();
    setSelectedHardware(item);

    const coords = getCoordinatesPct(item.lat, item.lng);
    const newZoom = Math.max(zoomLevel, 1.8);
    setZoomLevel(newZoom);

    // Smoothly pan so the marker centers in the viewport
    const container = mapContainerRef.current;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const targetX = ((50 - coords.x) / 100) * containerWidth * newZoom;
      const targetY = ((50 - coords.y) / 100) * containerHeight * newZoom;
      setPanOffset({
        x: Math.max(-containerWidth * 0.8, Math.min(containerWidth * 0.8, targetX)),
        y: Math.max(-containerHeight * 0.8, Math.min(containerHeight * 0.8, targetY)),
      });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.4, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.4, 0.9));
  };

  const handleResetView = () => {
    setZoomLevel(1.2);
    setPanOffset({ x: 0, y: 0 });
    setSelectedHardware(null);
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // Calculate approximate Lat/Lng from mouse position
      const pctX = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
      const pctY = Math.max(0, Math.min(100, (mouseY / rect.height) * 100));
      const lng = (pctX / 100) * 360 - 180;
      const lat = 90 - (pctY / 100) * 180;
      setCursorCoords({ lat: parseFloat(lat.toFixed(2)), lng: parseFloat(lng.toFixed(2)) });
    }

    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>AUTHENTIC NASA PLANETARY ATLAS</span>
          </div>
          <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-5xl text-white tracking-wider uppercase">
            EXTRATERRESTRIAL HARDWARE ATLAS
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Inspect monumental NASA spacecraft, rovers, and descent stages on authentic high-resolution NASA global planetary surface basemaps.
          </p>
        </div>

        {/* Moon / Mars Toggle Buttons */}
        <div className="flex items-center gap-2 bg-[#070e22] border border-slate-700/80 p-1.5 rounded-2xl shrink-0">
          <button
            id="atlas-tab-moon-btn"
            onClick={() => {
              audioService.playTelemetryPing();
              setActiveBody('Moon');
              setSelectedHardware(null);
              setZoomLevel(1.2);
              setPanOffset({ x: 0, y: 0 });
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              activeBody === 'Moon'
                ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-black shadow-[0_0_20px_rgba(255,255,255,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-slate-300 border border-white" />
            <span>THE MOON ({ATLAS_HARDWARE_ITEMS.filter((i) => i.destination === 'Moon').length})</span>
          </button>

          <button
            id="atlas-tab-mars-btn"
            onClick={() => {
              audioService.playTelemetryPing();
              setActiveBody('Mars');
              setSelectedHardware(null);
              setZoomLevel(1.2);
              setPanOffset({ x: 0, y: 0 });
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              activeBody === 'Mars'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-rose-500 border border-amber-300" />
            <span>MARS ({ATLAS_HARDWARE_ITEMS.filter((i) => i.destination === 'Mars').length})</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Atlas Canvas */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-cyan-500/40 bg-[#030712] shadow-[0_0_40px_rgba(0,0,0,0.9)]">
        {/* Map View Controls Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#070e22]/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl text-xs font-mono">
          <span className="px-2.5 py-1 text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>NASA {activeBody.toUpperCase()} BASEMAP</span>
          </span>
          <div className="w-px h-4 bg-slate-700" />
          <button
            id="atlas-zoom-in-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="atlas-zoom-out-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="atlas-reset-view-btn"
            onClick={handleResetView}
            title="Reset Pan & Zoom"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 hidden sm:block" />
          <span className="text-[10px] text-slate-400 font-mono px-2 hidden sm:inline-block">
            {Math.round(zoomLevel * 100)}% ZOOM
          </span>
        </div>

        {/* Telemetry & Coordinates HUD */}
        <div className="absolute top-4 right-4 z-20 flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {cursorCoords && (
            <div className="px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/30 text-[11px] font-mono text-cyan-300 flex items-center gap-2">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>
                {cursorCoords.lat >= 0 ? `${cursorCoords.lat}° N` : `${Math.abs(cursorCoords.lat)}° S`},{' '}
                {cursorCoords.lng >= 0 ? `${cursorCoords.lng}° E` : `${Math.abs(cursorCoords.lng)}° W`}
              </span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{filteredItems.length} HARDWARE SITES IDENTIFIED</span>
          </div>
        </div>

        {/* Authentic Surface Map Container with Pan & Zoom */}
        <div
          ref={mapContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative w-full aspect-[2/1] min-h-[460px] max-h-[640px] overflow-hidden select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Surface Texture Layer with Dynamic Pan & Zoom */}
          <motion.div
            animate={{
              x: panOffset.x,
              y: panOffset.y,
              scale: zoomLevel,
            }}
            transition={{
              type: 'spring',
              damping: 24,
              stiffness: 220,
            }}
            className="absolute inset-0 w-full h-full origin-center"
          >
            {/* Authentic NASA Basemap Image */}
            <img
              src={activeBody === 'Moon' ? moonBasemap : marsBasemap}
              alt={`NASA ${activeBody} Global Basemap`}
              className="w-full h-full object-cover pointer-events-none filter brightness-95 contrast-115"
              draggable={false}
            />

            {/* NASA Orbital Overlay Grid */}
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#38bdf830_1px,transparent_1px),linear-gradient(to_bottom,#38bdf830_1px,transparent_1px)] [background-size:10%_12.5%]" />

            {/* Latitude Equator and Longitude Prime Meridian */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/40 border-dashed" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400/40 border-dashed" />
            <span className="absolute top-[51%] left-4 text-[9px] font-mono text-cyan-300/80 uppercase bg-black/60 px-1.5 py-0.5 rounded">
              EQUATOR (0° LAT)
            </span>
            <span className="absolute top-4 left-[51%] text-[9px] font-mono text-cyan-300/80 uppercase bg-black/60 px-1.5 py-0.5 rounded">
              PRIME MERIDIAN (0° LNG)
            </span>

            {/* Clickable Hardware Markers with Pulsing Rings and Real Coordinates */}
            {filteredItems.map((item) => {
              const coords = getCoordinatesPct(item.lat, item.lng);
              const isSelected = selectedHardware?.id === item.id;
              const isMars = activeBody === 'Mars';

              return (
                <div
                  key={item.id}
                  id={`atlas-marker-${item.id}`}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMarker(item);
                  }}
                >
                  {/* Concentric Pulsing Radar Ring */}
                  <span
                    className={`absolute -inset-3 rounded-full opacity-60 animate-ping ${
                      isMars ? 'bg-rose-400' : 'bg-cyan-400'
                    }`}
                  />
                  <span
                    className={`absolute -inset-1 rounded-full opacity-40 animate-pulse ${
                      isMars ? 'bg-amber-400' : 'bg-blue-400'
                    }`}
                  />

                  {/* Pin Dot Icon */}
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-135 shadow-[0_0_20px_rgba(0,0,0,0.9)] ${
                      isSelected
                        ? 'bg-white text-black border-2 border-cyan-400 scale-135 ring-4 ring-cyan-400/50 shadow-[0_0_30px_#06b6d4]'
                        : isMars
                        ? 'bg-rose-500 text-white border-2 border-rose-200'
                        : 'bg-cyan-500 text-black border-2 border-cyan-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4 fill-current" />
                  </div>

                  {/* Floating Persistent Label with Real Coordinates */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap tracking-wider uppercase transition-all shadow-xl pointer-events-none backdrop-blur-md ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 opacity-100 font-bold scale-110'
                        : 'bg-black/90 text-slate-200 border border-slate-700 opacity-90 group-hover:opacity-100 group-hover:border-cyan-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{item.name.split('(')[0]}</span>
                      <span className="text-cyan-400">({item.coordinates})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Quick Hardware Telemetry Jump Strip */}
        <div className="p-4 bg-[#070e22] border-t border-slate-800 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest shrink-0 flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            <span>TELEMETRY JUMP:</span>
          </span>
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectMarker(item)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedHardware?.id === item.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <span>{item.name.split('(')[0]}</span>
              <span className="text-[10px] text-cyan-400/80">({item.coordinates.split(',')[0]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cinematic Slide-In Detail Drawer */}
      <AnimatePresence>
        {selectedHardware && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            transition={{ duration: 0.35 }}
            className="w-full bg-[#070e22] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_35px_rgba(6,182,212,0.2)] relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedHardware(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Hardware Identity */}
            <div className="space-y-2 pr-12">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase">
                  {selectedHardware.destination.toUpperCase()} HARDWARE FILE
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono uppercase">
                  {selectedHardware.spacecraftType}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-mono uppercase">
                  STATUS: {selectedHardware.status}
                </span>
              </div>

              <h3 className="font-['Rajdhani'] font-bold text-3xl sm:text-4xl text-white uppercase tracking-wide">
                {selectedHardware.name}
              </h3>
            </div>

            {/* Specification Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#030712] border border-slate-800 rounded-2xl font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">MISSION YEAR</span>
                <span className="text-white font-bold text-sm">{selectedHardware.missionYear}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">TOUCHDOWN DATE</span>
                <span className="text-cyan-300 font-bold text-sm">{selectedHardware.landingDate}</span>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">SURFACE LOCATION</span>
                <span className="text-amber-300 font-bold text-xs truncate block">
                  {selectedHardware.landingLocation} ({selectedHardware.coordinates})
                </span>
              </div>
            </div>

            {/* Deep Breakdown: Purpose & Scientific Discoveries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#030712] border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                  PRIMARY PURPOSE & OBJECTIVE
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedHardware.purpose}
                </p>
              </div>

              <div className="bg-[#030712] border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  SCIENTIFIC DISCOVERIES
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedHardware.discoveries}
                </p>
              </div>
            </div>

            {/* Current Condition & Student Fun Fact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#030712] border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  CURRENT RESTING CONDITION
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedHardware.currentCondition}
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-950/40 to-blue-950/30 border border-cyan-500/40 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>STUDENT FUN FACT</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                  “{selectedHardware.funFact}”
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="text-xs font-mono text-slate-400">
                NASA PDS Planetary Data Registry: <span className="text-slate-300">{selectedHardware.dataSource}</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {selectedHardware.verifiedUrl && (
                  <a
                    href={selectedHardware.verifiedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center gap-1.5 cursor-pointer"
                    title={`View ${selectedHardware.name} on NASA Website`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NASA Website Source</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                  </a>
                )}

                {onOpenEcho && (
                  <button
                    onClick={() => onOpenEcho(`Tell me more about ${selectedHardware.name} and what it discovered.`)}
                    className="px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Ask Echo About This Machine
                  </button>
                )}

                {selectedHardware.missionId && onSelectMission && (
                  <button
                    onClick={() => onSelectMission(selectedHardware.missionId!)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Open Full Mission File</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
