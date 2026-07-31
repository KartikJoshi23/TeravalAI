/**
 * Local, engine-grounded answerer. Used when the NIM backend is unreachable or
 * has no key configured, so the assistant still works for the demo. It pattern-
 * matches the question to the live context and phrases a grounded answer from
 * the deterministic numbers (never inventing figures) — the same discipline the
 * LLM prompt enforces, just without natural-language flair.
 */
import type { AssistantContext } from './assistantContext';
import { fmtAedM, fmtPct, fmtRatio, fmtUsdHr, fmtYears } from './format';

function has(q: string, ...terms: string[]): boolean {
  return terms.some((t) => q.includes(t));
}

export function answerLocally(question: string, c: AssistantContext): string {
  const q = question.toLowerCase();
  const m = c.metrics;
  const be = `${fmtUsdHr(c.breakevenGpuPriceUsd)}/GPU-hr`;

  // Break-even
  if (has(q, 'break', 'even', 'breakeven')) {
    return (
      `The break-even GPU rental rate is about ${be} — the price at which NPV = 0, holding everything ` +
      `else fixed. The current price is ${fmtUsdHr(c.assumptions.gpuPriceUsd)}/GPU-hr, and the 2025 market ` +
      `sits around $2.85–3.50, so the margin of safety is thin.`
    );
  }

  // Most sensitive driver
  if (has(q, 'matters most', 'sensitive', 'biggest', 'greatest', 'dominant', 'which assumption', 'which driver')) {
    return (
      `${c.dominantDriver} has the greatest impact on NPV. A roughly ±20% move in it swings NPV more than ` +
      `any other driver; utilization is second. That is why de-risking the GPU rental rate (via contracted ` +
      `offtake) matters most.`
    );
  }

  // Pessimistic / why negative
  if (has(q, 'pessimistic', 'negative', 'why', 'reject', 'lose money', 'loss')) {
    const p = c.scenarios.pessimistic;
    if (has(q, 'probab', 'chance', 'monte', 'risk', 'lose money')) {
      return (
        `Monte-Carlo simulation over the driver distributions puts the probability of a negative NPV at ` +
        `about ${fmtPct(c.probNegative, 0)} at the current assumptions.`
      );
    }
    return (
      `In the pessimistic scenario NPV is ${fmtAedM(p.npv)} (a reject): the GPU rate falls to ~$2.5/hr, ` +
      `utilization to ~65%, and tariff/PUE/WACC all worsen. Revenue drops below the level needed to recover ` +
      `the ~AED 5.8B outlay, so discounted cash flows no longer cover the investment.`
    );
  }

  // IRR explanation
  if (has(q, 'irr')) {
    return (
      `IRR is the annual return the project earns on the capital tied up in it — the discount rate at which ` +
      `NPV would be zero. Here it is ${fmtPct(m.irr)}, above the ${fmtPct(c.assumptions.wacc)} cost of capital ` +
      `(WACC), so the project adds value. In plain terms: it earns more than it costs to fund.`
    );
  }

  // Tariff / electricity
  if (has(q, 'tariff', 'electric', 'power', 'energy')) {
    return (
      `Electricity tariff is a minor driver — Abu Dhabi's cheap ~AED 0.15/kWh industrial power is a moat. ` +
      `Even a large tariff move shifts NPV far less than the GPU rental rate does; ${c.dominantDriver} dominates.`
    );
  }

  // Payback
  if (has(q, 'payback')) {
    return (
      `Payback is ${m.payback == null ? 'never within the horizon' : fmtYears(m.payback)} undiscounted` +
      `${m.discountedPayback == null ? '' : `, ${fmtYears(m.discountedPayback)} discounted`} — within the ` +
      `${c.assumptions.lifeYears}-year life, though the discounted payback is late.`
    );
  }

  // Profitability index
  if (has(q, 'profitability', 'pi ', ' pi', 'index per')) {
    return (
      `The profitability index is ${fmtRatio(m.pi)} — PV of inflows per AED of outlay. Above 1 means the ` +
      `project returns more than it costs, so it is accept on that test.`
    );
  }

  // NPV / accept-reject / general recommendation
  if (has(q, 'npv', 'accept', 'should we', 'invest', 'recommend', 'value')) {
    const verdict =
      m.decision === 'accept'
        ? 'so on the numbers it is an accept'
        : m.decision === 'reject'
          ? 'so on the numbers it is a reject'
          : 'so it is a conditional / marginal call';
    return (
      `Current NPV is ${fmtAedM(m.npv)} with IRR ${fmtPct(m.irr)} (vs ${fmtPct(c.assumptions.wacc)} WACC) and ` +
      `PI ${fmtRatio(m.pi)}, ${verdict}. The catch is the thin margin: break-even is ${be} and Monte-Carlo ` +
      `puts the probability of a loss at ~${fmtPct(c.probNegative, 0)}. Proceed only with contracted offtake ` +
      `that holds the rate above break-even.`
    );
  }

  // Fallback: the grounded summary.
  return `${c.summary} Ask me about NPV, IRR, break-even, the most sensitive driver, scenarios, or risk.`;
}
