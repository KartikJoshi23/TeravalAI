/** DecisionBadge — the live accept / marginal / reject verdict from evaluate(). */
import { motion } from 'framer-motion';
import { useEvaluation } from '../store/useEvaluation';

const STYLES = {
  accept: { text: 'ACCEPT', cls: 'text-positive border-positive/40 bg-positive/10', dot: 'bg-positive' },
  marginal: { text: 'CONDITIONAL', cls: 'text-amber border-amber/40 bg-amber/10', dot: 'bg-amber' },
  reject: { text: 'REJECT', cls: 'text-negative border-negative/40 bg-negative/10', dot: 'bg-negative' },
} as const;

export default function DecisionBadge() {
  const { decision } = useEvaluation();
  const s = STYLES[decision];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide ${s.cls}`}
    >
      <span className={`h-2 w-2 animate-pulse rounded-full ${s.dot}`} />
      {s.text}
    </motion.div>
  );
}
