/**
 * EthicsPanel — the brief's §8 "Ethical Use of AI", specific to this project. Each
 * risk is paired with the concrete mitigation Teraval actually implements, and the
 * accountability line is explicit: the AI advises, the CFO decides.
 */
import { motion } from 'framer-motion';

interface Item {
  title: string;
  risk: string;
  mitigation: string;
}

const ITEMS: Item[] = [
  {
    title: 'Accuracy of AI estimates',
    risk: 'GPU rental-rate and utilization forecasts are extrapolations of a volatile, immature market — a point forecast could badly mislead.',
    mitigation: 'Forecasts are shown as P10–P90 bands, never as certainty; every headline number comes from the deterministic engine, not the model.',
  },
  {
    title: 'AI hallucination',
    risk: 'An LLM assistant can invent plausible-sounding figures.',
    mitigation: 'The assistant is grounded: it is handed the live computed model state and instructed to narrate only — it never generates numbers itself.',
  },
  {
    title: 'Risk of incorrect data',
    risk: 'A wrong tariff, price or capex silently flips the verdict.',
    mitigation: 'Assumptions are transparent, source-tagged and user-overridable; a rule-based checker flags values outside credible ranges (see Assumptions & audit).',
  },
  {
    title: 'Bias in forecasts',
    risk: 'A bull-market bias could inflate revenue assumptions.',
    mitigation: 'The pessimistic scenario and a 5,000-run Monte-Carlo stress the downside explicitly, and the recommendation leads with the probability of loss.',
  },
  {
    title: 'Confidentiality',
    risk: 'Capex and pricing assumptions are commercially sensitive.',
    mitigation: 'The model runs client-side; only the user\'s own NVIDIA NIM endpoint sees a question, and no data is sent to third parties.',
  },
  {
    title: 'Human review & responsibility',
    risk: 'Over-reliance on an automated recommendation.',
    mitigation: 'Every recommendation states that the final invest/reject decision rests with the CFO and investment committee — the AI supports the decision, it does not make it.',
  },
];

export default function EthicsPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass p-5"
      aria-label="Ethical use of AI"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-txt">Ethical use of AI</h2>
          <span className="rounded bg-violet/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet">
            §8
          </span>
        </div>
        <p className="mt-1 text-xs text-txt-dim">Each risk, and the concrete mitigation Teraval implements.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ITEMS.map((it) => (
          <div key={it.title} className="rounded-lg border border-glass-border bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-txt">{it.title}</h3>
            <p className="mt-1.5 text-xs text-txt-dim">
              <span className="font-medium text-amber">Risk. </span>
              {it.risk}
            </p>
            <p className="mt-1.5 text-xs text-txt-dim">
              <span className="font-medium text-positive">Mitigation. </span>
              {it.mitigation}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-blue/25 bg-blue/5 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-blue">Accountability</div>
        <p className="mt-1 text-sm text-txt-dim">
          Teraval is a decision-support tool. The AI automates the arithmetic, surfaces risk and
          explains the result — but the responsibility for the final financial decision remains
          with the human financial manager, not the AI system.
        </p>
      </div>
    </motion.section>
  );
}
