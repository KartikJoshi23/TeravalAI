# Progress — Teraval

> Living status ledger. **Update this on every push.** Anyone resuming the project
> (any laptop, any team member) reads this first, then continues from "NEXT TASK"
> with zero ambiguity. Methodology: `Problem-Solving-Skill.md`. Plan: `implementation-plan.md`.

_Last updated: 2026-07-31 — collaborator laptop. Repo: https://github.com/KartikJoshi23/TeravalAI_

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
- **Stage 2 — DONE:** dark-theme dashboard shell + first two visual components,
  wired live to the finance engine.
  - Deps added: `tailwindcss` v4 (+ `@tailwindcss/vite`), `zustand`, `framer-motion`,
    `gsap`, `recharts`. Tailwind v4 CSS-first tokens in `web/src/index.css`
    (dark, multi-accent blue/violet/amber, glassmorphism `.glass` utility).
  - `web/src/store/` — Zustand `useModelStore` holds the live `Assumptions`
    (seeded from `BASE_ASSUMPTIONS`) with `setDriver`/`setAssumptions`/`reset`;
    `useEvaluation`/`useModel`/`useBreakeven` memoised selectors feed the UI.
  - `web/src/components/` — `Header` + live `DecisionBadge` (base = **ACCEPT**),
    `KpiGrid`/`KpiCard` (6 KPIs: NPV, IRR, MIRR, PI, Payback, Break-even; GSAP
    count-ups, accept/reject colour coding, Framer-Motion entrance/hover),
    `CashFlowChart` (Recharts `ComposedChart`: per-year FCF bars sign-coloured —
    Y0 & Y4 refresh dip negative/red — + cumulative discounted-CF line).
  - `web/src/hooks/useCountUp.ts` (GSAP, honours `prefers-reduced-motion`),
    `web/src/lib/format.ts` (AED/%/ratio/years/USD formatters).
  - **Verified end-to-end:** `npx tsc -b` clean · `npm test` **13/13** · `npm run build`
    OK · ran in-browser, no console errors, all 6 KPIs render the verified numbers
    (NPV +AED 1,854M, IRR 16.5%, MIRR 12.6%, PI 1.31, payback 5.0y, breakeven $3.34)
    and the chart draws 9 FCF bars + the cumulative line.
    (Note: the dev browser pane was hidden so `requestAnimationFrame`/count-up was
    paused — verified final values via live-DOM inspection instead of a screenshot.)

## 🔧 In progress

- Nothing mid-flight in code. Stage 2 is complete and green; ready for Stage 3.

## ▶️ NEXT TASK — Stage 3: Scenario comparison + interactive sensitivity + risk panel

Add the next three visual components (plan §6.3–6.5, §13 stage 3), all reading the
Zustand store so they stay in sync:
1. **Scenario comparison** — optimistic / base / pessimistic: table + grouped bar
   chart with per-scenario decision badges, from `evaluateScenarios()`.
2. **Interactive sensitivity** — a **tornado chart** + live sliders on the 6 drivers
   (GPU price, utilization, tariff, PUE, WACC, capex) via `setDriver`; NPV and every
   KPI/chart recompute in real time (uses `oneWaySensitivity`).
3. **Risk & alert panel** — negative-NPV, IRR < WACC, rental-rate-below-breakeven,
   PUE-too-high, cost-overrun, unrealistic-assumption flags.
Stop after Stage 3 for review. (Stages 4–7 per `implementation-plan.md` §13.)

## Notes / decisions

- Repo root = this folder; GitHub repo to be named **`teraval`**. NIM API key goes
  in `assistant/.env` (git-ignored); user supplies it — never commit it.
- Finance engine and Python reference must stay in sync; tests enforce the numbers.
