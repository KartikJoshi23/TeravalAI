/**
 * thresholds.ts — "what has to hold" decision thresholds: the points at which the
 * accept/reject verdict flips. Each is solved live from the current assumptions,
 * so the panel always answers "how much room does the decision have?".
 */
import type { Assumptions } from './model';
import { evaluate, buildModel } from './model';
import { npv } from './core';

/** Utilization at which NPV = 0, holding all else fixed (null if no crossing). */
export function breakevenUtilization(a: Assumptions): number | null {
  const f = (u: number) => evaluate({ ...a, utilization: u }).npv;
  let lo = 0.2;
  let hi = 1.0;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Maximum capex overrun the project tolerates before NPV = 0, as a fraction of
 * the base rack cost (e.g. 0.28 = +28%). Scales the GPU rack cost upward until
 * NPV hits zero. Returns null if NPV never goes negative in the search range.
 */
export function maxCapexOverrun(a: Assumptions): number | null {
  const f = (mult: number) => npv(a.wacc, buildModel({ ...a, rackCostUsdM: a.rackCostUsdM * mult }).fcf);
  if (f(1) <= 0) return 0; // already at/below zero
  let lo = 1;
  let hi = 4;
  if (f(hi) > 0) return null; // never breaks even in range
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2 - 1;
}
