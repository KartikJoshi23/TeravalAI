# Progress — Teraval

> Living status ledger. **Update this on every push.** Anyone resuming the project
> (any laptop, any team member) reads this first, then continues from "NEXT TASK"
> with zero ambiguity. Methodology: `Problem-Solving-Skill.md`. Plan: `implementation-plan.md`.

_Last updated: 2026-08-04 (night) — MASTER (Kartik, Opus 4.8): **genuine AI/ML layer COMPLETE (Stages A–C) + UX overhaul.** Two real trained models grounded in the engine (surrogate risk classifier: logistic regression, **96.7% held-out acc, AUC 0.998**; AR(1) GPU-price forecaster: **test RMSE $0.06**) shown on a **Predictive-AI** section. Consolidated **9 tabs → 5** and gave the Overview a **Decision Brief**. Both reports updated: `main.tex` (8pp, 1,627 words) reflects the ML; `internal-team-report.tex` **fully rewritten — detailed, 14pp/4,239 words**, covers brief §1–11 + the 5 questions with formulas. **45/45 tests · tsc clean · build OK · 0 overfull.** Repo: https://github.com/KartikJoshi23/TeravalAI_

> Visual polish 2026-08-01: rack bodies sharper metallic (roughness 0.24, envMap 1.9) + a silver top-edge rim + brighter/sharper Environment light-formers → silver-shine edges from all sides. BackgroundFX now clearly live — drifting/breathing colour fields + 20 rising light motes (reduced-motion still disables).
>
> **HANDOFF 2026-08-01: real-data sourcing is now assigned to a COLLABORATOR** — see NEXT TASK + `datasets/README.md`. Collaborator downloads official tariff/interest-rate/energy datasets into `datasets/` and pushes; master laptop then applies them + does the LaTeX report.

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

- **Stage 6 — CODE COMPLETE (frontend + backend); plumbing VERIFIED on master.**
  - Frontend (collaborator): `components/ai/FinanceAssistant.tsx` (streaming chat,
    sample chips, "NIM connected / grounded offline" badge, graceful fallback),
    `lib/assistantApi.ts` (SSE client), `lib/assistantContext.ts` (grounds every
    answer in live engine state), `lib/assistantFallback.ts` (offline answerer).
  - Backend (collaborator): `assistant/` FastAPI + NVIDIA NIM (OpenAI-compatible),
    TechNova SQL/RAG/Qdrant/Redis stripped. `app/config.py`, `app/llm.py` (client →
    NIM base_url), `app/prompts.py` (grounded "narrate, never invent" system prompt),
    `app/main.py` (`/health` → nim_configured), `app/api/chat.py` (SSE token/final/error).
  - Master-laptop verification: `.venv` created, `pip install -r requirements.txt` OK,
    `from app.main import app` imports, `/health` → `{nim_configured:false}`, and
    `POST /api/chat/message` streams a clean SSE `error` event without a key (→ frontend
    falls back offline). **Live LLM path VERIFIED (2026-08-01)** — key added; `/health`
    `nim_configured:true`; a real `/api/chat/message` call streams a grounded answer from
    NIM (model `meta/llama-3.1-70b-instruct`).
  - `assistant/.env` holds the key locally (git-ignored); `.env.example` present.

- **Stage 6.5 — DONE: UX overhaul + deep audit + realism/perf upgrades.**
  - Tabbed layout (`TabNav`): 5 tabs (Overview · Cash Flow · Scenarios · Sensitivity & Risk
    · AI Analysis), animated sliding indicator, cross-fade; shared store keeps tabs in sync.
  - **Floating AI assistant** (`components/ai/AssistantWidget.tsx`) on every tab — creative
    pulsing launcher (bottom-right), NIM/offline status dot, **This tab / Whole model** scope
    toggle (tab-aware via `lib/tabContext.ts`), tab-specific sample chips, and a **Clear**
    button. Replaces the old Assistant tab; `FinanceAssistant.tsx` removed.
    `lib/assistantContext.ts` gained an optional `focus`; `lib/assistantFallback.ts` answers
    "explain this view" from the tab focus.
  - **Animated background** (`components/BackgroundFX.tsx`) — subtle drifting multi-accent
    blobs, reduced-motion aware; `index.css` base wash de-blued.
  - **3D hall rebuilt** into a real, stunning data centre: open/wall-less, ~112 racks in
    cold/hot aisles, **mirror-polished floor** (MeshReflectorMaterial), glowing aisle
    floor-strips + emissive rack tops + detailed server-front texture, **Bloom**
    (`@react-three/postprocessing`), and a reflective **Environment** of inline light-formers
    so the **metallic slate-grey rack bodies catch a greyish-silver edge highlight from all
    sides** (fixes "dark from the back"). Click-to-inspect + human figures retained.
  - **Perf:** three.js scene code-split into `components/three/HallCanvas.tsx` via
    `React.lazy`/Suspense — loads as a separate on-demand chunk, out of the main bundle.
  - **Polish:** `useCountUp` tweens from the previous value (not 0) on live changes.
  - Vite fix: `resolve.dedupe` + `optimizeDeps.include` prevent a duplicate react-three-fiber
    instance that had crashed Bloom.
  - **Deep audit (2026-08-01):** read every component/lib/store/finance file — clean, no
    bugs; all 6 dashboard components + 6 AI features + grounded assistant + 20 tests present.
  - **Verified:** `npx tsc -b` clean · `npm test` **20/20** · `npm run build` OK (three.js now
    a separate `HallCanvas-*.js` chunk) · in-browser: no console errors, lazy chunk loads 200,
    hall mounts, NIM live.

