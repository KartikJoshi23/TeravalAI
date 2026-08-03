# Implementation Plan — Teraval

**Product:** **Teraval** — *AI Capital-Budgeting Decision Intelligence* (repo: `teraval`)
**Project:** AI-Enabled Corporate Finance Decision Dashboard (Masters in AI with Business — Corporate Finance)
**Selected brief topic:** Topic 9 — AI Capital-Budgeting Dashboard (subsumes Topic 10, Relevant Cash-Flow & Capital-Investment)
**Instructor:** Dr. Nathaniel Christopher
**Team:** Kartik Joshi, Prem Kukreja, Gagandeep Singh, Samuel Alex, Aditya Chitale
**Status:** Plan approved 2026-07-30 — names locked (**Teraval** / operator **Barq AI**). Phase 4 development begins.

> **Methodology note.** This plan and everything after it follow the 6-phase problem-solving methodology (`Problem-Solving-Skill.md`): understand → investigate → design → implement → verify → report honestly. Concretely: every financial figure below was **computed and verified** in a reference model (not asserted); the finance engine will be built as a deterministic, unit-tested module so each metric is independently checkable; each build stage stops for review; `progress.md` is the honest status ledger.

---

## 1. Selected Topic & Real-World Scenario

### 1.1 The decision-maker
**Barq AI** (*barq*, برق — Arabic for "lightning": the power and speed a GPU data center is built on) — a realistic composite UAE AI-cloud infrastructure operator, benchmarked to the **real, in-progress Stargate UAE / Khazna / G42 buildout** in Abu Dhabi (200 MW first phase of a 1 GW campus, ~$10 B, completing Q3 2026). Using a composite operator (rather than a specific private JV) lets us build on **real, citable market data** without depending on undisclosed private financials — the standard, defensible approach for a capital-budgeting case. *(The dashboard product itself is **Teraval**; Barq AI is the company it appraises.)*

### 1.2 The financial decision
Barq AI's **CFO and investment committee** must decide whether to commit capital to **build and operate a new ~40 MW AI/GPU data-center hall in Abu Dhabi**, fitted with NVIDIA GB200-class accelerators, over an **8-year appraisal horizon**, and offered to the market as GPU-compute rental capacity. The classic accept/reject question: **does this project create shareholder value?**

### 1.3 Why it matters
- **Scale of capital at risk:** ~AED 5.8 billion up-front — a bet-the-company decision.
- **Timeliness & volatility:** GPU rental prices collapsed from ~$8/GPU-hr (late-2024) to ~$2.85–3.50 (2025) as 300+ providers entered the market. The project's viability hinges on where rates settle.
- **Strategic:** the UAE is positioning itself as a global AI-compute hub; cheap Abu Dhabi industrial power (~AED 0.15/kWh) is a real competitive moat.
- **Self-referential narrative:** AI-with-Business students building an AI tool to appraise an AI data center — memorable for the presentation.

