# Project Decisions

This is the durable design ledger. Agents add entries only through the `update-decisions` workflow.
Keep history: supersede an entry instead of deleting it. Only `LOCKED` entries are settled truth.

Entry headings use one of `LOCKED`, `PENDING`, `SUPERSEDED`, with a date:

    ## LOCKED — <decision in one line> (YYYY-MM-DD)

Every entry dated 2026-10-03 below was ported from the starter brief, `docs/PROJECT_PLAN.md` and
`docs/UI_OVERHAUL_SKILL.md`, on the day the repository moved onto the agent kit. Section references
(§) point into those files for the original wording. From now on this ledger, not the starter brief,
is where decisions live and change; where they disagree, this ledger wins. The build phases and
acceptance criteria moved to `tasks/todo.md`.

## PENDING

Deliberately undecided. **Do not build any of these, do not pick a provider for them, and do not
write code that assumes an answer.** If a task depends on one, stop and ask Oscar.

- **Production hosting** (§10.2, §13). Working assumption, not confirmed: Medusa server, storefront
  and Redis as three services on Railway with a hard spending limit; Supabase free tier for database
  and storage. **Do not write deployment config for any host until this is closed.** Decide before
  Phase 5.
- **Ben's bundled hosting service** (§3, §13). Came with his domain; provider and plan unknown,
  probably shared PHP hosting, so unsuitable for Medusa. A mailbox on Ben's domain could replace the
  Gmail address for sending. Decide before Phase 5.
- **Cloudflare in front of the site** (§13). Proposed: free plan, DNS + proxy, SSL mode Full, keep
  Bot Fight Mode off or test Stripe webhooks with it on, verify MX/TXT records before switching
  nameservers. Decide before Phase 5.
- **Paid email service (Resend or similar)** (§7.7, §13). v1 uses Gmail SMTP. Revisit if
  deliverability or volume becomes a problem.
- **Vinted sync extent** (§7.9, §13). Vinted has no public API, no sanctioned way to create listings
  programmatically, and blocks automation; automating it risks Ben's account. Options: fully
  automatic, semi-manual (Ben lists by hand, the system only marks items sold), or excluded. Decide
  at the start of Phase 6.
- **Stripe's own payment receipts** (§7.7). Decide with Ben whether to enable them, to avoid
  duplicate emails alongside the order confirmation.
- **Repository layout vs `create-medusa-app`** (new, 2026-10-03). The starter brief suggests
  top-level `backend/` and `storefront/` (§0), but current `create-medusa-app` scaffolds a monorepo
  with `apps/backend` and `apps/storefront`. Decide at Phase 0 whether to keep the generated layout or
  rearrange; every path in this ledger that starts `backend/` or `storefront/` follows that choice.
- **Medusa documentation route for agents** (new, 2026-10-03). The starter brief names Medusa's docs
  MCP server (`https://docs.medusajs.com/mcp`), which needs a Medusa Cloud account (OAuth or a
  personal access key). Alternatives: `https://docs.medusajs.com/llms.txt` (no account) and
  Medusa's agent skills (`medusajs/medusa-agent-skills`). Decide before Phase 0.
- **Waiting on Ben** (§14), blocking specific phases, not architecture: store name and logo
  (placeholder `<STORE_NAME>`); the official Gmail address; shipping zones and rates and whether to
  sell internationally; VAT registration status; returns policy; the final measurement fields and
  condition grades; the blog section's name ("Journal" is a placeholder); whether sold items appear
  anywhere other than their own URL; About page text and the first journal posts.

## LOCKED — Goal and priorities (2026-10-03)

From §1. A professional online shop for Ben Turner's menswear: suits and high-quality tailoring, sold
as one-off second-hand pieces. The site is the master inventory; a later phase syncs it with eBay and
Vinted so an item never sells twice. Priorities, in order:

