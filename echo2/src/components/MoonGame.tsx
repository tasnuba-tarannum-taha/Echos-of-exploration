import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Rocket,
  Trophy,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Star,
  Zap,
  Lock,
  Unlock,
  Check,
  ShieldCheck,
  Fuel,
} from 'lucide-react';
import { audioService } from '../services/audioService';

interface MoonGameProps {
  onAddXp?: (amount: number, reason: string) => void;
  onNavigateToMission?: (missionId: string) => void;
}

interface LevelConfig {
  round: number;
  name: string;
  location: string;
  targetPoints: number; // Required points in this round to qualify for next round
  gravity: number;
  initialFuel: number;
  starCount: number;
  fuelPodsCount: number; // Floating fuel refills in the sky
  padWidth: number;
  padOffsetX: number; // Offset from center in pixels
  description: string;
}

const ROUNDS: LevelConfig[] = [
  {
    round: 1,
    name: 'Round 1: Sea of Tranquility (Apollo 11)',
    location: 'Tranquility Base',
    targetPoints: 150, // 1 star (100) + 50 landing = 150!
    gravity: 0.95,
    initialFuel: 100,
    starCount: 4,
    fuelPodsCount: 2,
    padWidth: 220,
    padOffsetX: 0,
    description: 'Gather points and touch down (+50) before your fuel finishes! Reach 150 points to launch to Round 2.',
  },
  {
    round: 2,
    name: 'Round 2: Ocean of Storms (Apollo 12)',
    location: 'Surveyor Crater Plain',
    targetPoints: 250, // 2 stars (200) + 50 landing = 250
    gravity: 1.1,
    initialFuel: 95,
    starCount: 5,
    fuelPodsCount: 2,
    padWidth: 180,
    padOffsetX: -60,
    description: 'Pinpoint descent! Grab stars and land on the pad (+50) before propellant runs dry to reach 250 points.',
  },
  {
    round: 3,
    name: 'Round 3: Fra Mauro Highlands (Apollo 14)',
    location: 'Fra Mauro Ridge',
    targetPoints: 350, // 3 stars (300) + 50 landing = 350
    gravity: 1.25,
    initialFuel: 90,
    starCount: 6,
    fuelPodsCount: 2,
    padWidth: 155,
    padOffsetX: 70,
    description: 'Highlands navigation! Gather points and refuel with fuel pods to reach 350 points and clear the round.',
  },
  {
    round: 4,
    name: 'Round 4: Hadley Rille Gorge (Apollo 15)',
    location: 'Hadley-Apennine Canyon',
    targetPoints: 450, // 4 stars (400) + 50 landing = 450
    gravity: 1.35,
    initialFuel: 85,
    starCount: 6,
    fuelPodsCount: 2,
    padWidth: 140,
    padOffsetX: 0,
    description: 'Mountain pass flight! Score 450 points and touch down safely before fuel runs out to unlock Round 5.',
  },
  {
    round: 5,
    name: 'Round 5: Descartes Plateau (Apollo 16)',
    location: 'Descartes Volcanic Basin',
    targetPoints: 550, // 5 stars (500) + 50 landing = 550
    gravity: 1.45,
    initialFuel: 80,
    starCount: 7,
    fuelPodsCount: 3,
    padWidth: 130,
    padOffsetX: -75,
    description: 'High-elevation volcanic plateau! Efficient fuel throttle required. Reach 550 points to advance.',
  },
  {
    round: 6,
    name: 'Round 6: Taurus-Littrow Valley (Apollo 17)',
    location: 'Valley of Taurus-Littrow',
    targetPoints: 650, // 6 stars (600) + 50 landing = 650
    gravity: 1.55,
    initialFuel: 75,
    starCount: 8,
    fuelPodsCount: 3,
    padWidth: 120,
    padOffsetX: 60,
    description: 'The final Apollo challenge! Collect 650 points and land on the pad (+50) before fuel finishes!',
  },
];

interface CollectibleStar {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  pulse: number;
}

