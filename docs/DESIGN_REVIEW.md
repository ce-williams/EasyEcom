# Après Club · storefront design review

Status: desktop and mobile design implemented locally. Après Club was selected by the user. Payments, fulfillment integrations, and publication remain outside this phase.

Subsequent pilot work: an opt-in Stripe-hosted checkout and manual Printful routine are now implemented locally and disabled by default. See [the current pilot status and verification](FIRST_TEN_ORDERS.md); the design-phase evidence below does not imply live payments or fulfillment have been tested.

## What is built

The full default homepage includes all 12 designs, directly visible finish controls where applicable, four collections, editorial brand content, and a useful footer. Original SVG artwork replaces image placeholders. The identity uses locally served Bricolage Grotesque and DM Sans WOFF2 files with OFL notices (113,820 bytes combined).

Product and collection pages, related products, artwork/context views, a native modal bag, quantity controls, removal, empty/error states, saved browser-local bag, checkout handoff preview, informational pages, and custom error/404 designs are present.

Brand identity, catalog, artwork parameters, prices, navigation, and merchandising are separated from shared behavior in `src/brands/`. The Desk Ritual stationery fixture was opened and exercised using only environment configuration. It has independent products, pricing, copy, palette, typography selection, product-field shape, and storage namespace.

## Observed verification

- `pnpm typecheck`: passed.
- `pnpm test`: six tests passed, covering both brand configurations, launch variants, invalid stored cart data, variant pricing/quantity/removal, unavailable options and quantity limits, and currency cents.
- `pnpm build`: passed; all 12 product pages, four collection pages, five information pages, and main shopping routes generated successfully.
- Browser journey matrix: **28 completed journeys** (14 product/finish combinations × 390px mobile and 1440px desktop). Each started from a fresh homepage visit with an empty bag. Every single-option journey took two shopping interactions; each explicit finish-selection journey took three. Bag product, selected finish, and destination heading were checked, and the item was removed before the next case. See `journey-evidence.json`.
- The journey counter was checked alongside the actual ordered browser clicks, not treated as independent proof. Scrolling is required to browse lower products and is excluded from the click count. There is no pagination, required filter, or required product detail page.
- Final document overflow checks passed at actual CSS widths **320, 390, 768, and 1440px**. The 320px story-poster overflow found during review was corrected.
- At actual CSS viewport 390 × 844, the first row's Quick Add controls remained visible without scrolling (bottom approximately 824px after final type sizing).
- Bag contents survived a full reload, quantity changes updated exact subtotal, removal revealed the empty state, Escape closed the dialog, and focus returned to the opening Quick Add control.
- Desk Ritual's Daily Notebook reached its checkout preview in two interactions using the same cart and page components.
- Mobile product detail/context artwork and bag/empty state were visually inspected. Variable font files were verified from the font stylesheet and corrected to real WOFF2 variable assets rather than mislabeled static font downloads.

These are design-phase checks. No provider checkout, real payment, order webhook, tax calculation, shipping calculation, inventory race, formal accessibility audit, real-device wallet test, or Lighthouse/field performance claim has been completed. There is no fabricated social proof or active free-shipping promotion.

## Review images

- [Desktop homepage](previews/apres-desktop.jpg)
- [Mobile homepage](previews/apres-mobile.jpg)
- [Complete homepage](previews/apres-home-full.jpg)
- [Mobile bag](previews/apres-bag-mobile.jpg)
- [Checkout handoff preview](previews/apres-checkout-mobile.jpg)

## Architecture choices in this phase

Next.js App Router, React and TypeScript implement the approved route structure. Bespoke layered CSS implements the design tokens directly; Tailwind was not added because no utility framework was needed for this focused visual implementation. The normalized product/variant models and pure cart helpers establish a small boundary for the later Shopify adapter.

The browser-local cart is intentionally a demo provider. Its defensive hydration and catalog-derived display totals are not a payment security boundary. The live implementation must replace these mutations with provider-authoritative cart responses and a valid hosted checkout URL. No client-side prices should be used to charge customers.

Preview pages are noindex/nofollow, do not request payment/contact details, and make the demonstration status explicit. The privacy, terms, shipping and contact designs contain truthful preview notices, not invented launch policies.

## Remaining before commercial launch

Approve final visual refinements and commercial artwork; clear the working brand name; confirm materials, sizes, costs, physical stock, shipping service, markets and policies. Then connect the Shopify development store, implement authoritative cart and checkout operations, verify payment/order/inventory/shipping/tax/refund/notification behavior, add consent-aware analytics, and complete the remaining production acceptance checks in `STOREFRONT_PLAN.md`.

Run locally with `pnpm dev`. Build/production commands and second-brand preview instructions are in the project README. No deployment or paid service was created in this phase.
