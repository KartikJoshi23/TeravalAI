/**
 * core.ts — pure, framework-agnostic corporate-finance primitives.
 *
 * Every function here is a deterministic function of its inputs (no state, no
 * I/O) so each metric can be unit-tested in isolation and reproduced exactly
 * against the verified Python reference model (docs/finance-model-reference.py).
 *
 * Convention: a cash-flow series `flows` is indexed by period, with `flows[0]`
 * the Year-0 outlay (normally negative) and `flows[t]` the net cash flow at the
 * end of period t.
 */

/** Present value of a single amount: PV = FV / (1+r)^t. */
export function presentValue(futureValue: number, rate: number, periods: number): number {
  return futureValue / Math.pow(1 + rate, periods);
}

/** Net Present Value: Σ flows[t] / (1+rate)^t, including the Year-0 outlay. */
export function npv(rate: number, flows: readonly number[]): number {
  let total = 0;
  for (let t = 0; t < flows.length; t++) {
    total += flows[t] / Math.pow(1 + rate, t);
  }
  return total;
}

/**
 * Internal Rate of Return — the rate r for which npv(r, flows) = 0.
 *
 * Solved by bisection over [-0.95, 10]. Bisection (not Newton) is chosen for
 * robustness: it cannot diverge, and it degrades gracefully to `NaN` when the
 * series has no sign change (e.g. an all-negative pessimistic case), which the
 * caller can surface as "no IRR" rather than a misleading number.
 */
export function irr(flows: readonly number[]): number {
  const f = (r: number) => npv(r, flows);
  let lo = -0.95;
  let hi = 10;
  const flo = f(lo);
  const fhi = f(hi);
  if (Number.isNaN(flo) || Number.isNaN(fhi) || flo * fhi > 0) {
    return NaN; // no sign change bracketed → IRR undefined
  }
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Modified IRR. Negative flows are discounted to Year 0 at `financeRate`;
 * positive flows are compounded to the final period at `reinvestRate`.
 * MIRR = (FV_positives / -PV_negatives)^(1/n) - 1.
 * Defaults both rates to the project discount rate (the common convention).
 */
export function mirr(
  flows: readonly number[],
  financeRate: number,
  reinvestRate: number = financeRate,
): number {
  const n = flows.length - 1;
  let pvNeg = 0;
  let fvPos = 0;
  for (let t = 0; t < flows.length; t++) {
    if (flows[t] < 0) {
      pvNeg += flows[t] / Math.pow(1 + financeRate, t);
    } else if (flows[t] > 0) {
      fvPos += flows[t] * Math.pow(1 + reinvestRate, n - t);
    }
  }
  if (pvNeg === 0) return NaN;
  return Math.pow(fvPos / -pvNeg, 1 / n) - 1;
}

/**
 * Profitability Index = PV(future net flows) / |initial outlay|.
 * Equivalent to 1 + NPV/|outlay| when the outlay is only at Year 0.
 * PI > 1 ⇔ NPV > 0 (accept); useful for ranking under capital rationing.
 */
export function profitabilityIndex(rate: number, flows: readonly number[]): number {
  const outlay = -flows[0];
  if (outlay <= 0) return NaN;
  const pvFuture = npv(rate, flows) + outlay; // strip the Year-0 term
  return pvFuture / outlay;
}

/**
 * Payback period (undiscounted), in years, using the reference model's
 * fractional convention: the first period whose cumulative cash flow turns
 * non-negative, plus the linear fraction of that period needed to break even.
 * Returns `null` if the project never pays back within the horizon.
 */
export function paybackPeriod(flows: readonly number[]): number | null {
  return crossingPoint(cumulative(flows), flows);
}

/** Discounted payback period, in years (same convention, on discounted flows). */
export function discountedPayback(rate: number, flows: readonly number[]): number | null {
  const discounted = flows.map((cf, t) => cf / Math.pow(1 + rate, t));
  return crossingPoint(cumulative(discounted), discounted);
}

function cumulative(flows: readonly number[]): number[] {
  const out: number[] = [];
  let running = 0;
  for (const cf of flows) {
    running += cf;
    out.push(running);
  }
  return out;
}

/** Shared crossing logic for payback / discounted payback. */
function crossingPoint(cum: readonly number[], flows: readonly number[]): number | null {
  for (let y = 1; y < flows.length; y++) {
    if (cum[y] >= 0 && flows[y] > 0) {
      return y - 1 + -cum[y - 1] / flows[y];
    }
  }
  return null;
}
