import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VoiceState } from '../services/voiceAssistant';
import { EchoEmotion } from './EchoBot';
import { EchoSVGFallback } from './EchoSVGFallback';

/*
 * Echo: chibi fairy robot.
 * Big head, porcelain face with big glossy teal eyes, short silver-blue bob,
 * tiny robot body with glowing cyan joints, and big iridescent dragonfly wings.
 * All earlier fixes are kept (clock delta, flip wrap, both-eye glow logic,
 * no roundRect, no transmission, full geometry disposal).
 */

interface Echo3DCompanionProps {
  emotion: EchoEmotion;
  voiceState: VoiceState;
  isWaving: boolean;
  isFlipping: boolean;
  isBlinking: boolean;
  isHovered: boolean;
  cursorOffset?: { x: number; y: number };
}

const TAU = Math.PI * 2;

// Face texture is drawn on an equirectangular canvas wrapped around the head.
// (256, 268) is the front-centre of the face on that canvas.
const FW = 1024;
const FH = 512;
const FX = 256;
const FY = 268;
const EYE_DX = 66;

// Deterministic random so both wings get the same sparkle pattern.
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Iridescent, veined, glittery dragonfly wing. Base of the wing is the bottom
// centre of the canvas, the tip is at the top.
const makeWingCanvas = (w: number, h: number, seed: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;

  const g = c.getContext('2d');
  if (!g) throw new Error('Wing canvas failed');

  const rand = mulberry32(seed);

  const shape = () => {
    g.beginPath();
    g.moveTo(w * 0.5, h - 4);
    g.bezierCurveTo(w * 0.0, h * 0.8, w * 0.02, h * 0.2, w * 0.66, 6);
    g.bezierCurveTo(w * 1.0, h * 0.3, w * 0.98, h * 0.82, w * 0.5, h - 4);
    g.closePath();
  };

  g.save();
  shape();
  g.clip();

  // rainbow membrane
  const grad = g.createLinearGradient(0, h, w, 0);
  grad.addColorStop(0, 'rgba(147,197,253,0.55)');
  grad.addColorStop(0.28, 'rgba(196,181,253,0.6)');
  grad.addColorStop(0.5, 'rgba(249,168,212,0.6)');
  grad.addColorStop(0.75, 'rgba(253,230,138,0.5)');
  grad.addColorStop(1, 'rgba(103,232,249,0.55)');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // soft shine
  const shine = g.createRadialGradient(w * 0.4, h * 0.35, 0, w * 0.4, h * 0.35, w * 0.6);
  shine.addColorStop(0, 'rgba(255,255,255,0.35)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = shine;
  g.fillRect(0, 0, w, h);

  // main vein
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,255,0.75)';
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(w * 0.5, h - 4);
  g.quadraticCurveTo(w * 0.42, h * 0.45, w * 0.66, 6);
  g.stroke();

  const onMainVein = (t: number) => {
    const x0 = w * 0.5, y0 = h - 4;
    const cx = w * 0.42, cy = h * 0.45;
    const x1 = w * 0.66, y1 = 6;
    const u = 1 - t;
    return {
      x: u * u * x0 + 2 * u * t * cx + t * t * x1,
      y: u * u * y0 + 2 * u * t * cy + t * t * y1,
    };
  };

  // branch veins
  g.lineWidth = 1.6;
  g.strokeStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 7; i++) {
    const p = onMainVein(0.14 + i * 0.12);
    [-1, 1].forEach((side) => {
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.quadraticCurveTo(
        p.x + side * w * 0.22,
        p.y - h * 0.02,
        p.x + side * w * 0.42,
        p.y - h * 0.1
      );
      g.stroke();
    });
  }

  // fine cross veins
  g.lineWidth = 1;
  g.strokeStyle = 'rgba(255,255,255,0.22)';
  for (let i = 0; i < 9; i++) {
    const y = h * (0.12 + i * 0.09);
    g.beginPath();
    g.moveTo(w * 0.12, y + h * 0.05);
    g.quadraticCurveTo(w * 0.5, y - h * 0.04, w * 0.9, y + h * 0.05);
    g.stroke();
  }

  // glitter
  for (let i = 0; i < 46; i++) {
    g.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.55})`;
    g.beginPath();
    g.arc(w * (0.1 + rand() * 0.8), h * (0.06 + rand() * 0.88), 0.7 + rand() * 1.8, 0, TAU);
    g.fill();
  }

  g.restore();

  // outline
  shape();
  g.strokeStyle = 'rgba(255,255,255,0.9)';
  g.lineWidth = 3;
  g.stroke();

  // a few four-point sparkles
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const x = w * (0.25 + rand() * 0.5);
    const y = h * (0.15 + rand() * 0.65);
    const r = 4 + rand() * 4;
    g.beginPath();
    g.moveTo(x - r, y);
    g.lineTo(x + r, y);
    g.moveTo(x, y - r);
    g.lineTo(x, y + r);
    g.stroke();
  }

  return c;
};

export const Echo3DCompanion: React.FC<Echo3DCompanionProps> = React.memo(
  ({
    emotion,
    voiceState,
    isWaving,
    isFlipping,
    isBlinking,
    isHovered,
    cursorOffset = { x: 0, y: 0 },
  }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [webglError, setWebglError] = useState(false);

    const emotionRef = useRef(emotion);
    const voiceRef = useRef(voiceState);
    const wavingRef = useRef(isWaving);
    const flippingRef = useRef(isFlipping);
    const blinkingRef = useRef(isBlinking);
    const hoveredRef = useRef(isHovered);
    const cursorRef = useRef(cursorOffset);

    emotionRef.current = emotion;
    voiceRef.current = voiceState;
    wavingRef.current = isWaving;
    flippingRef.current = isFlipping;
    blinkingRef.current = isBlinking;
    hoveredRef.current = isHovered;
    cursorRef.current = cursorOffset;

    useEffect(() => {
      if (webglError) return;

      const container = mountRef.current;
      if (!container) return;

      let renderer: THREE.WebGLRenderer | null = null;
      let frame = 0;
      let removeContextListeners: (() => void) | null = null;

      const geometries: THREE.BufferGeometry[] = [];
      const materials: THREE.Material[] = [];
      const textures: THREE.Texture[] = [];

      const track = <T extends THREE.BufferGeometry>(g: T): T => {
        geometries.push(g);
        return g;
      };

      try {
        /* =========================
           SCENE
        ========================= */

        const scene = new THREE.Scene();

        const width = 160;
        const height = 190;

        const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
        camera.position.set(0, 0, 5);

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        const gl = renderer;

        gl.setSize(width, height);
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;

        gl.domElement.style.width = '100%';
        gl.domElement.style.height = '100%';
        gl.domElement.style.pointerEvents = 'none';
        gl.domElement.style.display = 'block';

        container.appendChild(gl.domElement);

        // If the browser takes the WebGL context away (too many canvases, GPU reset,
        // tab under memory pressure) the canvas turns into a blank/broken box.
        // Let it try to restore itself; if it doesn't come back, show the SVG Echo.
        let lostTimer = 0;
        const onContextLost = (e: Event) => {
          e.preventDefault(); // required so the browser is allowed to restore it
          lostTimer = window.setTimeout(() => setWebglError(true), 1500);
        };
        const onContextRestored = () => {
          window.clearTimeout(lostTimer);
        };
        gl.domElement.addEventListener('webglcontextlost', onContextLost);
        gl.domElement.addEventListener('webglcontextrestored', onContextRestored);
        removeContextListeners = () => {
          window.clearTimeout(lostTimer);
          gl.domElement.removeEventListener('webglcontextlost', onContextLost);
          gl.domElement.removeEventListener('webglcontextrestored', onContextRestored);
        };

        /* =========================
           LIGHT
        ========================= */

        scene.add(new THREE.AmbientLight(0xffffff, 1.7));

        const frontLight = new THREE.DirectionalLight(0xffffff, 2.6);
        frontLight.position.set(2, 3, 5);
        scene.add(frontLight);

        // cool cyan rim from behind-left, warm fill from front-right
        const rimLight = new THREE.PointLight(0x22d3ee, 3.2, 8);
        rimLight.position.set(-2, 1, -1);
        scene.add(rimLight);

        const warmLight = new THREE.PointLight(0xffd9b0, 1.2, 7);
        warmLight.position.set(2, -1, 2.5);
        scene.add(warmLight);

        // pink glow that fades in when shy
        const pinkLight = new THREE.PointLight(0xec4899, 0, 4);
        pinkLight.position.set(0, 0, 2);
        scene.add(pinkLight);

        /* =========================
           MATERIALS
        ========================= */

        const skin = new THREE.MeshPhysicalMaterial({
          color: 0xfde7e3,
          roughness: 0.38,
          metalness: 0,
          clearcoat: 0.7,
          clearcoatRoughness: 0.25,
        });

        const pearl = new THREE.MeshPhysicalMaterial({
          color: 0xf8fafc,
          metalness: 0.12,
          roughness: 0.22,
          clearcoat: 0.9,
        });

        const silver = new THREE.MeshPhysicalMaterial({
          color: 0xbfc9d6,
          metalness: 0.65,
          roughness: 0.24,
          clearcoat: 0.7,
        });

        const hairMat = new THREE.MeshPhysicalMaterial({
          color: 0x9db0cf,
          metalness: 0.4,
          roughness: 0.32,
          clearcoat: 0.6,
          side: THREE.DoubleSide,
        });

        const earMat = new THREE.MeshPhysicalMaterial({
          color: 0xf9a8b8,
          roughness: 0.4,
          clearcoat: 0.5,
        });

        const cyan = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });

        const cyanGlow = new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        });

        materials.push(skin, pearl, silver, hairMat, earMat, cyan, cyanGlow);

        /* =========================
           MAIN CHARACTER
        ========================= */

        const echo = new THREE.Group();
        echo.scale.set(0.62, 0.62, 0.62);
        scene.add(echo);

        /* =========================
           WINGS (canvas-textured, iridescent)
        ========================= */

        const wings = new THREE.Group();
        wings.position.set(0, -0.05, -0.38);
        echo.add(wings);

        const upperTex = new THREE.CanvasTexture(makeWingCanvas(256, 512, 11));
        const lowerTex = new THREE.CanvasTexture(makeWingCanvas(256, 400, 29));
        upperTex.colorSpace = THREE.SRGBColorSpace;
        lowerTex.colorSpace = THREE.SRGBColorSpace;
        textures.push(upperTex, lowerTex);

        const upperMat = new THREE.MeshBasicMaterial({
          map: upperTex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        });
        const lowerMat = new THREE.MeshBasicMaterial({
          map: lowerTex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        });
        materials.push(upperMat, lowerMat);

        // planes are shifted up so their base sits on the pivot
        const upperGeo = track(new THREE.PlaneGeometry(0.78, 1.6));
        upperGeo.translate(0, 0.8, 0);
        const lowerGeo = track(new THREE.PlaneGeometry(0.62, 1.05));
        lowerGeo.translate(0, 0.525, 0);

        const makeWing = (
          geo: THREE.BufferGeometry,
          mat: THREE.Material,
          x: number,
          y: number,
          lean: number,
          mirror: boolean
        ) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, y, 0);
          pivot.rotation.z = lean;

          const mesh = new THREE.Mesh(geo, mat);
          if (mirror) mesh.scale.x = -1;

          pivot.add(mesh);
          wings.add(pivot);
          return pivot;
        };

        const rightUpper = makeWing(upperGeo, upperMat, 0.09, -0.22, -0.62, false);
        const leftUpper = makeWing(upperGeo, upperMat, -0.09, -0.22, 0.62, true);
        const rightLower = makeWing(lowerGeo, lowerMat, 0.07, -0.3, -2.3, false);
        const leftLower = makeWing(lowerGeo, lowerMat, -0.07, -0.3, 2.3, true);

        /* =========================
           BODY (tiny robot torso)
        ========================= */

        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = -0.42;
        echo.add(bodyGroup);

        const body = new THREE.Mesh(
          track(new THREE.CapsuleGeometry(0.2, 0.2, 10, 20)),
          pearl
        );
        body.scale.set(0.95, 1, 0.75);
        bodyGroup.add(body);

        // belt
        const belt = new THREE.Mesh(
          track(new THREE.TorusGeometry(0.18, 0.02, 8, 24)),
          silver
        );
        belt.rotation.x = Math.PI / 2;
        belt.scale.set(0.95, 0.75, 1);
        belt.position.y = -0.18;
        bodyGroup.add(belt);

        /* chest core */

        const core = new THREE.Group();
        core.position.set(0, -0.4, 0.16);
        echo.add(core);

        const coreRing = new THREE.Mesh(
          track(new THREE.TorusGeometry(0.06, 0.014, 8, 24)),
          cyan
        );
        const coreLight = new THREE.Mesh(
          track(new THREE.SphereGeometry(0.032, 16, 16)),
          cyanGlow
        );
        core.add(coreRing, coreLight);

        /* =========================
           HEAD
        ========================= */

        const headGroup = new THREE.Group();
        headGroup.position.y = 0.42;
        echo.add(headGroup);

        // everything that makes up the round head shares this squash
        const headShape = new THREE.Group();
        headShape.scale.set(1.04, 0.96, 0.94);
        headGroup.add(headShape);

        const HEAD_R = 0.6;

        const head = new THREE.Mesh(
          track(new THREE.SphereGeometry(HEAD_R, 48, 36)),
          skin
        );
        headShape.add(head);

        /* face overlay: unlit sphere carrying the eyes, cheeks and mouth */

        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = FW;
        faceCanvas.height = FH;

        const ctx = faceCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('Face canvas failed');
        }

        const faceTexture = new THREE.CanvasTexture(faceCanvas);
        faceTexture.colorSpace = THREE.SRGBColorSpace;
        faceTexture.minFilter = THREE.LinearFilter;
        faceTexture.magFilter = THREE.LinearFilter;
        textures.push(faceTexture);

        const faceMat = new THREE.MeshBasicMaterial({
          map: faceTexture,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        });
        materials.push(faceMat);

        const face = new THREE.Mesh(
          track(new THREE.SphereGeometry(HEAD_R * 1.006, 64, 40)),
          faceMat
        );
        headShape.add(face);

        /* hair: back/side bob with a gap for the face, plus bangs on top */

        const hairBack = new THREE.Mesh(
          track(
            new THREE.SphereGeometry(
              HEAD_R * 1.06,
              48,
              32,
              Math.PI / 2 + 0.85,
              TAU - 1.7,
              0,
              Math.PI * 0.68
            )
          ),
          hairMat
        );
        headShape.add(hairBack);

        const hairTop = new THREE.Mesh(
          track(
            new THREE.SphereGeometry(
              HEAD_R * 1.064,
              48,
              32,
              0,
              TAU,
              0,
              Math.PI * 0.38
            )
          ),
          hairMat
        );
        headShape.add(hairTop);

        /* ears */

        const earGeo = track(new THREE.SphereGeometry(0.085, 16, 16));
        const earRingGeo = track(new THREE.TorusGeometry(0.075, 0.015, 8, 20));

        [-1, 1].forEach((side) => {
          const ear = new THREE.Mesh(earGeo, earMat);
          ear.position.set(side * 0.7, -0.05, 0);
          ear.scale.set(0.55, 1, 0.9);
          headGroup.add(ear);

          const ring = new THREE.Mesh(earRingGeo, silver);
          ring.position.set(side * 0.72, -0.05, 0);
          ring.rotation.y = Math.PI / 2;
          headGroup.add(ring);
        });

        /* mechanical hair clips (one has a glowing bead) */

        const clipGeo = track(new THREE.SphereGeometry(0.06, 16, 16));
        const clipRingGeo = track(new THREE.TorusGeometry(0.078, 0.014, 8, 20));
        const beadGeo = track(new THREE.SphereGeometry(0.03, 12, 12));

        let beacon: THREE.Mesh | null = null;

        [-1, 1].forEach((side) => {
          const clip = new THREE.Group();
          clip.position.set(side * 0.42, 0.36, 0.3);
          headGroup.add(clip);

          clip.add(new THREE.Mesh(clipGeo, silver));

          const ring = new THREE.Mesh(clipRingGeo, silver);
          ring.rotation.set(0.5, side * 0.9, 0);
          clip.add(ring);

          const bead = new THREE.Mesh(beadGeo, cyan);
          bead.position.set(side * 0.03, 0.03, 0.055);
          clip.add(bead);

          if (side === 1) beacon = bead;
        });

        /* =========================
           ARMS
        ========================= */

        const leftArm = new THREE.Group();
        const rightArm = new THREE.Group();

        leftArm.position.set(-0.245, -0.3, 0);
        rightArm.position.set(0.245, -0.3, 0);

        echo.add(leftArm, rightArm);

        const shoulderGeo = track(new THREE.SphereGeometry(0.06, 16, 16));
        const armGeo = track(new THREE.CapsuleGeometry(0.038, 0.14, 8, 14));
        const handGeo = track(new THREE.SphereGeometry(0.055, 16, 16));

        [leftArm, rightArm].forEach((arm) => {
          arm.add(new THREE.Mesh(shoulderGeo, silver));

          const part = new THREE.Mesh(armGeo, silver);
          part.position.y = -0.1;
          arm.add(part);

          const hand = new THREE.Mesh(handGeo, pearl);
          hand.position.y = -0.22;
          arm.add(hand);
        });

        /* =========================
           LEGS (glowing cyan knees)
        ========================= */

        const thighGeo = track(new THREE.CapsuleGeometry(0.048, 0.1, 8, 12));
        const kneeGeo = track(new THREE.SphereGeometry(0.055, 16, 16));
        const kneeGlowGeo = track(new THREE.SphereGeometry(0.026, 12, 12));
        const shinGeo = track(new THREE.CapsuleGeometry(0.042, 0.1, 8, 12));
        const footGeo = track(new THREE.CapsuleGeometry(0.048, 0.07, 8, 12));

        const makeLeg = (x: number) => {
          const leg = new THREE.Group();
          leg.position.set(x, -0.66, 0);
          echo.add(leg);

          const thigh = new THREE.Mesh(thighGeo, pearl);
          thigh.position.y = -0.09;
          leg.add(thigh);

          const knee = new THREE.Mesh(kneeGeo, silver);
          knee.position.y = -0.2;
          leg.add(knee);

          const glow = new THREE.Mesh(kneeGlowGeo, cyan);
          glow.position.set(0, -0.2, 0.05);
          leg.add(glow);

          const shin = new THREE.Mesh(shinGeo, pearl);
          shin.position.y = -0.3;
          leg.add(shin);

          const foot = new THREE.Mesh(footGeo, silver);
          foot.rotation.x = Math.PI / 2;
          foot.position.set(0, -0.4, 0.035);
          leg.add(foot);

          return leg;
        };

        const leftLeg = makeLeg(-0.1);
        const rightLeg = makeLeg(0.1);

        /* =========================
           FAIRY DUST
        ========================= */

        const DUST = 14;
        const dustRand = mulberry32(7);
        const dustPos = new Float32Array(DUST * 3);
        const dustCol = new Float32Array(DUST * 3);
        const dustSpeed: number[] = [];

        for (let i = 0; i < DUST; i++) {
          dustPos[i * 3] = (dustRand() - 0.5) * 1.5;
          dustPos[i * 3 + 1] = (dustRand() - 0.5) * 1.7;
          dustPos[i * 3 + 2] = -0.5 + dustRand() * 1.1;
          dustSpeed.push(0.03 + dustRand() * 0.05);
        }

        const dustGeo = track(new THREE.BufferGeometry());
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));

        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 64;
        spriteCanvas.height = 64;
        const sctx = spriteCanvas.getContext('2d');
        if (sctx) {
          const sg = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          sg.addColorStop(0, 'rgba(255,255,255,1)');
          sg.addColorStop(0.25, 'rgba(255,240,200,0.9)');
          sg.addColorStop(1, 'rgba(255,220,150,0)');
          sctx.fillStyle = sg;
          sctx.fillRect(0, 0, 64, 64);
        }

        const spriteTex = new THREE.CanvasTexture(spriteCanvas);
        spriteTex.colorSpace = THREE.SRGBColorSpace;
        textures.push(spriteTex);

        const dustMat = new THREE.PointsMaterial({
          map: spriteTex,
          size: 0.09,
          sizeAttenuation: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
          toneMapped: false,
        });
        materials.push(dustMat);

        const dust = new THREE.Points(dustGeo, dustMat);
        dust.frustumCulled = false;
        scene.add(dust);

        /* =========================
           FACE DRAWING
        ========================= */

        let blush = 0.3;
        let lastKey = '';

        const drawOpenEye = (
          cx: number,
          cy: number,
          scale: number,
          pupilScale: number,
          px: number,
          py: number
        ) => {
          const rx = 44 * scale;
          const ry = 52 * scale;

          // dark rim
          ctx.fillStyle = '#0b3a47';
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx + 4, ry + 4, 0, 0, TAU);
          ctx.fill();

          // teal iris
          const iris = ctx.createRadialGradient(cx, cy + ry * 0.25, ry * 0.1, cx, cy, ry);
          iris.addColorStop(0, '#99f6e4');
          iris.addColorStop(0.55, '#2dd4bf');
          iris.addColorStop(1, '#0e7490');
          ctx.fillStyle = iris;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
          ctx.fill();

          // pupil
          ctx.fillStyle = '#04262f';
          ctx.beginPath();
          ctx.ellipse(cx + px, cy + py, rx * 0.42 * pupilScale, ry * 0.46 * pupilScale, 0, 0, TAU);
          ctx.fill();

          // glossy highlights
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx + px * 0.4 - rx * 0.28, cy + py * 0.4 - ry * 0.3, rx * 0.26, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + px * 0.4 + rx * 0.3, cy + py * 0.4 + ry * 0.3, rx * 0.11, 0, TAU);
          ctx.fill();

          // upper lash line
          ctx.strokeStyle = '#0b3a47';
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx + 3, ry + 3, 0, Math.PI * 1.08, Math.PI * 1.92);
          ctx.stroke();
        };

        const drawCheek = (x: number, amount: number) => {
          ctx.save();
          ctx.translate(x, FY + 72);
          ctx.scale(1, 0.55);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 36);
          g.addColorStop(0, `rgba(244,114,182,${0.85 * amount})`);
          g.addColorStop(1, 'rgba(244,114,182,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, TAU);
          ctx.fill();
          ctx.restore();
        };

        const updateFace = (time: number, blushTarget: number) => {
          const voice = voiceRef.current;
          const thinking = voice === 'processing' || emotionRef.current === 'thinking';
          const shy = hoveredRef.current;
          const closed = !shy && blinkingRef.current;

          let mouth: 'smile' | 'listening' | 'thinking' | 'speaking';
          if (voice === 'listening') mouth = 'listening';
          else if (thinking) mouth = 'thinking';
          else if (voice === 'speaking') mouth = 'speaking';
          else mouth = 'smile';

          const eyes = shy ? 'shy' : closed ? 'closed' : 'open';

          // pupils follow the cursor (same "up is positive" convention as the head)
          const cursor = cursorRef.current;
          const animated = mouth !== 'smile';
          let px = Math.round(cursor.x * 6);
          let py = Math.round(-cursor.y * 4);
          if (thinking) {
            px = Math.round(Math.sin(time * 1.6) * 10);
            py = -8;
          }

          // only redraw the 1024x512 texture when something actually changed
          const key = `${eyes}|${mouth}|${px}|${py}`;
          const blushMoving = Math.abs(blush - blushTarget) > 0.004;
          if (!animated && !blushMoving && key === lastKey) return;
          lastKey = key;

          ctx.clearRect(0, 0, FW, FH);

          drawCheek(FX - EYE_DX - 14, blush);
          drawCheek(FX + EYE_DX + 14, blush);

          const eyeXs = [FX - EYE_DX, FX + EYE_DX];

          if (eyes === 'shy') {
            // happy ^ ^ eyes
            ctx.strokeStyle = '#164e63';
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            eyeXs.forEach((cx) => {
              ctx.beginPath();
              ctx.arc(cx, FY + 16, 34, 1.12 * Math.PI, 1.88 * Math.PI);
              ctx.stroke();
            });
          } else if (eyes === 'closed') {
            // blink
            ctx.strokeStyle = '#164e63';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            eyeXs.forEach((cx) => {
              ctx.beginPath();
              ctx.arc(cx, FY - 8, 34, 0.12 * Math.PI, 0.88 * Math.PI);
              ctx.stroke();
            });
          } else {
            const listening = mouth === 'listening';
            const scale = listening ? 1 + Math.sin(time * 6) * 0.05 : 1;
            const pupilScale = listening ? 1.15 : 1;
            eyeXs.forEach((cx) => drawOpenEye(cx, FY, scale, pupilScale, px, py));
          }

          // mouth
          const mx = FX;
          const my = FY + 100;
          ctx.lineCap = 'round';

          if (mouth === 'speaking') {
            const open = 5 + Math.abs(Math.sin(time * 10)) * 13;
            ctx.fillStyle = '#9f1239';
            ctx.beginPath();
            ctx.ellipse(mx, my, 14, open, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.ellipse(mx, my + open * 0.45, 8, open * 0.4, 0, 0, TAU);
            ctx.fill();
          } else if (mouth === 'listening') {
            ctx.fillStyle = '#9f1239';
            ctx.beginPath();
            ctx.ellipse(mx, my, 8, 10, 0, 0, TAU);
            ctx.fill();
          } else if (mouth === 'thinking') {
            for (let i = 0; i < 3; i++) {
              ctx.fillStyle =
                Math.floor(time * 4) % 3 === i ? '#0e7490' : 'rgba(14,116,144,0.25)';
              ctx.beginPath();
              ctx.arc(mx - 20 + i * 20, my, 5.5, 0, TAU);
              ctx.fill();
            }
          } else {
            ctx.strokeStyle = '#c2415d';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(mx, my - 8, 14, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
          }

          faceTexture.needsUpdate = true;
        };

        /* =========================
           ANIMATION LOOP
        ========================= */

        // own timer instead of THREE.Clock (deprecated in recent three.js versions)
        let lastNow = performance.now();
        let time = 0;
        const lerp = THREE.MathUtils.lerp;

        let flip = 0;

        const animate = () => {
          frame = requestAnimationFrame(animate);

          const now = performance.now();
          const delta = (now - lastNow) / 1000;
          lastNow = now;
          time += delta;

          /* face */

          const hovered = hoveredRef.current;
          const blushTarget = hovered ? 0.95 : 0.3;
          blush = lerp(blush, blushTarget, 0.12);
          updateFace(time, blushTarget);

          pinkLight.intensity = lerp(pinkLight.intensity, hovered ? 0.8 : 0, 0.08);

          /* floating */

          echo.position.y = Math.sin(time * 2.2) * 0.045;

          /* wings flap around the vertical axis */

          const flap = Math.sin(time * 6) * 0.3;

          rightUpper.rotation.y = flap;
          leftUpper.rotation.y = -flap;
          rightLower.rotation.y = flap * 0.8;
          leftLower.rotation.y = -flap * 0.8;

          /* clip bead + chest core */

          if (beacon) {
            (beacon as THREE.Mesh).scale.setScalar(1 + Math.sin(time * 5) * 0.2);
          }
          core.rotation.z = time * 0.8;
          coreLight.scale.setScalar(1 + Math.sin(time * 7) * 0.1);

          /* legs dangle */

          leftLeg.rotation.x = Math.sin(time * 2.2 + 0.5) * 0.12;
          rightLeg.rotation.x = Math.sin(time * 2.2 + 1.6) * 0.12;

          /* head follows cursor */

          const cursor = cursorRef.current;

          headGroup.rotation.x = lerp(headGroup.rotation.x, -cursor.y * 0.06, 0.08);
          headGroup.rotation.y = lerp(headGroup.rotation.y, cursor.x * 0.08, 0.08);

          /* arms: right arm raises and waves, left arm sways */

          const waveTarget = wavingRef.current ? 2.3 + Math.sin(time * 11) * 0.3 : 0;
          rightArm.rotation.z = lerp(rightArm.rotation.z, waveTarget, 0.15);
          leftArm.rotation.z = -0.05 + Math.sin(time * 2) * 0.04;

          /* fairy dust */

          for (let i = 0; i < DUST; i++) {
            dustPos[i * 3 + 1] += dustSpeed[i] * delta;
            if (dustPos[i * 3 + 1] > 0.95) dustPos[i * 3 + 1] = -0.95;
            dustPos[i * 3] += Math.sin(time * 0.9 + i) * 0.0006;

            const b = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 2.2 + i * 1.9));
            dustCol[i * 3] = b;
            dustCol[i * 3 + 1] = b;
            dustCol[i * 3 + 2] = b;
          }
          dustGeo.attributes.position.needsUpdate = true;
          dustGeo.attributes.color.needsUpdate = true;

          /* flip */

          if (flippingRef.current) {
            flip += Math.min(delta, 0.05) * 8;

            echo.rotation.y = flip;
            echo.rotation.x = Math.sin(flip) * 0.12;
          } else {
            // wrap once so it eases home the short way
            if (flip !== 0) {
              flip = 0;

              let y = echo.rotation.y % TAU;
              if (y > Math.PI) y -= TAU;
              echo.rotation.y = y;
            }

            echo.rotation.y = lerp(echo.rotation.y, 0, 0.1);
            echo.rotation.x = lerp(echo.rotation.x, 0, 0.1);
          }

          gl.render(scene, camera);
        };

        animate();
      } catch (error) {
        console.warn('Echo 3D initialization failed:', error);
        setWebglError(true);
      }

      return () => {
        cancelAnimationFrame(frame);

        // remove these BEFORE forceContextLoss() below, otherwise our own cleanup
        // would look like a "lost context" and flip Echo to the SVG fallback
        removeContextListeners?.();

        if (
          renderer &&
          renderer.domElement &&
          container.contains(renderer.domElement)
        ) {
          container.removeChild(renderer.domElement);
        }

        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        textures.forEach((t) => t.dispose());

        renderer?.dispose();
        renderer?.forceContextLoss();
      };
    }, [webglError]);

    if (webglError) {
      return (
        <EchoSVGFallback
          emotion={emotion}
          voiceState={voiceState}
          isWaving={isWaving}
          isHovered={isHovered}
        />
      );
    }

    return (
      <div
        ref={mountRef}
        className="
          relative
          w-[160px]
          h-[190px]
          flex
          items-center
          justify-center
          pointer-events-none
          select-none
        "
      />
    );
  }
);

Echo3DCompanion.displayName = 'Echo3DCompanion';