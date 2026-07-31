/**
 * model.ts — the Teraval capital-budgeting model for Barq AI's proposed
 * ~40 MW AI/GPU data-center hall in Abu Dhabi.
 *
 * This is the single source of truth for every number the dashboard shows. It
 * mirrors, line for line, the verified Python reference model
 * (docs/finance-model-reference.py). All monetary values are AED millions.
 */

import {
  npv,
  irr,
  mirr,
  profitabilityIndex,
  paybackPeriod,
  discountedPayback,
} from './core';

/**
 * Full assumption set. The five *scenario drivers* (price, utilization, tariff,
 * pue, wacc) are what the dashboard sliders move; the rest are structural
 * defaults an analyst can also override.
 */
export interface Assumptions {
  // --- scenario drivers (dashboard sliders) ---
  gpuPriceUsd: number;   // GPU rental price, USD per GPU-hour
  utilization: number;   // fraction 0..1
  tariffAed: number;     // electricity tariff, AED per kWh
  pue: number;           // power usage effectiveness (≥1)
  wacc: number;          // discount rate, fraction

  // --- structural assumptions ---
  racks: number;             // number of GB200 NVL72 racks
  gpusPerRack: number;
  itMW: number;              // critical IT load, MW
  lifeYears: number;         // appraisal horizon
  hoursPerYear: number;
  loadFactor: number;        // average power draw as fraction of peak
  taxRate: number;           // UAE corporate tax
  fixedOpexAed: number;      // staff, bandwidth, land lease, licences (AED m/yr)
  hwMaintPct: number;        // hardware maintenance as fraction of IT capex/yr
  refreshFraction: number;   // GPU refresh capex as fraction of IT capex
  refreshYear: number;       // year the refresh outflow occurs
  rackCostUsdM: number;      // all-in cost per rack, USD millions
  facilityCostUsdMPerMW: number; // AI-grade build cost, USD m per MW
  workingCapitalAed: number; // initial NWC (AED m), recovered at horizon end
  itDepYears: number;        // straight-line depreciation life, IT hardware
  facilityDepYears: number;  // straight-line depreciation life, facility
  usdAed: number;            // USD→AED peg
}

/** Base-case assumptions — verified: NPV +AED 1,854m, IRR 16.5%, PI 1.31. */
export const BASE_ASSUMPTIONS: Assumptions = {
  gpuPriceUsd: 4.0,
  utilization: 0.8,
  tariffAed: 0.15,
  pue: 1.2,
  wacc: 0.09,

  racks: 300,
  gpusPerRack: 72,
  itMW: 40,
  lifeYears: 8,
  hoursPerYear: 8760,
  loadFactor: 0.9,
  taxRate: 0.09,
  fixedOpexAed: 350,
  hwMaintPct: 0.05,
  refreshFraction: 0.5,
  refreshYear: 4,
  rackCostUsdM: 3.5,
  facilityCostUsdMPerMW: 13,
  workingCapitalAed: 150,
  itDepYears: 5,
  facilityDepYears: 15,
  usdAed: 3.6725,
};

export type ScenarioName = 'optimistic' | 'base' | 'pessimistic';

/** Scenario driver overlays applied on top of BASE_ASSUMPTIONS. */
export const SCENARIO_DRIVERS: Record<ScenarioName, Partial<Assumptions>> = {
  optimistic: { gpuPriceUsd: 6.0, utilization: 0.9, tariffAed: 0.13, pue: 1.15, wacc: 0.08 },
  base: {},
  pessimistic: { gpuPriceUsd: 2.5, utilization: 0.65, tariffAed: 0.2, pue: 1.3, wacc: 0.11 },
};

export interface ModelBreakdown {
  gpus: number;
  itHardwareAed: number;
  facilityAed: number;
  capexAed: number;         // Year-0 build + hardware (excl. working capital)
  initialOutlayAed: number; // capex + working capital
  revenueAed: number;       // per year
  energyAed: number;        // per year
  opexAed: number;          // per year
  ebitdaAed: number;        // per year
  depreciation: number[];   // per year, index 1..life
  terminalAed: number;      // Year-life salvage + WC recovery
  fcf: number[];            // free cash flow, index 0..life
}

export interface Metrics {
  npv: number;
  irr: number;
  mirr: number;
  pi: number;
  payback: number | null;
  discountedPayback: number | null;
}

export interface Evaluation extends Metrics {
  breakdown: ModelBreakdown;
  decision: 'accept' | 'reject' | 'marginal';
}

