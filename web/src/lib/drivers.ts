/**
 * The six live driver definitions shared by the sensitivity sliders and the
 * tornado chart. `low`/`high` map the current value to the tornado's down/up
 * test points; `swing` is the human label for that move.
 */
import type { Assumptions } from '../finance';

export interface DriverDef {
  key: keyof Assumptions;
  label: string;
  min: number;
  max: number;
  step: number;
  accent: string;
  swing: string;
  fmt: (v: number) => string;
  low: (v: number) => number;
  high: (v: number) => number;
}

const BLUE = '#38bdf8';
const VIOLET = '#a78bfa';
const AMBER = '#fbbf24';

export const DRIVERS: DriverDef[] = [
  {
    key: 'gpuPriceUsd',
    label: 'GPU rental price',
    min: 2,
    max: 8,
    step: 0.05,
    accent: BLUE,
    swing: '±20%',
    fmt: (v) => `$${v.toFixed(2)}/hr`,
    low: (v) => v * 0.8,
    high: (v) => v * 1.2,
  },
  {
    key: 'utilization',
    label: 'Utilization',
    min: 0.5,
    max: 0.98,
    step: 0.01,
    accent: VIOLET,
    swing: '±10pp',
    fmt: (v) => `${(v * 100).toFixed(0)}%`,
    low: (v) => Math.max(0.4, v - 0.1),
    high: (v) => Math.min(1, v + 0.1),
  },
  {
    key: 'wacc',
    label: 'WACC (discount rate)',
    min: 0.05,
    max: 0.16,
    step: 0.0025,
    accent: VIOLET,
    swing: '±2pp',
    fmt: (v) => `${(v * 100).toFixed(1)}%`,
    low: (v) => Math.max(0.02, v - 0.02),
    high: (v) => v + 0.02,
  },
  {
    key: 'tariffAed',
    label: 'Electricity tariff',
    min: 0.08,
    max: 0.4,
    step: 0.005,
    accent: AMBER,
    swing: '±20%',
    fmt: (v) => `AED ${v.toFixed(3)}`,
    low: (v) => v * 0.8,
    high: (v) => v * 1.2,
  },
  {
    key: 'pue',
    label: 'PUE (cooling)',
    min: 1.05,
    max: 1.6,
    step: 0.01,
    accent: AMBER,
    swing: '±0.1',
    fmt: (v) => v.toFixed(2),
    low: (v) => Math.max(1.05, v - 0.1),
    high: (v) => v + 0.1,
  },
  {
    key: 'rackCostUsdM',
    label: 'GPU rack capex',
    min: 2,
    max: 6,
    step: 0.1,
    accent: BLUE,
    swing: '±20%',
    fmt: (v) => `$${v.toFixed(1)}M/rack`,
    low: (v) => v * 0.8,
    high: (v) => v * 1.2,
  },
];
