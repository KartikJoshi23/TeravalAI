# Teraval AI Finance Assistant (NVIDIA NIM)

A thin FastAPI service that backs the dashboard's **AI Finance Assistant** chat.
Adapted from the provided Gen-AI Chatbot — we keep the OpenAI-client pattern and
the chat/SSE contract, and strip the TechNova SQL / RAG / Qdrant / Redis / LangGraph
stack. NVIDIA NIM is OpenAI-API-compatible, so the client just repoints
`base_url` / `api_key` / `model`.

## Grounding

Numbers are **not** produced by the LLM. The dashboard computes every figure with
the deterministic finance engine (`web/src/finance/`) and sends them to
`/api/chat/message` as the request `context`. The system prompt pins the model to
those figures; the LLM only explains and narrates. If the backend is unreachable,
the dashboard falls back to a local, engine-grounded answerer so the assistant
still works (just without natural-language phrasing).

## Run

```bash
cd assistant
python -m venv .venv && . .venv/Scripts/activate   # Windows; use .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env        # then paste the NIM key into assistant/.env (Kartik supplies it)
uvicorn app.main:app --reload --port 8000
```

Check it: `GET http://localhost:8000/health` → `{ "status": "ok", "nim_configured": true }`.

The dashboard talks to `http://localhost:8000` by default; override with
`VITE_ASSISTANT_URL` in `web/`.

## Security

`assistant/.env` (the real key) is **git-ignored** and must never be committed.
Only `.env.example` (a placeholder) is tracked.

## Endpoints

- `GET /health` → status, model id, whether a NIM key is configured.
- `POST /api/chat/message` — body `{ question, context, history }`; streams SSE
  events `token` (deltas) → `final` (`{ answer }`), or `error` (`{ message }`).
