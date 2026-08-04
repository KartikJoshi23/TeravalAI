# NotebookLM prompt — Teraval slide deck

Once the report PDF (`report/main.tex` compiled on Overleaf) is final, upload it as the **only
source** in a NotebookLM notebook, then paste the prompt below to generate the slide deck
(7–10 minutes, ~10–12 slides).

---

```
Using the attached report as the ONLY source, produce a slide-by-slide presentation for a
Masters Corporate Finance project defence — 7–10 minutes, 10–12 slides. For EACH slide give:
a short title, 3–5 concise bullet points, and 2–3 sentences of speaker notes. Keep it
decision-focused and quantitative, and do NOT invent any numbers or facts beyond the source.

Follow this slide order (12 slides):
1.  Title — "Teraval: An AI-Enabled Capital-Budgeting Decision Dashboard"; team members;
    the question "Should Barq AI build a 40 MW AI/GPU data-centre in Abu Dhabi?"
2.  The decision & why it matters — ~AED 5.8 bn, near-irreversible; the GPU rental-rate
    collapse ($8 → $2.85–3.50/GPU-hr); UAE AI-hub context.
3.  Corporate-finance concepts & formulas — NPV, IRR, MIRR, PI, payback, relevant cash
    flows, EAC, WACC/CAPM.
4.  Data & assumptions — inputs by type Historical / Current / Forecast / User-entered /
    AI-generated (the forecast spot rate and accept-probability are genuine AI-generated
    estimates); official CBUAE rate anchors.
5.  Base-case results — NPV +AED 1,854 m, IRR 16.5% vs 9% WACC, PI 1.31, payback 5.0 yrs,
    break-even ≈ $3.34/GPU-hr (a knife-edge).
6.  Build vs Rent (Equivalent Annual Cost) — build wins only above ~77% utilization;
    incremental NPV ≈ +AED 320 m at base.
7.  Three scenarios & the decision flip — optimistic +AED 10,216 m / base +AED 1,854 m /
    pessimistic −AED 4,138 m.
8.  Sensitivity & risk — GPU rental price is the dominant driver (tornado); Monte-Carlo
    P(loss) ≈ 21%.
9.  Genuine machine learning — two trained models grounded in the engine: a surrogate risk
    classifier (logistic regression, ~96.7% held-out test accuracy, AUC ~0.998, whose learned
    feature-importance reproduces the tornado) and an AR(1) GPU-price forecaster (held-out
    RMSE ≈ $0.06) that forecasts the spot rate to ≈ $2.73 — below break-even — quantifying why
    contracted offtake is essential. Train/test split; the engine still computes every valuation.
10. AI features & the dashboard — seven AI features (two are the trained ML models above, plus
    Monte-Carlo, the NVIDIA-NIM assistant, scenario generator, anomaly detector, recommendation
    engine) and the six required visual components, organised in five tabs (Overview with a
    Decision Brief, Cash Flow & Build-vs-Rent, Scenarios & Sensitivity, AI & Forecasting, Board
    & Ethics); all grounded in the deterministic engine.
11. Ethics & AI limitations — hallucination, forecast uncertainty (shown as bands), bias,
    representative training data, human review; the CFO decides, not the AI.
12. Final recommendation & risks — accept with conditions (contracted offtake, staged capex,
    cloud fallback); dominant financial and AI-related risks.
```

---

*Tip:* NotebookLM can also generate an **Audio Overview** from the same source for rehearsal;
the slide bullets above map onto the report's ten sections, with slide 9 highlighting the
trained machine-learning models.
