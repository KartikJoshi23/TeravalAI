/**
 * KpiGrid — the six headline capital-budgeting KPIs, fed live from the finance
 * engine via the store selectors. NPV · IRR · MIRR · PI · Payback · Break-even.
 */
import KpiCard from './KpiCard';
import type { KpiCardProps } from './KpiCard';
import { useAssumptions, useEvaluation, useBreakeven } from '../store/useEvaluation';
import { fmtAedM, fmtPct, fmtRatio, fmtYears, fmtUsdHr } from '../lib/format';

const BLUE = '#2dd4bf';
const VIOLET = '#a78bfa';
const AMBER = '#fbbf24';

export default function KpiGrid() {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();

  const cards: Omit<KpiCardProps, 'index'>[] = [
    {
      label: 'Net Present Value',
      target: e.npv,
      format: fmtAedM,
      tone: e.npv > 0 ? 'positive' : 'negative',
      accent: BLUE,
      signal: e.npv > 0 ? 'Positive → creates value → accept' : 'Negative → destroys value → reject',
    },
    {
      label: 'IRR',
      target: e.irr,
      format: (n) => fmtPct(n),
      tone: Number.isFinite(e.irr) && e.irr > a.wacc ? 'positive' : 'negative',
      accent: VIOLET,
      signal: `vs ${fmtPct(a.wacc)} WACC → ${Number.isFinite(e.irr) && e.irr > a.wacc ? 'accept' : 'reject'}`,
    },
    {
      label: 'MIRR',
      target: e.mirr,
      format: (n) => fmtPct(n),
      tone: Number.isFinite(e.mirr) && e.mirr > a.wacc ? 'positive' : 'negative',
      accent: VIOLET,
      signal: `reinvest-adjusted return vs ${fmtPct(a.wacc)} WACC`,
    },
    {
      label: 'Profitability Index',
      target: e.pi,
      format: (n) => fmtRatio(n),
      tone: e.pi > 1 ? 'positive' : 'negative',
      accent: BLUE,
      signal: e.pi > 1 ? '> 1 → value per AED invested → accept' : '< 1 → below cost → reject',
    },
    {
      label: 'Payback',
      target: e.payback ?? NaN,
      format: fmtYears,
      // Tone and signal read the SAME facts so the card can't show a green
      // headline next to a "never recovers" caption (possible when the
      // undiscounted payback exists but the discounted one doesn't).
      tone:
        e.payback == null
          ? 'negative'
          : e.discountedPayback == null || e.payback > a.lifeYears
            ? 'warning'
            : 'positive',
      accent: AMBER,
      signal:
        e.payback == null
          ? 'never recovers within horizon'
          : e.discountedPayback == null
            ? 'discounted: never within horizon'
            : `discounted ${fmtYears(e.discountedPayback)} · ${a.lifeYears}-yr life`,
    },
    {
      label: 'Break-even GPU rate',
      target: breakeven,
      format: (n) => fmtUsdHr(n),
      unit: '/GPU-hr',
      tone: 'warning',
      accent: AMBER,
      signal: 'market ≈ $2.85–3.50/hr → knife-edge',
    },
  ];

  return (
    <section aria-label="Key decision metrics">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c, i) => (
          <KpiCard key={c.label} index={i} {...c} />
        ))}
      </div>
    </section>
  );
}
