/**
 * SSE client for the Teraval assistant backend (assistant/). Adapted from the
 * provided chatbot's `api.ts` stream parser. Yields token deltas then a final
 * answer; throws on an `error` event or a transport failure so the caller can
 * fall back to the local grounded answerer.
 */
import type { AssistantContext } from './assistantContext';

const API_BASE =
  (import.meta.env.VITE_ASSISTANT_URL as string | undefined) ?? 'http://localhost:8000';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type StreamChunk = { type: 'token'; text: string } | { type: 'final'; text: string };

/** True if the backend is up and reports a configured NIM key. */
export async function assistantHealth(signal?: AbortSignal): Promise<{ ok: boolean; nim: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal });
    if (!res.ok) return { ok: false, nim: false };
    const j = (await res.json()) as { nim_configured?: boolean };
    return { ok: true, nim: !!j.nim_configured };
  } catch {
    return { ok: false, nim: false };
  }
}

export async function* streamAssistant(
  question: string,
  context: AssistantContext,
  history: AssistantTurn[],
  signal?: AbortSignal,
): AsyncGenerator<StreamChunk, void, void> {
  const res = await fetch(`${API_BASE}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context, history }),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`assistant HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  function parseBlock(raw: string): StreamChunk | null {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of raw.split('\n')) {
      if (line.startsWith(':')) continue;
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
    }
    // Per the SSE spec, consecutive data lines are joined with a newline.
    const data = dataLines.join('\n');
    if (!data) return null;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }
    if (event === 'error') throw new Error(String(parsed.message ?? 'assistant error'));
    if (event === 'token') return { type: 'token', text: String(parsed.text ?? '') };
    if (event === 'final') return { type: 'final', text: String(parsed.answer ?? '') };
    return null;
  }

  function drain(): StreamChunk[] {
    buffer = buffer.replace(/\r\n/g, '\n');
    const out: StreamChunk[] = [];
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const chunk = parseBlock(raw);
      if (chunk) out.push(chunk);
    }
    return out;
  }

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      for (const c of drain()) yield c;
    }
    const tail = parseBlock(buffer.replace(/\r\n/g, '\n').trim());
    if (tail) yield tail;
  } finally {
    // Release the HTTP connection even when an `error` event throws mid-stream
    // (or the consumer stops iterating early).
    reader.cancel().catch(() => {});
  }
}