1. Looks professional and distinctive (English tailoring, slightly irreverent). Must not look
   AI-generated or templated.
2. Correct, safe commerce: payments, stock, orders, accounts.
3. Cheap to run. Free and open-source software wherever possible.
4. Few moving parts. Do not add a service or library when an existing piece already covers the need.
5. Do not build from scratch what Medusa already provides.

## LOCKED — People and access (2026-10-03)

From §2.

| Person | Role | Access |
| --- | --- | --- |
| Oscar | Developer. Builds mostly with AI coding tools. Familiar with Supabase, new to Medusa. | Medusa admin, Supabase, all infra |
| Ben Turner | Seller and client. Uploads listings, answers customer queries, writes blog content. Non-technical. | Medusa admin only |
| Customers | Browse, buy, send queries. | Registered account or guest checkout |

Ben's admin experience stays in one place, the Medusa admin dashboard. He never logs in to Supabase.

## LOCKED — Starting point: nothing is migrated (2026-10-03)

From §3.

- The existing barebones WordPress + WooCommerce install (Stripe configured, no products or content)
  is abandoned. Nothing is migrated from it.
- Reuse the existing Stripe account, with **test-mode keys** for all development.
- Ben owns the domain; it is not pointed at any host yet.
- Oscar's earlier Supabase project (a read-only, admin-only feedback page with an email address
  synced into it) is the basis for the inbox's inbound-email flow.

## LOCKED — Architecture (2026-10-03)

From §4. The storefront calls the Medusa Store API (`/store/*`) via `@medusajs/js-sdk`. The Medusa v2
server holds shop logic and the admin dashboard, plus custom API routes, admin pages, scheduled jobs
and subscribers. Behind it: Redis (production only: events, workflows, locking, cache), Supabase
Postgres (Medusa's tables plus our own `app` schema), Supabase Storage (product images via the S3
provider; blog and inbox files), Stripe (payments, via Medusa's Stripe provider), and Gmail SMTP
(outbound email, via a custom notification provider).

| Piece | Does | Does not |
| --- | --- | --- |
| Medusa v2 | Products, variants, collections, categories, stock, carts, checkout, orders, returns, refunds, tax regions, shipping options, customer accounts, guest checkout, admin users, admin dashboard, Store and Admin APIs, scheduled jobs, event subscribers, custom modules and routes | Store data itself (needs Postgres), host a storefront, send email without a provider, blogs, email inboxes |
| Next.js storefront | Everything customers see. Starts as Medusa's official Next.js starter. | Talk to the database directly. All shop data comes through Medusa's Store API. |
| Supabase | Postgres for Medusa and our own tables. Storage for images and attachments. pg_cron for Supabase-only housekeeping. | Shop logic. Customer or admin login (Medusa owns identity). Host Medusa (it needs an always-on server). |
| Redis | Medusa's event queue, workflow engine, locks and cache in production | Store shop data |
| Stripe | Card payments, refunds, payment confirmation webhooks | Order or stock logic |

## LOCKED — Data and identity rules, non-negotiable (2026-10-03)

From §5.

1. **Medusa owns its tables.** Never write to them with raw SQL, pg_cron, Supabase client libraries
   or Edge Functions. All changes to products, stock, orders and customers go through Medusa (Admin
   API, workflows or module services). Raw writes skip Medusa's workflows (stock reservations,
   totals, events) and corrupt state.
2. **Our own data lives in a separate Postgres schema, `app`**: blog posts, inbox threads, messages,
   attachment metadata, site settings.
3. **Lock down Supabase's Data API.** Remove `public` from the exposed schemas so Medusa's tables
   cannot be reached with the anon key. Expose only `app`. Enable row-level security on every `app`
   table. Write no policies for `anon` or `authenticated` unless a task explicitly requires one.
4. **Only server-side code touches `app`.** The Medusa server and Supabase Edge Functions use the
   service-role key. It never appears in the storefront, in browser code, or in any `NEXT_PUBLIC_*`
   variable.