### 1.4 Currency
Modelled in **AED** (matches the brief's "AED" examples). USD figures converted at the pegged **USD 1 = AED 3.6725**.

---

## 2. Corporate Finance Concepts & Formulas (Brief §2, aligned to the course syllabus)

The scenario is the capstone of the syllabus images provided (*Project appraisals* + *Making capital investment decisions*) and draws on earlier units (TVM, DCF, discount rates). All formulas will appear in the report and as tooltips in the dashboard.

| Concept | Formula | Role in this project |
|---|---|---|
| **Time value of money / PV** | `PV = FV / (1+r)^t` | Foundation of all discounting |
| **Discounted cash flow (NPV)** | `NPV = Σ (CFₜ / (1+r)ᵗ) − CF₀` | Primary decision metric |
| **Relevant / incremental cash flows** | `CF = Initial outlay, ΔOperating CF, Terminal CF` | Only incremental flows; exclude sunk costs; include opportunity cost + working capital |
| **Operating cash flow** | `OCF = EBIT·(1−T) + Depreciation` (or `EBITDA − Tax`) | Annual project cash flow |
| **Depreciation tax shield** | `Shield = Depreciation × Tax rate` | Reduces tax; straight-line here |
| **Terminal / salvage value** | `TV = Salvage + NWC recovery` (+ residual book value) | Year-8 cash flow |
| **Cost of equity (CAPM)** | `Kₑ = R_f + β·(R_m − R_f)` | Input to WACC |
| **WACC (discount rate)** | `WACC = (E/V)·Kₑ + (D/V)·K_d·(1−T)` | Discount rate r |
| **Internal Rate of Return** | `0 = Σ CFₜ/(1+IRR)ᵗ − CF₀` | Return vs hurdle rate |
| **Modified IRR** | `MIRR = (FV_inflows / PV_outflows)^{1/n} − 1` | Fixes IRR's reinvestment assumption |
| **Payback & discounted payback** | first t where `Σ CF ≥ 0` (undiscounted / discounted) | Liquidity/risk view |
| **Profitability Index** | `PI = PV(inflows) / |CF₀|` | Value per AED invested; capital rationing |
| **Sensitivity / scenario analysis** | one-way Δmetric per Δinput; discrete scenario sets | Risk quantification |

---

## 3. Data & Assumptions (Brief §3 — classified by type)

All figures verified in the reference model. Every assumption is tagged **[H]** historical, **[C]** current, **[F]** forecast, **[U]** user-entered (dashboard slider), or **[AI]** AI-generated.

### 3.1 Capital expenditure (Year 0)
| Item | Value | Basis |
|---|---|---|
| GPU/IT hardware — 300× GB200 NVL72 racks @ ~$3.5M all-in | $1,050M → **AED 3,856M** | GB200 NVL72 rack ~$3.1M ($3.9M all-in), ~120 kW/rack **[C]** |
| Facility build (40 MW IT × ~$13M/MW, AI-grade + liquid cooling) | $520M → **AED 1,910M** | AI-grade build >$20M/MW shell; blended all-in ~$38–59M/MW **[C]** |
| **Total initial investment** | **≈ AED 5,766M** ($39.2M/MW) | Reconciles to the $38–59M/MW all-in band **[C]** |
| Initial net working capital (spares, deposits) | AED 150M | Recovered at Year 8 **[U]** |

*Reconciliation note:* Stargate UAE's ~$10 B/1 GW headline (~$10M/MW) is facility-weighted/phased; our $39M/MW is full GPU fit-out, consistent with Epoch AI's ~$38M/MW. We cite both.

### 3.2 Revenue drivers
| Driver | Base | Basis |
|---|---|---|
| GPUs | 21,600 (300×72) | GB200 NVL72 **[C]** |
| GPU rental price | **$4.0/GPU-hr** | H100 ~$2.85–3.50; GB200 premium **[C]**, forward path **[F]/[AI]** |
| Utilization | **80%** | Contracted + on-demand mix **[U]** |
| Operating hours | 8,760/yr | Standard |
| **Revenue (base)** | **AED 2,224M/yr** | Computed |

### 3.3 Operating cost drivers
| Driver | Base | Basis |
|---|---|---|
| PUE (cooling efficiency) | **1.20** | Liquid-cooled 1.05–1.20; GB200 requires liquid **[C]** |
| Electricity tariff | **AED 0.15/kWh** | Abu Dhabi industrial flat rate **[C]** |
| Energy cost | AED 57M/yr | 40 MW × PUE × 8,760 × 0.9 load × tariff |
| Hardware maintenance | 5% of IT hardware = AED 193M/yr | Industry norm **[F]** |
| Fixed opex (staff, bandwidth, land lease, licences) | AED 350M/yr | **[U]** |
| **Total opex (base)** | **AED 600M/yr** | Computed |

### 3.4 Financial parameters
| Parameter | Base | Basis |
|---|---|---|
| Project life | 8 years | Appraisal horizon **[U]** |
| GPU refresh capex | 50% of IT hardware in Year 4 | Fast GPU obsolescence **[F]** |
| Depreciation | IT 5-yr SL, facility 15-yr SL | Straight-line |
| UAE corporate tax | 9% | Introduced 2023 **[C]** |
| WACC (discount rate) | 9% | CAPM: R_f 4.3%, β 1.3, ERP 6% → Kₑ 12.1%; K_d 6%×(1−9%); 50/50 → ~8.8% **[F]** |
| Terminal value (Y8) | facility residual + WC recovery ≈ AED 1,041M | Computed |

---

## 4. Financial Calculations — verified results (Brief §4; ≥3 required, 6 delivered)

Base-case metrics, all computed in the reference model:

| Metric | Base | Decision signal |
|---|---|---|
| **NPV** | **+AED 1,854M** | Positive → accept |
| **IRR** | **16.5%** | > 9% WACC → accept |
| **MIRR** | **12.6%** | > WACC → accept |
| **Profitability Index** | **1.31** | > 1 → accept |
| **Payback** | **5.0 yrs** | Within 8-yr life |
| **Discounted payback** | **6.3 yrs** | Within life, but late |
| **Breakeven GPU rental price** | **≈ $3.34/GPU-hr** | Market is ~$2.85–3.50 → **knife-edge** |

**Interpretation:** the base case creates value (~AED 1.85 B), but the margin of safety is thin — breakeven rental ($3.34) sits inside the current market range. This is the central finding the whole dashboard is designed to expose.

---

## 5. AI Features (Brief §5 — 6 features; ≥5 required). Each: *what · data · result · help · limitation/risk.*

**F1 — GPU Rental-Rate & Utilization Forecaster.**
- *What:* projects future $/GPU-hr and utilization from historical market rates and supply signals.
- *Data:* historical/current GPU cloud prices **[H/C]**, capacity pipeline, user horizon **[U]**.
- *Result:* a forward revenue curve with confidence bands **[AI/F]**.
- *Help:* replaces a flat guess with a defensible, range-based revenue assumption.
- *Limitation:* GPU pricing is highly non-stationary; a bull-market extrapolation can badly mislead — shown with wide bands and a warning.

**F2 — AI Scenario Generator.**
- *What:* auto-builds optimistic/base/pessimistic assumption sets from current market conditions.
- *Data:* driver ranges (price, utilization, tariff, PUE, WACC) **[C/U]**.
- *Result:* three coherent, internally consistent scenarios **[AI]**.
- *Help:* saves manual guesswork; enforces consistency across drivers.
- *Limitation:* scenarios are only as good as the ranges; can anchor the user — user can override every value.

**F3 — Monte-Carlo Risk Simulator + AI Narrative.**
- *What:* runs thousands of NPV draws over driver distributions; an LLM writes the plain-English risk story.
- *Data:* driver distributions **[U/AI]**, the finance engine.
- *Result:* P(NPV<0), NPV distribution, value-at-risk, narrative **[AI]**.
- *Help:* turns a single NPV into a probability of loss the committee can weigh.
- *Limitation:* assumed distributions may not match reality; correlations simplified — stated explicitly.

**F4 — AI Finance Assistant (NVIDIA NIM chatbot).** — see §7.
- *What:* natural-language Q&A grounded in the live model state.
- *Data:* current dashboard metrics + a small formula knowledge base **[C/U]**.
- *Result:* grounded answers, explanations, and "what-if" reruns **[AI]**.
- *Help:* lets non-finance stakeholders interrogate the model conversationally.
- *Limitation:* LLM hallucination — mitigated by grounding every numeric answer in the deterministic engine, never free-generating figures.

**F5 — Unrealistic-Assumption & Anomaly Detector.**
- *What:* flags inputs outside credible bounds (e.g., PUE < 1.05, utilization > 95%, tariff below any real UAE rate).
- *Data:* user inputs **[U]** vs benchmark ranges **[C]**.
- *Result:* inline warnings with the realistic range **[AI]**.
- *Help:* stops "too-good-to-be-true" inputs from inflating NPV.
- *Limitation:* bounds are heuristics; edge-but-valid cases may trip — warnings are advisory, non-blocking.

**F6 — AI Recommendation Engine.**
- *What:* synthesises all metrics + scenarios + sensitivity into a short accept/reject recommendation with the key risk.
- *Data:* full model output **[C]**.
- *Result:* the Brief §5.6 recommendation paragraph, incl. breakeven insight **[AI]**.
- *Help:* a decision-ready conclusion for the committee.
- *Limitation:* advisory only — the final decision stays with the CFO (see §9 ethics).

---

## 6. Dashboard — Six Visual Components (Brief §5), adapted to this topic

1. **KPI Cards (≥4):** NPV · IRR · MIRR · PI · Payback · **Breakeven GPU rental price** — animated counters (GSAP), colour-coded accept/reject.
2. **Cash-Flow / Trend Chart:** 8-year FCF waterfall + cumulative **discounted** cash-flow curve (shows the Year-4 refresh dip and the discounted-payback crossing).
3. **Scenario Comparison:** optimistic / base / pessimistic — table + grouped bar chart with per-scenario decision badges (see §8).
4. **Sensitivity Analysis:** interactive **tornado chart** + live sliders on ≥2 (really 6) drivers — GPU price, utilization, tariff, PUE, WACC, capex; NPV recomputes in real time.
5. **Risk & Alert Panel:** negative-NPV warning · IRR < WACC · **rental-rate below breakeven** · PUE too high · cost-overrun · unrealistic-assumption flags.
6. **AI Recommendation Panel:** the live AI-generated conclusion (F6).

**Visual identity (per your UI brief):** dark, multi-accent (electric-blue / violet / amber, not mono), glassmorphism cards, Framer Motion + GSAP transitions, and a **WebGL / react-three-fiber 3D scene of glowing GPU racks in a data-center hall with animated energy/heat-flow lines** that react to utilization and PUE sliders — topically literal "objects/animations."

---

## 7. AI Finance Assistant — Design & Sample Q&A (Brief §6)

**Design:** the assistant is a NVIDIA-NIM-backed chatbot **adapted from the provided Gen-AI Chatbot** (its `llm.py` already uses the OpenAI SDK; NIM is OpenAI-API-compatible → repoint `base_url`/`api_key`/model). We keep the OpenAI-client pattern, the chat API contract, and the React chat UI components; we **strip** the TechNova SQL/RAG/Qdrant/Redis stack. Every numeric answer is **grounded in the deterministic finance engine** (the LLM explains and narrates; it never invents numbers). You will paste your own NIM key into a config/env placeholder.

**Sample Q&A (≥5):**
1. *"What is the project's NPV and should we accept it?"* → "Base-case NPV is +AED 1,854M with IRR 16.5% (> 9% WACC) and PI 1.31 → accept, but the margin is thin."
2. *"What GPU rental rate makes this break even?"* → "≈ $3.34/GPU-hr at base utilization — the current market ($2.85–3.50) sits right at that line."
3. *"Why did NPV turn negative in the pessimistic scenario?"* → "Rental price falls to $2.5, utilization to 65%, and tariff/PUE rise → EBITDA drops to ~AED 504M, below the level needed to recover AED 5.8B; NPV = −AED 4,138M."
4. *"Which assumption matters most?"* → "GPU rental price: a −20% move flips NPV negative; utilization is second."
5. *"Explain IRR to a non-finance director."* → "It's the annual return the project earns on the money tied up; 16.5% beats our 9% cost of capital, so it adds value."
6. *"What if electricity tariff doubles?"* → "Even at +AED 0.10/kWh, NPV only falls ~AED 190M — UAE's cheap power is a genuine moat, not the main risk."

---

## 8. Scenario & Sensitivity Structure (Brief §5.3, §5.4, §7)

### 8.1 Scenarios (verified)
| Scenario | Key assumptions | NPV | IRR | PI | Decision |
|---|---|---|---|---|---|
| **Optimistic** | $6/GPU-hr, 90% util, tariff 0.13, PUE 1.15, WACC 8% | **+AED 10,216M** | 44.5% | 2.73 | Accept |
| **Base** | $4/GPU-hr, 80% util, tariff 0.15, PUE 1.20, WACC 9% | **+AED 1,854M** | 16.5% | 1.31 | Accept (conditional) |
| **Pessimistic** | $2.5/GPU-hr, 65% util, tariff 0.20, PUE 1.30, WACC 11% | **−AED 4,138M** | −9.5% | 0.30 | Reject |

### 8.2 Sensitivity variables & findings (one-way on base NPV)
| Variable | Move | Resulting NPV |
|---|---|---|
| GPU rental price | −20% / +20% | **−AED 398M (flips negative!) / +AED 4,094M** |
| Utilization | −10pp / +10pp | +AED 452M / +AED 3,254M |
| WACC | +2pp | +AED 1,276M |
| Electricity tariff | +AED 0.10 | +AED 1,663M (small — the moat) |

**Narrative (Brief §7 requirements):** the variable with the greatest impact is **GPU rental price**; the decision **flips to reject** below ~$3.34/GPU-hr or if utilization falls under ~70% while prices soften; the main financial risk is a **structural GPU-rental-rate decline**; the best management response is to **de-risk revenue with multi-year contracted offtake before committing capex**, staging the GPU fit-out.

---

## 9. Ethical Use of AI (Brief §8) — specific to this topic

- **Forecast accuracy & over-reliance:** AI GPU-price/utilization forecasts are extrapolations of a volatile, immature market; presented with confidence bands and never as certainty.
- **Hallucination:** the assistant is grounded in the deterministic engine; numeric claims come from computed state, not free generation.
- **Data-source risk:** market figures are cited with sources and dates; assumptions are transparent and user-overridable.
- **Bias:** a bull-market training bias could inflate revenue forecasts — surfaced explicitly and stress-tested via the pessimistic scenario and Monte Carlo.
- **Confidentiality:** capex/pricing assumptions are commercially sensitive; the app keeps model state client-side where possible; no data is sent to third parties beyond the user's own NIM endpoint.
- **Human accountability:** the dashboard recommends; **the final invest/reject decision remains the CFO's/manager's responsibility, not the AI's.**

---

## 10. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | **React + TypeScript + Vite** |
| 3D / WebGL | **Three.js + react-three-fiber + drei** (GPU-rack data-center scene) |
| Animation | **Framer Motion + GSAP** |
| Charts | **Recharts** (+ D3/visx for the tornado chart) |
| Styling | **TailwindCSS** + custom glassmorphism; dark multi-accent theme |
| State | **Zustand** |
| Finance engine | **TypeScript module** (pure, deterministic, **unit-tested** — NPV/IRR/MIRR/PI/payback/sensitivity/Monte Carlo); mirrors the verified Python reference model |
| AI Assistant | **NVIDIA NIM** (OpenAI-compatible) via a thin **FastAPI** backend adapted from the provided chatbot; NIM key in env placeholder |
| Deploy | **Vercel/Netlify** (frontend); small service/serverless for the assistant |
| Report | **LaTeX** (article, 12pt, A4) compiled on Overleaf |
| Slides | **NotebookLM** from the final report |

---

## 11. GitHub Repository Structure

```
teraval/
├─ README.md
├─ progress.md                  # living status ledger (updated every push)
├─ handoff.md                   # collaborator + master-laptop continuation prompts
├─ implementation-plan.md       # this file
├─ Problem-Solving-Skill.md     # methodology (governs all work)
├─ Group Project-CF.md          # the brief
├─ docs/
│  ├─ finance-model-reference.py # verified Python model (source of truth for numbers)
│  └─ figures/                   # dashboard screenshots for the report (names match \includegraphics)
├─ report/
│  └─ main.tex                   # LaTeX report + assets
├─ web/                          # React dashboard
│  ├─ src/
│  │  ├─ finance/                # engine (npv.ts, irr.ts, scenarios.ts, sensitivity.ts, montecarlo.ts) + tests
│  │  ├─ components/             # KPI cards, charts, panels, 3D scene, chatbot UI
│  │  ├─ store/                  # Zustand state
│  │  └─ ai/                     # NIM client + prompt templates
│  ├─ package.json
│  └─ vite.config.ts
└─ assistant/                    # FastAPI + NIM (adapted from Gen-AI Chatbot)
   ├─ app/ (llm.py, config.py, api/chat.py)
   ├─ .env.example               # NIM_API_KEY placeholder
   └─ requirements.txt
```

---

## 12. Mapping to report sections & the five project questions

- **Report §1–10** all map directly (Executive summary→§1; Financial problem→§1.2; Concepts→§2; Data→§3; Calculations→§4; AI features→§5; Dashboard→§6; Scenario/sensitivity→§8; Ethics→§9; Recommendation→§9+final).
- **Q1** decision & importance → §1. **Q2** concepts/formulas/data → §2–3. **Q3** scenarios → §8. **Q4** how AI improves analysis → §5,7. **Q5** recommendation + risks → §8.2, §9.

---

## 13. Proposed build sequence (Phase 4+, each stage stops for review)

1. Repo scaffold + verified TypeScript finance engine (with tests) + `progress.md`.
2. Dashboard shell: dark theme, layout, KPI cards, cash-flow chart.
3. Scenario comparison + interactive sensitivity (tornado + sliders) + risk panel.
4. WebGL 3D data-center scene + GSAP/Framer polish.
5. AI features (forecaster, scenario generator, Monte Carlo) + AI recommendation panel.
6. AI Finance Assistant (NIM) integration.
7. LaTeX report + figure capture; `handoff.md`; NotebookLM prompt.

---

**✅ Plan approved (2026-07-30).** Names locked: product **Teraval**, operator **Barq AI**. Base assumptions (8-year horizon, 9% WACC, 40 MW, GB200) locked for v1 of the engine and adjustable live via dashboard sliders. Phase 4 development underway — see `progress.md`.
