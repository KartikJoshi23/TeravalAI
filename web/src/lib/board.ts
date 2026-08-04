/**
 * board.ts — the Departmental Review Board (feature P1, adapted from Project
 * Atlas's multi-stakeholder idea; our Barq-AI scenario, our engine).
 *
 * Five departments each run their own objective over the SAME live model state,
 * reach a **deterministic score /100** via a documented rule (in the spirit of
 * the model self-test — never arbitrary), take a stance, and a weighted board
 * verdict aggregates them. Every input is computed by the deterministic finance
 * engine; nothing here invents a figure. The engine + Python reference are
 * untouched — this is an aggregation layer on top.
 */
import type { Assumptions, Evaluation } from '../finance';
import {
  evaluate,
  breakevenGpuPrice,
  breakevenUtilization,
  buildRentCrossoverUtil,
  maxCapexOverrun,
  evaluateAlternatives,
} from '../finance';
import { runSimulation } from './simulate';

export type Stance = 'supports' | 'conditional' | 'opposes';

export interface DeptPosition {
  key: 'finance' | 'ops' | 'commercial' | 'esg' | 'tech';
  name: string;
  mandate: string;
  weight: number;
  score: number; // 0..100
  stance: Stance;
  concerns: string[];
  conditions: string[];
  nonNegotiable: string;
  nonNegotiableMet: boolean;
  whatWouldChange: string;
  accent: string;
}

export interface BoardVerdict {
  label: 'APPROVE' | 'APPROVE WITH CONDITIONS' | 'REJECT / REWORK';
  stance: Stance;
  score: number; // weighted 0..100
  counts: { supports: number; conditional: number; opposes: number };
  mostSupportive: DeptPosition;
  leastSupportive: DeptPosition;
  anyUnmetNonNegotiable: boolean;
}

