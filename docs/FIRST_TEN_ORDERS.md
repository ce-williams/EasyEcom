# First ten decal orders: Stripe checkout, manual Printful fulfillment

Decision: October 17, 2026. Keep the existing mixed-design shopping bag. Use Stripe-hosted Checkout for payment/address collection and manually place Printful orders. No Shopify subscription, Shopify app or supplier API worker is needed for this pilot.

## Current status

The checkout connection is implemented locally and defaults to **off**. No Stripe account is connected, no live product/price/shipping rate has been created, no supplier order has been placed and no paid test or delivery has been verified. Store hosting and merchant account activation still need to be completed. Do not treat passing code tests as a live launch.

The public storefront remains a design preview until configured. Invalid configuration pauses checkout; it cannot silently become a real payment or a pretend successful order. Only explicitly mapped variants can be purchased in test/live mode. The rest remain visible but unavailable. The server checks Stripe Price amount/currency, product availability and test/live mode against the catalog, and collects payment plus shipping address on Stripe. A verified return page reports payment state without submitting production work. No customer address or card information is collected by this application's API or stored in its database; there is no application database.

## What the merchant needs to supply

1. A merchant-owned Stripe account with business verification and payout setup, plus authorized access to configure products/prices. A Stripe plugin is available for account-assisted setup; installing/authorizing it has not yet been confirmed. Never paste secret keys, passwords or banking details into chat.
2. A Printful account, saved production-ready templates for each approved decal variant, billing method and sample approval. Printful allows manual orders without an ecommerce integration. Use standard customer orders, not an assumed sample discount.
3. Business location, currency, shipping countries, support email, actual product specifications, shipping/production estimates and returns/privacy/ordering terms. Tax configuration is an explicit merchant decision; no country, registration or exemption has been inferred.
4. Approved selling prices and shipping charge based on real supplier quotes, payment fees and taxes. Current $5/$5.50, matte/gloss and 3-inch options are illustrative until reviewed. If a supported supplier specification differs, update the catalog and artwork before creating Stripe Prices.
5. An HTTPS storefront deployment with a server runtime and private environment variables, and a budget/delivery address for an authorized real production test. This Next.js checkout endpoint cannot run on a static-only host.

## One-time setup

### 1. Approve the actual decal offering

Use [the pilot catalog worksheet](templates/PILOT_CATALOG.md) to choose the initial designs/variants. Begin with only the designs whose artwork, materials and costs have been confirmed. In Printful, save the matching product templates, verify all sizes/finishes/cutlines and production files, and quote representative destinations and mixed-design quantities. Inspect a physical sample before promising quality or durability.

The pilot charges one configured flat shipping rate per order. Confirm that rate covers the offered destinations and realistic bag sizes, including possible split shipments; restrict destinations or reduce the offering if it does not. Do not present a made-up free-shipping offer. The local bag supports up to 20 units per variant; lower that bound consistently in client/server code if supplier economics require it. It is not an inventory reservation system.

### 2. Configure Stripe in test mode first

