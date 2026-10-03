# UI_OVERHAUL_SKILL.md: rough draft design for a UI overhaul skill

Status: rough draft. Nothing here is built yet. Last updated 2026-10-03.

Referenced from `docs/PROJECT_PLAN.md` (section 9, Phase 4). Coding agents doing UI work on the storefront follow this document; if the skill described here hasn't been packaged yet, follow the manual process in section 6.

## 1. Purpose

A reusable Claude Code skill (plus a small set of MCP servers) that takes an existing, working frontend and gives it a high-quality, specific visual identity **without changing any of its behaviour**.

Two requirements, equally weighted:

1. **Look:** professional, specific to the brief, not recognisably AI-generated.
2. **Behaviour lock:** every route, data call, button, form and payment flow works exactly as before. Proven by tests, not by eye.

First target: the Medusa Next.js starter storefront for Ben Turner's menswear shop. The skill should stay generic enough to reuse on other projects.

## 2. Where this idea comes from

Emad (a friend) restyled one of Oscar's existing PWAs in a few hours, keeping all functionality, with a far better result than unassisted AI output. From his messages:

- Tools: **Impeccable** (a Claude skill), **Refero MCP**, **Higgsfield** (MCP). He said it's "two MCPs mainly", which fits: Impeccable is a skill, Refero and Higgsfield are MCP servers.
- Workflow: generate **10 different design directions as text**, render **5 as mockups** in an artifact, **pick the best one**, then implement it.

Everything below about his exact setup is inferred from those messages. Worth asking him for his skill files and MCP config directly.

## 3. Why AI-built UI looks generic (the mechanism)

Asked for one design, a model returns the most probable design: the average of everything it has seen. That average has recognisable tells (Inter font, purple gradients, identical rounded cards with soft grey shadows, tracked-out all-caps labels above every heading, arrows appended to buttons). Four things are missing in a plain prompt, and each tool in Emad's setup supplies one:

| Missing ingredient | What it fixes | Tool in Emad's setup | Free substitute for this project |
|---|---|---|---|
| Taste rules | Bans the defaults, imposes typographic and spatial discipline | Impeccable | Impeccable is free |
| References | Shows what good looks like in this specific domain | Refero MCP | Screenshots of the four reference brands via Playwright MCP |
| Assets | Real-looking imagery so a mockup reads as designed | Higgsfield MCP | Ben's own photos; Higgsfield only if atmosphere imagery is needed |
| Verification | Proves nothing broke and checks the result visually | (not mentioned) | Playwright tests + Playwright MCP screenshots |

The fourth row is the addition this project needs most, because the storefront contains a payment flow.

## 4. The components

### 4.1 Impeccable (taste layer, free)

- Open-source design skill for AI coding agents by Paul Bakaus, Apache-2.0. Builds on Anthropic's `frontend-design` skill with deeper references and explicit anti-patterns.
- Install from the project root: `npx impeccable install`, then run `/impeccable init` inside Claude Code. Check the README at `github.com/pbakaus/impeccable` for current instructions.
- `init` writes `PRODUCT.md` (audience, purpose, constraints, voice). `/impeccable document` writes `DESIGN.md` (the visual system) from existing code.
- Commands most relevant here: `shape` (plan before code), `craft` (shape-then-build with visual iteration), `critique` (UX review), `audit` (accessibility, performance, responsive), `typeset`, `layout`, `colorize`, `quieter`, `distill`, `polish` (final pass), `live` (iterate on elements in the browser).
- Ships a deterministic detector CLI (`npx impeccable detect <path>`) with dozens of rules that need no LLM or API key. Usable as an automated gate.
- Writes working files under `.impeccable/`. Add its recommended `.gitignore` block.

Note on naming: Impeccable owns `PRODUCT.md` and `DESIGN.md` at the repo root. The project's own plan is therefore called `PROJECT_PLAN.md` to avoid a collision.

Don't install Anthropic's `frontend-design` skill alongside it. Impeccable already contains that guidance, and two overlapping skills give conflicting instructions.

### 4.2 Refero MCP (reference layer, paid)

