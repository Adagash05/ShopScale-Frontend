import { article, h, list, p, steps, tip, warn } from './b.js'

export default {
  id: 'purchasing', title: 'Purchasing and Suppliers', icon: 'truck',
  desc: 'Record who you buy from, receive stock and see what you owe.',
  articles: [
    article('suppliers', 'Adding suppliers', 'Keep the people you buy from in one list.', [
      steps('Open **More, Suppliers and purchases**.', 'Go to the **Suppliers** tab and tap **Add supplier**.', 'Enter the **Supplier name**, and optionally phone, email, address and notes.', 'Save. "Supplier saved" appears.'),
      p('Each supplier shows **Still owed to supplier**, or **Settled** when you owe nothing.'),
    ], { related: ['purchasing/receive-stock', 'purchasing/supplier-balances'] }),

    article('receive-stock', 'Receiving stock from a supplier', 'Record what you bought. Your stock and costs update.', [
      p('Use this when you buy stock and receive it straight away.'),
      steps('Open **More, Suppliers and purchases** and tap **Receive stock**.', 'Choose the location under **Receiving into** if you have more than one.', 'Search for each product you received and add it.', 'Enter **How many?** and the **Cost of each (₦)**.', 'Choose the **Supplier** (or "No supplier") and add the supplier invoice number if you have it.', 'Say **How did you pay?** and the **Amount paid now (₦)**. Anything you do not pay now is added to what you owe the supplier.', 'Save.'),
      h('What happens after'),
      list('Stock is added to your inventory straight away.', 'The cost of each item is updated, which improves profit estimates.', 'The amount you still owe the supplier is recorded.'),
      warn('Check the quantities and costs before you save. A wrong cost affects your profit figures.'),
    ], { related: ['purchasing/purchase-orders', 'products/stock-adjustments'] }),

    article('purchase-orders', 'Creating purchase orders', 'Order stock now and receive it in one or more deliveries.', [
      p('Use **More, Supplier orders** when you order stock that will arrive later. It is available if your plan includes purchasing.'),
      steps('Tap **New order to a supplier** (or the add button).', 'Choose the **Supplier** and where it will be delivered (**Deliver to**).', 'Optionally set **Expected on**.', 'Search and add each product with its **Price ₦** and quantity.', 'Add a **Note** or **Supplier invoice number** if you like, and any amount you **Paid to the supplier now**.', 'Save the order.'),
      p('The order is listed under **Orders to suppliers** with its status. See [Receiving a delivery](/help/purchasing/receive-delivery) when the goods arrive.'),
    ], { related: ['purchasing/receive-delivery'] }),

    article('receive-delivery', 'Receiving a delivery', 'Enter only what has arrived. Receive the rest later.', [
      steps('Open **More, Supplier orders** and tap the order.', 'Tap the receive button to open **Receive goods**.', 'Enter only the quantity that has arrived for each item. Items show what was ordered and already received.', 'Save. "Goods received. Stock updated." appears.'),
      p('When everything has arrived the order shows **Received**. You can also cancel an order that has not been delivered, or close one that will not be completed.'),
    ], { related: ['purchasing/purchase-orders', 'purchasing/supplier-balances'] }),

    article('supplier-balances', 'Managing supplier balances', 'See what you owe and record payments.', [
      steps('Open **More, Suppliers and purchases** and the **Suppliers** tab.', 'Tap a supplier. The screen says "You owe this supplier" with the amount.', 'Tap **Record a payment**. Enter **Amount paid (₦)** and the **Payment method**.', 'Save. "Payment recorded" appears and the balance reduces.'),
      p('Every payment you made is listed under **Payments you made**, with the purchases below it.'),
      tip('Your money overview also shows **Suppliers you owe** in total.'),
    ], { related: ['finance/supplier-liabilities'] }),

    article('purchasing-records', 'Understanding purchasing records', 'Purchases, orders and payments each have their own list.', [
      list('**Purchases** tab: stock you have received, and "The stock was added to your inventory when this was recorded."', '**Supplier orders**: orders placed but maybe not fully received.', '**Supplier page**: purchases and payments for one supplier.'),
      p('Nothing is deleted. A mistake is corrected with another record, so there is always a trail.'),
    ], { related: ['purchasing/suppliers'] }),

    article('received-stock', 'Managing stock received from suppliers', 'How received goods connect to your stock.', [
      list('Receiving adds to stock and updates item cost.', 'The stock history shows each receipt as "Stock added".', 'If a count is wrong afterward, use a [stock adjustment](/help/products/stock-adjustments).', 'To send stock to another shop, use a [stock transfer](/help/branches/transfer-stock).'),
      tip('Always receive stock through **Receive stock** or a supplier order so the cost and the amount you owe stay correct. A plain stock adjustment changes the count but not what you owe.'),
    ], { related: ['products/stock-movements'] }),
  ],
}
