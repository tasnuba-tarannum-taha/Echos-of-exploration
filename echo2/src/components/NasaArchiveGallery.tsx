import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Camera,
  Calendar,
  Layers,
  ZoomIn,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { Mission, MissionImage } from '../types';
import { NasaSourceBadge, NasaSourcePanel } from './NasaSourceBadge';

interface NasaArchiveGalleryProps {
  mission: Mission;
}

interface GalleryItem {
  id: string;
  nasa_id: string;
  title: string;
  description: string;
  date_created: string;
  thumbnail: string;
  source_url: string;
  camera?: string;
  center?: string;
  badge: 'NASA PHOTO' | 'NASA/JPL' | 'NASA SCIENTIFIC VISUALIZATION';
}

export const NasaArchiveGallery: React.FC<NasaArchiveGalleryProps> = ({ mission }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'camera' | 'hardware'>('all');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    // Initial items from verified curated mission images
    const curatedItems: GalleryItem[] = mission.images.map((img, idx) => ({
      id: `curated-${idx}`,
      nasa_id: img.nasaId || `${mission.id}-${idx}`,
      title: img.title,
      description: img.caption,
      date_created: img.date,
      thumbnail: img.url,
      source_url: img.originalUrl || `https://images.nasa.gov/details-${img.nasaId || ''}`,
      camera: img.camera || (mission.hardwareType === 'Rover' ? 'Pancam / Navcam' : 'Hasselblad 70mm / 16mm DAC'),
      center: 'NASA',
      badge: (img.badge as any) || 'NASA PHOTO',
    }));

    // Construct targeted query for NASA Image & Video Library
    const searchQuery =
      mission.id === 'spirit-rover'
        ? 'Spirit rover Mars surface Gusev crater'
        : mission.id === 'opportunity-rover'
        ? 'Opportunity rover Mars Meridiani Planum'
        : mission.id === 'apollo-11-lm'
        ? 'Apollo 11 Lunar Module descent stage Tranquility Base'
        : mission.id === 'surveyor-3'
        ? 'Surveyor 3 Moon Apollo 12'
        : mission.id === 'lunar-roving-vehicle-15'
        ? 'Apollo 15 Lunar Roving Vehicle Hadley'
        : mission.id === 'insight-lander'
        ? 'InSight Mars lander Elysium SEIS'
        : mission.id === 'voyager-1'
        ? 'Voyager 1 spacecraft interstellar'
        : `${mission.title} NASA`;

    fetch(`/api/nasa/images/search?q=${encodeURIComponent(searchQuery)}&media_type=image`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((res) => {
        if (!isMounted) return;
        const apiItems = (res.data?.items || []).map((it: any, idx: number) => ({
          id: `api-${idx}`,
          nasa_id: it.nasa_id || `NASA-${idx}`,
          title: it.title || 'Official NASA Mission Archive Asset',
          description: it.description || '',
          date_created: it.date_created ? it.date_created.split('T')[0] : 'Mission Era',
          thumbnail: it.thumbnail || 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg',
          source_url: it.source_url || `https://images.nasa.gov/details-${it.nasa_id}`,
          camera: it.description?.includes('Hazcam')
            ? 'Hazcam'
            : it.description?.includes('Navcam')
            ? 'Navcam'
            : it.description?.includes('Pancam')
            ? 'Pancam'
            : it.description?.includes('Microscopic')
            ? 'Microscopic Imager'
            : undefined,
          center: it.center || 'NASA / JPL',
          badge: (it.center?.includes('JPL') ? 'NASA/JPL' : 'NASA PHOTO') as any,
        }));

        // Merge curated with retrieved API items, de-duplicating by thumbnail/nasa_id
        const combined = [...curatedItems];
        apiItems.forEach((apiIt: GalleryItem) => {
          if (!combined.some((c) => c.nasa_id === apiIt.nasa_id || c.thumbnail === apiIt.thumbnail)) {
            combined.push(apiIt);
          }
        });

        setItems(combined.slice(0, 12));
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('NASA images fetch failed:', err);
        if (!isMounted) return;
        // Fall back gracefully to curated high-fidelity NASA images
        setItems(curatedItems);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mission]);

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'camera') return !!item.camera;
    if (activeFilter === 'hardware') return item.title.toLowerCase().includes('rover') || item.title.toLowerCase().includes('stage') || item.title.toLowerCase().includes('lander');
    return true;
  });

  return (
    <div className="w-full bg-[#040817] border border-cyan-950 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xl">
      {/* Header with authentic metadata hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
              {mission.destination.toUpperCase()}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-amber-300 tracking-widest uppercase">
              {mission.title.toUpperCase()}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-300 tracking-widest uppercase">
              NASA ARCHIVE
            </span>
          </div>
          <h3 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white uppercase tracking-wider">
            AUTHENTIC NASA ARCHIVAL PHOTOGRAPHS
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Every image retrieved directly from official NASA / JPL deep-space archives. No AI-generated imagery.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors border ${
              activeFilter === 'all'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Archive ({items.length})
          </button>
          <button
            onClick={() => setActiveFilter('camera')}
            className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors border ${
              activeFilter === 'camera'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            By Instrument Camera
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="font-mono text-xs text-cyan-300 tracking-widest uppercase">
            LOADING NASA ARCHIVE...
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Querying NASA Image & Video Library (images-api.nasa.gov)...
          </p>
        </div>
      )}

      {/* Grid of Authentic Photographs */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group bg-[#070e24] border border-slate-800/90 hover:border-cyan-500/60 rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]"
            >
              {/* Image Stage */}
              <div className="relative aspect-4/3 overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to official placeholder if asset CDN returns 404
                    (e.target as HTMLImageElement).src =
                      'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg';
                  }}
                />

                {/* Top Overlay Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <NasaSourceBadge type={item.badge} size="sm" />
                </div>

                {/* Zoom Hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono uppercase tracking-wider">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Inspect Photo</span>
                  </span>
                </div>
              </div>

              {/* Metadata Card Footer */}
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-['Rajdhani'] font-bold text-white text-base uppercase leading-snug line-clamp-2 group-hover:text-cyan-200 transition-colors">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-slate-500">DATE:</span>
                    <span className="text-slate-200">{item.date_created}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-slate-500">NASA ID:</span>
                    <span className="text-cyan-400 font-bold">{item.nasa_id}</span>
                  </div>
                  {item.camera && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-slate-500">CAMERA:</span>
                      <span className="text-amber-300">{item.camera}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    PROVIDER: {item.center}
                  </span>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase"
                  >
                    <span>OPEN ORIGINAL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback Error State if completely empty */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="py-12 px-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="font-['Rajdhani'] font-bold text-white text-lg uppercase">
            NASA ARCHIVE IMAGE UNAVAILABLE
          </h4>
          <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
            Specific category filter produced zero records. You can explore the full master archive directly on NASA’s public database.
          </p>
          <a
            href="https://images.nasa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono uppercase tracking-wider transition-colors"
          >
            <span>VIEW ORIGINAL NASA SOURCE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Full Resolution Photo Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#070e24] border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)] max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <NasaSourceBadge type={selectedItem.badge} size="sm" />
                <span className="text-xs font-mono text-slate-400 uppercase">
                  NASA ID: <span className="text-white font-bold">{selectedItem.nasa_id}</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image View */}
            <div className="relative w-full flex-1 min-h-[300px] max-h-[58vh] bg-black flex items-center justify-center p-2">
              <img
                src={selectedItem.thumbnail}
                alt={selectedItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Metadata Panel */}
            <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-['Rajdhani'] font-bold text-xl sm:text-2xl text-white uppercase tracking-wider">
                    {selectedItem.title}
                  </h3>
                  <p className="text-xs font-mono text-cyan-300">
                    DATE: {selectedItem.date_created} • PROVIDER: {selectedItem.center}
                    {selectedItem.camera && ` • CAMERA: ${selectedItem.camera}`}
                  </p>
                </div>

                <a
                  href={selectedItem.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono tracking-wider uppercase transition-colors shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <span>OPEN ORIGINAL SOURCE</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {selectedItem.description && (
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed pt-2 border-t border-slate-800/80">
                  {selectedItem.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
