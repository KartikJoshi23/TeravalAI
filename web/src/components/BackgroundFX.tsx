/**
 * BackgroundFX — the dashboard's living backdrop, in three layers:
 *   1. large, blurred colour fields that drift and gently breathe (CSS),
 *   2. a very slow revolving aurora sweep (CSS conic gradient),
 *   3. a canvas "data field": drifting, twinkling multi-accent particles joined
 *      by faint constellation lines, with occasional rising data-streak pulses
 *      and a soft parallax response to the pointer.
 * Everything sits behind the content (fixed, -z-10, pointer-events-none) and is
 * tuned to stay quiet under the glass cards. prefers-reduced-motion freezes the
 * CSS layers (media query in index.css) and makes the canvas render one static
 * frame. The canvas also pauses while the tab is hidden.
 */
import { useEffect, useRef } from 'react';

/* Palette weighted toward the cool accents; amber stays rare so the field
 * reads teal/violet with occasional warm sparks (multi-accent, not mono). */
const PARTICLE_COLORS = [
  '#2dd4bf', '#2dd4bf', '#5eead4',
  '#a78bfa', '#a78bfa', '#c4b5fd',
  '#5eead4', '#2dd4bf',
  '#fbbf24',
];

const LINK_DIST = 130; // px — max distance for a constellation line
const WRAP = LINK_DIST; // off-screen margin so lines never pop at the edges
const PARALLAX = 16; // px — max pointer-parallax shift at full depth

interface Particle {
  x: number;
  y: number;
  depth: number; // 0.35 (far, small, slow) … 1 (near, bright, parallax-heavy)
  r: number;
  vx: number;
  vy: number;
  color: string;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface Streak {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number; // seconds lived
  maxLife: number;
  color: string;
}

function makeParticle(w: number, h: number): Particle {
  const depth = 0.35 + Math.random() * 0.65;
  return {
    x: -WRAP + Math.random() * (w + 2 * WRAP),
    y: -WRAP + Math.random() * (h + 2 * WRAP),
    depth,
    r: 0.8 + depth * 1.7,
    vx: (Math.random() - 0.5) * 14 * depth,
    vy: (10 + Math.random() * 8) * depth * -0.55, // net gentle rise
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.4 + Math.random() * 0.9,
  };
}

function makeStreak(w: number, h: number): Streak {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // mostly upward
  const speed = 130 + Math.random() * 110;
  return {
    x: w * (0.08 + Math.random() * 0.84),
    y: h * (0.55 + Math.random() * 0.5),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    len: 60 + Math.random() * 60,
    life: 0,
    maxLife: 1.6 + Math.random() * 1.0,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
  };
}

export default function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    const streaks: Streak[] = [];

    // Density-scaled particle count, clamped so huge/small screens stay sane.
    // Kept sparse so the field reads as a calm backdrop, not visual noise.
    const seed = () => {
      const count = Math.round(Math.min(52, Math.max(26, (w * h) / 36000)));
      particles = Array.from({ length: count }, () => makeParticle(w, h));
    };

    const resize = () => {
      const hadArea = w * h > 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // (Re)seed once real dimensions exist — a hidden/prerendered page can
      // mount at 0×0 and only get its true size later, without which the
      // field would stay clustered at the origin. Ordinary resizes keep the
      // existing particles; wrap-around redistributes them naturally.
      if (!hadArea && w * h > 0) seed();
    };
    resize();

    // Pointer parallax — target set by mousemove, eased each frame.
    let targetPx = 0;
    let targetPy = 0;
    let px = 0;
    let py = 0;
    const onPointer = (e: MouseEvent) => {
      targetPx = e.clientX / w - 0.5;
      targetPy = e.clientY / h - 0.5;
    };

    const drawFrame = (dt: number, t: number) => {
      ctx.clearRect(0, 0, w, h);
      px += (targetPx - px) * Math.min(1, dt * 2.5);
      py += (targetPy - py) * Math.min(1, dt * 2.5);

      // Advance + wrap particles (physics in world space; parallax shifts only
      // the drawn position so the field slides gently against the pointer).
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -WRAP) p.x += w + 2 * WRAP;
        else if (p.x > w + WRAP) p.x -= w + 2 * WRAP;
        if (p.y < -WRAP) p.y += h + 2 * WRAP;
        else if (p.y > h + WRAP) p.y -= h + 2 * WRAP;
      }

      // Constellation lines first, so particles render on top of them.
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x - px * PARALLAX * a.depth;
        const ay = a.y - py * PARALLAX * a.depth;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.045;
          ctx.strokeStyle = `rgba(120, 190, 180, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(b.x - px * PARALLAX * b.depth, b.y - py * PARALLAX * b.depth);
          ctx.stroke();
        }
      }

      // Particles: a soft halo plus a bright core, twinkling gently.
      for (const p of particles) {
        const tw = 0.5 + 0.5 * Math.sin(p.twinklePhase + t * p.twinkleSpeed);
        const alpha = 0.12 + tw * 0.26;
        const x = p.x - px * PARALLAX * p.depth;
        const y = p.y - py * PARALLAX * p.depth;
        ctx.globalAlpha = alpha * 0.16;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.r * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Rising data streaks — rare comet-like pulses.
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];
        s.life += dt;
        if (s.life >= s.maxLife) {
          streaks.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const phase = s.life / s.maxLife;
        const alpha = Math.sin(phase * Math.PI) * 0.3; // ease in and out
        const nx = s.vx / Math.hypot(s.vx, s.vy);
        const ny = s.vy / Math.hypot(s.vx, s.vy);
        const tailX = s.x - nx * s.len;
        const tailY = s.y - ny * s.len;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, s.color);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    if (reduceMotion) {
      // One calm static frame: field + lines, no streaks, no animation.
      // Resizing clears the canvas, so redraw the static frame after it.
      const staticResize = () => {
        resize();
        drawFrame(0, 0);
      };
      drawFrame(0, 0);
      window.addEventListener('resize', staticResize);
      return () => window.removeEventListener('resize', staticResize);
    }

    let raf = 0;
    let last = performance.now();
    let nextStreakAt = last + 1800 + Math.random() * 3200;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // clamp so a paused tab doesn't jump
      last = now;
      if (now >= nextStreakAt) {
        streaks.push(makeStreak(w, h));
        nextStreakAt = now + 2600 + Math.random() * 4200;
      }
      drawFrame(dt, now / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now(); // reset the clock so dt stays small
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onPointer);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* very slow aurora sweep, under everything */}
      <div className="bg-aurora anim-aurora" />

      {/* drifting, breathing colour fields */}
      <div className="bg-blob anim-blob-a" style={{ width: '48vw', height: '48vw', top: '-10vh', right: '-6vw', background: '#a78bfa' }} />
      <div className="bg-blob anim-blob-b" style={{ width: '42vw', height: '42vw', top: '28vh', left: '-10vw', background: '#2dd4bf' }} />
      <div className="bg-blob anim-blob-c" style={{ width: '40vw', height: '40vw', bottom: '-12vh', left: '30vw', background: '#fbbf24' }} />
      <div className="bg-blob anim-blob-b" style={{ width: '36vw', height: '36vw', top: '-4vh', left: '16vw', background: '#2dd4bf' }} />

      {/* the living data field: particles, constellation lines, data streaks */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Gentle vignette to seat the content and keep the edges black so text
       * never competes with the field. */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(125% 125% at 50% 28%, transparent 55%, rgba(3,3,6,0.62) 100%)' }}
      />
    </div>
  );
}
