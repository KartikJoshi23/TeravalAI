/**
 * PrintSummary (feature P2) — a clean one-page snapshot of the CURRENT live case,
 * shown only when printing (`@media print` in index.css hides the live app and
 * reveals this). Triggered by the header's "Download summary" button → the user
 * picks "Save as PDF". No new deps. Complements the fixed LaTeX report: this is a
 * live snapshot of whatever is dialled into the sliders. Every figure is grounded
 * in the deterministic engine (reuses the recommendation + board logic).
 */
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useAssumptions, useEvaluation, useBreakeven } from '../store/useEvaluation';
import { runSimulation } from '../lib/simulate';
import { buildRecommendation } from '../lib/recommendation';
import { computeBoard } from '../lib/board';
import { BASE_ASSUMPTIONS } from '../finance';
import { fmtAedM, fmtPct, fmtRatio, fmtUsdHr, fmtYears } from '../lib/format';

const ink = '#111827';
const dim = '#4b5563';
const line = '#d1d5db';

const cellLabel: CSSProperties = { fontSize: '11px', color: dim, textTransform: 'uppercase', letterSpacing: '0.04em' };
const cellValue: CSSProperties = { fontSize: '15px', fontWeight: 600, color: ink, fontFamily: 'ui-monospace, Consolas, monospace' };
const cell: CSSProperties = { border: `1px solid ${line}`, borderRadius: '6px', padding: '8px 10px' };
const h2: CSSProperties = { fontSize: '12px', fontWeight: 700, color: ink, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 8px' };

export default function PrintSummary() {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();
  const mc = useMemo(() => runSimulation(a), [a]);
  const rec = useMemo(() => buildRecommendation(a, e, breakeven, mc.probNegative), [a, e, breakeven, mc.probNegative]);
  const board = useMemo(() => computeBoard(a), [a]);

  const isBase =
    a.gpuPriceUsd === BASE_ASSUMPTIONS.gpuPriceUsd &&
    a.utilization === BASE_ASSUMPTIONS.utilization &&
    a.tariffAed === BASE_ASSUMPTIONS.tariffAed &&
    a.pue === BASE_ASSUMPTIONS.pue &&
    a.wacc === BASE_ASSUMPTIONS.wacc &&
    a.rackCostUsdM === BASE_ASSUMPTIONS.rackCostUsdM;

  const decisionLabel = e.decision === 'accept' ? 'ACCEPT' : e.decision === 'reject' ? 'REJECT' : 'CONDITIONAL';

  const drivers: [string, string][] = [
    ['GPU rental price', `${fmtUsdHr(a.gpuPriceUsd)}/GPU-hr`],
    ['Utilization', `${(a.utilization * 100).toFixed(0)}%`],
    ['Electricity tariff', `AED ${a.tariffAed.toFixed(3)}/kWh`],
    ['PUE (cooling)', a.pue.toFixed(2)],
    ['WACC (discount rate)', fmtPct(a.wacc)],
    ['GPU rack capex', `$${a.rackCostUsdM.toFixed(1)}M/rack`],
  ];

  const kpis: [string, string][] = [
    ['NPV', fmtAedM(e.npv)],
    ['IRR', fmtPct(e.irr)],
    ['MIRR', fmtPct(e.mirr)],
    ['Profitability Index', fmtRatio(e.pi)],
    ['Payback', e.payback == null ? 'never' : fmtYears(e.payback)],
    ['Break-even GPU rate', `${fmtUsdHr(breakeven)}/GPU-hr`],
  ];

  return (
    <div
      className="print-summary"
      style={{ color: ink, background: '#fff', fontFamily: "'Inter', system-ui, sans-serif", padding: '4px 2px', maxWidth: '760px' }}
    >
      <div style={{ borderBottom: `2px solid ${ink}`, paddingBottom: '8px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800 }}>Teraval — Capital-Budgeting Decision Summary</div>
        <div style={{ fontSize: '12px', color: dim, marginTop: '2px' }}>
          Barq AI · ~40&nbsp;MW AI/GPU data-center hall · Abu Dhabi · 8-year horizon · AED (figures in AED millions)
        </div>
        <div style={{ fontSize: '11px', color: dim, marginTop: '4px' }}>
          Case: <strong style={{ color: ink }}>{isBase ? 'Base assumptions' : 'Custom (sliders adjusted)'}</strong> ·
          Generated {new Date().toLocaleString('en-GB')}
        </div>
      </div>

      <div style={h2}>Assumptions (live drivers)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {drivers.map(([k, v]) => (
          <div key={k} style={cell}>
            <div style={cellLabel}>{k}</div>
            <div style={cellValue}>{v}</div>
          </div>
        ))}
      </div>

      <div style={h2}>Key metrics</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {kpis.map(([k, v]) => (
          <div key={k} style={cell}>
            <div style={cellLabel}>{k}</div>
            <div style={cellValue}>{v}</div>
          </div>
        ))}
      </div>

      <div style={h2}>Verdict</div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ ...cell, flex: 1 }}>
          <div style={cellLabel}>Scenario verdict</div>
          <div style={{ ...cellValue, fontSize: '17px' }}>{decisionLabel}</div>
        </div>
        <div style={{ ...cell, flex: 1 }}>
          <div style={cellLabel}>Board verdict (weighted)</div>
          <div style={{ ...cellValue, fontSize: '17px' }}>
            {board.verdict.label} · {board.verdict.score.toFixed(0)}/100
          </div>
        </div>
        <div style={{ ...cell, flex: 1 }}>
          <div style={cellLabel}>Monte-Carlo P(NPV&nbsp;&lt;&nbsp;0)</div>
          <div style={{ ...cellValue, fontSize: '17px' }}>{fmtPct(mc.probNegative, 0)}</div>
        </div>
      </div>

      <div style={h2}>Recommendation</div>
      <p style={{ fontSize: '13px', lineHeight: 1.5, color: ink, margin: 0 }}>{rec.body}</p>
      <p style={{ fontSize: '13px', lineHeight: 1.5, color: dim, marginTop: '6px' }}>
        <strong style={{ color: ink }}>Key risk:</strong> {rec.keyRisk}
      </p>
      {rec.stageGate && (
        <p style={{ fontSize: '13px', lineHeight: 1.5, color: dim, marginTop: '6px' }}>
          <strong style={{ color: ink }}>Stage-gate plan:</strong> {rec.stageGate}
        </p>
      )}

      <div style={{ borderTop: `1px solid ${line}`, marginTop: '16px', paddingTop: '8px', fontSize: '10px', color: dim }}>
        Figures computed by Teraval's deterministic finance engine and verified against the reference
        model. This AI-assisted appraisal advises; the final invest/reject decision rests with the
        CFO and the investment committee. · teraval
      </div>
    </div>
  );
}
