/**
 * AssistantWidget — a floating AI Finance Assistant available on every tab.
 *
 * A creative pulsing launcher sits bottom-right (like a site chat widget). The
 * panel is tab-aware: a "This tab / Whole model" scope toggle decides whether the
 * question is grounded with the current tab's focus (so "what does this chart
 * mean?" is answered about the view you're on). Numbers always come from the
 * deterministic engine; the LLM (or the offline fallback) only narrates. If the
 * NIM backend is down or keyless, it falls back to a local grounded answerer.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAssumptions, useEvaluation, useBreakeven } from '../../store/useEvaluation';
import { runSimulation } from '../../lib/simulate';
import { buildAssistantContext } from '../../lib/assistantContext';
import { streamAssistant, assistantHealth } from '../../lib/assistantApi';
import type { AssistantTurn } from '../../lib/assistantApi';
import { answerLocally } from '../../lib/assistantFallback';
import { tabInfo } from '../../lib/tabContext';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random());

const GENERIC_SAMPLES = [
  "What is the project's NPV and should we accept it?",
  'What GPU rental rate makes this break even?',
  'Which assumption matters most?',
];

const INTRO: Msg = {
  id: 'intro',
  role: 'assistant',
  text:
    "Hi — I'm the Teraval assistant. Ask about any view; every number I quote comes from the live model. Use the toggle to focus on this tab or the whole appraisal.",
};

/** The animated launcher mark — a lightning "spark" (echoing Barq) in a glass orb. */
function SparkMark() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden>
      <defs>
        <linearGradient id="tv-spark" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <path
        d="M13.2 2.2 5.4 13.1a.7.7 0 0 0 .57 1.1h4.16l-1.5 7.03a.4.4 0 0 0 .72.3l8.06-11.02a.7.7 0 0 0-.57-1.11h-4.2l1.3-5.9a.4.4 0 0 0-.74-.31Z"
        fill="url(#tv-spark)"
      />
      <circle cx="18.5" cy="5.5" r="1.15" fill="#e7e9f3" />
    </svg>
  );
}

export default function AssistantWidget({ currentTab }: { currentTab: string }) {
  const a = useAssumptions();
  const e = useEvaluation();
  const breakeven = useBreakeven();
  const mc = useMemo(() => runSimulation(a, 7, 2000), [a]);

  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<'tab' | 'model'>('tab');
  const [nim, setNim] = useState<'checking' | 'llm' | 'offline'>('checking');
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const info = tabInfo(currentTab);
  const samples = scope === 'tab' ? info.samples : GENERIC_SAMPLES;

  useEffect(() => {
    let alive = true;
    assistantHealth().then((h) => alive && setNim(h.ok && h.nim ? 'llm' : 'offline'));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

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

    const focus = scope === 'tab' ? { tab: currentTab, label: info.label, description: info.description } : undefined;
    const ctx = buildAssistantContext(a, e, breakeven, mc.probNegative, focus);
    try {
      let acc = '';
      for await (const chunk of streamAssistant(q, ctx, priorHistory)) {
        if (chunk.type === 'token') acc += chunk.text;
        else if (chunk.type === 'final' && chunk.text) acc = chunk.text;
        const shown = acc;
        setMessages((m) => m.map((x) => (x.id === asstId ? { ...x, text: shown } : x)));
      }
      if (!acc.trim()) throw new Error('empty');
      setNim('llm');
    } catch {
      const local = answerLocally(q, ctx);
      setMessages((m) => m.map((x) => (x.id === asstId ? { ...x, text: local } : x)));
      setNim('offline');
    } finally {
      setBusy(false);
    }
  }

  const canClear = messages.length > 1 && !busy;
  const clearChat = () => setMessages([INTRO]);

  const badge =
    nim === 'llm'
      ? { text: 'NIM connected', cls: 'text-positive bg-positive/10 border-positive/30' }
      : nim === 'offline'
        ? { text: 'grounded offline', cls: 'text-amber bg-amber/10 border-amber/30' }
        : { text: 'connecting…', cls: 'text-txt-dim bg-white/5 border-glass-border' };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="glass mb-3 flex h-[520px] w-[min(370px,calc(100vw-3rem))] flex-col p-4"
            aria-label="AI finance assistant"
          >
            {/* header */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5">
                  <SparkMark />
                </span>
                <h2 className="text-sm font-semibold text-txt">Teraval Assistant</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                  {badge.text}
                </span>
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={!canClear}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  className="rounded-md border border-glass-border px-1.5 py-0.5 text-[11px] text-txt-dim transition-colors hover:text-txt disabled:opacity-30"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  className="rounded-md border border-glass-border px-1.5 text-txt-dim hover:text-txt"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* scope toggle */}
            <div className="mb-3 flex items-center gap-1 rounded-lg border border-glass-border bg-black/20 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setScope('tab')}
                className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${
                  scope === 'tab' ? 'bg-blue/20 text-txt' : 'text-txt-dim hover:text-txt'
                }`}
              >
                This tab · {info.label}
              </button>
              <button
                type="button"
                onClick={() => setScope('model')}
                className={`flex-1 rounded-md px-2 py-1 font-medium transition-colors ${
                  scope === 'model' ? 'bg-blue/20 text-txt' : 'text-txt-dim hover:text-txt'
                }`}
              >
                Whole model
              </button>
            </div>

            {/* messages */}
            <div className="mb-3 flex-1 overflow-y-auto rounded-lg border border-glass-border bg-black/20 p-3">
              <div className="flex flex-col gap-2.5">
                {messages.map((m) => (
                  <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        m.role === 'user'
                          ? 'max-w-[82%] rounded-2xl rounded-br-sm bg-blue/20 px-3 py-2 text-sm text-txt'
                          : 'max-w-[88%] rounded-2xl rounded-bl-sm border border-glass-border bg-white/5 px-3 py-2 text-sm text-txt-dim'
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
            <div className="mb-2 flex flex-wrap gap-1.5">
              {samples.map((s) => (
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
                placeholder={scope === 'tab' ? `Ask about ${info.label}…` : 'Ask about the appraisal…'}
                className="flex-1 rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm text-txt placeholder:text-txt-faint focus:border-blue/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-lg border border-blue/40 bg-blue/15 px-3.5 py-2 text-sm font-medium text-blue transition-colors hover:bg-blue/25 disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open AI assistant'}
        className="group relative grid h-14 w-14 place-items-center rounded-full border border-glass-border bg-gradient-to-br from-blue/25 via-violet/20 to-amber/15 shadow-[0_10px_30px_-8px_rgba(56,189,248,0.5)] backdrop-blur-md transition-transform hover:scale-105"
      >
        {/* pulsing halo */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full border border-blue/40"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.7 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <SparkMark />
        {/* status dot */}
        <span
          className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-bg ${
            nim === 'llm' ? 'bg-positive' : nim === 'offline' ? 'bg-amber' : 'bg-txt-faint'
          }`}
        />
      </button>
    </div>
  );
}