5. **Medusa handles all identity.** Admin users and customers authenticate through Medusa. Do not use
   Supabase Auth.
6. **The storefront reads custom content through Medusa.** Blog and curation content are served by
   custom Medusa store routes (`/store/...`), so the storefront has one API and holds no Supabase
   keys.
7. **Database connection:** Medusa connects to Supabase through the **session-mode pooler**
   (port 5432). The direct connection is IPv6-only and fails on many hosts; do not use the
   transaction-mode pooler. Supabase requires SSL; configure Medusa's database driver options to
   match.

## LOCKED — Customer accounts and roles (2026-10-03)

From §6.

- Full customer accounts: register, log in, log out, profile, saved addresses, order history,
  **password reset**.
- Guest checkout also available; a guest's order works end to end without an account.
- Medusa's `emailpass` auth provider for customers and admins.
- Admin access is Medusa admin users only (Ben and Oscar). No other roles in v1.
- If the starter storefront lacks a password-reset flow, build one (request page and reset page)
  following Medusa's storefront docs. The reset email is sent by a subscriber to Medusa's
  password-reset event.

## LOCKED — Storefront pages and region (2026-10-03)

From §7.1. Keep the starter's routing and country-code URL scheme
(`storefront/src/app/[countryCode]/...`) in v1; do not restructure routing to remove the country
code.

| Page | Source | Notes |
| --- | --- | --- |
| Home | starter, restyled | Editorial feel. Features the current curation and recent journal posts. |
| Shop (all items) | starter `store` page | Filter by category and size. Hide sold items from the listing. |
| Category and collection pages | starter | |
| Product page | starter, extended | Adds measurements table, condition grade, flaw notes, "Ask about this item" button. Sold items stay reachable at their URL and show a clear Sold state. |
| Current curation | new | See the curation entry |
| Journal index and post pages | new | See the journal entry |
| Contact / enquiry | new | See the inbox entry |
| Cart, checkout, order confirmation | starter | Restyle only. Behaviour must not change. |
| Account (login, register, reset password, profile, addresses, orders) | starter + reset flow | |
| Static pages: About, Delivery and returns, Privacy, Terms | new | Content from Ben |

Region: United Kingdom, currency GBP, `NEXT_PUBLIC_DEFAULT_REGION=gb`. Shipping zones and
international selling wait on Ben.

## LOCKED — Product model for one-off second-hand items (2026-10-03)

From §7.2.

- Each listing is one Medusa product with one variant, `manage_inventory` on, stock quantity 1.
- Each variant has a unique, permanent SKU. The sync engine relies on SKUs never changing.
- When stock reaches 0 the item is sold everywhere on this site.
- Structured fields live in product `metadata` under fixed keys. **The key list is a starting point;
  confirm the final list with Ben before building the form.**

| Key | Applies to | Example |
| --- | --- | --- |
| `labelled_size` | all | `40R` |
| `brand` | all | `Hackett` |
| `composition` | all | `100% wool` |
| `condition_grade` | all | one of `new_with_tags`, `excellent`, `very_good`, `good`, `fair` |
| `flaws` | all | free text |
| `m_chest_pit_to_pit_cm` | jackets, shirts | `54` |
| `m_shoulder_cm` | jackets | `46` |
| `m_sleeve_cm` | jackets, shirts | `64` |
| `m_back_length_cm` | jackets | `76` |
| `m_waist_cm` | trousers | `86` |
| `m_inside_leg_cm` | trousers | `81` |
| `m_rise_cm` | trousers | `28` |
| `m_hem_cm` | trousers | `20` |
| `m_collar_cm` | shirts | `40` |

- A Medusa **admin widget** on the product details page (`backend/src/admin/widgets/`) edits these
  fields as a proper form, so Ben never edits raw key-value metadata.
- The storefront product page renders a measurements table from these keys, showing only keys with
  values.

