# Progress — Teraval

> Living status ledger. **Update this on every push.** Anyone resuming the project
> (any laptop, any team member) reads this first, then continues from "NEXT TASK"
> with zero ambiguity. Methodology: `Problem-Solving-Skill.md`. Plan: `implementation-plan.md`.

_Last updated: 2026-07-30 — Kartik's laptop (master). Repo: https://github.com/KartikJoshi23/TeravalAI_

> **Resuming on another laptop?** Read `handoff.md` and paste Prompt 1 (collaborator)
> or Prompt 2 (master). Then continue from "NEXT TASK" below.

---

## Project state

- **Topic:** Brief Topic 9 — AI Capital-Budgeting (subsumes Topic 10). **APPROVED.**
- **Product:** Teraval · **Operator appraised:** Barq AI · **Scenario:** 40 MW AI/GPU
  data-center hall, Abu Dhabi. **Names locked.**
- **Phase:** 4 (development), building in reviewable stages, stop after each for review.

## ✅ Completed

- Phase 1–3: brief + methodology understood; topic researched & approved;
  `implementation-plan.md` written and approved (with verified numbers).
- Verified financial model (base NPV +AED 1,854m, IRR 16.5%, scenario flip,
  breakeven $3.34/GPU-hr) — `docs/finance-model-reference.py`.
- **Stage 1 — DONE:** repo scaffold + deterministic TypeScript finance engine.
  - `web/` = Vite + React 19 + TS scaffold; deps + Vitest installed.
  - `web/src/finance/core.ts` — NPV, IRR, MIRR, PI, payback, discounted payback.
  - `web/src/finance/model.ts` — Barq AI model, 3 scenarios, breakeven,
    one-way sensitivity, seedable Monte-Carlo NPV.
  - `web/src/finance/finance.test.ts` — **13 tests, all passing**, pinned to the
    Python reference numbers. Run with `cd web && npm test`.
  - `README.md`, root `.gitignore` added.
- **Repo + handoff ready:** GitHub repo `TeravalAI` created; `handoff.md` written
  (collaborator + master continuation prompts). First commit staged (secrets/.env and
  node_modules excluded and verified).

## 🔧 In progress

- Handing off to a collaborator's laptop to run Stage 2. Nothing mid-flight in code;
  Stage 1 is complete and green.

## ▶️ NEXT TASK — Stage 2: Dashboard shell + first two visual components

Build the dark-theme dashboard skeleton and wire it to the finance engine:
1. In `web/`: add Tailwind, Zustand, Framer Motion, GSAP, Recharts.
2. App layout + dark multi-accent glassmorphism theme (not mono-color).
3. **KPI cards** (≥4): NPV, IRR, MIRR, PI, Payback, Break-even — animated counters,
   accept/reject colour coding, fed by `evaluate(BASE_ASSUMPTIONS)`.
4. **Cash-flow / trend chart:** 8-year FCF waterfall + cumulative discounted
   cash-flow curve, from `buildModel(...).fcf`.
5. Zustand store holding the live `Assumptions` so later slider stages recompute.
Stop after Stage 2 for review. (Stages 3–7 per `implementation-plan.md` §13.)

## Notes / decisions

- Repo root = this folder; GitHub repo to be named **`teraval`**. NIM API key goes
  in `assistant/.env` (git-ignored); user supplies it — never commit it.
- Finance engine and Python reference must stay in sync; tests enforce the numbers.
