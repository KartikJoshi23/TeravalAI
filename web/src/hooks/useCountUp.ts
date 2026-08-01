/**
 * useCountUp — animate a number from 0 to `target` with GSAP (per the plan's
 * "animated counters (GSAP)"). Returns the current animated value; the caller
 * formats each frame. Non-finite targets are passed straight through so callers
 * can render "n/a" without animating.
 */
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function useCountUp(target: number, duration = 1.4): number {
  const [value, setValue] = useState(0);
  // The last displayed value, so live changes tween from where we are (not 0).
  const current = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setValue(target);
      current.current = 0;
      return;
    }
    // Respect reduced-motion: land on the value immediately, no animation.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(target);
      current.current = target;
      return;
    }
    const obj = { v: current.current };
    const tween = gsap.to(obj, {
      v: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        current.current = obj.v;
        setValue(obj.v);
      },
    });
    return () => {
      tween.kill();
    };
  }, [target, duration]);

  return value;
}
