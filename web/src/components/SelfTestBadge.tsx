/**
 * SelfTestBadge — a small "model integrity" pill in the header. Runs the finance
 * identities in the browser so the app visibly attests that its own model is
 * internally consistent (the same checks the Vitest suite enforces at build time).
 */
import { useMemo } from 'react';
import { runSelfTest } from '../finance';

export default function SelfTestBadge() {
  const s = useMemo(() => runSelfTest(), []);
  return (
    <span
      title={s.checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.name} — ${c.detail}`).join('\n')}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        s.allOk ? 'border-positive/30 bg-positive/10 text-positive' : 'border-negative/30 bg-negative/10 text-negative'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.allOk ? 'bg-positive' : 'bg-negative'}`} />
      model self-test {s.passed}/{s.total}
    </span>
  );
}
