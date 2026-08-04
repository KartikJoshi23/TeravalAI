/**
 * DecisionBrief — the Overview's opening context card. Before the KPIs and the
 * AI verdict, it tells a first-time reader WHAT decision this dashboard analyses,
 * WHO it is for, WHY it matters, and HOW to read the page — so the recommendation
 * lands as a conclusion, not an unexplained headline. The "at a glance" strip is
 * live (it reflects the current sliders).
 */
import { motion } from 'framer-motion';
import { useAssumptions, useEvaluation, useBreakeven } from '../store/useEvaluation';
import { fmtAedM, fmtPct, fmtUsdHr } from '../lib/format';

const VERDICT: Record<string, { label: string; cls: string }> = {
  accept: { label: 'ACCEPT — conditionally', cls: 'text-positive bg-positive/10 border-positive/30' },
  marginal: { label: 'MARGINAL — conditions apply', cls: 'text-amber bg-amber/10 border-amber/30' },
  reject: { label: 'REJECT / restructure', cls: 'text-negative bg-negative/10 border-negative/30' },
};

export default function DecisionBrief() {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();
  const v = VERDICT[e.decision] ?? VERDICT.accept;
  const irrOk = Number.isFinite(e.irr) && e.irr > a.wacc;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass p-5 md:p-6"
      aria-label="Decision brief"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded bg-violet/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet">
          Decision brief
        </span>
        <span className="text-[11px] text-txt-faint">Barq AI · capital-budgeting appraisal · figures in AED millions</span>
      </div>

      <h1 className="text-xl font-semibold text-txt md:text-2xl">
        Should Barq AI build &amp; own a 40&nbsp;MW AI/GPU data-centre hall in Abu Dhabi?
      </h1>

      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-txt-dim">
        Barq AI must decide whether to commit roughly <span className="text-txt">AED&nbsp;5.8&nbsp;billion</span> to
        build and operate a 40&nbsp;MW GPU data centre for <span className="text-txt">8&nbsp;years</span>, renting
        its compute to AI customers. It is a <span className="text-txt">bet-the-company</span> decision: the payoff
        hinges on the GPU rental rate — which fell from about $8 to roughly $2.85–3.50/GPU-hr — while Abu Dhabi&apos;s
        cheap power and the UAE&apos;s push to become an AI hub work in its favour. This dashboard answers the
        question with numbers rather than gut feel.
      </p>

      {/* Live "at a glance" strip */}
      <div className="mt-4 flex flex-wrap items-stretch gap-3">
        <div className={`flex flex-col justify-center rounded-xl border px-4 py-2 ${v.cls}`}>
          <span className="text-[10px] uppercase tracking-wider opacity-80">Current verdict</span>
          <span className="text-lg font-semibold leading-tight">{v.label}</span>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-glass-border bg-white/5 px-4 py-2 text-sm">
          <span className="text-txt-dim">
            NPV <span className="font-mono font-semibold text-txt">{fmtAedM(e.npv)}</span>
          </span>
          <span className="text-txt-dim">
            IRR <span className={`font-mono font-semibold ${irrOk ? 'text-positive' : 'text-negative'}`}>{fmtPct(e.irr)}</span>{' '}
            vs {fmtPct(a.wacc)} WACC
          </span>
          <span className="text-txt-dim">
            Break-even <span className="font-mono font-semibold text-amber">{fmtUsdHr(breakeven)}/hr</span>
          </span>
          <span className="text-txt-faint">margin of safety is thin — see the tabs to stress-test it</span>
        </div>
      </div>

      {/* How to read this page */}
      <p className="mt-4 border-t border-glass-border pt-3 text-xs leading-relaxed text-txt-faint">
        <span className="font-semibold text-txt-dim">How to read this page:</span> the{' '}
        <span className="text-txt-dim">KPI cards</span> are the scorecard (each says what it means and whether it
        points to accept or reject); the <span className="text-txt-dim">3D hall</span> is the asset itself, reacting
        live to your assumptions (racks brighten with utilisation, the plume warms as cooling gets less efficient);
        the <span className="text-txt-dim">AI recommendation</span> below synthesises all of it. Use the tabs to go
        deeper — cash flow, build-vs-rent, scenarios, the machine-learning models, and the board &amp; ethics review.
      </p>
    </motion.section>
  );
}
