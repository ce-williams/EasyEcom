# GitHub Pages proof of concept

The Pages site is a static design demonstration only. It displays the Après Club concept catalog, browser-local bag, quantities/finish selection, and simulated checkout. It does not accept real payments, collect payment or shipping details, create real orders, submit supplier jobs or send customer messages. The POC label and checkout notice remain visible. No merchant credentials or live service configuration are required.

Expected site: https://ce-williams.github.io/EasyEcom/

## Build and publish

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build:poc
```

`scripts/build-poc.mjs` copies only source/public assets and build inputs into ignored `.poc-build/`, omits `/api` and the live payment-return route, and prerenders the static pages. It forces POC mode and disables payment settings even if the shell contains live settings. It does not copy `.env` files. It verifies the generated artifact, required pages, prefixed assets and absence of Stripe gateway code/credential markers, then writes the static files to ignored `out/` with `.nojekyll`.

The source server application and its later Stripe pilot remain intact. Run `pnpm build` for that separate server deployment. Do not deploy a server build to Pages, and do not enable merchant payments on the Pages POC.

The base path defaults to the repository name (`/EasyEcom`) and is applied by Next.js to navigation and assets. For a renamed repository, CI derives the name from `GITHUB_REPOSITORY`. An explicit `POC_BASE_PATH` can be a single repository segment or empty for root hosting. Rebuild when changing it.

The Pages setting must use **GitHub Actions**. The workflow runs on pushes to `main` and manual dispatch, tests the app, exports the POC, uploads only `out/`, and deploys with the standard `github-pages` environment. Build permissions are read-only; only the deployment job receives Pages and OIDC permissions. No Stripe, Shopify or Printful secrets are referenced. HTTPS stays enabled.

## Verify the deployed artifact

- Homepage artwork, fonts, navigation and POC label load under `/EasyEcom/`.
- Quick Add opens the bag; finish selection and mixed-design quantities retain correct demo totals.
- Checkout stays on the Pages domain, shows the selected bag and clearly states that payments are disabled and no order has been placed. It never opens Stripe.
- Refresh product, collection and checkout URLs directly; trailing-slash HTML routes must load correctly.
- Desktop/mobile layouts work, browser logs have no app errors, and no payment endpoint is contacted.

The first-ten-order **real commerce** pilot and later Shopify/Printful handoff are separate backlog work. Pages is only for this non-selling POC.
