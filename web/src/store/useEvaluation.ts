/**
 * Derived-state selectors. Each memoises a pure finance-engine call against the
 * live assumptions, so components read finished metrics and never touch the
 * engine directly. When a slider changes the store, these recompute once.
 */
import { useMemo } from 'react';
import { useModelStore } from './useModelStore';
import { evaluate, buildModel, breakevenGpuPrice } from '../finance';

export function useAssumptions() {
  return useModelStore((s) => s.assumptions);
}

/** Full decision metrics (NPV, IRR, MIRR, PI, payback, decision, breakdown). */
export function useEvaluation() {
  const a = useAssumptions();
  return useMemo(() => evaluate(a), [a]);
}

/** The year-by-year cash-flow breakdown (for the cash-flow chart). */
export function useModel() {
  const a = useAssumptions();
  return useMemo(() => buildModel(a), [a]);
}

/** Break-even GPU rental price (USD/GPU-hr) at which NPV = 0. */
export function useBreakeven() {
  const a = useAssumptions();
  return useMemo(() => breakevenGpuPrice(a), [a]);
}
