import { audioService } from './audioService';

export interface VoiceCommandAction {
  type: 'navigate' | 'ask' | 'greet' | 'stop';
  targetTab?: 'explore' | 'journey' | 'atlas' | 'missions' | 'mission-detail' | 'nasa-feeds' | 'badges';
  missionId?: string;
  catalogFilter?: 'Moon' | 'Mars' | 'Deep Space' | 'All';
  speechText?: string;
  query?: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

class VoiceAssistantService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private isVoiceModeEnabled: boolean = false;
  private stateListeners: Set<(state: VoiceState) => void> = new Set();
  private transcriptListeners: Set<(text: string, isFinal: boolean) => void> = new Set();
  private commandHandler: ((action: VoiceCommandAction) => void) | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lastSpokenText: string = '';
  private lastProcessedCommand: string = '';
  private lastProcessedTime: number = 0;
  private restartTimeout: any = null;
  private watchdogInterval: any = null;
  private permissionDenied: boolean = false;
  private currentState: VoiceState = 'idle';
  private speakStartedAt: number = 0;
  private processingSince: number = 0;
  private micHoldUntil: number = 0; // keeps the mic off briefly after Echo finishes talking

  constructor() {
    this.initRecognition();
    this.startWatchdog();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.permissionDenied = false;
          if (!this.isSpeaking) {
            this.notifyState('listening');
          }
        };

        this.recognition.onresult = (event: any) => {
          if (this.currentState !== 'listening' || this.isSpeaking) {
            return; // STRICT GUARD: Ignore all recognition results when not listening or while speaking
          }

          let interim = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const transcript = res[0].transcript;
            if (res.isFinal) {
              finalTranscript += transcript;
            } else {
              interim += transcript;
            }
          }

          const rawText = (finalTranscript || interim).trim();
          if (rawText && this.currentState === 'listening' && !this.isSpeaking) {
            this.notifyTranscript(rawText, !!finalTranscript);
          }

