# Active plan

Build phases and their acceptance criteria, ported from the starter brief (`docs/PROJECT_PLAN.md`
§12) on 2026-10-03. Build in order: **do not start a phase until the previous phase's acceptance
criteria pass** (`docs/decisions.md`, "Build in phase order"). Decisions behind each item are in
`docs/decisions.md`; anything listed there as PENDING is not to be built.

Status: Phases 0 and 1 complete on `dev` (2026-10-07). Phase 2 code written and partly proven live;
the suite is not green yet (see Phase 2).

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
   root dev dependency and linked (2026-10-06). [x] Oscar installs the Stripe CLI (2026-10-06).
6. [x] (2026-10-06) Oscar runs `npx create-medusa-app@latest` with `--with-nextjs-starter --use-npm --db-url <dev
   session pooler>`. Move the generated contents into the repository root, keeping `apps/…`, and
   merge the existing root `package.json` (the `supabase` dev dependency) into the generated one.
7. [x] Supabase MCP (read-only, `dev`) and Playwright MCP verified working (2026-10-06).
8. [x] Schema SQL goes through `npx supabase db push` (2026-10-06, "Database and deployment
   workflow").

Then finish the agent setup: fill in `AGENTS.md` (Purpose, Project invariants) and
`docs/project_profile.md`, including its `[commands]` block, from the scaffolded apps' real scripts,
verified by running each one. Run `tools/check-agent-setup`. *Done 2026-10-06:* `AGENTS.md` and the
profile are filled in, and `tools/check-agent-setup` passes.

Acceptance:

- [x] Both apps run locally (2026-10-07: `npm run dev` from the root, backend `/health` 200,
  storefront :8000 200). The post-move failure was the `[PASSWORD]` placeholder left in
  `DATABASE_URL`; Oscar put the real password in.
- [x] The admin dashboard loads (2026-10-07: `/app` 200).
- [x] The starter storefront shows demo products (2026-10-07: 4 products on `/dk/store` via
  Playwright MCP, no console errors).
- [x] `docs/project_profile.md` commands are real and `tools/test-project quick` runs them
  (`build` profile: typecheck, lint, test, build all PASS, 2026-10-06).

## Phase 1 — Backend configuration

Scope: the Medusa configuration checklist (`docs/decisions.md`, "Medusa configuration"). Supabase
Data API lockdown. `app` schema created with migrations. Agents write the migrations and SQL; Oscar
applies them.

Note: the `dev` project has Supabase's auto-enable RLS event trigger (`ensure_rls`), so every table
created in `public`, Medusa's included, gets RLS switched on with no policies. Medusa connects as the
table owner, so it should be unaffected; confirm this after the scaffold and when designing the
lockdown.

Plan (agreed with Oscar 2026-10-07). Each workstream ends in one acceptance check.

1. [x] **Database and Data API.** SSL `databaseDriverOptions` outside development; a migration that
   creates the `app` schema with grants to `service_role` only. Oscar: `db push`, then sets the
   dashboard's exposed schemas to `app` only. Baseline 2026-10-07: `GET /rest/v1/product` with the
   publishable key returns `200 []` (reachable, rows hidden by RLS). Done 2026-10-07: both
   migrations pushed; Data API exposes only `app`.
2. [x] **Product images.** A migration for a public `products` bucket; the S3 file provider with
   `forcePathStyle`; the Supabase Storage host in `next.config.js` image patterns. Oscar: `db push`,
   S3 access keys into `.env`, a test upload in the admin. Done 2026-10-07.
3. [x] **Stripe and the GB region.** The Stripe provider; an idempotent `src/scripts` setup that
   creates the GB region (GBP, Stripe enabled), a GB tax region with 20% VAT, and one flat
   "Standard UK delivery" placeholder. Oscar: test keys into the env files, runs the script with
   `medusa exec`, `stripe listen`, test-card checkout.
4. [x] **Email.** A custom SMTP notification provider (`nodemailer`) on the email channel, and a
   test-email script. Dev sends from Oscar's own Gmail with an app password; Ben's address replaces
   it at launch (`.env` only).

VAT: the GB tax region uses the standard 20% rate, tax-inclusive GBP prices (Oscar, 2026-10-07).
Placeholder until Ben answers: one flat shipping rate. Stripe capture stays manual: Ben captures
each payment in the admin (Oscar, 2026-10-07). Redis modules are deferred to
Phase 5 with hosting.

Acceptance:

- [x] A product image upload lands in Supabase Storage (2026-10-07: admin upload to the sweatshirt
  is in `products`, public URL 200, rendered by `/dk/products/sweatshirt`).
- [x] A test-mode Stripe payment succeeds end to end (2026-10-07: test-card checkout at `/gb`,
  order #1 £65.00 incl. £10.83 VAT, authorised, then captured by Oscar in the admin).
- [x] A test email sends via Gmail SMTP (2026-10-07: `send-test-email.ts`, notification `smtp`
  status `success`, received in Oscar's Gmail).
- [x] The `public` schema is not reachable with the Supabase anon key (2026-10-07: `/rest/v1/product`
  404 PGRST205, with `Accept-Profile: public` 406 PGRST106, `/graphql/v1` 406).

## Phase 2 — Core flows and tests

Scope: guest checkout, registered checkout, account pages, the password-reset flow, order emails.
Write the Playwright end-to-end suite.

Plan (agreed with Oscar 2026-10-07; settings in `docs/decisions.md`, "Phase 2 settings"). Checked
against Medusa 2.21.2 and the starter: the starter has no password-reset pages, its profile password
form is a stub, and it already handles email verification (`/verify-account`).

1. [x] **Backend emails.** Plain, brand-neutral HTML templates as functions in
   `apps/backend/src/emails/`, unit-tested with Jest. The store name comes from Medusa's store record
   (`store.name`, editable in the admin), the sender from `SMTP_FROM`. Subscribers:
   - `order.placed` → order confirmation (items, totals incl. VAT, delivery address, order number).
   - `shipment.created` → order shipped (skipped when `no_notification`).
   - `auth.password_reset` → reset link: customers to the storefront, admin users to `/app`.
   - `auth.verification_requested` → verification link to `/verify-account`.
   Reset and verification links also go in the notification's `data` for the suite.
   `medusa-config.ts`: `admin.storefrontUrl` and `admin.backendUrl` from `STOREFRONT_URL` and
   `MEDUSA_BACKEND_URL` (added to `.env.template`); `http.authVerificationsPerActor` for customers.
2. [x] **Storefront account.** One `/reset-password` page (request form without a token, new
   password with one; top-level like the starter's `/verify-account`), new functions in
   `src/lib/data/customer.ts` (`sdk.auth.resetPassword`, `sdk.auth.updateProvider`), a "Forgot
   password?" link on the login form, and the profile password stub replaced by a "send me a reset
   link" button.
3. [x] **Test products.** `apps/backend/src/scripts/seed-e2e-products.ts`, idempotent and
   brand-neutral: `e2e-` products in GBP in the default sales channel with ample stock. `dev` only;
   Oscar runs it.
4. [x] **Playwright suite** in `apps/storefront/e2e/` (`@playwright/test`, storefront only). Config
   from `apps/storefront/.env.e2e` (gitignored, with a template): storefront and backend URLs, a test
   admin login (Oscar creates the user), and a plus-addressed base email on Oscar's Gmail so no mail
   goes to invented addresses. Emails are checked through `GET /admin/notifications`. Runs against
   Oscar's dev servers with `stripe listen`.
5. [x] **Docs.** `docs/handover.md` (URL variables, verification, test admin, seed),
   `docs/project_profile.md` (an `e2e` command; the suite needs live servers).

Oscar's steps: set `STOREFRONT_URL` and `MEDUSA_BACKEND_URL` in `apps/backend/.env`; create the test
admin with `npx medusa user`; run the seed script with `npx medusa exec`; start the dev servers and
`stripe listen`; check one confirmation email in a real inbox.

Done 2026-10-07 (code only): `tools/test-project build` passes (11 email template unit tests);
storefront typecheck and `next lint` on the changed files pass; `playwright test --list` finds 4
tests. **Not yet run live:** the subscribers, the reset pages and the suite need the steps above.
The Stripe iframe selectors in `e2e/support/checkout.ts` are the most likely to need adjusting.

First live run, 2026-10-07 (Oscar did all setup steps): the guest test drove the whole checkout,
Stripe card included, to order #2 (payment `authorized`, `order-confirmation` notification
`success`). Registration sent three `email-verification` notifications, all `success`. Fixed in the
suite: `product-title` also marks related-product cards, cart rows are `product-row`, add-to-cart
needs a wait for "Cart (1)", and dev-mode page compiles need 60 s. **Blocking the rest:** every test
fails at the admin login in `e2e/support/emails.ts`, because the password in `.env.e2e` contains `#`
and is unquoted, so it is read truncated. Oscar quotes it, then rerun the whole suite. Not yet seen
running: the reset pages, the profile reset button, sign-in after verification, order history, and
the shipped email (needs a shipment created in the admin).

Acceptance (Playwright suite green for):

- [ ] browse → product → add to basket → guest checkout with a Stripe test card
- [ ] register → verify email → log in → checkout → order appears in history
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
