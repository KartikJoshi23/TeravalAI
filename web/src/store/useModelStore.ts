/**
 * useModelStore — the single live copy of the model's Assumptions.
 *
 * Seeded from the verified BASE_ASSUMPTIONS. Stage 3's sliders will call
 * `setDriver` / `setAssumptions`; every consumer (KPI cards, charts, panels)
 * recomputes from this store, so the whole dashboard stays in sync with one
 * source of input truth.
 */
import { create } from 'zustand';
import type { Assumptions } from '../finance';
import { BASE_ASSUMPTIONS } from '../finance';

interface ModelState {
  assumptions: Assumptions;
  /** Set one driver (used by the Stage-3 sliders). */
  setDriver: <K extends keyof Assumptions>(key: K, value: Assumptions[K]) => void;
  /** Patch several assumptions at once (e.g. apply a scenario). */
  setAssumptions: (patch: Partial<Assumptions>) => void;
  /** Restore the verified base case. */
  reset: () => void;
}

export const useModelStore = create<ModelState>((set) => ({
  assumptions: BASE_ASSUMPTIONS,
  setDriver: (key, value) =>
    set((s) => ({ assumptions: { ...s.assumptions, [key]: value } })),
  setAssumptions: (patch) =>
    set((s) => ({ assumptions: { ...s.assumptions, ...patch } })),
  reset: () => set({ assumptions: BASE_ASSUMPTIONS }),
}));
