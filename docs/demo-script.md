# N-of-1 Lab — 3-minute demo script

1. **Landing (20s)** — “Health data is scattered; monitoring isn’t a decision. N-of-1 Lab turns a lifestyle question into a short A/B experiment with a computed verdict.” Hit the primary demo CTA **Open demo result** (logs in as the seeded demo user and opens the showcase result).
2. **Login (optional, 10s)** — Only if you skip the Landing CTA: go to `/login`, use `demo@nof1lab.local` / `Demo123!`, or **Continue as demo** (that control lives on Login, not Landing). From Dashboard you can also use **Open demo result**.
3. **Result / showcase (20s)** — Seeded completed earlier-bedtime experiment → Keep + numbers. API: `GET /api/demo/showcase` returns the showcase `experimentId`.
4. **Explain (20s)** — From **Open demo result**, explain auto-runs once (`fromShowcase`); click “Explain my result” again if needed (Gemini if keyed, otherwise fallback that still cites numbers).
5. **Templates (30s)** — Restart the API once so DbSeeder adds any new template keys (existing data is kept). Show sport / physical / mental / lifestyle coverage. For the sample-CSV shortcut next, **start an earlier-bedtime** run (Draft or Active). Morning light is fine to show for breadth—use a manual check-in there; the sample file is bedtime-specific.
6. **Check-in (40s)** — On the earlier-bedtime Draft/Active experiment, prefer **Load sample data** (imports `earlier-bedtime-demo.csv`) instead of typing many days. Otherwise log one day (slider + adherence) and mention the safety stop checkbox.
7. **Mid-run preview (20s)** — With check-ins in both phases, open charts / call `GET /api/experiments/{id}/analysis/preview` for provisional stats (does not complete the run).
8. **Complete (20s)** — Finish the run (or re-import `data/samples/earlier-bedtime-demo.csv` via **Load sample data** / upload) and show the computed verdict.
9. **Close (10s)** — “Code calculates. AI only explains. Not medical advice.”
