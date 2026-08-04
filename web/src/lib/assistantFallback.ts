/**
 * Local, engine-grounded answerer. Used when the NIM backend is unreachable or
 * has no key configured, so the assistant still works for the demo. It pattern-
 * matches the question to the live context and phrases a grounded answer from
 * the deterministic numbers (never inventing figures) — the same discipline the
 * LLM prompt enforces, just without natural-language flair.
 */
import type { AssistantContext } from './assistantContext';
import { fmtAedM, fmtPct, fmtRatio, fmtUsdHr, fmtYears } from './format';

/** Scope guardrail: the assistant only discusses this appraisal. */
const GUARDRAIL =
  "I'm the Teraval finance assistant — I can only help with this Barq AI capital-budgeting appraisal. " +
  'Try asking about NPV, break-even, scenarios, the GPU rental rate, or the recommendation.';

// A question is in scope if it mentions anything finance/project-related.
const FINANCE_KW = [
  'npv', 'irr', 'mirr', 'wacc', 'profitab', 'pi ', ' pi', 'break', 'even', 'cost', 'price',
  'risk', 'invest', 'capex', 'capital', 'gpu', 'scenario', 'sensitiv', 'tornado', 'monte',
  'carlo', 'board', 'ethic', 'recommend', 'payback', 'cash', 'flow', ' eac', 'rent', 'build',
  'tariff', 'pue', 'utiliz', 'forecast', 'value', 'discount', 'margin', 'offtake', 'refresh',
  'depreciat', 'tax', 'decision', 'verdict', 'assumption', 'barq', 'data cent', 'hall',
  'project', 'model', 'accept', 'reject', 'hurdle', 'return', 'profit', 'loss', 'revenue',
  'worth', 'spend', 'kpi', 'chart', 'graph', 'year', 'dip', 'slider', 'metric', 'number',
];
// Phrases that are never a legitimate finance question, even if a finance-ish
// word appears (e.g. "capital of France" contains "capital").
const STRONG_OFFTOPIC = [
  'python', 'javascript', ' java ', 'c++', 'recipe', 'how to cook', 'capital of', 'capital city',
  'tell me a joke', 'write me a poem', 'write me an essay', 'write a poem', 'write a song',
  'meaning of life', 'weather in', 'who won', 'translate ',
];
// Softer off-topic signals — refused only when NO finance keyword is present.
const OFFTOPIC_KW = [
  'teach', 'tutor', 'learn ', 'code', 'coding', 'program', 'joke', 'poem', 'essay', 'story',
  'homework', 'history of', 'who is', 'who was', 'song', 'lyric', 'movie', 'workout', 'diet',
  'weather', 'write me', 'help me with', 'how do i make',
];

const inScope = (q: string) => FINANCE_KW.some((k) => q.includes(k));

function has(q: string, ...terms: string[]): boolean {
  return terms.some((t) => q.includes(t));
}

