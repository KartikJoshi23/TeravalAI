import { describe, it, expect } from 'vitest';
import { BASE_ASSUMPTIONS, evaluate, scenarioAssumptions, breakevenGpuPrice } from '../finance';
import { runSimulation, histogram } from './simulate';
import { forecastGpuRate, firstYearBelow } from './forecast';
import { generateScenarios } from './scenarioGen';
import { buildRecommendation } from './recommendation';

describe('Monte-Carlo simulation (F3)', () => {
  it('is deterministic for a given seed and varies with the seed', () => {
    const a = BASE_ASSUMPTIONS;
    const r1 = runSimulation(a, 1, 1000);
    const r2 = runSimulation(a, 1, 1000);
    const r3 = runSimulation(a, 2, 1000);
    expect(r1.samples).toEqual(r2.samples);
    expect(r1.samples).not.toEqual(r3.samples);
    expect(r1.probNegative).toBeGreaterThanOrEqual(0);
    expect(r1.probNegative).toBeLessThanOrEqual(1);
  });

  it('histogram bins count every sample', () => {
    const r = runSimulation(BASE_ASSUMPTIONS, 5, 1000);
    const bins = histogram(r.samples, 20);
    const total = bins.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(r.samples.length);
  });
});

describe('rate forecaster (F1)', () => {
  it('starts at the current rate and widens its bands over time', () => {
    const pts = forecastGpuRate(4.0, 8);
    expect(pts[0].mid).toBeCloseTo(4.0, 6);
    expect(pts[0].p90 - pts[0].p10).toBeCloseTo(0, 6); // no band at t=0
    const spread4 = pts[4].p90 - pts[4].p10;
    const spread8 = pts[8].p90 - pts[8].p10;
    expect(spread8).toBeGreaterThan(spread4);
    expect(firstYearBelow(pts, 0)).toBeNull(); // never below zero
  });
});

describe('scenario generator (F2)', () => {
  it('orders upside > base > downside by NPV', () => {
    const a = BASE_ASSUMPTIONS;
    const [up, base, down] = generateScenarios(a).map((g) => evaluate({ ...a, ...g.patch }).npv);
    expect(up).toBeGreaterThan(base);
    expect(base).toBeGreaterThan(down);
  });
});

describe('recommendation engine (F6)', () => {
  it('accepts the base case and rejects the pessimistic case', () => {
    const base = BASE_ASSUMPTIONS;
    const recBase = buildRecommendation(base, evaluate(base), breakevenGpuPrice(base), 0.1);
    expect(recBase.verdict).toBe('accept');

    const pess = scenarioAssumptions('pessimistic');
    const recPess = buildRecommendation(pess, evaluate(pess), breakevenGpuPrice(pess), 0.9);
    expect(recPess.verdict).toBe('reject');
  });
});