/** Build the full cash-flow breakdown from an assumption set. */
export function buildModel(a: Assumptions): ModelBreakdown {
  const gpus = a.racks * a.gpusPerRack;
  const itHardwareAed = a.racks * a.rackCostUsdM * a.usdAed;
  const facilityAed = a.itMW * a.facilityCostUsdMPerMW * a.usdAed;
  const capexAed = itHardwareAed + facilityAed;
  const initialOutlayAed = capexAed + a.workingCapitalAed;

  const revenueAed = (gpus * a.hoursPerYear * a.utilization * a.gpuPriceUsd * a.usdAed) / 1e6;
  const energyAed = (a.itMW * a.pue * 1000 * a.hoursPerYear * a.loadFactor * a.tariffAed) / 1e6;
  const opexAed = energyAed + a.hwMaintPct * itHardwareAed + a.fixedOpexAed;
  const ebitdaAed = revenueAed - opexAed;

  const refresh = a.refreshFraction * itHardwareAed;

  // Straight-line depreciation: IT over itDepYears, facility over facilityDepYears,
  // GPU refresh spread over the years remaining after the refresh.
  const depreciation: number[] = new Array(a.lifeYears + 1).fill(0);
  for (let y = 1; y <= a.lifeYears; y++) {
    let d = facilityAed / a.facilityDepYears;
    if (y <= a.itDepYears) d += itHardwareAed / a.itDepYears;
    if (y > a.refreshYear) d += refresh / (a.lifeYears - a.refreshYear);
    depreciation[y] = d;
  }

  // Terminal value: residual book value of the facility + working-capital recovery.
  const terminalAed =
    facilityAed * (1 - a.lifeYears / a.facilityDepYears) + a.workingCapitalAed;

  const fcf: number[] = new Array(a.lifeYears + 1).fill(0);
  fcf[0] = -initialOutlayAed;
  for (let y = 1; y <= a.lifeYears; y++) {
    const ebit = ebitdaAed - depreciation[y];
    const tax = Math.max(0, ebit) * a.taxRate;
    let f = ebitdaAed - tax; // operating cash flow = EBITDA − cash tax
    if (y === a.refreshYear) f -= refresh;
    if (y === a.lifeYears) f += terminalAed;
    fcf[y] = f;
  }

  return {
    gpus,
    itHardwareAed,
    facilityAed,
    capexAed,
    initialOutlayAed,
    revenueAed,
    energyAed,
    opexAed,
    ebitdaAed,
    depreciation,
    terminalAed,
    fcf,
  };
}

/** Evaluate all decision metrics for an assumption set. */
export function evaluate(a: Assumptions): Evaluation {
  const breakdown = buildModel(a);
  const flows = breakdown.fcf;
  const value = npv(a.wacc, flows);
  const rate = irr(flows);

  let decision: Evaluation['decision'];
  if (value <= 0 || (!Number.isNaN(rate) && rate < a.wacc)) decision = 'reject';
  else if (value < 0.1 * breakdown.initialOutlayAed) decision = 'marginal';
  else decision = 'accept';

  return {
    npv: value,
    irr: rate,
    mirr: mirr(flows, a.wacc),
    pi: profitabilityIndex(a.wacc, flows),
    payback: paybackPeriod(flows),
    discountedPayback: discountedPayback(a.wacc, flows),
    breakdown,
    decision,
  };
}

/** Convenience: assumptions for a named scenario. */
export function scenarioAssumptions(name: ScenarioName): Assumptions {
  return { ...BASE_ASSUMPTIONS, ...SCENARIO_DRIVERS[name] };
}

/** Evaluate all three scenarios at once. */
export function evaluateScenarios(): Record<ScenarioName, Evaluation> {
  return {
    optimistic: evaluate(scenarioAssumptions('optimistic')),
    base: evaluate(scenarioAssumptions('base')),
    pessimistic: evaluate(scenarioAssumptions('pessimistic')),
  };
}

/**
 * Break-even GPU rental price (USD/GPU-hr) at which NPV = 0, holding all other
 * assumptions fixed. Bisection over [0.5, 20]. Returns NaN if NPV does not
 * cross zero in that range.
 */
export function breakevenGpuPrice(a: Assumptions): number {
  const npvAtPrice = (price: number) => npv(a.wacc, buildModel({ ...a, gpuPriceUsd: price }).fcf);
  let lo = 0.5;
  let hi = 20;
  if (npvAtPrice(lo) > 0 || npvAtPrice(hi) < 0) return NaN;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (npvAtPrice(mid) > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** One-way sensitivity: NPV when a single driver is shifted. */
export interface SensitivityPoint {
  label: string;
  npv: number;
  deltaNpv: number;
}

export function oneWaySensitivity(
  base: Assumptions,
  driver: keyof Assumptions,
  values: { label: string; value: number }[],
): SensitivityPoint[] {
  const baseNpv = npv(base.wacc, buildModel(base).fcf);
  return values.map(({ label, value }) => {
    const shifted = { ...base, [driver]: value };
    const v = npv(shifted.wacc, buildModel(shifted).fcf);
    return { label, npv: v, deltaNpv: v - baseNpv };
  });
}

/**
 * Monte-Carlo NPV simulation over independent triangular driver distributions.
 * Returns the NPV samples plus the probability of a negative NPV. A seedable
 * PRNG keeps runs reproducible for tests and for the dashboard's "re-run" UX.
 */
export interface MonteCarloResult {
  samples: number[];
  probNegative: number;
  mean: number;
  p10: number;
  p90: number;
}

export function monteCarloNpv(
  base: Assumptions,
  ranges: Partial<Record<keyof Assumptions, [number, number, number]>>, // [min, mode, max]
  iterations = 5000,
  seed = 42,
): MonteCarloResult {
  const rand = mulberry32(seed);
  const samples: number[] = [];
  let negatives = 0;
  for (let i = 0; i < iterations; i++) {
    const draw: Assumptions = { ...base };
    for (const key in ranges) {
      const tri = ranges[key as keyof Assumptions];
      if (tri) (draw[key as keyof Assumptions] as number) = triangular(rand(), tri[0], tri[1], tri[2]);
    }
    const v = npv(draw.wacc, buildModel(draw).fcf);
    samples.push(v);
    if (v < 0) negatives++;
  }
  samples.sort((x, y) => x - y);
  const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
  return {
    samples,
    probNegative: negatives / iterations,
    mean,
    p10: samples[Math.floor(0.1 * samples.length)],
    p90: samples[Math.floor(0.9 * samples.length)],
  };
}

/** Inverse-CDF sample from a triangular(min, mode, max) distribution. */
function triangular(u: number, min: number, mode: number, max: number): number {
  const fc = (mode - min) / (max - min);
  return u < fc
    ? min + Math.sqrt(u * (max - min) * (mode - min))
    : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

/** Small deterministic PRNG (mulberry32) for reproducible simulations. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
