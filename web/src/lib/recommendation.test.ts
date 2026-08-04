import { describe, it, expect } from 'vitest';
import { BASE_ASSUMPTIONS, evaluate, scenarioAssumptions, breakevenGpuPrice } from '../finance';
import { buildRecommendation } from './recommendation';

describe('recommendation stage-gate nuance (P3)', () => {
  it('adds a stage-gate plan to a thin ACCEPT (base case)', () => {
    const a = BASE_ASSUMPTIONS;
    const rec = buildRecommendation(a, evaluate(a), breakevenGpuPrice(a), 0.21);
    expect(rec.verdict).toBe('accept');
    expect(rec.stageGate).toBeDefined();
    expect(rec.stageGate).toMatch(/stage-gated|tranches/i);
  });

  it('omits the stage-gate plan when the case is not a thin accept (reject)', () => {
    const p = scenarioAssumptions('pessimistic');
    const rec = buildRecommendation(p, evaluate(p), breakevenGpuPrice(p), 0.9);
    expect(rec.verdict).toBe('reject');
    expect(rec.stageGate).toBeUndefined();
  });

  it('omits the stage-gate plan on a safe accept (low loss prob, price well above break-even)', () => {
    const a = scenarioAssumptions('optimistic');
    // force a low loss probability so only the "thin" test decides
    const rec = buildRecommendation(a, evaluate(a), breakevenGpuPrice(a), 0.01);
    expect(rec.verdict).toBe('accept');
    expect(rec.stageGate).toBeUndefined();
  });
});
