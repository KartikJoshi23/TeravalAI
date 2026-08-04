/**
 * rng.ts — a small seedable PRNG (mulberry32) + sampling helpers, so every model
 * here trains on reproducible data: same seed ⇒ identical dataset, split, and
 * fitted weights. Reproducibility is what lets the tests pin real train/test
 * metrics, and what makes the "AI-generated estimates" defensible rather than a
 * different number on every reload.
 */

/** Deterministic PRNG in [0,1). Mirrors the finance engine's own mulberry32. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform sample in [lo, hi). */
export function uniform(rand: () => number, lo: number, hi: number): number {
  return lo + (hi - lo) * rand();
}

/** In-place Fisher–Yates shuffle driven by the seeded PRNG. */
export function shuffle<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
