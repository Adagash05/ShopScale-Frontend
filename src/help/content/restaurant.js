import { article, h, list, p, steps, tip, warn, shot } from './b.js'

export default {
  id: 'restaurant', title: 'Restaurant and Kitchen', icon: 'kitchen',
  desc: 'Menus, tables, orders, the kitchen screen, recipes, wastage and bakery production.',
  articles: [
    article('set-up', 'Setting up restaurant operations', 'Add your menu, tables and recipes. Then start taking orders.', [
      p('These tools are available when you chose **Restaurant or food business** or **Bakery** when you set up. You will see **Orders** and **Kitchen** in the bottom bar.'),
      steps('Add your dishes: [Creating menu items](/help/restaurant/menu-items).', 'Add extras and sizes: [Managing options and extras](/help/restaurant/modifiers).', 'Add your tables: [Managing tables](/help/restaurant/tables).', 'Optionally link ingredients with a [recipe](/help/restaurant/recipes).', 'Take your first order: [Receiving and managing orders](/help/restaurant/orders).'),
      tip('Start without recipes. You can add them later without changing anything else.'),
    ], { related: ['restaurant/menu-items'] }),

    article('menus', 'Managing your menu', 'One place for dishes, extras and tables.', [
      p('Open **More, Menu and tables**. It has three tabs: **Menu items**, **Options and extras** and **Tables**.'),
      list('Search and filter dishes with the category chips.', 'Tap **Mark sold out** on a dish when you run out, and **Make available** when it is back. A sold-out dish cannot be ordered until it is available again.', 'Archive a dish you no longer sell. Past orders stay in your records.'),
      shot('menu-items', 'The Menu items tab with sample dishes and prices.'),
    ], { related: ['restaurant/menu-items'] }),

    article('menu-items', 'Creating menu items', 'Add a dish with a price, sizes and an optional recipe.', [
      steps('Open **More, Menu and tables** and tap **Add menu item** (or open **Products, Add product**).', 'For **What is this?** choose **Menu item (made when it is ordered)**.', 'Enter the name and **Selling price (₦)**.', 'For sizes, turn on **This product comes in sizes, colours or other options** and give each size its own price.', 'Choose a **Category** and save.'),
      p('Drinks and other items you buy and resell use **Item you buy and resell** and appear under **Drinks and other items** in the order screen.'),
      warn('A menu item has no stock count of its own. If you want ingredients taken out of stock, add a [recipe](/help/restaurant/recipes).'),
    ], { related: ['restaurant/modifiers', 'restaurant/recipes'] }),

    article('modifiers', 'Managing options and extras', 'Let guests add paid extras like extra meat or a bigger portion.', [
      p('Options belong to groups such as "Extras" or "Spice level".'),
      steps('Open **Menu and tables**, then the **Options and extras** tab.', 'Tap **New option group**. Enter a **Group name**.', 'Say how many a customer can choose (**Customer can choose up to**) and whether **They must choose one**.', 'Tap **Add option**. Enter the **Option name**, the **Extra price (₦)** (0 if free) and, optionally, the ingredient it uses and how much.', 'On a menu item, choose which option groups apply to it.'),
      p('The extra price is added to the dish and the ingredient, if you set one, is taken out of stock when the order is paid.'),
    ], { related: ['restaurant/menu-items'] }),

    article('tables', 'Managing tables', 'Add the tables waiters can start dine-in orders on.', [
      steps('Open **Menu and tables**, then the **Tables** tab.', 'Tap **Add table**. Enter a **Table name** (for example Table 1 or Patio 3) and the number of **Seats**.', 'Save.'),
      p('A table is marked **Not in use** if switched off. You cannot switch off a table that has an open order.'),
    ], { related: ['restaurant/orders'] }),

    article('orders', 'Receiving and managing orders', 'Start an order on a table, add items, send to the kitchen and take payment.', [
      steps('Open **Orders**. Tables with open orders show on the grid; takeaway and delivery orders are listed below.', 'Tap a table, or **New order** for takeaway or delivery. For **Order type** choose **Dine in**, **Takeaway** or **Delivery**. Dine in needs a **Table**.', 'Add dishes. Choose **Size or type**, options and a **Note for the kitchen**.', 'Tap **Send to kitchen**. The order appears on the kitchen screen ("Sent to the kitchen").', 'When the guest is ready to pay, tap **Take payment** (see [Taking payment for restaurant orders](/help/restaurant/payments)).'),
      shot('restaurant-orders', 'The Orders screen with sample tables.'),
      h('Changing an order'),
      list('Add items with **Add items** at any time.', 'Change or remove an item only before the kitchen starts it.', 'To cancel an item or order, tap **Cancel…**. If the food has already been made you must give a reason, and you can record it as wasted.'),
      warn('Starting an order twice by accident is prevented: a repeated tap does not create a second order.'),
    ], { related: ['restaurant/kitchen', 'restaurant/payments'] }),

    article('kitchen', 'Kitchen order management', 'The kitchen screen shows what to cook, oldest first.', [
      p('Open **Kitchen**. It refreshes every few seconds. Each ticket shows the table or order, the items with quantities, extras and notes, and how long it has waited.'),
      steps('Tap **Accept order** when the kitchen takes it. ShopScale checks the dishes are still available.', 'Tap **Start** on an item when cooking begins. The order moves from **Waiting to start** to **Being made**.', 'Tap **Ready** on each item when it is cooked. The order moves to **Ready to serve**.', 'When the food reaches the guest, tap **Served**.'),
      p('An order is Pending, Accepted, Preparing, Ready, Served or Cancelled. Its status follows its items. Tapping the same button twice changes nothing.'),
      warn('Cancelling food that is already being made needs a reason and the permission to void sales. You can record the ingredients as wasted.'),
    ], { related: ['restaurant/orders', 'restaurant/wastage'] }),

    article('recipes', 'Managing recipes and ingredients', 'Link a dish to its ingredients so stock goes down by itself.', [
      p('Ingredients are products of type **Ingredient** (add them in Products). They are not sold; recipes use them up.'),
      steps('Open **Menu and tables** and find the dish.', 'Open its recipe. Choose **This recipe makes** (for example 1 plate, or 12 for a batch).', 'Tap **Add ingredient**, choose the ingredient and the quantity.', 'Choose **When ingredients are used**: when it is sold (made fresh) or when you record production (made ahead).', 'Save.'),
      p('To remove a recipe tap **Remove recipe**. The dish keeps selling; ingredients are no longer deducted.'),
    ], { related: ['restaurant/ingredient-use', 'restaurant/bakery'] }),

    article('ingredient-use', 'Tracking ingredient consumption', 'See what you used, and when stock was taken out.', [
      list('Made-fresh dishes take their ingredients out of stock when the order is **paid**, once only, even if you tap more than once.', 'Made-ahead products take them out when you record production.', 'Wastage takes ingredients out when you record it.'),
      p('Open **More, Restaurant reports** and look at **Ingredients used** for the period. Each ingredient\'s history is also in **More, Stock**.'),
      tip('Check **Running low** often. Recipes make ingredients run out faster than you think.'),
    ], { related: ['restaurant/reports', 'products/stock-movements'] }),

    article('wastage', 'Understanding wastage', 'Record food and ingredients that were thrown away or lost.', [
      steps('Open **More, Wastage** and tap **Record wastage**.', 'Choose **What was wasted?** and enter how much.', 'Choose a reason such as spoilage, expired, damaged or dropped, cooking or preparation waste, or missing or stolen.', 'Add a note and save. "Wastage recorded and stock updated" appears.'),
      p('The item leaves your stock. A dish with a recipe uses up its ingredients. The page shows **Value wasted** for the period.'),
      warn('Wastage reduces stock and cannot be undone by tapping again. Each record has a reason and is part of your history.'),
    ], { related: ['restaurant/kitchen', 'restaurant/reports'] }),

    article('payments', 'Taking payment for restaurant orders', 'Split payments, part payment and discounts, recorded as a sale.', [
      steps('Open the order and tap **Take payment**.', 'Add a discount if your role allows it (**Discount (₦)**).', 'Choose how the guest pays. For **Split payment** add several payments (for example cash and transfer). Each must add up to the bill.', 'If part will be paid later, choose a customer and **Save with balance on account**.', 'Tap **Confirm payment**.'),
      list('The payment is recorded as one sale, so your revenue is counted once.', 'Paid orders stay on the kitchen screen until every item is served.', 'To undo a wrong paid order, tap **Reverse payment** (needs permission). This returns the money; ingredients are put back only for items the kitchen never started.'),
      warn('The payments cannot add up to more than the bill. You are told "The payments add up to more than the bill".'),
    ], { related: ['restaurant/orders', 'sales/payment-methods'] }),

    article('reports', 'Restaurant sales and kitchen reports', 'See what sells, how busy you are and what you use.', [
      p('Open **More, Restaurant reports** (needs the sales reports permission). Choose a period.'),
      list('**Menu sales** and **Sales by menu item**.', '**Orders**: volume, **Dine in / takeaway** split, **Orders by day** and **Average time to ready**.', '**Ingredients used**.'),
    ], { related: ['restaurant/ingredient-use'] }),

    article('bakery', 'Bakery: products, production and custom cakes', 'Record what you bake, sell by the slice or the whole cake, and take deposits.', [
      p('Bakery uses the same tools as restaurants, kept simple.'),
      h('Products and prices'),
      p('Add bread, cakes and pastries as **Finished product (made ahead, like bread or cakes)**. Add flour, sugar and so on as **Ingredient**.'),
      h('Recording production'),
      steps('Open **More, Production** and tap **Record production**.', 'Choose **What did you make?** and enter how many.', 'Save. Ingredients go down (if the product has a recipe) and finished stock goes up.'),
      p('Without a recipe only the finished stock goes up. Dishes made fresh are not production items.'),
      h('Wastage'),
      p('Record burnt or spoiled items under [Wastage](/help/restaurant/wastage).'),
      h('Custom cake orders'),
      p('Use **More, Customer orders** for a custom cake: enter the customer, items, delivery date and a **deposit**. The balance is tracked until they collect.'),
      h('Selling'),
      p('Sell in the shop through **Sell**, or online through your store. Stock, sales and finance stay together.'),
    ], { related: ['restaurant/recipes', 'sales/customers'], keywords: 'cake bread production' }),
  ],
}