- **Stage 6.6 — DONE: finance-depth additions** (ideas adapted from teammate Aditya's
  "Project Atlas" Streamlit app — different scenario/stack, so ideas not code):
  - **Build vs Rent + Equivalent Annual Cost** (`finance/alternatives.ts`, `AlternativesPanel`,
    new "Build vs Rent" tab): appraise BUILD & own the hall vs RENT hyperscaler GPU capacity.
    Different lives → compared on EAC; incremental NPV is the relevant-cash-flow test. Build is
    fixed cost, rent scales with utilization → **build wins only above ~78% utilization**; base
    incremental NPV **+AED 211M** (thin), flips to rent at low util. Ties to our dominant driver.
  - **Decision thresholds** (`finance/thresholds.ts`, `DecisionThresholds` on Sensitivity tab):
    breakeven price, breakeven utilization, capex-overrun tolerance, hurdle ceiling (=IRR),
    P(loss), build-beats-rent crossover — the margin of safety quantified live.
  - **Ethics & Audit tab** (`EthicsPanel` + `AssumptionsAudit`): brief §8 ethics each paired
    with Teraval's mitigation (fills a required gap — was only a footer line); plus an
    assumptions table tagged H/C/F/U/AI (§3) and a live model self-test.
  - **Model self-test** (`finance/selfTest.ts`, `SelfTestBadge` in header): runs finance
    identities live (NPV(IRR)=0; PI>1⇔NPV>0; WACC<MIRR<IRR; incremental NPV ⇔ EAC advantage) —
    turns red if an edit breaks the model's logic.
  - Tabs now 7 (added Build vs Rent, Ethics & Audit); assistant tab-context updated for both.
  - **Verified:** `tsc -b` clean · `npm test` **26/26** (added `alternatives.test.ts`) ·
    `npm run build` OK · in-browser: no console errors, header self-test badge runs the new
    engine live (checks pass), all 7 tabs present. (New tab *contents* render in a visible
    browser; headless pane stalls tab-switch animations as before.)

## ✅ Data applied — MASTER (2026-08-02, Kartik)

- Added a **Data Provenance** panel to the Ethics & Audit tab (`components/DataProvenance.tsx`)
  citing the official **CBUAE base rate 3.65%** + **3-mo EIBOR 3.94%** (with evidence-file paths)
  and the pending Abu Dhabi tariff. Audit-table basis text updated to cite the official rates.
- **WACC decision:** anchored the CAPM build-up to the official rates (risk-free ≈ 3.65–3.94%
  + β1.3×ERP6% + debt spread ⇒ ~8.6%); **conservatively retained the 9% hurdle** (a tougher
  test), so NO model numbers change — engine + Python reference + 26 tests untouched.
- **Tariff:** kept 0.15 AED/kWh (official ADWEA industrial figure still pending the portal).
- Verified: `tsc -b` 0 · tests **26/26** · build OK · in-browser no console errors, 7 tabs,
  canvas + 20 background motes + NIM live.

## ✅ Real-data sourcing — COLLABORATOR (2026-08-02, Prem): 2 of 3 key figures

Official data downloaded into `datasets/`; **no code touched**. Full detail + citations
in `datasets/DATA-PROVENANCE.md`.

- ✅ **CBUAE Base Rate = 3.65%** — CBUAE Press Release "CBUAE Maintains The Base Rate At
  3.65%", 29 Jul 2026 → `datasets/interest-rates/cbuae-base-rate-2026.png` (screenshot; the
  portal's Download button was broken).
- ✅ **3-month EIBOR = 3.94%** — CBUAE EIBOR table, 31 Jul 2026 →
  `datasets/interest-rates/cbuae-eibor-2026.pdf`.
- ⚠️ **Abu Dhabi industrial tariff — PENDING (portal outage):** ADDC/TAQA has no public
  non-residential tariff page; the Abu Dhabi Open Data **ADWEA tariff dataset** serves via
  `data.bayanat.ae`, which was **down** (ERR_CONNECTION_TIMED_OUT) on 2026-08-02 — no
  CSV/preview/export. Retry when up, or source from **DoE Abu Dhabi**. Model still assumes
  **0.15 AED/kWh (= 15 fils/kWh)**.
- ℹ️ Optional saved: `datasets/electricity-tariff/kapsarc-gcc-tariffs.csv` — KAPSARC GCC
  **residential** comparison (no AD industrial rate). `datasets/energy-context/` empty (same
  Bayanat outage; non-blocking, "report realism" only).

## ✅ Stage 7 — LaTeX report DONE (2026-08-02, master)

- `report/main.tex` — complete Overleaf-ready source: class `article` 12pt A4, ToC, **single-line
  black border on every page** (eso-pic + tikz), title page (Corporate Finance · Dr. Nathaniel
  Christopher · the five team members · project title · "Submitted for the partial fulfilment…"),
  **all 10 report sections**, answering the **5 project questions**, citing the official CBUAE
  rates. **Verified locally with MiKTeX:** latexmk exit 0, **8 pages, 0 overfull**, prose body
  **1,492 words** (within 1,300–1,650); title page + tables + border checked visually.
