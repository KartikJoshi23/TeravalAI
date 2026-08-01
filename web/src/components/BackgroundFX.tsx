/**
 * BackgroundFX — an always-on living backdrop: large, blurred colour fields that
 * drift and gently breathe, plus a sparse field of slowly-rising light motes.
 * Multi-accent and balanced (not blue-dominated) and tuned to stay behind the
 * content without competing with it. Reduced-motion disables all animation.
 */

// Deterministic mote layout (no layout shift on re-render). Values are spread
// pseudo-randomly from the index so the field looks scattered, not gridded.
const MOTES = Array.from({ length: 20 }, (_, i) => {
  const left = (i * 61 + 7) % 100;
  const top = 55 + ((i * 37) % 45); // lower-ish; they rise upward
  const size = 2 + (i % 4); // 2–5 px
  const duration = 16 + ((i * 13) % 12); // 16–27 s
  const delay = -((i * 3.1) % 24); // negative → already mid-flight
  const color = ['#7dd3fc', '#a78bfa', '#5eead4'][i % 3];
  return { left, top, size, duration, delay, color };
});

export default function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* drifting, breathing colour fields */}
      <div className="bg-blob anim-blob-a" style={{ width: '48vw', height: '48vw', top: '-10vh', right: '-6vw', background: '#a78bfa' }} />
      <div className="bg-blob anim-blob-b" style={{ width: '42vw', height: '42vw', top: '28vh', left: '-10vw', background: '#2dd4bf' }} />
      <div className="bg-blob anim-blob-c" style={{ width: '40vw', height: '40vw', bottom: '-12vh', left: '30vw', background: '#fbbf24' }} />
      <div className="bg-blob anim-blob-b" style={{ width: '36vw', height: '36vw', top: '-4vh', left: '16vw', background: '#38bdf8' }} />

      {/* slowly-rising light motes */}
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="bg-mote anim-mote"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            background: m.color,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}

      {/* very light bottom fade to seat the content — no heavy vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(130% 130% at 50% 30%, transparent 60%, rgba(4,5,11,0.35) 100%)' }}
      />
    </div>
  );
}
