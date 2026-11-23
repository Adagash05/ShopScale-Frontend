# Help Centre screenshots and the demo video

**Status: no screenshots or video have been captured yet.** They must come from your running ShopScale, so they are produced on your machine with the scripts below. Until a file exists, production shows nothing in its place (no broken image, no empty box); in development (`npm run dev`) a clear "Screenshot not captured yet: <id>" marker shows instead, so nothing is silently skipped.

Exact Windows commands: **docs/LOCAL_DEMO_AND_SCREENSHOTS.md**.

## How the visual guides work
- `src/help/shots.js` is the single list. `SHOTS` defines each picture (file name, demo business, viewport, what to click in the real app, what to outline, caption). `VISUAL` pairs a numbered step of an existing article with its picture (30 articles, 66 paired steps). Article text is not rewritten.
- The article page renders each paired step as a step card: step number, heading, the instruction, the screenshot, a caption and an optional orange callout. Portrait pictures (phone screens) sit beside the text on desktop and under it on mobile; wide pictures use the full content width. Click a picture to enlarge it (Esc or click outside to close).
- The outline and its label are drawn over the picture by the Help Centre, from `public/help/shots/<id>.json` that the capture script writes after measuring the real element. The PNG itself is never edited. If the JSON is missing the picture simply shows without an outline.
- Desktop shots are 960x720 at 2x (sidebar plus content); public-store shots are 420x860 at 2x (a phone).
- `/how-it-works` shows a few real shots per section and links into the guides.

## Scripts
- `scripts/demo/seed-demo.mjs`: creates the fictional demo businesses (and a first-time user with no business, for the onboarding screens) through the backend API. Local backend only.
- `scripts/capture-help-screenshots.mjs`: drives a real browser and saves `public/help/shots/<id>.png` and `<id>.json`. Local app only.
- `scripts/verify-help-screenshots.mjs [--dist]`: files exist, are real PNGs, large enough, not blank, outline data valid; `--dist` checks the production build copy.
- `scripts/help-visual-report.mjs`: per article, every picture slot, present or MISSING; lists priority articles with no step pictures. Exit code 1 if any are missing.
- `scripts/record-demo-video.mjs`: the one-minute demo video.

Some shots change demo data when captured: `product-saved` (adds a product), `sell-receipt` (records a sale), `store-order-placed` (places an order). Run the seed again before a second capture if you want a clean state; the seed only adds what is missing.