## LOCKED — Admin additions live inside the Medusa admin (2026-10-03)

From §7.3. Built in: products, image upload, collections, categories, stock, orders, refunds,
customers, admin users. Custom additions, all inside the Medusa admin so Ben has one login:

| Addition | Type | Location |
| --- | --- | --- |
| Measurements and condition form | widget | `backend/src/admin/widgets/` |
| Journal editor | UI route | `backend/src/admin/routes/journal/` |
| Inbox | UI route | `backend/src/admin/routes/inbox/` |
| Current curation picker | widget or UI route (choose when building) | see the curation entry |

Admin UI routes call custom Admin API routes in `backend/src/api/admin/...`, which read and write the
`app` schema with the service-role key.

## LOCKED — Current curation (2026-10-03)

From §7.4.

- A curation is a Medusa **product collection** plus an intro text and a cover image.
- The intro, cover image path and an `is_current_curation` flag live in the collection's `metadata`.
- Exactly one collection is current at a time; the admin picker enforces this.
- A storefront route (for example `/[countryCode]/curation`) shows the current curation. Past
  curations stay reachable via their collection pages.

## LOCKED — Journal (blog) (2026-10-03)

From §7.5. The name "Journal" is a placeholder until Ben confirms. Table `app.posts`:

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid pk | |
| slug | text unique | |
| title | text | |
| excerpt | text | |
| body_markdown | text | Markdown, rendered on the storefront |
| cover_image_path | text | Supabase Storage path, bucket `journal` (public) |
| status | text | `draft` or `published` |
| published_at | timestamptz | |
| related_product_ids | text[] | optional Medusa product ids |
| created_at, updated_at | timestamptz | |

- Admin editor: Markdown with preview, and image upload to the `journal` bucket.
- The storefront reads published posts via custom store routes (for example `GET /store/journal` and
  `GET /store/journal/:slug`).
- Publishing uses Next.js on-demand revalidation (the starter's `REVALIDATE_SECRET`), so the site
  updates without a rebuild.

## LOCKED — Customer enquiries and the admin inbox (2026-10-03)

From §7.6. Customers contact the shop through a contact form or an "Ask about this item" button
(linked to a product), and the official Gmail address also receives email directly. All of it lands
in one inbox inside the Medusa admin, where Ben reads threads and replies, with image attachments both
ways. This inbox replaces a CRM in v1; no CRM is planned.

Tables in `app`:

- `threads`: id, customer_email, customer_name, subject, product_id (nullable), status
  (`open` / `closed`), gmail_thread_id (nullable), last_message_at, created_at
- `messages`: id, thread_id, direction (`inbound` / `outbound`), sender, body_text, body_html,
  gmail_message_id (nullable), sent_at
- `attachments`: id, message_id, storage_path, mime_type, size_bytes

Attachments go in a **private** Supabase Storage bucket `inbox`; the admin views them through
short-lived signed URLs generated by the Admin API route.

Flows:

1. **Storefront form:** `POST /store/enquiries` (custom route) creates a thread and message and sends
   an acknowledgement email. Spam protection in v1: a honeypot field plus a server-side rate limit
   per IP and email.
2. **Inbound email** to the official Gmail address reuses the email-to-Supabase pattern from Oscar's
   feedback page. **Agents: ask Oscar for that implementation before building this flow.** Inbound
   emails become messages on the matching thread (by Gmail thread id or reply headers) or a new
   thread.
3. **Admin reply:** Ben writes a reply (optionally with images) in the inbox UI. The Admin API route
   sends it via Gmail SMTP with correct `In-Reply-To` and `References` headers so it threads in the
   customer's mail client, then stores it as an outbound message.

## LOCKED — Outbound email through Gmail SMTP, no paid service in v1 (2026-10-03)

From §7.7.

- A **custom Medusa notification module provider** (email channel) sends through SMTP with
  `nodemailer`, authenticated as the official Gmail address with an app password.
- v1 emails: order confirmation, order shipped, password reset, enquiry acknowledgement, inbox
  replies.
- Templates stay simple, plain HTML, styled to the brand palette and fonts with safe fallbacks.
- The provider sits behind Medusa's notification interface, so swapping to a paid provider later is a
  config change.

## LOCKED — Payments through Medusa's Stripe provider (2026-10-03)

From §7.8.

- Medusa's built-in Stripe payment provider, enabled for the GB region.
- Test keys during development. Live keys only at launch, set by Oscar.
- The Stripe webhook points at the Medusa server's Stripe hook endpoint; locally, the Stripe CLI
  forwards webhooks.
- The starter's `NEXT_PUBLIC_MEDUSA_PAYMENTS_*` variables relate to Medusa Cloud payments. Leave them
  empty.
- Style the Stripe Payment Element only through Stripe's Appearance API (colour, font and radius
  variables), never through CSS overrides of Stripe's iframe. Custom fonts must be passed to Stripe
  explicitly.