- A library of real product screens, user flows and styles that an agent can search before designing. Requires a Refero Pro subscription, which includes a monthly MCP tool-call allowance.
- Connect in Claude Code (from Refero's docs): `claude mcp add --transport http refero https://api.refero.design/mcp --header "Authorization: Bearer <token>"`.
- Fit for this project: weak. Its library is drawn from software products (web apps and iOS). A niche tailoring shop is better served by screenshots of the actual reference brands (section 4.4).
- An unofficial community MCP (`fidgetcoding-refero-mcp`) wraps Refero's public styles catalogue and can generate a `DESIGN.md` from a chosen style. Unofficial; treat as optional.

### 4.3 Higgsfield MCP (asset layer, paid credits)

- Hosted MCP server (`https://mcp.higgsfield.ai/mcp`) giving Claude access to many image and video generation models. Generations spend credits from a Higgsfield account.
- Use for: homepage banners, textures, journal cover art, mockup placeholder imagery.
- Never use for: product photos, or anything that edits a photo of an item for sale. Second-hand garments must be shown exactly as they are.

### 4.4 Playwright MCP and Playwright Test (verification + free references)

- `@playwright/mcp` (Microsoft, Apache-2.0) lets the agent drive a real browser: open pages, click, take screenshots at chosen viewport sizes. Add with something like `claude mcp add playwright -- npx @playwright/mcp@latest` (check current docs).
- Three jobs:
  1. **Reference capture:** screenshot the reference brands' home, collection, product and journal pages at desktop and mobile widths, saved to `design/references/`.
  2. **Self-critique:** screenshot our own storefront after each change, so the agent judges the real rendering instead of imagining it.
  3. **Before/after record:** a screenshot set per page per pass, committed with the change.
- Playwright Test (the test runner, separate from the MCP) runs the end-to-end suite defined in `PROJECT_PLAN.md` Phase 2. That suite is the behaviour lock's proof.

## 5. Core concepts (draft)

### 5.1 The behaviour lock

The **contract** is everything a user or a test can do: routes and URLs, data calls, event handlers, form field names, server actions, `data-testid` attributes, ARIA roles and labels, payment wiring. The **surface** is everything visual: markup structure inside components, class names, tokens, fonts, imagery, spacing, motion.

The skill may change the surface freely and must not change the contract. Three layers of enforcement:

1. **Path boundaries:** an allowlist of files the agent may edit and a denylist it may not (section 7). Enforced in Claude Code via permission deny rules or a pre-edit hook, and double-checked by a script that fails if `git diff` touches a denylisted path.
2. **Contract preservation inside allowed files:** when replacing a component, keep its props, handler names, `data-testid`s and form `name`s identical.
3. **Proof:** the Playwright suite passes before the pass starts and after it ends. A red suite blocks the commit.

### 5.2 Diverge, then converge

Models collapse to the average when asked for one answer. Forcing breadth first, then letting a human choose, is what breaks the average:

```
10 written directions  →  shortlist 5  →  5 static mockups  →  human picks 1  →  tokens  →  components
       (cheap)                              (medium)            (taste gate)
```

Each written direction is short and concrete: a name, 4 to 6 hex colours, a type pairing, a layout concept with an ASCII sketch, one signature element, and what it deliberately avoids.

### 5.3 Tokens first

Most of a site's character comes from colour, typography and spacing. Set them once as tokens (Tailwind theme + CSS variables) before touching individual components. Component passes then mostly consume tokens instead of inventing values.

### 5.4 Small passes

One area per pass (layout shell, home, shop, product, cart, checkout, account, journal), each on its own branch or commit, each gated by tests and screenshots. A broken pass is cheap to revert.

### 5.5 The brief wins, but know the defaults

Ben's brief asks for cream, brown, burgundy and serif type. Cream plus a high-contrast serif is itself one of the most common AI-generated looks. The brief still wins; the skill compensates by spending its distinctiveness elsewhere:

- burgundy and dark brown instead of the default terracotta accent
- deliberately chosen typefaces (not Playfair Display, not Inter)
- layout rhythm drawn from tailoring and menswear editorial, not from a SaaS landing page
- consistent photography treatment
- Ben's own written voice

And avoids the surrounding template chrome: tracked all-caps eyebrow labels on every section, middle-dot metadata strings, arrows on every link, identical card grids, fade-up animations on every section.

## 6. Proposed workflow

Usable manually today; becomes the skill's instructions once proven.

| Stage | Action | Output |
|---|---|---|
| 0. Preconditions | Storefront fully functional. Playwright suite green. Clean git tree. | Baseline screenshots of every page in `design/baseline/` |
| 1. Brief | Run `/impeccable init`. Write `design/brand-brief.md`: palette intent, reference brands, tone ("slightly irreverent tailoring"), hard constraints (no AI product photos, WCAG AA, mobile first). | `PRODUCT.md`, `design/brand-brief.md` |
| 2. References | Playwright MCP captures the four reference sites (home, collection, product, journal; desktop and mobile). Agent writes an analysis of what each does with type, spacing, imagery, navigation and product presentation. Principles only; no copying. | `design/references/*.png`, `design/references/analysis.md` |
| 3. Diverge | 10 written directions (format in 5.2). | `design/directions.md` |
| 4. Mockups | Shortlist 5. Render each as a static HTML mockup of the home page and one product page, using real product data and Ben's photos. Optional Higgsfield banner imagery. | `design/mockups/<direction>/` |
| 5. Choose | Oscar (and Ben) pick one, or merge two. Record why. | `design/decisions.md` |
| 6. Codify | Write the chosen system into `DESIGN.md`. Implement tokens in `tailwind.config.js` and `src/styles/globals.css`, replacing the `@medusajs/ui-preset` defaults. | Tokens committed; suite green |
| 7. Restyle passes | Per area: edit within the allowlist, run the suite, screenshot, run `/impeccable critique` and `npx impeccable detect`, fix, commit. | One commit per area with before/after screenshots |
| 8. Polish | `/impeccable audit` then `/impeccable polish`. Final human review on desktop and phone. | Sign-off |

## 7. Applying it to the Medusa Next.js starter

Facts about the starter (checked against the current repo):

- UI lives in `src/modules/<area>/` (account, cart, categories, checkout, collections, common, home, layout, order, products, shipping, skeletons, store).
- Data access lives in `src/lib/data/` (cart, categories, collections, customer, fulfillment, orders, payment, products, regions and others).
- Styling: Tailwind with the `@medusajs/ui-preset` preset, plus many components imported from `@medusajs/ui`.
- Around 300 `data-testid` attributes already exist, which makes Playwright tests straightforward.
- Stripe Elements wiring sits in `src/modules/checkout/components/payment*` and `payment-wrapper/stripe-wrapper.tsx`.

Boundaries:

| Allow (restyle freely) | Deny (never edit during UI work) | Careful (containers only) |
|---|---|---|
| `src/modules/**` except the payment components | `src/lib/**` | `src/modules/checkout/components/payment*` |
| `src/styles/**` | `src/middleware.ts` | `src/app/**/layout.tsx` (wrappers only, not data fetching) |
| `tailwind.config.js`, `postcss.config.js` | `src/app/**/page.tsx` data-fetching logic | `next.config.js` (image `remotePatterns` only) |
| `public/**` (fonts, icons, static imagery) | `.env*`, `package.json` scripts | |
| new folders such as `src/modules/journal/**` | anything under `backend/` | |

Replacing `@medusajs/ui` components: create project primitives (for example `src/modules/common/components/ui/Button.tsx`) with the same props as the Medusa UI component they replace, then swap imports area by area. Behaviour stays because props, handlers and test ids pass straight through.

Stripe Payment Element: style it through Stripe's Appearance API (theme variables for colours, fonts, border radius) passed where the starter creates the Elements instance. Custom fonts must be passed to Stripe explicitly. Never target Stripe's iframe with CSS.

## 8. Draft skill package

```
.claude/skills/ui-overhaul/
  SKILL.md                    entry point (draft below)
  references/
    process.md                section 6 of this doc
    behaviour-lock.md         sections 5.1 and 7, made generic with a per-project boundaries file
    anti-patterns.md          project-specific additions on top of Impeccable's
  scripts/
    capture.ts                Playwright script: screenshot a URL list at set viewports
    check-boundaries.sh       fails if git diff touches denylisted paths
design/
  boundaries.json             per-project allow/deny/careful globs read by check-boundaries.sh
  brand-brief.md, directions.md, decisions.md, references/, mockups/, baseline/
```

Draft `SKILL.md`:

```markdown
---
name: ui-overhaul
description: Restyle an existing, working frontend to a specific brief without changing behaviour. Use when asked to redesign, reskin or "make it look better" on a project that already works. Requires a passing end-to-end test suite.
---

# UI overhaul

Never change behaviour. Read references/behaviour-lock.md and design/boundaries.json before editing anything.

1. Confirm preconditions: e2e suite passes, git tree clean. If not, stop and report.
2. Follow references/process.md stage by stage. Do not skip stage 5: a human chooses the direction.
3. Work one area per commit. After each area: run the e2e suite, run scripts/check-boundaries.sh,
   take screenshots with Playwright MCP, run `npx impeccable detect`, fix, then commit.
4. If a change seems to require editing a denied path, stop and ask.
5. Use Impeccable commands for design judgement (shape, critique, polish, audit).
6. Never generate or edit images of products for sale.
```

Project MCP config sketch (`.mcp.json` at repo root; confirm format and env-var syntax against Claude Code docs):

```json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["@playwright/mcp@latest"] },
    "medusa-docs": { "type": "http", "url": "https://docs.medusajs.com/mcp" },
    "refero": {
      "type": "http",
      "url": "https://api.refero.design/mcp",
      "headers": { "Authorization": "Bearer ${REFERO_TOKEN}" }
    },
    "higgsfield": { "type": "http", "url": "https://mcp.higgsfield.ai/mcp" }
  }
}
```

Refero and Higgsfield are optional; leave them out until section 9 says otherwise. Every connected MCP adds tool definitions to the agent's context, so only connect what's used.

## 9. Build roadmap for the skill

| Version | What | Trigger to move on |
|---|---|---|
| v0 (manual) | No skill packaging. Install Impeccable and Playwright MCP, follow section 6 by hand on one area (the product page). | One area restyled, suite green, result approved |
| v1 (skill) | Package sections 5 to 7 as the `ui-overhaul` skill with the boundary script. Run it on the remaining areas. | Whole storefront done in Phase 4 |
| v2 (paid add-ons) | Add Refero and/or Higgsfield only if v0/v1 output still looks generic or mockups need imagery. | Clear quality gap that references or imagery would fix |
| v3 (reuse) | Move the skill to `~/.claude/skills/` for use across projects; keep `design/boundaries.json` per project. | A second project needs it |

## 10. Costs

| Component | Cost |
|---|---|
| Impeccable | Free (Apache-2.0) |
| Playwright MCP and Playwright Test | Free (Apache-2.0) |
| Medusa docs MCP | Free |
| Google Fonts candidates | Free (SIL Open Font License) |
| Refero MCP | Refero Pro subscription |
| Higgsfield MCP | Pay-per-generation credits |

## 11. Risks and rules

- **Copying reference brands.** Learn principles (spacing, hierarchy, tone). Never reproduce their logos, copy, imagery or distinctive page layouts.
- **Font licensing.** Only fonts with a licence allowing web use. Self-host via `next/font` for performance.
- **Contrast.** Burgundy and brown on cream can fail WCAG AA at small sizes. Check every text/background pair.
- **Performance.** Limit font families and weights. Serve product photos through `next/image` at sensible sizes.
- **Mockup drift.** Mockups are static HTML; the real components have states (loading, empty, error, sold, out of stock). Check every state, not just the happy path.
- **Context bloat.** Too many MCP servers and skills degrade the agent's focus. Keep the toolset minimal.
- **Unknown original setup.** Emad's actual skills and prompts may differ from this reconstruction. Ask him.

## 12. Open questions

- Which exact skills, prompts and MCP config does Emad use? Can he share them?
- Does Ben want to review the 5 mockups himself, or only the final pick?
- Are Ben's current photos consistent enough for mockups, or is a quick reshoot (same backdrop and light) needed first?
- Is any paid component justified after v0, or does the free stack reach the bar?
