/** DecisionPill — small presentational accept/marginal/reject tag for a given decision. */
import type { Decision } from '../lib/decision';
import { DECISION_STYLE } from '../lib/decision';

export default function DecisionPill({ decision }: { decision: Decision }) {
  const s = DECISION_STYLE[decision];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
