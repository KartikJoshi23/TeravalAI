/** Shared accept / marginal / reject styling, used by every badge and pill. */
import type { Evaluation } from '../finance';

export type Decision = Evaluation['decision'];

export const DECISION_STYLE: Record<
  Decision,
  { label: string; text: string; badge: string; dot: string }
> = {
  accept: {
    label: 'ACCEPT',
    text: 'text-positive',
    badge: 'text-positive border-positive/40 bg-positive/10',
    dot: 'bg-positive',
  },
  marginal: {
    label: 'CONDITIONAL',
    text: 'text-amber',
    badge: 'text-amber border-amber/40 bg-amber/10',
    dot: 'bg-amber',
  },
  reject: {
    label: 'REJECT',
    text: 'text-negative',
    badge: 'text-negative border-negative/40 bg-negative/10',
    dot: 'bg-negative',
  },
};
