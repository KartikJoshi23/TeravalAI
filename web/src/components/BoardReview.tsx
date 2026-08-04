/**
 * BoardReview (feature P1) — the Departmental Review Board tab. Five departments
 * each score the SAME live model state via a deterministic rule, take a stance,
 * and a weighted board verdict aggregates them — all recomputing as sliders move.
 * Every figure is grounded in the finance engine (see lib/board.ts).
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAssumptions } from '../store/useEvaluation';
import { computeBoard } from '../lib/board';
import type { Stance } from '../lib/board';

const STANCE: Record<Stance, { label: string; cls: string; dot: string; bar: string }> = {
  supports: { label: 'Supports', cls: 'text-positive border-positive/40 bg-positive/10', dot: 'bg-positive', bar: 'bg-positive' },
  conditional: { label: 'Supports w/ conditions', cls: 'text-amber border-amber/40 bg-amber/10', dot: 'bg-amber', bar: 'bg-amber' },
  opposes: { label: 'Opposes', cls: 'text-negative border-negative/40 bg-negative/10', dot: 'bg-negative', bar: 'bg-negative' },
};

const VERDICT_CLS: Record<Stance, string> = {
  supports: 'text-positive border-positive/40 bg-positive/10',
  conditional: 'text-amber border-amber/40 bg-amber/10',
  opposes: 'text-negative border-negative/40 bg-negative/10',
};

export default function BoardReview() {
  const a = useAssumptions();
  const board = useMemo(() => computeBoard(a), [a]);
  const v = board.verdict;

  return (
    <>
      {/* Verdict banner */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass p-5"
        aria-label="Board verdict"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-txt">Departmental Review Board</h2>
            <p className="max-w-2xl text-xs text-txt-dim">
              Five departments each score the live case; a weighted verdict aggregates them.
            </p>
          </div>
          <div
            className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 ${VERDICT_CLS[v.stance]}`}
          >
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">Board verdict</div>
              <div className="text-lg font-bold tracking-wide">{v.label}</div>
            </div>
            <div className="border-l border-current/30 pl-3 text-center">
              <div className="font-mono text-2xl font-semibold">{v.score.toFixed(0)}</div>
              <div className="text-[10px] opacity-80">/100</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Supports" value={`${v.counts.supports}`} tone="text-positive" />
          <Stat label="With conditions" value={`${v.counts.conditional}`} tone="text-amber" />
          <Stat label="Opposes" value={`${v.counts.opposes}`} tone="text-negative" />
          <Stat
            label="Spread (high–low)"
            value={`${v.mostSupportive.score}–${v.leastSupportive.score}`}
            tone="text-txt"
            sub={`${v.mostSupportive.name.split(' ')[0]} ↔ ${v.leastSupportive.name.split(' ')[0]}`}
          />
        </div>
      </motion.section>

      {/* Department cards */}
      <section aria-label="Department positions" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {board.departments.map((d, i) => {
          const s = STANCE[d.stance];
          return (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
              className="glass flex flex-col p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.accent }} />
                    <h3 className="font-semibold text-txt">{d.name}</h3>
                    <span className="text-[10px] text-txt-faint">· weight {Math.round(d.weight * 100)}%</span>
                  </div>
                  <p className="mt-0.5 text-xs text-txt-dim">{d.mandate}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
                  <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${s.dot}`} />
                  {s.label}
                </span>
              </div>

              {/* score bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className={`h-full rounded-full ${s.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="font-mono text-sm font-semibold text-txt">{d.score}<span className="text-txt-faint">/100</span></span>
              </div>

              <ul className="mt-3 flex flex-col gap-1 text-xs text-txt-dim">
                {d.concerns.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-txt-faint" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-glass-border bg-white/5 p-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-txt-faint">Conditions</div>
                  <ul className="mt-1 flex flex-col gap-1 text-txt-dim">
                    {d.conditions.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div className={`rounded-lg border p-2.5 ${d.nonNegotiableMet ? 'border-positive/25 bg-positive/5' : 'border-amber/25 bg-amber/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-txt-faint">Non-negotiable</span>
                    <span className={`text-[10px] font-semibold ${d.nonNegotiableMet ? 'text-positive' : 'text-amber'}`}>
                      {d.nonNegotiableMet ? 'met' : 'required'}
                    </span>
                  </div>
                  <p className="mt-1 text-txt-dim">{d.nonNegotiable}</p>
                </div>
              </div>

              <p className="mt-3 border-t border-glass-border pt-2.5 text-[11px] text-txt-faint">
                <span className="font-medium text-txt-dim">What would change its position: </span>
                {d.whatWouldChange}
              </p>
            </motion.div>
          );
        })}
      </section>
    </>
  );
}

function Stat({ label, value, tone, sub }: { label: string; value: string; tone: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-glass-border bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-wider text-txt-faint">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-txt-faint">{sub}</div>}
    </div>
  );
}
