/**
 * surrogate.ts — ML-2, the flagship. A supervised classifier that learns the
 * accept / reject decision boundary of the capital-budgeting model.
 *
 * WHY THIS IS HONEST AI (not fabrication): the labels are produced by our OWN
 * deterministic engine — we draw thousands of driver combinations, run each
 * through `evaluate()`, and label it value-creating (NPV > 0) or not. The model
 * then learns to *predict* that verdict directly from the drivers. So it is a
 * genuine trained classifier (train/test split, accuracy, ROC-AUC, confusion
 * matrix, permutation importance) whose ground truth is the engine itself. It
 * never replaces the NPV formula — it emulates the decision so the dashboard can
 * (a) show an instant accept-probability as sliders move, (b) draw the learned
 * decision surface, and (c) rank drivers by data-driven importance.
 */
import { BASE_ASSUMPTIONS, evaluate, type Assumptions } from '../../finance';
import { mulberry32, uniform } from './rng';
import {
  trainTestSplit,
  confusion,
  accuracy,
  precision,
  recall,
  f1,
  rocAuc,
  type ConfusionMatrix,
} from './metrics';
import {
  trainLogReg,
  predictProba,
  predictProbaMany,
  permutationImportance,
  type LogRegModel,
  type Importance,
} from './logreg';

/** The 5 scenario drivers, plus a price×utilization interaction (≈ the revenue
 * term) so a linear classifier can capture the bilinear revenue structure. */
export const FEATURE_NAMES = [
  'GPU price',
  'Utilization',
  'Tariff',
  'PUE',
  'WACC',
  'Price×Util',
] as const;

/** Realistic sampling ranges (uniform) that straddle the decision boundary. */
const RANGES: Record<'gpuPriceUsd' | 'utilization' | 'tariffAed' | 'pue' | 'wacc', [number, number]> = {
  gpuPriceUsd: [2.0, 6.5],
  utilization: [0.45, 0.97],
  tariffAed: [0.1, 0.3],
  pue: [1.05, 1.45],
  wacc: [0.06, 0.14],
};

/** Feature vector for an assumption set — the model's input representation. */
export function featurize(a: Assumptions): number[] {
  return [a.gpuPriceUsd, a.utilization, a.tariffAed, a.pue, a.wacc, a.gpuPriceUsd * a.utilization];
}

export interface LabeledRow {
  x: number[];
  y: number; // 1 = value-creating (NPV > 0), 0 = destroys value
}

/**
 * Build the labelled dataset by sampling drivers and asking the deterministic
 * engine for the truth. Seeded ⇒ identical every run.
 */
export function generateDataset(n = 4000, seed = 20260804): LabeledRow[] {
  const rand = mulberry32(seed);
  const rows: LabeledRow[] = [];
  for (let i = 0; i < n; i++) {
    const a: Assumptions = {
      ...BASE_ASSUMPTIONS,
      gpuPriceUsd: uniform(rand, ...RANGES.gpuPriceUsd),
      utilization: uniform(rand, ...RANGES.utilization),
      tariffAed: uniform(rand, ...RANGES.tariffAed),
      pue: uniform(rand, ...RANGES.pue),
      wacc: uniform(rand, ...RANGES.wacc),
    };
    rows.push({ x: featurize(a), y: evaluate(a).npv > 0 ? 1 : 0 });
  }
  return rows;
}

export interface SurrogateMetrics {
  trainAccuracy: number;
  testAccuracy: number;
  auc: number;
  precision: number;
  recall: number;
  f1: number;
  confusion: ConfusionMatrix;
  nTrain: number;
  nTest: number;
  positiveRate: number; // share of value-creating cases in the data
}

export interface DecisionCell {
  price: number;
  utilization: number;
  prob: number; // predicted P(value-creating)
}

export interface SurrogateModel {
  model: LogRegModel;
  metrics: SurrogateMetrics;
  importance: Importance[];
  /** Learned accept-probability surface over price × utilization (base others). */
  boundary: DecisionCell[];
}

/** Train the surrogate end-to-end and evaluate it on a held-out test set. */
export function trainSurrogate(n = 4000, seed = 20260804): SurrogateModel {
  const rows = generateDataset(n, seed);
  const { train, test } = trainTestSplit(rows, 0.25, seed ^ 0x5f3759df);

  const Xtr = train.map((r) => r.x);
  const ytr = train.map((r) => r.y);
  const Xte = test.map((r) => r.x);
  const yte = test.map((r) => r.y);

  const model = trainLogReg(Xtr, ytr, [...FEATURE_NAMES], { epochs: 500, lr: 0.35, l2: 1e-3 });

  const trainProbs = predictProbaMany(model, Xtr);
  const testProbs = predictProbaMany(model, Xte);
  const cm = confusion(yte, testProbs);

  const metrics: SurrogateMetrics = {
    trainAccuracy: accuracy(confusion(ytr, trainProbs)),
    testAccuracy: accuracy(cm),
    auc: rocAuc(yte, testProbs),
    precision: precision(cm),
    recall: recall(cm),
    f1: f1(cm),
    confusion: cm,
    nTrain: train.length,
    nTest: test.length,
    positiveRate: rows.reduce((s, r) => s + r.y, 0) / rows.length,
  };

  const importance = permutationImportance(model, Xte, yte, seed ^ 0x9e3779b9);
  const boundary = decisionSurface(model);

  return { model, metrics, importance, boundary };
}

/** Predicted probability the current assumptions create value. */
export function predictAcceptProbability(model: LogRegModel, a: Assumptions): number {
  return predictProba(model, featurize(a));
}

/** Grid of accept-probabilities over price × utilization, other drivers at base. */
export function decisionSurface(model: LogRegModel, steps = 24): DecisionCell[] {
  const cells: DecisionCell[] = [];
  for (let i = 0; i < steps; i++) {
    const price = uniformGrid(RANGES.gpuPriceUsd[0], RANGES.gpuPriceUsd[1], steps, i);
    for (let j = 0; j < steps; j++) {
      const utilization = uniformGrid(RANGES.utilization[0], RANGES.utilization[1], steps, j);
      const a: Assumptions = { ...BASE_ASSUMPTIONS, gpuPriceUsd: price, utilization };
      cells.push({ price, utilization, prob: predictProba(model, featurize(a)) });
    }
  }
  return cells;
}

function uniformGrid(lo: number, hi: number, steps: number, i: number): number {
  return lo + ((hi - lo) * i) / (steps - 1);
}
