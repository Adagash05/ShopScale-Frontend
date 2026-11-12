# ShopScale Frontend

React 18 · JavaScript · Vite 5 · React Router. An AMSATI product. Mobile-first, built for Android phones on patchy networks.

## Run
```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8080
npm install
npm run dev              # http://localhost:5173
npm test                 # 49 tests
npm run build            # production build into dist/
```
The backend must be running and must allow this origin in `CORS_ALLOWED_ORIGINS`.

## Verification status
* Earlier baseline: `npm install`, `npm run build` and 49 Vitest tests were reported passing in a previous environment. **They have not been re-run** after the storefront, billing, PWA, offline POS, logo, pricing and GA4 changes (no network in the latest environment).
* `npm run test:ga` (Node's built-in runner) was executed for the GA4 logic: 12 passed.
* Syntax of all source files was checked and relative imports resolve.
* The app has not been run against a live backend.

## What is here
Public website · sign up / sign in / password reset / email verification · onboarding · dashboard and insights · Sell (server-side wholesale pricing, offline sales queue) · products with photos · customers, credit, wholesale prices · suppliers, purchases, purchase orders · stock, transfers, locations · expenses, money overview, cash/bank, shifts · quotes and customer orders · sales history and reports · team and permissions · notifications and activity · CSV export · Plan and billing with Paystack checkout · online store settings, merchant Paystack connection, online orders · public storefront at `/s/:slug` · PWA install and offline page · GA4 analytics with consent (`docs/GA4_SETUP.md`).
Deferred: restaurant, catering, production, livestock. See the backend `docs/SHOPScale_V1_OWNER_GUIDE.md`.
