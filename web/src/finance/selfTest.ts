/**
 * selfTest.ts — live model-integrity checks. These are financial identities that
 * MUST hold for any internally-consistent capital-budgeting model; they run in
 * the browser on every load so that if an assumption is ever edited in a way that
 * breaks the model's logic, it fails visibly rather than silently. (The same
 * rigour the Vitest suite enforces at build time, surfaced to the user.)
 */
import type { Assumptions } from './model';
import { BASE_ASSUMPTIONS, evaluate } from './model';
import { npv } from './core';
import { evaluateAlternatives } from './alternatives';

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

export interface SelfTestResult {
  passed: number;
  total: number;
  allOk: boolean;
  checks: Check[];
}

export function runSelfTest(a: Assumptions = BASE_ASSUMPTIONS): SelfTestResult {
  const e = evaluate(a);
  const m = evaluate(a).breakdown;
  const alt = evaluateAlternatives(a);
  const checks: Check[] = [];

  // 1. NPV discounted at the IRR must be ≈ 0 (definition of IRR).
  const npvAtIrr = Number.isFinite(e.irr) ? npv(e.irr, m.fcf) : NaN;
  checks.push({
    name: 'NPV(IRR) ≈ 0',
    ok: Number.isFinite(npvAtIrr) && Math.abs(npvAtIrr) < 1,
    detail: `discounting at the IRR gives NPV ${npvAtIrr.toFixed(3)} (≈ 0)`,
  });

  // 2. PI > 1 ⇔ NPV > 0.
  checks.push({
    name: 'PI > 1 ⇔ NPV > 0',
    ok: e.pi > 1 === e.npv > 0,
    detail: `PI ${e.pi.toFixed(3)}, NPV ${Math.round(e.npv)} agree in sign`,
  });

  // 3. MIRR sits between the WACC and the IRR for this normal cash-flow profile.
  checks.push({
    name: 'WACC < MIRR < IRR',
    ok: Number.isFinite(e.irr) && e.mirr > a.wacc && e.mirr < e.irr,
    detail: `${(a.wacc * 100).toFixed(1)}% < ${(e.mirr * 100).toFixed(1)}% < ${(e.irr * 100).toFixed(1)}%`,
  });

  // 4. Build-vs-rent: the incremental NPV and the EAC advantage must agree in sign.
  checks.push({
    name: 'Incremental NPV ⇔ EAC advantage',
    ok: alt.consistencyOk,
    detail: `sign(incr NPV ${Math.round(alt.incrementalNpvAed)}) = sign(EAC gap ${Math.round(alt.incrementalEaaAed)})`,
  });

  const passed = checks.filter((c) => c.ok).length;
  return { passed, total: checks.length, allOk: passed === checks.length, checks };
}
