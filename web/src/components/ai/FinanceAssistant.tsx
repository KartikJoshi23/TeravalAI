/**
 * FinanceAssistant (feature F4) — the NIM-backed chat. It sends the live,
 * engine-computed model state as grounding context to the assistant backend and
 * streams the reply. If the backend is down or has no NIM key, it falls back to
 * a local, engine-grounded answerer so the chat still works. Numbers always come
 * from the deterministic engine; the model only narrates.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAssumptions, useEvaluation, useBreakeven } from '../../store/useEvaluation';
import { runSimulation } from '../../lib/simulate';
import { buildAssistantContext } from '../../lib/assistantContext';
import { streamAssistant, assistantHealth } from '../../lib/assistantApi';
import type { AssistantTurn } from '../../lib/assistantApi';
import { answerLocally } from '../../lib/assistantFallback';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const SAMPLES = [
  "What is the project's NPV and should we accept it?",
  'What GPU rental rate makes this break even?',
  'Which assumption matters most?',
  'Explain IRR to a non-finance director.',
  "What's the probability the project loses money?",
  'Why is the pessimistic scenario a reject?',
];

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random());

const INTRO: Msg = {
  id: 'intro',
  role: 'assistant',
  text:
    "Hi — I'm the Teraval finance assistant. Ask me about the appraisal (NPV, IRR, break-even, " +
    'the most sensitive driver, scenarios or risk). Every number I quote comes from the live model.',
};

export default function FinanceAssistant() {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();
  const mc = useMemo(() => runSimulation(a, 7, 2000), [a]);

  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'checking' | 'llm' | 'offline'>('checking');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    assistantHealth().then((h) => {
      if (alive) setMode(h.ok && h.nim ? 'llm' : 'offline');
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const priorHistory: AssistantTurn[] = messages
      .filter((m) => m.id !== 'intro')
      .map((m) => ({ role: m.role, content: m.text }));
    const asstId = uid();
    setMessages((m) => [...m, { id: uid(), role: 'user', text: q }, { id: asstId, role: 'assistant', text: '' }]);
    setInput('');
    setBusy(true);

    const ctx = buildAssistantContext(a, e, breakeven, mc.probNegative);
    try {
      let acc = '';
      for await (const chunk of streamAssistant(q, ctx, priorHistory)) {
        if (chunk.type === 'token') acc += chunk.text;
        else if (chunk.type === 'final' && chunk.text) acc = chunk.text;
        const shown = acc;
        setMessages((m) => m.map((x) => (x.id === asstId ? { ...x, text: shown } : x)));
      }
      if (!acc.trim()) throw new Error('empty response');
      setMode('llm');
    } catch {
      const local = answerLocally(q, ctx);
      setMessages((m) => m.map((x) => (x.id === asstId ? { ...x, text: local } : x)));
      setMode('offline');
    } finally {
      setBusy(false);
    }
  }

  const badge =
    mode === 'llm'
      ? { text: 'NIM connected', cls: 'text-positive bg-positive/10 border-positive/30' }
      : mode === 'offline'
        ? { text: 'grounded offline', cls: 'text-amber bg-amber/10 border-amber/30' }
        : { text: 'connecting…', cls: 'text-txt-dim bg-white/5 border-glass-border' };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass flex flex-col p-5"
      aria-label="AI finance assistant"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-txt">AI Finance Assistant</h2>
          <span className="rounded bg-blue/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue">
            AI · F4 · NIM
          </span>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      {/* messages */}
      <div className="mb-3 h-[300px] overflow-y-auto rounded-lg border border-glass-border bg-black/20 p-3">
        <div className="flex flex-col gap-2.5">
          {messages.map((m) => (
            <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-blue/20 px-3 py-2 text-sm text-txt'
                    : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-glass-border bg-white/5 px-3 py-2 text-sm text-txt-dim'
                }
              >
                {m.text || (busy ? <span className="text-txt-faint">…thinking</span> : '')}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* sample chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => send(s)}
            className="rounded-full border border-glass-border px-2.5 py-1 text-[11px] text-txt-dim transition-colors hover:border-blue/50 hover:text-txt disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {/* composer */}
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(ev) => setInput(ev.target.value)}
          placeholder="Ask about the appraisal…"
          className="flex-1 rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm text-txt placeholder:text-txt-faint focus:border-blue/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg border border-blue/40 bg-blue/15 px-4 py-2 text-sm font-medium text-blue transition-colors hover:bg-blue/25 disabled:opacity-40"
        >
          Send
        </button>
      </form>

      <p className="mt-3 text-[11px] text-txt-faint">
        Answers are grounded in the live engine state; the model narrates and never invents figures.
        The final decision rests with the CFO.
      </p>
    </motion.section>
  );
}
