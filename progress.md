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
- **Stage 3 — DONE:** scenario comparison + interactive sensitivity + risk panel
  (plan §6.3–6.5), all reading the Zustand store so the Stage-2 KPIs and cash-flow
  chart recompute live.
  - `components/ScenarioComparison.tsx` — `evaluateScenarios()` table (optimistic
    +AED 10,216M/44.5%/2.73, base +1,854M/16.5%/1.31, pessimistic −4,138M/−9.5%/0.30)
    + comparison bar chart (Opt/Base/**Current live**/Pess, coloured by decision) +
    per-row `DecisionPill` and **Apply** buttons that load a scenario into the store.
  - `components/SensitivityPanel.tsx` — 6 live `DriverSlider`s (GPU price, util,
    WACC, tariff, PUE, rack capex) writing via `setDriver`, a **Reset to base**
    button, and `TornadoChart.tsx` (`oneWaySensitivity`, floating ΔNPV bars ranked
    by impact — verified order: GPU price #1, utilization #2, per plan §8.2).
  - `components/RiskPanel.tsx` + `lib/risk.ts` — rule-based alerts (negative NPV,
    IRR<WACC, rate-below-break-even, PUE high, capex overrun, unrealistic util/PUE/
    tariff); base = "no blocking risks", flips to 3 dangers when price < break-even.
  - `lib/decision.ts` (shared badge styles) + `DecisionPill.tsx`; `lib/drivers.ts`.
  - **Verified end-to-end:** `npx tsc -b` clean · `npm test` **15/15** (13 finance +
    2 new `risk.test.ts`) · `npm run build` OK · ran in-browser, no console errors;
    scenario/tornado/risk all render the verified numbers, and driving the GPU-price
    slider to $2.50 live-flipped the verdict ACCEPT→REJECT and raised the 3 expected
    risk alerts (engine + Python reference untouched — numbers unchanged).

## 🔧 In progress

- Nothing mid-flight in code. Stage 3 is complete and green; ready for Stage 4.

## ▶️ NEXT TASK — Stage 4: WebGL 3D data-center scene + GSAP/Framer polish

Per plan §6 (visual identity) + §13 stage 4:
1. **Three.js / react-three-fiber** 3D scene of glowing GB200 GPU racks in the
   data-center hall, with animated energy/heat-flow lines.
2. The scene **reacts to the live store** — utilization drives rack glow/activity,
   PUE drives heat/cooling intensity (reads the same Zustand assumptions).
3. GSAP/Framer-Motion polish pass across the dashboard (transitions, reveals).
Keep it performant (drei, instancing) and behind the existing dark theme.
Stop after Stage 4 for review. (Stages 5–7 per `implementation-plan.md` §13.)

## Notes / decisions

- Repo root = this folder; GitHub repo to be named **`teraval`**. NIM API key goes
  in `assistant/.env` (git-ignored); user supplies it — never commit it.
- Finance engine and Python reference must stay in sync; tests enforce the numbers.