## LOCKED — Inventory sync engine is last, in Medusa jobs and subscribers (2026-10-03)

From §7.9.

- **No sync code before Phase 6.** Everything else must be working first.
- eBay: official APIs (listing management and order notifications). Vinted: see PENDING.
- Implementation home: **Medusa scheduled jobs and event subscribers in TypeScript** inside the
  backend (`backend/src/jobs/`, `backend/src/subscribers/`). An `order.placed` subscriber triggers
  delisting elsewhere; scheduled jobs poll channels without webhooks. All stock changes go through
  Medusa.
- Exception: if Phase 6 concludes Vinted needs headless-browser automation, that part may move to a
  separate worker process. Decide then.
- The variant-to-listing mapping will likely be a custom Medusa module linked to product variants.
  Design it in Phase 6, including how oversells (two channels selling in the same minute) are detected
  and handled.

## LOCKED — Aesthetic direction (2026-10-03)

From §8; details are refined in the UI overhaul.

- Brief from Ben: English tailoring, "a slightly irreverent angle on tailoring", burgundy, dark brown
  and cream, fonts "of a similar ilk", curated feel. Shorthand: the Kingsman look (Ben agreed, from
  images).
- Reference brands, for principles only (never their assets, logos, copy or exact layouts):
  https://rowingblazers.com/, https://www.hackett.com/uk/en_gb/, https://therake.com/,
  https://www.peterchristian.co.uk/journal/our-story/
- Candidate tokens, finalised in the UI overhaul's direction stage: background cream `#F1E8D6`, text
  dark brown `#2E211A`, accent burgundy `#6B1F2A`, secondary accent to test (bottle green `#1F3A2E` or
  brass `#A88A4E`), muted text a tinted brown and never neutral grey.
- Typography: free SIL Open Font License fonts via Google Fonts. A display serif such as Cormorant
  Garamond or Libre Caslon Display; body in a readable serif (for example EB Garamond) or a
  deliberately chosen humanist sans. **Never Playfair Display or Inter.** One or two families only.
- Known risk: cream plus a serif display is one of the most common AI-generated defaults.
  Distinctiveness must come from the burgundy-and-brown palette (not terracotta), specific typefaces,
  layout rhythm, photography treatment and Ben's written voice.
- Photography: consistent rather than professional; same backdrop, light and framing for every item.
- Copy: the irreverent angle comes from Ben's writing in product descriptions and the journal. Plain,
  clear interface copy everywhere else.

## LOCKED — Product photos are never AI-generated or AI-edited (2026-10-03)

From §0, §8 and the decision log. Product images are real photos of real second-hand garments, shown
exactly as they are. Never generate, edit or "enhance" them with AI. AI imagery is allowed only for
atmosphere (for example a homepage banner, textures, journal cover art) and never depicts an item for
sale.

