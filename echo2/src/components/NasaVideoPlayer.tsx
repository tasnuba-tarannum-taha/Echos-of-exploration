import React, { useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

import { NasaVideo } from '../types';

interface NasaVideoPlayerProps {
  video: NasaVideo;
  posterUrl?: string;
  className?: string;
  autoPlay?: boolean;
}

/* =========================================================
   YOUTUBE URL HELPERS
   ========================================================= */

const isYouTubeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    return (
      hostname === 'youtube.com' ||
      hostname === 'www.youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtu.be' ||
      hostname === 'www.youtu.be'
    );
  } catch {
    return false;
  }
};

const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // youtu.be/VIDEO_ID
    if (
      hostname === 'youtu.be' ||
      hostname === 'www.youtu.be'
    ) {
      return parsed.pathname.replace('/', '').split('/')[0] || null;
    }

    // youtube.com/watch?v=VIDEO_ID
    const watchId = parsed.searchParams.get('v');

    if (watchId) {
      return watchId;
    }

    // youtube.com/embed/VIDEO_ID
    if (parsed.pathname.startsWith('/embed/')) {
      return parsed.pathname
        .replace('/embed/', '')
        .split('/')[0] || null;
    }

    // youtube.com/shorts/VIDEO_ID
    if (parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname
        .replace('/shorts/', '')
        .split('/')[0] || null;
    }

    return null;
  } catch {
    return null;
  }
};

const getYouTubeEmbedUrl = (
  url: string,
  autoPlay: boolean
): string | null => {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  });

  if (autoPlay) {
    params.set('autoplay', '1');
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export const NasaVideoPlayer: React.FC<
  NasaVideoPlayerProps
> = ({
  video,
  posterUrl,
  className = '',
  autoPlay = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* -------------------------------------------------------
     DETECT VIDEO TYPE
     ------------------------------------------------------- */

  const youtube = useMemo(
    () => isYouTubeUrl(video.url),
    [video.url]
  );

  const youtubeEmbedUrl = useMemo(
    () =>
      youtube
        ? getYouTubeEmbedUrl(video.url, autoPlay)
        : null,
    [youtube, video.url, autoPlay]
  );

  /* -------------------------------------------------------
     NATIVE VIDEO CONTROLS
     ------------------------------------------------------- */

  const togglePlay = async () => {
    const element = videoRef.current;

    if (!element) return;

    try {
      if (element.paused) {
        await element.play();
        setIsPlaying(true);
      } else {
        element.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error(
        '[NASA VIDEO] Unable to play video:',
        error
      );
    }
  };

  const toggleMute = () => {
    const element = videoRef.current;

    if (!element) return;

    element.muted = !element.muted;
    setIsMuted(element.muted);
  };

  const handleTimeUpdate = () => {
    const element = videoRef.current;

    if (!element) return;

    setProgress(element.currentTime);
  };

  const handleLoadedMetadata = () => {
    const element = videoRef.current;

    if (!element) return;

    setDuration(element.duration);
    setIsLoading(false);
  };

  const handleSeek = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const element = videoRef.current;

    if (!element) return;

    const newTime = Number(event.target.value);

    element.currentTime = newTime;
    setProgress(newTime);
  };

  /* -------------------------------------------------------
     FULLSCREEN
     ------------------------------------------------------- */

  const toggleFullscreen = async () => {
    const container = containerRef.current;

    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error(
        '[NASA VIDEO] Fullscreen error:',
        error
      );
    }
  };

  /* -------------------------------------------------------
     RETRY
     ------------------------------------------------------- */

  const retryVideo = () => {
    setHasError(false);
    setIsLoading(true);

    const element = videoRef.current;

    if (element) {
      element.load();

      if (autoPlay) {
        element
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(false);
          });
      }
    }
  };

  /* -------------------------------------------------------
     FORMAT TIME
     ------------------------------------------------------- */

  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds)) {
      return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(
      seconds % 60
    );

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  };

  /* =======================================================
     ERROR SCREEN
     ======================================================= */

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full aspect-video overflow-hidden rounded-2xl bg-[#030712] border border-slate-800 ${className}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>

          <h3 className="text-white font-bold text-lg uppercase tracking-wider">
            NASA VIDEO UNAVAILABLE
          </h3>

          <p className="text-slate-400 text-xs font-mono mt-2 max-w-md">
            The archive video could not be loaded.
          </p>

          <button
            type="button"
            onClick={retryVideo}
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors text-xs font-mono uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>

          {video.originalUrl && (
            <a
              href={video.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open Original Archive
            </a>
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     YOUTUBE PLAYER
     ======================================================= */

  if (youtube && youtubeEmbedUrl) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full aspect-video overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl ${className}`}
      >
        {/* YouTube iframe */}

        <iframe
          key={youtubeEmbedUrl}
          src={youtubeEmbedUrl}
          title={video.title}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIsLoading(false)}
        />

        {/* Loading overlay */}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/30">
              <div className="w-4 h-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />

              <span className="text-cyan-300 text-xs font-mono tracking-widest uppercase">
                Loading NASA Video...
              </span>
            </div>
          </div>
        )}

        {/* NASA badge */}

        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/75 backdrop-blur-md border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />

            <span className="text-[10px] text-white font-mono font-bold tracking-[0.15em]">
              NASA VIDEO
            </span>
          </div>
        </div>

        {/* Video information */}

        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <h3 className="text-white font-bold text-sm md:text-base leading-tight">
              {video.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-mono text-slate-300">
              <span>{video.source}</span>

              <span className="text-slate-500">
                •
              </span>

              <span>{video.date}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     NATIVE MP4 PLAYER
     ======================================================= */

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl group ${className}`}
    >
      {/* Video */}

      <video
        ref={videoRef}
        src={video.url}
        poster={posterUrl || video.posterUrl}
        preload="metadata"
        playsInline
        autoPlay={autoPlay}
        muted={isMuted}
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />

      {/* Loading */}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {/* Dark gradient */}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />

      {/* NASA badge */}

      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/75 backdrop-blur-md border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />

          <span className="text-[10px] text-white font-mono font-bold tracking-[0.15em]">
            NASA VIDEO
          </span>
        </div>
      </div>

      {/* Video information */}

      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <div className="px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm border border-white/10">
          <span className="text-[9px] text-slate-300 font-mono tracking-wider">
            ARCHIVE FOOTAGE
          </span>
        </div>
      </div>

      {/* Bottom controls */}

      <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="p-3 rounded-xl bg-black/75 backdrop-blur-md border border-white/10">

          {/* Progress bar */}

          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 mb-3 accent-cyan-400 cursor-pointer"
            aria-label="Video progress"
          />

          {/* Controls */}

          <div className="flex items-center gap-3">

            {/* Play */}

            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label={
                isPlaying ? 'Pause video' : 'Play video'
              }
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            {/* Mute */}

            <button
              type="button"
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors"
              aria-label={
                isMuted ? 'Unmute video' : 'Mute video'
              }
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Time */}

            <span className="text-[10px] text-slate-300 font-mono">
              {formatTime(progress)} /{' '}
              {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Fullscreen */}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white transition-colors"
              aria-label={
                isFullscreen
                  ? 'Exit fullscreen'
                  : 'Enter fullscreen'
              }
            >
              <Maximize className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>

      {/* Title */}

      <div className="absolute bottom-5 left-5 right-5 z-20 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
        <h3 className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-lg">
          {video.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[10px] font-mono text-slate-300">
          <span>{video.source}</span>

          <span className="text-slate-500">
            •
          </span>

          <span>{video.date}</span>
        </div>
      </div>
    </div>
  );
};

export default NasaVideoPlayer;