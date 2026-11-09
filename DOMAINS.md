# Changing the ShopScale domain

**One variable controls every ShopScale address: `SHOP_SCALE_BASE_DOMAIN`.**
Nothing in the source code contains a ShopScale domain. Merchant storefront addresses are separate and are never derived from it.

## Current configuration
```
SHOP_SCALE_BASE_DOMAIN=shopscale.fidmap.co
```

| Role | Address (derived) |
|---|---|
| Marketing website | `https://{base}` |
| Application (login, POS, dashboards) | `https://app.{base}` |
| API (called by the application) | `https://api.{base}` |

| `SHOP_SCALE_BASE_DOMAIN` | Marketing | Application | API |
|---|---|---|---|
| `shopscale.fidmap.co` (now) | https://shopscale.fidmap.co | https://app.shopscale.fidmap.co | https://api.shopscale.fidmap.co |
| `shopscale.com` | https://shopscale.com | https://app.shopscale.com | https://api.shopscale.com |
| `shopscale.amsati.com` | https://shopscale.amsati.com | https://app.shopscale.amsati.com | https://api.shopscale.amsati.com |
| `localhost` (development only) | http://localhost:5174 | http://localhost:5173 | http://localhost:8080 |

Enter the bare domain only: no `https://`, no path, no port. An invalid value stops the service from starting.

## Where to set it (set the **same value** in both places)
1. **Backend** environment (`backend/.env`, your host's environment settings, or `docker-compose.yml`): `SHOP_SCALE_BASE_DOMAIN`.
   It drives CORS (allowed origins are exactly the marketing and app origins) and the staff invitation links. Password-reset, verification and payment-return links will use the same `AppUrls` service when those modules are built.
2. **Frontend** container environment: `SHOP_SCALE_BASE_DOMAIN`. On start the container writes `/config.js` from it, so the browser app learns its API and marketing addresses. No rebuild is needed.
   For static hosting without Docker run `SHOP_SCALE_BASE_DOMAIN=shopscale.com node scripts/generate-config.mjs dist` after `npm run build`.

Backend and frontend use identical derivation rules; both are tested against `domain-vectors.json`.

## DNS
Create three records pointing at your servers (A/AAAA to the host, or CNAME to your platform):
`{base}`, `app.{base}`, `api.{base}`. If you use a subdomain base such as `shopscale.amsati.com`, create the records inside the `amsati.com` zone:
`shopscale`, `app.shopscale`, `api.shopscale`.

## TLS
Each of the three hostnames needs a valid HTTPS certificate (for example Let's Encrypt via your reverse proxy, or a wildcard `*.{base}` plus the apex). The API and application must be served only over HTTPS in production.

## Deploying a domain change
1. Add the DNS records and certificates for the new hostnames.
2. Change `SHOP_SCALE_BASE_DOMAIN` for the backend and frontend; restart both (no code change, no rebuild).
3. Update the provider consoles that hold absolute URLs (they are outside this software):
   * **Paystack (ShopScale subscriptions)**: not built yet. When it is, the webhook URL will be `https://api.{base}/...` and the return URL on `https://app.{base}`.
   * Any email-sending domain (SPF/DKIM) if you send mail from `{base}`.
4. Sign-in sessions are stored per browser origin; users sign in once on the new app address. Sessions are not shared across subdomains by design.
5. Keep the old hostnames redirecting to the new ones for a while if you have shared links.

## What does not change
* Merchants' storefront addresses/domains, their Paystack credentials and all business data.
* Existing invitation links issued under the old domain: they expire after 7 days; reissue them if needed.

## Security notes
* CORS allows only the marketing and app origins derived from the base domain.
* Redirect targets (login `next`, payment returns) are accepted only when their origin is the app or marketing origin (`isAllowedRedirect`).
* Access and refresh tokens are held by the app origin in browser storage and sent as `Authorization` headers; there are no cross-subdomain cookies, so CSRF does not apply to the API. Do not add a cookie `Domain=.{base}` setting.
