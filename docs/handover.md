# Handover and fresh-setup runbook

How to stand the shop up on a new set of accounts (Ben's production accounts, or a fresh dev
environment). Kept current as each manual step is introduced ("Built for handover to Ben" in
`docs/decisions.md`). Steps are in the order they must run. Gaps not yet scripted are marked **Gap**.

Variable names and where each value comes from are in `apps/backend/.env.template`; the storefront's
are listed in step 7.

## 1. Supabase project and database

1. Create the Supabase project. Copy the **session pooler** connection string (port 5432) into
   `DATABASE_URL` in `apps/backend/.env`. Replace the `[YOUR-PASSWORD]` placeholder (brackets
   included) with the real password, percent-encoded if it has `@ : / # ? % &` or spaces.
2. Link the CLI and apply our SQL: `npx supabase link --project-ref <ref>`, then
   `npx supabase db push`. This applies everything in `supabase/migrations/`: the `app` schema, the
   `products` bucket, and the revoke on `rls_auto_enable`.
3. Dashboard → Project Settings → Data API → **Exposed schemas: `app` only** (remove `public` and
   `graphql_public`). Check: `GET https://<ref>.supabase.co/rest/v1/product` with the publishable key
   must fail (404 or 406), not return `200 []`.

## 2. Medusa database and admin user

1. `cd apps/backend && npx medusa db:migrate`.
2. `npx medusa user -e <email> -p <password>` for each admin (Ben, Oscar).
3. **Gap:** a fresh project has no stock location, shipping fulfillment set or publishable API key
   (on `dev` they came from the `create-medusa-app` seed). Script these before Phase 5.

## 3. Product image storage

1. Dashboard → Storage → S3 Configuration → **New access key**.
2. In `apps/backend/.env`: `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` and
   `S3_ENDPOINT` from that page; `S3_BUCKET=products`;
   `S3_FILE_URL=https://<ref>.supabase.co/storage/v1/object/public/products`.
3. Check: upload an image to a product in the admin; it appears in the `products` bucket.

## 4. Stripe

1. Stripe dashboard → Developers → API keys (test or live, matching the environment):
   - Secret key → `STRIPE_API_KEY` in `apps/backend/.env`.
   - Publishable key → `NEXT_PUBLIC_STRIPE_KEY` in `apps/storefront/.env.local`.
2. Webhooks:
   - **Deployed:** add an endpoint `https://<backend>/hooks/payment/stripe_stripe` for the events
     `payment_intent.amount_capturable_updated`, `payment_intent.succeeded`,
     `payment_intent.payment_failed` and `payment_intent.partially_funded`; its signing secret →
     `STRIPE_WEBHOOK_SECRET`.
   - **Local:** `stripe login` (to the same account as the keys), then the `stripe listen` command in
     `apps/backend/.env.template`; the `whsec_…` it prints → `STRIPE_WEBHOOK_SECRET`.
3. Start the backend once so Medusa registers the Stripe provider.

## 5. Email (Gmail SMTP)

1. On the sending Google account: turn on 2-Step Verification, then create an **App password**.
2. In `apps/backend/.env`: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` (the address),
   `SMTP_PASS` (the app password, no spaces), `SMTP_FROM` (`Name <same address>`; Gmail sends only
   as its own address).
3. Also in `apps/backend/.env`: `STOREFRONT_URL` (the storefront's public URL) and
   `MEDUSA_BACKEND_URL` (this server's public URL). Emails link to them: customers' password-reset
   and email-verification links go to the storefront, admin password-reset links to `/app`.
4. Admin → Settings → Store → set the store's **name**. Every email shows it; nothing in code does.
5. Check: `npx medusa exec ./src/scripts/send-test-email.ts <recipient>` ends with `status success`.

Customers must confirm their email before they can sign in (`http.authVerificationsPerActor` in
`medusa-config.ts`); guest checkout doesn't need it. There is nothing to set up beyond the URLs above.

## 6. United Kingdom region, VAT and delivery

1. After steps 2–4: `cd apps/backend && npx medusa exec ./src/scripts/setup-uk-region.ts`. Safe to
   re-run.
2. Adjust in the admin when Ben confirms: the VAT rate (Settings → Tax Regions → GB) and delivery
   rates (Settings → Locations & Shipping).

## 7. Storefront environment

In `apps/storefront/.env.local`: `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (admin →
Settings → Publishable API Keys), `NEXT_PUBLIC_DEFAULT_REGION=gb`, `NEXT_PUBLIC_STRIPE_KEY`. Leave
the `NEXT_PUBLIC_MEDUSA_PAYMENTS_*` variables empty. `NEXT_PUBLIC_*` values are built into the
browser code, so restart (or rebuild) after changing them.

## 8. After changing regions

The storefront caches regions for an hour. After changing regions or their countries, stop the
storefront, delete `apps/storefront/.next` and restart.

## 9. Final checks

- Backend `/health` returns 200; the admin loads at `/app`.
- A test-card checkout at `/gb` places an order; capturing it in the admin succeeds.
- The order confirmation email arrives; "Forgot your password?" on the sign-in page sends a working
  reset link; registering sends a verification link.

## 10. End-to-end tests (`dev` only, never `prod`)

The Playwright suite in `apps/storefront/e2e/` runs against the dev servers.

1. A dedicated admin user for the suite (it only reads notifications):
   `cd apps/backend && npx medusa user -e <e2e-admin-email> -p <password>`.
2. Test products, after step 6: `npx medusa exec ./src/scripts/seed-e2e-products.ts`. Safe to
   re-run; it also restocks them.
3. `cp apps/storefront/.env.e2e.template apps/storefront/.env.e2e` and fill it in: the admin user
   from 1, and `E2E_EMAIL`, a mailbox you own (tests send to plus-addresses of it).
4. Once per machine: `cd apps/storefront && npx playwright install chromium`.
5. Start `npm run dev` and `stripe listen`, then `cd apps/storefront && npm run test:e2e`.
