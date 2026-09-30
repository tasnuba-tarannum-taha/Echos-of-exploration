import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  Info,
  Compass,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { NasaTextureService } from '../services/textureService';
import { NasaSourceBadge } from './NasaSourceBadge';

export interface GlobeMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  color?: string;
  onClick?: () => void;
}

interface RealisticGlobeProps {
  type: 'earth' | 'moon' | 'mars';
  size?: number;
  interactive?: boolean;
  markers?: GlobeMarker[];
  showLayerSwitcher?: boolean;
  className?: string;
  autoRotateSpeed?: number;
  onSelectMarker?: (marker: GlobeMarker) => void;
}

// Stable empty default. A fresh `[]` on every render made the WebGL effect below
// re-run (and create a NEW WebGL context) on every re-render.
const NO_MARKERS: GlobeMarker[] = [];

export const RealisticGlobe: React.FC<RealisticGlobeProps> = ({
  type,
  size = 450,
  interactive = true,
  markers = NO_MARKERS,
  showLayerSwitcher = false,
  className = '',
  autoRotateSpeed = 0.0018,
  onSelectMarker,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const planetGroupRef = useRef<THREE.Group | null>(null);
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);
  const planetMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const animIdRef = useRef<number | null>(null);

  const [activeLayer, setActiveLayer] = useState<'true-color' | 'night' | 'clouds' | 'thermal'>('true-color');
  const [hoveredMarker, setHoveredMarker] = useState<GlobeMarker | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [rotationSpeed, setRotationSpeed] = useState<number>(autoRotateSpeed);

  // Convert lat/lng to 3D Cartesian coordinates on sphere
  const latLngToVector3 = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.z = 3.6;
    cameraRef.current = camera;

    // 3. Renderer with antialias and alpha
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Planet Group
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);
    planetGroupRef.current = planetGroup;

    // Tilt axial inclination
    if (type === 'earth') planetGroup.rotation.z = (23.5 * Math.PI) / 180;
    if (type === 'mars') planetGroup.rotation.z = (25.2 * Math.PI) / 180;
    if (type === 'moon') planetGroup.rotation.z = (1.5 * Math.PI) / 180;

    // 5. Lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x1a2638, type === 'earth' ? 0.35 : 0.25);
    scene.add(ambientLight);

    // 6. Base Planet Mesh
    const sphereGeo = new THREE.SphereGeometry(1.25, 64, 64);
    let baseTexture: THREE.CanvasTexture;

    if (type === 'earth') {
      baseTexture = NasaTextureService.getEarthTrueColorTexture();
    } else if (type === 'mars') {
      baseTexture = NasaTextureService.getMarsTexture();
    } else {
      baseTexture = NasaTextureService.getMoonTexture();
    }

    const planetMat = new THREE.MeshStandardMaterial({
      map: baseTexture,
      roughness: type === 'earth' ? 0.65 : 0.9,
      metalness: 0.05,
    });
    planetMaterialRef.current = planetMat;

    const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
    planetGroup.add(planetMesh);

    // 7. Earth Cloud Layer (Subtle secondary rotating sphere)
    if (type === 'earth') {
      const cloudGeo = new THREE.SphereGeometry(1.265, 48, 48);
      const cloudMat = new THREE.MeshStandardMaterial({
        map: NasaTextureService.getEarthCloudTexture(),
        transparent: true,
        opacity: 0.75,
        blending: THREE.NormalBlending,
        roughness: 1.0,
      });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      planetGroup.add(cloudMesh);
      cloudMeshRef.current = cloudMesh;
    }

    // 8. Atmospheric Glow Shell (Fresnel scattering effect)
    if (type === 'earth' || type === 'mars') {
      const glowGeo = new THREE.SphereGeometry(1.29, 32, 32);
      const glowMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 glowColor;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.8);
            gl_FragColor = vec4(glowColor, 1.0) * intensity;
          }
        `,
        uniforms: {
          glowColor: {
            value:
              type === 'earth'
                ? new THREE.Color(0x38bdf8)
                : new THREE.Color(0xf97316),
          },
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      planetGroup.add(glowMesh);
    }

    // 9. Surface Landing Site Markers
    markers.forEach((m) => {
      const pos = latLngToVector3(m.lat, m.lng, 1.26);
      const markerGroup = new THREE.Group();
      markerGroup.position.copy(pos);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(0.02, 0.04, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: m.color ? new THREE.Color(m.color) : new THREE.Color(0x06b6d4),
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      markerGroup.add(ringMesh);

      // Core beacon dot
      const dotGeo = new THREE.SphereGeometry(0.02, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      markerGroup.add(dotMesh);

      planetGroup.add(markerGroup);
    });

    // 10. Mouse Interaction / Drag to Rotate
    let isMouseDown = false;
    let prevMousePos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isMouseDown = true;
      setIsDragging(true);
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || !interactive) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      planetGroup.rotation.y += deltaX * 0.006;
      planetGroup.rotation.x += deltaY * 0.006;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      setIsDragging(false);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      camera.position.z = Math.max(2.0, Math.min(5.5, camera.position.z + e.deltaY * 0.002));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });

    // Touch support for mobile devices
    let prevTouch = { x: 0, y: 0 };
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        prevTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevTouch.x;
        const deltaY = e.touches[0].clientY - prevTouch.y;
        planetGroup.rotation.y += deltaX * 0.007;
        planetGroup.rotation.x += deltaY * 0.007;
        prevTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    domEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    domEl.addEventListener('touchmove', handleTouchMove, { passive: true });

    // 11. Render Loop
    const animate = () => {
      if (!isMouseDown) {
        planetGroup.rotation.y += rotationSpeed;
        if (cloudMeshRef.current) {
          cloudMeshRef.current.rotation.y += rotationSpeed * 1.35; // Cloud differential drift
        }
      }
      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('wheel', handleWheel);
      domEl.removeEventListener('touchstart', handleTouchStart);
      domEl.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);

      renderer.dispose();
      renderer.forceContextLoss(); // free the WebGL context right away (dispose() alone leaves it alive)
      sphereGeo.dispose();
      planetMat.dispose();
    };
  }, [type, size, interactive, markers, rotationSpeed]);

  // Handle layer switching for Earth
  useEffect(() => {
    if (type !== 'earth' || !planetMaterialRef.current) return;

    if (activeLayer === 'night') {
      planetMaterialRef.current.map = NasaTextureService.getEarthNightTexture();
      planetMaterialRef.current.roughness = 0.9;
      if (cloudMeshRef.current) cloudMeshRef.current.visible = false;
    } else if (activeLayer === 'clouds') {
      planetMaterialRef.current.map = NasaTextureService.getEarthTrueColorTexture();
      planetMaterialRef.current.roughness = 0.65;
      if (cloudMeshRef.current) {
        cloudMeshRef.current.visible = true;
        (cloudMeshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.95;
      }
    } else if (activeLayer === 'thermal') {
      planetMaterialRef.current.map = NasaTextureService.getEarthNightTexture();
      planetMaterialRef.current.roughness = 0.4;
      if (cloudMeshRef.current) cloudMeshRef.current.visible = false;
    } else {
      // True Color Blue Marble
      planetMaterialRef.current.map = NasaTextureService.getEarthTrueColorTexture();
      planetMaterialRef.current.roughness = 0.65;
      if (cloudMeshRef.current) {
        cloudMeshRef.current.visible = true;
        (cloudMeshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.75;
      }
    }
    planetMaterialRef.current.needsUpdate = true;
  }, [activeLayer, type]);

  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(2.1, cameraRef.current.position.z - 0.5);
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.min(5.2, cameraRef.current.position.z + 0.5);
    }
  };

  const handleReset = () => {
    if (cameraRef.current) cameraRef.current.position.z = 3.6;
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.x = 0;
      planetGroupRef.current.rotation.y = 0;
    }
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Stage */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
      />

      {/* Top Source Badge */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <NasaSourceBadge
          type={type === 'earth' ? 'NASA EARTHDATA' : 'NASA SCIENTIFIC VISUALIZATION'}
          size="sm"
        />
      </div>

      {/* Layer Switcher HUD for Earth */}
      {showLayerSwitcher && type === 'earth' && (
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-black/80 border border-slate-800 p-1.5 rounded-xl backdrop-blur-md">
          <div className="px-2 py-0.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
            NASA IMAGERY LAYERS
          </div>
          <button
            onClick={() => setActiveLayer('true-color')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono text-left transition-colors ${
              activeLayer === 'true-color'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blue Marble (True Color)
          </button>
          <button
            onClick={() => setActiveLayer('night')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono text-left transition-colors ${
              activeLayer === 'night'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Black Marble (Night Lights)
          </button>
          <button
            onClick={() => setActiveLayer('clouds')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono text-left transition-colors ${
              activeLayer === 'clouds'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Atmosphere & Cloud Mask
          </button>
        </div>
      )}

      {/* Floating Controls HUD */}
      {interactive && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-black/70 border border-slate-800 p-1 rounded-lg backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
            title="Reset Orientation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drag & Rotate Hint */}
      {interactive && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-black/60 px-2.5 py-1 rounded-full border border-slate-800">
            DRAG TO ROTATE • WHEEL TO ZOOM
          </span>
        </div>
      )}
    </div>
  );
};