/**
 * BackgroundFX — a light, always-on ambient backdrop: a few large, heavily
 * blurred colour blobs that drift slowly (CSS keyframes, reduced-motion aware).
 * Multi-accent and balanced — deliberately not blue-dominated — and subtle
 * enough to sit behind the whole dashboard without competing with content.
 */
export default function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* violet — top right */}
      <div
        className="bg-blob anim-blob-a"
        style={{ width: '46vw', height: '46vw', top: '-12vh', right: '-8vw', background: '#a78bfa' }}
      />
      {/* teal — mid left */}
      <div
        className="bg-blob anim-blob-b"
        style={{ width: '40vw', height: '40vw', top: '30vh', left: '-10vw', background: '#2dd4bf', opacity: 0.1 }}
      />
      {/* amber — bottom center */}
      <div
        className="bg-blob anim-blob-c"
        style={{ width: '38vw', height: '38vw', bottom: '-14vh', left: '32vw', background: '#fbbf24', opacity: 0.08 }}
      />
      {/* blue — restrained, upper left */}
      <div
        className="bg-blob anim-blob-b"
        style={{ width: '34vw', height: '34vw', top: '-6vh', left: '18vw', background: '#38bdf8', opacity: 0.08 }}
      />
      {/* faint vignette to keep edges calm */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 120% at 50% 40%, transparent 55%, rgba(4,5,11,0.55) 100%)' }}
      />
    </div>
  );
}
