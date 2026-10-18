# EasyEcom — Codex planning prompt

Create an implementation plan only. Do not write application code, install dependencies, provision services, or deploy anything during this planning task. Complete the research and recommendations, then present the plan for approval.

Act as a senior product engineer and commerce designer. Make concrete recommendations and resolve routine decisions using evidence. Ask only questions that materially affect business scope, cost, fulfillment, or visual direction.

## Product goal

Build a reusable, conversion-first storefront foundation for small direct-to-consumer brands. The first store sells funny Colorado-themed decals and stickers. Future stores should launch by replacing brand configuration, assets, catalog, and service credentials without rewriting core commerce logic.

The architecture should be reusable; each brand should have a distinctive visual identity. Start with one store per deployment. Do not build a multi-tenant platform, a visual theme editor, microservices, or an extensive custom admin.

## Planning preflight

Inspect the repository and applicable AGENTS.md instructions. Report existing code, conventions, constraints, and useful assets. Study Casely at https://www.getcasely.com/ and carry out the design research specified below. Inspect desktop and mobile experiences where accessible. Cite actual references, distinguish observations from assumptions, and identify any inaccessible sources.

Verify relevant integration capabilities, costs, and restrictions through current official documentation. Do not claim research, prototype creation, or validation that has not occurred.

## Purchase requirement

For the initial catalog, every active, in-stock product and purchasable variant must support reaching a usable provider checkout from a fresh homepage visit with an empty cart in no more than three meaningful shopping interactions.

Preferred simple-product path: Quick Add → Checkout from an automatically revealed cart drawer.

Preferred variant-product path: select an inline purchasable option → Quick Add → Checkout.

Count navigation, opening selectors, selecting options, adding items, and initiating checkout. Report scrolling and text entry separately rather than hiding discovery friction. Report necessary consent interactions separately. Do not promise completed payment in three clicks: payment authentication, address entry, and provider requirements may add steps.

Do not require product detail pages, customer accounts, or a dedicated cart page to purchase. Provide guest checkout and eligible express-payment methods. Explain how multi-option products fit the interaction budget. Document the catalog-size limit of the guarantee and propose an honest discovery strategy for larger catalogs.

## Storefront and catalog

Plan a compact announcement bar, minimal navigation, a short product-forward hero, immediately visible merchandise, collection browsing, product grids with inline purchasing, informational product pages, a persistent cart, and an accessible cart drawer.

Include shipping, returns, contact, privacy, and terms pages, plus checkout cancellation, failure recovery, and authoritative order confirmation.

Seed 12–20 clearly labeled demonstration products around I-70 traffic, ski-town culture, powder days, altitude, camping, hiking, and Colorado weather. Example creative concepts: “I Survived I-70,” “Mentally on a Chairlift,” “Powder Over Productivity,” “Altitude Adjustment,” and “Après Is My Cardio.” Use consistent product artwork and mockups. Treat sample artwork, pricing, inventory, and claims as demonstration content until approved for launch.

Never fabricate reviews, sales counts, scarcity, fulfillment promises, or promotional claims.

## Commerce architecture

Compare two realistic paths:
1. A hosted commerce backend, including Shopify.
2. A custom storefront using Stripe Checkout and a managed database where needed.

Compare launch effort, dated cost assumptions, catalog and order administration, inventory, shipping, tax, discounts, refunds, fulfillment, maintenance, checkout constraints, and reuse across independent stores. Recommend the smallest reliable solution.

Next.js, TypeScript, Tailwind, Vercel, Supabase, PostHog, and Resend are candidates, not mandatory dependencies. Respect existing repository conventions when appropriate. Choose an authoritative source for each commerce entity and avoid competing catalog, inventory, or order records.

V1 must support products, variants, SKUs, images, availability, server-authoritative prices, persistent cart state, stale-price and unavailable-item handling, accurate shipping and discounts, documented tax configuration for the launch market, paid-order records, fulfillment status, secure administration, provider-supported refunds, and transactional order communications.

