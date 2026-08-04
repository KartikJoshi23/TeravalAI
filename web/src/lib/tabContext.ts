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
      'The Overview: a Decision Brief framing the question (should Barq AI commit ~AED 5.8B to build & own a 40 MW Abu Dhabi GPU hall for 8 years?), then the headline KPIs (NPV, IRR, MIRR, Profitability Index, payback, break-even GPU rate), a live 3D view of the data-center hall, and the AI recommendation that synthesises them.',
    samples: ['Is the base case an accept?', 'What does break-even mean here?', 'Summarise the verdict.'],
  },
  financials: {
    label: 'Cash Flow & Build-vs-Rent',
    description:
      'The Cash Flow & Build-vs-Rent tab has two sections. (1) An 8-year free-cash-flow chart: bars are each year\'s FCF — Year 0 is the negative up-front outlay (~AED 5.9B) and Year 4 dips for the GPU refresh capex — and the line is the cumulative DISCOUNTED cash flow, crossing zero at the discounted payback (~6.3 years). (2) Build vs Rent: build & own vs rent equivalent GPU capacity, compared on Equivalent Annual Cost (EAC) since the lives differ; building is fixed cost, renting scales with utilization, so building only wins above ~77% sustained utilization — base case building beats renting by a thin incremental NPV of ~+AED 320M.',
    samples: ['Why is Year 4 lower?', 'Should we build or rent?', 'When does it pay back?'],
  },
  scenarios: {
    label: 'Scenarios & Sensitivity',
    description:
      'The Scenarios & Sensitivity tab has two sections. (1) Scenarios: optimistic ≈ +AED 10,216M (accept), base ≈ +AED 1,854M (accept), pessimistic ≈ −AED 4,138M (reject). (2) Sensitivity & Risk: sliders drive the model live, decision thresholds show exactly where the verdict flips, a tornado chart ranks each driver\'s NPV impact (GPU rental price #1, utilization #2), and a risk panel raises rule-based alerts (negative NPV, IRR below WACC, rate below break-even, etc.).',
    samples: ['Why is the pessimistic case a reject?', 'Which driver matters most?', 'Under what conditions does the decision change?'],
  },
  ai: {
    label: 'AI & Forecasting',
    description:
      'The AI & Forecasting tab collects the AI. Simulation/scenario AI: a Monte-Carlo NPV distribution with P(NPV<0) ≈ 21%, an AI GPU-rate forecast with P10–P90 bands, and an AI scenario generator. Trained machine-learning models: (1) a surrogate risk classifier (logistic regression) trained on ~4,000 engine-labelled scenarios — held-out test accuracy ~96.7%, AUC ~0.998, a live accept-probability, a learned price×utilization decision surface, and permutation feature-importance that reproduces the tornado; (2) an AR(1) GPU-price forecaster fit by least squares with a held-out test error (~$0.06 RMSE), forecasting the spot rate to ~$2.73 (below the $3.34 break-even and $4.00 contracted rate) — quantifying why the plan needs contracted offtake. The models augment the analysis; the deterministic engine still computes every valuation.',
    samples: ['What is the probability of a loss?', 'How accurate is the risk model?', 'What does the forecast imply for the decision?'],
  },
  governance: {
    label: 'Board & Ethics',
    description:
      'The Board & Ethics tab has two sections. (1) Departmental Review Board: five departments — Finance/CFO, Infrastructure/Ops, Commercial/Revenue, Sustainability/ESG and Technology/AI — each score the SAME live case with a documented deterministic rule over the engine numbers, take a stance, and a weighted verdict aggregates them; the base case is "approve with conditions". (2) Ethics & Audit: the ethical use of AI (accuracy, hallucination, incorrect-data, bias, confidentiality, human review) each paired with a mitigation; a Data Provenance panel (CBUAE base rate 3.65% and 3-month EIBOR 3.94% anchor the WACC; the Abu Dhabi tariff is pending a portal outage, benchmark AED 0.15/kWh); and an assumptions-audit table tagging every input historical/current/forecast/user-entered/AI-generated with a live self-test. The AI advises; the CFO decides.',
    samples: ['What is the board verdict?', 'Who is responsible for the decision?', 'How is hallucination prevented?'],
  },
};

export function tabInfo(tab: string): TabInfo {
  return TAB_INFO[tab] ?? TAB_INFO.overview;
}
