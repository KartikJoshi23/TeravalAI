/**
 * DecisionBrief — a SLIM one-line context strip for the Overview (it sits under
 * the 3D hall, which is the visual hero). It states the decision in a single
 * sentence and shows the live verdict + headline numbers as chips — enough for an
 * evaluator to grasp what this is at a glance, without a wall of text.
 */
import { motion } from 'framer-motion';
import { useAssumptions, useEvaluation, useBreakeven } from '../store/useEvaluation';
import { fmtAedM, fmtPct, fmtUsdHr } from '../lib/format';

const VERDICT: Record<string, { label: string; cls: string }> = {
  accept: { label: 'ACCEPT — conditionally', cls: 'text-positive bg-positive/10 border-positive/30' },
  marginal: { label: 'MARGINAL', cls: 'text-amber bg-amber/10 border-amber/30' },
  reject: { label: 'REJECT', cls: 'text-negative bg-negative/10 border-negative/30' },
};

export default function DecisionBrief() {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();
  const v = VERDICT[e.decision] ?? VERDICT.accept;
  const irrOk = Number.isFinite(e.irr) && e.irr > a.wacc;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3.5"
      aria-label="Decision summary"
    >
      <div className="flex items-center gap-3">
        <span className="rounded bg-violet/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet">
          The decision
        </span>
        <p className="text-sm text-txt-dim">
          Build &amp; own Barq AI&apos;s <span className="text-txt">40&nbsp;MW</span> Abu Dhabi GPU hall
          for <span className="text-txt">8&nbsp;years</span> (~<span className="text-txt">AED&nbsp;5.8B</span>)
          — or rent instead?
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className={`rounded-lg border px-3 py-1 font-semibold ${v.cls}`}>{v.label}</span>
        <span className="text-txt-dim">NPV <span className="font-mono font-semibold text-txt">{fmtAedM(e.npv)}</span></span>
        <span className="text-txt-dim">
          IRR <span className={`font-mono font-semibold ${irrOk ? 'text-positive' : 'text-negative'}`}>{fmtPct(e.irr)}</span>
        </span>
        <span className="text-txt-dim">Break-even <span className="font-mono font-semibold text-amber">{fmtUsdHr(breakeven)}</span></span>
      </div>
    </motion.section>
  );
}
