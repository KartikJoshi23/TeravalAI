/**
 * GPU rental-rate forecaster (feature F1). A transparent mean-reverting forward
 * path with widening confidence bands — not a trained model, so it is presented
 * with explicit bands and never as certainty. From the current $/GPU-hr it
 * reverts toward a long-run market level; the P10–P90 band widens with √t.
 */
export interface RatePoint {
  year: number;
  p10: number;
  mid: number;
  p90: number;
}

export interface ForecastOpts {
  longRun?: number; // long-run market rate the path reverts toward, $/GPU-hr
  reversion?: number; // reversion speed per year
  vol?: number; // annualised volatility for the bands
}

export function forecastGpuRate(
  current: number,
  years: number,
  opts: ForecastOpts = {},
): RatePoint[] {
  const longRun = opts.longRun ?? 3.0;
  const k = opts.reversion ?? 0.25;
  const vol = opts.vol ?? 0.12;
  const out: RatePoint[] = [];
  for (let t = 0; t <= years; t++) {
    const mid = longRun + (current - longRun) * Math.exp(-k * t);
    const spread = mid * vol * Math.sqrt(t); // 0 at t=0, widening after
    out.push({
      year: t,
      mid,
      p10: Math.max(0, mid - 1.28 * spread),
      p90: mid + 1.28 * spread,
    });
  }
  return out;
}

/** First year (>0) whose P10 falls below `breakeven`, or null if it never does. */
export function firstYearBelow(points: RatePoint[], breakeven: number): number | null {
  for (const p of points) {
    if (p.year > 0 && p.p10 < breakeven) return p.year;
  }
  return null;
}