## The 76 screenshots
| id | demo business | viewport | outline | used in |
|---|---|---|---|---|
| `site-home` | public | desktop | yes | getting-started/create-account (step 1) |
| `register-form` | public | desktop | yes | getting-started/create-account (step 2) |
| `register-submit` | public | desktop | yes | getting-started/create-account (step 4) |
| `onboarding-type` | newuser | desktop | yes | getting-started/business-setup (step 1) |
| `onboarding-details` | newuser | desktop | yes | getting-started/business-setup (step 2) |
| `onboarding-address` | newuser | desktop | yes | getting-started/business-setup (step 3) |
| `dashboard` | retail | desktop | - | getting-started/dashboard (figure) |
| `nav-sidebar` | retail | desktop | yes | getting-started/navigation (figure) |
| `more-menu` | retail | desktop | - | getting-started/navigation (figure) |
| `business-settings` | retail | desktop | - | getting-started/business-information (figure), settings/business-details (figure) |
| `plan` | retail | desktop | - | settings/plans (figure) |
| `products-list` | retail | desktop | - | products/understand-inventory (figure) |
| `products-add` | retail | desktop | yes | products/create-product (step 1) |
| `product-form-name` | retail | desktop | yes | products/create-product (step 3), storefront/add-products (step 1) |
| `product-form-price` | retail | desktop | yes | products/create-product (step 6) |
| `product-form-more` | retail | desktop | yes | products/create-product (step 7) |
| `product-saved` | retail | desktop | yes | products/create-product (step 8) |
| `products-open-row` | retail | desktop | yes | products/edit-product (step 1) |
| `product-edit` | retail | desktop | yes | products/edit-product (step 2), storefront/add-products (step 4) |
| `stock` | retail | desktop | - | products/stock-adjustments (step 1), products/manage-stock (figure), products/low-stock (figure) |
| `stock-adjust` | retail | desktop | yes | products/stock-adjustments (step 3) |
| `sell-open` | retail | desktop | - | sales/make-a-sale (step 1) |
| `sell-screen` | retail | desktop | - | sales/make-a-sale (step 3), sales/add-products-to-sale (figure) |
| `sell-customer` | retail | desktop | yes | sales/make-a-sale (step 4) |
| `sell-payment` | retail | desktop | yes | sales/make-a-sale (step 6), sales/complete-transactions (step 2) |
| `sell-receipt` | retail | desktop | yes | sales/complete-transactions (step 3) |
| `sales-history` | retail | desktop | - | sales/sales-history (figure) |
| `sales-report` | retail | desktop | - | sales/reports (figure), finance/financial-reports (figure) |
| `customers` | retail | desktop | - | sales/customers (figure) |
| `customer-detail` | retail | desktop | - | finance/debtors (figure) |
| `suppliers` | retail | desktop | yes | purchasing/suppliers (step 2) |
| `supplier-form` | retail | desktop | yes | purchasing/suppliers (step 3) |
| `purchases-hub` | retail | desktop | yes | purchasing/receive-stock (step 1) |
| `new-purchase` | retail | desktop | - | purchasing/receive-stock (step 3) |
| `supplier-detail` | retail | desktop | yes | purchasing/supplier-balances (step 2) |
| `expenses` | retail | desktop | yes | finance/expenses (step 1) |
| `expense-form` | retail | desktop | yes | finance/expenses (step 2) |
| `money` | retail | desktop | - | finance/overview (figure) |
| `accounts` | retail | desktop | yes | finance/cash-accounts (step 1) |
| `team` | retail | desktop | yes | employees/add-team (step 1) |
| `team-form` | retail | desktop | yes | employees/add-team (step 2) |
| `role-form` | retail | desktop | yes | employees/permissions (step 1) |
| `branches` | retail | desktop | yes | branches/create-branch (step 1) |
| `branch-form` | retail | desktop | yes | branches/create-branch (step 2) |
| `transfers` | retail | desktop | yes | branches/transfer-stock (step 1) |
| `transfer-form` | retail | desktop | yes | branches/transfer-stock (step 2) |
| `nav-online-store` | retail | desktop | yes | storefront/activate-store (step 1) |
| `store-settings` | retail | desktop | yes | storefront/activate-store (step 3), storefront/overview (figure), storefront/store-url (figure), storefront/share-store (figure) |
| `store-settings-save` | retail | desktop | yes | storefront/activate-store (step 6) |
| `store-public` | public | mobile | yes | storefront/add-products (step 5), storefront/customer-view (step 1), storefront/overview (figure) |
| `store-cart` | public | mobile | yes | storefront/customer-view (step 4), storefront/overview (figure) |
| `store-checkout` | public | mobile | yes | storefront/customer-view (step 5), storefront/overview (figure) |
| `store-order-placed` | public | mobile | - | storefront/customer-view (step 6) |
| `online-orders` | retail | desktop | - | storefront/receiving-orders (step 1), orders/understand-orders (figure), storefront/overview (figure) |
| `order-new` | retail | desktop | yes | orders/process-orders (step 1) |
| `order-confirmed` | retail | desktop | yes | orders/process-orders (step 4) |
| `order-ready` | retail | desktop | yes | orders/process-orders (step 5), orders/fulfilment (step 1) |
| `online-orders-ready` | retail | desktop | - | (How it works only) |
| `order-detail` | retail | desktop | - | storefront/receiving-orders (step 2), storefront/overview (figure), orders/order-details (figure) |
| `menu-items` | restaurant | desktop | yes | restaurant/menu-items (step 1) |
| `menu-item-form` | restaurant | desktop | - | restaurant/menu-items (step 2) |
| `restaurant-orders` | restaurant | desktop | yes | restaurant/orders (step 1) |
| `restaurant-new-order` | restaurant | desktop | yes | restaurant/orders (step 4) |
| `kitchen-board` | restaurant | desktop | - | restaurant/kitchen (figure) |
| `kitchen-start` | restaurant | desktop | yes | restaurant/kitchen (step 2) |
| `kitchen-ready` | restaurant | desktop | yes | restaurant/kitchen (step 3) |
| `restaurant-reports` | restaurant | desktop | - | restaurant/reports (figure) |
| `bakery-production` | bakery | desktop | yes | restaurant/bakery (step 1) |
| `bakery-production-form` | bakery | desktop | - | restaurant/bakery (step 2) |
| `catering-home` | catering | desktop | yes | catering/events (step 1) |
| `catering-event-form` | catering | desktop | yes | catering/events (step 3) |
| `catering-events` | catering | desktop | - | catering/bookings (figure) |
| `catering-event-payments` | catering | desktop | yes | catering/payments (step 1) |
| `catering-event-prep` | catering | desktop | yes | catering/preparation (step 1) |
| `catering-packages` | catering | desktop | yes | catering/packages (step 1) |
| `catering-package-form` | catering | desktop | - | catering/packages (step 2) |

Rules: demo data only; never capture a real customer account; if a screen cannot be captured, leave it out rather than substituting anything. Look at every picture before committing it.
