import { article, h, list, p, steps, tip, warn, shot } from './b.js'

export default {
  id: 'products', title: 'Products and Inventory', icon: 'package',
  desc: 'Add products, keep stock right and see what is running low.',
  articles: [
    article('understand-inventory', 'Understanding inventory', 'ShopScale keeps a stock count for every product and updates it for you.', [
      p('Inventory means how many of each item you have. ShopScale changes the count by itself when you sell, receive stock from a supplier, transfer stock or take a return.'),
      h('Why it matters'),
      list('You see what is running low before it runs out.', 'You can trust the count when a customer asks "do you have this?"', 'Your online store only offers what you actually have.', 'The value of your stock shows on the dashboard.'),
      h('Where to look'),
      list('**Products** shows each item with its quantity and a "Running low" mark.', '**More, Stock** shows what is running low and the history of every change.'),
      tip('Every change to a count is recorded with who made it and why. See [Understanding stock movements](/help/products/stock-movements).'),
    ], { related: ['products/create-product', 'products/stock-adjustments'] }),

    article('create-product', 'Creating products', 'Add an item with a name, a price and how many you have.', [
      p('A product is anything you sell. You only need a name, a selling price and your starting stock to begin.'),
      h('Steps'),
      steps('Open **Products** and tap **Add product**. (If you have no products yet, tap **Add your first product**.)', 'If your business sells food, choose **What is this?**: an item you buy and resell, a menu item, a finished product made ahead (like bread or cakes) or an ingredient. Shops can ignore this.', 'Enter the **Product name**.', 'Choose **Sold by**: how you count or measure it, for example piece, kg or litre.', 'Turn on **Can be sold in parts** only for things like 1.5 kg or 0.25 litre.', 'Enter the **Selling price (₦)** and **In stock** (how many you have).', 'Tap **Add more details (optional)** for cost price, low-stock warning, barcode, category and description.', 'Save. The message "Product added" appears.'),
      shot('product-form', 'The Add product screen with a name, price and stock filled in for a sample item.'),
      h('What happens after'),
      p('The product appears in Sell and in your Products list straight away, and in your online store if the store is open and you have stock. To add a photo, open the product again; photos can be added once it is saved.'),
      warn('Enter your **Cost price** if you can. It is what lets ShopScale estimate your profit.'),
      h('If something goes wrong'),
      list('"Enter the product name" or "Enter the selling price": those fields are required.', '"Use a whole number": the item is not sold in parts, so stock must be a whole number.', '"You do not have permission": ask the owner to change your role.'),
    ], { related: ['products/edit-product', 'products/pricing', 'storefront/add-products'], keywords: 'add item new product' }),

    article('edit-product', 'Editing and archiving products', 'Change a product any time. Archive what you no longer sell.', [
      steps('Open **Products** and tap the product.', 'Change what you need: name, price, category, description, cost or low-stock level.', 'Tap save. "Product saved" appears.'),
      h('Archiving'),
      p('Archive a product you no longer sell. It disappears from Sell and from your online store, but **your sales history stays exactly as it is**. You can restore it at any time.'),
      steps('Open the product.', 'Tap **Archive product** and confirm.', 'To bring it back, turn on the **Archived** filter in Products, open the product and tap **Restore product**.'),
      tip('Archive instead of deleting. Old receipts and reports still make sense.'),
    ], { related: ['products/create-product'] }),

    article('categories', 'Product categories', 'Group products so they are easy to find in Sell and in your online store.', [
      p('Categories are labels such as "Dresses" or "Drinks". Customers in your online store can shop by category, and your dashboard shows sales by category.'),
      steps('Open a product (or add a new one) and tap **Add more details (optional)**.', 'Choose a **Category** from the list, or choose **No category**.', 'To make a new one, type a **New category name**.', 'Save the product.'),
      tip('Use a handful of short, clear categories. Too many make browsing harder.'),
    ], { related: ['products/create-product', 'storefront/organise-products'] }),

    article('product-images', 'Product images', 'Add a photo so customers can see what they are buying.', [
      p('Photos appear in your online store. They are shrunk on your phone first, so uploads stay small on slow networks.'),
      steps('Save the product first.', 'Open the product again and find **Photo (shown in your online store)**.', 'Choose a JPEG, PNG or WebP picture from your phone.', 'Wait for it to upload, then check it shows.', 'To replace or take it off, use **Remove**.'),
      tip('Take photos in good light, with the product filling most of the picture.'),
      warn('If the upload fails with "Could not read that image" or "Could not upload the photo", try a different picture or check your connection.'),
    ], { related: ['storefront/add-products', 'storefront/manage-products'] }),

    article('pricing', 'Product pricing', 'Set the selling price and your cost price.', [
      list('**Selling price (₦)** is what the customer pays.', '**Cost price (₦)** is what you paid. It is used to estimate profit.'),
      p('Change prices by editing the product. New sales use the new price; old sales keep the price they were made at.'),
      p('If your plan includes wholesale pricing, **More, Wholesale prices** lets you set tiers and bulk or customer-specific prices. Choose a customer\'s price tier on their profile.'),
      tip('Online store prices are your normal selling prices. The store always calculates totals itself, so a customer cannot change a price.'),
    ], { related: ['products/edit-product'] }),

    article('variants-units', 'Product variants and units', 'Sizes and colours get their own price and stock. Units say how a product is counted.', [
      h('Sizes, colours and other options'),
      p('If a product comes in options (Size M, Size L, Red, Blue), turn on **This product comes in sizes, colours or other options**. Each option has its own name, price, stock and cost price. Tap **Add another option** for more.'),
      h('Units'),
      p('**Sold by** is how you count the product: for example piece, kg or litre. If you sell parts, turn on **Can be sold in parts** so 1.5 kg or 0.25 litre can be sold.'),
      warn('If an item cannot be sold in parts, stock and sale quantities must be whole numbers.'),
    ], { related: ['products/create-product'] }),

    article('manage-stock', 'Managing stock quantities', 'See your counts, and change them only with a reason.', [
      p('You do not need to type counts every day. Sales reduce stock and received purchases add to it.'),
      h('To see your stock'),
      list('Open **Products** to see each item\'s quantity and "Running low" marks.', 'Open **More, Stock** for the running-low list and the history.'),
      h('Selling at zero'),
      p('In **More, Settings**, **Let me sell items even when my stock count says zero** lets stock go below zero. Turn it on if you sometimes sell before you update stock.'),
      tip('Receive stock from a supplier using [Receiving stock](/help/purchasing/receive-stock) so cost and amount owed are updated too.'),
    ], { related: ['products/stock-adjustments', 'products/low-stock'] }),

    article('stock-adjustments', 'Stock adjustments', 'Add stock, record damaged items, or set the count after a shelf count.', [
      p('Use an adjustment when the count is wrong or something happened outside a normal sale.'),
      steps('Open **More, Stock** (or the product).', 'Tap **Add stock** or the adjust button for the item.', 'Choose what happened: **Add stock** (you received more), **Damaged** (items you cannot sell) or **Set count** (you counted the shelf).', 'Enter the quantity. For "Set count" enter how many are on the shelf now.', 'Add a note if you like, then save.'),
      p('Which choices you see depends on your role: adding stock and changing counts are separate permissions.'),
      warn('"Set count" replaces the quantity with the number you enter. Count carefully before you save.'),
      h('After you save'),
      p('The new quantity shows straight away and the change is added to the stock history with your name.'),
    ], { related: ['products/stock-movements', 'troubleshooting/stock-incorrect'] }),

    article('low-stock', 'Low-stock monitoring', 'See what is running low before it runs out.', [
      p('Each product has a low-stock level (the default is 5). When quantity falls below it, the product is marked **Running low**.'),
      list('Set the level per product under **Warn me when stock is below**.', 'Open **More, Stock** and the **Running low** tab for the list.', 'Your dashboard has a **Stock running low** card and an **Items to restock** count.'),
      p('When nothing is low the screen says "All good. Nothing is running low right now."'),
    ], { related: ['products/stock-adjustments', 'purchasing/receive-stock'] }),

    article('stock-movements', 'Understanding stock movements', 'Every change to your stock is recorded in a history.', [
      p('Open **More, Stock** and then **History** to see each change, when it happened and who did it.'),
      h('What the labels mean'),
      list('**Opening stock**: the count when the product was added.', '**Sold**: reduced by a sale.', '**Stock added**: you added or received stock.', '**Adjusted**, **Damaged**, **Counted**: a manual change.', '**Returned (refund)**: stock put back after a return.'),
      p('If you do not see History, your role does not include permission to view stock movements.'),
    ], { related: ['products/stock-adjustments', 'branches/transfer-stock'] }),

    article('inventory-reports', 'Inventory reports', 'See running-low items, stock value and download your data.', [
      list('**Dashboard**: Stock health, Stock running low and **Value of your stock (at cost)**.', '**More, Stock**: running low and the full history.', '**More, Export data**: download **Products and stock** and **Customers and what they owe** as CSV files for Excel or Google Sheets.'),
      p('Data export depends on your plan and role. If it is not included, the page says so.'),
    ], { related: ['finance/export-records', 'getting-started/dashboard'] }),
  ],
}
