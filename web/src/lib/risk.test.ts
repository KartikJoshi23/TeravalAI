import { describe, it, expect } from 'vitest';
import {
  BASE_ASSUMPTIONS,
  evaluate,
  scenarioAssumptions,
  breakevenGpuPrice,
} from '../finance';
import { computeRisks } from './risk';

describe('risk rules', () => {
  it('base case raises no blocking risks (only the ok state)', () => {
    const a = BASE_ASSUMPTIONS;
    const risks = computeRisks(a, evaluate(a), breakevenGpuPrice(a));
    expect(risks.some((r) => r.severity === 'danger')).toBe(false);
    expect(risks).toHaveLength(1);
    expect(risks[0].id).toBe('ok');
  });

  it('pessimistic case flags negative NPV, IRR<WACC and below-break-even', () => {
    const a = scenarioAssumptions('pessimistic');
    const risks = computeRisks(a, evaluate(a), breakevenGpuPrice(a));
    const ids = risks.map((r) => r.id);
    expect(ids).toContain('npv');
    expect(ids).toContain('irr');
    expect(ids).toContain('breakeven');
    expect(ids).not.toContain('ok');
  });
});
