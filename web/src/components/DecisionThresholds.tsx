/**
 * DecisionThresholds — "the decision in a few numbers": the points at which the
 * verdict flips, so a reader sees exactly how much margin of safety there is.
 * Every value is solved live from the current assumptions.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAssumptions, useEvaluation, useBreakeven } from '../store/useEvaluation';
import { breakevenUtilization, maxCapexOverrun, buildRentCrossoverUtil } from '../finance';
import { runSimulation, MC_RUNS } from '../lib/simulate';
import { fmtUsdHr, fmtPct } from '../lib/format';

export default function DecisionThresholds() {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();
  const beUtil = useMemo(() => breakevenUtilization(a), [a]);
  const overrun = useMemo(() => maxCapexOverrun(a), [a]);
  const crossover = useMemo(() => buildRentCrossoverUtil(a), [a]);
  const mc = useMemo(() => runSimulation(a), [a]);

  const tiles: { label: string; value: string; sub: string; tone: string }[] = [
    {
      label: 'Break-even GPU rate',
      value: Number.isFinite(breakeven) ? `${fmtUsdHr(breakeven)}/hr` : 'n/a',
      sub: `now $${a.gpuPriceUsd.toFixed(2)} · market $2.85–3.50`,
      tone: 'text-amber',
    },
    {
      label: 'Break-even utilization',
      value: beUtil == null ? '—' : `${(beUtil * 100).toFixed(0)}%`,
      sub: beUtil == null ? 'no crossing in range' : `now ${(a.utilization * 100).toFixed(0)}%`,
      tone: 'text-blue',
    },
    {
      label: 'Capex overrun tolerated',
      value: overrun == null ? '>3×' : `+${(overrun * 100).toFixed(0)}%`,
      sub: 'before NPV turns negative',
      tone: 'text-violet',
    },
    {
      label: 'Hurdle rate ceiling',
      value: Number.isFinite(e.irr) ? fmtPct(e.irr) : 'n/a',
      sub: `WACC could rise to the IRR (now ${fmtPct(a.wacc)})`,
      tone: 'text-blue',
    },
    {
      label: 'Probability of a loss',
      value: fmtPct(mc.probNegative, 0),
      sub: `NPV < 0 across ${MC_RUNS.toLocaleString('en-US')} Monte-Carlo runs`,
      tone: mc.probNegative > 0.3 ? 'text-negative' : 'text-amber',
    },
    {
      label: 'Build-beats-rent above',
      value: crossover == null ? '—' : `${(crossover * 100).toFixed(0)}% util`,
      sub: 'below this, renting is cheaper',
      tone: 'text-violet',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Decision thresholds"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-txt">The decision in six numbers</h2>
        <p className="text-xs text-txt-dim">Each is the point at which the verdict flips — the margin of safety, quantified live.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-glass-border bg-white/5 p-3">
            <div className="text-[11px] uppercase tracking-wider text-txt-faint">{t.label}</div>
            <div className={`mt-1 font-mono text-lg font-semibold ${t.tone}`}>{t.value}</div>
            <div className="mt-0.5 text-[11px] text-txt-faint">{t.sub}</div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
