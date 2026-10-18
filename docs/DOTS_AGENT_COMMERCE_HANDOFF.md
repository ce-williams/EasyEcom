# Later task: connect Shopify payments and Printful fulfillment

Status: deferred backlog handoff; not scheduled or assigned to a running agent.
Decision date: October 17, 2026 (America/Denver).
Owner: merchant. Intended executor: a future Dots agent or coding agent with the required account access.

## User decision

Pilot implementation update: the user selected Stripe-hosted Checkout with a mixed-design shopping bag and manual Printful ordering. A small, opt-in server connection is implemented and defaults to off; Stripe/Printful accounts, approved product inputs and a live test remain pending. Read `docs/FIRST_TEN_ORDERS.md` for the current setup/routine. Before Shopify migration, reconcile Stripe payments/refunds, outstanding hosted sessions and manually submitted supplier orders. Preserve Stripe access for earlier-order support.

Validate demand with the first 10 orders before investing in the full Shopify–Printful integration. Preserve the reusable Après Club storefront and modular brand/fulfillment architecture. Shopify and Printful are the intended integration targets; neither is connected today.

Revisit this task after 10 genuine paid customer orders, or earlier if manual operations become burdensome. This is a review milestone, not an automatic purchase, production authorization, or scheduled trigger. No order counter or monitoring service has been installed.

## First 10 orders: minimum viable operations

Deferring automation does not provide payments or fulfillment. The current checkout is a demo and cannot accept a real order. Before collecting money, the merchant still needs to choose a working payment/invoice channel and an actual supplier or manual production/shipping method, confirm product availability and costs, and communicate delivery and return terms accurately. If these are not ready, collect clearly labeled interest/waitlist requests instead; do not count them as paid orders or imply that a purchase succeeded.

For the pilot, use a merchant-approved hosted payment/invoice channel and manually place each production order with the selected supplier. This process has not been configured or tested. Confirm approved artwork, actual product/finish, address, production/shipping cost and delivery estimate before committing. Record payment reference, line items/quantities, supplier reference, costs, shipment/tracking and any refund/cancellation in a private merchant-controlled ledger. Keep customer addresses and financial details out of this repository.

At handoff, reconcile every pilot order. Mark whether it is unsubmitted, submitted, in production, shipped, delivered, cancelled or refunded. Do not bulk-import or resend earlier orders into Printful without checking their supplier status; connecting the integration must not create duplicate production orders.

## Current implementation

- Next.js/TypeScript desktop and mobile Après Club storefront, reusable brand configuration, and a homepage-to-checkout interaction budget of at most three shopping interactions. Payment-provider authentication and completion steps are separate from that storefront budget.
- Local catalog/cart with preview checkout by default and an opt-in Stripe-hosted checkout endpoint. No live account or supplier is connected and no deployed operations service has been verified. The pilot uses manual dashboard reconciliation rather than a webhook worker.
- `src/server/fulfillment/`: typed routes, variant/supplier/artwork mappings, capability/release checks, immutable job planning and duplicate-safe simulation. POD and warehouse fixtures exercise the same contracts.
- The in-memory repository, supplier IDs, quotes and production assets are demonstrations, not production resources. Never send real customer orders through `dispatch-demo.ts`.
- Previous verification: 18 tests, typecheck, production build and both fulfillment demos passed. Re-run relevant checks after implementation; these results do not verify any live account or supplier.

Read `AGENTS.md`, `README.md`, `STOREFRONT_PLAN.md` and `docs/FULFILLMENT_ARCHITECTURE.md` before editing. Inspect the current repository and account state instead of assuming this snapshot is unchanged.

## Inputs needed when resumed

1. Merchant-controlled umbrella business email, Shopify `*.myshopify.com` store address, account access and Printful account access. Establish accounts if absent using the merchant's identity and ownership; do not invent a shared agent-owned merchant account.
2. Business country/state, entity type, currency, launch destinations and tax settings requiring merchant confirmation. The merchant completes Shopify verification and payout bank setup directly, and enters Printful billing details privately.
3. Chosen Printful decal product/variant IDs, supplier-approved artwork, finish/size, packaging availability, sample approval, retail prices and verified landed costs/margins. The illustrative storefront prices and materials are not supplier promises.
4. Domain/hosting access, customer support identity, shipping/returns/privacy policies, and the desired handling of cancellations, defects and replacements.
5. Pilot ledger and outstanding-order reconciliation; sample delivery details entered privately; explicit budget for paid production/shipping tests and recurring plans.

