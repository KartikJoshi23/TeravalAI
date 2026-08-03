/**
 * Monte-Carlo helpers (feature F3). Wraps the engine's seedable `monteCarloNpv`
 * with sensible driver distributions built around the current assumptions, and
 * buckets the resulting NPV samples into a histogram for the chart.
 */
import type { Assumptions, MonteCarloResult } from '../finance';
import { monteCarloNpv } from '../finance';

/** Triangular [min, mode, max] ranges centred on the live values. */
export function mcRanges(
  a: Assumptions,
): Partial<Record<keyof Assumptions, [number, number, number]>> {
  return {
    gpuPriceUsd: [Math.max(1, a.gpuPriceUsd * 0.65), a.gpuPriceUsd, a.gpuPriceUsd * 1.35],
    utilization: [Math.max(0.45, a.utilization - 0.15), a.utilization, Math.min(0.97, a.utilization + 0.1)],
    tariffAed: [a.tariffAed * 0.85, a.tariffAed, a.tariffAed * 1.3],
    pue: [Math.max(1.05, a.pue - 0.05), a.pue, a.pue + 0.15],
    wacc: [Math.max(0.03, a.wacc - 0.015), a.wacc, a.wacc + 0.03],
  };
}

/**
 * The one seed + run count every panel shares, so "P(NPV < 0)" is the SAME
 * number on the Overview recommendation, the Sensitivity thresholds tile, the
 * assistant context and the Monte-Carlo panel's first run (~21% at base).
 */
export const MC_SEED = 42;
export const MC_RUNS = 5000;

/** Deterministic given (a, seed): same inputs → identical samples. */
export function runSimulation(a: Assumptions, seed = MC_SEED, iterations = MC_RUNS): MonteCarloResult {
  return monteCarloNpv(a, mcRanges(a), iterations, seed);
}

export interface HistBin {
  x: number; // bin midpoint, AED millions
  count: number;
  negative: boolean;
}

/** Bucket ascending-sorted NPV samples into `bins` equal-width bins. */
export function histogram(sortedSamples: number[], bins = 22): HistBin[] {
  if (sortedSamples.length === 0) return [];
  const min = sortedSamples[0];
  const max = sortedSamples[sortedSamples.length - 1];
  const width = (max - min) / bins || 1;
  const counts = new Array<number>(bins).fill(0);
  for (const s of sortedSamples) {
    // Clamp so the max sample lands in the last bin despite float rounding.
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((s - min) / width)));
    counts[idx]++;
  }
  const out: HistBin[] = [];
  for (let i = 0; i < bins; i++) {
    const mid = min + (i + 0.5) * width;
    out.push({ x: Math.round(mid), count: counts[i], negative: mid < 0 });
  }
  return out;
}
