/**
 * metrics.ts — the evaluation vocabulary of the ML layer: a reproducible
 * train/test split and the standard classification + regression scores. Keeping
 * these honest (measured on a HELD-OUT test set, never on training data) is what
 * separates a real model from a curve that has just memorised its inputs.
 */
import { shuffle, mulberry32 } from './rng';

export interface Split<T> {
  train: T[];
  test: T[];
}

/** Shuffle (seeded) then split rows so `testFraction` go to the test set. */
export function trainTestSplit<T>(rows: T[], testFraction = 0.25, seed = 7): Split<T> {
  const copy = shuffle([...rows], mulberry32(seed));
  const nTest = Math.round(copy.length * testFraction);
  return { test: copy.slice(0, nTest), train: copy.slice(nTest) };
}

/** Column-wise mean/std standardiser (z-score), fit on training data only. */
export interface Standardizer {
  mean: number[];
  std: number[];
}

export function fitStandardizer(X: number[][]): Standardizer {
  const n = X.length;
  const d = X[0].length;
  const mean = new Array(d).fill(0);
  const std = new Array(d).fill(0);
  for (const row of X) for (let j = 0; j < d; j++) mean[j] += row[j] / n;
  for (const row of X) for (let j = 0; j < d; j++) std[j] += (row[j] - mean[j]) ** 2 / n;
  for (let j = 0; j < d; j++) std[j] = Math.sqrt(std[j]) || 1;
  return { mean, std };
}

export function standardize(X: number[][], s: Standardizer): number[][] {
  return X.map((row) => row.map((v, j) => (v - s.mean[j]) / s.std[j]));
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

/** Confusion matrix at a 0.5 probability threshold. */
export function confusion(yTrue: number[], probs: number[], threshold = 0.5): ConfusionMatrix {
  const cm: ConfusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (let i = 0; i < yTrue.length; i++) {
    const pred = probs[i] >= threshold ? 1 : 0;
    if (yTrue[i] === 1 && pred === 1) cm.tp++;
    else if (yTrue[i] === 0 && pred === 1) cm.fp++;
    else if (yTrue[i] === 0 && pred === 0) cm.tn++;
    else cm.fn++;
  }
  return cm;
}

export function accuracy(cm: ConfusionMatrix): number {
  const total = cm.tp + cm.fp + cm.tn + cm.fn;
  return total === 0 ? 0 : (cm.tp + cm.tn) / total;
}

export function precision(cm: ConfusionMatrix): number {
  return cm.tp + cm.fp === 0 ? 0 : cm.tp / (cm.tp + cm.fp);
}

export function recall(cm: ConfusionMatrix): number {
  return cm.tp + cm.fn === 0 ? 0 : cm.tp / (cm.tp + cm.fn);
}

export function f1(cm: ConfusionMatrix): number {
  const p = precision(cm);
  const r = recall(cm);
  return p + r === 0 ? 0 : (2 * p * r) / (p + r);
}

/**
 * ROC-AUC via the rank-sum (Mann–Whitney U) identity — threshold-independent, so
 * it measures how well the model separates the classes regardless of cut-off.
 */
export function rocAuc(yTrue: number[], probs: number[]): number {
  const idx = probs.map((_, i) => i).sort((a, b) => probs[a] - probs[b]);
  let rankSum = 0;
  let i = 0;
  let rank = 1;
  while (i < idx.length) {
    let j = i;
    while (j < idx.length && probs[idx[j]] === probs[idx[i]]) j++;
    const avgRank = (rank + (rank + (j - i) - 1)) / 2;
    for (let k = i; k < j; k++) if (yTrue[idx[k]] === 1) rankSum += avgRank;
    rank += j - i;
    i = j;
  }
  const nPos = yTrue.reduce((s, y) => s + y, 0);
  const nNeg = yTrue.length - nPos;
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (rankSum - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

/** Root-mean-square error (regression / forecast). */
export function rmse(yTrue: number[], yPred: number[]): number {
  const n = yTrue.length;
  let s = 0;
  for (let i = 0; i < n; i++) s += (yTrue[i] - yPred[i]) ** 2;
  return Math.sqrt(s / n);
}

/** Mean absolute percentage error, as a fraction (0.08 = 8%). */
export function mape(yTrue: number[], yPred: number[]): number {
  const n = yTrue.length;
  let s = 0;
  for (let i = 0; i < n; i++) if (yTrue[i] !== 0) s += Math.abs((yTrue[i] - yPred[i]) / yTrue[i]);
  return s / n;
}
