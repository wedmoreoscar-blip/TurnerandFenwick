# Session handoff — Phases 0 and 1 complete on `dev`; next is planning Phase 2

Written 2026-10-07 21:32. `main` is at `10afba0` plus this handoff commit, 18 local commits ahead of
`origin/main` before it. Oscar pushes; agents never do. Working tree clean at handoff.

## What was done this session

1. **Phase 0 closed.** `npm run dev` failed after the move because `DATABASE_URL` still held
   Supabase's `[PASSWORD]` placeholder. Oscar put the real password in; health, admin and the
   storefront's demo products were re-verified (`72a89a5`).
2. **Phase 1, all four acceptance checks pass** (recorded with evidence in `tasks/todo.md`):
   - **Database and Data API** (`57c8f1b`): migrations `20261007182414_create_app_schema.sql` (`app`
     closed to anon and authenticated, `service_role` only) and `20261007182418_create_products_bucket.sql`.
     Oscar pushed both and set the exposed schemas to `app` only. SSL driver options outside
     development in `medusa-config.ts`.
   - **Product images:** the S3 file provider on Supabase Storage (`forcePathStyle`); `next.config.js`
     allows `*.supabase.co/storage/v1/object/public/**`. An admin upload landed in `products`.
   - **Stripe and the UK** (`e594baa`, `ec3dea7`): Stripe provider with manual capture;
     `apps/backend/src/scripts/setup-uk-region.ts` (Oscar ran it) made GBP the tax-inclusive default,
     moved GB out of the demo Europe region and zone, and created the United Kingdom region (Stripe),
     20% GB VAT and a £5 "Standard UK delivery" placeholder. Test-card checkout at `/gb`: order #1,
     £65.00, authorised, then captured by Oscar.
   - **Email** (`10afba0`): custom SMTP provider `apps/backend/src/modules/smtp-notification/`
     (`nodemailer` 10, MIT-0, plus `@types/nodemailer`), the local `feed` provider re-registered,
     and `src/scripts/send-test-email.ts`. Sent from Oscar's Gmail and received.
3. **Decisions** (`docs/decisions.md`): new LOCKED "Built for handover to Ben" (account values only in
   env files, idempotent setup scripts, every manual step in `docs/handover.md`, no placeholder
   identity in code) and "Phase 1 settings" (20% VAT, manual capture, bucket limits, Redis to
   Phase 5, dev email). PENDING gains "Who owns each production account"; the VAT item now also asks
   about the Margin Scheme.
4. **`docs/handover.md`**: new fresh-setup runbook covering every manual step so far.
5. `docs/project_profile.md` Quirks: the `[YOUR-PASSWORD]` placeholder, and the storefront's one-hour
   region cache.

## Known problems and risks

- **Fresh-project gap:** no script yet creates a stock location, shipping fulfillment set or
  publishable API key (on `dev` the `create-medusa-app` seed did). Needed before Phase 5; marked
  **Gap** in `docs/handover.md`.
- **Demo data is still in `dev`:** the Europe region (EUR), demo products priced only in EUR/USD,
  except the Medusa Sweatshirt, which has £30 GBP prices. Phase 2's tests need GBP-priced products:
  decide how test data is created (a seed script Oscar runs, per the handover decision).
- **Storefront region cache:** after any region change, stop the servers, delete
  `apps/storefront/.next`, restart (Quirks).
- Local Stripe webhooks need `stripe listen` running (command in `apps/backend/.env.template`); the CLI
  login is to "New business · sandbox".
- The backend now refuses to start without the `SMTP_*` and Stripe variables set.
- To confirm with Ben: VAT registration and Margin Scheme; production account ownership.
- Unchanged: storefront `next lint` fails on starter code; `npm audit` advisories in the starter's
  dependencies; no local Postgres for backend integration tests (decide Docker before Phase 3).

## Read first next session

`AGENTS.md`; `docs/decisions.md` ("Built for handover to Ben", "Phase 1 settings", "Customer accounts
and roles", "Outbound email", "UI overhaul tooling choices" for Playwright Test); `tasks/todo.md`
(Phase 2); `docs/handover.md`; `docs/project_profile.md` (Quirks, Blocked verification).

## Explicit exclusions

- Never read or print `apps/backend/.env` or `apps/storefront/.env.local`; ask Oscar to check values.
- Don't run database, seed or `medusa exec` commands; hand them to Oscar.
- Don't start building Phase 2 before Oscar agrees the plan.

## PROMPT

```text
Run /kickoff. Phases 0 and 1 are complete on dev. Plan Phase 2 (tasks/todo.md: guest and registered
checkout, account pages, password reset, order emails, and the Playwright end-to-end suite) and agree
it with Oscar before building. Check first, against current Medusa docs and the starter's code: whether
the starter already has a password-reset flow (the decision says to build one if not, with the email
sent by a subscriber to Medusa's password-reset event); which Medusa events to subscribe to for the
order confirmation email and how its templates fit the "Built for handover to Ben" rules (no
placeholder store name in code); how the Playwright suite gets GBP-priced test products (a seed
script Oscar runs) and how it verifies emails were sent; and where Playwright Test is installed (in
apps/storefront only, ask before adding it). Record the agreed plan in tasks/todo.md, and keep
docs/handover.md current with any new manual step.
```
