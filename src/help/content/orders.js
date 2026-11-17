import { article, h, list, p, steps, tip, warn, shot, illus } from './b.js'

export default {
  id: 'orders', title: 'Online Order Management', icon: 'orders',
  desc: 'Receive, check, prepare and complete orders from your online store.',
  articles: [
    article('understand-orders', 'Where online orders appear', 'Open More, then Online orders.', [
      p('Orders from your store collect in one place: **More, Online orders**. You also get a notification when a new paid order arrives.'),
      h('The orders list'),
      p('Tabs across the top filter the list: **All**, **New**, **Confirmed**, **Ready**, **Done** and **Cancelled**. Each row shows the order number and customer, the date, **Delivery** or **Pickup**, whether it was **Paid online** or is **Pay later**, the total and the status.'),
      shot('online-orders', 'The Online orders list with sample orders in different statuses.'),
      h('Who can see it'),
      p('You need the permission to manage online orders, and your plan must include the online store.'),
    ], { related: ['orders/statuses', 'orders/order-details'] }),

    article('statuses', 'Understanding order statuses', 'An order moves through a small, fixed set of statuses.', [
      illus('order-lifecycle'),
      list('**Pending payment**: the customer chose to pay online and Paystack has not confirmed the money yet. You can see these under **All**. Do not prepare them.', '**New**: ready for you. Either payment was confirmed, or the customer chose to pay on pickup or delivery.', '**Confirmed**: you accepted the order and are working on it.', '**Ready**: packed and waiting for pickup or delivery.', '**Completed**: handed over. The sale is recorded and stock is reduced.', '**Cancelled**: the order was stopped.'),
      p('Payment and fulfilment are separate. An order can be **New** and unpaid (pay later), or **Pending payment** and not yet yours to fulfil.'),
      warn('Creating an order is not the same as being paid. An online order is only paid once Paystack confirms the exact amount.'),
    ], { related: ['orders/payment-status', 'orders/process-orders'] }),

    article('order-details', 'Viewing order details', 'Tap an order to see everything about it.', [
      p('Tap any order in the list. A window opens with:'),
      list('The customer\'s name and phone (tap the number to call) and email if given.', '**Deliver to** with the address, or "Customer will pick up". Any note the customer left.', 'Each item with its quantity and line total, plus the **Delivery fee** if any and the **Total**.', 'The **Payment** badge: **Paid online**, **Pay on handover** or **Not paid**.', 'A line "A sale has been recorded for this order" once it is completed.', 'A red notice if something needs your attention, with a **Dismiss** button.'),
      p('The buttons at the bottom depend on the status.'),
    ], { related: ['orders/process-orders'] }),

    article('payment-status', 'Understanding order payment status', 'Paid online, pay on handover, not paid, or failed.', [
      list('**Paid online**: Paystack confirmed the amount and currency. Safe to prepare and hand over.', '**Pay on handover**: the customer will pay you when they collect or receive the order. You choose how they paid when you complete it.', '**Not paid**: online payment has not been confirmed.', '**Failed**: Paystack reported the payment as failed or abandoned.'),
      h('How ShopScale confirms payment'),
      p('When a customer pays, ShopScale asks Paystack directly whether the payment succeeded and checks the amount, currency and reference match the order. It never trusts the customer\'s browser. Confirmation can arrive when the customer returns to your store or through Paystack\'s webhook. Whichever comes first wins, and the other changes nothing, so an order is never counted twice.'),
      warn('If the notice says "Payment did not match the order amount. Check Paystack before fulfilling", do not hand over the goods until you have checked your Paystack dashboard.'),
    ], { related: ['orders/verify-payments', 'orders/failed-payments'] }),

    article('verify-payments', 'Verifying payments', 'ShopScale verifies for you; you can double-check in Paystack.', [
      p('You do not need to verify a payment by hand. A paid order moves from **Pending payment** to **New** by itself.'),
      steps('Open the order and check the **Payment** badge says **Paid online**.', 'If you are unsure, open your Paystack dashboard and look up the payment by the customer\'s email and amount.', 'If the order stays on pending payment but the customer says they paid, see [Online payment is pending](/help/troubleshooting/payment-pending).'),
      tip('For an order the customer pays when they collect it, the badge says **Pay on handover**; there is nothing to verify until then.'),
    ], { related: ['troubleshooting/payment-pending'] }),

    article('process-orders', 'Accepting and processing orders', 'Confirm, prepare, mark ready and complete.', [
      p('Open **More, Online orders**, then follow these steps for each order.'),
      warn('Do not prepare an order that says **Pending payment**. The customer has checked out but the payment is not confirmed yet. It becomes **New** once Paystack confirms it (or straight away if the customer chose to pay on handover).'),
      steps('Tap a **New** order to open it.', 'Check the items and stock. Tap **Confirm order**. The status becomes **Confirmed** ("Order confirmed").', 'Prepare the order: pick, pack or cook the items.', 'Tap **Mark as ready**. The status becomes **Ready** ("Marked ready").', 'When the customer has it, complete the order (see [Completing and fulfilling orders](/help/orders/fulfilment)).'),
      shot('order-detail', 'An order open with its items, payment status and the Confirm order button.'),
      h('What happens after'),
      p('Each change is saved with your name. Other people on your team see the new status when they refresh the list.'),
      warn('Only move an order forward after you have done the work. You cannot move an order backwards.'),
    ], { related: ['orders/fulfilment', 'orders/cancelled'] }),

    article('preparing', 'Preparing orders', 'Use Confirmed and Ready to show where each order is.', [
      list('**Confirmed** means you accepted it and are working on it.', '**Ready** means it is packed and waiting.', 'Use the **Confirmed** and **Ready** tabs as a to-do list for your team.'),
      p('Online orders for restaurant businesses are separate from dine-in orders on the kitchen screen. See [Receiving and managing orders](/help/restaurant/orders).'),
    ], { related: ['orders/process-orders'] }),

    article('fulfilment', 'Completing and fulfilling orders', 'Hand over the goods and record the sale.', [
      p('Complete an order when the customer has received it. This is the moment the sale is recorded and your stock goes down.'),
      h('If the customer paid online'),
      steps('Open the order. The button says **Hand over and complete**.', 'Tap it. The message "Order completed and sale recorded" appears.'),
      h('If the customer pays you when they collect or receive it'),
      steps('Open the order and choose how they paid: **Cash**, **Transfer** or **Card**.', 'Tap **Payment received - complete**.'),
      p('The button is disabled while an online payment is still pending, so you cannot complete an order that has not been paid.'),
      h('What happens after you complete'),
      list('The order status becomes **Completed**.', 'A sale is created in your sales, with the order number and customer name in the note.', 'Stock is reduced for each item.', 'The money appears in your money overview, under **Online orders**.', 'The customer can review the items.'),
      h('Delivery or collection'),
      p('There are no separate delivery statuses. Use **Ready** while the order waits or is out for delivery, then complete it when the customer has it.'),
    ], { related: ['orders/relationship', 'orders/duplicates'] }),

    article('cancelled', 'Handling cancelled orders', 'Cancel an order that will not go ahead.', [
      steps('Open the order and tap **Cancel order**.', 'Confirm "Cancel this order?".'),
      p('You can cancel while the order is New, Confirmed or Ready and **no sale has been recorded**. Once a sale exists you cannot cancel; refund it from Sales instead.'),
      warn('If the customer already paid online, the order shows "Customer paid online. Refund them in your Paystack dashboard." ShopScale does not send the money back for you. Refund through Paystack.'),
      p('Orders waiting for payment are cancelled automatically if the customer never pays.'),
    ], { related: ['orders/refunds', 'orders/failed-payments'] }),

    article('failed-payments', 'Handling failed payments', 'What happens when a customer\'s payment does not go through.', [
      list('If Paystack reports the payment failed or was abandoned, the order shows as not paid and stays on **Pending payment**.', 'The customer can try again from their order page, or place a new order.', 'An order that is never paid is cancelled automatically: after about an hour if Paystack never saw a payment attempt, or after 24 hours.'),
      p('You never need to prepare an order that is on Pending payment.'),
      p('If a customer pays **after** an order was cancelled, the order shows "Customer paid after this order was cancelled. Refund in Paystack." Refund them in your Paystack dashboard.'),
    ], { related: ['troubleshooting/payment-pending', 'orders/payment-status'] }),

    article('refunds', 'Handling refunds', 'Cancelled orders and completed orders are refunded differently.', [
      h('Before you complete the order'),
      p('Cancel the order. If it was paid online, refund the customer in your Paystack dashboard.'),
      h('After you complete the order'),
      steps('Open **More, Sales** and find the sale ("Online order #…").', 'Tap **Return items** to take some items back, or **Refund everything** for the whole sale.', 'Choose whether to put the items back in stock and how to pay the customer back.', 'Return any card or transfer money through Paystack or your bank.'),
      warn('Recording a return in ShopScale updates your stock, sales and money records. It does not move money back to a customer\'s card.'),
    ], { related: ['sales/returns'] }),

    article('relationship', 'Orders, inventory and sales', 'How an online order affects the rest of your business.', [
      list('**Creating** an order does not change stock or sales.', '**Payment confirmation** makes the order yours to process (status New). It still does not change stock.', '**Completing** the order records a sale. That is when stock goes down and revenue is counted.', '**Cancelling** before completion changes nothing in stock or sales.'),
      p('Because stock only changes at completion, two customers can order the last item. At checkout ShopScale stops orders for more than you hold, but check stock when you accept an order.'),
      tip('Online sales appear in your sales history and in reports by channel, so you can compare shop and online sales.'),
    ], { related: ['sales/sales-history', 'finance/overview'] }),

    article('duplicates', 'Avoiding duplicate order processing', 'ShopScale protects you from doing the same thing twice.', [
      list('Completing an order twice records one sale only.', 'A payment confirmed twice (return and webhook) counts once.', 'Buttons are disabled while an action is running. Wait for the confirmation message before tapping again.'),
      tip('If two people open the same order, the second to act sees a message such as "This order is confirmed and cannot move that way". Refresh the list.'),
    ], { related: ['orders/process-orders'] }),

    article('troubleshoot', 'Troubleshooting order issues', 'Common order problems and what to do.', [
      list('**Order is not appearing**: check the tab, check **All**, and see whether it is waiting for payment.', '**Cannot complete**: if payment is pending, the button is disabled until Paystack confirms.', '**"This order cannot be completed"**: it is already completed or cancelled.', '**"A sale was already recorded"** when cancelling: refund it from Sales.', '**"Choose how the customer paid"**: pick Cash, Transfer or Card for pay-later orders.'),
      p('More fixes: [Troubleshooting](/help/troubleshooting).'),
    ], { related: ['troubleshooting/order-not-appearing', 'troubleshooting/cannot-update-order'] }),
  ],
}
