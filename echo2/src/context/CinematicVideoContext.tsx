import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { NasaEarthVideo } from '../types';
import { FEATURED_EARTH_VIDEO, CURATED_EARTH_VIDEOS } from '../data/nasaEarthVideos';

export type VideoQuality = 'large' | 'medium' | 'mobile'; // 'large' = 4K UHD

interface CinematicVideoContextValue {
  activeVideo: NasaEarthVideo;
  selectedQuality: VideoQuality;
  isPlaying: boolean;
  isMuted: boolean;
  videoOpacity: number;
  cinemaMode: boolean;
  videoLoaded: boolean;
  backgroundEnabled: boolean;
  currentStreamUrl: string;
  setActiveVideo: (video: NasaEarthVideo) => void;
  setSelectedQuality: (quality: VideoQuality) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setVideoOpacity: (opacity: number) => void;
  setCinemaMode: (cinema: boolean) => void;
  setBackgroundEnabled: (enabled: boolean) => void;
  setVideoLoaded: (loaded: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const CinematicVideoContext = createContext<CinematicVideoContextValue | null>(null);

export const CinematicVideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always default to 4K UHD featured video and 4K stream
  const [activeVideo, setActiveVideo] = useState<NasaEarthVideo>(FEATURED_EARTH_VIDEO);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('large'); // 4K UHD default
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoOpacity, setVideoOpacity] = useState<number>(0.75);
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [backgroundEnabled, setBackgroundEnabled] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Compute 4K stream URL (prioritize orig or large for 4K UHD)
  const currentStreamUrl =
    selectedQuality === 'mobile'
      ? activeVideo.streamQuality.mobile
      : selectedQuality === 'medium'
      ? activeVideo.streamQuality.medium
      : activeVideo.streamQuality.large || activeVideo.streamQuality.orig || activeVideo.streamQuality.medium;

  // Auto-play and ensure continuous 4K background playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // If browser blocked unmuted, force mute and retry
            video.muted = true;
            setIsMuted(true);
            video.play().catch((e) => console.warn('Autoplay fallback:', e));
          });
      }
    }
  }, [currentStreamUrl, isPlaying, isMuted]);

  // Keep playing even if tab visibility changes or user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };

    const handleWindowInteraction = () => {
      // First user interaction ensures audio/video playback lock is released
      if (videoRef.current && videoRef.current.paused && isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('click', handleWindowInteraction, { once: true });
    window.addEventListener('keydown', handleWindowInteraction, { once: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <CinematicVideoContext.Provider
      value={{
        activeVideo,
        selectedQuality,
        isPlaying,
        isMuted,
        videoOpacity,
        cinemaMode,
        videoLoaded,
        backgroundEnabled,
        currentStreamUrl,
        setActiveVideo,
        setSelectedQuality,
        togglePlay,
        toggleMute,
        setIsPlaying,
        setIsMuted,
        setVideoOpacity,
        setCinemaMode,
        setBackgroundEnabled,
        setVideoLoaded,
        videoRef,
      }}
    >
      {children}
    </CinematicVideoContext.Provider>
  );
};

export const useCinematicVideo = () => {
  const context = useContext(CinematicVideoContext);
  if (!context) {
    throw new Error('useCinematicVideo must be used within a CinematicVideoProvider');
  }
  return context;
};
