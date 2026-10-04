---
name: nof1lab-dev-workflow
description: Runs the NOf1Lab subagent implementation loop — split work into frontend/backend, delegate to frontend-engineer and backender, then reviewer, then re-launch implementers for review findings. Use when the user asks to implement, create, build, fix, or develop a feature in this repo.
---

# NOf1Lab subagent development workflow

## Mandatory workflow (verbatim)

When an agent receives a task for implementation, creation, or any other development task, if separates it into frontend and backend( if needed) and then /frontend-engineer  complete frontent part of task, /backender  complete backend part of task. After its completion, a subagent /reviewer  must be launched to check the quality of the code. If the code reviewer finds critical errors, flaws, or opportunities to optimize the code, it must determine whether its frontend or backend part and write about it. After that frontend-endgineer or backender(based on reviewr opinion) must be launched again to implement all the optimizations suggested by the code reviewer.

## How to execute this

Use the project subagents via the Task tool (`subagent_type`):

| Subagent | `subagent_type` | Owns |
|----------|-----------------|------|
| frontend-engineer | `frontend-engineer` | `frontend/` |
| backender | `backender` | `backend/`, `data/`, API docs |
| reviewer | `reviewer` | Quality review only (no feature rewrite unless asked to apply fixes) |

### Step 1 — Split the task

Classify the request:

1. **Frontend-only** → launch only `frontend-engineer`
2. **Backend-only** → launch only `backender`
3. **Full-stack** → launch `backender` first when the UI needs a new/changed API; otherwise launch both in parallel when contracts already exist

Write a short split in the parent turn before delegating (what FE does / what BE does).

### Step 2 — Implement

- Launch `frontend-engineer` with a self-contained prompt: goal, files/areas, acceptance checks, API contract assumptions.
- Launch `backender` with a self-contained prompt: endpoints/DTOs/domain rules, tests to add, demo/seed constraints.
- For full-stack with a **new API**: wait for `backender` to finish, then launch `frontend-engineer` with the final contract.
- For full-stack with an **existing API**: both may run in parallel.
- Parent agent owns git commits after units land (unless a subagent was told to commit).

### Step 3 — Review (required)

After implementation finishes, **always** launch `reviewer` on the resulting diff (uncommitted changes and/or branch commits from this task).

Ask reviewer to:
- List Critical / Warnings / Suggestions
- For each finding, label **frontend** or **backend** (or both)
- Not implement fixes in the review pass

### Step 4 — Apply review findings

If reviewer reports critical errors, flaws, or optimization opportunities:

1. Group findings by side (frontend vs backend) using the reviewer’s labels
2. Re-launch `frontend-engineer` with the frontend finding list and “implement all of these”
3. Re-launch `backender` with the backend finding list and “implement all of these”
4. Launch `reviewer` again on the new diff
5. Stop the loop when reviewer reports no Critical items (Warnings/Suggestions may remain if time-boxed; note them)

### Step 5 — Parent summary

Return to the user:
- What shipped (FE / BE)
- Review outcome (clean vs remaining non-critical items)
- How to verify manually

## Constraints

- Do not skip the reviewer step after implementation work
- Do not have `reviewer` rewrite the feature; implementers apply fixes
- Do not edit the opposite side inside an implementer prompt (FE agent stays in `frontend/`, BE in `backend/`)
- Preserve NOf1Lab demo path: JWT demo user, seeded templates/completed experiment, computed verdicts (not AI-invented)

## Example

User: “Add mid-run analysis preview with charts on the active experiment page.”

1. Split: BE = `GET .../analysis/preview`; FE = chart + preview stats on Active page
2. `backender` → preview endpoint + tests
3. `frontend-engineer` → wire chart + preview UI
4. `reviewer` → findings labeled FE/BE
5. Re-launch implementers for labeled findings → `reviewer` again
6. Summarize for user
