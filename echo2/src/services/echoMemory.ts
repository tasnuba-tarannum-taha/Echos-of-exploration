export interface EchoMemoryData {
  position?: { x: number; y: number };
  voicePermission?: 'prompt' | 'granted' | 'denied';
  lastVisitedMission?: { id: string; title: string; timestamp: number };
  destinationViews: { Moon: number; Mars: number; 'Deep Space': number };
  quizHighScore?: number;
  factsDiscoveredCount: number;
  hasSeenWelcome: boolean;
}

const STORAGE_KEY = 'echo_companion_memory';

const defaultMemory: EchoMemoryData = {
  destinationViews: { Moon: 0, Mars: 0, 'Deep Space': 0 },
  factsDiscoveredCount: 0,
  hasSeenWelcome: false,
};

export const echoMemory = {
  get(): EchoMemoryData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultMemory };
      const parsed = JSON.parse(raw);
      return { ...defaultMemory, ...parsed };
    } catch {
      return { ...defaultMemory };
    }
  },

  set(updates: Partial<EchoMemoryData>) {
    try {
      const current = this.get();
      const updated = { ...current, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage full or disabled
    }
  },

  recordMissionVisit(id: string, title: string, destination?: string) {
    const mem = this.get();
    const destViews = { ...mem.destinationViews };
    if (destination === 'Moon' || destination === 'Mars' || destination === 'Deep Space') {
      destViews[destination] = (destViews[destination] || 0) + 1;
    }
    this.set({
      lastVisitedMission: { id, title, timestamp: Date.now() },
      destinationViews: destViews,
    });
  },

  recordQuizScore(score: number) {
    const mem = this.get();
    const currentHigh = mem.quizHighScore || 0;
    if (score > currentHigh) {
      this.set({ quizHighScore: score });
    }
  },

  savePosition(x: number, y: number) {
    this.set({ position: { x, y } });
  },

  clearPosition() {
    const mem = this.get();
    delete mem.position;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  },

  getWelcomeGreeting(): string {
    const mem = this.get();
    if (mem.lastVisitedMission?.title) {
      return `Welcome back! Shall we continue exploring ${mem.lastVisitedMission.title}?`;
    }
    const moonViews = mem.destinationViews.Moon || 0;
    const marsViews = mem.destinationViews.Mars || 0;
    if (marsViews > moonViews && marsViews > 0) {
      return `Welcome back, Martian Explorer! Ready to investigate more abandoned rovers?`;
    }
    if (moonViews > 0) {
      return `Welcome back to the Moon and Mars archives! What shall we discover today?`;
    }
    return `Hi Explorer 👋 I’m ECHO, your AI museum companion!`;
  },
};