- `report/notebooklm-prompt.md` — the prompt to generate the 10–12 slide / 7–10 min deck.
- LaTeX build artifacts git-ignored; only `report/main.tex` (+ the prompt) tracked.

## ✅ DEEP AUDIT + improvement pass — DONE (2026-08-03, collaborator laptop, Fable 5)

Audited the ENTIRE project (engine vs Python reference formula-by-formula; every displayed
number vs the canon; brief compliance item-by-item; all frontend/backend code; report, datasets,
docs, repo hygiene/secrets) with a 12-agent parallel audit + adversarial verification of every
finding, plus first-hand E2E runs (headless compositing Chrome over CDP: all 7 tabs, slider
decision-flip, assistant open/chip/typed-question/scope/Clear, console/network watch; backend
`/health` + SSE error contract exercised with curl; Python reference executed; `main.tex`
compiled with MiKTeX).

**Confirmed CLEAN:** TS engine ≡ Python reference on every shared formula and every canonical
number (NPV +1,854 · IRR 16.5% · MIRR 12.6% · PI 1.31 · payback 5.0/6.3 · breakeven $3.34 ·
scenarios +10,216/+1,854/−4,138 · MC ~21%/+1,456); brief fully covered (6 components, 6 AI
features, 6 sample Q&A, ≥3 calcs, scenarios+sensitivity narrative, all 7 ethics points, report
10 sections + 5 questions, prose ~1,470–1,500 words in band); no secrets tracked; SSE contract
backend↔frontend exact; WebGL fallback + lazy three.js chunk intact; zero console errors.

**REAL BUG FOUND & FIXED — Build-vs-Rent scope mismatch (`finance/alternatives.ts`):** the
incremental NPV never charged the rolled rent route its 3-yearly integration capex while the
rent EAC did, so the two instruments disagreed in sign over a slider-reachable band
(util ~77.4–78.3%) — the panel could show "Building creates value" beside a NEGATIVE incremental
NPV and self-test check 4 failed 3/4 there. Fixed by rolling the rental at its equivalent annual
cost (integration annuitized per cycle), which makes incrNPV = a(r,8y) × ΔEAC an exact identity.
**⚠️ CANON CHANGE (Kartik please review): base incremental NPV +AED 211M → +AED 320M; crossover
~78% → ~77%.** EACs/unit costs unchanged. Updated together: engine, alternatives.test.ts (new
pins + a whole-range sign-identity test), report/main.tex, tabContext, notebooklm-prompt.
(Build-vs-Rent exists only in TS — the Python reference never modelled it, so no sync needed.)

**Other genuine fixes (all CONFIRMED findings, all verified E2E):**
- **P(loss) consistency:** panels used different MC seeds/counts (thresholds tile showed 23% @
  2,000 runs beside 21% elsewhere; recommendation bullet said "5,000 runs" while computing
  2,000). All surfaces now share seed 42 / 5,000 runs (`MC_SEED`/`MC_RUNS` in lib/simulate.ts)
  → 21% everywhere, labels derived from the constant; assistant computes its MC per message
  (removes a wasted 2,000-run sim on every slider tick on every tab).
- **Engine hardening (both engines, kept equal):** `irr([])`/all-zero flows and `mirr()` with no
  positive flows now return NaN (were −95%/−100%) in core.ts AND finance-model-reference.py.
- **Tests:** canonical MC numbers now pinned (P(loss)≈0.209, mean≈1,456); scenario-generator
  upside clamped to never worsen a driver at slider edges (+ test). Suite is now **29 tests**.
- **Offline assistant:** generic tab-blurb branch no longer shadows specific answers ("What does
  break-even mean here?" now gets the break-even answer); added grounded branches for
  build-vs-rent (new `buildVsRent` context: incr NPV + crossover), Monte-Carlo, Year-4 refresh,
  forecast band, risk alerts, self-test, ethics — every sample chip now gets a real answer.
- **A11y:** `<MotionConfig reducedMotion="user">` (framer animations now honour the OS setting,
  incl. the infinite launcher halo; badge pulse gets motion-reduce), full ARIA tabs pattern
  (ids/aria-controls/role=tabpanel + arrow-key/Home/End roving focus), assistant a11y
  (role=log aria-live, input label, aria-pressed scope, Escape closes, autofocus), sr-only text
  alternatives for the cash-flow + tornado charts.
- **Small fixes:** 3D heat-plume colour now blends smoothly across PUE (was snapping blue→amber
  at 1.225); payback KPI card tone/caption can no longer contradict each other; WebGL probe
  cached + released (no context leak); SSE client joins multi-line data per spec + cancels the
  reader on error; NIM client gets a 60 s timeout (offline fallback in ~1 min, not 10); stale
  "Stage 5/6 will add F5/F4" comments corrected; dead assets removed (hero.png, react.svg,
  vite.svg, icons.svg); redundant direct `postprocessing` dep removed; `.claude/` git-ignored.
- **Docs:** plan terminal value corrected (was the depreciated share ≈1,168; actual residual
  ≈ **AED 1,041M** — NPV math always used the correct one); plan §8.2 column renamed "Resulting
  NPV" (values are levels, not deltas); report §8 "under about 70%" → **67%** (engine breakeven
  utilization 66.8%, matches the dashboard tile); report figures now compile without the pending
  screenshots (`\dashfig` placeholder → identical on Overleaf with PNGs); README/handoff test
  counts + stale "(later stage)" labels refreshed.

