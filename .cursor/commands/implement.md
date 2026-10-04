Implement the development task described after this command using the NOf1Lab subagent workflow.

## Required first step

Read and follow `.cursor/skills/nof1lab-dev-workflow/SKILL.md` end-to-end. Do not skip steps.

## Task input

Treat all user text after `/implement` as the feature/task to deliver. If no task text was provided, ask once for the task description, then proceed.

## Execute this loop

1. **Split** the task into frontend and backend parts (skip a side if not needed).
2. **Implement**
   - Launch the `backender` subagent for backend work.
   - Launch the `frontend-engineer` subagent for frontend work.
   - If a new/changed API is required, finish `backender` before `frontend-engineer` and pass the final contract.
   - If the API already exists, both may run in parallel.
3. **Review (mandatory)**
   - Launch the `reviewer` subagent on the resulting diff.
   - Require findings labeled as frontend or backend.
4. **Fix from review**
   - If there are critical errors, flaws, or optimization opportunities:
     - Re-launch `frontend-engineer` and/or `backender` based on the reviewer’s labels.
     - Implement all suggested optimizations/fixes from the review.
     - Launch `reviewer` again.
   - Repeat until there are no Critical findings.
5. **Finish**
   - Commit coherent units of work if changes are ready (follow repo commit rules).
   - Summarize what shipped, review outcome, and how to verify manually.

## Constraints

- Parent agent orchestrates; do not collapse FE/BE/review into one unscoped edit pass.
- `frontend-engineer` only touches `frontend/`.
- `backender` only touches non-frontend work (`backend/`, `data/`, API docs).
- `reviewer` reviews; implementers apply fixes.
- Preserve the NOf1Lab demo path (demo user, seeds, computed verdicts).
