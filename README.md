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
  data/samples/            # synthetic CSVs (later)
  docs/
```

## Prerequisites

- .NET 9 SDK
- Node.js 20+

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

## Current status

Phase 0 skeleton:

- Clean Architecture layers wired
- Domain `Result` / `Error` + HTTP mapping
- Minimal API endpoint groups (stubs) + `/health`
- React app with Router, TanStack Query, Tailwind, API health check

## Demo login

- Email: `demo@nof1lab.local`
- Password: `Demo123!`

Seeded data includes 5 templates and one completed earlier-bedtime experiment with a computed verdict.