export interface BoardResult {
  departments: DeptPosition[];
  verdict: BoardVerdict;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const pct = (x: number) => `${Math.round(x * 100)}%`;
const usd = (x: number) => `$${x.toFixed(2)}`;

/** Score → stance, with the rule that an unmet non-negotiable can never be
 *  unconditional support (it becomes "supports with conditions"). */
function stanceFor(score: number, nonNegotiableMet: boolean): Stance {
  if (score < 45) return 'opposes';
  if (score >= 70 && nonNegotiableMet) return 'supports';
  return 'conditional';
}

const BLUE = '#38bdf8';
const VIOLET = '#a78bfa';
const AMBER = '#fbbf24';
const GREEN = '#34d399';
const PINK = '#fb7185';

export function computeBoard(a: Assumptions): BoardResult {
  const e: Evaluation = evaluate(a);
  const breakeven = breakevenGpuPrice(a);
  const beUtil = breakevenUtilization(a) ?? 0;
  const crossover = buildRentCrossoverUtil(a) ?? 0.77;
  const overrun = maxCapexOverrun(a);
  const alt = evaluateAlternatives(a);
  const mc = runSimulation(a);

  const priceMargin = a.gpuPriceUsd - breakeven; // >0 = above break-even
  const departments: DeptPosition[] = [];

  // ---- Finance / CFO: risk-adjusted value + capital protection -------------
  // Rule: 30% value (PI over 1), 30% return (IRR above WACC), 25% risk
  // (Monte-Carlo loss probability), 15% liquidity (discounted payback vs life).
  {
    const valueScore = clamp01((e.pi - 1) / 0.5); // PI 1.5 = full marks
    const returnScore = clamp01((e.irr - a.wacc) / 0.08); // +8pp over WACC = full
    const riskScore = clamp01(1 - mc.probNegative / 0.4); // 40% loss prob = 0
    const dpb = e.discountedPayback ?? a.lifeYears * 1.5;
    const liquidityScore = clamp01((a.lifeYears - dpb) / (0.5 * a.lifeYears));
    const score = Math.round(
      100 * (0.3 * valueScore + 0.3 * returnScore + 0.25 * riskScore + 0.15 * liquidityScore),
    );
    departments.push({
      key: 'finance',
      name: 'Finance / CFO',
      mandate: 'Risk-adjusted value & capital protection',
      weight: 0.3,
      score,
      stance: stanceFor(score, false),
      concerns: [
        `NPV ${e.npv >= 0 ? '+' : ''}AED ${Math.round(e.npv).toLocaleString('en-US')}M with only a ${pct(e.pi - 1)} value cushion (PI ${e.pi.toFixed(2)})`,
        `Monte-Carlo puts P(NPV < 0) at ${pct(mc.probNegative)}`,
        `discounted payback ${dpb.toFixed(1)}y of the ${a.lifeYears}y life — capital is tied up late`,
      ],
      conditions: ['Release capex in tranches gated on measured utilization, not one up-front commit'],
      nonNegotiable: 'Staged capex release (no single up-front commitment)',
      nonNegotiableMet: false,
      whatWouldChange: `Turns to oppose if NPV < 0 — price below ${usd(breakeven)}/GPU-hr break-even, utilization below ${pct(beUtil)}, or WACC above the ${pct(e.irr)} IRR.`,
      accent: BLUE,
    });
  }

  // ---- Infrastructure / Ops: uptime, PUE, thermal headroom, N+1 -----------
  // Rule: 70% cooling efficiency headroom (PUE toward 1.1 is better), 30%
  // thermal load (very high sustained utilization stresses cooling).
  {
    const pueScore = clamp01((1.4 - a.pue) / (1.4 - 1.1));
    const loadScore = 1 - 0.5 * clamp01((a.utilization - 0.85) / 0.15);
    const score = Math.round(100 * (0.7 * pueScore + 0.3 * loadScore));
    const pueOk = a.pue <= 1.3;
    departments.push({
      key: 'ops',
      name: 'Infrastructure / Ops',
      mandate: 'Uptime, cooling efficiency & thermal headroom',
      weight: 0.2,
      score,
      stance: stanceFor(score, false),
      concerns: [
        `PUE ${a.pue.toFixed(2)} ${pueOk ? 'within' : 'above'} the liquid-cooled 1.05–1.20 target band`,
        `${pct(a.utilization)} sustained load${a.utilization > 0.85 ? ' pushes thermal/cooling headroom' : ' leaves cooling headroom'}`,
        'No single point of failure in power or cooling can be tolerated',
      ],
      conditions: ['N+1 cooling & power redundancy commissioned before go-live'],
      nonNegotiable: 'N+1 cooling redundancy',
      nonNegotiableMet: false,
      whatWouldChange: 'Turns to oppose if PUE drifts above ~1.35 or redundancy is value-engineered out.',
      accent: VIOLET,
    });
  }

  // ---- Commercial / Revenue: protect GPU demand & contracted offtake ------
  // Rule: centred on the build-vs-rent crossover — below it renting is cheaper
  // and building is commercially wrong; a price below break-even caps the score.
  {
    let score = Math.round(clamp01(0.5 + (a.utilization - crossover) * 2.5) * 100);
    if (priceMargin < 0) score = Math.min(score, 25); // below break-even → oppose
    const buildsWin = a.utilization >= crossover;
    departments.push({
      key: 'commercial',
      name: 'Commercial / Revenue',
      mandate: 'Contracted GPU demand — the dominant driver',
      weight: 0.25,
      score,
      stance: stanceFor(score, false),
      concerns: [
        `Utilization ${pct(a.utilization)} vs the ${pct(crossover)} build-vs-rent crossover — ${buildsWin ? 'building wins, but thinly' : 'renting is cheaper here'}`,
        `Price ${usd(a.gpuPriceUsd)}/GPU-hr vs ${usd(breakeven)} break-even (${priceMargin >= 0 ? '+' : ''}${usd(priceMargin)} margin)`,
        `Incremental NPV of building over renting is AED ${Math.round(alt.incrementalNpvAed).toLocaleString('en-US')}M`,
      ],
      conditions: ['Secure a minimum contracted-utilization floor (multi-year offtake) before capex'],
      nonNegotiable: 'Minimum contracted-utilization floor',
      nonNegotiableMet: a.utilization >= crossover && priceMargin >= 0,
      whatWouldChange: `Turns to oppose if utilization falls below the ${pct(crossover)} crossover (renting wins) or price drops below ${usd(breakeven)}.`,
      accent: GREEN,
    });
  }

  // ---- Sustainability / ESG: energy intensity, emissions, Net-Zero 2050 ----
  // Rule: PUE against a 1.35 ceiling is the dominant ESG lever.
  {
    const score = Math.round(clamp01((1.35 - a.pue) / (1.35 - 1.1)) * 100);
    const pueOk = a.pue <= 1.3;
    departments.push({
      key: 'esg',
      name: 'Sustainability / ESG',
      mandate: 'Energy intensity & UAE Net-Zero-2050 alignment',
      weight: 0.15,
      score,
      stance: stanceFor(score, pueOk),
      concerns: [
        `PUE ${a.pue.toFixed(2)} sets the energy overhead per compute-hour`,
        `${a.itMW} MW IT load at AED ${a.tariffAed.toFixed(2)}/kWh — cheap power, but real emissions`,
        'Public disclosure of energy & emissions is expected',
      ],
      conditions: ['Hold PUE at/under 1.30 and publish an energy & emissions disclosure'],
      nonNegotiable: 'PUE ceiling of 1.30 + disclosure',
      nonNegotiableMet: pueOk,
      whatWouldChange: `Turns to oppose if PUE rises above the 1.30 ceiling (now ${a.pue.toFixed(2)}).`,
      accent: AMBER,
    });
  }

  // ---- Technology / AI: GPU obsolescence & Year-4 refresh risk ------------
  // Rule: the Year-4 refresh (a fraction of IT capex) is the obsolescence hit;
  // the more capex-overrun room the project has, the more refresh risk it absorbs.
  {
    const refreshScore = clamp01(1 - a.refreshFraction * 0.7); // 50% refresh → 0.65
    const overrunScore = overrun == null ? 1 : clamp01(overrun / 0.5); // +50% room = full
    const score = Math.round(100 * (0.6 * refreshScore + 0.4 * overrunScore));
    departments.push({
      key: 'tech',
      name: 'Technology / AI',
      mandate: 'GPU obsolescence & refresh risk',
      weight: 0.1,
      score,
      stance: stanceFor(score, false),
      concerns: [
        `Year-${a.refreshYear} refresh re-spends ${pct(a.refreshFraction)} of IT capex as GPUs age`,
        overrun == null
          ? 'capex has wide headroom before NPV turns negative'
          : `only +${pct(overrun)} capex headroom before NPV turns negative`,
        'GB200-class kit obsoletes fast; residual value is uncertain',
      ],
      conditions: ['Phase the GPU fit-out; keep a rent/RaaS fallback for the refresh cycle'],
      nonNegotiable: 'A staged fit-out with a refresh-cycle fallback',
      nonNegotiableMet: false,
      whatWouldChange: 'Turns to oppose if refresh capex rises or capex-overrun headroom disappears.',
      accent: PINK,
    });
  }

  // ---- Weighted board verdict ---------------------------------------------
  const totalW = departments.reduce((s, d) => s + d.weight, 0);
  const score = departments.reduce((s, d) => s + d.weight * d.score, 0) / totalW;
  const counts = {
    supports: departments.filter((d) => d.stance === 'supports').length,
    conditional: departments.filter((d) => d.stance === 'conditional').length,
    opposes: departments.filter((d) => d.stance === 'opposes').length,
  };
  const anyUnmetNonNegotiable = departments.some((d) => !d.nonNegotiableMet);
  const sorted = [...departments].sort((x, y) => y.score - x.score);

  let label: BoardVerdict['label'];
  let stance: Stance;
  if (score < 45 || counts.opposes >= 3) {
    label = 'REJECT / REWORK';
    stance = 'opposes';
  } else if (score >= 70 && !anyUnmetNonNegotiable && counts.opposes === 0) {
    label = 'APPROVE';
    stance = 'supports';
  } else {
    label = 'APPROVE WITH CONDITIONS';
    stance = 'conditional';
  }

  return {
    departments,
    verdict: {
      label,
      stance,
      score,
      counts,
      mostSupportive: sorted[0],
      leastSupportive: sorted[sorted.length - 1],
      anyUnmetNonNegotiable,
    },
  };
}
