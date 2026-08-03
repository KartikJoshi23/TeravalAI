/**
 * CashFlowChart — the Stage-2 trend view. Bars = each year's free cash flow
 * (the big Year-0 outlay, the Year-4 GPU-refresh dip, the operating inflows);
 * line = cumulative *discounted* cash flow, whose zero-crossing is the
 * discounted-payback point. Data comes straight from buildModel().fcf.
 */
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useModel, useAssumptions } from '../store/useEvaluation';
import { fmtAedM } from '../lib/format';

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

interface Row {
  year: string;
  fcf: number;
  cumulative: number;
}

interface TooltipRow {
  dataKey?: string | number;
  value?: number;
}

function CustomTooltip(props: { active?: boolean; label?: string; payload?: TooltipRow[] }) {
  const { active, label, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const fcf = payload.find((p) => p.dataKey === 'fcf')?.value;
  const cum = payload.find((p) => p.dataKey === 'cumulative')?.value;
  return (
    <div className="glass px-3 py-2 text-xs">
      <div className="mb-1 font-semibold text-txt">{label}</div>
      {fcf != null && (
        <div className="text-txt-dim">
          Free cash flow: <span className="font-mono text-txt">{fmtAedM(fcf)}</span>
        </div>
      )}
      {cum != null && (
        <div className="text-txt-dim">
          Cumulative discounted: <span className="font-mono text-violet">{fmtAedM(cum)}</span>
        </div>
      )}
    </div>
  );
}

export default function CashFlowChart() {
  const model = useModel();
  const { wacc } = useAssumptions();

  let cum = 0;
  const data: Row[] = model.fcf.map((cf, y) => {
    cum += cf / Math.pow(1 + wacc, y);
    return { year: `Y${y}`, fcf: Math.round(cf), cumulative: Math.round(cum) };
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Cash-flow and cumulative discounted cash-flow chart"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-txt">Cash-flow trend</h2>
          <p className="text-xs text-txt-dim">
            Annual free cash flow &amp; cumulative discounted cash flow (AED millions)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-txt-dim">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue" /> Free cash flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-negative" /> Outflow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-violet" /> Cumulative (disc.)
          </span>
        </div>
      </div>

      {/* text alternative for screen readers — the chart itself is SVG-only */}
      <p className="sr-only">
        Year 0 free cash flow is {fmtAedM(data[0].fcf)} (the up-front outlay); the Year-4 GPU
        refresh dips to {fmtAedM(data[4]?.fcf ?? NaN)}; the cumulative discounted cash flow ends
        the {data.length - 1}-year horizon at {fmtAedM(data[data.length - 1].cumulative)}, which
        equals the project NPV.
      </p>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="fcfPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis
              dataKey="year"
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
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
            <Bar dataKey="fcf" radius={[3, 3, 0, 0]} maxBarSize={46}>
              {data.map((d) => (
                <Cell key={d.year} fill={d.fcf >= 0 ? 'url(#fcfPos)' : '#fb7185'} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#a78bfa"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
