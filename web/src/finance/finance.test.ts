/**
 * finance.test.ts — pins the TypeScript engine to the verified Python reference
 * model (docs/finance-model-reference.py). If any of these fail, the engine has
 * drifted from the numbers reported in implementation-plan.md and the report.
 */
import { describe, it, expect } from 'vitest';
import {
  npv,
  irr,
  mirr,
  profitabilityIndex,
  presentValue,
  BASE_ASSUMPTIONS,
  buildModel,
  evaluate,
  evaluateScenarios,
  breakevenGpuPrice,
  oneWaySensitivity,
} from './index';

/** Assert |actual − expected| ≤ tol with a helpful message. */
function near(actual: number, expected: number, tol: number, label = '') {
  expect(Math.abs(actual - expected), `${label}: got ${actual}, expected ≈ ${expected} (±${tol})`).toBeLessThanOrEqual(tol);
}

describe('core primitives', () => {
  it('presentValue discounts correctly', () => {
    near(presentValue(110, 0.1, 1), 100, 1e-9);
  });

  it('npv of a one-period 10% loan is zero at 10%', () => {
    near(npv(0.1, [-100, 110]), 0, 1e-9);
  });

  it('irr of [-100, 110] is 10%', () => {
    near(irr([-100, 110]), 0.1, 1e-6);
  });

  it('irr returns NaN when there is no sign change', () => {
    expect(Number.isNaN(irr([-100, -10, -5]))).toBe(true);
  });

  it('PI equals 1 + NPV/outlay for a Year-0-only outlay', () => {
    const flows = [-1000, 400, 400, 400, 400];
    const pi = profitabilityIndex(0.1, flows);
    near(pi, 1 + npv(0.1, flows) / 1000, 1e-9);
  });

  it('mirr sits between wacc and irr for a normal project', () => {
    const flows = [-1000, 400, 400, 400, 400];
    const m = mirr(flows, 0.1);
    expect(m).toBeGreaterThan(0.1);
    expect(m).toBeLessThan(irr(flows));
  });
});

describe('Barq AI base-case model (verified reference numbers)', () => {
  const b = buildModel(BASE_ASSUMPTIONS);

  it('capex, GPUs and per-year revenue/opex/EBITDA match', () => {
    expect(b.gpus).toBe(21600);
    near(b.capexAed, 5766, 2, 'capex');          // AED 5,766m
    near(b.revenueAed, 2224, 2, 'revenue');      // AED 2,224m/yr
    near(b.opexAed, 600, 2, 'opex');             // AED 600m/yr
    near(b.ebitdaAed, 1624, 2, 'ebitda');        // AED 1,624m/yr
  });

  it('produces NPV ≈ +1,854, IRR ≈ 16.5%, MIRR ≈ 12.6%, PI ≈ 1.31', () => {
    const e = evaluate(BASE_ASSUMPTIONS);
    near(e.npv, 1854, 5, 'npv');
    near(e.irr, 0.165, 0.003, 'irr');
    near(e.mirr, 0.126, 0.003, 'mirr');
    near(e.pi, 1.31, 0.01, 'pi');
    near(e.payback ?? -1, 5.0, 0.1, 'payback');
    near(e.discountedPayback ?? -1, 6.3, 0.15, 'discPayback');
    expect(e.decision).toBe('accept');
  });
});

describe('scenario set (verified decision flip)', () => {
  const s = evaluateScenarios();

  it('optimistic: NPV ≈ +10,216, IRR ≈ 44.5%, PI ≈ 2.73 → accept', () => {
    near(s.optimistic.npv, 10216, 20, 'opt npv');
    near(s.optimistic.irr, 0.445, 0.005, 'opt irr');
    near(s.optimistic.pi, 2.73, 0.02, 'opt pi');
    expect(s.optimistic.decision).toBe('accept');
  });

  it('base: NPV ≈ +1,854 → accept', () => {
    near(s.base.npv, 1854, 5, 'base npv');
    expect(s.base.decision).toBe('accept');
  });

  it('pessimistic: NPV ≈ −4,138, IRR ≈ −9.5%, never pays back → reject', () => {
    near(s.pessimistic.npv, -4138, 20, 'pess npv');
    near(s.pessimistic.irr, -0.095, 0.005, 'pess irr');
    near(s.pessimistic.pi, 0.30, 0.02, 'pess pi');
    expect(s.pessimistic.payback).toBeNull();
    expect(s.pessimistic.decision).toBe('reject');
  });
});

describe('breakeven & sensitivity (verified)', () => {
  it('break-even GPU rental price ≈ $3.34/GPU-hr', () => {
    near(breakevenGpuPrice(BASE_ASSUMPTIONS), 3.34, 0.05, 'breakeven');
  });

  it('GPU price is the dominant driver: −20% flips NPV negative', () => {
    const pts = oneWaySensitivity(BASE_ASSUMPTIONS, 'gpuPriceUsd', [
      { label: '-20%', value: 4.0 * 0.8 },
      { label: '+20%', value: 4.0 * 1.2 },
    ]);
    near(pts[0].npv, -398, 15, 'price -20% npv'); // flips negative
    near(pts[1].npv, 4094, 15, 'price +20% npv');
    expect(pts[0].npv).toBeLessThan(0);
  });
});
