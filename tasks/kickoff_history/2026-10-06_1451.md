# Session handoff — agent kit built, TurnerandFenwick on the kit, six questions open

Written 2026-10-06. `main` is at `20d482f` ("kit init complete"). Uncommitted in this repository:
the move of `PROJECT_PLAN.md` and `UI_OVERHAUL_SKILL.md` into `docs/`, the full `docs/decisions.md`,
`tasks/todo.md`, README and starter-doc corrections, and these handoff files. The agent kit
(`~/agent-kit`) is committed (`ee6cb68`) and clean, with no remote yet.

## What was done

1. **Git basics.** This repo had no commits at first, which is why branch commands seemed broken; it
   now has two.
2. **Audit of DrinkSmart's agent setup.** Found skills duplicated in up to four places and already
   drifting, generic and project rules mixed together, and no way to start a new repository cleanly.
3. **Design interview → the agent kit.** Design spec: `~/agent-kit/docs/DESIGN.md` (maintained copy,
   with an "As built" section); the original is the Traycer artifact "Agent kit: shared agent workflow
   layer across repos". Six rollout steps.
4. **Rollout step 1 — built `~/agent-kit`** from DrinkSmart's setup, made project- and
   harness-neutral:
   - `core` pack: 13 skills, 9 workflow docs, `ORCHESTRATION.md`, setup docs, tools (`agent-lock`,
     `check-agent-setup`, `prepare-worktree`, `spec-block`, `spend-guard`, `test-project`,
     `writespec-guard`), the shared `AGENTS.md` block, permission rules for Claude, opencode and
     Codex, guard hooks, `.gitignore` lines.
   - `traycer` pack (inert without Traycer), `relay` pack (needs traycer), `mcp-playwright`,
     `mcp-context7`.
   - Starter templates, including `docs/project_profile.md`, whose TOML block holds project commands.
   - Tested in scratch repos: core-only init passes `check-agent-setup` with Traycer hidden;
     sync, push, conflicts, packs, targets, `prepare-worktree` and a full adopt of a DrinkSmart clone
     all behaved as designed.
   - `kit` is on PATH via `~/.local/bin/kit`.
5. **Rollout step 2 (partly) — this repository.** `kit init --with traycer` run and committed by Oscar.
   Then, uncommitted:
   - Starter docs moved to `docs/` to match the README links.
   - Every LOCKED section, OPEN thread and logged decision from the starter brief ported into
     `docs/decisions.md`; build phases and acceptance criteria into `tasks/todo.md`. The starter brief
     now carries a banner: the ledger wins.
   - Corrections: `AGENTS.md` (not `CLAUDE.md` as a pointer) is the entry point; the UI overhaul skill
     becomes a project skill mirrored in both skill folders, then a kit `ui-overhaul` pack, never a
     global skill; Impeccable's installer must be checked for home-folder writes.
   - New LOCKED rule: agents write migrations, SQL and Edge Functions; Oscar runs them. Command
     deny-list set in Phase 5.
   - New PENDING: repository layout, and how agents read Medusa's docs.
   - **Deliberately not done yet:** `AGENTS.md` (Purpose, Project invariants) and the profile's prose
     and `[commands]`. Oscar deferred these; the commands can only be filled from real scripts after
     Phase 0.
