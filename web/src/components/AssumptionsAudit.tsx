/**
 * AssumptionsAudit — transparency + auditability. Lists the key assumptions with
 * their live values and a data-type tag (historical / current / forecast /
 * user-entered / AI-generated, per brief §3), and runs the model's integrity
 * self-test in the browser so a broken assumption fails visibly.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAssumptions } from '../store/useEvaluation';
import { runSelfTest } from '../finance';

type Tag = 'H' | 'C' | 'F' | 'U' | 'AI';
const TAG_STYLE: Record<Tag, string> = {
  H: 'text-txt-dim bg-white/5 border-glass-border',
  C: 'text-blue bg-blue/10 border-blue/30',
  F: 'text-violet bg-violet/10 border-violet/30',
  U: 'text-amber bg-amber/10 border-amber/30',
  AI: 'text-positive bg-positive/10 border-positive/30',
};
const TAG_LABEL: Record<Tag, string> = {
  H: 'Historical',
  C: 'Current',
  F: 'Forecast',
  U: 'User-entered',
  AI: 'AI-generated',
};

export default function AssumptionsAudit() {
  const a = useAssumptions();
  const selfTest = useMemo(() => runSelfTest(), []);

  const rows: { item: string; value: string; tag: Tag; source: string }[] = [
    { item: 'GPU rental price', value: `$${a.gpuPriceUsd.toFixed(2)}/GPU-hr`, tag: 'C', source: 'Cloud GPU market (H100 $2.85–3.50; GB200 premium)' },
    { item: 'Utilization', value: `${(a.utilization * 100).toFixed(0)}%`, tag: 'U', source: 'Contracted + on-demand mix assumption' },
    { item: 'Electricity tariff', value: `AED ${a.tariffAed.toFixed(3)}/kWh`, tag: 'C', source: 'Abu Dhabi industrial rate — official ADWEA figure pending (portal outage); benchmark 0.15' },
    { item: 'PUE (cooling)', value: a.pue.toFixed(2), tag: 'C', source: 'Liquid-cooled GB200 benchmark 1.05–1.20' },
    { item: 'WACC (discount rate)', value: `${(a.wacc * 100).toFixed(1)}%`, tag: 'F', source: 'CAPM; risk-free anchored to CBUAE base 3.65% / 3-mo EIBOR 3.94% (Jul 2026) + β 1.3 × ERP 6% + debt spread' },
    { item: 'Rack capex', value: `$${a.rackCostUsdM.toFixed(1)}M/rack`, tag: 'C', source: 'GB200 NVL72 all-in ~$3.1–3.9M' },
    { item: 'Facility build', value: `$${a.facilityCostUsdMPerMW}M/MW`, tag: 'C', source: 'AI-grade build, incl. liquid cooling' },
    { item: 'Project life', value: `${a.lifeYears} years`, tag: 'U', source: 'Appraisal horizon' },
    { item: 'UAE corporate tax', value: `${(a.taxRate * 100).toFixed(0)}%`, tag: 'C', source: 'Introduced 2023' },
    { item: 'GPU refresh', value: `${(a.refreshFraction * 100).toFixed(0)}% at Y${a.refreshYear}`, tag: 'F', source: 'Fast GPU obsolescence' },
    { item: 'Rental-rate forecast band', value: 'P10–P90', tag: 'AI', source: 'Mean-reverting forward path (feature F1)' },
    { item: 'Loss probability', value: 'Monte-Carlo', tag: 'AI', source: '5,000-run simulation (feature F3)' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Assumptions and audit"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-txt">Assumptions &amp; audit</h2>
          <p className="text-xs text-txt-dim">Every input, its data type (§3), and a live model-integrity check.</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            selfTest.allOk ? 'border-positive/30 bg-positive/10 text-positive' : 'border-negative/30 bg-negative/10 text-negative'
          }`}
          title={selfTest.checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.name}`).join('\n')}
        >
          {selfTest.allOk ? '✓' : '✗'} model self-test {selfTest.passed}/{selfTest.total}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(TAG_LABEL) as Tag[]).map((t) => (
          <span key={t} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TAG_STYLE[t]}`}>
            {t} · {TAG_LABEL[t]}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-txt-faint">
              <th className="pb-2 font-medium">Assumption</th>
              <th className="pb-2 text-right font-medium">Value</th>
              <th className="pb-2 pl-3 font-medium">Type</th>
              <th className="pb-2 pl-3 font-medium">Basis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item} className="border-t border-glass-border">
                <td className="py-2 pr-2 font-medium text-txt">{r.item}</td>
                <td className="py-2 text-right font-mono text-txt-dim">{r.value}</td>
                <td className="py-2 pl-3">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${TAG_STYLE[r.tag]}`}>{r.tag}</span>
                </td>
                <td className="py-2 pl-3 text-xs text-txt-faint">{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-txt-faint">
        The self-test runs financial identities live (NPV at IRR = 0; PI &gt; 1 ⇔ NPV &gt; 0;
        WACC &lt; MIRR &lt; IRR; incremental NPV agrees with the EAC advantage). If an edit ever
        breaks the model's internal logic, this badge turns red.
      </p>
    </motion.section>
  );
}
