/**
 * AI recommendation engine (feature F6). Synthesises the deterministic metrics,
 * the break-even, the dominant sensitivity driver and the Monte-Carlo loss
 * probability into a grounded accept/reject recommendation (Brief §5.6). Every
 * number here comes from the engine — the LLM narrative (F4) layers on in
 * Stage 6 and never invents figures.
 */
import type { Assumptions, Evaluation } from '../finance';
import { oneWaySensitivity, breakevenUtilization, buildRentCrossoverUtil } from '../finance';
import { DRIVERS } from './drivers';
import { fmtAedM, fmtPct, fmtRatio, fmtUsdHr, fmtYears } from './format';
import { MC_RUNS } from './simulate';

export interface Recommendation {
  verdict: Evaluation['decision'];
  headline: string;
  body: string;
  keyRisk: string;
  bullets: string[];
  /** Present on a thin ACCEPT: the stage-gate / tranche-release plan (P3). */
  stageGate?: string;
}

/** The driver with the largest one-way NPV span at the current assumptions. */
export function topDriver(a: Assumptions): string {
  let bestLabel = '';
  let bestSpan = -1;
  for (const d of DRIVERS) {
    const cur = a[d.key] as number;
    const pts = oneWaySensitivity(a, d.key, [
      { label: 'lo', value: d.low(cur) },
      { label: 'hi', value: d.high(cur) },
    ]);
    const span = Math.abs(pts[1].deltaNpv - pts[0].deltaNpv);
    if (span > bestSpan) {
      bestSpan = span;
      bestLabel = d.label;
    }
  }
  return bestLabel;
}

export function buildRecommendation(
  a: Assumptions,
  e: Evaluation,
  breakeven: number,
  probNegative: number,
): Recommendation {
  const driver = topDriver(a);
  const be = Number.isFinite(breakeven) ? `${fmtUsdHr(breakeven)}/GPU-hr` : 'n/a';

  const bullets = [
    `NPV ${fmtAedM(e.npv)} · IRR ${fmtPct(e.irr)} vs ${fmtPct(a.wacc)} WACC`,
    `PI ${fmtRatio(e.pi)} · payback ${e.payback == null ? 'never' : fmtYears(e.payback)}`,
    `P(NPV < 0) ≈ ${fmtPct(probNegative, 0)} (Monte-Carlo, ${MC_RUNS.toLocaleString('en-US')} runs)`,
    `Break-even GPU rate ${be} · most sensitive driver: ${driver}`,
  ];

  const keyRisk = `A structural fall in the GPU rental rate below the ${be} break-even — ${driver} is the dominant driver.`;

  // P3 — stage-gate nuance: an ACCEPT with a thin margin (meaningful loss
  // probability, or break-even close to the current price) is really a
  // *conditional* accept — release capex in tranches gated on measured
  // utilization, and keep a rent/RaaS fallback rather than committing up front.
  const thinAccept =
    e.decision === 'accept' &&
    (probNegative >= 0.15 ||
      (Number.isFinite(breakeven) && a.gpuPriceUsd < breakeven * 1.25));
  let stageGate: string | undefined;
  if (thinAccept) {
    const beUtil = breakevenUtilization(a);
    const crossover = buildRentCrossoverUtil(a);
    const beUtilTxt = beUtil == null ? 'the break-even utilization' : `~${Math.round(beUtil * 100)}%`;
    const crossTxt = crossover == null ? 'the build-vs-rent crossover' : `~${Math.round(crossover * 100)}%`;
    stageGate =
      `Because the margin is thin (P(loss) ≈ ${fmtPct(probNegative, 0)}, and the ${be} break-even sits close to the ` +
      `${fmtUsdHr(a.gpuPriceUsd)}/GPU-hr price), treat this as a stage-gated accept: release the capex in tranches gated ` +
      `on measured utilization holding above ${beUtilTxt} (and the ${crossTxt} build-vs-rent crossover), and keep a ` +
      `rent/RaaS fallback for the Year-${a.refreshYear} GPU refresh rather than committing it all up front.`;
  }

  if (e.decision === 'reject') {
    return {
      verdict: 'reject',
      headline: 'Reject / restructure at these assumptions',
      body:
        `At the current assumptions the project destroys value: NPV is ${fmtAedM(e.npv)}, ` +
        `IRR ${fmtPct(e.irr)} is below the ${fmtPct(a.wacc)} WACC, and PI is ${fmtRatio(e.pi)} (< 1). ` +
        `${driver} is the most sensitive driver, and the GPU rental rate sits below the ${be} break-even. ` +
        `Management should reject or restructure — secure higher contracted rates and/or lower capex before revisiting.`,
      keyRisk,
      bullets,
    };
  }

  if (e.decision === 'marginal') {
    return {
      verdict: 'marginal',
      headline: 'Proceed only with conditions',
      body:
        `The project is marginal: NPV is ${fmtAedM(e.npv)} with IRR ${fmtPct(e.irr)} (vs ${fmtPct(a.wacc)} WACC) ` +
        `and PI ${fmtRatio(e.pi)}. Break-even is ${be} and Monte-Carlo puts the probability of a loss at ` +
        `${fmtPct(probNegative, 0)}. ${driver} dominates the outcome. Proceed only with contracted offtake ` +
        `that holds the rate above break-even, and stage the capex.`,
      keyRisk,
      bullets,
    };
  }

  return {
    verdict: 'accept',
    headline: 'Accept — with revenue de-risking',
    body:
      `The base case creates value: a positive NPV of ${fmtAedM(e.npv)} with IRR ${fmtPct(e.irr)} ` +
      `(above the ${fmtPct(a.wacc)} WACC) and PI ${fmtRatio(e.pi)}. The margin of safety is thin, however: ` +
      `NPV turns negative if the GPU rental rate falls below the ${be} break-even, and Monte-Carlo simulation ` +
      `puts the probability of a negative NPV at ${fmtPct(probNegative, 0)}. ${driver} is the dominant risk. ` +
      `Management should proceed, but de-risk revenue with multi-year contracted offtake before committing capex ` +
      `and stage the GPU fit-out.`,
    keyRisk,
    bullets,
    stageGate,
  };
}
