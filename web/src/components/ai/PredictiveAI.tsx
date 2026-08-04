/**
 * PredictiveAI — the "Predictive AI" tab. Surfaces the two genuinely-trained
 * models from `lib/ml` (train/test evaluated, engine-grounded):
 *   • ML-2 surrogate risk classifier (logistic regression) — learns the accept /
 *     reject boundary from thousands of engine-labelled scenarios; shows held-out
 *     accuracy / AUC / F1, a confusion matrix, permutation feature-importance, a
 *     learned decision surface, and a LIVE accept-probability for the current case.
 *   • ML-1 GPU-price forecaster (AR(1) via OLS) — a real forecast with a held-out
 *     test error, framed as the SPOT/market rate vs the CONTRACTED base assumption.
 *
 * The models don't touch the NPV — the deterministic engine stays the valuation
 * ground truth. Training is expensive-ish, so it runs once (module cache) the
 * first time this tab opens; only the live accept-probability re-reads the store.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useAssumptions } from '../../store/useEvaluation';
import { fmtPct } from '../../lib/format';
import {
  trainSurrogate,
  forecastGpuPrice,
  predictAcceptProbability,
  featurize,
  type SurrogateModel,
  type ForecastSummary,
} from '../../lib/ml';

const CONTRACTED_USD = 4.0; // the base-case contracted rate Barq assumes
const PRICE_RANGE: [number, number] = [2.0, 6.5];
const UTIL_RANGE: [number, number] = [0.45, 0.97];

// Train once per session (lazy module singletons) — keeps tab-switching instant.
let _surrogate: SurrogateModel | null = null;
let _forecast: ForecastSummary | null = null;
const getSurrogate = () => (_surrogate ??= trainSurrogate());
const getForecast = () => (_forecast ??= forecastGpuPrice(8));

/** Blend rose → amber → emerald by probability, for the decision surface. */
function probColor(p: number): string {
  const lo = [251, 113, 133]; // rose (reject)
  const hi = [52, 211, 153]; // emerald (accept)
  const rgb = lo.map((c, i) => Math.round(c + (hi[i] - c) * p));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.25 + 0.55 * Math.abs(p - 0.5) * 2})`;
}

// Full static class names — Tailwind can't see dynamically-built `text-${tone}`.
const TONE_CLASS: Record<string, string> = {
  txt: 'text-txt',
  positive: 'text-positive',
  negative: 'text-negative',
  blue: 'text-blue',
  amber: 'text-amber',
};

function ImportanceTip({ active, payload }: { active?: boolean; payload?: { payload?: { feature: string; importance: number } }[] }) {
  const r = active ? payload?.[0]?.payload : undefined;
  if (!r) return null;
  return (
    <div className="glass px-3 py-2 text-xs">
      <span className="font-semibold text-txt">{r.feature}</span>{' '}
      <span className="font-mono text-blue">{r.importance} pp</span>
    </div>
  );
}

function ForecastTip({ active, label, payload }: { active?: boolean; label?: number; payload?: { payload?: FRow }[] }) {
  const r = active ? payload?.[0]?.payload : undefined;
  if (!r) return null;
  const year = (2023 + (label ?? r.m) / 12).toFixed(1);
  return (
    <div className="glass px-3 py-2 text-xs">
      <div className="mb-1 font-semibold text-txt">{year}</div>
      {r.hist != null && (
        <div className="text-txt-dim">
          History <span className="font-mono text-violet">${r.hist.toFixed(2)}</span>
        </div>
      )}
      {r.mid != null && (
        <div className="text-txt-dim">
          Forecast <span className="font-mono text-blue">${r.mid.toFixed(2)}</span>
        </div>
      )}
      {r.p10 != null && r.band != null && r.band > 0 && (
        <div className="text-txt-dim">
          Band <span className="font-mono text-txt">${r.p10.toFixed(2)}</span>–
          <span className="font-mono text-txt">${(r.p10 + r.band).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, sub, tone = 'txt' }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-wider text-txt-faint">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold ${TONE_CLASS[tone] ?? 'text-txt'}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-txt-dim">{sub}</div>}
    </div>
  );
}

function SurrogateSection() {
  const a = useAssumptions();
  const s = useMemo(getSurrogate, []);
  const liveProb = predictAcceptProbability(s.model, a);
  const cm = s.metrics.confusion;

  const impData = s.importance.map((im) => ({ feature: im.feature, importance: +(im.importance * 100).toFixed(1) }));
  const maxImp = Math.max(...impData.map((d) => d.importance), 1);

  // Current live case position on the price × utilization surface (util up = top).
  const px = ((a.gpuPriceUsd - PRICE_RANGE[0]) / (PRICE_RANGE[1] - PRICE_RANGE[0])) * 100;
  const py = (1 - (a.utilization - UTIL_RANGE[0]) / (UTIL_RANGE[1] - UTIL_RANGE[0])) * 100;
  const gridN = Math.round(Math.sqrt(s.boundary.length));

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Predictive risk model"
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-txt">Predictive risk model</h2>
        <span className="rounded bg-blue/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue">
          ML · logistic regression
        </span>
      </div>
      <p className="mb-4 text-xs text-txt-dim">
        A classifier trained on <span className="font-mono text-txt">{(s.metrics.nTrain + s.metrics.nTest).toLocaleString('en-US')}</span>{' '}
        driver combinations, each labelled value-creating / value-destroying by the deterministic
        engine. It learns the accept/reject boundary — evaluated on a held-out test set.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Test accuracy" value={fmtPct(s.metrics.testAccuracy, 1)} sub={`train ${fmtPct(s.metrics.trainAccuracy, 1)}`} tone="positive" />
        <Tile label="ROC-AUC" value={s.metrics.auc.toFixed(3)} sub="class separation" tone="blue" />
        <Tile label="F1 score" value={s.metrics.f1.toFixed(3)} sub={`${s.metrics.nTest.toLocaleString('en-US')} test cases`} tone="txt" />
        <Tile
          label="Live accept-prob"
          value={fmtPct(liveProb, 0)}
          sub="for the current sliders"
          tone={liveProb >= 0.5 ? 'positive' : 'negative'}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Feature importance (permutation) */}
        <div>
          <h3 className="mb-1 text-sm font-semibold text-txt">Feature importance (permutation)</h3>
          <p className="mb-2 text-[11px] text-txt-dim">
            Accuracy lost when each input is scrambled — a data-driven sensitivity. It independently
            recovers the tornado: price and utilization dominate.
          </p>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={impData} layout="vertical" margin={{ top: 2, right: 16, bottom: 2, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9aa0b4', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}pp`} />
                <YAxis type="category" dataKey="feature" width={78} tick={{ fill: '#9aa0b4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ImportanceTip />} />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                  {impData.map((d) => (
                    <Cell key={d.feature} fill={probColor(0.5 + 0.5 * (d.importance / maxImp))} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision surface + confusion matrix */}
        <div>
          <h3 className="mb-1 text-sm font-semibold text-txt">Learned decision surface</h3>
          <p className="mb-2 text-[11px] text-txt-dim">
            Model-predicted P(value-creating) over price × utilization (other drivers at base). The
            ring is the current case.
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative">
              <div
                className="grid overflow-hidden rounded-lg border border-glass-border"
                style={{ gridTemplateColumns: `repeat(${gridN}, 7px)`, width: gridN * 7 }}
                aria-hidden
              >
                {s.boundary.map((c, i) => (
                  <div key={i} style={{ width: 7, height: 7, backgroundColor: probColor(c.prob) }} />
                ))}
                <div
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-txt shadow"
                  style={{ left: `${px}%`, top: `${py}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-txt-faint" style={{ width: gridN * 7 }}>
                <span>${PRICE_RANGE[0].toFixed(1)}</span>
                <span>price →</span>
                <span>${PRICE_RANGE[1].toFixed(1)}</span>
              </div>
            </div>
            <div className="text-[11px]">
              <div className="mb-1 font-semibold text-txt">Confusion (test)</div>
              <div className="grid grid-cols-[auto_auto_auto] gap-x-3 gap-y-0.5 font-mono text-txt-dim">
                <span />
                <span className="text-txt-faint">pred +</span>
                <span className="text-txt-faint">pred −</span>
                <span className="text-txt-faint">actual +</span>
                <span className="text-positive">{cm.tp}</span>
                <span className="text-negative">{cm.fn}</span>
                <span className="text-txt-faint">actual −</span>
                <span className="text-negative">{cm.fp}</span>
                <span className="text-positive">{cm.tn}</span>
              </div>
              <div className="mt-2 text-txt-dim">
                precision <span className="font-mono text-txt">{s.metrics.precision.toFixed(3)}</span>
                <br />
                recall <span className="font-mono text-txt">{s.metrics.recall.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

interface FRow {
  m: number; // month index from first observation
  hist?: number;
  mid?: number;
  p10?: number;
  band?: number;
}

function ForecasterSection() {
  const f = useMemo(getForecast, []);
  const histN = f.history.length;
  const data: FRow[] = [
    ...f.history.map((v, i) => ({ m: i, hist: v })),
    // seed the forecast from the last observation so the band connects visually
    { m: histN - 1, hist: f.lastObserved, mid: f.lastObserved, p10: f.lastObserved, band: 0 },
    ...f.path.map((p) => ({ m: histN - 1 + p.step, mid: p.mid, p10: p.p10, band: p.p90 - p.p10 })),
  ];
  const totalM = histN - 1 + f.path.length;
  const belowBreakeven = f.horizonMeanUsd < 3.34;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="GPU-price forecaster"
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-txt">GPU-price forecaster</h2>
        <span className="rounded bg-blue/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue">
          ML · AR(1) time series
        </span>
      </div>
      <p className="mb-4 text-xs text-txt-dim">
        A first-order autoregression fitted by least squares to a representative monthly market series
        (blended H100/A100 rental, 2023→2026), validated on a held-out window.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Test RMSE" value={`$${f.model.testRmse.toFixed(3)}`} sub={`MAPE ${fmtPct(f.model.testMape, 1)}`} tone="positive" />
        <Tile label="φ (reversion)" value={f.model.phi.toFixed(3)} sub="0<φ<1 → mean-reverting" tone="blue" />
        <Tile label="Long-run rate" value={`$${f.model.longRun.toFixed(2)}`} sub="c / (1−φ)" tone="txt" />
        <Tile label="8-yr forecast" value={`$${f.horizonMeanUsd.toFixed(2)}`} sub={`P10–P90 $${f.horizonP10.toFixed(2)}–${f.horizonP90.toFixed(2)}`} tone="amber" />
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 14, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="fcBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis
              dataKey="m"
              type="number"
              domain={[0, totalM]}
              tick={{ fill: '#9aa0b4', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={false}
              ticks={[0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132]}
              tickFormatter={(v: number) => `${(2023 + v / 12).toFixed(0)}`}
            />
            <YAxis
              tick={{ fill: '#9aa0b4', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              domain={[0, 'auto']}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            />
            <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.15)' }} content={<ForecastTip />} />
            {/* stacked band: invisible p10 base + visible thickness */}
            <Area dataKey="p10" stackId="b" stroke="none" fill="transparent" isAnimationActive={false} connectNulls />
            <Area dataKey="band" stackId="b" stroke="none" fill="url(#fcBand)" isAnimationActive={false} connectNulls />
            <Line dataKey="hist" type="monotone" stroke="#a78bfa" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
            <Line dataKey="mid" type="monotone" stroke="#2dd4bf" strokeWidth={2.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} connectNulls />
            <ReferenceLine x={histN - 1} stroke="rgba(255,255,255,0.25)" strokeDasharray="2 3" label={{ value: 'today', fill: '#676c7e', fontSize: 10, position: 'insideTopLeft' }} />
            <ReferenceLine y={3.34} stroke="#fbbf24" strokeDasharray="5 4" label={{ value: 'break-even $3.34', fill: '#fbbf24', fontSize: 10, position: 'insideBottomLeft' }} />
            <ReferenceLine y={CONTRACTED_USD} stroke="#34d399" strokeDasharray="5 4" label={{ value: 'contracted $4.00', fill: '#34d399', fontSize: 10, position: 'insideTopRight' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-txt-dim">
        The forecaster tracks the <span className="text-txt">spot/market</span> rental rate. Its central
        path settles near <span className="font-mono text-amber">${f.model.longRun.toFixed(2)}</span> —{' '}
        {belowBreakeven ? (
          <>
            <span className="text-txt">below</span> the{' '}
            <span className="font-mono text-amber">$3.34</span> break-even and the{' '}
            <span className="font-mono text-positive">$4.00</span> contracted base rate. That gap is
            precisely the <span className="text-txt">contracted premium</span> the appraisal relies on:
            the model quantifies why the recommendation insists on securing multi-year offtake{' '}
            <span className="text-txt">above the declining spot market</span> rather than riding it.
          </>
        ) : (
          <>within reach of the <span className="font-mono text-positive">$4.00</span> contracted base rate — leaving thin but positive headroom.</>
        )}
      </p>
    </motion.section>
  );
}

export default function PredictiveAI() {
  const a = useAssumptions();
  const featCount = featurize(a).length;
  return (
    <div className="flex flex-col gap-6">
      <div className="glass p-5">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-txt">Predictive AI</h2>
          <span className="rounded bg-violet/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet">
            machine learning
          </span>
        </div>
        <p className="text-sm text-txt-dim">
          Two models are <span className="text-txt">trained and tested</span> in your browser on
          reproducible, seeded data — a supervised classifier that learns the investment decision from
          the engine, and a time-series forecaster fit to market history. They <span className="text-txt">augment</span>{' '}
          the analysis; the deterministic engine still computes every valuation. Inputs per case:{' '}
          <span className="font-mono text-txt">{featCount}</span> features.
        </p>
      </div>
      <SurrogateSection />
      <ForecasterSection />
    </div>
  );
}
