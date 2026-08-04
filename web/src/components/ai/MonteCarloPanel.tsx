/**
 * MonteCarloPanel (feature F3) — runs the engine's seedable Monte-Carlo over
 * driver distributions built around the live assumptions and shows the NPV
 * distribution, P(NPV<0) and the P10/P90 band. "Re-run" bumps the seed for a
 * fresh (still reproducible) draw. The narrative is grounded in the results.
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useAssumptions } from '../../store/useEvaluation';
import { runSimulation, histogram, MC_SEED, MC_RUNS } from '../../lib/simulate';
import { fmtAedM, fmtPct } from '../../lib/format';

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

interface Bin {
  x: number;
  count: number;
  negative: boolean;
}

function HistTooltip(props: { active?: boolean; payload?: { payload?: Bin }[] }) {
  const b = props.active ? props.payload?.[0]?.payload : undefined;
  if (!b) return null;
  return (
    <div className="glass px-3 py-2 text-xs">
      <div className="font-mono text-txt">NPV ≈ {fmtAedM(b.x)}</div>
      <div className="text-txt-dim">{b.count} runs</div>
    </div>
  );
}

export default function MonteCarloPanel() {
  const a = useAssumptions();
  const [run, setRun] = useState(0);
  const seed = MC_SEED + run;
  const result = useMemo(() => runSimulation(a, seed), [a, seed]);
  const bins = useMemo(() => histogram(result.samples), [result]);
  const zeroX = useMemo(
    () => bins.reduce((best, b) => (Math.abs(b.x) < Math.abs(best.x) ? b : best), bins[0]).x,
    [bins],
  );

  const stats = [
    {
      label: 'P(NPV < 0)',
      value: fmtPct(result.probNegative, 0),
      tone:
        result.probNegative > 0.3
          ? 'text-negative'
          : result.probNegative > 0.1
            ? 'text-amber'
            : 'text-positive',
    },
    { label: 'Mean NPV', value: fmtAedM(result.mean), tone: result.mean > 0 ? 'text-positive' : 'text-negative' },
    { label: 'P10 (downside)', value: fmtAedM(result.p10), tone: result.p10 > 0 ? 'text-positive' : 'text-negative' },
    { label: 'P90 (upside)', value: fmtAedM(result.p90), tone: 'text-txt' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Monte-Carlo risk simulator"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-txt">Monte-Carlo risk simulator</h2>
            <span className="rounded bg-violet/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet">
              AI · F3
            </span>
          </div>
          <p className="text-xs text-txt-dim">
            {MC_RUNS.toLocaleString('en-US')} NPV draws · run #{run + 1}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="shrink-0 rounded-md border border-glass-border px-2.5 py-1 text-[11px] font-medium text-txt-dim transition-colors hover:border-violet/50 hover:text-txt"
        >
          Re-run
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-glass-border bg-white/5 p-3">
            <div className="text-[11px] uppercase tracking-wider text-txt-faint">{s.label}</div>
            <div className={`mt-1 font-mono text-lg font-semibold ${s.tone}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 6, right: 10, bottom: 4, left: 4 }} barCategoryGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis
              dataKey="x"
              tick={{ fill: '#9aa0b4', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
              tickFormatter={(v: number) => nf0.format(v)}
            />
            <YAxis
              tick={{ fill: '#9aa0b4', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={34}
            />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<HistTooltip />} />
            <ReferenceLine
              x={zeroX}
              stroke="#fbbf24"
              strokeDasharray="4 3"
              label={{ value: 'NPV = 0', fill: '#fbbf24', fontSize: 11, position: 'insideTopRight' }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {bins.map((b) => (
                <Cell key={b.x} fill={b.negative ? '#fb7185' : '#2dd4bf'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </motion.section>
  );
}
