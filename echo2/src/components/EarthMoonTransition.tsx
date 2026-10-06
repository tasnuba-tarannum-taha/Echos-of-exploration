import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import {
  Rocket,
  CheckCircle2,
  ChevronRight,
  FastForward,
  Compass,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { NasaTextureService } from '../services/textureService';
import { NasaSourceBadge } from './NasaSourceBadge';
import { MISSIONS_DATA } from '../data/missions';

interface EarthMoonTransitionProps {
  from: 'Earth' | 'Moon' | 'Mars';
  to: 'Moon' | 'Mars' | 'Deep Space';
  onComplete: () => void;
  onSelectMission?: (missionId: string) => void;
}

export const EarthMoonTransition: React.FC<EarthMoonTransitionProps> = ({
  from,
  to,
  onComplete,
  onSelectMission,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animIdRef = useRef<number | null>(null);

  // Phases of the cinematic transit:
  // 0: Earth slow rotation with NASA Blue Marble
  // 1: Camera pull away & deep space flight
  // 2: Target planet approach (Moon or Mars)
  // 3: Arrival & Mission Markers / "THIS MACHINE WENT THERE"
  const [transitPhase, setTransitPhase] = useState<0 | 1 | 2 | 3>(0);
  const [selectedMission, setSelectedMission] = useState<any | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<number>(0);

  useEffect(() => {
    audioService.playTelemetryPing();

    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 0, 3.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(10, 4, 8);
    scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.4);
    scene.add(ambientLight);

    // 4. Starfield Background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 800;
      starPos[i + 1] = (Math.random() - 0.5) * 800;
      starPos[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 1.8, transparent: true, opacity: 0.8 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 5. Earth Mesh (Origin)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, 0, 0);
    scene.add(earthGroup);

    const earthMat = new THREE.MeshStandardMaterial({
      map: NasaTextureService.getEarthTrueColorTexture(),
      roughness: 0.65,
    });
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 48), earthMat);
    earthGroup.add(earthMesh);

    const cloudMat = new THREE.MeshStandardMaterial({
      map: NasaTextureService.getEarthCloudTexture(),
      transparent: true,
      opacity: 0.7,
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.215, 32, 32), cloudMat);
    earthGroup.add(cloudMesh);

    // 6. Target Planet Mesh (Moon or Mars)
    const targetGroup = new THREE.Group();
    // Position target far along -Z axis
    targetGroup.position.set(0, 0, -50);
    scene.add(targetGroup);

    const targetTexture =
      to === 'Mars'
        ? NasaTextureService.getMarsTexture()
        : NasaTextureService.getMoonTexture();

    const targetMat = new THREE.MeshStandardMaterial({
      map: targetTexture,
      roughness: 0.85,
    });
    const targetRadius = to === 'Mars' ? 1.0 : 0.75;
    const targetMesh = new THREE.Mesh(new THREE.SphereGeometry(targetRadius, 48, 48), targetMat);
    targetGroup.add(targetMesh);

    // 7. Mission Landing Markers on Target
    const relevantMissions =
      to === 'Mars'
        ? MISSIONS_DATA.filter((m) => m.destination === 'Mars')
        : MISSIONS_DATA.filter((m) => m.destination === 'Moon');

    // Default select first mission for preview
    if (relevantMissions.length > 0) {
      setSelectedMission(relevantMissions[0]);
    }

    relevantMissions.forEach((m, idx) => {
      const phi = (90 - m.location.latitude) * (Math.PI / 180);
      const theta = (m.location.longitude + 180) * (Math.PI / 180);
      const r = targetRadius * 1.01;
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      const markerMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
      );
      markerMesh.position.set(x, y, z);
      targetGroup.add(markerMesh);
    });

    // 8. Animation & Timeline Flow
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      earthMesh.rotation.y += 0.002;
      cloudMesh.rotation.y += 0.003;
      targetMesh.rotation.y += 0.0015;

      // Phase timing:
      // 0 - 2.5s: Earth rotation & pull-back starts
      // 2.5s - 5.5s: Deep space flight toward target
      // 5.5s+: Target planet in full view, mission markers glow
      if (elapsed < 2400) {
        setTransitPhase(0);
        const t = elapsed / 2400;
        camera.position.z = 3.2 + t * 4.0;
        camera.position.y = t * 0.5;
        setPhaseProgress(Math.round(t * 33));
      } else if (elapsed < 5400) {
        setTransitPhase(1);
        const t = (elapsed - 2400) / 3000;
        // Fly through space toward target
        camera.position.z = 7.2 - t * 54.0;
        setPhaseProgress(Math.round(33 + t * 34));
      } else {
        setTransitPhase(2);
        // Hold camera in orbit around target
        camera.position.z = -46.5;
        camera.position.y = 0.2;
        setPhaseProgress(100);
      }

      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      renderer.forceContextLoss(); // free the WebGL context right away (dispose() alone leaves it alive)
    };
  }, [from, to]);

  const targetMissions =
    to === 'Mars'
      ? MISSIONS_DATA.filter((m) => m.destination === 'Mars')
      : MISSIONS_DATA.filter((m) => m.destination === 'Moon');

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black text-white select-none overflow-hidden">
      {/* 3D WebGL Canvas Layer */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Top HUD Bar */}
      <div className="relative z-20 w-full p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <NasaSourceBadge
              type={
                transitPhase === 0
                  ? 'REAL NASA VIDEO'
                  : 'INTERACTIVE VISUALIZATION'
              }
              size="sm"
            />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              INTERPLANETARY TRAJECTORY: {from.toUpperCase()} → {to.toUpperCase()}
            </span>
          </div>
          <h2 className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl uppercase tracking-wider text-white">
            {transitPhase === 0 && 'STAGE 1: REAL EARTH FROM ORBIT (NASA ISS EXPEDITION 65)'}
            {transitPhase === 1 && 'STAGE 2: CAMERA PULLS AWAY INTO DEEP SPACE (INTERACTIVE VISUALIZATION)'}
            {transitPhase === 2 && `STAGE 3: ${to.toUpperCase()} APPROACH & SURFACE LOCK (NASA TOPOGRAPHY)`}
          </h2>
        </div>

        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white text-xs font-mono tracking-wider uppercase transition-colors shrink-0 backdrop-blur-md cursor-pointer"
        >
          <FastForward className="w-4 h-4 text-cyan-400" />
          <span>Skip Cinematic Sequence</span>
        </button>
      </div>

      {/* Stage 1 Real NASA Earth Video Horizon Window (Transitions seamlessly into 3D space flight) */}
      {transitPhase === 0 && (
        <div
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center transition-opacity duration-700"
          style={{
            opacity: phaseProgress < 24 ? 1 : Math.max(0, 1 - (phaseProgress - 24) / 9),
          }}
        >
          <div className="relative w-full h-full max-w-5xl max-h-[75vh] mx-auto rounded-3xl overflow-hidden border border-cyan-500/40 shadow-[0_0_80px_rgba(6,182,212,0.3)]">
            <video
              src="https://images-assets.nasa.gov/video/jsc2022m000172_Earth_in_4K_Expedition_65_Edition/jsc2022m000172_Earth_in_4K_Expedition_65_Edition~mobile.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover transform scale-105 transition-transform duration-2500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <NasaSourceBadge type="REAL NASA VIDEO" size="sm" />
              <span className="text-[11px] font-mono text-cyan-300 bg-black/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                NASA ISS EARTH FOOTAGE • DEPARTURE VIEW
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-300 bg-black/70 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-md">
              <span>CAMERA PULL-BACK INITIATING...</span>
              <span className="text-cyan-400 font-bold">ALTITUDE: 408 KM → ESCAPE TRAJECTORY</span>
            </div>
          </div>
        </div>
      )}

      {/* Center Cinematic Card during Arrival (Phase 2) */}
      {transitPhase === 2 && selectedMission && (
        <div className="relative z-20 self-center max-w-2xl w-full mx-4 bg-[#04091c]/90 border border-cyan-500/50 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.35)] animate-in fade-in zoom-in-95 duration-500 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest">
                TARGET HARDWARE LOCKED ON SURFACE
              </span>
            </div>
            <NasaSourceBadge type="NASA PHOTO" size="sm" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Real NASA Archive Thumbnail */}
            <div className="w-full sm:w-48 aspect-4/3 rounded-xl overflow-hidden bg-black border border-slate-700 shrink-0 relative">
              <img
                src={selectedMission.images[0]?.url}
                alt={selectedMission.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 uppercase">
                NASA ARCHIVE
              </div>
            </div>

            {/* Emotional Introduction & Mission Fact */}
            <div className="space-y-2 text-left flex-1">
              <div className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
                {selectedMission.location.name} ({selectedMission.location.coordinates})
              </div>
              <h3 className="font-['Rajdhani'] font-bold text-xl sm:text-2xl text-white uppercase leading-snug">
                {selectedMission.title}
              </h3>
              <p className="text-sm font-semibold text-cyan-200 tracking-wide">
                “THIS MACHINE WENT THERE.”
              </p>
              <p className="text-xs text-slate-300 font-sans line-clamp-2">
                {selectedMission.primaryObjective}
              </p>
            </div>
          </div>

          {/* Action to enter mission or continue */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">SELECT TARGET:</span>
              <div className="flex gap-1.5">
                {targetMissions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMission(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition-colors cursor-pointer ${
                      selectedMission.id === m.id
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.missionNumber || m.title.split(' ')[0]}
                  </button>
                ))}
              </div>

              {(selectedMission.officialNasaUrl || (selectedMission.sources && selectedMission.sources[0]?.url)) && (
                <a
                  href={selectedMission.officialNasaUrl || selectedMission.sources[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono uppercase tracking-wider transition-colors ml-1 cursor-pointer"
                  title={`Open ${selectedMission.title} on Official NASA Website`}
                >
                  <span>NASA Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              onClick={() => {
                if (onSelectMission) {
                  onSelectMission(selectedMission.id);
                }
                onComplete();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <span>Inspect Hardware Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry HUD Bar */}
      <div className="relative z-20 w-full p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>PROGRESS: {phaseProgress}%</span>
          <span className="text-cyan-400 uppercase tracking-widest">
            AUTHENTIC NASA TOPOGRAPHY & COORDINATES
          </span>
          <span>SYSTEM TIME: {new Date().toISOString().split('T')[1].slice(0, 8)} UTC</span>
        </div>
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-150 shadow-[0_0_10px_#06b6d4]"
            style={{ width: `${phaseProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};