Start with manual fulfillment. Define a small fulfillment interface; defer unneeded provider implementations. Plan verified webhooks, idempotency, retry handling, reconciliation, and inventory behavior for expired or abandoned checkout sessions. Never fulfill solely from a browser success redirect. Keep secrets server-side and validate sensitive inputs and permissions.

Because stickers have low unit prices, evaluate one simple multipack or bundle and a free-shipping threshold for launch. Show contribution-margin assumptions before recommending promotions. Avoid a general promotions engine.

## Reuse boundaries

Separate shared commerce behavior, brand tokens and component variants, brand content and assets, catalog and merchandising, and provider integrations. Define typed configuration, validation, defaults, and file ownership.

Brand settings should cover name, logo, typography, colors, navigation, merchandising, promotional copy, policies, contact information, social links, domain, and SEO defaults. Explain which operational settings belong in the commerce backend instead.

Support meaningful changes in layout and component treatment without building a page builder. Prove reuse with a second fictional brand with substantially different typography, colors, imagery, products, and voice. Identify precisely which files should change.

## Quality and measurement

Target WCAG 2.2 AA, LCP ≤2.5 seconds, INP ≤200 milliseconds, CLS ≤0.1, and Lighthouse mobile performance ≥90 under documented conditions. Distinguish lab evidence from field measurements and targets from guarantees.

Plan keyboard access, focus visibility, accessible selectors, cart focus management, reduced motion, optimized imagery, font loading, and restrained JavaScript. Include product and collection metadata, canonical URLs, sitemap, appropriate structured data, and useful product detail content.

Instrument product views, variant selection, add to cart, checkout initiation, and confirmed purchase. Measure conversion, checkout completion, average order value, revenue per visitor, and interactions to checkout. Deduplicate purchase events and derive revenue from authoritative payment confirmation. Address consent and minimize personal data.

## Validation and delivery

Plan meaningful unit/integration tests and Playwright journeys covering every seeded purchasable product and variant within the interaction budget, mobile and desktop shopping, cart updates and persistence, price and availability changes, shipping and promotions, checkout success/cancellation/failure, duplicate and delayed webhooks, order/inventory consistency, keyboard shopping, and second-brand configuration.

Identify checks requiring credentials, provider test mode, a deployed URL, or real devices.

Return:
- Repository findings and assumptions.
- Linked visual research and all design deliverables specified below.
- An architecture comparison and recommendation.
- Routes, components, configuration boundaries, and core data models.
- Checkout and order-lifecycle diagrams.
- The smallest launchable scope and explicit deferrals.
- Independently verifiable milestones with dependencies and acceptance criteria.
- External accounts, credentials, dated cost assumptions, and unresolved decisions.
- A launch checklist and second-brand verification plan.

Sequence: research → three art directions → selected design and visual prototype → functional shopping → payments and operations → validation → second-brand proof.

During this planning task, describe the visual prototype and how it will be reviewed; do not implement it. After plan approval, present the actual desktop and mobile design for approval before substantial commerce/backend implementation. Establish reusable boundaries from the beginning.

The following design override governs visual requirements wherever earlier guidance conflicts.

---

# CRITICAL DESIGN OVERRIDE — NO BOILERPLATE

This instruction supersedes all previous generic design guidance.

We are not building a conventional developer-designed e-commerce storefront. We are building a distinctive, premium, art-directed digital shopping experience inspired by the best contemporary independent consumer brands.

The design quality must be exceptional.

## 1. Mandatory Design Research

Before writing UI code, research contemporary design patterns from:

- Awwwards — https://www.awwwards.com/
- Godly — https://godly.website/
- SiteInspire — https://www.siteinspire.com/
- Commerce Cream — https://commercecream.com/
- Land-book — https://land-book.com/
- Fontshare — https://www.fontshare.com/
- Casely — https://www.getcasely.com/

Study strong DTC brands, independent creative studios, contemporary editorial design, and high-converting e-commerce experiences.

Identify at least 5 specific visual references and explain what each contributes.

Do not simply recreate any existing site.

## 2. Mandatory Design Exploration

Before implementation, develop THREE distinct art directions:

A. Editorial DTC — expressive typography, intentional asymmetry, oversized headlines, confident visual identity.

