/**
 * RecommendationPanel (feature F6) — the live AI recommendation. Synthesises the
 * deterministic metrics + break-even + dominant driver + a light Monte-Carlo
 * loss probability into an accept/reject conclusion (Brief §5.6). Rule-based and
 * grounded now; the NIM LLM narrative (F4) plugs in at Stage 6.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAssumptions, useEvaluation, useBreakeven } from '../../store/useEvaluation';
import { runSimulation } from '../../lib/simulate';
import { buildRecommendation } from '../../lib/recommendation';
import { DECISION_STYLE } from '../../lib/decision';

export default function RecommendationPanel() {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();
  // a lighter run for the headline loss probability (keeps this panel cheap)
  const mc = useMemo(() => runSimulation(a, 7, 2000), [a]);
  const rec = useMemo(
    () => buildRecommendation(a, e, breakeven, mc.probNegative),
    [a, e, breakeven, mc.probNegative],
  );
  const s = DECISION_STYLE[rec.verdict];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      className="glass flex h-full flex-col p-5"
      aria-label="AI recommendation"
    >
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-txt">AI recommendation</h2>
        <span className="rounded bg-blue/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue">
          AI · F6
        </span>
      </div>

      <div
        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${s.badge}`}
      >
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        {s.label}
      </div>

      <h3 className={`mt-3 text-sm font-semibold ${s.text}`}>{rec.headline}</h3>
      <p className="mt-2 text-sm leading-relaxed text-txt-dim">{rec.body}</p>

      <div className="mt-4 rounded-lg border border-negative/25 bg-negative/5 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-negative">Key risk</div>
        <p className="mt-1 text-xs text-txt-dim">{rec.keyRisk}</p>
      </div>

      <ul className="mt-4 flex flex-col gap-1.5 text-xs text-txt-dim">
        {rec.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-txt-faint" />
            <span className="font-mono">{b}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-glass-border pt-3 text-[11px] text-txt-faint">
        AI-generated · every figure grounded in the deterministic engine · final decision rests
        with the CFO.
      </p>
    </motion.section>
  );
}
