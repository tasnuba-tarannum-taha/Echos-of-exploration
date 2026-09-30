import React, { useEffect, useRef } from 'react';

interface PlanetCanvasProps {
  type: 'earth' | 'moon' | 'mars' | 'deep-space';
  size?: number;
  interactive?: boolean;
  highlightCoordinates?: { lat: number; lng: number; label?: string };
}

export const PlanetCanvas: React.FC<PlanetCanvasProps> = ({
  type,
  size = 400,
  interactive = true,
  highlightCoordinates,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotationSpeed = 0.003;
    if (type === 'moon') rotationSpeed = 0.0015;
    if (type === 'mars') rotationSpeed = 0.0025;
    if (type === 'deep-space') rotationSpeed = 0.0008;

    const render = () => {
      rotationRef.current += rotationSpeed;
      const rot = rotationRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.42;

      ctx.clearRect(0, 0, w, h);

      if (type === 'deep-space') {
        // Starfield with nebulae & probe beacon
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.5);
        grad.addColorStop(0, '#0c1638');
        grad.addColorStop(0.5, '#060b1e');
        grad.addColorStop(1, '#02040a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Stars
        for (let i = 0; i < 60; i++) {
          const angle = (i * 137.5 + rot * 10) * (Math.PI / 180);
          const r = (Math.sin(i * 3) * 0.5 + 0.5) * radius * 1.1;
          const sx = cx + Math.cos(angle) * r;
          const sy = cy + Math.sin(angle) * r;
          ctx.fillStyle = i % 3 === 0 ? '#38bdf8' : '#e2e8f0';
          ctx.beginPath();
          ctx.arc(sx, sy, (i % 2 === 0 ? 1.2 : 0.8), 0, Math.PI * 2);
          ctx.fill();
        }

        // Deep Space probe icon / trajectory vector
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.8, cy + radius * 0.4);
        ctx.quadraticCurveTo(cx, cy - radius * 0.2, cx + radius * 0.9, cy - radius * 0.6);
        ctx.stroke();
        ctx.setLineDash([]);

        // Probe signal
        const px = cx + radius * 0.9;
        const py = cy - radius * 0.6;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        // Radio pulse
        const pulseR = (Date.now() / 30) % 30;
        ctx.strokeStyle = `rgba(245, 158, 11, ${1 - pulseR / 30})`;
        ctx.beginPath();
        ctx.arc(px, py, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Outer Glow / Atmosphere
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.25);
      if (type === 'earth') {
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        glowGrad.addColorStop(0.5, 'rgba(37, 99, 235, 0.15)');
        glowGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      } else if (type === 'mars') {
        glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
        glowGrad.addColorStop(0.5, 'rgba(185, 28, 28, 0.1)');
        glowGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      } else {
        // Moon (minimal vacuum glow)
        glowGrad.addColorStop(0, 'rgba(226, 232, 240, 0.2)');
        glowGrad.addColorStop(0.6, 'rgba(148, 163, 184, 0.05)');
        glowGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Planet Base Sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Background Sphere Gradient
      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );

      if (type === 'earth') {
        sphereGrad.addColorStop(0, '#38bdf8');
        sphereGrad.addColorStop(0.4, '#1d4ed8');
        sphereGrad.addColorStop(0.85, '#0f172a');
        sphereGrad.addColorStop(1, '#020617');
      } else if (type === 'mars') {
        sphereGrad.addColorStop(0, '#f97316');
        sphereGrad.addColorStop(0.35, '#c2410c');
        sphereGrad.addColorStop(0.75, '#7c2d12');
        sphereGrad.addColorStop(1, '#180805');
      } else {
        // Moon
        sphereGrad.addColorStop(0, '#e2e8f0');
        sphereGrad.addColorStop(0.35, '#94a3b8');
        sphereGrad.addColorStop(0.75, '#475569');
        sphereGrad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = sphereGrad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // Procedural surface features mapped with rotation
      if (type === 'earth') {
        // Continents and Clouds
        ctx.fillStyle = 'rgba(34, 197, 94, 0.35)'; // Landmasses
        for (let i = 0; i < 7; i++) {
          const shift = ((rot * 80 + i * 90) % (radius * 4)) - radius * 2;
          const yPos = cy + Math.sin(i * 1.7) * (radius * 0.6);
          ctx.beginPath();
          ctx.ellipse(cx + shift * 0.6, yPos, radius * 0.45, radius * 0.28, i * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Swirling Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (let c = 0; c < 9; c++) {
          const cShift = ((rot * 110 + c * 75) % (radius * 4)) - radius * 2;
          const cyPos = cy + Math.cos(c * 1.2) * (radius * 0.7);
          ctx.beginPath();
          ctx.arc(cx + cShift * 0.6, cyPos, radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'moon') {
        // Lunar Maria (Dark basaltic plains)
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
        const maria = [
          { x: 0.1, y: -0.1, r: 0.35 }, // Mare Tranquillitatis
          { x: -0.3, y: -0.25, r: 0.4 }, // Oceanus Procellarum
          { x: -0.1, y: -0.4, r: 0.38 }, // Mare Imbrium
          { x: 0.25, y: -0.3, r: 0.25 }, // Mare Serenitatis
          { x: 0.2, y: 0.2, r: 0.3 }, // Mare Fecunditatis
        ];

        maria.forEach((m) => {
          const shift = (Math.sin(rot + m.x * 5) * radius * 0.4);
          ctx.beginPath();
          ctx.ellipse(cx + m.x * radius + shift, cy + m.y * radius, radius * m.r, radius * m.r * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
        });

        // Impact Craters with bright ejecta rays (Tycho / Copernicus)
        ctx.fillStyle = 'rgba(248, 250, 252, 0.4)';
        ctx.beginPath();
        ctx.arc(cx + radius * 0.1, cy + radius * 0.5, 7, 0, Math.PI * 2);
        ctx.fill();

        // Ejecta rays
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.2)';
        ctx.lineWidth = 1;
        for (let a = 0; a < 8; a++) {
          const rad = (a * 45 * Math.PI) / 180;
          ctx.beginPath();
          ctx.moveTo(cx + radius * 0.1, cy + radius * 0.5);
          ctx.lineTo(cx + radius * 0.1 + Math.cos(rad) * 45, cy + radius * 0.5 + Math.sin(rad) * 45);
          ctx.stroke();
        }
      } else if (type === 'mars') {
        // Dark volcanic regions (Syrtis Major & Acidalia)
        ctx.fillStyle = 'rgba(67, 20, 7, 0.55)';
        const darkPlains = [
          { x: 0.05, y: -0.1, r: 0.38 },
          { x: -0.25, y: 0.1, r: 0.45 },
          { x: 0.3, y: 0.15, r: 0.3 },
        ];
        darkPlains.forEach((p) => {
          const shift = Math.sin(rot + p.x * 4) * radius * 0.35;
          ctx.beginPath();
          ctx.ellipse(cx + p.x * radius + shift, cy + p.y * radius, radius * p.r, radius * p.r * 0.65, 0.3, 0, Math.PI * 2);
          ctx.fill();
        });

        // White Polar Ice Cap
        ctx.fillStyle = 'rgba(254, 242, 242, 0.85)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - radius * 0.88, radius * 0.38, radius * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Terminator Shadow (3D Sphere Depth)
      const shadowGrad = ctx.createRadialGradient(
        cx - radius * 0.4,
        cy - radius * 0.4,
        radius * 0.2,
        cx + radius * 0.5,
        cy + radius * 0.5,
        radius * 1.05
      );
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.35)');
      shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0.92)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.restore();

      // Atmospheric Rim Light (Fresnel Edge)
      ctx.strokeStyle =
        type === 'earth'
          ? 'rgba(56, 189, 248, 0.6)'
          : type === 'mars'
          ? 'rgba(249, 115, 22, 0.45)'
          : 'rgba(226, 232, 240, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [type, size]);

  return (
    <div className="relative flex items-center justify-center select-none pointer-events-none">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full max-w-full aspect-square drop-shadow-[0_0_35px_rgba(0,0,0,0.8)]"
      />
    </div>
  );
};
