import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ArrowRight,
  CheckCircle2,
  Orbit,
  Camera,
  Maximize2,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Sparkles,
} from 'lucide-react';
import { Destination } from '../types';
import { MISSIONS_DATA } from '../data/missions';
import { RealisticGlobe } from './RealisticGlobe';

interface DestinationHubProps {
  level: number;
  completedMissions: string[];
  onSelectDestination: (dest: Destination) => void;
  onEnterMission: (missionId: string) => void;
}

interface RealNasaPhoto {
  id: string;
  url: string;
  title: string;
  tag: string;
  date: string;
  center: string;
  nasaId: string;
  description: string;
}

interface RealmData {
  id: Destination;
  title: string;
  subtitle: string;
  description: string;
  levelRequired: number;
  gradient: string;
  accentColor: string;
  realImages: RealNasaPhoto[];
}

export const DestinationHub: React.FC<DestinationHubProps> = ({
  level,
  completedMissions,
  onSelectDestination,
  onEnterMission,
}) => {
  // Active photo index per destination card
  const [activePhotoIndex, setActivePhotoIndex] = useState<Record<string, number>>({
    Moon: 0,
    Mars: 0,
    'Deep Space': 0,
  });

  // Display mode per card: 'photo' (default real NASA image) or '3d'
  const [viewModes, setViewModes] = useState<Record<string, 'photo' | '3d'>>({
    Moon: 'photo',
    Mars: 'photo',
    'Deep Space': 'photo',
  });

  // Fullscreen photo inspection modal
  const [inspectedPhoto, setInspectedPhoto] = useState<RealNasaPhoto | null>(null);

  const destinations: RealmData[] = [
    {
      id: 'Moon',
      title: 'THE MOON',
      subtitle: 'EARTH’S DESOLATE SILENT COMPANION',
      description:
        'Fifty-five years after Apollo, descent stages, electric buggies, and robotic scouts remain preserved in pristine vacuum on the basaltic maria.',
      levelRequired: 1,
      gradient: 'from-slate-900 to-slate-950',
      accentColor: 'cyan',
      realImages: [
        {
          id: 'moon-full',
          url: 'https://images-assets.nasa.gov/image/as17-152-23311/as17-152-23311~medium.jpg',
          title: 'Apollo 17 Full Moon Photograph',
          tag: 'Real NASA Photo • Full Disc',
          date: 'December 1972',
          center: 'NASA Johnson Space Center',
          nasaId: 'as17-152-23311',
          description:
            'A true-color full photograph of the Moon captured by the Apollo 17 crew during their translunar coast toward the Taurus-Littrow landing site. Shows the maria, highlands, and ancient impact basins in sharp clarity.',
        },
        {
          id: 'moon-surface',
          url: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg',
          title: 'Tranquility Base: LM Eagle & Aldrin',
          tag: 'Real Surface Photo',
          date: 'July 20, 1969',
          center: 'NASA Apollo 11 Collection',
          nasaId: 'as11-40-5903',
          description:
            'Astronaut Buzz Aldrin photographed by Neil Armstrong walking on the lunar regolith beside the Apollo 11 Lunar Module Eagle descent stage at Tranquility Base.',
        },
        {
          id: 'moon-hardware',
          url: 'https://images-assets.nasa.gov/image/as11-40-5927/as11-40-5927~medium.jpg',
          title: 'Descent Stage & Deployed US Flag',
          tag: 'Real Discarded Hardware',
          date: 'July 20, 1969',
          center: 'NASA Apollo 11 Collection',
          nasaId: 'as11-40-5927',
          description:
            'Wide photograph of humanity’s first permanent extraterrestrial monument: the gold-mylar clad Apollo 11 Lunar Module descent stage resting forever on Mare Tranquillitatis.',
        },
      ],
    },
    {
      id: 'Mars',
      title: 'MARS',
      subtitle: 'THE RUST-COLORED ANCIENT WORLD',
      description:
        'Rovers that survived years past their warranties, buried in red volcanic dust storms, having answered humanity’s profound question about ancient water.',
      levelRequired: 2,
      gradient: 'from-amber-950/40 to-slate-950',
      accentColor: 'amber',
      realImages: [
        {
          id: 'mars-global',
          url: 'https://images-assets.nasa.gov/image/PIA00407/PIA00407~medium.jpg',
          title: 'Viking 1 Global Color Mosaic of Mars',
          tag: 'Real NASA Photo • Full Planet',
          date: '1980',
          center: 'NASA / USGS / JPL-Caltech',
          nasaId: 'PIA00407',
          description:
            'Composite of 102 Viking Orbiter images showing the full Martian hemisphere in authentic color. Center shows the massive 4,000-km Valles Marineris canyon system, with Tharsis volcanoes on the western limb.',
        },
        {
          id: 'mars-surface',
          url: 'https://images-assets.nasa.gov/image/PIA01120/PIA01120~medium.jpg',
          title: 'Pathfinder & Sojourner on Mars Soil',
          tag: 'Real Surface Photo',
          date: 'December 1997',
          center: 'NASA / JPL-Caltech',
          nasaId: 'PIA01120',
          description:
            'The historic Mars Pathfinder Carl Sagan Memorial Station and the miniature Sojourner rover resting in the boulder-strewn floodplain of Ares Vallis.',
        },
        {
          id: 'mars-gusev',
          url: 'https://images-assets.nasa.gov/image/PIA05120/PIA05120~medium.jpg',
          title: 'Spirit Rover Gusev Crater Panorama',
          tag: 'Real Rover Panorama',
          date: 'January 2004',
          center: 'NASA / JPL-Caltech / Cornell',
          nasaId: 'PIA05120',
          description:
            'Pancam 360-degree color panoramic view captured from the deck of the Spirit rover overlooking the vast basaltic floor of Gusev Crater where ancient lakes once sat.',
        },
      ],
    },
    {
      id: 'Deep Space',
      title: 'DEEP SPACE',
      subtitle: 'THE INTERSTELLAR FRONTIER',
      description:
        'Robotic messengers carrying gold plaques and phonograph records, cruising past the edge of the heliosphere toward distant constellations.',
      levelRequired: 3,
      gradient: 'from-indigo-950/40 to-slate-950',
      accentColor: 'indigo',
      realImages: [
        {
          id: 'webb-deep-field',
          url: 'https://images-assets.nasa.gov/image/webb_first_deep_field/webb_first_deep_field~medium.jpg',
          title: 'James Webb Space Telescope Deep Field',
          tag: 'Real JWST Infrared Photo',
          date: 'July 2022',
          center: 'NASA / ESA / CSA / STScI',
          nasaId: 'webb_first_deep_field',
          description:
            'JWST’s iconic First Deep Field image of galaxy cluster SMACS 0723. Gravitational lensing bends light from ancient galaxies over 13 billion light-years distant, revealing the deepest infrared cosmos.',
        },
        {
          id: 'hubble-deep-field',
          url: 'https://images-assets.nasa.gov/image/PIA12110/PIA12110~medium.jpg',
          title: 'Hubble Deep Field: Myriad Galaxies',
          tag: 'Real Hubble Deep Photo',
          date: 'January 1996',
          center: 'NASA / STScI',
          nasaId: 'PIA12110',
          description:
            'A legendary 10-day exposure of a seemingly empty speck of deep sky taken by the Hubble Space Telescope, revealing nearly 3,000 distinct galaxies stretching back to the dawn of the universe.',
        },
        {
          id: 'voyager-interstellar',
          url: 'https://images-assets.nasa.gov/image/PIA23645/PIA23645~medium.jpg',
          title: 'Voyager 1 in the Interstellar Void',
          tag: 'Interstellar Messenger',
          date: 'February 2020',
          center: 'NASA / JPL-Caltech',
          nasaId: 'PIA23645',
          description:
            'NASA illustration and trajectory data celebrating Voyager 1 cruising beyond the termination shock and heliopause into the uncharted magnetic environment of the interstellar medium.',
        },
      ],
    },
  ];

  const handleNextPhoto = (destId: string, max: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => ({
      ...prev,
      [destId]: ((prev[destId] || 0) + 1) % max,
    }));
  };

  const handlePrevPhoto = (destId: string, max: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => ({
      ...prev,
      [destId]: ((prev[destId] || 0) - 1 + max) % max,
    }));
  };

  return (
    <div id="destinations-hub-anchor" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Section Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Orbit className="w-3.5 h-3.5 text-cyan-400" />
          <span>EXPLORATION DESTINATIONS</span>
        </div>
        <h2 className="font-['Rajdhani'] font-bold text-3xl sm:text-5xl text-white tracking-wider uppercase">
          CHOOSE YOUR ARCHIVE REALM
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Select a celestial domain to inspect the hardware humanity left behind. Browse authentic NASA mission photography captured from lunar orbit, surface rovers, and deep space observatories.
        </p>
      </div>

      {/* Destination Grid with Real NASA Photos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {destinations.map((dest) => {
          const destMissions = MISSIONS_DATA.filter((m) => m.destination === dest.id);
          const completedCount = destMissions.filter((m) => completedMissions.includes(m.id)).length;
          const pct = Math.round((completedCount / destMissions.length) * 100);
          const isUnlocked = level >= dest.levelRequired;
          const photoIndex = activePhotoIndex[dest.id] || 0;
          const currentPhoto = dest.realImages[photoIndex] || dest.realImages[0];
          const viewMode = viewModes[dest.id] || 'photo';

          return (
            <div
              key={dest.id}
              id={`dest-card-${dest.id.toLowerCase().replace(' ', '-')}`}
              className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden bg-gradient-to-b ${dest.gradient} ${
                isUnlocked
                  ? 'border-slate-700/80 hover:border-cyan-500/60 hover:shadow-[0_0_35px_rgba(6,182,212,0.2)]'
                  : 'border-slate-800/40 opacity-80'
              }`}
            >
              {/* Card Hero Stage: Real NASA Photo Showcase */}
              <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-slate-950 flex flex-col justify-between">
                {viewMode === 'photo' ? (
                  <>
                    {/* Genuine NASA Photograph */}
                    <img
                      src={currentPhoto.url}
                      alt={currentPhoto.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />

                    {/* Gradient Overlays for readable text and badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/80 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                    {/* Top Badges Bar */}
                    <div className="relative z-10 p-3.5 flex items-center justify-between gap-2 pointer-events-auto">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-slate-950/85 text-cyan-300 border border-cyan-500/40 shadow-md backdrop-blur-md">
                        <Camera className="w-3 h-3 text-cyan-400" />
                        <span>REAL NASA PHOTO</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 backdrop-blur-md shadow-sm">
                            <Unlock className="w-3 h-3" />
                            AVAILABLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/90 border border-slate-700 text-slate-400 backdrop-blur-md">
                            <Lock className="w-3 h-3" />
                            LVL {dest.levelRequired}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick photo navigation arrows */}
                    {dest.realImages.length > 1 && (
                      <div className="relative z-10 px-2 flex items-center justify-between pointer-events-none">
                        <button
                          onClick={(e) => handlePrevPhoto(dest.id, dest.realImages.length, e)}
                          className="p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white backdrop-blur-md pointer-events-auto transition-transform active:scale-95 cursor-pointer"
                          title="Previous NASA Photo"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleNextPhoto(dest.id, dest.realImages.length, e)}
                          className="p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white backdrop-blur-md pointer-events-auto transition-transform active:scale-95 cursor-pointer"
                          title="Next NASA Photo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Bottom Metadata & Controls Overlay */}
                    <div className="relative z-10 p-3 space-y-2 pointer-events-auto">
                      {/* Active Photo Title & Fullscreen trigger */}
                      <div className="flex items-center justify-between gap-2 bg-slate-950/85 border border-slate-800/90 rounded-xl px-3 py-2 backdrop-blur-md">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block truncate">
                            {currentPhoto.tag}
                          </span>
                          <span className="text-xs font-semibold text-white truncate block">
                            {currentPhoto.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setInspectedPhoto(currentPhoto)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Inspect Real NASA Photo in Fullscreen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>

                          {(dest.id === 'Moon' || dest.id === 'Mars') && (
                            <button
                              onClick={() =>
                                setViewModes((prev) => ({ ...prev, [dest.id]: '3d' }))
                              }
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                              title="Toggle 3D Interactive Model"
                            >
                              <Globe2 className="w-3 h-3 text-cyan-400" />
                              <span>3D</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Photo Thumbnail Selector Dots */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {dest.realImages.map((img, idx) => (
                            <button
                              key={img.id}
                              onClick={() =>
                                setActivePhotoIndex((prev) => ({ ...prev, [dest.id]: idx }))
                              }
                              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                idx === photoIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                              }`}
                              title={img.title}
                            />
                          ))}
                        </div>

                        <div className="text-[10px] font-mono text-slate-400">
                          {photoIndex + 1} / {dest.realImages.length}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Optional 3D WebGL Globe View (when user toggles 3D) */
                  <div className="relative w-full h-full flex flex-col justify-between p-3 bg-gradient-to-b from-black/80 to-slate-950">
                    <div className="flex items-center justify-between z-10">
                      <span className="text-xs font-mono text-cyan-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700">
                        3D INTERACTIVE GLOBE
                      </span>

                      <button
                        onClick={() =>
                          setViewModes((prev) => ({ ...prev, [dest.id]: 'photo' }))
                        }
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Camera className="w-3 h-3 text-cyan-400" />
                        <span>VIEW REAL PHOTO</span>
                      </button>
                    </div>

                    <div className="w-full flex-1 flex items-center justify-center my-auto">
                      <RealisticGlobe
                        type={dest.id === 'Moon' ? 'moon' : 'mars'}
                        size={210}
                        interactive={true}
                      />
                    </div>

                    <div className="text-center text-[10px] font-mono text-slate-400 z-10">
                      DRAG TO ROTATE • PINCH/SCROLL TO ZOOM
                    </div>
                  </div>
                )}
              </div>

              {/* Progress & Missions Counter Banner */}
              <div className="px-5 py-2.5 bg-slate-950/90 border-y border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{destMissions.length} ARCHIVED MISSIONS</span>
                </span>
                <span className="text-cyan-300 font-bold">{pct}% EXPLORED</span>
              </div>

              {/* Information Body */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-['Rajdhani'] font-bold text-2xl text-white tracking-wider uppercase">
                    {dest.title}
                  </h3>
                  <p className="text-xs font-mono text-cyan-400 tracking-wider">
                    {dest.subtitle}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {dest.description}
                  </p>
                </div>

                {/* Hardware Catalog Teaser */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    ARCHIVAL CATALOG:
                  </div>
                  <div className="space-y-1.5">
                    {destMissions.slice(0, 3).map((m) => {
                      const isDone = completedMissions.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between text-xs font-mono text-slate-300 hover:text-white transition-colors group/item"
                        >
                          <span className="truncate max-w-[180px] sm:max-w-[210px] flex items-center gap-1.5">
                            {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                            <span className="truncate">{m.title}</span>
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {(m.officialNasaUrl || (m.sources && m.sources[0]?.url)) && (
                              <a
                                href={m.officialNasaUrl || m.sources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-200 px-1.5 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 transition-colors"
                                title={`Open ${m.title} on NASA Website`}
                              >
                                <span>NASA</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            <span className="text-cyan-400/80 text-[10px]">
                              +100 XP
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-4">
                  {isUnlocked ? (
                    <button
                      id={`explore-realm-${dest.id.toLowerCase().replace(' ', '-')}-btn`}
                      onClick={() => onSelectDestination(dest.id)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-950 to-slate-900 hover:from-cyan-900 hover:to-slate-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-semibold text-xs font-mono tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>EXPLORE {dest.title}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 font-mono text-xs tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>LOCKED (COMPLETE LEVEL {dest.levelRequired - 1})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Resolution NASA Photo Fullscreen Inspector Modal */}
      {inspectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setInspectedPhoto(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  <Camera className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                    {inspectedPhoto.tag} • NASA ARCHIVE
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {inspectedPhoto.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setInspectedPhoto(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="relative flex-1 min-h-64 sm:min-h-96 max-h-[60vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={inspectedPhoto.url}
                alt={inspectedPhoto.title}
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>

            {/* Modal Metadata Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">NASA ID</span>
                  <span className="text-cyan-300 font-bold truncate block">{inspectedPhoto.nasaId}</span>
                </div>
                <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">DATE ACQUIRED</span>
                  <span className="text-slate-200 font-bold truncate block">{inspectedPhoto.date}</span>
                </div>
                <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 col-span-2">
                  <span className="text-[10px] text-slate-500 block">ORIGIN / CENTER</span>
                  <span className="text-slate-200 font-medium truncate block">{inspectedPhoto.center}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {inspectedPhoto.description}
              </p>

              <div className="pt-2 flex items-center justify-end gap-3">
                <a
                  href={`https://images.nasa.gov/details-${inspectedPhoto.nasaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  <span>View on images.nasa.gov</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setInspectedPhoto(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
