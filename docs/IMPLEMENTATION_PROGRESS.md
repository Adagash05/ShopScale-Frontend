# ShopScale frontend - implementation progress

Last updated: 2026-11-10. React 18 + Vite + react-router. Pair with the backend's `docs/IMPLEMENTATION_PROGRESS.md`.

## Verification status (honest)
- JSX/JS syntax of all source files checked (0 errors).
- `npm ci`, `npm run build`, `npm test` were **NOT RUN**: no network or node_modules in the authoring environment. Run them first; existing unit tests that touch Sell/cart/purchase were not re-run after the wholesale and offline changes and may need small fixes.
- PWA installation, offline behaviour and Paystack redirects were **not tested on real devices**.

## Built
- POS (Sell with server-side wholesale price preview), quotes/orders, sales history and report, customers, suppliers, purchases, stock, branches, transfers, team, finance screens, notifications, activity.
- **Plans page**: Free card and limits, Essential/Growth/Business, Paystack checkout with price quote and proration credit, return-page verification (calls the backend; the redirect alone never activates), payment history, cancel, Switch to Free.
- **Online store (merchant)**: More > Online store (settings, delivery, own Paystack keys, webhook URL, custom domain) and Online orders (confirm, ready, complete with payment method, cancel).
- **Public storefront**: `/s/:slug` catalogue, cart (saved on device), checkout (pickup/delivery, pay now or pay later), `/s/:slug/order/:token` status with server verification. Product photo upload (shrunk on the phone) in the product form.
- **PWA**: manifest, service worker (static assets only; API never cached), offline page, install banner (Android prompt + iPhone Share-menu steps), online/offline badge, update banner that never reloads mid-sale.
- **Offline POS**: paid-in-full sales without a customer are saved in IndexedDB, labelled "not confirmed yet", sent with an idempotency key, with a Pending sales screen (retry/discard).
- CSV export screen (More > Export data). Forgot/reset password and email verification pages.

## Logo
The supplied logo (blue cube mark) is the primary brand: `public/brand/logo.png` (cropped to the mark, exterior made transparent, proportions unchanged), `logo-96.png`, and icons in `public/icons` (white background, so they stay visible on dark launchers) built by `scripts/make-icons.py`. Used on login, register, onboarding, invite and reset pages, the sidebar (on a white tile on the dark sidebar), the public site header/footer, the offline page, favicon, apple-touch icon and PWA icons. The mark has no wordmark, so the text "ShopScale" sits beside it. Service worker cache bumped to v2 so installed apps refresh. Not checked on real devices.

## Plans display
Four cards from the backend (`/subscriptions/plans`); the card marked `recommended` (Growth) shows a "Recommended" badge and highlight. Limits, including suppliers and "Unlimited" for NULL, are rendered from backend values; nothing is hard-coded.

## Not built / deferred
CSV import; custom-domain root routing (a verified custom domain needs DNS/TLS and the host to serve this app; the SPA route is `/s/:slug`); industry-specific dashboards beyond the stored business type. **Restaurant, catering, production and livestock screens are deferred** (backend code partly exists, no UI; not advertised).
