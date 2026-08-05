/**
 * AI scenario generator (feature F2). Auto-builds a coherent upside / downside
 * driver set from the *current* live anchor (not the fixed canonical scenarios),
 * by applying calibrated shocks to the five drivers, plus a "Base (reset)" row
 * that restores the verified base case. The user can apply any set to the store.
 *
 * Every shocked value is clamped to its slider range (from DRIVERS), so applying
 * a set repeatedly saturates at the valid bounds instead of drifting to absurd
 * magnitudes on each click.
 */
import type { Assumptions } from '../finance';
import { BASE_ASSUMPTIONS } from '../finance';
import { DRIVERS } from './drivers';

export type GenTone = 'up' | 'base' | 'down';

export interface GenScenario {
  name: string;
  tone: GenTone;
  patch: Partial<Assumptions>;
}

/** key → [min, max] slider bounds, so shocks stay inside the valid driver range. */
const BOUNDS: Partial<Record<keyof Assumptions, { min: number; max: number }>> =
  Object.fromEntries(DRIVERS.map((d) => [d.key, { min: d.min, max: d.max }]));

function clamp(key: keyof Assumptions, v: number): number {
  const b = BOUNDS[key];
  return b ? Math.min(b.max, Math.max(b.min, v)) : v;
}

export function generateScenarios(a: Assumptions): GenScenario[] {
  return [
    {
      name: 'Upside',
      tone: 'up',
      // Each shock moves a driver the "better" way; clamping to the slider range
      // also stops an edge anchor from degrading it (e.g. PUE already at 1.05).
      patch: {
        gpuPriceUsd: clamp('gpuPriceUsd', a.gpuPriceUsd * 1.4),
        utilization: clamp('utilization', a.utilization + 0.1),
        tariffAed: clamp('tariffAed', a.tariffAed * 0.9),
        pue: clamp('pue', a.pue - 0.05),
        wacc: clamp('wacc', a.wacc - 0.01),
      },
    },
    {
      // Restores the verified base case (all drivers), so there is always a way
      // back after exploring — this is what "Apply" on the base row now does.
      name: 'Base (reset)',
      tone: 'base',
      patch: { ...BASE_ASSUMPTIONS },
    },
    {
      name: 'Downside',
      tone: 'down',
      patch: {
        gpuPriceUsd: clamp('gpuPriceUsd', a.gpuPriceUsd * 0.65),
        utilization: clamp('utilization', a.utilization - 0.15),
        tariffAed: clamp('tariffAed', a.tariffAed * 1.25),
        pue: clamp('pue', a.pue + 0.1),
        wacc: clamp('wacc', a.wacc + 0.02),
      },
    },
  ];
}
