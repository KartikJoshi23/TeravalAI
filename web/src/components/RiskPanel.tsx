/**
 * RiskPanel — live rule-based alerts (plan §6.5) from computeRisks(), driven by
 * the current assumptions. Re-evaluates whenever a slider or scenario changes.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { computeRisks } from '../lib/risk';
import type { Severity } from '../lib/risk';
import { useAssumptions, useEvaluation, useBreakeven } from '../store/useEvaluation';

const SEVERITY: Record<Severity, { row: string; dot: string; tag: string; label: string }> = {
  danger: { row: 'border-negative/30 bg-negative/5', dot: 'bg-negative', tag: 'text-negative', label: 'Risk' },
  warning: { row: 'border-amber/30 bg-amber/5', dot: 'bg-amber', tag: 'text-amber', label: 'Watch' },
  ok: { row: 'border-positive/30 bg-positive/5', dot: 'bg-positive', tag: 'text-positive', label: 'Clear' },
};

export default function RiskPanel() {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();
  const risks = useMemo(() => computeRisks(a, e, breakeven), [a, e, breakeven]);

  const dangerCount = risks.filter((r) => r.severity === 'danger').length;
  const warnCount = risks.filter((r) => r.severity === 'warning').length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      className="glass flex flex-col p-5"
      aria-label="Risk and alert panel"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-txt">Risk &amp; alerts</h2>
          <p className="text-xs text-txt-dim">Live checks on the current assumptions</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {dangerCount > 0 && (
            <span className="rounded-full bg-negative/15 px-2 py-0.5 font-medium text-negative">
              {dangerCount} risk{dangerCount > 1 ? 's' : ''}
            </span>
          )}
          {warnCount > 0 && (
            <span className="rounded-full bg-amber/15 px-2 py-0.5 font-medium text-amber">
              {warnCount} watch
            </span>
          )}
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {risks.map((r) => {
            const s = SEVERITY[r.severity];
            return (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 rounded-lg border p-3 ${s.row}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-txt">{r.title}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${s.tag}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-txt-dim">{r.detail}</p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}
