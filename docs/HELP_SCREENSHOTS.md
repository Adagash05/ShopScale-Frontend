# Help Centre screenshots

The Help Centre only shows a screenshot when the real image file exists at `public/help/shots/<id>.png`. If the file is missing the figure is simply not shown (no broken image, no placeholder). Diagrams in the Help Centre are labelled "Diagram" and are drawn from the real status names; they are not passed off as screenshots.

**No screenshots have been captured yet.** They must come from the running app, so they were not made when the Help Centre was built (the build environment could not run the backend).

## Capture them

1. Run the backend and frontend, and create the fictional demo businesses below.
2. `npm i -D playwright && npx playwright install chromium`
3. `BASE_URL=http://localhost:5173 SHOT_EMAIL=... SHOT_PASSWORD=... node scripts/capture-help-screenshots.mjs`
   Use the account that fits each shot (retail, restaurant, catering); pass ids to capture one at a time, e.g. `... capture-help-screenshots.mjs menu-items`.
4. Check each PNG: no real customer data, nothing cut off. Commit them.

| id | Page | Account |
|---|---|---|
| `product-form` | Add product | Amina Fashion Store |
| `sell-screen` | Sell | Green Basket Supermarket |
| `store-settings` | More, Online store | Amina Fashion Store (store open) |
| `online-orders` | More, Online orders | Amina Fashion Store (several orders) |
| `order-detail` | an open online order | Amina Fashion Store |
| `menu-items` | More, Menu | Royal Kitchen Restaurant or Golden Crust Bakery |
| `restaurant-orders` | Orders | Royal Kitchen Restaurant |
| `catering-event-form` | Events, New event | Fresh Harvest Foods |

## Demo data (fictional)

Use only fictional Nigerian data: Amina Fashion Store (dresses, shoes, accessories), Green Basket Supermarket (groceries), Golden Crust Bakery (bread, cakes), Royal Kitchen Restaurant (jollof rice, pounded yam, drinks), Fresh Harvest Foods (catering packages). Use invented names and phone numbers, never real customers. If a screen cannot be captured (feature unavailable on the plan or the account), leave it out.
