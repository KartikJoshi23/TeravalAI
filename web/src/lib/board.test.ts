import { describe, it, expect } from 'vitest';
import { BASE_ASSUMPTIONS, buildRentCrossoverUtil } from '../finance';
import { computeBoard } from './board';

describe('Departmental Review Board', () => {
  it('base case: board approves (with conditions) and no department outright opposes', () => {
    const r = computeBoard(BASE_ASSUMPTIONS);
    expect(['APPROVE', 'APPROVE WITH CONDITIONS']).toContain(r.verdict.label);
    expect(r.verdict.counts.opposes).toBe(0);
    // weights sum to 1 and the weighted score is in range
    const totalW = r.departments.reduce((s, d) => s + d.weight, 0);
    expect(totalW).toBeCloseTo(1, 6);
    expect(r.verdict.score).toBeGreaterThanOrEqual(0);
    expect(r.verdict.score).toBeLessThanOrEqual(100);
  });

  it('dropping utilization below the build-vs-rent crossover flips Commercial to oppose', () => {
    const crossover = buildRentCrossoverUtil(BASE_ASSUMPTIONS) ?? 0.77;
    const base = computeBoard(BASE_ASSUMPTIONS).departments.find((d) => d.key === 'commercial')!;
    expect(base.stance).not.toBe('opposes'); // at 80% we're above the crossover

    const low = computeBoard({ ...BASE_ASSUMPTIONS, utilization: crossover - 0.15 });
    const commercial = low.departments.find((d) => d.key === 'commercial')!;
    expect(commercial.stance).toBe('opposes');
  });

  it('an unmet non-negotiable keeps the board from unconditional approval', () => {
    const r = computeBoard(BASE_ASSUMPTIONS);
    if (r.verdict.anyUnmetNonNegotiable) {
      expect(r.verdict.label).not.toBe('APPROVE');
    }
  });
});
