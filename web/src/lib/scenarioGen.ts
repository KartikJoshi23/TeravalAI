/**
 * AI scenario generator (feature F2). Auto-builds a coherent upside / base /
 * downside driver set from the *current* live anchor (not the fixed canonical
 * scenarios), by applying calibrated shocks to the five drivers. The user can
 * apply any generated set to the store.
 */
import type { Assumptions } from '../finance';

export type GenTone = 'up' | 'base' | 'down';

export interface GenScenario {
  name: string;
  tone: GenTone;
  patch: Partial<Assumptions>;
}

export function generateScenarios(a: Assumptions): GenScenario[] {
  return [
    {
      name: 'Upside',
      tone: 'up',
      patch: {
        // Clamped to the slider ranges but never WORSE than the current anchor —
        // otherwise an edge anchor (e.g. PUE already at 1.05) would make the
        // "Upside" degrade a driver.
        gpuPriceUsd: a.gpuPriceUsd * 1.4,
        utilization: Math.max(a.utilization, Math.min(0.98, a.utilization + 0.1)),
        tariffAed: a.tariffAed * 0.9,
        pue: Math.min(a.pue, Math.max(1.05, a.pue - 0.05)),
        wacc: Math.min(a.wacc, Math.max(0.05, a.wacc - 0.01)),
      },
    },
    { name: 'Base (current)', tone: 'base', patch: {} },
    {
      name: 'Downside',
      tone: 'down',
      patch: {
        gpuPriceUsd: a.gpuPriceUsd * 0.65,
        utilization: Math.max(0.5, a.utilization - 0.15),
        tariffAed: a.tariffAed * 1.25,
        pue: a.pue + 0.1,
        wacc: a.wacc + 0.02,
      },
    },
  ];
}
