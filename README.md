# N-of-1 Lab

A personal experiment OS. Pick a lifestyle question, run a short A/B protocol, log minimal signals (or import CSV), and get a computed verdict (Keep / Drop / Modify / Inconclusive). AI only explains the numbers and suggests the next experiment. Not medical advice.

## Structure

```
NOf1Lab/
  backend/                 # .NET 9 Clean Architecture API
    NOf1Lab.sln
    src/
      NOf1Lab.Domain/
      NOf1Lab.Application/
      NOf1Lab.Infrastructure/
      NOf1Lab.Api/
    tests/
      NOf1Lab.Domain.Tests/
  frontend/                # React + Vite + TypeScript + Tailwind
  data/samples/            # synthetic CSVs
  docs/
```

## Prerequisites

- .NET 9 SDK
- Node.js 20+
- Docker Desktop (or Docker Engine + Compose) — only for containerized run

## Run backend

```bash
dotnet run --project backend/src/NOf1Lab.Api
```

- API: http://localhost:5154
- Health: http://localhost:5154/health
- OpenAPI UI (Scalar): http://localhost:5154/scalar

## Run frontend

```bash
cd frontend
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

## Run with Docker

Requires Docker Desktop (or Docker Engine + Compose). Frontend image is built from `frontend/Dockerfile`.

```bash
docker compose up --build
```

Open the app at **http://localhost:8080** (Compose bakes `VITE_API_URL=http://localhost:5154` into the web image for browser calls to the published API).

- App: http://localhost:8080
- API: http://localhost:5154
- Health: http://localhost:5154/health
- Demo: `demo@nof1lab.local` / `Demo123!`

Scalar / OpenAPI UI is only available when running the API locally with `dotnet run` (`ASPNETCORE_ENVIRONMENT=Development`). Compose sets Production, so Scalar is not served there.

Optional: set `GEMINI_API_KEY` in a root `.env` (see `.env.example`) for live AI explanations. Without it, `/explain` uses deterministic fallback copy.

SQLite persists in the `nof1lab-data` Docker volume (`Data Source=/data/nof1lab.db`). Demo seeds still run on API startup.

Stop:

```bash
docker compose down
```

## Demo login

- Email: `demo@nof1lab.local`
- Password: `Demo123!`

Seeded data includes category templates (insert-missing by Key on startup) and one completed earlier-bedtime experiment with a computed verdict.

Optional: set `GEMINI_API_KEY` in a root `.env` for live AI explanations. Without it, `/explain` returns deterministic fallback copy that still cites the computed numbers.

## Current status

Working demo path:

- JWT auth + SQLite persistence
- Templates, experiment lifecycle, check-ins, CSV import, safety stop
- Domain `ExperimentAnalyzer` (unit tested) + Keep/Drop/Modify/Inconclusive
- Mid-run provisional stats: `GET /api/experiments/{id}/analysis/preview` (Active/Stopped; does not complete)
- Gemini explain with number validation + offline fallback
- Frontend: Landing, Login, Dashboard, Templates, Active check-in, Result
- Demo script: `docs/demo-script.md`
