# Google Analytics 4 setup (ShopScale)

Analytics covers **ShopScale's own application and website pages only**. Merchants' public online stores (`/s/...`) are never tracked, so no merchant's shoppers or orders reach your property.

## The one value you must supply
`VITE_GA_MEASUREMENT_ID` = your GA4 Measurement ID (looks like `G-XXXXXXXXXX`). It is a build-time variable: set it where you build the frontend, then rebuild and redeploy. Without it analytics is completely off and the app works normally.

## 1. Create the property and Web data stream
1. Go to https://analytics.google.com > Admin > Create > Property. Name it "ShopScale", set time zone Nigeria and currency NGN.
2. Property > Data streams > Add stream > **Web**. Enter your app URL (for example `https://app.shopscale.fidmap.co`) and a stream name.
3. Open the stream. The **Measurement ID** is at the top right (`G-...`).
4. Turn off Google signals and ad personalisation (Admin > Data settings > Data collection). The code already disables them in the tag.
5. If you serve marketing and app on different hosts, either use one stream and add both hosts under "Configure tag settings > Configure your domains", or create a second stream and build each site with its own id.

## 2. Configure
- Local: put `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` in `.env.local` (never commit it), run `npm run dev`.
- Production: set the variable in your build environment (hosting dashboard or CI) and run `npm run build`.

## 3. Consent (how privacy is handled)
- The Google tag is **not downloaded and nothing is sent until the visitor clicks "Allow analytics"**. "No thanks" keeps it off. The choice is stored in the browser (`localStorage`, key `shopscale.analytics.consent`).
- Browsers sending Do Not Track or Global Privacy Control are treated as "No" and are not asked.
- Users can change their mind in **More > Help > Privacy**. The Privacy Policy page has an Analytics section.
- Consent Mode defaults are denied; only `analytics_storage` is granted after consent. Ad storage, ad user data and personalisation stay denied.
- There is no user id, business id, email or phone sent.
- This is a technical implementation, not legal advice. Have the policy text reviewed for NDPA compliance.

## 4. Verify
1. Build with your id, open the app, accept the banner.
2. **DebugView**: install the "Google Analytics Debugger" Chrome extension (or open the site with it enabled), then Admin > DebugView. Events appear within seconds.
3. **Realtime**: Reports > Realtime shows your visit and events within about 30 seconds.
4. In the browser console, `window.dataLayer` lists what was queued.
Not yet verified by the developer: no real Measurement ID was available, so Realtime/DebugView were not checked against Google.

## 5. Events
| Event | When | Parameters |
|---|---|---|
| `page_view` | Each route change (path only, ids and query removed, once per change) | `page_path` |
| `sign_up` | Account created | `method` |
| `login` | Signed in | `method` |
| `onboarding_completed` | Business set up | `business_type` |
| `view_pricing` | Public pricing page or in-app Plan page opened | `source` (public/app) |
| `select_plan` | A plan card is chosen | `item_id`, `item_name`, `billing_cycle` |
| `begin_checkout` | Paystack checkout created by the server | `currency`, `value`, `billing_cycle`, `items` |
| `purchase` | Only after the backend reports the payment SUCCESS (it verified with Paystack). Once per transaction | `transaction_id`, `currency`, `value`, `billing_cycle`, `items` |
| `plan_upgrade` | A verified payment that moved the business to a higher plan | `transaction_id`, `from_plan`, `to_plan` |
| `product_create` | Product saved (new) | none |
| `sale_complete` | Sale confirmed by the server (not offline-pending) | `item_count`, `channel` |
| `stock_receive` | Purchase/stock receiving saved | `item_count` |
| `branch_create` | New location saved | none |
| `employee_invite` | Invitation created | none |
| `data_export` | CSV downloaded | `export_type` |

Duplicate protection: identical events within 1.5 seconds are dropped (re-renders, React StrictMode); `purchase` and `plan_upgrade` are also remembered per transaction id across reloads; the same path twice in a row is not re-sent.
Sale amounts, customer names, emails, phone numbers and product details are never sent. Parameters pass an allowlist plus an email/phone filter before sending.
Limit: a purchase is recorded when the paying user returns to the app and the page confirms it. If they pay and never return, GA4 will not see it (the subscription still activates through the webhook). Server-side reporting would need a GA4 API secret and is not built.

## 6. Mark conversions
GA4 > Admin > Events: mark `sign_up`, `onboarding_completed` and `purchase` as key events.

## 7. Disable
Remove `VITE_GA_MEASUREMENT_ID`, rebuild and redeploy. Individual users can use Help > Privacy.
