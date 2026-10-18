# EasyEcom · Après Club

A local storefront design built with Next.js App Router, React, TypeScript, bespoke CSS tokens, and original SVG concept artwork. This phase implements the shopping interface. **The bag and checkout are demonstration-only; there is no payment processing, live inventory, order creation, fulfillment, or analytics transmission.**

## Run

Node 20.9+ and pnpm are required. Dependencies and a lockfile are included in the project setup.

```sh
pnpm install
pnpm dev
```

Open `http://127.0.0.1:3000`. Use `pnpm build` then `pnpm start` for the production build. `pnpm typecheck` and `pnpm test` run the static and logic checks.

## Design scope

- Responsive homepage with all 12 designs, optional collection filtering, collection browsing, editorial brand section, and footer.
- Four collection pages, 12 product detail pages, artwork/context-view controls, finish selection, related products, and cart fallback.
- Persistent demo bag with correct variant prices, quantities, removal, empty state, inline errors, native modal focus containment, Escape/close focus return, and checkout handoff preview.
- About, shipping/returns, contact, privacy, terms, accessibility, custom 404, and recoverable page-error design.
- Locally hosted Bricolage Grotesque and DM Sans variable fonts (about 114KB combined) with accompanying OFL notices.
- Reduced motion, labeled controls, visible keyboard focus, coarse-pointer targets, and a skip link. No formal WCAG certification is claimed.

All concept art is authored as SVG. Product dimensions and finishes are illustrative. No reviews, durability claims, invented shipping promises, or unapproved promotional discounts are presented. Preview pages are marked `noindex,nofollow`.

## Brand configuration

`src/brands/apres.ts` owns the first brand's identity, semantic colors, typography selection, navigation, homepage and collection copy, product concepts, art palettes, prices in integer minor units, and visible variants. `src/lib/types.ts` describes the configuration; `src/lib/brand.ts` validates IDs, options, collection mappings, and pricing.

The shared components do not decide whether a product is a Colorado decal. `src/brands/desk.ts` is a separate stationery catalog and identity fixture with different products, pricing, typography, copy, colors, and square product fields. To preview it without editing commerce components:

```sh
NEXT_PUBLIC_STORE_BRAND=desk STOREFRONT_BUILD_DIR=.next-desk pnpm dev --port 3001
```

Then open `http://127.0.0.1:3001`. Each brand has its own browser-storage key. A production brand choice is a build/deployment setting; there is no public runtime store selector. To introduce another brand, register a typed configuration in `src/lib/brand.ts`, validate it, and build with its identifier. Font binaries are explicitly registered with `next/font/local` in the root layout; register additional licensed faces there if a new brand needs them.

## Interaction budget

All launch products appear on the default homepage without pagination, load-more, search, or a required filter click. Single-option products: **Quick Add → Checkout** (2 interactions). Inline finish products: **select finish → Quick Add → Checkout** (3 interactions). Selecting a default finish deliberately also counts.

The initial card chooses its first available finish visibly. Product information pages and optional filters are alternate paths; the direct homepage path is always available. Scroll distance is separate from button interactions. Do not describe reaching the demonstration checkout as a completed payment or a live provider checkout.

The client-only interaction counter is exposed as `data-shopping-interactions` on the checkout preview for QA. It resets on a full page load and counts UI shopping actions, not scroll, authentication, or payment-provider requirements. It is not production analytics. Do not use this small counter alone as proof of conversion performance.

## Demo cart boundary

`src/lib/cart.ts` validates saved variant identifiers and integer quantities, clamps quantities to 20, merges duplicate lines, and derives display totals from the configured catalog. This protects the demonstration UI from malformed browser data, **not a live checkout**. Client-side prices and availability must never become authoritative in production.

The first-ten-order pilot now has a small server-side Stripe Checkout connection that revalidates the bag against configured Stripe Prices and collects payment/address details on Stripe. It defaults to off and has not been connected to a Stripe account. In preview mode the existing demo checkout remains. See the [pilot setup and manual fulfillment runbook](docs/FIRST_TEN_ORDERS.md), [catalog worksheet](docs/templates/PILOT_CATALOG.md), and [blank private ledger template](docs/templates/PILOT_ORDER_LEDGER.md). Never process real orders with demonstration supplier mappings.

Shopify remains the later commerce target. When migrating, replace the pilot checkout with Shopify Storefront Cart API, revalidate totals/availability through Shopify, and redirect to its valid checkout URL. Reconcile existing Stripe payments and manual supplier orders before cutover. Native Shopify orders become the source of truth for new Shopify orders; do not re-submit existing supplier work.

## Fulfillment foundation

Shopify and automated Printful integration is deferred until review of the first 10 paid orders. Stripe-hosted checkout with manual Printful ordering is the selected pilot path; account setup, product/cost approval, deployment and live validation remain pending. The [future Dots agent handoff](docs/DOTS_AGENT_COMMERCE_HANDOFF.md) contains the subsequent integration scope and end-to-end acceptance criteria.

The first operating model is supplier-managed print-on-demand: the supplier prints, packs and ships. No real supplier or shipping account is connected. `src/server/fulfillment/` now provides reusable server-side mapping, capability validation, order planning and a simulation-only dispatch boundary. Après Club's decal variants and Desk Ritual's stocked stationery exercise the same core contracts with different operating models.

Run `pnpm demo:fulfillment` to verify both simulated routes and duplicate-order protection. No order is sent externally or charged. See [the fulfillment architecture](docs/FULFILLMENT_ARCHITECTURE.md) for provider selection, Shopify-app versus direct execution ownership, production storage/queue requirements, launch gates and realistic product-swapping limits.

## Review

See `docs/DESIGN_REVIEW.md` for observed browser coverage, remaining launch work, and desktop/mobile screenshots. The original plan and prompt remain available at the project root.
