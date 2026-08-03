/**
 * alternatives.ts — Build-vs-Rent analysis with Equivalent Annual Cost.
 *
 * The relevant capital-budgeting question isn't "build vs do nothing" — Barq AI
 * needs the compute either way. It's "BUILD and own the hall, or RENT equivalent
 * GPU capacity from a hyperscaler?" The two routes have different lives (own hall
 * 8y vs a 3y cloud commitment), so they can't be compared on total cost or NPV —
 * the correct instrument is Equivalent Annual Cost (level annual charge with the
 * same present value). We also compute the incremental NPV of building over
 * renting (rolling the rental over the hall's life), which is the true relevant
 * cash-flow test.
 *
 * The economics: the build is a largely FIXED cost (sunk capex), while renting
 * SCALES with utilization. So building wins at high, stable utilization and
 * renting wins when utilization is low or uncertain — which is exactly why
 * utilization is the decisive driver of the whole appraisal.
 */
import type { Assumptions } from './model';
import { buildModel } from './model';

/** Hyperscaler wholesale rate as a fraction of Barq's retail $/GPU-hr. */
const CLOUD_WHOLESALE_FRACTION = 0.8;
/** Cloud route: one-off integration capex + annual ops (AED m). */
const CLOUD_INTEGRATION_CAPEX = 50;
const CLOUD_ANNUAL_FIXED = 80;
const CLOUD_LIFE = 3;

export interface Route {
  key: 'build' | 'rent';
  name: string;
  lifeYears: number;
  capexAed: number;
  annualCostAed: number; // representative level annual operating cost
  pvCostAed: number; // present value of all costs over the route's life
  eacAed: number; // equivalent annual cost
  costPerGpuHrUsd: number; // all-in unit cost of delivered compute
}

export interface AlternativesResult {
  build: Route;
  rent: Route;
  cheapest: 'build' | 'rent';
  /** Level annual value of building vs renting = EAC(rent) − EAC(build). */
  incrementalEaaAed: number;
  /** Incremental NPV of building vs renting over the hall's life (relevant CF). */
  incrementalNpvAed: number;
  /** Internal check: sign(incremental NPV) must equal sign(EAC advantage). */
  consistencyOk: boolean;
}

/** Annuity factor a(r,n) = (1 − (1+r)^−n) / r. */
export function annuityFactor(r: number, n: number): number {
  if (r === 0) return n;
  return (1 - Math.pow(1 + r, -n)) / r;
}

export function evaluateAlternatives(a: Assumptions): AlternativesResult {
  const r = a.wacc;
  const m = buildModel(a);
  const gpuHours = a.racks * a.gpusPerRack * a.hoursPerYear * a.utilization;

  // --- BUILD & own: reuse the project's own cost stack (largely fixed) ---
  const capexBuild = m.capexAed;
  const wc = a.workingCapitalAed;
  const opexBuild = m.opexAed;
  const refresh = a.refreshFraction * m.itHardwareAed;
  const salvage = m.terminalAed;
  const nB = a.lifeYears;
  let pvBuild = capexBuild + wc;
  for (let t = 1; t <= nB; t++) pvBuild += opexBuild / Math.pow(1 + r, t);
  pvBuild += refresh / Math.pow(1 + r, a.refreshYear);
  pvBuild -= salvage / Math.pow(1 + r, nB);
  const eacBuild = pvBuild / annuityFactor(r, nB);

  // --- RENT hyperscaler capacity: cost scales with utilization (flexible) ---
  const cloudRate = a.gpuPriceUsd * CLOUD_WHOLESALE_FRACTION;
  const annualRent = (gpuHours * cloudRate * a.usdAed) / 1e6 + CLOUD_ANNUAL_FIXED;
  let pvRent = CLOUD_INTEGRATION_CAPEX;
  for (let t = 1; t <= CLOUD_LIFE; t++) pvRent += annualRent / Math.pow(1 + r, t);
  const eacRent = pvRent / annuityFactor(r, CLOUD_LIFE);

  // --- Incremental NPV of building vs rolling the rental over the hall's life ---
  // Rolling the 3-year rental over 8 years re-incurs the integration capex each
  // cycle, so the rolled route's level annual cost must include that capex
  // annuitized over the cycle (the same scope the rent EAC charges). This makes
  // the incremental NPV and the EAC comparison the same-scope identity that
  // consistencyOk / self-test check 4 assert: incrNpv = a(r, 8y) × ΔEAC.
  const annualRentRolled = annualRent + CLOUD_INTEGRATION_CAPEX / annuityFactor(r, CLOUD_LIFE);
  const annualSaving = annualRentRolled - opexBuild;
  let incrNpv = -(capexBuild + wc);
  for (let t = 1; t <= nB; t++) incrNpv += annualSaving / Math.pow(1 + r, t);
  incrNpv += -refresh / Math.pow(1 + r, a.refreshYear) + salvage / Math.pow(1 + r, nB);

  const build: Route = {
    key: 'build',
    name: 'Build & own the hall',
    lifeYears: nB,
    capexAed: capexBuild,
    annualCostAed: opexBuild,
    pvCostAed: pvBuild,
    eacAed: eacBuild,
    costPerGpuHrUsd: (eacBuild * 1e6) / gpuHours / a.usdAed,
  };
  const rent: Route = {
    key: 'rent',
    name: 'Rent hyperscaler GPU capacity',
    lifeYears: CLOUD_LIFE,
    capexAed: CLOUD_INTEGRATION_CAPEX,
    annualCostAed: annualRent,
    pvCostAed: pvRent,
    eacAed: eacRent,
    costPerGpuHrUsd: (eacRent * 1e6) / gpuHours / a.usdAed,
  };

  const incrementalEaaAed = eacRent - eacBuild;
  const consistencyOk = Math.sign(incrNpv) === Math.sign(incrementalEaaAed);

  return {
    build,
    rent,
    cheapest: eacBuild <= eacRent ? 'build' : 'rent',
    incrementalEaaAed,
    incrementalNpvAed: incrNpv,
    consistencyOk,
  };
}

/**
 * Utilization at which building and renting break even (incremental NPV = 0).
 * Below it, renting is cheaper; above it, building wins. Returns null if no
 * crossover in [0.3, 1].
 */
export function buildRentCrossoverUtil(a: Assumptions): number | null {
  const f = (u: number) => evaluateAlternatives({ ...a, utilization: u }).incrementalNpvAed;
  let lo = 0.3;
  let hi = 1.0;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}
