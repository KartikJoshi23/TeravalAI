/** Header — Teraval wordmark, the Barq AI scenario line, and the live verdict. */
import { motion } from 'framer-motion';
import DecisionBadge from './DecisionBadge';
import SelfTestBadge from './SelfTestBadge';

export default function Header() {
  return (
    <header>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="bg-linear-to-r from-blue via-violet to-amber bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
              Teraval
            </h1>
            <span className="mt-1 rounded-md border border-glass-border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-txt-dim">
              Capital-Budgeting Intelligence
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-txt-dim">
            Appraising <span className="text-txt">Barq AI</span>&apos;s ~40&nbsp;MW AI/GPU
            data-center hall — Abu Dhabi · 8-year horizon · base WACC&nbsp;9% · AED
          </p>
          <div className="mt-3">
            <SelfTestBadge />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            title="Save the current live case as a one-page PDF (opens the print dialog)"
            className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-txt-dim transition-colors hover:border-blue/50 hover:text-txt"
          >
            ↓ Download summary
          </button>
          <span className="text-xs uppercase tracking-wider text-txt-faint">Current verdict</span>
          <DecisionBadge />
        </div>
      </motion.div>
      <div className="accent-rule mt-5" />
    </header>
  );
}
