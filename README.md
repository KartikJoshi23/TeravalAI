# Teraval — AI Capital-Budgeting Decision Intelligence

An AI-enabled corporate-finance decision dashboard that appraises a real-world
capital-budgeting decision: **should Barq AI — a UAE AI-cloud operator — commit
~AED 5.8 billion to build a ~40 MW AI/GPU data-center hall in Abu Dhabi?**

Masters in AI with Business — Corporate Finance group project.
**Team:** Kartik Joshi, Prem Kukreja, Gagandeep Singh, Samuel Alex, Aditya Chitale ·
**Instructor:** Dr. Nathaniel Christopher.

> **Teraval** = *tera* (teraflops / 10¹² — the language of AI compute) + *val* (value):
> valuing AI infrastructure at compute scale.
> **Barq AI** = *barq* (برق, "lightning") — the power and speed of a GPU data center.

## What it does

- Computes the full capital-budgeting metric set — **NPV, IRR, MIRR, Profitability
  Index, payback and discounted payback** — from a verified cash-flow model.
- Runs **optimistic / base / pessimistic** scenarios and live **sensitivity**
  analysis, exposing a genuine decision flip (accept → reject).
- Layers **AI features** (rate forecasting, scenario generation, Monte-Carlo risk,
  anomaly detection, a recommendation engine) and an **AI Finance Assistant**
  (NVIDIA NIM) over the model.

## Headline result (base case, verified)

| NPV | IRR | MIRR | PI | Payback | Break-even GPU rental |
|---|---|---|---|---|---|
| **+AED 1,854m** | 16.5% | 12.6% | 1.31 | 5.0 yrs | **~$3.34/GPU-hr** |

Decision flips to **reject** in the pessimistic case (NPV −AED 4,138m). GPU rental
price is the dominant risk; Abu Dhabi's cheap power is the moat.

## Repository layout

```
teraval/
├─ implementation-plan.md   # the approved plan (design source of truth)
├─ progress.md              # living status ledger — read this first when resuming
├─ Problem-Solving-Skill.md # the methodology governing all work
├─ Group Project-CF.md      # the assignment brief
├─ docs/finance-model-reference.py  # verified Python model (numbers source of truth)
├─ web/                     # React + TypeScript + Vite dashboard
│  └─ src/finance/          # deterministic finance engine + tests  ✅ built
├─ report/                  # LaTeX report (later stage)
└─ assistant/               # NVIDIA NIM AI Finance Assistant (later stage)
```

## Develop

```bash
cd web
npm install
npm test        # run the finance-engine test suite (13 tests)
npm run dev     # start the dashboard (from Stage 2 onward)
```

The finance engine (`web/src/finance/`) is pure, deterministic TypeScript,
unit-tested against `docs/finance-model-reference.py`. Keep the two in sync — if a
number changes in one, it must change in the other and the tests updated.
