/**
 * DataProvenance — real official data backing the assumptions. The interest-rate
 * anchors were sourced from the Central Bank of the UAE (evidence in datasets/);
 * the Abu Dhabi industrial tariff is still pending a portal outage and shown as
 * such. Keeps the dashboard honest about what is official vs. benchmark.
 */
import { motion } from 'framer-motion';

interface Source {
  figure: string;
  value: string;
  status: 'official' | 'pending';
  source: string;
  date: string;
  feeds: string;
  evidence?: string;
}

const SOURCES: Source[] = [
  {
    figure: 'CBUAE Base Rate',
    value: '3.65%',
    status: 'official',
    source: 'Central Bank of the UAE — Press Release "CBUAE Maintains The Base Rate At 3.65%"',
    date: '29 Jul 2026',
    feeds: 'Risk-free anchor in the WACC build-up',
    evidence: 'datasets/interest-rates/cbuae-base-rate-2026.png',
  },
  {
    figure: '3-month EIBOR',
    value: '3.94%',
    status: 'official',
    source: 'Central Bank of the UAE — EIBOR Rates table',
    date: '31 Jul 2026',
    feeds: 'Benchmark for the cost of debt (+ project spread) in the WACC',
    evidence: 'datasets/interest-rates/cbuae-eibor-2026.pdf',
  },
  {
    figure: 'Abu Dhabi industrial electricity tariff',
    value: 'AED 0.15/kWh (benchmark)',
    status: 'pending',
    source: 'Official: Abu Dhabi Open Data — "Electricity Tariff by Authority, slab & sector (ADWEA)" (portal outage on 2026-08-02; retry / DoE Abu Dhabi)',
    date: '—',
    feeds: 'Energy operating cost',
  },
];

export default function DataProvenance() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Data provenance"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-txt">Data provenance — official sources</h2>
          <span className="rounded bg-positive/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-positive">
            Real data
          </span>
        </div>
        <p className="mt-1 text-xs text-txt-dim">
          Interest-rate anchors are official CBUAE figures (evidence in{' '}
          <span className="font-mono">datasets/</span>); the tariff is pending a portal outage.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SOURCES.map((s) => (
          <div key={s.figure} className="rounded-lg border border-glass-border bg-white/5 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-txt">{s.figure}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    s.status === 'official'
                      ? 'border-positive/30 bg-positive/10 text-positive'
                      : 'border-amber/30 bg-amber/10 text-amber'
                  }`}
                >
                  {s.status === 'official' ? '✓ official' : 'pending'}
                </span>
              </div>
              <span className="font-mono text-sm font-semibold text-txt">{s.value}</span>
            </div>
            <div className="mt-1.5 text-xs text-txt-dim">{s.source}{s.date !== '—' && <span className="text-txt-faint"> · {s.date}</span>}</div>
            <div className="mt-1 text-[11px] text-txt-faint">Feeds: {s.feeds}{s.evidence && <> · evidence: <span className="font-mono">{s.evidence}</span></>}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-blue/25 bg-blue/5 p-4 text-xs text-txt-dim">
        <span className="font-medium text-blue">WACC note. </span>
        Anchoring the CAPM build-up to the official rates (risk-free ≈ CBUAE base 3.65% / 3-mo
        EIBOR 3.94%, plus an equity risk premium of β&nbsp;1.3&nbsp;×&nbsp;6% and a debt spread)
        implies a WACC near 8.6%. Teraval <span className="text-txt">conservatively retains a 9%
        hurdle</span> — a tougher test — so the accept verdict is, if anything, understated.
      </div>
    </motion.section>
  );
}
