/**
 * TornadoChart — one-way sensitivity of NPV to each driver, as floating bars
 * spanning the down-move → up-move ΔNPV, sorted by impact. Computed live from
 * the current assumptions via oneWaySensitivity, so it re-ranks as sliders move.
 */
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
import { oneWaySensitivity } from '../finance';
import { useAssumptions } from '../store/useEvaluation';
import { DRIVERS } from '../lib/drivers';
import { fmtAedM } from '../lib/format';

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

interface Row {
  label: string;
  accent: string;
  swing: string;
  low: number;
  high: number;
  lowLabel: string;
  highLabel: string;
  range: [number, number];
  span: number;
}

function TornadoTooltip(props: { active?: boolean; payload?: { payload?: Row }[] }) {
  const row = props.active ? props.payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="glass px-3 py-2 text-xs">
      <div className="mb-1 font-semibold text-txt">
        {row.label} <span className="text-txt-faint">({row.swing})</span>
      </div>
      <div className="text-txt-dim">
        {row.lowLabel}: <span className="font-mono text-txt">{fmtAedM(row.low)}</span>
      </div>
      <div className="text-txt-dim">
        {row.highLabel}: <span className="font-mono text-txt">{fmtAedM(row.high)}</span>
      </div>
    </div>
  );
}

export default function TornadoChart() {
  const a = useAssumptions();

  const rows: Row[] = DRIVERS.map((d) => {
    const cur = a[d.key] as number;
    const lowVal = d.low(cur);
    const highVal = d.high(cur);
    const pts = oneWaySensitivity(a, d.key, [
      { label: 'low', value: lowVal },
      { label: 'high', value: highVal },
    ]);
    const low = pts[0].deltaNpv;
    const high = pts[1].deltaNpv;
    return {
      label: d.label,
      accent: d.accent,
      swing: d.swing,
      low,
      high,
      lowLabel: `${d.fmt(lowVal)}`,
      highLabel: `${d.fmt(highVal)}`,
      range: [Math.min(low, high), Math.max(low, high)] as [number, number],
      span: Math.abs(high - low),
    };
  }).sort((x, y) => y.span - x.span);

  return (
    <div>
      <div className="mb-1 text-xs text-txt-dim">
        Tornado — ΔNPV (AED m) from each driver&apos;s {''}
        <span className="text-txt-faint">down/up move</span>, ranked by impact
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={rows}
            margin={{ top: 6, right: 12, bottom: 4, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#9aa0b4', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => nf0.format(v)}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: '#c9cdda', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={118}
            />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<TornadoTooltip />} />
            <ReferenceLine x={0} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
            <Bar dataKey="range" radius={3} barSize={16}>
              {rows.map((r) => (
                <Cell key={r.label} fill={r.accent} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
