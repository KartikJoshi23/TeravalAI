/** Display formatters. All monetary values are AED millions. */

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Signed AED millions, e.g. +1854 → "+AED 1,854M", -4138 → "−AED 4,138M". */
export function fmtAedM(m: number): string {
  if (!Number.isFinite(m)) return 'n/a';
  const sign = m < 0 ? '−' : '+';
  return `${sign}AED ${nf0.format(Math.abs(m))}M`;
}

/** Fraction → percent, e.g. 0.165 → "16.5%". */
export function fmtPct(x: number, dp = 1): string {
  if (!Number.isFinite(x)) return 'n/a';
  return `${(x * 100).toFixed(dp)}%`;
}

/** Plain ratio, e.g. 1.31 → "1.31". */
export function fmtRatio(x: number, dp = 2): string {
  if (!Number.isFinite(x)) return 'n/a';
  return x.toFixed(dp);
}

/** Years, e.g. 5.0 → "5.0 yrs". */
export function fmtYears(x: number): string {
  if (!Number.isFinite(x)) return 'never';
  return `${x.toFixed(1)} yrs`;
}

/** USD per GPU-hour, e.g. 3.34 → "$3.34". */
export function fmtUsdHr(x: number): string {
  if (!Number.isFinite(x)) return 'n/a';
  return `$${x.toFixed(2)}`;
}