- Create one active, one-time, per-unit Stripe Price for each approved storefront variant. Use a clear product name including design, finish and size; use separate Price IDs for separate variants. Catalog price and currency must match exactly. The server rejects recurring, tiered, transformed or mismatched prices.
- Create an active fixed-amount Shipping Rate in the same mode/currency, even if the approved amount is zero. Set realistic delivery information in Stripe and the public policy copy.
- Set up Stripe branding, customer-support details and successful-payment/refund receipt emails. Review merchant payment notifications and designate a person to check the Dashboard at least daily. Receipts do not replace shipment notifications. Test receipts may need to be sent manually; see [Stripe receipts](https://docs.stripe.com/receipts).
- Choose the tax treatment for products and shipping. `PILOT_AUTOMATIC_TAX=true` also requires appropriate Stripe Tax account configuration and registrations where applicable; the flag alone does not settle tax requirements. `false` means this integration does not add automatic tax. Explicitly review that choice before live use.
- The pilot requests card payments to avoid asynchronous-payment fulfillment complexity. Wallet availability depends on Stripe/account/browser support. No saved-payment subscriptions or invoice-creation feature is enabled.

### 3. Configure the local environment privately

Copy `.env.example` to ignored `.env.local`. Set the following **server-only** variables, without adding a `NEXT_PUBLIC_` prefix:

```dotenv
PILOT_MODE=test
PILOT_ACCEPTING_ORDERS=true
PILOT_BRAND=apres
PILOT_SITE_URL=http://127.0.0.1:3000
STRIPE_SECRET_KEY=<test key entered privately>
PILOT_PRICE_IDS_JSON={"i-survived-i70-matte":"price_REPLACE"}
PILOT_SHIPPING_RATE_ID=shr_REPLACE
PILOT_ALLOWED_COUNTRIES=<explicit comma-separated country codes>
PILOT_AUTOMATIC_TAX=<true or false after review>
PILOT_PUBLIC_COPY_JSON=<JSON described below>
PILOT_LAUNCH_APPROVED=false
```

`PILOT_SITE_URL` is the exact browser-visible storefront origin, without a path/query. Test mode accepts localhost HTTP; live mode requires HTTPS. Configure the host's canonical domain to match, because checkout POSTs require that origin. Test/live keys, Prices and Shipping Rates are separate resources. The API uses the pinned Stripe version `2025-02-24.acacia`; verify compatibility during account testing. Restricted keys must permit reading Prices/Products/Shipping Rates and reading/creating Checkout Sessions; store them only in private server secrets.

The JSON value of `PILOT_PUBLIC_COPY_JSON` must contain these public fields. Replace every bracketed instruction with merchant-approved copy; this is a structure example, not launch-ready policy text:

```json
{
  "supportEmail": "[real customer support email]",
  "productDetails": "[approved size, finish, material and care facts for this drop]",
  "shipping": "[supported destinations, charges, production time and delivery estimates]",
  "returns": "[return/cancellation/defect process, timing and support contact]",
  "privacy": "[merchant identity, contact, local bag storage, Stripe payment/address handling, Printful recipient sharing, hosting logs, retention and customer rights]",
  "terms": "[merchant identity, ordering/pricing/currency, fulfillment timing, cancellations and applicable customer terms]"
}
```

Use a single-line JSON environment value in the host/editor. The public copy is returned to customers; do not put credentials, banking details or customer records in it. If the launch variants need different product facts, update their public descriptions or extend the copy per variant before launch rather than making inaccurate blanket claims.

### 4. Test the complete customer journey

Run `pnpm test`, `pnpm typecheck` and `pnpm build`. Start the store, select one design, then a variant and a mixed-design bag, and check that Checkout opens directly on Stripe. The existing direct path remains Quick Add → Checkout, or choose finish → Quick Add → Checkout. Entering payment/address details and provider authentication are separate from that storefront interaction budget.

Use Stripe test cards only in test mode. Verify the exact line items, quantities, shipping cost/destinations, currency, tax, customer email/address and cancellation path. Check a successful payment and a declined card. A typed/fake return URL must never assert success; a failed lookup remains unconfirmed. Verify retries preserve idempotency for the same request, and unmapped variants/changed prices fail without a partial checkout. No test event or test payment authorizes supplier production.

The automated tests mock Stripe protocol responses and do not prove actual account connectivity, receipts, shipping eligibility or money movement. Without a connected account, the real Stripe tests remain pending.

### 5. Activate deliberately

Complete verification/payout setup and product sample/cost/policy review. Deploy with private **live** resources, correct HTTPS origin and `PILOT_MODE=live`. Keep `PILOT_ACCEPTING_ORDERS=false` while configuring; set `PILOT_LAUNCH_APPROVED=true` only after that review, and enable orders when ready. Inspect the published product/contact/policy pages. Ensure hosting request protections and merchant notifications are working.

Within a merchant-approved budget, place one real end-to-end order and manually fulfill it through delivery. Confirm receipt, Stripe payment record, exact Printful variant/quantity/artwork, supplier charge, shipment and physical quality. A local code test is insufficient. Resolve discrepancies before marketing the store. Any real charge, refund, supplier purchase or recurring hosting commitment needs to stay within the merchant's authorized scope and budget.

## Per-order routine: ten repetitions

1. **Verify payment in Stripe.** Check the actual live payment succeeded/captured, amount/currency/line items, refund/dispute/review state and shipping address. Do not act on a screenshot, browser return page, customer message or email notification alone. Stripe is the payment/order source for this pilot, not the local bag.
2. **Claim it in the private ledger.** Use the Stripe PaymentIntent (`pi_…`) as the unique paid-order reference. Search for that reference before creating another supplier order. Record the Checkout Session reference, approved variant IDs/quantities, collected shipping/tax and processing fees where available. Payment metadata includes brand, `manual-pilot` and per-variant quantities for reconciliation. The same customer paying twice creates two payments; investigate before sending two orders.
3. **Create a Printful draft.** Open New order, choose the appropriate manual/personal store and approved saved templates. Add all paid line items and the customer's shipping address from Stripe. Recheck current price, production availability, packaging, postage and delivery estimate. Put the Stripe reference in the order-number/note field if supported, otherwise keep both references in the ledger. Nothing in the code creates this draft for you.
4. **Review and pay once.** Verify artwork/finish/size/quantity/address and the landed cost against the approved margin before confirming. Your merchant billing method pays Printful separately; do not assume a Stripe payout has arrived. Record the supplier order ID immediately. If submission times out, look up the existing order before trying again. Never silently substitute a different product or send an unpaid/refunded/test order into production.
5. **Track and support.** Check supplier acceptance and production progress; record every shipment/tracking link and notify the customer manually through the approved support channel. Manual Printful orders may not collect recipient email, so do not assume Printful sends those messages. Label creation is not delivery. Follow through on delays, missing parcels, partial shipments and defects.
6. **Reconcile.** Confirm the supplier cost and shipment state against the payment reference. For cancellations, check whether production can actually stop, then handle the customer refund separately in Stripe. Record partial/full refunds and any unrecoverable supplier charge. Leave unresolved cases visible to the merchant.

Use the [blank ledger template](templates/PILOT_ORDER_LEDGER.md) in a private location. Do not put real customers, addresses, receipt links or payment/supplier records into Git. No customer messages are sent by this implementation.

## When ten paid customer orders are reached

Ten orders is a human review milestone, not a hard cap or ten-unit stock reservation. The app has no durable cross-request order counter. Test purchases, the merchant's sample and waitlist requests do not count as customer demand. Record gross paid orders and refunds separately so the review is honest.

Set `PILOT_ACCEPTING_ORDERS=false` in the running host environment and restart/redeploy if the host requires it. This blocks **new** Checkout Sessions but does not cancel a Stripe-hosted session already opened. Find and expire outstanding open pilot Checkout Sessions in Stripe using its supported tools/API, then reconcile any payment already completed. Stripe defaults to a 24-hour session expiry. Keep account credentials configured so paid return links and support remain usable while paused. New sessions can also exist from refreshes/new tabs: idempotency protects a retry of the same attempt, not a global inventory limit.

Review profit, fulfillment effort, complaints and actual delivery outcomes. Resume the [Dots agent handoff](DOTS_AGENT_COMMERCE_HANDOFF.md) for Shopify/Printful automation only when desired. Migrate by payment/supplier reference without re-submitting existing manual orders. The future integration must reconcile Stripe refunds and any outstanding fulfillment before the cutover.

## Technical boundary

- `/api/pilot`: runtime public status and same-origin, size-limited checkout POST. No prices, secret keys or customer data are trusted from browser input. It reads live Stripe price/shipping records before creating the hosted session.
- `src/server/pilot/`: private configuration, direct Stripe HTTPS calls, whole-bag validation, stable request idempotency and return-state verification. No SDK, application database, order queue, webhook endpoint or automated supplier submission is installed.
- `/checkout/return`: server-side Stripe verification, minimal paid/unconfirmed output, no address/contact payload and no automatic cart clearing or production trigger. Existing bag selections are retained deliberately.
- Configured public policy copy replaces preview policy/product/support text in test/live mode; nonpilot demo brands continue to use their own preview configuration.
- Payment/production notifications and the ten-order stop are operated by a human. If automation is later introduced, verified webhooks, durable deduplication, exception handling and authoritative reconciliation are required; a success page is not an event processor.

## References checked during implementation

Local verification: 27 automated tests pass, TypeScript checks pass, and the production build succeeds. Browser checks confirmed a mixed bag with matte/gloss selections, retained subtotal, desktop/mobile preview layout, disabled payments by default, and an unconfirmed response to a fake payment-return URL. No browser console errors were observed during that journey. Private Stripe configuration markers were absent from the built browser chunks. Screenshots: [desktop](previews/pilot-checkout-desktop.jpg), [mobile](previews/pilot-checkout-mobile.jpg). Actual Stripe account tests and a real payment-to-delivery test remain pending.

- [Stripe-hosted Checkout](https://docs.stripe.com/checkout/quickstart)
- [Create a Checkout Session](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe receipts and refunds](https://docs.stripe.com/receipts)
- [Printful manual orders](https://help.printful.com/hc/en-us/articles/50261040104593-How-do-I-place-a-manual-order)
- [Printful manual/API store](https://help.printful.com/hc/en-us/articles/50262225690257-How-do-I-create-and-use-a-manual-order-API-store)
