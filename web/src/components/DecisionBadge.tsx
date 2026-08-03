/** DecisionBadge — the live accept / marginal / reject verdict from evaluate(). */
import { motion } from 'framer-motion';
import { useEvaluation } from '../store/useEvaluation';
import { DECISION_STYLE } from '../lib/decision';

export default function DecisionBadge() {
  const { decision } = useEvaluation();
  const s = DECISION_STYLE[decision];

  return (
    <motion.div
      key={decision}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide ${s.badge}`}
    >
      <span className={`h-2 w-2 animate-pulse motion-reduce:animate-none rounded-full ${s.dot}`} />
      {s.label}
    </motion.div>
  );
}
