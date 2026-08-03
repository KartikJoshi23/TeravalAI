/**
 * RateForecastPanel (feature F1) — a forward GPU rental-rate path with a P10–P90
 * confidence band, reverting toward a long-run market level, plotted against the
 * live break-even rate. Presented explicitly as a range (not a point forecast).
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useAssumptions, useBreakeven } from '../../store/useEvaluation';
import { forecastGpuRate, firstYearBelow } from '../../lib/forecast';
import { fmtUsdHr } from '../../lib/format';

interface Row {
  year: string;
  p10: number;
  thickness: number;
  mid: number;
  p90: number;
}

function ForecastTooltip(props: { active?: boolean; label?: string; payload?: { payload?: Row }[] }) {
  const r = props.active ? props.payload?.[0]?.payload : undefined;
  if (!r) return null;
  return (
    <div className="glass px-3 py-2 text-xs">
      <div className="mb-1 font-semibold text-txt">{props.label}</div>
      <div className="text-txt-dim">
        Mid <span className="font-mono text-blue">{fmtUsdHr(r.mid)}/hr</span>
      </div>
      <div className="text-txt-dim">
        Band <span className="font-mono text-txt">{fmtUsdHr(r.p10)}</span>–
        <span className="font-mono text-txt">{fmtUsdHr(r.p90)}</span>
      </div>
    </div>
  );
}

export default function RateForecastPanel() {
  const a = useAssumptions();
  const breakeven = useBreakeven();

  const points = useMemo(() => forecastGpuRate(a.gpuPriceUsd, a.lifeYears), [a.gpuPriceUsd, a.lifeYears]);
  const data: Row[] = points.map((p) => ({
    year: `Y${p.year}`,
    p10: p.p10,
    thickness: p.p90 - p.p10,
    mid: p.mid,
    p90: p.p90,
  }));
  const belowYear = firstYearBelow(points, breakeven);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="GPU rate forecaster"
    >
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-txt">GPU rate forecaster</h2>
        <span className="rounded bg-blue/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue">
          AI · F1
        </span>
      </div>
      <p className="-mt-3 mb-3 text-xs text-txt-dim">
        Forward $/GPU-hr with P10–P90 band, reverting toward a long-run market level
      </p>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 12, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.08} />
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
              width={44}
              domain={[0, 'auto']}
              tickFormatter={(v: number) => `$${v.toFixed(1)}`}
            />
            <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.15)' }} content={<ForecastTooltip />} />
            {/* stacked areas: invisible p10 base + visible band thickness */}
            <Area dataKey="p10" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area
              dataKey="thickness"
              stackId="band"
              stroke="none"
              fill="url(#bandGrad)"
              isAnimationActive={false}
            />
            <Line type="monotone" dataKey="mid" stroke="#2dd4bf" strokeWidth={2.5} dot={false} />
            <ReferenceLine
              y={breakeven}
              stroke="#fbbf24"
              strokeDasharray="5 4"
              label={{
                value: `break-even ${fmtUsdHr(breakeven)}`,
                fill: '#fbbf24',
                fontSize: 11,
                position: 'insideBottomRight',
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-txt-dim">
        {belowYear == null ? (
          <>
            The P10 path stays above the{' '}
            <span className="font-mono text-amber">{fmtUsdHr(breakeven)}</span> break-even across the
            horizon — revenue has headroom, but the band widens with time.
          </>
        ) : (
          <>
            The downside (P10) path dips below the{' '}
            <span className="font-mono text-amber">{fmtUsdHr(breakeven)}</span> break-even by{' '}
            <span className="font-mono text-txt">Y{belowYear}</span> — the core risk to revenue.
          </>
        )}
      </p>
    </motion.section>
  );
}
