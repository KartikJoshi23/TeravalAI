/**
 * forecaster.ts — ML-1. A trained first-order autoregression AR(1) that forecasts
 * the GPU rental-price path, fitted by ordinary least squares on a historical
 * series and validated on a held-out test window (one-step-ahead RMSE / MAPE).
 *
 * WHY IT MATTERS: the whole appraisal hinges on the GPU rental rate, and the
 * brief (§2 "forecasting cash flows", §3 "historical vs forecast vs AI-generated
 * data") wants a real, data-driven forecast — not an assumed constant. AR(1)
 *   p_t = c + φ·p_{t-1} + ε
 * is the standard mean-reverting price model: with 0<φ<1 the path reverts to a
 * long-run level c/(1−φ), and the fitted residual σ sets the confidence bands.
 *
 * DATA HONESTY: the series below is a REPRESENTATIVE monthly blended H100/A100-
 * class rental rate ($/GPU-hr), reconstructed to match publicly-reported market
 * trends 2023→2026 (a steep decline from the 2023 shortage toward a ~$3 wholesale
 * level as supply expanded). It is clearly labelled as representative, not a
 * licensed dataset, and the forecast is presented with bands, never as certainty.
 */
import { rmse, mape } from './metrics';

/** Representative monthly market rate, $/GPU-hr, Jan-2023 → Apr-2026 (40 months). */
export const HISTORICAL_GPU_PRICE: number[] = [
  5.6, 5.45, 5.55, 5.3, 5.1, 5.2, 4.95, 4.8, 4.9, 4.65, 4.5, 4.55, // 2023
  4.4, 4.25, 4.35, 4.15, 4.05, 3.95, 4.0, 3.85, 3.75, 3.8, 3.65, 3.6, // 2024
  3.55, 3.45, 3.5, 3.35, 3.3, 3.38, 3.25, 3.2, 3.28, 3.18, 3.12, 3.15, // 2025
  3.1, 3.05, 3.12, 3.08, // 2026 Jan–Apr
];

export interface Ar1Model {
  c: number; // intercept (drift)
  phi: number; // autoregressive coefficient
  sigma: number; // residual std (training)
  longRun: number; // c / (1 − φ) — the level the path reverts to
  trainRmse: number;
  testRmse: number;
  testMape: number; // held-out one-step MAPE, as a fraction
  nTrain: number;
  nTest: number;
  fittedTest: { t: number; actual: number; predicted: number }[];
}

/** Fit AR(1) by OLS on the first (1−testFraction) of the one-step pairs. */
export function fitAr1(series = HISTORICAL_GPU_PRICE, testFraction = 0.25): Ar1Model {
  // Build (prev → next) pairs, kept in time order (a time series is not shuffled).
  const xs: number[] = [];
  const ys: number[] = [];
  for (let t = 1; t < series.length; t++) {
    xs.push(series[t - 1]);
    ys.push(series[t]);
  }
  const nTest = Math.max(3, Math.round(xs.length * testFraction));
  const nTrain = xs.length - nTest;

  // OLS on the training window: slope φ = cov/var, intercept c = ȳ − φ·x̄.
  const xTr = xs.slice(0, nTrain);
  const yTr = ys.slice(0, nTrain);
  const xBar = mean(xTr);
  const yBar = mean(yTr);
  let cov = 0;
  let varx = 0;
  for (let i = 0; i < nTrain; i++) {
    cov += (xTr[i] - xBar) * (yTr[i] - yBar);
    varx += (xTr[i] - xBar) ** 2;
  }
  const phi = cov / varx;
  const c = yBar - phi * xBar;

  // Residual σ and training RMSE.
  const trainPred = xTr.map((x) => c + phi * x);
  const trainRmse = rmse(yTr, trainPred);
  const resid = yTr.map((y, i) => y - trainPred[i]);
  const sigma = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / Math.max(1, nTrain - 2));

  // Held-out one-step-ahead evaluation (uses the ACTUAL previous value each step).
  const xTe = xs.slice(nTrain);
  const yTe = ys.slice(nTrain);
  const testPred = xTe.map((x) => c + phi * x);
  const fittedTest = xTe.map((_, i) => ({ t: nTrain + i + 1, actual: yTe[i], predicted: testPred[i] }));

  return {
    c,
    phi,
    sigma,
    longRun: c / (1 - phi),
    trainRmse,
    testRmse: rmse(yTe, testPred),
    testMape: mape(yTe, testPred),
    nTrain,
    nTest,
    fittedTest,
  };
}

export interface ForecastPoint {
  step: number; // months ahead of the last observation
  mid: number;
  p10: number;
  p90: number;
}

/**
 * Deterministic forward forecast. The mean path is the AR(1) expectation
 * (reverting toward `longRun`); the bands grow with the accumulated one-step
 * variance σ²·(1 + φ² + φ⁴ + …), the exact AR(1) forecast-variance formula.
 */
export function forecast(model: Ar1Model, from: number, months: number): ForecastPoint[] {
  const out: ForecastPoint[] = [];
  let level = from;
  let varAcc = 0;
  for (let step = 1; step <= months; step++) {
    level = model.c + model.phi * level;
    varAcc = varAcc * model.phi * model.phi + model.sigma * model.sigma;
    const sd = Math.sqrt(varAcc);
    out.push({
      step,
      mid: level,
      p10: Math.max(0, level - 1.28 * sd),
      p90: level + 1.28 * sd,
    });
  }
  return out;
}

export interface ForecastSummary {
  model: Ar1Model;
  history: number[];
  path: ForecastPoint[];
  /** AI-generated estimate: forecast average over the appraisal horizon. */
  horizonMeanUsd: number;
  horizonP10: number;
  horizonP90: number;
  lastObserved: number;
}

/** Fit + forecast over the appraisal horizon (default 8 years) in one call. */
export function forecastGpuPrice(years = 8, series = HISTORICAL_GPU_PRICE): ForecastSummary {
  const model = fitAr1(series);
  const lastObserved = series[series.length - 1];
  const path = forecast(model, lastObserved, years * 12);
  const mids = path.map((p) => p.mid);
  const p10s = path.map((p) => p.p10);
  const p90s = path.map((p) => p.p90);
  return {
    model,
    history: series,
    path,
    horizonMeanUsd: mean(mids),
    horizonP10: mean(p10s),
    horizonP90: mean(p90s),
    lastObserved,
  };
}

function mean(a: number[]): number {
  return a.reduce((s, x) => s + x, 0) / a.length;
}