interface CollectibleFuelPod {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  pulse: number;
}

export const MoonGame: React.FC<MoonGameProps> = ({ onAddXp }) => {
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const currentRound = ROUNDS[currentRoundIdx] || ROUNDS[0];

  // Highest unlocked round index
  const [unlockedRoundIdx, setUnlockedRoundIdx] = useState<number>(0);

  // Score states
  const [roundScore, setRoundScore] = useState<number>(0); // Points in current flight
  const [fuel, setFuel] = useState<number>(currentRound.initialFuel);
  const [soundOn, setSoundOn] = useState<boolean>(() => audioService.getSoundEnabled());

  // Game flow states:
  // 'flying' | 'crashed' | 'out-of-fuel' | 'landed-short' | 'round-cleared' | 'liftoff'
  const [gameStatus, setGameStatus] = useState<
    'flying' | 'crashed' | 'out-of-fuel' | 'landed-short' | 'round-cleared' | 'liftoff'
  >('flying');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [pointNotification, setPointNotification] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics simulation refs
  const simRef = useRef({
    x: 400,
    y: 70,
    vx: 0,
    vy: 0.5,
    fuel: currentRound.initialFuel,
    thrusting: false,
    movingLeft: false,
    movingRight: false,
    landed: false,
    crashed: false,
    liftoff: false, // animated launch to next round
    padLeft: 300,
    padRight: 500,
    groundY: 410,
    roundScore: 0,
    stars: [] as CollectibleStar[],
    fuelPods: [] as CollectibleFuelPod[],
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
  });

  // Sound helper
  const playTone = useCallback((freq = 520, duration = 0.15) => {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [soundOn]);

  // Generate stars across the sky
  const initCollectibles = useCallback((roundCfg: LevelConfig, w = 800) => {
    const stars: CollectibleStar[] = [];
    const step = (w - 160) / (roundCfg.starCount + 1);
    for (let i = 0; i < roundCfg.starCount; i++) {
      stars.push({
        id: i,
        x: 80 + step * (i + 1) + (Math.random() - 0.5) * 35,
        y: 120 + Math.random() * 180,
        collected: false,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const fuelPods: CollectibleFuelPod[] = [];
    for (let i = 0; i < roundCfg.fuelPodsCount; i++) {
      fuelPods.push({
        id: i,
        x: 140 + (i * (w - 280)) / Math.max(1, roundCfg.fuelPodsCount - 1) + (Math.random() - 0.5) * 40,
        y: 160 + Math.random() * 140,
        collected: false,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    return { stars, fuelPods };
  }, []);

  // Reset flight for current round
  const resetFlight = useCallback((roundCfg = currentRound) => {
    const { stars, fuelPods } = initCollectibles(roundCfg);
    simRef.current.x = 400;
    simRef.current.y = 60;
    simRef.current.vx = 0;
    simRef.current.vy = 0.5;
    simRef.current.fuel = roundCfg.initialFuel;
    simRef.current.thrusting = false;
    simRef.current.movingLeft = false;
    simRef.current.movingRight = false;
    simRef.current.landed = false;
    simRef.current.crashed = false;
    simRef.current.liftoff = false;
    simRef.current.roundScore = 0;
    simRef.current.particles = [];
    simRef.current.stars = stars;
    simRef.current.fuelPods = fuelPods;

    setRoundScore(0);
    setFuel(roundCfg.initialFuel);
    setGameStatus('flying');
    setStatusMessage('');
  }, [currentRound, initCollectibles]);

  // When round changes
  useEffect(() => {
    resetFlight(currentRound);
  }, [currentRoundIdx, currentRound, resetFlight]);

  // Trigger point banner
  const triggerPointAward = (earned: number, label: string) => {
    simRef.current.roundScore += earned;
    setRoundScore(simRef.current.roundScore);

    if (onAddXp) {
      onAddXp(earned, label);
    }

    setPointNotification(`+${earned} PTS: ${label}`);
    setTimeout(() => setPointNotification(null), 2200);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'KeyR'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyR') {
        resetFlight();
        return;
      }

      // Thruster only works if fuel > 0
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && simRef.current.fuel > 0) {
        simRef.current.thrusting = true;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        simRef.current.movingLeft = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        simRef.current.movingRight = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        simRef.current.thrusting = false;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        simRef.current.movingLeft = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        simRef.current.movingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetFlight]);

  // Launch Safely to Next Round sequence
  const handleLaunchToNextRound = () => {
    setGameStatus('liftoff');
    simRef.current.liftoff = true;
    playTone(320, 0.4);
    setTimeout(() => playTone(640, 0.5), 300);
    setTimeout(() => playTone(880, 0.6), 700);

    setTimeout(() => {
      if (currentRoundIdx < ROUNDS.length - 1) {
        const nextIdx = currentRoundIdx + 1;
        setCurrentRoundIdx(nextIdx);
        if (nextIdx > unlockedRoundIdx) {
          setUnlockedRoundIdx(nextIdx);
        }
      } else {
        // Replay campaign from Round 1
        setCurrentRoundIdx(0);
      }
      setGameStatus('flying');
    }, 1400);
  };

  // Main canvas animation & physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const sim = simRef.current;

      sim.groundY = h - 60;
      const padCenterX = w / 2 + currentRound.padOffsetX;
      sim.padLeft = padCenterX - currentRound.padWidth / 2;
      sim.padRight = padCenterX + currentRound.padWidth / 2;

      // ------------------------------------------------------------------
      // Physics Step (During Flight)
      // ------------------------------------------------------------------
      if (!sim.landed && !sim.crashed && !sim.liftoff) {
        // Lateral steering
        if (sim.movingLeft) sim.vx = -1.8;
        else if (sim.movingRight) sim.vx = 1.8;
        else sim.vx *= 0.92; // auto-stabilizer

        // FUEL CONSUMPTION:
        // Idle life-support burn (0.02% per frame) + Active Thrust Burn (0.12% per frame)
        sim.fuel = Math.max(0, sim.fuel - 0.02);

        // Main engine thrust (Only if fuel > 0!)
        if (sim.thrusting && sim.fuel > 0) {
          sim.vy -= 0.12; // counteract gravity
          sim.fuel = Math.max(0, sim.fuel - 0.12);

          // Exhaust particles
          for (let i = 0; i < 2; i++) {
            sim.particles.push({
              x: sim.x + (Math.random() - 0.5) * 8,
              y: sim.y + 18,
              vx: (Math.random() - 0.5) * 1.5,
              vy: Math.random() * 4 + 2,
              life: 15,
              color: Math.random() > 0.4 ? '#38bdf8' : '#f59e0b',
            });
          }
        }

        // FUEL FINISHED CHECK:
        if (sim.fuel <= 0 && sim.thrusting) {
          sim.thrusting = false; // flameout
        }

        // Lunar gravity
        sim.vy += currentRound.gravity * 0.022;

        // Terminal velocity cap
        if (sim.vy > 3.8) sim.vy = 3.8;

        // Apply movement
        sim.x += sim.vx;
        sim.y += sim.vy;

        // Boundary clamp
        if (sim.x < 30) {
          sim.x = 30;
          sim.vx = 0;
        }
        if (sim.x > w - 30) {
          sim.x = w - 30;
          sim.vx = 0;
        }

        // Check Star Collectibles Collision (+100 points each)
        for (const star of sim.stars) {
          if (!star.collected) {
            const dx = sim.x - star.x;
            const dy = sim.y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 32) {
              star.collected = true;
              playTone(750, 0.15);
              triggerPointAward(100, 'Star Collected');
            }
          }
        }

        // Check Fuel Pods Collision (+25% Fuel refill!)
        for (const pod of sim.fuelPods) {
          if (!pod.collected) {
            const dx = sim.x - pod.x;
            const dy = sim.y - pod.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 32) {
              pod.collected = true;
              sim.fuel = Math.min(100, sim.fuel + 25);
              playTone(950, 0.2);
              setPointNotification('⛽ +25% FUEL REFILLED!');
              setTimeout(() => setPointNotification(null), 2000);
            }
          }
        }

        // Check Touchdown / Ground Collision
        if (sim.y + 18 >= sim.groundY) {
          const onPad = sim.x >= sim.padLeft && sim.x <= sim.padRight;
          const softLanding = sim.vy <= 3.8;

          // Did fuel finish while attempting to land?
          const wasOutOfFuel = sim.fuel <= 0;

          if (onPad && softLanding) {
            // SAFE LANDING ACHIEVED: 50 POINTS!
            sim.landed = true;
            sim.y = sim.groundY - 18;
            sim.vx = 0;
            sim.vy = 0;

            const landingBonus = 50; // Exact 50 points for landing on pad as requested!
            playTone(660, 0.3);
            setTimeout(() => playTone(880, 0.35), 180);
            triggerPointAward(landingBonus, 'Landing Pad Bonus');

            const finalRoundScore = sim.roundScore; // includes the +50 landing bonus
            if (finalRoundScore >= currentRound.targetPoints) {
              // BOTH CONDITIONS MET: SAFE LANDING + TARGET POINTS MET BEFORE FUEL EXHAUSTED!
              setGameStatus('round-cleared');
              setStatusMessage('Safe Touchdown! Target Score Reached!');
              playTone(1050, 0.4);
            } else {
              // SAFE LANDING BUT NOT ENOUGH POINTS YET
              setGameStatus('landed-short');
              setStatusMessage(`Safe landing (+50 pts), but need ${currentRound.targetPoints - finalRoundScore} more points to pass!`);
            }
          } else {
            // CRASH (Failed landing or ran out of fuel)
            sim.crashed = true;
            if (wasOutOfFuel) {
              setGameStatus('out-of-fuel');
              setStatusMessage('FUEL FINISHED! Propellant depleted before you could land safely.');
            } else {
              setGameStatus('crashed');
              setStatusMessage(
                !onPad
                  ? 'Missed the landing pad! Must land within the green zone.'
                  : 'Touchdown was too hard! Hold THRUST to cushion landing.'
              );
            }
            playTone(150, 0.4);
          }
        }
      }

      // Liftoff animation physics (Ascent stage launches into space)
      if (sim.liftoff) {
        sim.y -= 5.5; // fly up
        for (let i = 0; i < 4; i++) {
          sim.particles.push({
            x: sim.x + (Math.random() - 0.5) * 6,
            y: sim.y + 12,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 6 + 4,
            life: 20,
            color: Math.random() > 0.3 ? '#f59e0b' : '#38bdf8',
          });
        }
      }

      setFuel(Math.round(sim.fuel));

      // -------------------------------------------------------------
      // Render Canvas
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, w, h);

      // Deep space night sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, sim.groundY);
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(1, '#0b1638');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, sim.groundY);

      // Distant stars background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97) % w;
        const sy = (i * 53) % (sim.groundY - 80);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Earth in lunar sky
      ctx.save();
      const ex = w - 100;
      const ey = 60;
      const eg = ctx.createRadialGradient(ex - 6, ey - 6, 2, ex, ey, 24);
      eg.addColorStop(0, '#38bdf8');
      eg.addColorStop(0.7, '#0284c7');
      eg.addColorStop(1, '#082f49');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ex, ey, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Floating Collectible Stars (+100 PTS)
      for (const star of sim.stars) {
        if (!star.collected) {
          star.pulse += 0.05;
          const scale = 1 + Math.sin(star.pulse) * 0.15;
          ctx.save();
          ctx.translate(star.x, star.y);
          ctx.scale(scale, scale);

          // Glow halo
          ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();

          // Star shape
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          for (let p = 0; p < 5; p++) {
            const rot = (p * Math.PI) / 2.5;
            ctx.lineTo(Math.cos(rot) * 12, Math.sin(rot) * 12);
            ctx.lineTo(Math.cos(rot + Math.PI / 5) * 5, Math.sin(rot + Math.PI / 5) * 5);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Star label
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('+100', 0, 24);
          ctx.restore();
        }
      }

      // Floating Collectible Fuel Pods (+25% Fuel)
      for (const pod of sim.fuelPods) {
        if (!pod.collected) {
          pod.pulse += 0.06;
          const bounce = Math.sin(pod.pulse) * 4;
          ctx.save();
          ctx.translate(pod.x, pod.y + bounce);

          // Blue energy glow
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          // Fuel canister body
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.roundRect(-8, -12, 16, 24, 4);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Fuel symbol
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⛽', 0, 4);

          // Tag
          ctx.fillStyle = '#7dd3fc';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('+25% FUEL', 0, 24);
          ctx.restore();
        }
      }

      // Lunar Ground
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, sim.groundY, w, h - sim.groundY);

      // Green Landing Target Zone (50 Points!)
      ctx.save();
      const padW = sim.padRight - sim.padLeft;

      // Holographic Landing Beacons
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fillRect(sim.padLeft, sim.groundY - 120, padW, 120);

      ctx.fillStyle = '#10b981';
      ctx.fillRect(sim.padLeft, sim.groundY - 4, padW, 8);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sim.padLeft, sim.groundY - 4, padW, 8);

      // Landing Label (50 PTS)
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LAND HERE (+50 PTS)', (sim.padLeft + sim.padRight) / 2, sim.groundY + 24);
      ctx.restore();

      // Exhaust particles
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const p = sim.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) {
          sim.particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw the Lunar Lander
      if (!sim.crashed) {
        ctx.save();
        ctx.translate(sim.x, sim.y);

        // Floating Fuel Indicator over craft if running low
        if (sim.fuel < 35 && !sim.landed) {
          ctx.fillStyle = sim.fuel < 15 ? '#ef4444' : '#f59e0b';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`⛽ ${Math.round(sim.fuel)}% FUEL`, 0, -32);
        }

        // Gold octagonal descent body
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.moveTo(-16, 4);
        ctx.lineTo(-12, -8);
        ctx.lineTo(12, -8);
        ctx.lineTo(16, 4);
        ctx.lineTo(12, 12);
        ctx.lineTo(-12, 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cockpit upper ascent stage
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(-12, -22, 24, 14, 3);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();

        // Cockpit window
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-8, -18, 16, 6);

        // Landing gear struts
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 8);
        ctx.lineTo(-22, 18);
        ctx.moveTo(12, 8);
        ctx.lineTo(22, 18);
        ctx.stroke();

        // Gold pads
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-26, 16, 8, 3);
        ctx.fillRect(18, 16, 8, 3);

        ctx.restore();
      } else {
        // Crash explosion marker
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💥', sim.x, sim.y);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentRound, playTone]);

  // Progress toward target points in this round
  const pointsProgressPct = Math.min(100, Math.round((roundScore / currentRound.targetPoints) * 100));
  const hasMetPointGoal = roundScore >= currentRound.targetPoints;

  return (
    <div id="astronaut-journey-game-view" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------- */}
      {/* 1. ROUND NAVIGATION TABS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ROUNDS.map((r, idx) => {
          const isSelected = idx === currentRoundIdx;
          const isUnlocked = idx <= unlockedRoundIdx;
          return (
            <button
              key={r.round}
              onClick={() => {
                if (isUnlocked) {
                  setCurrentRoundIdx(idx);
                  setGameStatus('flying');
                }
              }}
              disabled={!isUnlocked}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md cursor-default'
                  : isUnlocked
                  ? 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer'
                  : 'bg-slate-950/60 border border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              {isUnlocked ? (
                idx < unlockedRoundIdx ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Rocket className="w-3.5 h-3.5" />
                )
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>Round {r.round}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ROUND REQUIREMENT HEADER & LIVE FUEL MONITOR */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Rocket className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  {currentRound.location}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Round {currentRound.round} of 6
                </span>
              </div>
              <h1 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white uppercase leading-tight">
                {currentRound.name}
              </h1>
            </div>
          </div>

          {/* Sound & Retry */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                const next = audioService.toggleSound();
                setSoundOn(next);
              }}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
              title="Toggle Sound"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={() => resetFlight()}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Round</span>
            </button>
          </div>
        </div>

        {/* 2-Step Requirement Progress Banner with LIVE FUEL MONITOR */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            {/* Condition 1: Specific Point Goal */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">1. ROUND SCORE:</span>
              <span className="font-bold flex items-center gap-1.5">
                <span className={hasMetPointGoal ? 'text-emerald-400' : 'text-amber-400'}>
                  {roundScore} / {currentRound.targetPoints} PTS
                </span>
                {hasMetPointGoal ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">(Stars)</span>
                )}
              </span>
            </div>

            {/* Condition 2: Safe Touchdown on Pad */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">2. LANDING (+50):</span>
              <span className="font-bold flex items-center gap-1.5">
                {gameStatus === 'round-cleared' || gameStatus === 'landed-short' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    CONFIRMED
                  </span>
                ) : (
                  <span className="text-cyan-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    AIM FOR PAD
                  </span>
                )}
              </span>
            </div>

            {/* Live Fuel Tank Feature */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PROPELLANT:</span>
                </span>
                <span
                  className={`font-bold ${
                    fuel < 20
                      ? 'text-rose-400 animate-pulse'
                      : fuel < 45
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {fuel}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    fuel < 20
                      ? 'bg-rose-500 animate-pulse'
                      : fuel < 45
                      ? 'bg-amber-500'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${fuel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Points Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hasMetPointGoal
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_12px_#34d399]'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
              style={{ width: `${pointsProgressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Stars: +100 PTS • Landing Pad: +50 PTS • Fuel Pod: +25%</span>
            <span className={hasMetPointGoal ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {hasMetPointGoal
                ? '✓ Target met! Touch down on the green pad before fuel finishes.'
                : `${currentRound.targetPoints - roundScore} points needed before fuel runs dry`}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. THE GAME CANVAS & PROMINENT SUCCESS / RETRY SCREENS */}
      {/* ------------------------------------------------------------- */}
      <div className="relative rounded-3xl border border-cyan-500/40 bg-slate-950 overflow-hidden shadow-2xl flex flex-col">
        {/* Floating Point Notification Banner */}
        {pointNotification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-amber-500 text-slate-950 font-mono text-sm font-bold shadow-lg animate-bounce flex items-center gap-1.5 pointer-events-none">
            <Star className="w-4 h-4 fill-slate-950" />
            <span>{pointNotification}</span>
          </div>
        )}

        {/* Canvas */}
        <div className="relative w-full h-[400px] sm:h-[450px] bg-black">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            className="w-full h-full object-cover block select-none"
          />

          {/* SCREEN: SAFE LANDING + MET SPECIFIC POINT GOAL BEFORE FUEL FINISHED -> LAUNCH TO NEXT ROUND */}
          {gameStatus === 'round-cleared' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-slate-950 border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shadow-md">
                  <Trophy className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block font-bold">
                    ✓ SAFE LANDING CONFIRMED & TARGET SCORE REACHED!
                  </span>
                  <h2 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white uppercase">
                    ROUND {currentRound.round} CLEARED!
                  </h2>
                  <p className="text-xs text-slate-300 pt-1">
                    You scored <strong className="text-emerald-400">{roundScore} pts</strong> (Target: {currentRound.targetPoints}) with <strong className="text-cyan-400">{fuel}% fuel remaining</strong>! You are cleared to launch into the next round.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleLaunchToNextRound}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-bold text-base font-mono uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentRoundIdx < ROUNDS.length - 1
                        ? `🚀 LAUNCH SAFELY TO ROUND ${currentRound.round + 1} ➔`
                        : '🚀 LAUNCH TO CAMPAIGN VICTORY ➔'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: CRASHED (FAILED SAFE LANDING) */}
          {gameStatus === 'crashed' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="max-w-md w-full p-6 rounded-3xl bg-slate-950 border border-rose-500/60 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase">
                    TOUCHDOWN FAILED
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    {statusMessage || 'You must perform a safe landing on the green pad (+50) to complete the round!'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-xs font-mono text-slate-300">
                  Score: <span className="text-amber-400 font-bold">{roundScore} pts</span> • Target needed: <span className="text-emerald-400 font-bold">{currentRound.targetPoints} pts</span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => resetFlight()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Round Again</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: OUT OF FUEL */}
          {gameStatus === 'out-of-fuel' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="max-w-md w-full p-6 rounded-3xl bg-slate-950 border border-rose-500/60 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400">
                  <Fuel className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-rose-400 uppercase tracking-widest font-bold">
                    PROPELLANT DEPLETED
                  </span>
                  <h3 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase">
                    FUEL FINISHED!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You ran out of fuel before touching down on the pad! Remember to collect floating blue Fuel Pods (+25% fuel) and land before your tank is empty.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-xs font-mono text-slate-300">
                  Gather points and land safely before fuel hits 0%!
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => resetFlight()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart Round with Full Fuel</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: SAFE LANDING BUT NOT ENOUGH POINTS TO ADVANCE */}
          {gameStatus === 'landed-short' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="max-w-md w-full p-6 rounded-3xl bg-slate-950 border border-amber-500/60 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Star className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
                    ✓ TOUCHDOWN SAFE (+50 PTS)
                  </span>
                  <h3 className="font-['Rajdhani'] font-bold text-2xl text-white uppercase">
                    NEED MORE POINTS TO ADVANCE!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You landed safely (+50 pts) with fuel remaining, but scored <strong className="text-amber-400">{roundScore} pts</strong> (Target: <strong className="text-emerald-400">{currentRound.targetPoints} pts</strong>).
                    <br />
                    Fly again and catch <strong className="text-white">{Math.ceil((currentRound.targetPoints - roundScore) / 100)} more stars</strong> before landing on the pad!
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => resetFlight()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Fly Again To Catch Stars & Land ➔</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. SUPER SIMPLE 3-BUTTON CONTROLS */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            <span className="text-cyan-400 font-bold">CONTROLS: </span>
            <span>[SPACE] to Thrust • [LEFT / RIGHT] to Steer • Watch Fuel!</span>
          </div>

          {/* Big, clean touch buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <button
              onMouseDown={() => (simRef.current.movingLeft = true)}
              onMouseUp={() => (simRef.current.movingLeft = false)}
              onTouchStart={() => (simRef.current.movingLeft = true)}
              onTouchEnd={() => (simRef.current.movingLeft = false)}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 active:bg-cyan-950 border border-slate-700 text-cyan-300 font-mono text-sm font-bold active:scale-95 transition-all select-none shadow-sm cursor-pointer"
            >
              ◀ LEFT
            </button>

            <button
              onMouseDown={() => {
                if (simRef.current.fuel > 0) simRef.current.thrusting = true;
              }}
              onMouseUp={() => (simRef.current.thrusting = false)}
              onTouchStart={() => {
                if (simRef.current.fuel > 0) simRef.current.thrusting = true;
              }}
              onTouchEnd={() => (simRef.current.thrusting = false)}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-mono text-base font-bold active:scale-95 transition-all select-none shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              ▲ HOLD TO THRUST
            </button>

            <button
              onMouseDown={() => (simRef.current.movingRight = true)}
              onMouseUp={() => (simRef.current.movingRight = false)}
              onTouchStart={() => (simRef.current.movingRight = true)}
              onTouchEnd={() => (simRef.current.movingRight = false)}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 active:bg-cyan-950 border border-slate-700 text-cyan-300 font-mono text-sm font-bold active:scale-95 transition-all select-none shadow-sm cursor-pointer"
            >
              RIGHT ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