## LOCKED — UI work follows the UI overhaul process and its behaviour lock (2026-10-03)

From §9 and `docs/UI_OVERHAUL_SKILL.md`. The starter's look (Medusa UI components, the
`@medusajs/ui-preset` Tailwind preset, grey palette) reads as a software dashboard and recolouring
alone will not reach the brief; expect to replace the starter's visual components while keeping their
behaviour. Whenever the storefront must match the aesthetic (Phase 4 and any later UI work), follow
`docs/UI_OVERHAUL_SKILL.md`; until the skill is packaged, follow its manual process.

Behaviour lock:

- **Restyle freely:** `storefront/src/modules/**` (except the payment components),
  `storefront/src/styles/**`, `storefront/tailwind.config.js`, `postcss.config.js`,
  `storefront/public/**`, and new folders such as `storefront/src/modules/journal/**`.
- **Never edit during UI work:** `storefront/src/lib/**` (the data layer), `storefront/src/middleware.ts`,
  data-fetching logic in `src/app/**/page.tsx`, `.env*`, `package.json` scripts, anything under
  `backend/`.
- **Containers only:** `storefront/src/modules/checkout/components/payment*` (Stripe Elements wiring),
  `src/app/**/layout.tsx` (wrappers, not data fetching), `next.config.js` (image `remotePatterns`
  only).
- Preserve every `data-testid` (the starter has around 300), form field `name`, event handler and
  server action call. Replace `@medusajs/ui` components with project primitives that take the same
  props.
- The Playwright suite must pass before and after every UI pass.

## LOCKED — UI overhaul tooling choices (2026-10-03)

From `docs/UI_OVERHAUL_SKILL.md` §4 and §8.

- Impeccable is the taste layer. It owns `PRODUCT.md` and `DESIGN.md` at the repository root, which
  is why the starter brief was named `PROJECT_PLAN.md`. Do not also install Anthropic's
  `frontend-design` skill: the two overlap and conflict.
- Playwright MCP for reference capture, self-critique and before/after records; Playwright Test for
  the behaviour lock's proof.
- Refero MCP and Higgsfield MCP are optional paid add-ons, connected only if the free stack's output
  still looks generic or mockups need imagery. Connect only MCP servers that are used.
- **Impeccable's installer must be checked before use** (new, 2026-10-03): if `npx impeccable install`
  writes skills into a home folder (`~/.claude/skills` and similar), redirect them into the project and
  mirror them, per the no-global-skills rule.

## LOCKED — The UI overhaul skill becomes a kit pack, never a global skill (2026-10-03)

Corrects `docs/UI_OVERHAUL_SKILL.md` §8 and §9 (v3). The skill is built in this repository as a
project skill, mirrored byte-identically into `.agents/skills/ui-overhaul/` and
`.claude/skills/ui-overhaul/`. When it is proven, Oscar adds it to the agent kit as a `ui-overhaul`
pack with `kit push --new` (the per-project `design/boundaries.json` stays here). It is never copied
into `~/.claude/skills` or any other home folder.

## LOCKED — Local development setup (2026-10-03)

From §10.1 and §10.3.

- Node per Medusa's requirement (`^20.19.0 || >=22.12.0`).
- Two Supabase projects, `dev` and `prod` (the free tier allows this). Development uses `dev`.
- Locally Medusa may use its default in-memory event bus, workflow engine and locking; Redis modules
  are configured for production only.
- Stripe CLI for webhook forwarding.
- `next.config.js` image `remotePatterns` includes the Supabase Storage hostname so `next/image` can
  load product photos.
