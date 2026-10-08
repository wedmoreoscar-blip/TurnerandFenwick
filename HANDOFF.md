# Session handoff — Phase 2 complete on `dev`; next is planning Phase 3

Written 2026-10-08 14:40. `main` is at `b5c947c` plus this session's commit, 20 local commits ahead of
`origin/main` before it. Oscar pushes; agents never do. Working tree clean at handoff.

## What was done this session

1. **Playwright suite green:** `cd apps/storefront && npx playwright test` → **4 passed (3.4m)**
   against Oscar's dev servers and `stripe listen`, after Oscar quoted `E2E_ADMIN_PASSWORD` in
   `.env.e2e`.
2. **Real bug fixed on the profile page** (`src/modules/account/components/account-info/index.tsx`):
   the closed edit panels were `max-h-0 opacity-0 overflow-visible`, so the Phone section's invisible
   "Save changes" button overflowed onto the new "Send link" button and caught its clicks. Closed
   panels are now also `invisible`, which also takes their hidden inputs out of the tab order. A
   one-off scratch check (not in the suite) confirmed the profile sections still open, save and close.
3. **Test timeout** in `apps/storefront/playwright.config.ts` raised from 120 s to 300 s: on a cold dev
   server the first test spent 40 s waiting for `/store` to compile and timed out at the Stripe step.
   The guest test then passed both on its own and in a full run on a warm server. The cold-start case
   hasn't been rerun with the new timeout.
4. **Oscar's checks:** he fulfilled, shipped and captured order #2 in the admin. Its `order-shipped`
   notification is `success`, and the email arrived in his inbox. He also saw order #6's confirmation
   email in his inbox.
5. **Records:** all four Phase 2 acceptance boxes ticked with evidence in `tasks/todo.md` ("Phase 2
   complete, 2026-10-08"); `docs/handover.md` step 10 notes run time and emails per run;
   `tasks/lessons.md` has "Collapsed panels that overflow still catch clicks".

Verification: `tools/test-project build` PASS (typecheck, lint, 11 unit tests, build); storefront
`tsc --noEmit` PASS; e2e suite PASS (4/4, live). No decisions changed.

## Known problems and risks

- `dev` now holds orders #1–#6 and many `e2e-` test customers. Orders #3–#6 are authorised but
  uncaptured; the authorisations lapse in Stripe after about 7 days, which is harmless on test mode.
- Each suite run creates customers and orders on `dev` and sends about 8 emails to plus-addresses of
  `E2E_EMAIL`.
- Unchanged: the fresh-project gap (no script creates a stock location, fulfillment set or publishable
  key); the storefront's one-hour region cache; `next lint` deprecated and failing on starter code;
  no local Postgres for backend integration tests (decide Docker before building Phase 3).
- Phase 3 depends on things still PENDING with Ben (`docs/decisions.md`, "Waiting on Ben"): the final
  measurement fields and condition grades, the blog section's name, whether sold items appear
  anywhere other than their own URL. Phase 3 scope also says to ask Oscar for the inbound-email
  implementation before building the inbox.
- To confirm with Ben: VAT registration and Margin Scheme; production account ownership; Stripe
  receipts (PENDING, may duplicate the confirmation email).

## Read first next session

`AGENTS.md`; `docs/decisions.md` (PENDING; "Product model for one-off second-hand items"; "Admin
additions live inside the Medusa admin"; "Current curation"; "Journal (blog)"; "Customer enquiries
and the admin inbox"; "Row-level security ships in the migration that creates the table"; "Database
and deployment workflow"); `tasks/todo.md` (Phase 3); `docs/project_profile.md` (backend
integration tests); `tasks/lessons.md`.

## Explicit exclusions

- Never read or print `apps/backend/.env`, `apps/storefront/.env.local` or `apps/storefront/.env.e2e`.
  To diagnose a value, print only derived facts (length, a boolean), never the value.
- Don't run database, seed, `medusa exec`, `db:generate` or `db:migrate` commands; hand them to Oscar.
- Don't build anything that depends on a PENDING decision; plan around it and ask.
- Phase 3 starts with planning agreed with Oscar, not code.

## PROMPT

```text
Run /kickoff. Phase 2 is complete on dev: the Playwright suite passes 4/4, and Oscar has seen the
confirmation and shipped emails in his inbox. Plan Phase 3 (custom features) with Oscar; don't build
yet. Read the Phase 3 scope in tasks/todo.md and the LOCKED decisions it relies on (product model,
admin additions, curation, journal, enquiries and inbox, RLS, database workflow). Check the Medusa
APIs involved against current docs with the Medusa skills, not memory. Then propose an ordered Phase 3
plan with acceptance criteria. For each item, say whether it needs a Medusa module or an `app` schema
migration (Oscar runs those), and which PENDING items from Ben block it (measurement fields,
condition grades, the journal's name, where sold items appear). Ask Oscar: (1) how inbound email for
the inbox should work, (2) whether to use Docker for a local Postgres so backend integration tests
can run before Phase 3 code lands. Record the agreed plan in tasks/todo.md and any new settled
decisions in docs/decisions.md.
```
