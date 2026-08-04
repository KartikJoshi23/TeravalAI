/**
 * logreg.ts — a from-scratch logistic-regression classifier (batch gradient
 * descent with L2 regularisation) plus permutation feature-importance. It is
 * deliberately transparent rather than a black box: the training loop, the
 * sigmoid, the gradient and the loss are all here to read, so the "AI" in the
 * dashboard is inspectable, testable, and reproducible — not an opaque import.
 */
import { fitStandardizer, standardize, accuracy, confusion, type Standardizer } from './metrics';
import { mulberry32, shuffle } from './rng';

export interface LogRegModel {
  weights: number[]; // one per (standardised) feature
  bias: number;
  standardizer: Standardizer;
  featureNames: string[];
  lossHistory: number[]; // cross-entropy per epoch — a real training curve
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export interface TrainOpts {
  epochs?: number;
  lr?: number; // learning rate
  l2?: number; // L2 penalty strength
}

/** Fit logistic regression on X (rows × features) with binary labels y. */
export function trainLogReg(
  X: number[][],
  y: number[],
  featureNames: string[],
  opts: TrainOpts = {},
): LogRegModel {
  const epochs = opts.epochs ?? 400;
  const lr = opts.lr ?? 0.3;
  const l2 = opts.l2 ?? 1e-3;

  const standardizer = fitStandardizer(X);
  const Xs = standardize(X, standardizer);
  const n = Xs.length;
  const d = Xs[0].length;

  let weights = new Array(d).fill(0);
  let bias = 0;
  const lossHistory: number[] = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(d).fill(0);
    let gradB = 0;
    let loss = 0;
    for (let i = 0; i < n; i++) {
      let z = bias;
      for (let j = 0; j < d; j++) z += weights[j] * Xs[i][j];
      const p = sigmoid(z);
      const err = p - y[i];
      for (let j = 0; j < d; j++) gradW[j] += (err * Xs[i][j]) / n;
      gradB += err / n;
      const eps = 1e-12;
      loss += -(y[i] * Math.log(p + eps) + (1 - y[i]) * Math.log(1 - p + eps)) / n;
    }
    for (let j = 0; j < d; j++) weights[j] -= lr * (gradW[j] + l2 * weights[j]);
    bias -= lr * gradB;
    lossHistory.push(loss);
  }

  return { weights, bias, standardizer, featureNames, lossHistory };
}

/** Predicted P(class = 1) for a single raw (un-standardised) feature row. */
export function predictProba(model: LogRegModel, row: number[]): number {
  let z = model.bias;
  for (let j = 0; j < model.weights.length; j++) {
    const xs = (row[j] - model.standardizer.mean[j]) / model.standardizer.std[j];
    z += model.weights[j] * xs;
  }
  return sigmoid(z);
}

export function predictProbaMany(model: LogRegModel, X: number[][]): number[] {
  return X.map((row) => predictProba(model, row));
}

export interface Importance {
  feature: string;
  importance: number; // accuracy drop when this feature is shuffled (permutation)
  weight: number; // standardised coefficient (sign + magnitude)
}

/**
 * Permutation importance: shuffle one feature column in the TEST set and measure
 * how much accuracy falls. A feature the decision genuinely depends on hurts a
 * lot when scrambled; an irrelevant one barely moves. This is a model-agnostic,
 * data-driven sensitivity — the ML counterpart of the analytic tornado.
 */
export function permutationImportance(
  model: LogRegModel,
  X: number[][],
  y: number[],
  seed = 11,
): Importance[] {
  const base = accuracy(confusion(y, predictProbaMany(model, X)));
  const rand = mulberry32(seed);
  return model.featureNames.map((feature, j) => {
    const col = X.map((r) => r[j]);
    const shuffled = shuffle([...col], rand);
    const Xp = X.map((r, i) => r.map((v, k) => (k === j ? shuffled[i] : v)));
    const acc = accuracy(confusion(y, predictProbaMany(model, Xp)));
    return { feature, importance: Math.max(0, base - acc), weight: model.weights[j] };
  }).sort((a, b) => b.importance - a.importance);
}