B. Modern Swiss Commerce — precise grids, exceptional whitespace, restrained color, sophisticated typography.

C. Playful Outdoor Culture — contemporary mountain lifestyle branding, unexpected colors, witty merchandising, retro-modern graphic influence.

For each direction, define:

- Typography pairing
- Color palette with exact hex values
- Spacing and grid system
- Navigation design
- Product card treatment
- Button treatment
- Photography and mockup direction
- Mobile design
- Motion language
- Distinctive visual signature

Recommend the strongest direction and explain why it suits the first brand while remaining reusable.

## 3. Typography Requirements

DO NOT automatically use:

- Inter
- Roboto
- Arial
- Poppins
- Montserrat
- Default system fonts

Instead, evaluate professional typography from independent foundries.

Preferred candidates:

- Clash Display
- Cabinet Grotesk
- General Sans
- Satoshi
- Switzer
- Space Grotesk
- Instrument Serif, where appropriate

Choose fonts based on brand personality, readability, and hierarchy.

Use expressive display typography, carefully controlled tracking, responsive type scales, and disciplined line heights.

Verify licensing and performance before integrating fonts.

## 4. Forbidden Boilerplate Patterns

DO NOT use:

- Generic SaaS landing-page layouts
- Default shadcn/ui visual styling
- Purple or blue gradients
- Glassmorphism
- Generic rounded cards everywhere
- Oversized pill-shaped buttons everywhere
- Generic hero with headline, paragraph, two CTAs
- Random decorative blobs
- Excessive drop shadows
- Stock-looking illustrations
- Generic Lucide icons for brand personality
- Identical spacing and border radii on every component
- Default Tailwind color palettes without art direction
- Unnecessary animations
- Generic "modern minimal" aesthetics without a distinctive point of view

Functional libraries may be used for accessibility and behavior, but their default appearance must never define the visual identity.

## 5. Custom Design System

Create a bespoke, token-driven design system.

Define:

- Typography roles and scales
- Color roles
- Grid geometry
- Spacing rhythm
- Border treatments
- Corner radius rules
- Button styles
- Product card compositions
- Image aspect ratios
- Iconography
- Interaction states
- Motion timing and easing
- Mobile adaptations

The design system should be reusable across brands, but must support dramatically different brand identities.

Avoid building an overly complex design-system framework.

## 6. Product Cards Are the Hero

Product cards are the most important visual and functional component.

They must feel custom-designed.

Explore:

- Generous product imagery
- Carefully art-directed backgrounds
- Clear pricing
- Expressive but readable product titles
- Direct Quick Add functionality
- Inline variant selection
- Elegant hover states
- Excellent mobile touch interactions

Do not require opening a product detail page to purchase.

Design the product card to simultaneously communicate brand personality and maximize conversion.

## 7. Interaction and Motion

Use tasteful, intentional motion:

- Subtle product-image transitions
- Responsive add-to-cart feedback
- Refined cart-drawer animation
- Smooth but fast navigation transitions
- Small, delightful moments of interaction

Avoid scroll-jacking, excessive parallax, and animation that delays shopping.

Respect reduced-motion settings.

## 8. Design Quality Gate

Before considering the UI complete, evaluate it against these questions:

1. Does this look like a distinctive consumer brand rather than a starter template?
2. Would the homepage feel credible alongside premium DTC storefronts?
3. Does the typography have a recognizable personality?
4. Are the product cards visually memorable?
5. Does every visual element serve merchandising or brand identity?
6. Is the mobile experience equally art-directed?
7. Are products visible and purchasable immediately?
8. Does the design remain clean and usable despite its personality?
9. Can the visual identity be replaced through configuration?
10. Is there anything that looks like generic AI-generated web design?

If the answer to question 10 is yes, redesign that element.

## 9. Required Deliverables

Before implementation, provide:

1. A concise visual research summary.
2. Three differentiated art directions.
3. A recommended direction.
4. A complete typography and color specification.
5. Desktop and mobile homepage design proposals.
6. A reusable component design specification.
7. A conversion-focused interaction map.

Once approved, implement the selected direction faithfully.

**Final principle: Make the shopping experience frictionless, but make the brand unforgettable.**
