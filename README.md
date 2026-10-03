# <STORE_NAME>

Online shop for Ben Turner's menswear: suits and quality tailoring, sold as one-off second-hand pieces. The site is the master inventory, and a later phase syncs it with eBay and Vinted so nothing sells twice.

Status: planning done, build not started.

Full plan: [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md). UI approach: [`docs/UI_OVERHAUL_SKILL.md`](docs/UI_OVERHAUL_SKILL.md). Coding agents should read the project plan before any task.

## Stack

| Piece | Job |
|---|---|
| Medusa v2 (`/backend`) | Shop logic, admin dashboard, APIs, scheduled jobs |
| Next.js storefront (`/storefront`) | Medusa's official starter, restyled |
| Supabase | Postgres for Medusa + our own `app` schema; image storage |
| Redis | Medusa's events, workflows and locks (production only) |
| Stripe | Payments, via Medusa's Stripe provider |
| Gmail SMTP | Order, password-reset and inbox emails |

Ground rules: Medusa owns its tables and all logins. Our own data (journal, inbox) lives in the `app` schema. The storefront only talks to Medusa.

## What it does (v1)

- Shop, collections, product pages with full garment measurements and condition grade
- Customer accounts (with password reset) and guest checkout
- Current curation page
- Journal (blog), edited from the Medusa admin
- Enquiry form and "ask about this item", feeding an admin inbox synced with the shop's Gmail, with image attachments
- Everything Ben needs is in the Medusa admin; one login

## Look

English tailoring with a slightly irreverent edge. Cream, dark brown, burgundy, classic serif type. References: Rowing Blazers, Hackett, The Rake, Peter Christian. Must not look AI-generated. Product photos are always real and never AI-edited.

## Build order

0. Scaffold backend + storefront
1. Configure Medusa (Supabase, storage, Stripe, email)
2. Core shopping flows + Playwright end-to-end tests
3. Custom features (measurements, curation, journal, inbox)
4. UI overhaul (see `docs/UI_OVERHAUL_SKILL.md`)
5. Launch prep and deployment
6. eBay/Vinted sync engine (Medusa scheduled jobs)

## Not decided yet

- Paid email service (Resend) as a later upgrade
- What Ben's bundled hosting actually is
- Production hosting (Railway assumed, not confirmed)
- Cloudflare in front of the site
- How far to automate Vinted (decided in phase 6)

## Local setup

To be written in phase 0. Needs Node `^20.19.0 || >=22.12.0`, a Supabase dev project and the Stripe CLI.
