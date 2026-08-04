/**
 * AlternativesPanel — the Build-vs-Rent decision with Equivalent Annual Cost.
 * Barq needs the compute either way, so the relevant question is whether to BUILD
 * and own the hall or RENT equivalent capacity from a hyperscaler. Different lives
 * → compared on EAC; the incremental NPV is the relevant-cash-flow test. All live.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAssumptions } from '../store/useEvaluation';
import { evaluateAlternatives, buildRentCrossoverUtil } from '../finance';
import { fmtAedM, fmtUsdHr } from '../lib/format';

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

interface EacRow {
  name: string;
  eac: number;
  key: 'build' | 'rent';
}

function EacTooltip(props: { active?: boolean; payload?: { payload?: EacRow }[] }) {
  const row = props.active ? props.payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="glass px-3 py-2 text-xs">
      <div className="font-semibold text-txt">{row.name}</div>
      <div className="font-mono text-txt-dim">EAC {fmtAedM(row.eac)}/yr</div>
    </div>
  );
}

export default function AlternativesPanel() {
  const a = useAssumptions();
  const alt = useMemo(() => evaluateAlternatives(a), [a]);
  const crossover = useMemo(() => buildRentCrossoverUtil(a), [a]);
  const buildWins = alt.cheapest === 'build';

  const eacData: EacRow[] = [
    { name: 'Build & own', eac: Math.round(alt.build.eacAed), key: 'build' },
    { name: 'Rent (cloud)', eac: Math.round(alt.rent.eacAed), key: 'rent' },
  ];

  const routes = [alt.build, alt.rent];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Build vs rent analysis"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-txt">Build vs Rent — Equivalent Annual Cost</h2>
          <span className="rounded bg-amber/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber">
            Relevant cash flows
          </span>
        </div>
        <p className="mt-1 text-xs text-txt-dim">
          Build &amp; own vs rent hyperscaler capacity, compared on EAC (different lives:{' '}
          {alt.build.lifeYears}y vs {alt.rent.lifeYears}y).
        </p>
      </div>

      {/* verdict headline */}
      <div className={`mb-5 rounded-xl border p-4 ${buildWins ? 'border-positive/30 bg-positive/5' : 'border-amber/30 bg-amber/5'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold text-txt">
            {buildWins ? 'Building creates value over renting' : 'Renting is cheaper at these assumptions'}
          </div>
          <div className={`font-mono text-lg font-semibold ${buildWins ? 'text-positive' : 'text-amber'}`}>
            {fmtAedM(alt.incrementalNpvAed)}
            <span className="ml-1 text-xs font-normal text-txt-dim">incremental NPV (build − rent)</span>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-txt-dim">
          Building wins only {crossover == null ? 'across the modelled range' : (
            <>
              above <span className="font-mono text-txt">{(crossover * 100).toFixed(0)}%</span> utilization
              (you are at <span className="font-mono text-txt">{(a.utilization * 100).toFixed(0)}%</span>)
            </>
          )}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* EAC comparison chart */}
        <div>
          <div className="mb-1 text-xs text-txt-dim">Equivalent annual cost (AED m/yr) — lower is better</div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eacData} margin={{ top: 8, right: 10, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9aa0b4', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.12)' }} tickLine={false} />
                <YAxis tick={{ fill: '#9aa0b4', fontSize: 12 }} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => nf0.format(v)} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<EacTooltip />} />
                <Bar dataKey="eac" radius={[3, 3, 0, 0]} maxBarSize={80}>
                  {eacData.map((d) => (
                    <Cell
                      key={d.key}
                      fill={d.key === alt.cheapest ? '#34d399' : '#8493b6'}
                      fillOpacity={d.key === alt.cheapest ? 0.9 : 0.55}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* route detail cards */}
        <div className="flex flex-col gap-3">
          {routes.map((rt) => (
            <div
              key={rt.key}
              className={`rounded-lg border p-3 ${rt.key === alt.cheapest ? 'border-positive/30 bg-positive/5' : 'border-glass-border bg-white/5'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-txt">{rt.name}</span>
                {rt.key === alt.cheapest && (
                  <span className="rounded-full bg-positive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-positive">
                    Lowest EAC
                  </span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-txt-faint">EAC</div>
                  <div className="font-mono text-txt">{fmtAedM(rt.eacAed)}/yr</div>
                </div>
                <div>
                  <div className="text-txt-faint">Unit cost</div>
                  <div className="font-mono text-txt">{fmtUsdHr(rt.costPerGpuHrUsd)}/hr</div>
                </div>
                <div>
                  <div className="text-txt-faint">Capex · life</div>
                  <div className="font-mono text-txt">{fmtAedM(rt.capexAed)} · {rt.lifeYears}y</div>
                </div>
              </div>
            </div>
          ))}
          <p className="text-[11px] leading-snug text-txt-faint">
            EAC converts each route's whole-life cost into the level annual charge with the same
            present value — the only fair way to compare options of different lives.
            {alt.consistencyOk && (
              <> Consistency check ✓: the incremental NPV and the EAC advantage agree in sign.</>
            )}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
