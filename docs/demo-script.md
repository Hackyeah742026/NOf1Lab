# N-of-1 Lab — 3-minute demo script

1. **Landing (20s)** — “Health data is scattered; monitoring isn’t a decision. N-of-1 Lab turns a lifestyle question into a short A/B experiment with a computed verdict.”
2. **Login (10s)** — Use `demo@nof1lab.local` / `Demo123!`.
3. **Dashboard (20s)** — Open the seeded completed earlier-bedtime experiment → Result shows Keep + numbers.
4. **Explain (20s)** — Click “Explain my result” (Gemini if keyed, otherwise fallback that still cites numbers).
5. **Templates (30s)** — Restart the API once so DbSeeder adds any new template keys (existing data is kept). Show sport / physical / mental / lifestyle coverage; Morning light may need scroll or a category filter on Templates. Start Morning light.
6. **Check-in (40s)** — Log one day (slider + adherence). Mention safety stop checkbox.
7. **Mid-run preview (20s)** — With check-ins in both phases, open charts / call `GET /api/experiments/{id}/analysis/preview` for provisional stats (does not complete the run).
8. **Import shortcut (30s)** — Or import `data/samples/earlier-bedtime-demo.csv`, complete, show verdict.
9. **Close (10s)** — “Code calculates. AI only explains. Not medical advice.”