**Verified end-to-end:** `npm test` **29/29** · `npx tsc -b` clean · `npm run build` OK (lazy
HallCanvas chunk intact) · Python reference reprints every canonical number unchanged ·
`pdflatex` × 2 exit 0, **8 pages**, prose ~1,472 words · headless-Chrome E2E: 7 tabs render the
new numbers, GPU-price $2.50 flips ACCEPT→REJECT with 3 alerts and Reset restores, thresholds
tile = recommendation bullet = MC panel = **21% @ 5,000 runs**, assistant offline fallback
answers every probed chip correctly, self-test 4/4 throughout, **zero console errors**.
(Screenshot-grade visual pass still needs a visible browser — pane was hidden; DOM/console/
network verified instead, as in earlier stages. Live NIM path not re-testable keyless on this
laptop; unchanged since verified 2026-08-01, and the no-key SSE error path was re-verified.)

**Flagged for Kartik (no action taken):**
- Brief §10.A says "Individual Report" — main.tex is one team-authored document listing all five
  members. If the instructor grades per-student reports, each member needs their own version.
- Word count: ~1,472 prose words (in band); ~1,850 if tables/captions count — confirm the
  marker's convention.
- ADWEA industrial tariff: portal retried 2026-08-03 — `data.bayanat.ae` still down
  (ECONNRESET) and DoE has no public tariff page; 0.15 AED/kWh benchmark retained. (Unofficial
  aggregators quote 27–36.6 fils TOU for large industrial — official confirmation still needed
  before touching the model.)
- `Gen-AI Chatbot/` starter is tracked under a triple-nested path with ~1.2 MB of its old
  query_results — harmless provenance; flatten/prune only if you want.

## ✅ Living-background upgrade — COLLABORATOR (2026-08-03 evening, Fable 5, user-requested)

Requested directly by the team on this laptop: the dashboard background read as "plain" —
make it clearly alive everywhere WITHOUT touching the 3D data-center hall. One reviewable
change, engine untouched (no numbers changed):

- **`components/BackgroundFX.tsx` rebuilt** as a three-layer living backdrop:
  1. the existing drifting/breathing colour fields (CSS, kept);
  2. a new ultra-faint **aurora sweep** — a huge conic-gradient sheet revolving once per
     ~90 s (CSS-only, GPU-composited);
  3. a new canvas **"data field"** replacing the 20 DOM motes: ~45–90 density-scaled
     drifting, twinkling multi-accent particles (blue/violet/teal, rare amber) joined by
     faint constellation lines, with occasional rising **data-streak** pulses and a soft
     **pointer-parallax** (depth-weighted, eased) so the field responds as you move.
- Engineering: zero new dependencies; one rAF loop, delta-timed (frame-rate independent),
  paused while the tab is hidden (visibilitychange) and fully cleaned up on unmount;
  DPR-aware (capped ×2); wrap-around margins so lines never pop at viewport edges;
  particle field (re)seeds when real dimensions first arrive (a hidden/prerendered page
  can mount at 0×0 — found first-hand via the preview pane).
- **Real a11y bug found & fixed while verifying:** `.bg-blob` carried NO base opacity —
  under `prefers-reduced-motion` (`animation: none`) the keyframe opacities vanished and
  the blobs rendered **fully opaque**, swamping the whole dashboard (screenshot-confirmed).
  `.bg-blob` now has base `opacity: 0.14` (keyframes override it while animating);
  reduced-motion canvas path draws one calm static field, and redraws it after resizes.
- Removed now-dead mote CSS (`.bg-mote`, `mote-rise`, `.anim-mote`); `index.css` comments
  updated. 3D hall (`components/three/`) untouched, per the request.
- **Verified end-to-end:** `npx tsc -b` clean · `npm test` **29/29** · `npm run build` OK
  (lazy HallCanvas chunk intact) · dev server: **zero console errors** · headless-Chrome
  screenshots at t=4 s/9 s/12 s all differ (field drifts/twinkles; streaks appear) with
  content fully legible · `--force-prefers-reduced-motion` screenshot: calm static field,
  final KPI values render instantly. (Pane still hidden on this laptop → pixel proof via
  headless compositing Chrome, as in prior stages.)

## ✅ Audit REVIEWED & ACCEPTED — MASTER (2026-08-03 night, Kartik, Opus 4.8)