Never request passwords, identity documents, bank details or secret tokens in chat or Git. Use authorized account sessions and private environment/secret storage. Pause only the steps that actually require missing access, owner-only verification or a new spending decision; continue independent implementation.

## Implementation scope

1. Verify current official Shopify/Printful setup requirements, account capabilities, supported countries and charges. Review pilot economics before committing to recurring plans or automatic fulfillment.
2. Connect Printful's official Shopify app. Use it as the single fulfillment execution owner (`shopify-app`); do not also dispatch the same order through a custom supplier API worker. Keep order confirmation manual during setup/testing, then enable automation only after validation and merchant authorization for ongoing charges.
3. Create/sync approved products, map every sellable storefront variant to the correct Shopify and Printful variant, publish to the appropriate sales channel, and validate artwork, availability, shipping profiles and destinations. Hide unsupported demo variants.
4. Replace demo catalog/cart/checkout behavior with Shopify Storefront API integration and Shopify-issued checkout URLs. Shopify owns authoritative prices, currency, availability, payment/order state and fulfillment grouping. Preserve desktop/mobile design, guest shopping and the interaction budget. Keep credentials and private fulfillment mappings out of browser bundles.
5. Configure eligible payment methods, shipping, notifications and merchant-confirmed tax/policy settings. Use native Shopify/Printful lifecycle and tracking where supported; build custom webhooks/storage only for a demonstrated requirement. Verify signatures and durable deduplication if custom event processing is introduced.
6. Handle payment failure, unsupported destination, missing SKU, supplier billing failure, cancellation and tracking exceptions with an identified human owner. Customer refunds and supplier cancellations are separate operations and must be checked separately.
7. Reconcile pilot orders and choose a clear cutover point. Observe existing supplier orders without re-submitting them. Confirm launch settings, access, billing and monitoring ownership with the merchant.

## Acceptance criteria

- Desktop/mobile shopper selects any available launch variant and reaches a valid Shopify checkout within the agreed storefront interaction budget. Shopify revalidates price and availability; the demo success screen is not treated as proof of payment.
- Simulated payment success/failure tests pass while automatic supplier production is disabled/held. Follow current provider test guidance; a test checkout alone does not establish physical fulfillment.
- With a merchant-approved spending limit, one real order proves the full chain: captured payment → correct Shopify order/variant → exactly one accepted Printful production order → production/shipment → tracking and customer notification → delivery/sample review. Retain order references and redacted evidence privately.
- Refreshes, retries, configuration changes and cutover of pilot records do not cause duplicate supplier orders or charges.
- Cancellation/refund and supplier-payment failure handling are demonstrated or their remaining limitations documented, with clear human escalation.
- Every launch variant has approved production inputs and known landed costs; shipping estimates and claims match actual supplier capability. No unsupported demo catalog remains purchasable.
- Repository checks pass; secrets stay private; deployment configuration, rollback/hold procedure, recurring costs, operational owner and remaining limitations are documented.

## Copy/paste task for the future agent

> Resume `docs/DOTS_AGENT_COMMERCE_HANDOFF.md` in the EasyEcom repository. The merchant deferred Shopify payments and Printful automation until reviewing the first 10 paid orders. Inspect current code and reconcile pilot orders first. Connect the existing Après Club storefront to Shopify checkout and Printful's official Shopify app, preserving reusable brand configuration and the three-interaction storefront purchase path. Use one fulfillment dispatcher, prevent duplicate production during cutover, and keep demo infrastructure out of live operations. Gather only missing merchant inputs; owner verification/banking stays with the merchant. Complete configuration, implementation and appropriate tests within existing authorization. Obtain a concrete spending limit before any paid production test or unapproved recurring commitment. Provide evidence of the real payment-to-delivery chain and clearly identify any step still awaiting access or verification.

## Official references to recheck at execution

- [Shopify Payments setup](https://help.shopify.com/en/manual/payments/shopify-payments/onboarding/account-setup)
- [Shopify payment testing](https://help.shopify.com/en/manual/payments/shopify-payments/testing-shopify-payments)
- [Shopify Storefront cart and checkout](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage)
- [Connect Shopify to Printful](https://help.printful.com/hc/en-us/articles/50262260641297-How-do-I-connect-my-Shopify-store-to-Printful)
- [Printful billing](https://help.printful.com/hc/en-us/articles/50264607936785-How-does-the-Printful-billing-system-work)
