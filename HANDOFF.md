# Session handoff — Phase 0 scaffolded, `npm run dev` broken after the move

Written 2026-10-06 18:29. `main` is at `b8cfbed`, 13 local commits ahead of `origin/main` (`68eacf8`).
Oscar pushes; agents never do. Working tree clean at handoff.

## What was done this session

1. **All six open questions answered and recorded** in `docs/decisions.md`:
   - Layout: `apps/backend` and `apps/storefront` at the repository root.
   - Medusa docs: four official Medusa skills, plus `llms.txt` and per-page `.md`. No docs MCP: it
     needs a Medusa Cloud account, which Oscar doesn't want. Re-confirmed at the end of the session.
   - Oscar runs every database and deploy command: `medusa db:generate` (it connects to the database
     too), `db:migrate`, `exec`, `user`, `npx supabase db push`, function deploys.
   - Schema SQL goes in `supabase/migrations/` (created with `npx supabase migration new`) and Oscar
     applies it with `db push`. The SQL editor is only for small data changes. The Supabase GitHub
     integration was connected, then disconnected.
   - RLS is written in the migration that creates each table. `prod` isn't created until Phase 5.
2. **Tooling.**
   - Supabase CLI: a root dev dependency, linked to `dev`.
   - Supabase MCP: read-only, scoped to `dev`.
   - Playwright MCP: through the kit pack, now `--headless`.
   - Stripe CLI: installed and logged in to test mode.
   All verified.
3. **Agent deny-list in place now**, not at Phase 5, in `.claude/settings.json`, `opencode.json` and
   `.codex/rules/project.rules`. Tested in Claude Code and Codex.
4. **Skills.**
   - Medusa: `building-with-medusa`, `building-admin-dashboard-customizations`,
     `building-storefronts` and `storefront-best-practices`, all at upstream `066132d`.
   - Supabase: `supabase` and `supabase-postgres-best-practices`, with trimmed frontmatter.
   All mirrored in both skill folders.
   - Removed from home folders: the user-wide Medusa Claude Code plugin (which `create-medusa-app`
     installs) and a personal `find-skills` (backup at `~/global-skills-backup-2026-10-06.tar.gz`).
   - `kit doctor` reports clean.
5. **First Supabase migration**, `20261006155726_revoke_rls_auto_enable_execute.sql`, pushed by Oscar
   and verified: the security advisor shows no issues.
6. **Scaffold.** Oscar ran `create-medusa-app` against `dev`, then the agent moved it into the
   repository root.
   - Before the move, all three app checks passed: health 200, admin 200, and 4 demo products on
     `/dk/store`.
   - About 150 Medusa tables are in `public`, all with RLS on through Supabase's `ensure_rls` trigger.
     Medusa is unaffected, because it owns the tables.
   - The starter's `AGENTS.md`, `README` and `LICENSE` are in `docs/medusa_starter/` (reference only).
7. **`AGENTS.md`** (Purpose, Project invariants) and **`docs/project_profile.md`** are filled in.
   - The `build` profile passes: typecheck, backend lint, unit tests (none yet) and backend build.
   - Turborepo's agent guidance is turned off in `turbo.json`.

## Known problems and risks

- **`npm run dev` is broken since the move** (the next task). Both processes start from the root.
  The storefront listens on :8000 but returns 500. The backend (`medusa develop`) never listens on
  :9000, and `/health` gave no answer for over a minute. The cause isn't diagnosed yet; the backend's
  terminal output hasn't been seen. Suspects:
  - The dev database password was reset this session (the old one leaked into a `ps` listing), so
    `DATABASE_URL` in `apps/backend/.env` may be wrong or not percent-encoded.
  - Something path-related from moving `turnerandfenwick/apps` up a level, such as stale caches in
    `apps/backend/.medusa/`.
  - An agent ran `npm run build` in `apps/backend` while the dev processes were up; that rewrote
    `.medusa/server`. The failure was seen before that build, though.
- Storefront `next lint` fails on Medusa's own starter code. `npm audit`: 72 moderate and 59 high
  advisories in the starter's dependencies; don't use `audit fix --force`.
- No local Postgres, so backend integration tests can't run (they must never point at Supabase).
  Decide on Docker before Phase 3.

## Read first next session

`AGENTS.md`, `docs/project_profile.md` (Known failures, Quirks), `tasks/todo.md` (Phase 0
acceptance), and `docs/decisions.md` ("Database and deployment workflow", "Data and identity rules").

## Explicit exclusions

- Never read or print `apps/backend/.env` or `apps/storefront/.env.local`. Ask Oscar to check values.
- Don't run database or seed commands. If the fix needs a migration or reseed, hand the command to
  Oscar.
- Don't start Phase 1 until Phase 0's acceptance passes.

## PROMPT

```text
Run /kickoff. Then fix `npm run dev` after the scaffold was moved into the repository root (Phase 0's
last open item). Ask Oscar to run `npm run dev` from ~/TurnerandFenwick and paste the backend's
(@dtc/backend) error output, with any URL or password removed. Diagnose from that, starting with the
suspects listed under "Known problems and risks" in HANDOFF.md: DATABASE_URL after the password reset
(percent-encoding), stale apps/backend/.medusa caches, and path assumptions from the move. Never read
the .env files; never run database commands. Once both apps run, re-verify Phase 0 acceptance: backend
/health 200, admin /app loads, and demo products on the storefront (Playwright MCP). Then tick the
items in tasks/todo.md, update docs/project_profile.md Known failures, and stop to report before
starting Phase 1.
```
