/**
 * Rule-based risk detection for the Risk & Alert panel (plan §6.5). Pure and
 * deterministic — given the live assumptions, the evaluation, and the break-even
 * price it returns the triggered alerts. (Stage 5's AI anomaly detector, F5,
 * will layer on top of this; this is the auditable floor beneath it.)
 */
import type { Assumptions, Evaluation } from '../finance';
import { BASE_ASSUMPTIONS } from '../finance';
import { fmtAedM, fmtPct, fmtUsdHr } from './format';

export type Severity = 'danger' | 'warning' | 'ok';

export interface Risk {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export function computeRisks(a: Assumptions, e: Evaluation, breakeven: number): Risk[] {
  const risks: Risk[] = [];

  // --- decision-breaking risks ---
  if (e.npv <= 0) {
    risks.push({
      id: 'npv',
      severity: 'danger',
      title: 'Negative NPV',
      detail: `NPV is ${fmtAedM(e.npv)} — the project destroys value at these assumptions.`,
    });
  }

  if (Number.isFinite(e.irr) && e.irr < a.wacc) {
    risks.push({
      id: 'irr',
      severity: 'danger',
      title: 'IRR below hurdle rate',
      detail: `IRR ${fmtPct(e.irr)} is under the ${fmtPct(a.wacc)} WACC — return does not clear cost of capital.`,
    });
  }

  // --- rental rate vs break-even ---
  if (Number.isFinite(breakeven)) {
    if (a.gpuPriceUsd < breakeven) {
      risks.push({
        id: 'breakeven',
        severity: 'danger',
        title: 'Rental rate below break-even',
        detail: `Price ${fmtUsdHr(a.gpuPriceUsd)}/hr is under the ${fmtUsdHr(breakeven)}/hr break-even.`,
      });
    } else if (a.gpuPriceUsd < breakeven * 1.1) {
      risks.push({
        id: 'breakeven-thin',
        severity: 'warning',
        title: 'Thin margin above break-even',
        detail: `Price ${fmtUsdHr(a.gpuPriceUsd)}/hr sits within 10% of the ${fmtUsdHr(breakeven)}/hr break-even — little headroom if rates soften.`,
      });
    }
  }

  // --- operating / cost risks ---
  if (a.pue > 1.35) {
    risks.push({
      id: 'pue-high',
      severity: 'warning',
      title: 'Cooling efficiency (PUE) high',
      detail: `PUE ${a.pue.toFixed(2)} lifts energy cost; liquid-cooled GB200 halls should reach 1.05–1.20.`,
    });
  }

  if (a.rackCostUsdM > BASE_ASSUMPTIONS.rackCostUsdM * 1.1) {
    risks.push({
      id: 'capex-overrun',
      severity: 'warning',
      title: 'Capex above plan',
      detail: `Rack capex $${a.rackCostUsdM.toFixed(1)}M is over 10% above the $${BASE_ASSUMPTIONS.rackCostUsdM.toFixed(1)}M base — cost-overrun risk.`,
    });
  }

  // --- unrealistic-assumption flags ---
  if (a.utilization > 0.95) {
    risks.push({
      id: 'util-high',
      severity: 'warning',
      title: 'Utilization implausibly high',
      detail: `${(a.utilization * 100).toFixed(0)}% sustained utilization is optimistic for a mixed contracted/on-demand fleet.`,
    });
  }

  if (a.pue < 1.05) {
    risks.push({
      id: 'pue-floor',
      severity: 'warning',
      title: 'PUE below physical floor',
      detail: `PUE ${a.pue.toFixed(2)} is below the ~1.05 practical minimum — check the assumption.`,
    });
  }

  if (a.tariffAed < 0.1) {
    risks.push({
      id: 'tariff-low',
      severity: 'warning',
      title: 'Tariff below any real UAE rate',
      detail: `AED ${a.tariffAed.toFixed(3)}/kWh undercuts Abu Dhabi industrial power (~AED 0.15) — likely too favourable.`,
    });
  }

  if (risks.length === 0) {
    risks.push({
      id: 'ok',
      severity: 'ok',
      title: 'No blocking risks',
      detail: 'All indicators sit within the accept range at the current assumptions.',
    });
  }

  return risks;
}
