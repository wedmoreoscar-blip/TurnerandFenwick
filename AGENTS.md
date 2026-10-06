# TurnerandFenwick Agent Guide

## Purpose

An online shop for Ben Turner's one-off second-hand menswear (suits and tailoring). It's an npm and
Turborepo monorepo: a Medusa v2 backend with its admin dashboard in `apps/backend`, and Medusa's
Next.js starter storefront in `apps/storefront`. Supabase provides Postgres and Storage, Stripe takes
payments, and Gmail SMTP sends email. Read `docs/decisions.md` before any design choice; `LOCKED`
entries are settled, and `PENDING` ones must not be built. The two things never to get wrong: **never
run anything that changes a database or deploys** (Oscar runs them), and **never write to Medusa's
tables except through Medusa**.

## Project invariants

- **Sources of truth:** `docs/decisions.md` for decisions, `tasks/todo.md` for the phase plan (build
  in phase order), and `docs/project_profile.md` for commands and quirks.
- **Database and deploys** ("Database and deployment workflow"): agents write Medusa data models,
  `supabase/migrations/` files (created with `npx supabase migration new`) and Edge Functions, then
  hand over the exact command. Oscar runs `npx medusa db:generate`, `db:migrate`, `medusa exec`,
  `medusa user`, `npx supabase db push` and every deploy. These are denied in agent permissions;
  never work around a denial. The Supabase MCP is read-only: use it to inspect, never to change.
- **Medusa owns its tables** ("Data and identity rules"): all product, stock, order and customer
  changes go through Medusa's APIs, workflows or module services, never raw SQL, Supabase clients
  or Edge Functions. Our own data lives in the `app` schema, with RLS on every table, created in the
  same migration as the table. Medusa owns identity: no Supabase Auth. The service-role key never
  reaches the storefront or any `NEXT_PUBLIC_*` variable.
- **The storefront talks only to Medusa,** through `@medusajs/js-sdk` and the Store API, custom
  content included. It holds no Supabase keys.
- **Check Medusa against current docs, never memory:** use the Medusa skills, `llms.txt` and the
  per-page `.md` docs. Where a skill says to run a database command, stop and hand it to Oscar.
- **UI work** follows `docs/UI_OVERHAUL_SKILL.md` and its behaviour lock ("UI work follows the UI
  overhaul process"). Never edit `apps/storefront/src/lib/**` (the data layer) or the payment
  components during UI work.
- **Product photos are never AI-generated or AI-edited.**
- **No new service, library or paid dependency without asking.** Prefer what Medusa already
  provides. Install a dependency inside the app that needs it, never at the root.
- `docs/medusa_starter/` is reference only. Its database commands and MCP setup don't apply here.

## Commands

The commands, verification profiles and worktree setup are in the TOML block of
`docs/project_profile.md`. Run `tools/test-project quick|build|full`.

<!-- kit:begin core -->
## Shared agent rules

This section is managed by the agent kit (`kit sync`). Change it in a kit repository with
`kit push AGENTS.md`, not by hand-editing only here, or the next sync will report a local edit.

### Authority

The project sections of this file come first, then `LOCKED` entries in `docs/decisions.md`, then the
current continuation in `tasks/next_session_kickoff.md`. Project facts (commands, known failures,
quirks, high-risk areas) live in `docs/project_profile.md`. `CLAUDE.md` imports this file.

### Working rules

- Preserve unrelated changes in a dirty worktree. Never stage, revert, or delete work you did not
  create.
- Plan non-trivial work with acceptance criteria. Record multi-session or multi-agent plans in
  `tasks/todo.md` and check in before broad rewrites or changes spanning roughly 50 lines or several
  files.
- Make the smallest correct change. Reuse existing helpers, state patterns, and components before
  creating another abstraction.
- Verify the changed behavior and inspect the complete diff before reporting completion. Report
  `PASS`, `FAIL`, `SKIP` and `BLOCKED` distinctly (`docs/workflows/verification.md`); run checks with
  `tools/test-project <profile>`.
- Never push, deploy, migrate a remote database, rotate secrets, or publish a release without an
  explicit user request. Never use `git -C <path> push` or any other form of push. Commit locally
  only.
- Never read or print `.env` files or other secrets, and never commit them, generated output, or
  local agent state (`.claude/settings.local.json`, `CLAUDE.local.md`, `.worktrees/`).
- Follow `docs/workflows/change_safety.md` for writes, commits, worktrees, and integration.

### Delegation

- Delegate only when `docs/workflows/delegation.md` ("When to delegate at all") says it is worth it;
  keep small, design-heavy, or dense work inline.
- Every delegation is commissioned by a `writespec` spec and accepted only through `speccheck`. After
  handback the checker owns repairs and fixes almost everything inline; re-contact the implementer
  only under a named `speccheck` exception, and confirm with the user before reusing a warm agent.
- `docs/workflows/agent_selection.md` decides which agent runs which role. The default delegation
  mechanism is the orchestrating client's native subagents, each in its own git worktree. An
  orchestration tool is used only where its pack is installed **and** the tool is present on this
  machine; otherwise ignore its files and use native subagents.
- Each spec states its verification baseline in literal numbers obtained by running the commands.
- The final visual check of a redesign follows `docs/workflows/visual_check.md`, not the delegation
  path. Halt and wait for the user on reaching it.
- Serialize dependency installs, shared dev servers, local service mutations, and costly benchmarks
  with `tools/agent-lock <scope> -- <command>`.

### Skills

Repository skills live in identical copies under `.agents/skills/` (Codex, opencode) and
`.claude/skills/` (Claude Code, opencode). Codex invokes them with `$<skill>`, Claude Code with
`/<skill>`, opencode by name. There are **no personal or global skills**: never write a skill into a
home directory. A skill is either project-only or shared through the agent kit; see
`docs/workflows/skill_authoring.md`. Setup and cloning: `docs/agent_setup/CROSS_MACHINE_SETUP.md`.
Validate with `tools/check-agent-setup`.
<!-- kit:end core -->

<!-- kit:begin traycer -->
## Traycer

This section is managed by the agent kit's `traycer` pack. **It applies only when Traycer is
present** (the `traycer` CLI is on `PATH`, or Traycer launched this agent). Otherwise ignore it.

- Delegate through Traycer agents and worktrees as `docs/workflows/delegation_traycer.md` describes;
  it replaces the native-subagent steps of `docs/workflows/delegation.md`.
- The orchestrator always writes to the main checkout on `main`, even when Traycer launched it in a
  worktree.
- Traycer artifacts are a review surface, not storage. Specs live in `tasks/specs/`.
<!-- kit:end traycer -->
