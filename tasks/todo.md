# Active plan

Build phases and their acceptance criteria, ported from the starter brief (`docs/PROJECT_PLAN.md`
§12) on 2026-10-03. Build in order: **do not start a phase until the previous phase's acceptance
criteria pass** (`docs/decisions.md`, "Build in phase order"). Decisions behind each item are in
`docs/decisions.md`; anything listed there as PENDING is not to be built.

Status: planning done, Phase 0 not started.

## Phase 0 — Scaffold

Scope: create the Medusa backend and the Next.js starter storefront in `apps/backend` and
`apps/storefront` at this repository's root (`docs/decisions.md`, "Repository layout" and "Phase 0
scaffold settings").

Steps, in order:

1. [x] Repository layout and docs route settled (2026-10-06).
2. [x] Playwright MCP added through the kit (2026-10-06).
3. [x] Oscar runs Medusa migrations, `dev` included (2026-10-06).
4. [x] Medusa agent skills installed in both skill folders (2026-10-06; see `docs/decisions.md`).
5. [x] Supabase `dev` project created, GitHub integration disconnected, Supabase CLI installed as a
   root dev dependency and linked (2026-10-06). [ ] Oscar installs the Stripe CLI.
6. [ ] Oscar runs `npx create-medusa-app@latest` with `--with-nextjs-starter --use-npm --db-url <dev
   session pooler>`. Move the generated contents into the repository root, keeping `apps/…`, and
   merge the existing root `package.json` (the `supabase` dev dependency) into the generated one.
7. [x] Supabase MCP (read-only, `dev`) and Playwright MCP verified working (2026-10-06).
8. [x] Schema SQL goes through `npx supabase db push` (2026-10-06, "Database and deployment
   workflow").

Then finish the agent setup: fill in `AGENTS.md` (Purpose, Project invariants) and
`docs/project_profile.md`, including its `[commands]` block, from the scaffolded apps' real scripts,
verified by running each one. Run `tools/check-agent-setup`.

Acceptance:

- [ ] Both apps run locally.
- [ ] The admin dashboard loads.
- [ ] The starter storefront shows demo products.
- [ ] `docs/project_profile.md` commands are real and `tools/test-project quick` runs them.

## Phase 1 — Backend configuration

Scope: the Medusa configuration checklist (`docs/decisions.md`, "Medusa configuration"). Supabase
Data API lockdown. `app` schema created with migrations. Agents write the migrations and SQL; Oscar
applies them.

Acceptance:

- [ ] A product image upload lands in Supabase Storage.
- [ ] A test-mode Stripe payment succeeds end to end.
- [ ] A test email sends via Gmail SMTP.
- [ ] The `public` schema is not reachable with the Supabase anon key.

## Phase 2 — Core flows and tests

Scope: guest checkout, registered checkout, account pages, the password-reset flow, order emails.
Write the Playwright end-to-end suite.

Acceptance (Playwright suite green for):

- [ ] browse → product → add to basket → guest checkout with a Stripe test card
- [ ] register → log in → checkout → order appears in history
- [ ] password reset end to end
- [ ] order confirmation email received

## Phase 3 — Custom features

Scope: measurements widget and product page table, sold state, curation, journal (admin editor and
storefront), enquiry form, inbox (inbound and replies with images). Ask Oscar for the inbound-email
implementation before building that flow.

Acceptance:

- [ ] Ben can do every admin task (measurements, journal, inbox, curation) from the Medusa admin alone.
- [ ] Playwright tests added for the enquiry form and journal pages.
- [ ] Full suite green.

## Phase 4 — UI overhaul

Scope: apply the aesthetic following `docs/UI_OVERHAUL_SKILL.md` (manual process first, then the
`ui-overhaul` project skill; see its roadmap §9).

Acceptance:

- [ ] Human sign-off on the look.
- [ ] Full Playwright suite green.
- [ ] No edits in behaviour-locked paths.
- [ ] Accessibility: WCAG AA contrast, visible keyboard focus, responsive to mobile.

Open questions to answer before or during this phase (from `docs/UI_OVERHAUL_SKILL.md` §12):

- Which exact skills, prompts and MCP config does Emad use, and can he share them?
- Does Ben want to review the 5 mockups himself, or only the final pick?
- Are Ben's current photos consistent enough for mockups, or is a quick reshoot needed first?
- Is any paid component (Refero, Higgsfield) justified after v0, or does the free stack reach the bar?
- Does `npx impeccable install` write into a home folder? If so, redirect into the project.

## Phase 5 — Launch prep

Scope: real content from Ben, static pages, SEO basics (sitemap already in the starter, metadata,
product structured data), favicon, 404. Close the hosting, Ben's-hosting, Cloudflare and email PENDING
entries. Set the agents' command deny-list now that a deployable backend exists. Deploy (Oscar).
Switch Stripe to live keys (Oscar).

Acceptance:

- [ ] Live site on Ben's domain.
- [ ] A real test purchase is refunded successfully.

## Phase 6 — Sync engine

Scope: decide the Vinted extent. eBay sync. Variant-to-listing mapping. Oversell handling.

Acceptance:

- [ ] An item sold on the site is delisted on eBay automatically (and on Vinted, per the decision).
- [ ] An item sold on eBay is marked sold on the site.

## Waiting on Ben

Tracked under PENDING in `docs/decisions.md`; each blocks the phase noted.

- [ ] Store name and logo (Phase 4–5)
- [ ] Official Gmail address (Phase 1)
- [ ] Shipping zones and rates; international selling (Phase 1)
- [ ] VAT registration status (Phase 1)
- [ ] Returns policy (Phase 5)
- [ ] Final measurement fields and condition grades (Phase 3)
- [ ] Blog section name (Phase 3)
- [ ] Whether sold items appear anywhere other than their own URL (Phase 3)
- [ ] About page text and first journal posts (Phase 5)
