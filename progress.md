# Progress — Teraval

> Living status ledger. **Update this on every push.** Anyone resuming the project
> (any laptop, any team member) reads this first, then continues from "NEXT TASK"
> with zero ambiguity. Methodology: `Problem-Solving-Skill.md`. Plan: `implementation-plan.md`.

_Last updated: 2026-08-02 — master laptop (Kartik): Stage 7 LaTeX report done + NotebookLM prompt; NEXT TASK set to a DEEP AUDIT + genuine-improvement pass for a collaborator laptop (Fable 5). Repo: https://github.com/KartikJoshi23/TeravalAI_

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

## 🔧 In progress

- Nothing mid-flight. App feature-complete; real-data provenance applied.

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

## 🔧 In progress

- Next assigned task is a **deep audit + genuine-improvement pass on a collaborator laptop
  (Kartik, using the Fable 5 model)** — see NEXT TASK. Nothing mid-flight in code.

## ▶️ NEXT TASK — DEEP AUDIT of the whole project + genuine improvements (COLLABORATOR, Fable 5)

Run on a collaborator laptop with the **Fable 5** model. First paste **handoff.md → Prompt 1**
(it locks the methodology, topic and plan). Then do the following as ONE reviewable task, applying
the 6-phase methodology (understand → investigate → design → implement → verify → report), and
push when done. **Verify first-hand — do not assume.**

**Step 1 — Deep audit of the ENTIRE project:**
- **Finance engine** (`web/src/finance/`): re-read core/model/alternatives/thresholds/selfTest;
  confirm the TS engine and `docs/finance-model-reference.py` still agree and all **26 Vitest
  tests pass** (`cd web && npm install && npm test`). Hunt for edge cases, sign/`off-by-one` errors.
- **Numbers consistency:** the SAME figures must match across engine, dashboard, data-provenance
  panel and `report/main.tex` — NPV +AED 1,854M, IRR 16.5%, MIRR 12.6%, PI 1.31, payback 5.0y,
  breakeven ~$3.34, scenarios (opt +10,216 / base +1,854 / pess −4,138), Build-vs-Rent
  +AED 211M / ~78% crossover, Monte-Carlo P(loss) ~21%.
- **Brief compliance** (`Group Project-CF.md`): six dashboard components, ≥5 AI features,
  ≥3 major calculations, scenario + sensitivity, ethics, the AI assistant, and the report specs
  (1,300–1,650 words, ToC, single-line page border, title page, 10 sections, 5 project questions).
- **Code health:** dead/unused code; `npx tsc -b` clean; no browser console errors; a11y labels;
  reduced-motion; graceful WebGL fallback; three.js lazy chunk; **no secrets committed** (`.env`
  git-ignored). Run the app in a **visible** browser and click every tab + the assistant.
- **Backend** (`assistant/`): grounded narrate-only NIM prompt; `/health` + SSE contract intact.
- **Report / datasets / docs:** `report/main.tex` compiles (MiKTeX/Overleaf);
  `datasets/DATA-PROVENANCE.md` matches the applied figures; progress/handoff/README accurate.
Write the findings honestly (what is clean; any bug or gap found).

**Step 2 — Consider GENUINE additions only** (be willing to conclude "nothing more is needed"):
- Genuine: a real bug fix; a missing brief requirement; a finance-correctness / consistency fix;
  a materially better UX or accessibility improvement; capturing the still-missing Abu Dhabi
  industrial tariff if the portal is back.
- NOT genuine (do NOT add): padding, gimmicks, gold-plating, restyling for its own sake, new
  dependencies without clear payoff, or anything that drifts from the approved topic/plan.
- If unsure whether an addition is worth it, **ask Kartik before building it**.

**Step 3 — If (and only if) a genuine improvement is found:** implement it via the methodology;
if the engine changes, update BOTH the TS engine and `docs/finance-model-reference.py` and keep
all tests green; verify end-to-end (tsc, tests, build, run the app); update THIS progress.md (what
was audited, and what was added and why — or that nothing was needed); commit and push. If nothing
genuine is found, still record the audit verdict here and push that.

**Hard rules:** don't drift from the topic/plan; keep engine ↔ Python reference in sync; never
commit secrets or `node_modules`; update progress.md every push; then STOP and report for review.

### Also still pending (manual, Kartik — separate from the audit)
- Capture 4 screenshots (`teraval-overview/cashflow/scenarios/buildvsrent.png`), compile
  `report/main.tex` + PNGs on Overleaf, and generate slides via NotebookLM
  (`report/notebooklm-prompt.md`).
- Non-blocking: pull the ADWEA industrial tariff when the Abu Dhabi Open Data portal is back.
Stop after each for review.

## Notes / decisions

- Repo root = this folder; GitHub repo is **`TeravalAI`** (https://github.com/KartikJoshi23/TeravalAI).
  NIM API key goes in `assistant/.env` (git-ignored); Kartik supplies it — never commit it.
- Finance engine and Python reference must stay in sync; tests enforce the numbers.
