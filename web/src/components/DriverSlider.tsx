/** DriverSlider — one live driver control; writes straight to the store via setDriver. */
import type { DriverDef } from '../lib/drivers';
import { useModelStore } from '../store/useModelStore';

export default function DriverSlider({ def }: { def: DriverDef }) {
  const value = useModelStore((s) => s.assumptions[def.key]) as number;
  const setDriver = useModelStore((s) => s.setDriver);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-xs text-txt-dim">{def.label}</label>
        <span className="font-mono text-xs font-medium" style={{ color: def.accent }}>
          {def.fmt(value)}
        </span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => setDriver(def.key, Number(e.target.value))}
        aria-label={def.label}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10"
        style={{ accentColor: def.accent }}
      />
    </div>
  );
}