- Never commit secrets; provide `.env.template` files with empty values. Variable names are
  indicative until confirmed against current Medusa docs:
  - Backend: `DATABASE_URL` (Supabase session pooler), `REDIS_URL` (production), `STORE_CORS`,
    `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `STRIPE_API_KEY`,
    `STRIPE_WEBHOOK_SECRET`, S3 variables for Supabase Storage (endpoint, region, bucket, access key
    id, secret, public file URL), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST`,
    `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `STOREFRONT_URL`.
  - Storefront: `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BASE_URL`,
    `NEXT_PUBLIC_DEFAULT_REGION=gb`, `NEXT_PUBLIC_STRIPE_KEY`, `REVALIDATE_SECRET`.

## LOCKED — Medusa configuration (Phase 1 checklist) (2026-10-03)

From §11.

- Database: Supabase `dev` via the session pooler, SSL configured.
- File module: the S3 file provider pointed at Supabase Storage's S3-compatible endpoint; public
  bucket `products` for product images.
- Payment module: the Stripe provider.
- Notification module: the custom SMTP provider on the email channel.
- Production only: Redis event bus, Redis workflow engine, Redis (or Postgres) locking, Redis
  caching (`event-bus-redis`, `workflow-engine-redis`, `locking-redis`, `locking-postgres`,
  `caching-redis`). Check current docs for exact config keys.
- Region GB, GBP, Stripe enabled, tax settings per Ben's VAT status.
- A sales channel and publishable API key for the storefront.
- Shipping options per Ben's rates.

## LOCKED — Medusa APIs are checked against current docs, never recalled (2026-10-03)

From §0. Medusa v2 changes often. Check current documentation for Medusa APIs and config syntax
rather than relying on memory. How agents reach the docs is PENDING above.

## LOCKED — Build in phase order (2026-10-03)

From §0 and §12. Build phases 0–6 in order, and do not start a phase until the previous phase's
acceptance criteria pass. The phases and their criteria are tracked in `tasks/todo.md`.

## LOCKED — Oscar runs anything that changes a live service (2026-10-03)

Agents may write migrations, SQL, Edge Functions and configuration, but **never run them against a
real Supabase project or other live service**. Oscar applies migrations, deploys Edge Functions, and
runs SQL himself (for example in the Supabase SQL editor). An agent's job ends at the reviewed file
plus clear instructions for running it. The exact command deny-list is set in Phase 5, when a
deployable backend exists.

## LOCKED — Where this repository's records live (2026-10-03)

- `docs/PROJECT_PLAN.md` and `docs/UI_OVERHAUL_SKILL.md` are the starter brief, moved into `docs/` to
  match the README's links. Their decisions are ported into this ledger, and the phases into
  `tasks/todo.md`. They remain as background; this ledger wins on any disagreement.
- `AGENTS.md` (imported by `CLAUDE.md`) is the agent entry point and points agents at this ledger
  first. This replaces the starter brief's idea of `CLAUDE.md` as a one-line pointer to the plan.

## LOCKED — Decision log carried over from the starter brief (2026-10-03)

From §15.

| Decision | Reason |
| --- | --- |
| Medusa v2 instead of WordPress/WooCommerce | Ready-made shop logic without PHP; API-first design suits the sync engine and AI-assisted development; storefront fully customisable. |
| Supabase as Medusa's Postgres, plus storage and `app` schema | Medusa needs Postgres and has none of its own; Oscar already knows Supabase; free tier. |
| Medusa owns identity; no Supabase Auth | Avoids two login systems for the same people. |
| Inbox, journal and curation inside Medusa admin | One login and one dashboard for Ben. |
| Gmail SMTP instead of Resend for v1 | Free; adequate at this shop's volume. |
| Full customer accounts plus guest checkout | Requested. Requires a password-reset email from day one. |
| Sync engine last, in Medusa scheduled jobs (TypeScript) | Keeps stock changes inside Medusa; one less service to host. Vinted extent deferred. |
| Vercel Hobby excluded | Its terms forbid commercial use. Medusa also cannot run on Supabase, Vercel serverless or typical shared hosting. |
| No AI-generated product photography | Second-hand goods must be shown as they are. |