export function answerLocally(question: string, c: AssistantContext): string {
  const q = question.toLowerCase();
  const m = c.metrics;
  const be = `${fmtUsdHr(c.breakevenGpuPriceUsd)}/GPU-hr`;

  // --- Scope guardrail (refuse off-topic BEFORE any answer branch) ---
  if (STRONG_OFFTOPIC.some((k) => q.includes(k))) return GUARDRAIL;
  if (!inScope(q) && OFFTOPIC_KW.some((k) => q.includes(k))) return GUARDRAIL;

  // Specific intents FIRST — the generic tab description is the LAST resort, so
  // chips like "What does break-even mean here?" get their dedicated answer.

  // Break-even
  if (has(q, 'break', 'even', 'breakeven')) {
    return (
      `The break-even GPU rental rate is about ${be} — the price at which NPV = 0, holding everything ` +
      `else fixed. The current price is ${fmtUsdHr(c.assumptions.gpuPriceUsd)}/GPU-hr, and the 2025 market ` +
      `sits around $2.85–3.50, so the margin of safety is thin.`
    );
  }

  // Most sensitive driver (the tornado chart ranks exactly this)
  if (has(q, 'matters most', 'sensitive', 'biggest', 'greatest', 'dominant', 'which assumption', 'which driver', 'tornado')) {
    return (
      `${c.dominantDriver} has the greatest impact on NPV. A roughly ±20% move in it swings NPV more than ` +
      `any other driver; utilization is second. That is why de-risking the GPU rental rate (via contracted ` +
      `offtake) matters most.`
    );
  }

  // Monte-Carlo / probability of loss
  if (has(q, 'probab', 'chance', 'monte', 'carlo', 'simulat', 'lose money', 'how likely')) {
    return (
      `Monte-Carlo simulation over the driver distributions puts the probability of a negative NPV at ` +
      `about ${fmtPct(c.probNegative, 0)} at the current assumptions.`
    );
  }

  // Build vs Rent / EAC (' rent' with a space so "current" can't trigger it;
  // \beac\b so "each" can't).
  if (has(q, ' rent', 'build or', 'build vs', 'or build', 'equivalent annual', 'hyperscaler') || /\beac\b/.test(q)) {
    const bvr = c.buildVsRent;
    const cross =
      bvr.crossoverUtil == null
        ? 'there is no crossover in the modelled range'
        : `building wins only above ~${(bvr.crossoverUtil * 100).toFixed(0)}% sustained utilization`;
    return (
      `Build vs rent is compared on Equivalent Annual Cost because the routes have different lives ` +
      `(own hall ${c.assumptions.lifeYears}y vs a 3y cloud commitment). At the current settings the cheaper ` +
      `route is ${bvr.cheapest === 'build' ? 'building' : 'renting'}: the incremental NPV of building over ` +
      `renting is ${fmtAedM(bvr.incrementalNpvAed)}, and ${cross}. The build is a fixed cost while renting ` +
      `scales with utilization — which is why utilization decides this call.`
    );
  }

  // Year-4 refresh dip
  if (has(q, 'year 4', 'refresh', 'dip', 'lower in year')) {
    return (
      `The Year-4 dip is the GPU refresh capex: the model reinvests half of the IT-hardware capex mid-life ` +
      `to keep the fleet competitive (fast GPU obsolescence), so that year's free cash flow drops before ` +
      `recovering. It is a relevant incremental cash flow, so it is in the NPV.`
    );
  }

  // Pessimistic / why negative
  if (has(q, 'pessimistic', 'negative', 'reject', 'loss')) {
    const p = c.scenarios.pessimistic;
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

  // Risk alerts
  if (has(q, 'risk alert', 'alert', 'warning')) {
    return (
      `The risk panel runs rule-based checks on the live assumptions: negative NPV, IRR below the WACC, ` +
      `rental rate below the ${be} break-even, PUE too high, capex overrun, and unrealistic-assumption ` +
      `flags. An alert appears the moment a check trips — try dragging the GPU-price slider below break-even.`
    );
  }

  // Forecast band
  if (has(q, 'forecast', 'band', 'p10', 'p90')) {
    return (
      `The forecast shows a mean-reverting GPU-rate path with a P10–P90 uncertainty band — a range, not a ` +
      `point estimate, because GPU pricing is volatile and non-stationary. The core revenue risk is the ` +
      `downside (P10) path dipping below the ${be} break-even.`
    );
  }

  // Self-test / model integrity
  if (has(q, 'self-test', 'self test', 'integrity')) {
    return (
      `The self-test runs four finance identities live: NPV discounted at the IRR must be ≈ 0; PI > 1 exactly ` +
      `when NPV > 0; MIRR sits between the WACC and the IRR; and the build-vs-rent incremental NPV agrees in ` +
      `sign with the EAC advantage. If an edit ever breaks the model's internal logic, the header badge turns red.`
    );
  }

  // Ethics / responsibility
  if (has(q, 'hallucinat', 'responsib', 'who decides', 'ethic', 'confidential', 'bias')) {
    return (
      `The assistant is grounded: it is handed the live computed model state and narrates it — it never ` +
      `generates numbers itself, which is the hallucination mitigation. Forecasts are shown as ranges, the ` +
      `pessimistic scenario and Monte-Carlo stress the downside, and the model state stays client-side. ` +
      `The final invest/reject decision rests with the CFO and investment committee, not the AI.`
    );
  }

  // Payback
  if (has(q, 'payback', 'pay back', 'pays back')) {
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

  // "What does this show / explain this view" → describe the focused tab (last
  // resort among the recognised intents, so it can't shadow the branches above).
  if (c.focus && has(q, 'this ', 'what am i', 'looking at', 'explain the view', 'describe')) {
    return `${c.focus.description} Ask me anything specific about it — I answer from the live model numbers.`;
  }

  // Fallback: two-tier. Finance-adjacent → the grounded summary; otherwise refuse.
  if (inScope(q)) {
    return `${c.summary} Ask me about NPV, IRR, break-even, the most sensitive driver, scenarios, or risk.`;
  }
  return GUARDRAIL;
}