6. **Rollout step 4 — all global skills deleted.** 9 skills from `~/.agents/skills` and
   `~/.claude/skills`, the shortcut copies in 9 other tool folders, and opencode's global skill paths.
   Vendor-managed folders kept (claude.ai `synced/`, Codex `.system`, Traycer's `traycer-*`). Backup:
   `~/global-skills-backup-2026-10-03.tar.gz`. `kit doctor` reports no personal skills. Traycer
   originally created the shortcut copies and may recreate them; `kit doctor` would flag that.

Rollout status: 1 done · 2 in progress · 3 (use it here and improve via `kit push`) not started ·
4 done · 5 (`kit adopt` DrinkSmart) not started · 6 (push the kit to private GitHub) not started.

## Known side effects and risks

- `~/.traycer/agent-selection-guide.md` is now the kit's version, so DrinkSmart's
  `tools/check-agent-setup` reports a mismatch until DrinkSmart is adopted with
  `kit adopt --with traycer --with relay`. Nothing is broken.
- DrinkSmart has its own repo copies of its skills and is unaffected by the global deletion. Any
  other repository without its own skills (for example `git_visual_system`) has none until it is
  initialised or adopted.
- Codex does not yet trust this repository, so it ignores `.codex/config.toml` and the no-push rule.
- Untested: whether Codex's `forbidden` rules also block commands inside its sandbox.

## kit command reference

| Command | What it does |
| --- | --- |
| `kit init [--with PACK …]` | Set up a brand-new repository (runs `git init` if needed) |
| `kit adopt [--with PACK …] [--dry-run]` | Bring a repository that already has its own agent setup under the kit; asks per differing file |
| `kit status` | Read-only: what differs from the kit, and new kit commits since the last sync |
| `kit sync [--discard] [--yes]` | Take kit updates file by file, showing each diff first; never overwrites local edits unless `--discard` |
| `kit push PATH …` | Send local edits of kit files back to the kit (commits there; mirrors skill copies) |
| `kit push --new PATH --pack PACK` | Add a project file or skill to the kit |
| `kit add PACK` / `kit remove PACK` | Install or uninstall an optional pack (`traycer`, `relay`, `mcp-playwright`, `mcp-context7`) |
| `kit target add\|remove TOOL` | Mirror skills into another tool's project folder (cursor, grok, kimi, kiro, droid, qwen) |
| `kit packs` | List available packs |
| `kit doctor [--fix]` | Check this machine and repository; `--fix` applies safe fixes after asking |

Direction is always explicit: `sync`/`add` copy kit → repository; `push` copies repository → kit.
After pushing to the kit, run `git -C ~/agent-kit push` once it has a remote.

## Questions waiting for Oscar

1. **Repository layout (PENDING).** `create-medusa-app` generates one repo with `apps/backend`
   (Medusa + admin) and `apps/storefront` (Next.js); the starter brief assumed top-level `backend/`
   and `storefront/`. Recommended: keep `apps/…` (matches Medusa's docs, agent skills and upgrade
   guides) and update the ledger's paths. Either way, the generated contents move up into this
   repository's root.
2. **How agents read Medusa's docs (PENDING).** Medusa v2 changes often, so agents must check docs,
   not memory. Options, combinable:
   - Docs MCP server `https://docs.medusajs.com/mcp`: needs a Medusa Cloud account and an OAuth
     login via `/mcp`. Do you have or want one?
   - `https://docs.medusajs.com/llms.txt`: free, works today with no setup.
   - Medusa's official agent skills (`medusajs/medusa-agent-skills`: building-with-medusa,
     building-admin-dashboard-customizations, building-storefronts, storefront-best-practices,
     db-generate, db-migrate, new-user, learning-medusa), installed into this project only and
     mirrored into both skill folders.
   Recommended: agent skills + `llms.txt` now; the MCP server only if they fall short. Caveat:
   `db-migrate` lets an agent run migrations, which depends on question 3.
3. **Does "Oscar runs anything that changes a live service" include the Supabase `dev` project?**
   Development means running Medusa migrations against `dev` repeatedly, and `create-medusa-app`
   does so immediately (migrations + admin user). Recommended: agents may run Medusa migrations
   against `dev` only; `prod` is Oscar's alone; hand-written SQL (the `app` schema, RLS, the Data API
   lockdown) stays Oscar's in the SQL editor either way. Alternative: strict, agents never touch `dev`.
4. **Phase 0 scaffold settings.** Database: `--db-url` with the Supabase `dev` session-pooler URL
   (port 5432), per the LOCKED decision, which needs the `dev` project created first (alternative:
   `--skip-db`, configure later). Next.js starter: yes. Package manager: npm (recommended), yarn or
   pnpm? Who runs `create-medusa-app`: Oscar, or an agent under question 3?
5. **MCP servers, and when.** Playwright (`kit add mcp-playwright`): only needed from Phase 2/4, add
   now or later? Supabase MCP, read-only and scoped to `dev`, once that project exists: yes or no?
   Context7: recommended skip (Medusa's own sources are better).
6. **Housekeeping.** Trust the repository in Codex (start `codex` here once, or `kit doctor --fix`).
   Commit the uncommitted docs work listed at the top?

Also outstanding for Oscar regardless of the answers: create the Supabase `dev` project, and install
the Stripe CLI (not on this machine yet). Node v22.23.2 already satisfies Medusa's requirement.

## Read first next session

`AGENTS.md`, `docs/decisions.md` (especially PENDING), `tasks/todo.md` (Phase 0),
`~/agent-kit/docs/DESIGN.md` for anything about the kit.

## PROMPT

```text
Run /kickoff. Then give Oscar a brief summary of where things stand from HANDOFF.md, and present the
six questions under "Questions waiting for Oscar" exactly as recorded, with their context and
recommendations. Wait for his answers. Record each answer in docs/decisions.md through the
update-decisions workflow (closing the matching PENDING items and amending the "Oscar runs anything
that changes a live service" entry if question 3 changes it), update tasks/todo.md Phase 0 to match,
and only then plan the Phase 0 scaffold. Do not fill in AGENTS.md or docs/project_profile.md until
Oscar asks; the profile's [commands] block is filled only from the scaffolded apps' real scripts.
```
