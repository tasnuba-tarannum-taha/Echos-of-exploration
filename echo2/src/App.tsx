import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { EarthFromAbove } from './components/EarthFromAbove';
import { EarthMoonTransition } from './components/EarthMoonTransition';
import { DestinationHub } from './components/DestinationHub';
import { MissionCatalog } from './components/MissionCatalog';
import { MissionDetail } from './components/MissionDetail';
import { NasaFeeds } from './components/NasaFeeds';
import { BadgesView } from './components/BadgesView';
import { HardwareAtlas } from './components/HardwareAtlas';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { TourOverlay } from './components/TourOverlay';
import { EchoChat } from './components/EchoChat';
import { EchoBot } from './components/EchoBot';
import { useProgress } from './hooks/useProgress';
import { MISSIONS_DATA } from './data/missions';
import { Destination, Mission, EchoContext, TourStep } from './types';
import { TOUR_STEPS } from './data/tourSteps';
import { audioService } from './services/audioService';
import { echoMemory } from './services/echoMemory';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'explore' | 'journey' | 'atlas' | 'missions' | 'mission-detail' | 'nasa-feeds' | 'badges'
  >('explore');

  const [selectedMissionId, setSelectedMissionId] = useState<string>('apollo-11-descent');
  const [inTransit, setInTransit] = useState<boolean>(false);
  const [transitTarget, setTransitTarget] = useState<'Moon' | 'Mars' | 'Deep Space'>('Moon');
  const [transitOrigin, setTransitOrigin] = useState<'Earth' | 'Moon' | 'Mars'>('Earth');
  const [catalogDestinationFilter, setCatalogDestinationFilter] = useState<Destination | 'All'>('All');

  // Mission detail & NASA Feeds sub-state
  const [missionDetailChapter, setMissionDetailChapter] = useState<number>(0);
  const [nasaFeedsTab, setNasaFeedsTab] = useState<'apod' | 'neows' | 'donki' | 'library'>('apod');

  // Tour Mode State
  const [tourActive, setTourActive] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);

  // Echo AI Guide State
  const [echoOpen, setEchoOpen] = useState<boolean>(false);
  const [echoPrompt, setEchoPrompt] = useState<string | undefined>(undefined);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [echoMode, setEchoMode] = useState<'voice' | 'chat'>('chat');

  // Progression Hook
  const {
    progress,
    currentLevelInfo,
    populatedBadges,
    toasts,
    removeToast,
    addXp,
    unlockBadge,
    completeMission,
    inspectHardware,
    discoverFact,
    resetProgress,
  } = useProgress();

  // Apply routing and parameters for a tour step
  const applyTourStep = (step: TourStep) => {
    if (step.route && step.route !== activeTab) {
      setActiveTab(step.route as any);
    }
    if (step.routeParam) {
      if (step.route === 'missions') {
        setCatalogDestinationFilter(step.routeParam as any);
      } else if (step.route === 'mission-detail') {
        setSelectedMissionId(step.routeParam);
      }
    }
    if (step.chapterIndex !== undefined) {
      setMissionDetailChapter(step.chapterIndex);
    }
    if (step.nasaTab !== undefined) {
      setNasaFeedsTab(step.nasaTab as any);
    }
  };

  const handleStartTour = () => {
    audioService.playTelemetryPing();
    setTourActive(true);
    setTourStepIndex(0);
    applyTourStep(TOUR_STEPS[0]);
  };

  const handleToggleTour = () => {
    if (tourActive) {
      handleExitTour();
    } else {
      handleStartTour();
    }
  };

  const handleNextTourStep = () => {
    const nextIdx = tourStepIndex + 1;
    if (nextIdx < TOUR_STEPS.length) {
      setTourStepIndex(nextIdx);
      applyTourStep(TOUR_STEPS[nextIdx]);
    }
  };

  const handlePrevTourStep = () => {
    const prevIdx = tourStepIndex - 1;
    if (prevIdx >= 0) {
      setTourStepIndex(prevIdx);
      applyTourStep(TOUR_STEPS[prevIdx]);
    }
  };

  const handleExitTour = () => {
    audioService.playTelemetryPing();
    setTourActive(false);
  };

  const handleCompleteTour = () => {
    const hasAwarded = localStorage.getItem('echoes_tour_xp_awarded');
    if (!hasAwarded) {
      addXp(25, 'Completed 8-Step Guided Tour');
      localStorage.setItem('echoes_tour_xp_awarded', 'true');
    }
    localStorage.setItem('echoes_tour_completed', 'true');
    setTourActive(false);
  };

  const handleAskEchoTourStep = (promptText: string) => {
    setEchoPrompt(promptText);
    setEchoOpen(true);
  };

  const handleEchoNavigate = (targetTab: string, param?: string) => {
    if (targetTab === 'mission-detail' && param) {
      setSelectedMissionId(param);
      setActiveTab('mission-detail');
    } else if (targetTab === 'missions') {
      if (param) setCatalogDestinationFilter(param as any);
      setActiveTab('missions');
    } else if (targetTab === 'nasa-feeds') {
      if (param) setNasaFeedsTab(param as any);
      setActiveTab('nasa-feeds');
    } else {
      setActiveTab(targetTab as any);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to archive section anchor
  const handleScrollToArchive = () => {
    const el = document.getElementById('earth-from-above-section') || document.getElementById('destinations-hub-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Begin journey warp transition
  const handleBeginJourney = () => {
    setTransitOrigin('Earth');
    setTransitTarget('Moon');
    setInTransit(true);
  };

  const handleTransitComplete = () => {
    setInTransit(false);
    // Award discovery bonus for first orbital transit
    addXp(50, 'Completed Translunar Orbit Insertion');
    // Scroll to destinations or missions
    setActiveTab('explore');
    setTimeout(handleScrollToArchive, 100);
  };

  const handleSelectDestination = (dest: Destination) => {
    audioService.playTelemetryPing();
    setCatalogDestinationFilter(dest);
    setActiveTab('missions');
  };

  const handleEnterMission = (missionId: string) => {
    audioService.playTelemetryPing();
    setSelectedMissionId(missionId);
    setMissionDetailChapter(0);
    setActiveTab('mission-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const target = MISSIONS_DATA.find((m) => m.id === missionId);
    if (target) {
      echoMemory.recordMissionVisit(target.id, target.title, target.destination);
    }
  };

  const selectedMission =
    MISSIONS_DATA.find((m) => m.id === selectedMissionId) || MISSIONS_DATA[0];

  // Echo context bundle
  const echoContext: EchoContext = {
    pageType: activeTab,
    tourActive,
    tourStep: tourStepIndex + 1,
    mission: activeTab === 'mission-detail' ? selectedMission : undefined,
    missionChapter: activeTab === 'mission-detail' ? missionDetailChapter : undefined,
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Cinematic Warp Transit Overlay (3D Earth -> Moon / Mars Flythrough) */}
      {inTransit && (
        <EarthMoonTransition
          from={transitOrigin}
          to={transitTarget}
          onComplete={handleTransitComplete}
          onSelectMission={(mId) => {
            handleEnterMission(mId);
            setInTransit(false);
          }}
        />
      )}

      {/* Global Navigation Header */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab: any) => {
          audioService.playTelemetryPing();
          if (tab === 'journey') {
            handleBeginJourney();
            return;
          }
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        xp={progress.xp}
        currentLevelInfo={currentLevelInfo}
        unlockedBadgesCount={progress.badges.length}
        totalBadgesCount={populatedBadges.length}
        onStartDemoTour={handleToggleTour}
        isTourActive={tourActive}
        onOpenEcho={() => setEchoOpen(true)}
      />

      {/* Tour Mode Overlay */}
      <TourOverlay
        active={tourActive}
        stepIndex={tourStepIndex}
        onNext={handleNextTourStep}
        onPrev={handlePrevTourStep}
        onExit={handleExitTour}
        onComplete={handleCompleteTour}
        onAskEcho={handleAskEchoTourStep}
      />

      {/* Echo AI Space Guide Chat Panel */}
      <EchoChat
        isOpen={echoOpen}
        onToggle={() => setEchoOpen(!echoOpen)}
        context={echoContext}
        onNavigateTab={handleEchoNavigate}
        initialPrompt={echoPrompt}
        onClearInitialPrompt={() => setEchoPrompt(undefined)}
        hideFloatingButton={true}
        onLoadingChange={(loading) => setIsChatLoading(loading)}
        isVoiceMode={echoMode === 'voice'}
      />

      {/* Persistent Companion Robot ECHO */}
      <EchoBot
        activeTab={activeTab}
        isChatOpen={echoOpen}
        onToggleChat={() => setEchoOpen(!echoOpen)}
        onOpenChat={(prompt) => {
          if (prompt) setEchoPrompt(prompt);
          setEchoOpen(true);
        }}
        onNavigate={handleEchoNavigate}
        onAddXp={(amount, reason) => addXp(amount, reason)}
        selectedMissionTitle={selectedMission?.title}
        isChatLoading={isChatLoading}
        completedMissionsCount={progress.completedMissions.length}
        factsDiscoveredCount={progress.factsDiscovered.length}
        isVoiceMode={echoMode === 'voice'}
        onModeChange={(newMode) => {
          setEchoMode(newMode);
          if (newMode === 'voice') {
            setEchoOpen(false);
          } else {
            setEchoOpen(true);
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
          }
        }}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full">
        {activeTab === 'explore' && (
          <div className="space-y-16">
            {/* Cinematic Landing Hero */}
            <Hero
              onBeginJourney={handleBeginJourney}
              onExploreMissions={() => {
                setActiveTab('missions');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onScrollToArchive={handleScrollToArchive}
            />

            {/* Earth from Above - Authentic NASA Earth Video & Discovery */}
            <EarthFromAbove />

            {/* Destination Hub */}
            <div id="destinations-hub-anchor">
              <DestinationHub
                level={progress.level}
                completedMissions={progress.completedMissions}
                onSelectDestination={handleSelectDestination}
                onEnterMission={handleEnterMission}
              />
            </div>

            {/* Mission Catalog Preview */}
            <div className="border-t border-slate-800/80 pt-8">
              <MissionCatalog
                onSelectMission={handleEnterMission}
                completedMissions={progress.completedMissions}
                initialDestinationFilter="All"
              />
            </div>
          </div>
        )}

        {activeTab === 'atlas' && (
          <div className="py-6">
            <HardwareAtlas
              onSelectMission={(missionId) => {
                handleEnterMission(missionId);
              }}
              onOpenEcho={(prompt) => {
                setEchoPrompt(prompt);
                setEchoOpen(true);
              }}
            />
          </div>
        )}

        {activeTab === 'missions' && (
          <div className="py-6">
            <MissionCatalog
              onSelectMission={handleEnterMission}
              completedMissions={progress.completedMissions}
              initialDestinationFilter={catalogDestinationFilter}
            />
          </div>
        )}

        {activeTab === 'mission-detail' && (
          <div className="py-6">
            <MissionDetail
              mission={selectedMission}
              onBack={() => setActiveTab('missions')}
              onCompleteMission={completeMission}
              onInspectHardware={(comp) => inspectHardware(comp)}
              onDiscoverFact={(factId, xpVal) => discoverFact(factId, xpVal)}
              inspectedComponents={progress.hardwareInspected}
              discoveredFacts={progress.factsDiscovered}
              isCompleted={progress.completedMissions.includes(selectedMission.id)}
              onNavigateToMission={handleEnterMission}
              initialChapter={missionDetailChapter}
              onChapterChange={(ch) => setMissionDetailChapter(ch)}
              onOpenEcho={(prompt) => {
                if (prompt) setEchoPrompt(prompt);
                setEchoOpen(true);
              }}
            />
          </div>
        )}

        {activeTab === 'nasa-feeds' && (
          <div className="py-6">
            <NasaFeeds initialTab={nasaFeedsTab} />
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="py-6">
            <BadgesView
              badges={populatedBadges}
              currentLevelInfo={currentLevelInfo}
              xp={progress.xp}
              completedMissionsCount={progress.completedMissions.length}
              onResetProgress={resetProgress}
              onAddXp={addXp}
              onUnlockBadge={unlockBadge}
            />
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={(tab) => {
        setActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
}

