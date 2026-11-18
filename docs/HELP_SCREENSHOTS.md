# Help Centre screenshots and the demo video

**Status: no screenshots or video have been captured yet.** They must come from your running ShopScale, so they are produced on your machine with the scripts below. Until a file exists the Help Centre shows nothing in its place (no broken image, no placeholder box).

Exact step-by-step commands for Windows: **docs/LOCAL_DEMO_AND_SCREENSHOTS.md**.

## How it fits together
- `src/help/shots.js` is the single list of screenshots: the file name, which demo business to sign in as, what to click in the real app, the caption, and which articles show it. The Help Centre and the capture script both read it.
- `scripts/demo/seed-demo.mjs` creates the fictional demo businesses through the backend's own API (local backend only).
- `scripts/capture-help-screenshots.mjs` drives a real browser against your local app and saves `public/help/shots/<id>.png`.
- `scripts/verify-help-screenshots.mjs` checks the files exist, are real PNGs, are large enough and are not blank (add `--dist` to also check the production build).
- `scripts/record-demo-video.mjs` records the one-minute demo (`public/demo/shopscale-demo.webm`) from the real app. The video sections on /how-it-works and /help appear only once the file exists.
- Files in `public/` are copied into the production build by Vite and served from `/help/shots/...` and `/demo/...`.

## The 40 screenshots
| id | demo business | shown in (article) |
|---|---|---|
| `dashboard` | retail | getting-started/dashboard |
| `more-menu` | retail | getting-started/navigation |
| `business-settings` | retail | getting-started/business-information, settings/business-details |
| `plan` | retail | settings/plans |
| `products-list` | retail | products/understand-inventory |
| `product-form` | retail | products/create-product, storefront/add-products |
| `product-edit` | retail | products/edit-product |
| `stock` | retail | products/manage-stock, products/low-stock |
| `sell-screen` | retail | sales/make-a-sale, sales/add-products-to-sale |
| `sales-history` | retail | sales/sales-history |
| `sales-report` | retail | sales/reports |
| `customers` | retail | sales/customers |
| `customer-detail` | retail | finance/debtors |
| `suppliers` | retail | purchasing/suppliers |
| `supplier-detail` | retail | purchasing/supplier-balances |
| `new-purchase` | retail | purchasing/receive-stock |
| `purchases` | retail | purchasing/purchasing-records |
| `expenses` | retail | finance/expenses |
| `money` | retail | finance/overview |
| `accounts` | retail | finance/cash-accounts |
| `team` | retail | employees/add-team, employees/roles |
| `branches` | retail | branches/manage-branches |
| `transfers` | retail | branches/transfer-stock |
| `store-settings` | retail | storefront/activate-store, storefront/overview, storefront/store-url, storefront/share-store |
| `store-public` | public store | storefront/customer-view, storefront/preview, storefront/overview |
| `store-cart` | public store | storefront/overview, storefront/checkout |
| `store-checkout` | public store | storefront/overview, storefront/checkout |
| `online-orders` | retail | orders/understand-orders, storefront/receiving-orders, storefront/overview |
| `order-detail` | retail | orders/order-details, orders/process-orders, storefront/overview |
| `online-orders-ready` | retail | orders/fulfilment |
| `menu-items` | restaurant | restaurant/menu-items |
| `restaurant-orders` | restaurant | restaurant/orders |
| `kitchen-board` | restaurant | restaurant/kitchen |
| `restaurant-reports` | restaurant | restaurant/reports |
| `bakery-production` | bakery | restaurant/bakery |
| `catering-home` | catering | catering/events |
| `catering-events` | catering | catering/bookings |
| `catering-event-form` | catering | catering/events |
| `catering-event-detail` | catering | catering/payments, catering/preparation |
| `catering-packages` | catering | catering/packages |

Rules: demo data only (the demo businesses are fictional); never capture a real customer account; if a screen cannot be captured, leave it out rather than substituting anything.
