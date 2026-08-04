/**
 * ScenarioComparison — the three verified reference cases (optimistic / base /
 * pessimistic) from evaluateScenarios(), plus the user's live "current" case,
 * as a comparison bar chart + a metrics table. "Apply" loads a scenario into
 * the live store so the sliders and every Stage-2 KPI jump to it.
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
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { ScenarioName } from '../finance';
import { evaluateScenarios, scenarioAssumptions } from '../finance';
import { useModelStore } from '../store/useModelStore';
import { useEvaluation } from '../store/useEvaluation';
import type { Decision } from '../lib/decision';
import DecisionPill from './DecisionPill';
import { fmtAedM, fmtPct, fmtRatio } from '../lib/format';

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const DECISION_FILL: Record<Decision, string> = {
  accept: '#34d399',
  marginal: '#fbbf24',
  reject: '#fb7185',
};

const ROWS: { name: ScenarioName; label: string }[] = [
  { name: 'optimistic', label: 'Optimistic' },
  { name: 'base', label: 'Base' },
  { name: 'pessimistic', label: 'Pessimistic' },
];

interface ChartRow {
  name: string;
  npv: number;
  decision: Decision;
  live?: boolean;
}

function ChartTooltip(props: { active?: boolean; payload?: { payload?: ChartRow }[] }) {
  const row = props.active ? props.payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="glass px-3 py-2 text-xs">
      <div className="font-semibold text-txt">{row.name}</div>
      <div className="font-mono text-txt-dim">NPV {fmtAedM(row.npv)}</div>
    </div>
  );
}

export default function ScenarioComparison() {
  const scenarios = useMemo(() => evaluateScenarios(), []);
  const live = useEvaluation();
  const setAssumptions = useModelStore((s) => s.setAssumptions);

  const chartData: ChartRow[] = [
    { name: 'Optimistic', npv: Math.round(scenarios.optimistic.npv), decision: scenarios.optimistic.decision },
    { name: 'Base', npv: Math.round(scenarios.base.npv), decision: scenarios.base.decision },
    { name: 'Current', npv: Math.round(live.npv), decision: live.decision, live: true },
    { name: 'Pessimistic', npv: Math.round(scenarios.pessimistic.npv), decision: scenarios.pessimistic.decision },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Scenario comparison"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-txt">Scenario comparison</h2>
        <p className="text-xs text-txt-dim">Optimistic / base / pessimistic vs your live case · AED millions</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* comparison bar chart */}
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#9aa0b4', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9aa0b4', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={54}
                tickFormatter={(v: number) => nf0.format(v)}
              />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
              <Bar dataKey="npv" radius={[3, 3, 0, 0]} maxBarSize={54}>
                {chartData.map((d) => (
                  <Cell
                    key={d.name}
                    fill={DECISION_FILL[d.decision]}
                    fillOpacity={d.live ? 1 : 0.55}
                    stroke={d.live ? '#e7e9f3' : 'none'}
                    strokeWidth={d.live ? 1.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* metrics table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-txt-faint">
                <th className="pb-2 font-medium">Scenario</th>
                <th className="pb-2 text-right font-medium">NPV</th>
                <th className="pb-2 text-right font-medium">IRR</th>
                <th className="pb-2 text-right font-medium">PI</th>
                <th className="pb-2 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ name, label }) => {
                const e = scenarios[name];
                const a = scenarioAssumptions(name);
                return (
                  <tr key={name} className="border-t border-glass-border">
                    <td className="py-2.5">
                      <div className="font-medium text-txt">{label}</div>
                      <div className="text-[11px] text-txt-faint">
                        ${a.gpuPriceUsd}/hr · {(a.utilization * 100).toFixed(0)}% · WACC {fmtPct(a.wacc, 0)}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono text-txt">{fmtAedM(e.npv)}</td>
                    <td className="py-2.5 text-right font-mono text-txt-dim">{fmtPct(e.irr)}</td>
                    <td className="py-2.5 text-right font-mono text-txt-dim">{fmtRatio(e.pi)}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DecisionPill decision={e.decision} />
                        <button
                          type="button"
                          onClick={() => setAssumptions(scenarioAssumptions(name))}
                          className="rounded-md border border-glass-border px-2 py-1 text-[11px] font-medium text-txt-dim transition-colors hover:border-blue/50 hover:text-txt"
                        >
                          Apply
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}
