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

- **Stage 4 — DONE:** WebGL 3D data-center hall (plan §6 visual identity) as the
  dashboard hero, reacting live to the store.
  - Deps: `three` 0.185, `@react-three/fiber` 9, `@react-three/drei` 10 (+`@types/three`).
  - `components/three/DataCenterScene.tsx` — react-three-fiber `<Canvas>`: a grid of
    40 glowing GB200 racks whose emissive **activity scales with live `utilization`**,
    a rising **heat-particle plume whose colour/opacity track live `pue`** (cool cyan
    ~1.05 → blue → amber → red ~1.4), a floor `Grid`, accent point-lights, fog, and
    auto-rotating `OrbitControls` (drag to orbit). Overlay caption + live Util/PUE
    readouts. Placed after the KPI row in `App.tsx`.
  - Robust: `hasWebGL()` guard + `components/ErrorBoundary.tsx` fall back to a static
    notice if WebGL is unavailable; `prefers-reduced-motion` disables the animation.
  - **Verified end-to-end (headless Chromium + SwiftShader):** `npx tsc -b` clean ·
    `npm test` **15/15** · `npm run build` OK · no console errors; hall renders, and
    driving utilization→55% / PUE→1.50 live dimmed the racks and turned the plume
    from cool-blue to warm-red (readouts updated to 55% / 1.50). Engine + Python
    reference untouched.
  - Follow-up (non-blocking): three.js pushes the JS bundle to ~485 kB gzip — worth
    lazy-loading the `<Canvas>` (React.lazy) in a later polish pass.

- **Stage 5 — DONE:** AI features (F1–F3, F6) as an "AI analysis" section, all
  grounded in the deterministic engine.
  - `lib/simulate.ts` (F3 ranges + `runSimulation` wrapping the engine's seedable
    `monteCarloNpv` + `histogram`), `lib/forecast.ts` (F1 mean-reverting rate path
    with P10–P90 bands), `lib/scenarioGen.ts` (F2 upside/base/downside from the live
    anchor), `lib/recommendation.ts` (F6 grounded accept/reject synthesis + dominant
    driver + MC loss probability). `lib/ai.test.ts` adds 5 tests.
  - `components/ai/`: `MonteCarloPanel` (NPV histogram, P(NPV<0)/mean/P10/P90 tiles,
    Re-run reseeds), `RateForecastPanel` (band area + mid line vs break-even line),
    `ScenarioGenerator` (Apply generated sets), `RecommendationPanel` (verdict badge,
    Brief §5.6 paragraph, key-risk box, metric bullets, "decision rests with the CFO").
  - **Verified end-to-end (headless Chromium):** `npx tsc -b` clean · `npm test`
    **20/20** (13 finance + 2 risk + 5 AI) · `npm run build` OK · no console errors;
    panels render the grounded numbers (base P(NPV<0) ≈ 21%, mean +AED 1,456M) and
    are live — dropping GPU price to $2.50 flipped the recommendation ACCEPT→REJECT
    and pushed P(NPV<0) 21%→99%. Engine + Python reference untouched.
  - Note: MC narrative is rule-based for now; the LLM narrative (F4) arrives with the
    NIM assistant in Stage 6.

## 🔧 In progress

- Nothing mid-flight in code. Stage 5 is complete and green; ready for Stage 6.

## ▶️ NEXT TASK — Stage 6: AI Finance Assistant (NVIDIA NIM) integration

Per plan §7 + §13 stage 6. Adapt the provided **Gen-AI Chatbot** into an `assistant/`
FastAPI service that talks to **NVIDIA NIM** (OpenAI-compatible), and a chat UI:
1. `assistant/` — keep the OpenAI-client pattern + chat API contract; **strip** the
   TechNova SQL/RAG/Qdrant/Redis stack; repoint `base_url`/`api_key`/model to NIM.
2. **NIM key lives only in `assistant/.env` (git-ignored) — supplied by Kartik; never
   commit it.** Add `assistant/.env.example` with a `NVIDIA_NIM_API_KEY` placeholder.
3. Chat UI in `web/`: every numeric answer **grounded in the live engine state**
   (pass current metrics/assumptions as context); the LLM explains/narrates only.
4. Wire the ≥5 sample Q&A (plan §7) and F3's LLM risk narrative.
⚠️ Needs the NIM key to test end-to-end — coordinate with Kartik before/while building.
Stop after Stage 6 for review. (Stage 7 = LaTeX report + figures + NotebookLM.)

## Notes / decisions

- Repo root = this folder; GitHub repo to be named **`teraval`**. NIM API key goes
  in `assistant/.env` (git-ignored); user supplies it — never commit it.
- Finance engine and Python reference must stay in sync; tests enforce the numbers.
