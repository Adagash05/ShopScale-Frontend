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

## Verified in the authoring environment
* `npm install` succeeded, `npm run build` succeeded, `npm test`: **49 passed, 0 failed** in 9 files (cart and purchase maths, API client
  with token refresh, permissions and navigation, login, onboarding, accept-invitation, public website, charts, insights).
* The app has **not** been exercised against a running backend yet (the backend could not be built there). Screens
  were checked against the backend's API contract by reading both sides.

## What is here
Public website (home, features, shops, restaurants, catering, pricing, about, contact, FAQ, legal) · sign up and sign in · onboarding (retail only; food types are shown as "Coming soon") · Dashboard with charts, activity feed and "what needs your attention" insights · Sell (search, cart, discount, paid in full / part / pay later, customer, receipt, print) · Products with
sizes and colours, stock updates, archive · Customers, credit and repayments · Expenses · Sales history and refunds ·
Stock (running low, history) · Plan and billing (read-only status; paying is not built yet) · public Pricing page ·
Business settings · Team (invitations, roles, custom permissions) · Suppliers, purchases and receiving stock · Help. Screens and actions follow the signed-in person's permissions; the server enforces them.

## Notes
* Tokens are kept in `localStorage` so sessions survive reloads on mobile. The app renders no untrusted HTML, but any
  XSS bug would expose them; keep a strict CSP when deploying.
* Design tokens live at the top of `src/styles.css` (blue `#2563EB`, Inter).
* Serve `dist/` with SPA fallback to `index.html` (see `nginx.conf`, `Dockerfile`; Docker files not run here).
