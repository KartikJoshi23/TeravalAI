/**
 * SensitivityPanel — the six live driver sliders + the tornado chart. Moving any
 * slider writes to the store, so the KPI cards, cash-flow chart, scenario
 * "current" bar, tornado and risk panel all recompute in real time.
 */
import { motion } from 'framer-motion';
import { DRIVERS } from '../lib/drivers';
import { useModelStore } from '../store/useModelStore';
import DriverSlider from './DriverSlider';
import TornadoChart from './TornadoChart';

export default function SensitivityPanel() {
  const reset = useModelStore((s) => s.reset);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Interactive sensitivity"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-txt">Interactive sensitivity</h2>
          <p className="text-xs text-txt-dim">Drag a driver — every metric recomputes live</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="shrink-0 rounded-md border border-glass-border px-2.5 py-1 text-[11px] font-medium text-txt-dim transition-colors hover:border-blue/50 hover:text-txt"
        >
          Reset to base
        </button>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {DRIVERS.map((def) => (
          <DriverSlider key={def.key} def={def} />
        ))}
      </div>

      <div className="mt-6 border-t border-glass-border pt-4">
        <TornadoChart />
      </div>
    </motion.section>
  );
}