          if (finalTranscript && this.currentState === 'listening' && !this.isSpeaking) {
            // Immediately stop recognition and enter processing state
            if (this.restartTimeout) clearTimeout(this.restartTimeout);
            if (this.recognition) {
              try {
                this.recognition.stop();
              } catch {
                // ignore
              }
            }
            this.isListening = false;
            this.notifyState('processing');
            this.handleTranscript(finalTranscript.toLowerCase());
          }
        };

        this.recognition.onerror = (event: any) => {
          const err = event.error;
          // 'no-speech' is a normal browser pause when the user is silent
          if (err === 'no-speech') {
            // Do not treat as a terminal error. The continuous engine will restart smoothly.
            return;
          }

          if (err === 'aborted') {
            // Expected during speech pauses or programmatic restarts
            return;
          }

          if (err === 'not-allowed' || err === 'service-not-allowed') {
            console.warn('[VoiceAssistant] Microphone permission denied or lost');
            this.permissionDenied = true;
            this.isListening = false;
            this.isVoiceModeEnabled = false;
            this.notifyState('error');
            return;
          }

          console.warn('[VoiceAssistant] Recognition event:', err);
          if (this.isVoiceModeEnabled && !this.isSpeaking && !this.permissionDenied) {
            this.scheduleRestart(350);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          // CRITICAL: Automatically restart recognition so it NEVER stops after one command!
          if (this.isVoiceModeEnabled && !this.isSpeaking && !this.permissionDenied) {
            this.scheduleRestart(100);
          } else if (!this.isSpeaking) {
            this.notifyState('idle');
          }
        };
      } catch (err) {
        console.warn('[VoiceAssistant] Speech recognition initialization failed:', err);
        this.isSupported = false;
      }
    } else {
      this.isSupported = false;
    }
  }

  /**
   * Watchdog timer: keeps the voice engine alive during Voice Mode and rescues
   * every "stuck" state (speaking / processing) so Echo never freezes.
   */
  private startWatchdog() {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    this.watchdogInterval = setInterval(() => {
      const now = Date.now();

      // 1. Speech engine finished but we never got an onend event
      if (this.isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        if (now - this.speakStartedAt > 2500 && !synth.speaking && !synth.pending) {
          console.warn('[VoiceAssistant] Watchdog detected stuck speaking state. Forcing reset.');
          this.isSpeaking = false;
          this.currentUtterance = null;
          this.recoverState();
        }
      }

      // 2. UI says "speaking" but nothing is speaking
      if (!this.isSpeaking && this.currentState === 'speaking') {
        this.recoverState();
      }

      // 3. Stuck in "processing" (a command produced no spoken reply)
      if (
        this.currentState === 'processing' &&
        !this.isSpeaking &&
        now - this.processingSince > 20000
      ) {
        console.warn('[VoiceAssistant] Watchdog detected stuck processing state. Forcing reset.');
        this.recoverState();
      }

      // 4. Keep the microphone alive in Voice Mode
      if (this.isVoiceModeEnabled && !this.isListening && !this.isSpeaking && !this.permissionDenied) {
        this.safeStart();
      }
    }, 1500);
  }

  /**
   * Leaves a stuck state: back to listening in Voice Mode, otherwise idle.
   * The state is changed FIRST because safeStart() refuses to run while the
   * state is 'speaking' or 'processing'.
   */
  private recoverState() {
    if (this.isVoiceModeEnabled && !this.permissionDenied) {
      this.notifyState('listening');
      this.safeStart();
    } else {
      this.notifyState('idle');
    }
  }

  private scheduleRestart(delayMs: number = 150) {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      if (this.isVoiceModeEnabled && !this.isSpeaking && !this.permissionDenied) {
        this.safeStart();
      }
    }, delayMs);
  }

  private safeStart() {
    if (
      !this.isSupported ||
      !this.recognition ||
      this.permissionDenied ||
      !this.isVoiceModeEnabled ||
      this.isSpeaking ||
      this.currentState === 'speaking' ||
      this.currentState === 'processing' ||
      Date.now() < this.micHoldUntil
    ) {
      return;
    }
    try {
      if (!this.isListening) {
        this.recognition.start();
      }
    } catch {
      // Ignored if already starting or active
    }
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  public isVoiceModeActive(): boolean {
    return this.isVoiceModeEnabled;
  }

  public getStatus(): VoiceState {
    return this.currentState;
  }

  public onStateChange(listener: (state: VoiceState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => this.stateListeners.delete(listener);
  }

  public onTranscript(listener: (text: string, isFinal: boolean) => void): () => void {
    this.transcriptListeners.add(listener);
    return () => this.transcriptListeners.delete(listener);
  }

  public setCommandHandler(handler: (action: VoiceCommandAction) => void) {
    this.commandHandler = handler;
  }

  private notifyState(state: VoiceState) {
    if (state === 'processing' && this.currentState !== 'processing') {
      this.processingSince = Date.now();
    }
    this.currentState = state;
    this.stateListeners.forEach((l) => l(state));
  }

  private notifyTranscript(text: string, isFinal: boolean) {
    this.transcriptListeners.forEach((l) => l(text, isFinal));
  }

  /**
   * Enables continuous Voice Mode
   */
  public enableVoiceMode() {
    this.isVoiceModeEnabled = true;
    this.permissionDenied = false;
    audioService.playRobotChirp('wake');
    if (!this.isSpeaking) {
      this.notifyState('listening');
      this.safeStart();
    }
  }

  /**
   * Disables Voice Mode (switches to Chat mode)
   */
  public disableVoiceMode() {
    this.isVoiceModeEnabled = false;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
    this.notifyState('idle');
  }

  public toggleVoiceMode(): boolean {
    if (this.isVoiceModeEnabled) {
      this.disableVoiceMode();
      return false;
    } else {
      this.enableVoiceMode();
      return true;
    }
  }

  /**
   * Backward compatible startListening
   */
  public startListening(continuous: boolean = true) {
    this.enableVoiceMode();
  }

  /**
   * Backward compatible stopListening
   */
  public stopListening() {
    this.disableVoiceMode();
  }

  /**
   * Parses natural speech commands and maps to autonomous actions
   */
  public handleTranscript(phrase: string) {
    if (this.currentState !== 'processing' || this.isSpeaking) {
      return; // STRICT GUARD: Only process when in processing state and not speaking
    }

    const clean = phrase.toLowerCase().replace(/[.,!?;:]/g, '').trim();

    // Check for wake prefix or direct commands
    const command = clean.replace(/^(hey echo|ok echo|echo|hi echo|hello echo)\s*/i, '').trim();

    if (command.length < 2) {
      this.recoverState();
      return;
    }

    // Deduplication guard: prevent identical commands from executing twice within 3.5 seconds
    const now = Date.now();
    if (command === this.lastProcessedCommand && now - this.lastProcessedTime < 3500) {
      this.recoverState();
      return;
    }
    this.lastProcessedCommand = command;
    this.lastProcessedTime = now;

    // 0. Stop / Interruption
    if (
      command === 'stop' ||
      command === 'stop talking' ||
      command === 'wait' ||
      command === 'cancel' ||
      command === 'be quiet' ||
      command === 'quiet'
    ) {
      this.stopSpeaking();
      this.dispatchAction({
        type: 'stop',
        speechText: 'Standing by.',
      });
      return;
    }

    // Turn voice mode off via voice
    if (
      command.includes('turn voice mode off') ||
      command.includes('disable voice') ||
      command.includes('turn voice off') ||
      command.includes('switch to chat')
    ) {
      this.disableVoiceMode();
      this.dispatchAction({
        type: 'stop',
        speechText: 'Switching to chat mode.',
      });
      return;
    }

    this.notifyState('processing');
    audioService.playRobotChirp('curious');

    // 1. Moon Missions: User explicitly says "Hey Echo, take me to Moon Mission."
    if (
      command.includes('moon mission') ||
      command.includes('lunar mission') ||
      command.includes('take me to moon') ||
      command.includes('go to moon') ||
      command.includes('open moon') ||
      command.includes('show moon') ||
      command === 'moon'
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'missions',
        catalogFilter: 'Moon',
        speechText: 'Opening Moon Mission.',
      });
      return;
    }

    // 2. Mars Missions: "take me to Mars Mission"
    if (
      command.includes('mars mission') ||
      command.includes('martian mission') ||
      command.includes('take me to mars') ||
      command.includes('go to mars') ||
      command.includes('open mars') ||
      command.includes('show mars') ||
      command === 'mars'
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'missions',
        catalogFilter: 'Mars',
        speechText: 'Opening Mars Mission.',
      });
      return;
    }

    // 3. Hardware Atlas
    if (
      command.includes('atlas') ||
      command.includes('hardware map') ||
      command.includes('show map') ||
      command.includes('surface map') ||
      command.includes('take me to atlas')
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'atlas',
        speechText: 'Opening Hardware Atlas.',
      });
      return;
    }

    // 4. Specific Missions
    if (
      command.includes('apollo 11') ||
      command.includes('eagle lander') ||
      command.includes('sea of tranquility')
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'mission-detail',
        missionId: 'apollo-11-lm',
        speechText: 'Opening Apollo 11 Lunar Module Descent Stage.',
      });
      return;
    }

    if (
      command.includes('surveyor') ||
      command.includes('surveyor 3') ||
      command.includes('ocean of storms')
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'mission-detail',
        missionId: 'surveyor-3',
        speechText: 'Opening Surveyor 3 Lunar Lander.',
      });
      return;
    }

    if (
      command.includes('lunar rover') ||
      command.includes('lunar roving vehicle') ||
      command.includes('apollo 15 rover') ||
      command.includes('apollo 15') ||
      command.includes('hadley rille')
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'mission-detail',
        missionId: 'lunar-roving-vehicle-15',
        speechText: 'Opening Apollo 15 Lunar Roving Vehicle.',
      });
      return;
    }

    if (command.includes('perseverance') || command.includes('percy') || command.includes('curiosity')) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'missions',
        catalogFilter: 'Mars',
        speechText: 'Opening Mars Mission files for robotic rovers and landers.',
      });
      return;
    }

    if (command.includes('spirit') && !command.includes('opportunity')) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'mission-detail',
        missionId: 'spirit-rover',
        speechText: 'Opening Spirit Rover at Gusev Crater.',
      });
      return;
    }

    if (command.includes('opportunity') || command.includes('oppy')) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'mission-detail',
        missionId: 'opportunity-rover',
        speechText: 'Opening Opportunity Rover at Endeavour Crater.',
      });
      return;
    }

    if (command.includes('insight') || command.includes('marsquake') || command.includes('seismometer')) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'mission-detail',
        missionId: 'insight-lander',
        speechText: 'Opening InSight Mars lander.',
      });
      return;
    }

    if (command.includes('voyager') || command.includes('golden record')) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'mission-detail',
        missionId: 'voyager-1',
        speechText: 'Opening Voyager 1 Golden Record in interstellar space.',
      });
      return;
    }

    if (command.includes('pioneer') || command.includes('pioneer 10') || command.includes('pioneer plaque')) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'mission-detail',
        missionId: 'pioneer-10',
        speechText: 'Opening Pioneer 10 in deep space.',
      });
      return;
    }

    // 5. Hardware Atlas
    if (
      command.includes('compare') ||
      command.includes('comparison') ||
      command.includes('matrix') ||
      command.includes('hardware atlas') ||
      command.includes('atlas')
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'atlas',
        speechText: 'Opening Hardware Atlas.',
      });
      return;
    }

    // 6. Quiz / Junior Explorer / Badges
    if (
      command.includes('quiz') ||
      command.includes('start quiz') ||
      command.includes('junior explorer') ||
      command.includes('academy') ||
      command.includes('badge') ||
      command.includes('certificate')
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'badges',
        speechText: 'Opening Junior Explorer Academy.',
      });
      return;
    }

    // 7. Live NASA / Observatory
    if (
      command.includes('live nasa') ||
      command.includes('observatory') ||
      command.includes('asteroid') ||
      command.includes('solar flare') ||
      command.includes('apod')
    ) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'nasa-feeds',
        speechText: 'Opening Live NASA Feeds.',
      });
      return;
    }

    // 8. Home / Explore
    if (command.includes('home') || command.includes('explore') || command.includes('take me home')) {
      this.dispatchAction({
        type: 'navigate',
        targetTab: 'explore',
        speechText: 'Returning to Museum Home.',
      });
      return;
    }

    // 9. General Question / NASA Inquiry
    this.dispatchAction({
      type: 'ask',
      query: command,
    });
  }

  private dispatchAction(action: VoiceCommandAction) {
    if (this.commandHandler) {
      this.commandHandler(action);
    }
  }

  /**
   * Speaks response text via Browser Speech Synthesis
   * Seamlessly pauses microphone during speech to prevent feedback loops,
   * then resumes continuous listening immediately once speech ends!
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        this.notifyState(this.isVoiceModeEnabled ? 'listening' : 'idle');
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      // Clean markdown tags or URLs
      const cleanText = text
        .replace(/[*#_`~[\]]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      if (!cleanText) {
        this.notifyState(this.isVoiceModeEnabled ? 'listening' : 'idle');
        resolve();
        return;
      }

      this.lastSpokenText = cleanText;

      // Stop recognition and clear restart timeout immediately before speaking
      if (this.restartTimeout) clearTimeout(this.restartTimeout);
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch {
          // ignore
        }
      }
      this.isListening = false;
      this.isSpeaking = true;
      this.speakStartedAt = Date.now();
      this.notifyState('speaking');

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch {
          // ignore
        }
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;

      // Select natural friendly voice
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google US English') ||
              v.name.includes('Samantha') ||
              v.name.includes('Victoria') ||
              v.name.includes('Female'))
        ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.pitch = 1.18; // Friendly, youthful robot companion pitch
      utterance.rate = 1.10;  // Brisk, natural conversational cadence for fast replies

      utterance.onstart = () => {
        if (this.currentUtterance !== utterance) return; // stale event from a replaced/stopped utterance
        this.isSpeaking = true;
        this.notifyState('speaking');
        if (onStart) onStart();
      };

      // Chromium speech freeze safety watchdog & resume pings
      const safetyTimeout = setTimeout(() => {
        if (this.isSpeaking) {
          console.warn('[VoiceAssistant] Speech safety watchdog timeout triggered');
          finishSpeech();
        }
      }, Math.max(4000, cleanText.length * 100 + 3000));

      const resumeInterval = setInterval(() => {
        if (this.isSpeaking && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } catch {
            // ignore
          }
        } else {
          clearInterval(resumeInterval);
        }
      }, 6500);

      let finished = false;
      const finishSpeech = () => {
        if (finished) return;
        finished = true;
        clearTimeout(safetyTimeout);
        clearInterval(resumeInterval);

        // speak() calls cancel() first, which fires onerror for the OLD utterance
        // after the NEW one has already started. Only touch the shared state if
        // this utterance is still the current one.
        const isCurrent = this.currentUtterance === utterance;
        if (isCurrent) {
          this.isSpeaking = false;
          this.currentUtterance = null;
        }
        if (onEnd) onEnd();

        if (isCurrent) {
          // Leave 'speaking' immediately. (Previously the state stayed 'speaking'
          // forever, which blocked the mic from restarting: the "Echo is stuck
          // on SPEAKING" bug.)
          this.notifyState('idle');

          if (this.isVoiceModeEnabled && !this.permissionDenied) {
            // Short acoustic grace pause so the mic doesn't hear the end of Echo's voice
            this.micHoldUntil = Date.now() + 1300;
            setTimeout(() => {
              if (
                this.isVoiceModeEnabled &&
                !this.permissionDenied &&
                !this.isSpeaking &&
                this.currentState === 'idle'
              ) {
                this.notifyState('listening');
                this.safeStart();
              }
            }, 1400);
          }
        }
        resolve();
      };

      utterance.onend = finishSpeech;
      utterance.onerror = finishSpeech;

      try {
        window.speechSynthesis.speak(utterance);
        // Fallback check if onstart doesn't fire within 1200ms
        setTimeout(() => {
          if (this.isSpeaking && !window.speechSynthesis.speaking) {
            finishSpeech();
          }
        }, 1200);
      } catch (err) {
        console.error('[VoiceAssistant] Speech synthesis error:', err);
        finishSpeech();
      }
    });
  }

  public replayLastSpeech() {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText);
    }
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.recoverState();
    }
  }
}

export const voiceAssistant = new VoiceAssistantService();