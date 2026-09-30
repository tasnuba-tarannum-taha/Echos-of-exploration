import { TourStep } from '../types';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    order: 1,
    title: 'WELCOME TO ECHOES OF EXPLORATION',
    description:
      'This experience lets you discover the machines humanity left behind across the Moon, Mars, and deep space.',
    targetSelector: '#nav-brand-logo',
    position: 'bottom',
    route: 'explore',
    highlight: 'ECHOES OF EXPLORATION Logo',
  },
  {
    id: 'missions-nav',
    order: 2,
    title: 'MISSIONS & HARDWARE CATALOG',
    description:
      'Start here to discover NASA hardware and mission stories across lunar, martian, and deep space exploration.',
    targetSelector: '#nav-link-missions',
    position: 'bottom',
    route: 'explore',
    highlight: 'Missions Navigation Link',
  },
  {
    id: 'moon-dest',
    order: 3,
    title: 'THE MOON',
    description:
      'Begin with lunar missions and explore the hardware left behind on the Moon, from Apollo descent stages to robotic surveyors.',
    targetSelector: '#dest-card-moon',
    position: 'top',
    route: 'explore',
    action: 'scroll',
    highlight: 'Moon Destination Stage',
  },
  {
    id: 'mission-card',
    order: 4,
    title: 'MISSION DOSSIER',
    description:
      'Each mission tells a complete story: why it was built, how it traveled, what it discovered, and what happened to it.',
    targetSelector: '#mission-card-apollo-11-lm',
    position: 'top',
    route: 'missions',
    routeParam: 'Moon',
    action: 'navigate',
    highlight: 'Apollo 11 Lunar Module Descent Stage',
  },
  {
    id: 'mission-timeline',
    order: 5,
    title: 'MISSION TIMELINE',
    description:
      'Follow the mission from launch pad ignition across translunar transit to landing and final resting telemetry.',
    targetSelector: '#mission-timeline-anchor',
    position: 'top',
    route: 'mission-detail',
    routeParam: 'apollo-11-lm',
    chapterIndex: 1, // Chapter 02: THE JOURNEY
    action: 'switchChapter',
    highlight: 'Interactive Mission Timeline',
  },
  {
    id: 'nasa-archive',
    order: 6,
    title: 'AUTHENTIC NASA ARCHIVE',
    description:
      'Here you can explore authentic NASA imagery, historical photographs, and technical video preserves.',
    targetSelector: '#mission-archive-anchor',
    position: 'top',
    route: 'mission-detail',
    routeParam: 'apollo-11-lm',
    chapterIndex: 2, // Chapter 03: MEET THE MACHINE & NASA ARCHIVE
    action: 'switchChapter',
    highlight: 'NASA Photographic Archive Gallery',
  },
  {
    id: 'nasa-data',
    order: 7,
    title: 'NASA PLANETARY DATA',
    description:
      'The experience connects you to NASA planetary data and turns complex environmental parameters into visual explanations.',
    targetSelector: '#mission-environment-anchor',
    position: 'top',
    route: 'mission-detail',
    routeParam: 'apollo-11-lm',
    chapterIndex: 4, // Chapter 05: THE ENVIRONMENT & PLANETARY MAP
    action: 'switchChapter',
    highlight: 'Planetary Environment Telemetry',
  },
  {
    id: 'neo-radar',
    order: 8,
    title: 'NEO RADAR & LIVE OBSERVATORY',
    description:
      'Explore real NASA Near-Earth Object data and learn why NASA tracks these asteroids as they pass near Earth.',
    targetSelector: '#neo-radar-container',
    position: 'top',
    route: 'nasa-feeds',
    nasaTab: 'neows',
    action: 'switchNasaTab',
    highlight: 'Near-Earth Asteroids (NeoWs) Orbital Radar',
  },
];
