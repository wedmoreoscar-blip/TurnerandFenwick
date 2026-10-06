# Project profile — TurnerandFenwick

Project facts the shared workflows refer to. The TOML block is read by `tools/test-project`,
`tools/prepare-worktree`, `tools/spec-block` and `tools/writespec-guard`; keep it valid
(`tools/check-agent-setup` parses it). Everything that needs judgment goes in the prose sections.
This file belongs to this project; the agent kit never overwrites it.

```toml
[commands]
# name = "shell command", run from the repository root. Verified by running each one on 2026-10-06
# unless marked otherwise.
install_fresh = "npm ci"
install_incr  = "npm install"
typecheck     = "cd apps/backend && npx tsc --noEmit && cd ../storefront && npx tsc --noEmit"
lint          = "cd apps/backend && npm run lint"
test          = "cd apps/backend && npm run test:unit -- --passWithNoTests"
build         = "cd apps/backend && npm run build"
# Not in any profile yet; see Known failures and Blocked verification.
lint_storefront  = "cd apps/storefront && npx next lint"
build_storefront = "cd apps/storefront && npm run build"
dev              = "npm run dev"   # backend :9000 (admin /app), storefront :8000

[profiles]
# tools/test-project <profile> runs these command names in order.
quick = ["typecheck", "lint", "test"]
build = ["typecheck", "lint", "test", "build"]
full  = ["typecheck", "lint", "test", "build"]

[implementer]
run     = ["typecheck", "lint", "test"]
skip    = ["build"]
forbid  = ["npx medusa db:generate", "npx medusa db:migrate", "npx medusa exec", "npx medusa user", "npx supabase db push", "npx supabase db reset", "npx supabase db query", "npx supabase db pull", "npx supabase migration repair", "npx supabase functions deploy", "npm run backend:seed"]
blocked = ["live backend and browser checks (need Oscar's dev servers)", "storefront build (pre-renders pages from a running backend)", "backend integration tests (need a disposable Postgres; never Supabase)"]

[worktree]
copy_files       = ["apps/backend/.env", "apps/storefront/.env.local"]
dependency_files = ["package-lock.json"]
```

## Stack

- npm workspaces + Turborepo (`turbo.json`, `agentGuidance` off). Node `>=22.22.0`; this machine has
  v22.23.2.
- `apps/backend` (`@dtc/backend`): Medusa v2 (2.21.x), admin dashboard at `/app`, Jest with `@swc/jest`
  (`test:unit`, `test:integration:modules`, `test:integration:http`). Lint is `medusa lint`
  (`@medusajs/eslint-plugin`).
- `apps/storefront` (`@dtc/storefront`): Next.js 15 starter with Turbopack, Tailwind, `@medusajs/ui`.
  There's no test suite yet (Playwright arrives in Phase 2).
- Root dev dependency: Supabase CLI (`npx supabase`), linked to the `dev` project. Stripe CLI is
  installed system-wide and logged in to test mode.
- Supabase `dev`: Medusa's tables in `public`, all with RLS on through Supabase's `ensure_rls` event
  trigger. Medusa owns them, so it's unaffected.

## Known failures

<!-- Known, understood, individually named failures only. Never record counts here as truth:
derive them by running the command. A parse or syntax error is never baseline noise. -->

- `lint_storefront`: the Medusa starter's own code fails `next lint` (`no-unused-vars` and
  `no-explicit-any` in `src/lib/data/cart.ts`, among others). `next lint` is also deprecated in
  Next.js 15. Upstream code; fix or migrate to the ESLint CLI before adding it to a profile.
- `npm run dev` (2026-10-06): after the move into the repository root, the backend process starts
  but never listens on :9000, and the storefront returns 500. Not yet diagnosed.
- `npm audit`: moderate and high advisories in the starter's dependency tree. Don't run
  `npm audit fix --force`; it pulls in breaking upgrades.

## Blocked verification

<!-- Evidence categories this project has but agents cannot reach (live backend, devices, …). -->

- **Backend integration tests:** Medusa's test runner creates and drops its own database. It must
  never point at Supabase. There's no local Postgres yet.
- **Storefront build:** `generateStaticParams` fetches products, collections and categories from
  the backend at build time, so it needs a running backend and `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.
- **Anything that writes to a database:** seeding, migrations and admin users are Oscar's.

## High-risk areas

<!-- Code where typecheck alone is never enough, and the extra verification each needs. -->

- Checkout, payments and the Stripe wiring
  (`apps/storefront/src/modules/checkout/components/payment*`, the backend payment module): needs
  an end-to-end test-mode payment.
- Stock and sold state for one-off items: needs a check that an item can't be sold twice.
- `apps/storefront/src/lib/**` (the data layer): changes need a browser check of the affected flow.
- Migrations (`supabase/migrations/`, `apps/backend/src/modules/*/migrations/`): reviewed against the
  live schema through the Supabase MCP, then run by Oscar.

## Delegation extras

<!-- Hook for docs/workflows/delegation.md: any extra provisioning or review step for this repo. -->

## Visual check extras

<!-- Hook for docs/workflows/visual_check.md: where design references live, which screens are
referenced, viewport, numeric criteria, standing design constraints, how to launch the app. -->

## Model preferences

<!-- Overrides to docs/workflows/agent_selection.md for this project only, if any. -->

## Project permissions

<!-- Commands agents must never run here (deploys, remote migrations, secret changes). Add each to
.claude/settings.json permissions.deny as "Bash(<cmd> *)", to opencode.json permission.bash as
"<cmd> *": "deny", and to .codex/rules/project.rules as a forbidden prefix_rule. -->

In place since 2026-10-06, with and without `npx`: `medusa db:*`, `medusa exec`, `medusa user`,
`supabase db push|reset|query|pull`, `supabase migration repair` and `supabase functions deploy`.
`npm run backend:seed` (which runs `medusa exec`) is in `[implementer].forbid` but not yet denied by
pattern.

## Quirks

- Turborepo writes an agent-guidance block into `AGENTS.md` when it detects an agent;
  `"agentGuidance": false` in `turbo.json` stops it.
- The demo seed data uses a Europe region in euros (`/dk`). GB and GBP are set up in Phase 1.
- `create-medusa-app` installs Medusa's Claude Code plugin user-wide. It was removed on 2026-10-06;
  the project skills replace it.
- Playwright MCP writes snapshots into `.playwright-mcp/` (ignored).
