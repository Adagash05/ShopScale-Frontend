# Local demo data, screenshots and demo video (Windows)

Run everything below **on your own computer, against your LOCAL backend and database**. The scripts refuse to run against anything that is not `localhost`, and they only ever touch the four demo accounts they create (`...@demo.shopscale.test`). Use PowerShell. Replace the two folder names with your own.

```powershell
$BE = "C:\dev\ShopScale-Backend"      # backend folder
$FE = "C:\dev\ShopScale-Frontend"     # frontend folder
```

**You need:** JDK 21, Maven, Node 18 or newer, and either Docker Desktop or a local PostgreSQL 16.

## 1. Prepare the demo database
A clean, separate local database keeps demo data away from anything real.

With Docker:
```powershell
cd $BE
copy .env.example .env
notepad .env          # set DB_PASSWORD and JWT_SECRET (32+ characters). Keep APP_ENV=development and COOKIE_SECURE=false
docker compose up -d db
```
Without Docker (PostgreSQL installed locally):
```powershell
psql -U postgres -c "CREATE USER shopscale WITH PASSWORD 'change-me';"
psql -U postgres -c "CREATE DATABASE shopscale OWNER shopscale;"
```
**To start over from nothing** (deletes all local data): `docker compose down -v` then `docker compose up -d db` (or drop and recreate the database). The backend recreates every table on start.

## 2. Start the backend (leave this window open)
```powershell
cd $BE
Get-Content .env | Where-Object { $_ -match '^\s*[^#\s].*=' } | ForEach-Object { $k, $v = $_ -split '=', 2; Set-Item "env:$($k.Trim())" $v.Trim() }
mvn spring-boot:run
```
Wait for `Started ShopScaleApplication`, then in a second window check: `curl http://localhost:8080/actuator/health` should show `UP`.
(Email is not configured locally, so nothing is ever emailed.)

## 3. Start the frontend (second window, leave it open)
```powershell
cd $FE
copy .env.example .env        # VITE_API_BASE_URL=http://localhost:8080 is already the default
npm install
npm run dev
```
Open http://localhost:5173 and confirm the site loads.

## 4. Install the browser used for screenshots (once)
```powershell
cd $FE
npm i -D playwright
npx playwright install chromium
```

## 5. Run the demo seed (third window)
```powershell
cd $FE
npm run demo:seed
```
It creates four fictional businesses (all use the password `DemoPass#2026`, or set `$env:DEMO_PASSWORD` first):

| Business | Sign in with |
|---|---|
| Aminu Stores (retail) | aminu.owner@demo.shopscale.test |
| Royal Kitchen Restaurant | royal.owner@demo.shopscale.test |
| Golden Crust Bakery | crust.owner@demo.shopscale.test |
| Fresh Harvest Foods (catering) | harvest.owner@demo.shopscale.test |

You can preview the plan without changing anything: `node scripts/demo/seed-demo.mjs --dry-run`. Seed one business: `node scripts/demo/seed-demo.mjs --only=retail`.
**It is safe to run again**: it only adds what is missing. If a step fails it prints the server's message and carries on; fix the cause and run it again.

Now **sign in to http://localhost:5173/login as Aminu Stores and look around**: dashboard, products, Online orders, Online store. If it looks like a business in use, continue.

## 6. Capture the screenshots
```powershell
npm run help:shots                       # all screenshots (desktop 960x720 and phone 420x860, both at 2x)
npm run help:shots -- --only=dashboard,product-form    # a few
npm run help:shots -- --headed           # watch the browser
npm run help:shots -- --list             # show the plan only
# If PowerShell drops the "--", call the script directly instead: node scripts\capture-help-screenshots.mjs --only=dashboard
```
Pictures are saved to `public\help\shots\` as `<id>.png`, with `<id>.json` holding the outline position the Help Centre draws over the picture. The seed also creates a first-time user (`new.owner@demo.shopscale.test`, no business) for the onboarding screens. Three shots change demo data when captured (`product-saved` adds a product, `sell-receipt` records a sale, `store-order-placed` places an order). Anything that could not be captured is listed with the reason, and no file is written for it. Fix the cause (or the click steps for that shot in `src/help/shots.js`) and re-run with `--only=<id>`.

## 7. Verify, and look at every picture
```powershell
node scripts/verify-help-screenshots.mjs
node scripts/help-visual-report.mjs      # every article's picture slots: ok or MISSING
explorer public\help\shots
```
The check confirms each file exists, is a real PNG, is large enough and is not blank. **It cannot tell whether the picture is right**, so open each one and check: the right screen, demo data only, nothing cut off or showing an error. Delete any that are wrong and re-capture them.

## 8. Check the production build
```powershell
npm run build
npm run help:shots:verify        # also checks dist\help\shots
npm run preview
```
Open the preview address and visit `/help/storefront/overview` (the six-step walkthrough: open store, customer browses, cart, checkout, order arrives, order processed), `/help/products/create-product`, and `/how-it-works`. Each numbered step should show its own picture (large, readable, outlined, with a caption), phone screens beside the text on a wide window and under it on a narrow one, resize on a narrow window, and open full-size when clicked.

## 9. Record the one-minute demo video (optional but requested)
```powershell
npm run demo:video
```
It records a real walkthrough of Aminu Stores to `public\demo\shopscale-demo.webm` (about 60 seconds). **Watch it** before keeping it. The player then appears on `/how-it-works` and `/help` by itself. For an MP4 copy: `ffmpeg -i public\demo\shopscale-demo.webm -c:v libx264 -pix_fmt yuv420p public\demo\shopscale-demo.mp4`.

## 10. Commit
```powershell
git add public/help/shots public/demo
git commit -m "Add Help Centre screenshots and demo video"
```

## Things that need you
- **Review every picture and the video** (step 7 and 9).
- **Online card payment is not demoed.** The demo store takes "pay on pickup or delivery" orders. A "Pending payment" screenshot or a real card payment needs your own Paystack TEST keys, entered on the Online store screen; the seed never enters payment keys.
- **Products have no photos.** The store shows the app's normal no-photo tiles. You may upload your own photos on the product screen for a nicer storefront, then re-capture the store shots.
- **All demo sales are dated today** (the API records sales at the moment they are made), so period charts look thin.
- **Team invitations stay pending** (no email is configured locally), which is fine for the Team screen.
- **If a screen's wording differs** from `shots.js` (a button name changed), edit the shot's steps there and capture it again.
- **Never run any of this against production.** The scripts refuse; do not override that.
