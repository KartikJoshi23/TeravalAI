# Progress — Teraval

> Living status ledger. **Update this on every push.** Anyone resuming the project
> (any laptop, any team member) reads this first, then continues from "NEXT TASK"
> with zero ambiguity. Methodology: `Problem-Solving-Skill.md`. Plan: `implementation-plan.md`.

_Last updated: 2026-08-03 (evening) — collaborator laptop (Fable 5): living-background upgrade (user-requested) — canvas "data field" (particles + constellation lines + data streaks + pointer parallax) + aurora sweep, and a real reduced-motion a11y bug fixed (blobs rendered fully opaque when `animation: none`). 29/29 tests · tsc clean · build OK. Repo: https://github.com/KartikJoshi23/TeravalAI_

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

## 🔧 In progress

- Nothing mid-flight. Awaiting Kartik's review of the audit pass (especially the
  **+AED 320M / ~77% Build-vs-Rent canon change**) — and now also of the
  living-background upgrade above.

## ▶️ NEXT TASK — MASTER (Kartik): review the audit, then assemble the report package

1. **Review this audit commit** (methodology Phase 5 — verify, don't trust): `git pull`,
   `cd web && npm install && npm test` (expect **29/29**), `npx tsc -b`, `npm run dev`, click all
   7 tabs in a visible browser. Decide whether you ACCEPT the Build-vs-Rent correction
   (+AED 320M / ~77% — the old +211M/78% under-charged the rent route; the panel, report, slides
   prompt and tests are already consistent with the new numbers). If you disagree, revert the
   single audit commit and say so here.
2. **Manual report assembly (unchanged):** capture the 4 screenshots
   (`teraval-overview/cashflow/scenarios/buildvsrent.png` — Build vs Rent now shows +AED 320M),
   compile `report/main.tex` + PNGs on Overleaf (it also compiles WITHOUT the PNGs now, showing
   labelled placeholders), and generate slides via NotebookLM (`report/notebooklm-prompt.md`).
3. Decide the two flagged questions above (individual-report convention; word-count convention).
4. Non-blocking: pull the ADWEA industrial tariff when the Abu Dhabi Open Data portal is back.
Stop after each for review.

## Notes / decisions

- Repo root = this folder; GitHub repo is **`TeravalAI`** (https://github.com/KartikJoshi23/TeravalAI).
  NIM API key goes in `assistant/.env` (git-ignored); Kartik supplies it — never commit it.
- Finance engine and Python reference must stay in sync; tests enforce the numbers.