Master-laptop review of the collaborator's two commits (`e721e05` audit pass + `2017d5a`
living background), methodology Phase 5 (verify, don't trust). Re-ran everything from a clean
pull:
- **29/29 tests · `npx tsc -b` clean · `npm run build` OK** (lazy `HallCanvas` chunk intact).
- **Python reference reprints every canonical number unchanged** (NPV +1,854 · IRR 16.5% ·
  MIRR 12.6% · PI 1.31 · PB 5.0/6.3 · breakeven $3.34 · scenarios +10,216/+1,854/−4,138); the
  irr/mirr NaN guards are mirrored identically in `core.ts` and the Python reference.
- **Build-vs-Rent canon change VERIFIED in the live engine** (via vite-node, not just tests):
  incremental NPV **+AED 320.5M**, crossover **77.4%**, `consistencyOk: true`, build EAC 1820.8
  < rent EAC 1878.7. Confirmed the fix makes `incrNpv = a(9%,8) × ΔEAC` an **exact identity**
  (5.535 × 57.9 = 320.5); the old +211M genuinely under-charged the rolled rent route (missing
  the per-cycle integration capex the rent EAC already charged). **ACCEPTED.**
- Live DOM on the dev server: all **7 tabs** present, AI panel shows canonical numbers +
  **21% @ 5,000 runs**, **zero console errors**. Report/slides/`tabContext` all consistent at
  **+AED 320M / ~77%** — no stale +211M/78% anywhere.
- (Pane hidden on this laptop → rAF paused, so count-ups freeze at 0 and tab transitions stall;
  verified via live DOM + the actual engine + console/network, as in prior stages. A pixel
  screenshot pass still needs a visible browser — see NEXT TASK.)

## ✅ Deployment prep — MASTER (2026-08-03 night, Kartik, Opus 4.8)

Made the project hostable: **frontend → Vercel**, **backend → Render**, NIM stays external.
The code was already env-driven (frontend reads `VITE_ASSISTANT_URL`; backend CORS reads
`CORS_ORIGINS`), so this was mostly config + one CORS improvement. No finance/engine change.

- **Backend CORS survives Vercel's rotating preview URLs:** added `cors_origin_regex` to
  `assistant/app/config.py` and wired `allow_origin_regex` into `app/main.py`. Render sets it to
  `https://([a-z0-9-]+\.)*vercel\.app`, which matches the stable production URL **and** every
  per-commit preview URL without enumerating them. **Proven via TestClient:** vercel.app +
  preview + localhost origins echoed; `evil.example.com` blocked.
- **`render.yaml`** (repo root) — Render Blueprint: Python, `rootDir: assistant`,
  build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`,
  `healthCheckPath: /health`, `autoDeploy`, `PYTHON_VERSION 3.12.7`, `NIM_MODEL`/`NIM_BASE_URL`,
  and `NVIDIA_NIM_API_KEY` as `sync:false` (paste in dashboard, never committed).
- **`web/vercel.json`** — Vite framework preset + SPA rewrite (`/(.*)`→`/index.html`).
  User sets **Root Directory = `web`** in the Vercel project.
- **`web/.env.example`** (documents `VITE_ASSISTANT_URL`) + **`assistant/.env.example`** updated
  (CORS prod origins + regex). **`DEPLOYMENT.md`** — full step-by-step (backend first, then
  frontend, then verify; free-tier cold-start caveat).
- **Verified:** backend imports clean, `/api/chat/message` + `/health` resolve, CORS matrix as
  above; frontend `npm run build` (Vercel's command) green; `npm test` **29/29**; no secrets
  tracked (`assistant/.env`, `web/.env.local` git-ignored).
- Graceful degradation intact: if Render is asleep/unconfigured, the Vercel dashboard still
  works fully and the assistant uses its grounded offline fallback.

## ✅ UI polish (user feedback) — MASTER (2026-08-03 late night, Kartik, Opus 4.8)

Three visual issues raised on the live dashboard, fixed in one pass (no engine/number change):

- **Transparent AI-assistant panel FIXED (the urgent one):** the floating panel used `.glass`
  (4–6% white + backdrop-blur), so the animated background bled through and looked broken over a
  busy backdrop. Added **`.glass-solid`** (near-opaque `#12131d→#0b0c13` + blur + deeper shadow)
  and switched the panel to it. Verified in-DOM: computed background is a solid gradient, nothing
  shows through.
- **Background too bright → toned down ~½:** `BackgroundFX` particle alpha 0.72→0.38, halo
  0.28→0.16, constellation lines 0.09→0.045 (and de-blued from periwinkle to a dim teal-grey),
  streaks 0.55→0.30, density ~halved (52/26 cap). `index.css` blob opacities and aurora
  roughly halved + blur increased; deeper corner vignette so text never competes with the field.
- **Blue domination → premium black theme:** base is now near-black neutral **#060608** (was navy
  #070810); the electric-blue accent **#38bdf8 → teal #2dd4bf** everywhere (token + all literals +
  the 3D hall's emissives/point-light, light/mid-blue variants → teal too). Palette is now
  **black + teal + violet + gold** (semantic green/rose unchanged). Verified no chart lost
  two-series contrast (bars teal vs line violet, etc.). The `--color-blue` **token keeps its name**
  (so all `text-blue`/`bg-blue`/`border-blue` utilities keep working) but now holds teal — noted
  in the CSS.
- **Verified:** `npx tsc -b` clean · `npm run build` OK · `npm test` **29/29** · dev server zero
  console errors; assistant panel confirmed solid + body `#060608` + `--color-blue`=`#2dd4bf` via
  live DOM. (Pane hidden on this laptop → pixel screenshot not possible; correctness verified via
  DOM/build/console. Kartik/Vercel is the visual check — easy to tune dimmer/brighter if needed.)

## ✅ DEPLOYED LIVE + report note added (2026-08-04, Kartik + Opus 4.8)

- **Live:** frontend https://teraval-ai.vercel.app · backend https://teraval-assistant.onrender.com
  (`/health` → `nim_configured:true`). Verified end-to-end via curl from the Vercel origin: CORS
  allows the origin (health + chat preflight), and a real streaming chat POST returns a grounded
  LLM answer. (Debugging notes: the "offline" symptom was (a) initially the wrong URL pasted —
  needed the `…onrender.com` service URL not the `dashboard.render.com` address bar, then (b)
  browser cache, then (c) **Brave Shields** blocking the cross-origin call — works in Chrome/Edge/
  Firefox; app degrades gracefully to the offline answerer under Brave.)
- **Report note added:** `report/main.tex` Dashboard-Explanation section now has a "Live
  deployment" paragraph linking the Vercel + Render + GitHub URLs (hyperref). Recompiled with
  MiKTeX: **latexmk exit 0, 8 pages, 0 overfull, prose 1,544 words (band 1,300–1,650).**

## 🤖 Genuine AI/ML layer — Stage A DONE (2026-08-04, MASTER Kartik + Opus 4.8)

**Why:** the brief is titled "AI-Enabled" and §2/§3 want AI *forecasting* + real *AI-generated
estimates*, but our "AI features" (F1–F6) were rule-based math + an LLM chatbot. So we're adding a
real ML layer **where finance genuinely uses data** — never on the arithmetic. **Iron rule: the
deterministic engine stays the valuation ground truth; ML augments, never replaces, the NPV.**
User approved the **full ML layer**; building it in stages, stop after each for review.

**Stage A — ML core (pure-TS classical ML, seeded/reproducible, unit-tested). `web/src/lib/ml/`:**
- `rng.ts` (seeded mulberry32 + helpers), `metrics.ts` (train/test split, accuracy, precision/recall/
  F1, **ROC-AUC via Mann–Whitney**, RMSE/MAPE, z-score standardiser), `logreg.ts` (from-scratch
  **logistic regression**, batch GD + L2, real loss curve, **permutation importance**).
- **ML-2 surrogate risk classifier** (`surrogate.ts`): samples 4,000 driver combos → labels each via
  our **own `evaluate()`** (NPV>0?) → trains logreg on [price, util, tariff, pue, wacc, price×util].
  **Held-out: 96.7% test acc · AUC 0.998 · F1 0.968** (3000/1000 split). Learned importance
  **Price×Util > GPU price > Utilization** independently reproduces the analytic tornado (signs
  correct). Exposes live accept-probability + a price×util decision surface. Honest AI: ground truth
  IS the engine.
- **ML-1 GPU-price forecaster** (`forecaster.ts`): **AR(1) via OLS** on a documented, clearly-labelled
  *representative* monthly series (blended H100/A100 rental, 2023→2026 public trend). **Held-out
  one-step test RMSE $0.063 · MAPE 1.7%** (29/10 split), φ=0.955, long-run $2.63. 8-yr horizon mean
  **$2.73 (P10–P90 $2.27–3.19)** — *below* the $3.34 breakeven ⇒ a real AI risk signal reinforcing
  "secure contracted offtake". This is the authentic §3 "forecast/AI-generated" data.
- `ml.test.ts`: **+10 tests** (test-acc≥0.9, AUC≥0.95, not-overfit, importance economics, determinism,
  forecaster stability/held-out error/band widening). **Total 45/45 · tsc clean · build OK.**
- Engine + `docs/finance-model-reference.py` UNTOUCHED; no new deps.

**Stage B — DONE (2026-08-04):** new **"Predictive AI" tab** (`components/ai/PredictiveAI.tsx`, 9th tab)
visualising both models — surrogate (test-acc/AUC/F1 tiles, confusion matrix, permutation
feature-importance bars, a price×util **decision-surface heatmap** with the live case marked, and a
**live accept-probability** that re-reads the store) + forecaster (history+fit+forecast **band chart**
with break-even $3.34 and contracted $4.00 reference lines, φ/long-run/RMSE tiles, spot-vs-contracted
narrative). Models train once (module cache) on first open; only the accept-prob is store-reactive.
Wired into `App.tsx` + `TabNav` + assistant `tabContext`. **Verified live:** tab renders all real
metrics, **zero console errors**; `tsc` clean · `npm test` **45/45** · build OK.

**Stage B addendum — UX (2026-08-04):** consolidated the **9 tabs → 5** (grouped by decision
narrative, nothing removed, labelled section dividers): Overview · Cash Flow & Build-vs-Rent ·
Scenarios & Sensitivity · AI & Forecasting · Board & Ethics. Added a **`DecisionBrief`** atop the
Overview (states the question, ~AED 5.8B stakes, live verdict strip, "how to read this page") so the
recommendation reads as a conclusion; Overview reordered asset→scorecard→synthesis. Assistant
tab-context rekeyed to the 5 tabs. Verified live: 5 tabs, brief renders, zero console errors; 45/45.

**Stage C — DONE (2026-08-04): both reports updated for the ML.**
- `report/main.tex` (graded, in band): §6 AI features reframed around the two trained models (held-out
  acc 96.7%/AUC 0.998; forecaster RMSE $0.06) with the 5-point framing; §4 data table gained authentic
  Historical (GPU-price series) + AI-generated (forecast) rows; §7 = five tabs + Predictive-AI + the
  Overview brief; §9 = ML augments, never computes, a valuation. **MiKTeX: 8 pages, 0 overfull, 1,627
  words (band 1,300–1,650; user OK'd up to 1,700).**
- `report/internal-team-report.tex` **fully rewritten — detailed** (user found the old one too vague).
  Now **14 pages, 4,239 words, 0 overfull**: follows the brief section by section (1–11) + answers all
  five questions; finance concepts WITH formulas; worked base-case calculation; **each AI feature in
  the 5-point what/info/result/helps/limitation structure**; a dedicated "how the ML works (train/test)"
  section that **corrects the old "no ML split" claim**; sample assistant Q&A; ethics; expanded
  glossary. Plain-English voice kept (user liked the language). Added `amsmath` for the formulas.
- **Slides + screenshots (2026-08-04):** `report/notebooklm-prompt.md` updated to 12 slides — added a
  dedicated **machine-learning slide** (surrogate + forecaster + train/test) and updated the data/AI
  and dashboard (5-tab) slides. **The 4 dashboard screenshots are now CAPTURED** into `report/`
  (`teraval-overview/cashflow/buildvsrent/scenarios.png`, git-ignored) via headless system Chrome
  (playwright-core in scratchpad, driving the installed Chrome with SwiftShader — the WebGL hall
  rendered). Overview now shows the Decision Brief; Build-vs-Rent shows +AED 320M. Ready to upload to
  Overleaf with `main.tex`. (Re-run any time: scratchpad `shots/shot.mjs` against `npm run dev`.)

## 🔧 In progress

## 🔧 In progress

- **Two parallel streams:** (1) **Kartik/MASTER** — manual report + slide assembly (below);
  (2) **COLLABORATOR** — Project Atlas features: **P1, P2 & P3 DONE**; **P4 DEFERRED to future work**
  (per spec — heavy docx template/parser, tangential). Then a **deep audit + fixes DONE** (2026-08-04):
  read the whole solution (engine, libs, all components, assistant, 3D); tsc/lint/tests/build all
  clean. Fixed 4 real items — `selfTest.ts` redundant `evaluate()`; `board.ts` null break-even-util
  text; `HallCanvas.tsx` GPU texture+geometry not disposed on tab-unmount (leak); `Header.tsx`
  "Base-case verdict" mislabelled a live badge → "Current verdict". Then wrote an **internal team
  report DONE** — `report/internal-team-report.tex`: plain-English (high-school level), 13 sections,
  covers tech stack, all 8 tabs, the 6 AI features, datasets + the "spread"/train-test-split question
  (honest: deterministic engine, no ML split), probable Q&A, glossary. Compiles with pdflatex
  (8 pages, exit 0). Separate from the academic `report/main.tex`. Engine FROZEN.

## 🧩 NEXT BUILD — COLLABORATOR: 4 features from the Project Atlas re-analysis (2026-08-04)

Re-analysed teammate Aditya's **Project Atlas** live (Meridian Commerce scenario). We already
borrowed its finance ideas earlier (Build-vs-Rent/EAC, decision thresholds, ethics, self-test);
these are the things it has that we don't, plus one polish. **Rules (same as the earlier borrow):
adapt the CONCEPT, not the code; our Barq-AI scenario; ground EVERY number in the deterministic
engine — no invented figures; engine + `docs/finance-model-reference.py` UNTOUCHED.** Build in this
priority order, **one reviewable stage at a time, stop after each for review**, update this file +
keep the 29 tests green (add tests where noted).

**P1 — Departmental Review Board (new "Board Review" tab). ✅ DONE (2026-08-04, collaborator).**
A multi-stakeholder governance view: 4–5 departments each run their own objective over the SAME live
Zustand store state, reach a grounded scored position, and a **weighted board verdict** aggregates
them — all moving live as sliders change. Departments (Barq AI, 40 MW Abu Dhabi GPU hall):
- **Finance/CFO** — risk-adjusted value + capital protection. Reads NPV, IRR vs WACC, PI, P(loss)≈21%,
  discounted payback vs 8 y, capex-overrun tolerance. Non-negotiable: staged capex release (not one
  up-front commit). Flips if NPV<0 (price<$3.34 breakeven, util<~67%, or WACC>IRR 16.5%).
- **Infrastructure/Ops** — uptime, PUE, thermal headroom, no single point of failure. Reads PUE,
  utilization, energy. Non-negotiable: N+1 cooling redundancy. Flips on PUE/uptime risk.
- **Commercial/Revenue** — protect GPU demand & contracted offtake (our dominant driver). Reads
  utilization (80%), breakeven util ~67%, price vs $3.34, build-vs-rent crossover ~77%.
  Non-negotiable: a minimum contracted-utilization floor. Flips if util<~77% (rent wins) or price<breakeven.
- **Sustainability/ESG** — energy intensity, emissions, UAE Net-Zero-2050 alignment. Reads PUE, tariff,
  MW. Non-negotiable: PUE ceiling + disclosure. Flips if PUE above threshold.
- (optional 5th) **Technology/AI** — GPU obsolescence / Year-4 refresh risk.
Each card: a **deterministic score /100** (a documented rule over the live metrics, like the self-test
— NOT arbitrary), a stance (Supports / Supports-with-conditions / Opposes), 2–3 grounded concerns,
conditions it would attach, one non-negotiable, and "what would change its position" (tied to a named
engine threshold). Verdict = weighted score → overall stance; show the most-vs-least-supportive spread;
any unmet non-negotiable ⇒ "approve WITH conditions", not unconditional. Wire: 8th tab in `TabNav`,
reads the store (live), add assistant tab-context so "explain this view" works. Tests: base-case
verdict + that dropping utilization below the ~77% crossover flips Commercial's stance.
  - ✅ **DONE (collaborator, 2026-08-04):** `lib/board.ts` (documented per-department scores /100 +
    weighted verdict, all from the live engine — base: Finance 65 / Ops 77 / Commercial 57 / ESG 60 /
    Tech 64 → **APPROVE WITH CONDITIONS 65/100**, 0 opposes, every non-negotiable surfaced),
    `components/BoardReview.tsx` (verdict banner + 5 dept cards: score bar, stance, grounded concerns,
    conditions, non-negotiable met/required, threshold-tied "what would change its position"), 8th
    **Board Review** tab wired in `App.tsx`, assistant tab-context added in `lib/tabContext.ts`.
    `lib/board.test.ts` (+3 → **32/32**: base verdict/no-opposes, Commercial flips to oppose below the
    ~77% crossover, unmet non-negotiable blocks unconditional approval). Verified: `tsc -b` clean,
    `npm run build` OK, rendered in-browser (headless needs a `waitForSelector` past the tab-switch
    animation), no console errors bar the offline-assistant health probe. Engine + reference untouched.
    **NEXT: P2 — Download decision summary (`window.print()` + `@media print`, no new deps).**

**P2 — "Download decision summary" (PDF via print). ✅ DONE (2026-08-04, collaborator).**
A button (header or Recommendation tab) → a clean ONE-PAGE summary of the CURRENT live case: scenario,
the 6 driver assumptions, the 6 KPIs, scenario verdict, the recommendation paragraph (+ board verdict
if P1 shipped), timestamp → `window.print()`. Use `@media print` CSS to hide the app chrome/3D/nav and
show only the summary; the user picks "Save as PDF". **NO new deps** (no jsPDF/html2canvas — bundle
bloat and they choke on the WebGL canvas/Recharts). Complements the LaTeX report (that's the fixed
academic write-up; this is a live snapshot of whatever's dialled in).
  - ✅ **DONE (collaborator, 2026-08-04):** `components/PrintSummary.tsx` — a print-only one-page
    summary (title, live case flag, 6 driver assumptions, 6 KPIs, scenario verdict + board verdict +
    P(loss), the grounded recommendation paragraph + key risk, timestamp, CFO-responsibility footer;
    reuses `buildRecommendation` + `computeBoard`, all engine-grounded). Header **"↓ Download summary"**
    button → `window.print()`. `@media print` in `index.css` hides the whole app (`#root > *:not(
    .print-summary)`) and reveals only the summary. **No new deps.** Verified: `tsc -b` clean, 32/32
    tests, build OK; in print media the app is fully hidden and a clean **one-page A4 PDF** renders
    with the correct figures. **NEXT: P3 — stage-gate recommendation nuance.**

**P3 — Stage-gate recommendation nuance. ✅ DONE (2026-08-04, collaborator).**
Enrich `RecommendationPanel`: when ACCEPT-but-thin (P(loss) meaningful / breakeven close), frame it as
"conditional accept — stage-gate the capex, release in tranches gated on measured utilization; keep the
rent/RaaS fallback." Grounded in our thresholds; ties naturally to the Board's conditions. One short
paragraph + a little logic.
  - ✅ **DONE (collaborator, 2026-08-04):** `lib/recommendation.ts` gained an optional `stageGate`
    field — on a thin ACCEPT (P(loss) ≥ 15% or break-even within 25% of the price) it composes a
    grounded stage-gate paragraph tied to the **break-even utilization (~67%)** and **build-vs-rent
    crossover (~77%)** thresholds + the Year-4 refresh. Shown as an amber "Stage-gate plan" callout in
    `RecommendationPanel` and carried into the P2 `PrintSummary`. `lib/recommendation.test.ts` (+3 →
    **35/35**: present on thin base accept, absent on reject and on a safe optimistic accept). Verified:
    `tsc -b` clean, build OK, renders live + in the one-page PDF. Engine + reference untouched.
    **NEXT: P4 — Custom Case (OPTIONAL; spec recommends deferring).**

**P4 — Custom Case (bring-your-own-numbers). OPTIONAL stretch — recommend deferring.**
Atlas lets you download a `.docx` template, fill figures, upload, and re-run everything client-side.
Heavy (template + docx parser) and tangential to a single-investment appraisal. If attempted: keep it
100% client-side and guard with the self-test (reject numbers that break the model identities, restore
the reference case), as Atlas does.

Integrity note: as with the earlier borrow — **ideas adapted, not code**; different scenario (Barq AI
vs Meridian Commerce); our stack; grounded in our engine. If P1/P4 ship, add a line to the report/ethics.

## ▶️ NEXT TASK — MASTER (Kartik): assemble the report + slide package

0. ✅ **Deployed live** (Vercel + Render) — verified end-to-end.
1. ✅ **Report live-deployment note added** to `report/main.tex` (8 pages, in band).
2. ✅ **Audit reviewed & accepted** (see section above) — Build-vs-Rent +AED 320M / ~77% is in.
3. **Manual report assembly:** capture the 4 screenshots
   (`teraval-overview/cashflow/scenarios/buildvsrent.png` — Build vs Rent now shows +AED 320M),
   compile `report/main.tex` + PNGs on Overleaf (it also compiles WITHOUT the PNGs now, showing
   labelled placeholders), and generate slides via NotebookLM (`report/notebooklm-prompt.md`).
4. Decide the two flagged questions above (individual-report convention; word-count convention).
5. Non-blocking: pull the ADWEA industrial tariff when the Abu Dhabi Open Data portal is back.
Stop after each for review.

## Notes / decisions

- Repo root = this folder; GitHub repo is **`TeravalAI`** (https://github.com/KartikJoshi23/TeravalAI).
  NIM API key goes in `assistant/.env` (git-ignored); Kartik supplies it — never commit it.
- Finance engine and Python reference must stay in sync; tests enforce the numbers.
