/**
 * DataCenterScene — the topical hero wrapper. It lazy-loads the heavy three.js
 * HallCanvas (so three/postprocessing stay out of the main bundle), overlays the
 * caption + live readouts, and renders the grounded per-rack inspection card when
 * a rack is clicked. A WebGL check + error boundary keep any GPU failure from
 * taking down the dashboard; reduced-motion stops the animation.
 */
import { lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAssumptions, useModel } from '../../store/useEvaluation';
import ErrorBoundary from '../ErrorBoundary';

const HallCanvas = lazy(() => import('./HallCanvas'));

// Cached module-wide: the probe context is created once (and released) instead
// of leaking one live WebGL context per Overview visit toward the browser cap.
let webglSupport: boolean | null = null;
function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement('canvas');
    const gl =
      window.WebGLRenderingContext &&
      ((c.getContext('webgl') || c.getContext('experimental-webgl')) as WebGLRenderingContext | null);
    webglSupport = !!gl;
    if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Grounded per-rack inspection card (numbers come from the finance engine). */
function RackInfoCard({ index, onClose }: { index: number; onClose: () => void }) {
  const a = useAssumptions();
  const model = useModel();
  const powerKw = (a.itMW * 1000) / a.racks;
  const revPerRack = model.revenueAed / a.racks;
  const energyPerRack = model.energyAed / a.racks;
  const exhaustC = 24 + (a.pue - 1.05) * 60;
  const status = a.utilization >= 0.75 ? 'High load' : a.utilization >= 0.4 ? 'Nominal' : 'Low load';
  const statusColor =
    a.utilization >= 0.75 ? 'text-positive' : a.utilization >= 0.4 ? 'text-blue' : 'text-amber';

  const rows: [string, string][] = [
    ['GPUs', `${a.gpusPerRack} × GB200`],
    ['Power draw', `~${powerKw.toFixed(0)} kW`],
    ['Utilization', `${(a.utilization * 100).toFixed(0)}%`],
    ['Revenue', `AED ${revPerRack.toFixed(2)}M/yr`],
    ['Energy cost', `AED ${energyPerRack.toFixed(2)}M/yr`],
    ['Est. exhaust', `${exhaustC.toFixed(0)}°C`],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="pointer-events-auto absolute right-4 top-4 w-60 rounded-xl border border-glass-border bg-black/60 p-4 backdrop-blur-md"
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-txt">Rack {index + 1}</div>
          <div className="text-[11px] text-txt-faint">GB200 NVL72 · 1 of {a.racks}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-md border border-glass-border px-1.5 text-txt-dim hover:text-txt">
          ✕
        </button>
      </div>
      <span className={`mb-2 inline-block rounded-full border border-current/30 px-2 py-0.5 text-[10px] font-medium ${statusColor}`}>
        {status}
      </span>
      <dl className="mt-1 flex flex-col gap-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-xs">
            <dt className="text-txt-faint">{k}</dt>
            <dd className="font-mono font-medium text-txt">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[10px] leading-snug text-txt-faint">
        Per-rack figures are the hall total shared across {a.racks} racks — live from the model.
      </p>
    </motion.div>
  );
}

const Loading = (
  <div className="flex h-full w-full items-center justify-center text-sm text-txt-faint">
    <span className="animate-pulse">Rendering the hall…</span>
  </div>
);

export default function DataCenterScene() {
  const a = useAssumptions();
  const animate = !reducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);
  const [selected, setSelected] = useState<number | null>(null);

  const fallback = (
    <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-txt-dim">
      3D hall unavailable — WebGL is not supported on this device. The rest of the
      dashboard is unaffected.
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass relative overflow-hidden"
      aria-label="Interactive 3D data-center hall"
    >
      <div className="relative h-[420px] w-full md:h-[520px]">
        {webgl ? (
          <ErrorBoundary fallback={fallback}>
            <Suspense fallback={Loading}>
              <HallCanvas animate={animate} selected={selected} onSelect={setSelected} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          fallback
        )}

        <div className="pointer-events-none absolute left-5 top-5">
          <h2 className="text-lg font-semibold text-txt">Barq AI · Abu Dhabi hall</h2>
          <p className="text-xs text-txt-dim">Click a rack to inspect · drag to orbit · scroll to zoom</p>
        </div>

        <div className="pointer-events-none absolute bottom-5 left-5 flex gap-3 text-xs">
          <span className="rounded-md border border-glass-border bg-white/5 px-2.5 py-1 backdrop-blur">
            <span className="text-txt-faint">Utilization </span>
            <span className="font-mono font-medium text-blue">{(a.utilization * 100).toFixed(0)}%</span>
          </span>
          <span className="rounded-md border border-glass-border bg-white/5 px-2.5 py-1 backdrop-blur">
            <span className="text-txt-faint">PUE </span>
            <span className="font-mono font-medium text-amber">{a.pue.toFixed(2)}</span>
          </span>
        </div>

        {selected !== null && <RackInfoCard index={selected} onClose={() => setSelected(null)} />}
      </div>
    </motion.section>
  );
}
