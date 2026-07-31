/**
 * Builds the grounded "model state" the assistant reasons over. Every figure is
 * computed by the deterministic engine — the LLM (or the offline fallback) only
 * narrates these numbers, never invents them.
 */
import type { Assumptions, Evaluation } from '../finance';
import { evaluateScenarios } from '../finance';
import { topDriver } from './recommendation';
import { fmtAedM, fmtPct, fmtRatio, fmtUsdHr, fmtYears } from './format';

export interface ScenarioSnapshot {
  npv: number;
  irr: number;
  pi: number;
  decision: Evaluation['decision'];
}

export interface AssistantContext {
  summary: string;
  currency: 'AED millions';
  assumptions: {
    gpuPriceUsd: number;
    utilization: number;
    tariffAed: number;
    pue: number;
    wacc: number;
    lifeYears: number;
    taxRate: number;
    itMW: number;
    gpus: number;
  };
  metrics: {
    npv: number;
    irr: number;
    mirr: number;
    pi: number;
    payback: number | null;
    discountedPayback: number | null;
    decision: Evaluation['decision'];
  };
  breakevenGpuPriceUsd: number;
  dominantDriver: string;
  probNegative: number;
  scenarios: {
    optimistic: ScenarioSnapshot;
    base: ScenarioSnapshot;
    pessimistic: ScenarioSnapshot;
  };
}

const snap = (e: Evaluation): ScenarioSnapshot => ({
  npv: Math.round(e.npv),
  irr: e.irr,
  pi: e.pi,
  decision: e.decision,
});

export function buildAssistantContext(
  a: Assumptions,
  e: Evaluation,
  breakeven: number,
  probNegative: number,
): AssistantContext {
  const s = evaluateScenarios();
  const driver = topDriver(a);

  const summary =
    `Current case: NPV ${fmtAedM(e.npv)}, IRR ${fmtPct(e.irr)} (vs ${fmtPct(a.wacc)} WACC), ` +
    `MIRR ${fmtPct(e.mirr)}, PI ${fmtRatio(e.pi)}, payback ${e.payback == null ? 'never' : fmtYears(e.payback)} ` +
    `→ decision ${e.decision}. Break-even GPU rate ${fmtUsdHr(breakeven)}/GPU-hr. ` +
    `Most sensitive driver: ${driver}. Monte-Carlo P(NPV<0) ≈ ${fmtPct(probNegative, 0)}. ` +
    `Scenarios — optimistic ${fmtAedM(s.optimistic.npv)}, base ${fmtAedM(s.base.npv)}, ` +
    `pessimistic ${fmtAedM(s.pessimistic.npv)}.`;

  return {
    summary,
    currency: 'AED millions',
    assumptions: {
      gpuPriceUsd: a.gpuPriceUsd,
      utilization: a.utilization,
      tariffAed: a.tariffAed,
      pue: a.pue,
      wacc: a.wacc,
      lifeYears: a.lifeYears,
      taxRate: a.taxRate,
      itMW: a.itMW,
      gpus: a.racks * a.gpusPerRack,
    },
    metrics: {
      npv: e.npv,
      irr: e.irr,
      mirr: e.mirr,
      pi: e.pi,
      payback: e.payback,
      discountedPayback: e.discountedPayback,
      decision: e.decision,
    },
    breakevenGpuPriceUsd: breakeven,
    dominantDriver: driver,
    probNegative,
    scenarios: {
      optimistic: snap(s.optimistic),
      base: snap(s.base),
      pessimistic: snap(s.pessimistic),
    },
  };
}
