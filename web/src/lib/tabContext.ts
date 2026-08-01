/**
 * Per-tab context for the floating assistant. When the user opens the assistant
 * with scope = "this tab", we attach the matching description so questions like
 * "what does this chart mean?" are answered about the view they're looking at.
 */
export interface TabInfo {
  label: string;
  description: string;
  samples: string[];
}

export const TAB_INFO: Record<string, TabInfo> = {
  overview: {
    label: 'Overview',
    description:
      'The Overview: headline KPIs (NPV, IRR, MIRR, Profitability Index, payback, break-even GPU rate), a 3D view of the data-center hall, and the AI recommendation for the base case.',
    samples: ['Is the base case an accept?', 'What does break-even mean here?', 'Summarise the verdict.'],
  },
  cashflow: {
    label: 'Cash Flow',
    description:
      'The Cash Flow tab: an 8-year free-cash-flow chart. Bars are each year\'s FCF — Year 0 is the negative up-front outlay (~AED 5.9B) and Year 4 dips for the GPU refresh capex. The line is the cumulative DISCOUNTED cash flow, which crosses zero at the discounted payback (~6.3 years).',
    samples: ['What does this cash-flow chart mean?', 'Why is Year 4 lower?', 'When does it pay back?'],
  },
  scenarios: {
    label: 'Scenarios',
    description:
      'The Scenarios tab: optimistic / base / pessimistic cases with their NPV, IRR, PI and accept-reject decision. Optimistic ≈ +AED 10,216M (accept), base ≈ +AED 1,854M (accept), pessimistic ≈ −AED 4,138M (reject).',
    samples: ['Why is the pessimistic case a reject?', 'What changes between scenarios?', 'How likely is each?'],
  },
  sensitivity: {
    label: 'Sensitivity & Risk',
    description:
      'The Sensitivity & Risk tab: sliders drive the model live, a tornado chart ranks each driver\'s NPV impact (GPU rental price #1, utilization #2), and a risk panel raises rule-based alerts (negative NPV, IRR below WACC, rate below break-even, etc.).',
    samples: ['Which driver matters most?', 'What does the tornado chart show?', 'What raises a risk alert?'],
  },
  ai: {
    label: 'AI Analysis',
    description:
      'The AI Analysis tab: a Monte-Carlo NPV distribution with the probability of a negative NPV, an AI GPU-rate forecast with P10–P90 bands, and an AI scenario generator. All figures are grounded in the deterministic engine.',
    samples: ['What is the probability of a loss?', 'What does the forecast band show?', 'Explain the Monte-Carlo result.'],
  },
};

export function tabInfo(tab: string): TabInfo {
  return TAB_INFO[tab] ?? TAB_INFO.overview;
}
