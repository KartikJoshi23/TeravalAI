/**
 * alternatives.test.ts — pins the Build-vs-Rent / EAC model to its verified
 * behaviour: build wins by a thin margin at base, renting wins at low utilization,
 * the crossover is ~78%, and the internal consistency check holds.
 */
import { describe, it, expect } from 'vitest';
import {
  BASE_ASSUMPTIONS,
  evaluateAlternatives,
  buildRentCrossoverUtil,
  breakevenUtilization,
  runSelfTest,
} from './index';

function near(actual: number, expected: number, tol: number, label = '') {
  expect(Math.abs(actual - expected), `${label}: got ${actual}, expected ≈ ${expected} (±${tol})`).toBeLessThanOrEqual(tol);
}

describe('Build vs Rent (EAC + incremental)', () => {
  it('base case: build is cheaper than rent, by a thin +AED ~211m NPV', () => {
    const r = evaluateAlternatives(BASE_ASSUMPTIONS);
    expect(r.cheapest).toBe('build');
    near(r.incrementalNpvAed, 211, 40, 'incr NPV');
    expect(r.build.eacAed).toBeLessThan(r.rent.eacAed);
    expect(r.consistencyOk).toBe(true);
    near(r.build.costPerGpuHrUsd, 3.28, 0.08, 'build $/GPU-hr');
  });

  it('low utilization (65%): renting wins (flexibility beats stranded capex)', () => {
    const r = evaluateAlternatives({ ...BASE_ASSUMPTIONS, utilization: 0.65 });
    expect(r.cheapest).toBe('rent');
    expect(r.incrementalNpvAed).toBeLessThan(0);
    expect(r.consistencyOk).toBe(true);
  });

  it('high utilization (90%): building wins clearly', () => {
    const r = evaluateAlternatives({ ...BASE_ASSUMPTIONS, utilization: 0.9 });
    expect(r.cheapest).toBe('build');
    expect(r.incrementalNpvAed).toBeGreaterThan(500);
  });

  it('build-vs-rent crossover utilization is ~78%', () => {
    const u = buildRentCrossoverUtil(BASE_ASSUMPTIONS);
    expect(u).not.toBeNull();
    near(u as number, 0.783, 0.03, 'crossover util');
  });
});

describe('decision thresholds', () => {
  it('break-even utilization is below the 80% base (some headroom)', () => {
    const u = breakevenUtilization(BASE_ASSUMPTIONS);
    expect(u).not.toBeNull();
    expect(u as number).toBeGreaterThan(0.5);
    expect(u as number).toBeLessThan(0.8);
  });
});

describe('model self-test', () => {
  it('all integrity checks pass at base', () => {
    const s = runSelfTest();
    expect(s.allOk, JSON.stringify(s.checks.filter((c) => !c.ok))).toBe(true);
    expect(s.total).toBe(4);
  });
});
