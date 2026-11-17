import { article, h, list, p, steps, tip, warn, shot } from './b.js'

export default {
  id: 'sales', title: 'Sales and POS', icon: 'cart',
  desc: 'Record sales in your shop, take payments, give receipts and handle returns.',
  articles: [
    article('understand-pos', 'Understanding the POS', 'The Sell screen is your till: tap products, check the total, confirm.', [
      p('POS means "point of sale", the place where a sale is recorded. In ShopScale it is the **Sell** screen, built for a phone.'),
      list('Search or tap products to add them.', 'Choose a customer if you want the sale linked to someone.', 'Pick how they are paying.', 'Confirm, then print the receipt.'),
      p('Stock goes down and your dashboard updates as soon as a sale is saved. If you lose your connection, the sale is saved on your phone and sent when you are back online. See **More, Sales saved offline**.'),
    ], { related: ['sales/make-a-sale'] }),

    article('make-a-sale', 'Making a sale', 'Add items, choose how the customer pays, confirm.', [
      steps('Tap **Sell**.', 'If your business has more than one location, check **Selling from**.', 'Search by name, SKU or barcode, or tap a product to add it. Tap again to add more. Change a quantity in the list if needed.', 'To link the sale to a customer, tap **Choose customer** and search by name or phone, or add a new one.', 'Add a **Discount** if you are allowed to and want to.', 'Choose how the customer is paying (see [Payment methods](/help/sales/payment-methods)).', 'Check the total, then confirm.'),
      shot('sell-screen', 'The Sell screen with three sample items and the payment choices.'),
      h('What happens after'),
      list('The receipt window opens with **Print** and **New sale**.', 'Stock is reduced for each item.', 'The sale appears in your sales history and the dashboard.'),
      warn('Check the total before you confirm. To undo a sale entered by mistake use **Void sale** in Sales history.'),
    ], { related: ['sales/payment-methods', 'sales/receipts'], keywords: 'pos checkout sell' }),

    article('add-products-to-sale', 'Adding products to a sale', 'Search, barcode or tap.', [
      list('Type in **Search product, SKU or barcode**.', 'Tap a product to add one. Tap again to add another.', 'Products with sizes or colours ask you to choose the option first.', 'If an item is out of stock you may be stopped, unless your settings allow selling at zero.'),
      tip('Use a barcode if your products have one; it is the fastest way to add items.'),
    ], { related: ['sales/make-a-sale'] }),

    article('discounts', 'Applying discounts', 'Take an amount off a sale if your role allows it.', [
      p('If you have permission to give discounts, the sale shows a **Discount (optional)** box. Enter the amount in naira. The total updates before you confirm.'),
      p('If you do not see it, your role does not include discounts. Ask the owner if you need it.'),
      warn('Discounts reduce the sale amount and so your profit. They are recorded on the sale and shown in sales history.'),
    ], { related: ['sales/make-a-sale', 'employees/permissions'] }),

    article('payment-methods', 'Recording payment methods', 'Cash, transfer or card. Paid in full, part payment, or pay later.', [
      h('How is the customer paying?'),
      list('**Paid in full**: choose **Cash**, **Transfer** or **Card**.', '**Part payment**: choose the method, then enter **Amount paid now**. The rest becomes **Amount remaining**, added to what the customer owes you.', '**Pay later**: nothing is paid now. The whole amount is added to what the customer owes you.'),
      p('Part payments and pay later need a customer so the balance can be tracked, and need your plan to include customer credit.'),
      h('What happens to the money'),
      p('Cash sales go to your cash account; transfers and cards go to your bank account (see [Cash accounts](/help/finance/cash-accounts)). A customer\'s balance shows in **Customers who owe you**.'),
    ], { related: ['finance/debtors'] }),

    article('complete-transactions', 'Completing transactions', 'Confirm, then print or start a new sale.', [
      steps('Check the items, total and payment.', 'Confirm the sale.', 'On the receipt window tap **Print**, or **New sale** to start the next one.'),
      p('Once confirmed, a sale is a permanent record. To correct it, use a return, a refund or a void. See [Processing returns](/help/sales/returns).'),
    ], { related: ['sales/receipts', 'sales/returns'] }),

    article('receipts', 'Printing receipts', 'Print from the receipt window or from sales history.', [
      p('After you confirm a sale, the receipt appears. Tap **Print**. You can also reopen any past sale from sales history and tap **Print receipt**.'),
      p('Your business name, phone and address on the receipt come from [Business settings](/help/settings/business-details).'),
      tip('Customers who want a bill instead can be sent an **Invoice**: open the sale and tap **Create invoice** if your role allows it.'),
    ], { related: ['sales/sales-history'] }),

    article('sales-history', 'Understanding sales history', 'Every sale you have recorded, newest first.', [
      p('Open **More, Sales**. You see every sale in the period you choose, with its status. Tap a sale for the items, payments and what is still owed.'),
      list('**Refunded** and **Voided** sales are labelled.', 'From a sale you can **Print receipt**, **Create invoice**, **Return items**, **Refund everything** or **Void sale** (if your role allows).'),
      p('Online store sales appear here once the order is completed, with a note "Online order #…".'),
    ], { related: ['sales/returns', 'sales/reports'] }),

    article('returns', 'Processing returns, refunds and voids', 'Three ways to correct a sale.', [
      list('**Return items**: the customer brings some items back. Choose how many of each. Anything they still owe is cleared first; the rest is paid back. You can choose **Put back in stock** and **Pay back with** cash, transfer or card.', '**Refund everything**: the whole sale is returned.', '**Void sale**: for a sale entered by mistake. Stock is put back, the money is returned and the sale is removed from your reports. It asks for a reason.'),
      warn('Voiding and refunding change your stock and reports. Only use them when you mean to, and give a clear reason.'),
    ], { related: ['sales/sales-history', 'orders/refunds'] }),

    article('reports', 'Understanding sales reports', 'See sales by employee, location, payment type and channel.', [
      p('Open **More, Sales reports** (if your role allows). Choose a period to compare:'),
      list('**By employee**: who sold what.', '**By location**: each shop or branch.', '**By payment**: cash, transfer, card.', '**By channel**: in-shop, online store and so on.'),
      p('Your dashboard also shows best sellers, gross profit by day and sales by category.'),
    ], { related: ['getting-started/dashboard'] }),

    article('customers', 'Customers, quotations and customer orders', 'Keep customers, give prices and take deposits.', [
      list('**Customers** (bottom bar): add people you sell to, with their phone, address and, for wholesale, a price tier. A **Customers who owe you** filter shows who owes money.', '**Quotations** (More): give a customer a price before they commit.', '**Customer orders** (More): take an order with a deposit and a delivery date.', '**Invoices** (More): bills for customers that you can share as a PDF or on WhatsApp.'),
      p('Bakeries use **Customer orders** for custom cakes with a deposit and a balance.'),
    ], { related: ['restaurant/bakery'] }),
  ],
}
