/**
 * ScenarioGenerator (feature F2) — auto-builds a coherent upside/base/downside
 * set from the *current* live anchor and shows each one's NPV, with an Apply
 * button that loads it into the store. Complements the fixed canonical scenarios.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { evaluate } from '../../finance';
import { useAssumptions } from '../../store/useEvaluation';
import { useModelStore } from '../../store/useModelStore';
import { generateScenarios } from '../../lib/scenarioGen';
import type { GenTone } from '../../lib/scenarioGen';
import DecisionPill from '../DecisionPill';
import { fmtAedM } from '../../lib/format';

const TONE_DOT: Record<GenTone, string> = {
  up: 'bg-positive',
  base: 'bg-blue',
  down: 'bg-negative',
};

export default function ScenarioGenerator() {
  const a = useAssumptions();
  const setAssumptions = useModelStore((s) => s.setAssumptions);

  const rows = useMemo(() => {
    return generateScenarios(a).map((g) => {
      const e = evaluate({ ...a, ...g.patch });
      return { ...g, npv: e.npv, decision: e.decision };
    });
  }, [a]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      className="glass flex h-full flex-col p-5"
      aria-label="AI scenario generator"
    >
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-txt">Scenario generator</h2>
        <span className="rounded bg-violet/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet">
          AI · F2
        </span>
      </div>
      <p className="mb-4 text-xs text-txt-dim">Coherent sets built from your current anchor</p>

      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-white/5 p-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[r.tone]}`} />
                <span className="text-sm font-medium text-txt">{r.name}</span>
              </div>
              <div className="mt-1 truncate font-mono text-xs tabular-nums text-txt-dim">
                NPV {fmtAedM(r.npv)}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DecisionPill decision={r.decision} />
              <button
                type="button"
                onClick={() => setAssumptions(r.patch)}
                className="rounded-md border border-glass-border px-2 py-1 text-[11px] font-medium text-txt-dim transition-colors hover:border-violet/50 hover:text-txt"
              >
                {r.tone === 'base' ? 'Reset' : 'Apply'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-auto border-t border-glass-border pt-3 text-[11px] text-txt-faint">
        AI-generated ranges · you can override every value with the sliders.
      </p>
    </motion.section>
  );
}
