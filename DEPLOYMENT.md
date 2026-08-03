# Deploying Teraval

Two pieces are hosted separately, plus one external API:

| Piece | What | Host | Config file |
|---|---|---|---|
| **Frontend** | Vite + React dashboard (`web/`) | **Vercel** | `web/vercel.json` |
| **Backend** | FastAPI assistant (`assistant/`) | **Render** | `render.yaml` |
| **LLM** | NVIDIA NIM (OpenAI-compatible) | external | key only |

The dashboard is fully usable **without** the backend — every number is computed
client-side and the AI assistant falls back to a grounded offline answerer. The
backend only adds the live streaming LLM narration. So even if Render is asleep or
unconfigured, the Vercel site still works.

**Deploy the backend first** (so you have its URL for the frontend), then the
frontend. CORS is already set to accept any `*.vercel.app` origin, so you do **not**
need the frontend URL when configuring the backend.

---

## Prerequisites

- The repo is pushed to GitHub (`https://github.com/KartikJoshi23/TeravalAI`).
- A NVIDIA NIM API key (`nvapi-…`, from build.nvidia.com) — the same one in
  `assistant/.env`. **Never commit it.**
- Free accounts on [Render](https://render.com) and [Vercel](https://vercel.com),
  each connected to the GitHub repo.

---

## Part A — Backend on Render (do this first)

`render.yaml` at the repo root is a Render **Blueprint**, so the service is created
for you.

1. Render Dashboard → **New +** → **Blueprint**.
2. Connect the `TeravalAI` repo. Render finds `render.yaml` and shows a service
   named **teraval-assistant** (Python, root `assistant/`, health check `/health`).
3. It prompts for the one secret marked `sync: false` — paste your
   **`NVIDIA_NIM_API_KEY`** (`nvapi-…`). Click **Apply**.
4. Wait for the first build/deploy (a few minutes). When live you get a URL like
   **`https://teraval-assistant.onrender.com`** — copy it.
5. Verify: open `https://teraval-assistant.onrender.com/health` — it should return
   `{"status":"ok","model":"…","nim_configured":true}`. If `nim_configured` is
   `false`, the key wasn't picked up — re-check the env var and redeploy.

**Blueprint already sets:** `PYTHON_VERSION=3.12.7`, `NIM_MODEL`, `NIM_BASE_URL`,
`healthCheckPath=/health`, `autoDeploy` on push, and
`CORS_ORIGIN_REGEX=https://([a-z0-9-]+\.)*vercel\.app` (accepts every Vercel
deployment). Prefer the dashboard? Create a Web Service manually with root dir
`assistant`, build `pip install -r requirements.txt`, start
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and add those env vars by hand.

> **Free-tier note:** the free Render service **spins down when idle** and cold-starts
> in ~50 s. The first request after a nap (or the assistant "NIM connected" badge)
> may lag while it wakes; it's instant thereafter. For a live demo, open the
> `/health` URL a minute beforehand to warm it, or upgrade the plan.

---

## Part B — Frontend on Vercel

1. Vercel Dashboard → **Add New… → Project** → import the `TeravalAI` repo.
2. **Root Directory:** click **Edit** and set it to **`web`** (the app is in that
   subfolder). Vercel auto-detects Vite (build `npm run build`, output `dist`) —
   `web/vercel.json` confirms this and adds the SPA fallback.
3. **Environment Variables** → add:
   - **`VITE_ASSISTANT_URL`** = your Render URL from Part A, **no trailing slash**,
     e.g. `https://teraval-assistant.onrender.com`
   - Apply it to **Production** and **Preview**.
   > Vite inlines env vars at **build time**, so this must be set *before* you
   > deploy. If you add/change it later, **redeploy** for it to take effect.
4. Click **Deploy**. You get a URL like `https://teraval.vercel.app`.

---

## Part C — Verify the wired-up site

1. Open the Vercel URL. The dashboard loads; all 7 tabs render the canonical
   numbers (NPV +AED 1,854M, IRR 16.5%, Build vs Rent +AED 320M, …).
2. Open the floating **AI assistant** (bottom-right). Its status dot should read
   **NIM connected** (green) — that confirms the browser reached Render and CORS
   passed. Ask a sample question; the answer should **stream** in token by token.
   - If it says **grounded offline** instead: the backend is asleep (wait ~50 s and
     reopen), the key isn't configured (`/health` shows `nim_configured:false`), or
     CORS is blocking (check the browser console for a CORS error and confirm the
     Render `CORS_ORIGIN_REGEX`). The offline fallback still answers correctly.

### Custom domain (optional)
If you attach a non-`vercel.app` domain to the Vercel project, the `*.vercel.app`
regex won't cover it — add it on Render as
`CORS_ORIGINS=https://your-domain.com` (comma-separate multiple) and redeploy.

---

## Redeploys & secrets

- **Auto-deploy:** both hosts redeploy on every push to `main` (Render via
  `autoDeploy`, Vercel by default). Backend-only or frontend-only pushes each
  rebuild only their side.
- **Secrets:** the NIM key lives **only** in Render's env vars and local
  `assistant/.env` — never in git. `assistant/.env` and all `.env` files are
  git-ignored; `render.yaml` keeps the key as `sync:false` (not stored in the repo).
- **Local dev is unchanged:** `cd web && npm run dev` (→ localhost:5173) and
  `cd assistant && uvicorn app.main:app --reload --port 8000`. With no
  `VITE_ASSISTANT_URL` set, the frontend defaults to `http://localhost:8000`.
