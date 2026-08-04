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
  buildrent: {
    label: 'Build vs Rent',
    description:
      'The Build vs Rent tab: should Barq build & own the hall or rent equivalent GPU capacity from a hyperscaler? The routes have different lives so they are compared on Equivalent Annual Cost (EAC). Building is a fixed cost; renting scales with utilization — so building only wins above ~77% sustained utilization. The base case: building beats renting by a thin incremental NPV of ~+AED 320M.',
    samples: ['Should we build or rent?', 'What is Equivalent Annual Cost?', 'When does renting win?'],
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
  board: {
    label: 'Board Review',
    description:
      'The Board Review tab: a Departmental Review Board where five departments — Finance/CFO, Infrastructure/Ops, Commercial/Revenue, Sustainability/ESG and Technology/AI — each score the SAME live case with a documented deterministic rule over the engine numbers, take a stance (supports / supports-with-conditions / opposes), and a weighted verdict aggregates them. The base case is "approve with conditions" (staged capex, N+1 cooling, a contracted-utilization floor, a PUE ceiling). Any unmet non-negotiable prevents unconditional approval.',
    samples: ['What is the board verdict?', 'Which department is most opposed?', 'Why only approve with conditions?'],
  },
  ethics: {
    label: 'Ethics & Audit',
    description:
      'The Ethics & Audit tab: the ethical use of AI (accuracy, hallucination, incorrect-data, bias, confidentiality, human review) each paired with Teraval\'s mitigation; a Data Provenance panel with official sources (CBUAE base rate 3.65% and 3-month EIBOR 3.94% anchor the WACC; the Abu Dhabi industrial tariff is pending a portal outage, benchmark AED 0.15/kWh); and an assumptions-audit table tagging every input historical/current/forecast/user-entered/AI-generated with a live model-integrity self-test. The AI advises; the CFO decides.',
    samples: ['How is hallucination prevented?', 'Who is responsible for the decision?', 'What does the self-test check?'],
  },
};

export function tabInfo(tab: string): TabInfo {
  return TAB_INFO[tab] ?? TAB_INFO.overview;
}
