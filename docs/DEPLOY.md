# Deploy: API on Render, web app on Vercel

Vercel cannot run the .NET API, so the API runs as a Docker service on Render and the React app on Vercel.

## 1. API on Render

1. Render dashboard → **New → Blueprint** → pick this GitHub repo. Render reads `render.yaml`.
2. It creates `nof1lab-api` (free plan, Docker, health check `/health`) with:
   - `Jwt__Key` — generated secret
   - `Cors__AllowedOrigins` — `https://*.vercel.app` (add a custom domain here if you use one, comma-separated)
   - `GEMINI_API_KEY` — optional; without it explanations use the offline fallback
3. Wait for the deploy, then open `https://<service>.onrender.com/health` → `{"status":"ok"}`.

Notes: the free plan sleeps when idle (first request ≈ 50 s) and SQLite resets on each deploy. The demo account and its seeded result are recreated on start.

## 2. Web app on Vercel

1. Vercel → **Add New → Project** → import this repo.
2. **Root Directory: `frontend`** (framework Vite; `frontend/vercel.json` sets build, output and SPA rewrites).
3. Environment variable `VITE_API_URL` = `https://<service>.onrender.com` (no trailing slash).
4. Deploy. Changing `VITE_API_URL` later needs a redeploy (it is baked in at build time).

## Smoke test

Open the Vercel URL → **See a demo result**. It signs in as `demo@nof1lab.local` / `Demo123!` and opens the seeded Keep result.
