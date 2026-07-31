/**
 * KpiCard — one glassmorphism metric tile with a GSAP count-up value,
 * accept/reject colour coding, an accent glow, and a Framer-Motion entrance +
 * hover lift.
 */
import { motion } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';

export type Tone = 'positive' | 'negative' | 'warning' | 'neutral';

const TONE_TEXT: Record<Tone, string> = {
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-amber',
  neutral: 'text-txt',
};

const TONE_DOT: Record<Tone, string> = {
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning: 'bg-amber',
  neutral: 'bg-txt-dim',
};

export interface KpiCardProps {
  label: string;
  /** Numeric target driving the count-up. */
  target: number;
  /** Formats the (animated) value for display. */
  format: (n: number) => string;
  tone: Tone;
  /** Hex accent for this card's glow/border tint. */
  accent: string;
  /** Optional small unit suffix rendered after the value (e.g. "/GPU-hr"). */
  unit?: string;
  /** Small decision-signal line under the value. */
  signal: string;
  index: number;
}

export default function KpiCard({
  label,
  target,
  format,
  tone,
  accent,
  unit,
  signal,
  index,
}: KpiCardProps) {
  const animated = useCountUp(target);

  return (
    <motion.div
      className="glass group relative overflow-hidden p-5"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
    >
      {/* accent glow that intensifies on hover */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: accent }}
      />
      {/* top accent hairline */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-txt-faint">
          {label}
        </span>
        <span className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
      </div>

      <div
        className={`relative mt-3 whitespace-nowrap font-mono text-2xl font-semibold leading-tight tabular-nums ${TONE_TEXT[tone]}`}
      >
        {format(animated)}
        {unit && <span className="ml-1 align-baseline text-sm font-medium text-txt-dim">{unit}</span>}
      </div>

      <div className="relative mt-2 text-xs text-txt-dim">{signal}</div>
    </motion.div>
  );
}
