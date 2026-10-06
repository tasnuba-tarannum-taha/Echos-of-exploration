import { TourStep } from '../types';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'explore-step',
    order: 1,
    title: '1. EXPLORE: EARTH & BEYOND',
    description:
      'Begin your journey exploring Earth from orbit and the deep space destinations humanity has ventured to across the cosmos.',
    targetSelector: '#nav-link-explore',
    position: 'bottom',
    route: 'explore',
    highlight: 'Explore Navigation Link & Mission Gateway',
  },
  {
    id: 'atlas-step',
    order: 2,
    title: '2. HARDWARE ATLAS: PLANETARY COORDINATES',
    description:
      'Next, explore high-precision planetary coordinate maps of the Moon and Mars with 3D lander models and resting site telemetry.',
    targetSelector: '#nav-link-atlas',
    position: 'bottom',
    route: 'atlas',
    highlight: 'Hardware Atlas Navigation Link',
  },
  {
    id: 'missions-step',
    order: 3,
    title: '3. MISSIONS: HISTORICAL ARCHIVE & DOSSIERS',
    description:
      'Then, deep dive into individual mission dossiers, flight timelines, engineering challenges, and authentic NASA photography.',
    targetSelector: '#nav-link-missions',
    position: 'bottom',
    route: 'missions',
    highlight: 'Missions Archive Navigation Link',
  },
  {
    id: 'nasa-feeds-step',
    order: 4,
    title: '4. LIVE NASA: REAL-TIME OBSERVATORY',
    description:
      'Then, access live telemetry from NASA Open APIs: Astronomy Picture of the Day (APOD), Near-Earth Object Radar (NeoWs), and Space Weather alerts.',
    targetSelector: '#nav-link-nasa-feeds',
    position: 'bottom',
    route: 'nasa-feeds',
    highlight: 'Live NASA Observatory Link',
  },
  {
    id: 'journey-step',
    order: 5,
    title: '5. ASTRONAUT JOURNEY: FLIGHT SIMULATION',
    description:
      'Then, take the controls in the Apollo Lunar Lander simulator and Galaxy Command arcade to test your space piloting skills.',
    targetSelector: '#nav-link-journey',
    position: 'bottom',
    route: 'journey',
    highlight: 'Astronaut Journey Arcade Link',
  },
  {
    id: 'badges-step',
    order: 6,
    title: '6. BADGES: EXPLORER RANKS & HONORS',
    description:
      'And last, review your scientific discovery XP, rank promotions, and unlocked NASA Space Apps honors as you complete the tour.',
    targetSelector: '#nav-link-badges',
    position: 'bottom',
    route: 'badges',
    highlight: 'Badges & Explorer Honors Link',
  },
];

