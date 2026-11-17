import { article, h, list, p, steps, tip, warn } from './b.js'

export default {
  id: 'troubleshooting', title: 'Troubleshooting and FAQ', icon: 'wrench',
  desc: 'Fixes for the most common problems, based on how ShopScale actually behaves.',
  articles: [
    article('cannot-log-in', 'I cannot log in', 'Check your email, your password and your connection.', [
      steps('Check you typed your **email** correctly (the app says "Enter a valid email address" if not).', 'Check your **password**. It is case sensitive.', 'If you forgot it, tap **Forgot your password?** (see [Forgot password](/help/troubleshooting/forgot-password)).', 'Check your internet connection. A weak network shows "No connection" and does not sign you out.', 'If you have not yet registered, choose **Start your 14-day free trial**.'),
      p('Still stuck? Call or WhatsApp ShopScale Support using the buttons below.'),
    ], { related: ['troubleshooting/forgot-password'] }),

    article('forgot-password', 'Forgot password', 'Get a link by email and choose a new password.', [
      steps('On the sign-in screen tap **Forgot your password?**.', 'Enter your email and tap **Send reset link**.', 'Open the email and tap the link. It works for **one hour**.', 'Enter a **New password** (at least 8 characters) twice and tap **Change password**.', 'You are signed out everywhere. Sign in with the new password.'),
      p('The app always says "If an account exists for that address, a reset link is on its way", so it never reveals who has an account.'),
      list('"Link not valid" or "This reset link is incomplete": tap **Ask for a new link**.', 'No email: check spam and check you used the email you registered with.'),
    ], { related: ['troubleshooting/cannot-log-in'] }),

    article('cannot-add-product', 'I cannot add a product', 'Usually a missing field, a permission or a plan limit.', [
      list('"Enter the product name" or "Enter the selling price": fill them in.', '"Enter a quantity of zero or more" or "Use a whole number": check stock.', '"Give this option a name": each size or colour needs a name.', '"You do not have permission": ask the owner to change your role.', '"Your plan allows N items. Upgrade to add more": you reached your plan\'s product limit. Archive products you do not sell, or choose a bigger plan.'),
      p('If your plan has ended, the account is read-only until you renew. See [Managing subscription plans](/help/settings/plans).'),
    ], { related: ['products/create-product', 'settings/plans'] }),

    article('stock-incorrect', 'Stock quantity is incorrect', 'Find out what changed the number, then fix it.', [
      steps('Open **More, Stock, History** and find the product. Each change shows type, time and who made it.', 'Check you are looking at the right **location**.', 'Look for an unreceived stock transfer, a sale that was refunded or voided, or wastage.', 'If a real count differs, use **Set count** in a [stock adjustment](/help/products/stock-adjustments).'),
      tip('Receive stock from suppliers through **Receive stock** rather than typing counts, so the history is clear.'),
    ], { related: ['products/stock-movements', 'troubleshooting/branch-stock'] }),

    article('storefront-not-showing', 'My storefront is not displaying products', 'Check the store is open and the product is eligible.', [
      list('Is **Open my store to customers** switched on and saved?', 'Does your plan include the online store?', 'Is the product **active** (not archived)?', 'Is it a product you sell (goods or finished product)? Ingredients and made-to-order menu items are not listed.', 'Does it have **stock**? Without stock it shows as **Sold out**.', 'Did you refresh the store page?'),
      p('See [Troubleshooting storefront visibility](/help/storefront/troubleshoot-visibility).'),
    ], { related: ['storefront/troubleshoot-visibility'] }),

    article('customer-checkout', 'A customer cannot complete checkout', 'The message the customer sees tells you why.', [
      list('"Enter your name and phone number": both are required.', '"Enter your delivery address": needed for delivery.', '"Enter your email to pay online": needed for Paystack.', '"Online payment is not available for this store": connect Paystack.', '"Pay on pickup or delivery is not available for this store": turn that option on.', '"Only N left" or "no longer available": the stock changed; edit the cart.', 'The store is closed: turn it on.'),
      p('See [Troubleshooting payment and checkout issues](/help/storefront/troubleshoot-payments).'),
    ], { related: ['storefront/troubleshoot-payments'] }),

    article('payment-pending', 'Online payment is pending', 'The customer paid but the order says waiting for payment.', [
      steps('Ask the customer to wait a moment and refresh their order page. It says "We have not received your payment yet. If you have paid, this page will update in a moment."', 'Check your Paystack dashboard for the payment (customer email and amount).', 'Check you connected Paystack and set the **Webhook URL** shown on the Online store screen.', 'Check you are using the same keys (test or live) as the customer paid on.', 'If Paystack shows success and the order is still pending after a few minutes, contact ShopScale Support with the order number.'),
      warn('Do not hand over goods for an order that is not marked paid unless you have confirmed the money in Paystack.'),
    ], { related: ['orders/failed-payments', 'storefront/paystack'] }),

    article('order-not-appearing', 'An order is not appearing', 'It may be waiting for payment, or in another tab.', [
      list('Open **More, Online orders** and choose **All**.', 'An online order waiting for payment only reaches **New** once paid.', 'Check you have the permission to manage online orders.', 'Check your plan includes the online store.', 'Refresh the list.'),
      p('If you still cannot find it, ask the customer for their order number or the link to their order page, and contact ShopScale Support.'),
    ], { related: ['orders/understand-orders'] }),

    article('cannot-update-order', 'I cannot update an order status', 'Orders move forward in a fixed order.', [
      list('Confirm only works on **New**. Mark as ready only works on **Confirmed**.', 'The complete button is disabled while payment is pending.', '"Choose how the customer paid": pick Cash, Transfer or Card.', '"A sale was already recorded": refund it from Sales instead of cancelling.', '"This order cannot be completed": it is already completed or cancelled.', 'Another person may have just changed it. Refresh the list.'),
      p('Orders cannot go backwards. Move forward, complete or cancel it as needed.'),
    ], { related: ['orders/process-orders'] }),

    article('employee-access', 'An employee cannot access a feature', 'Almost always a role, a plan or a location.', [
      steps('Open **More, Team**, tap the person and **See access**.', 'Check the role includes the permission (for example sales, discounts or reports).', 'Check your plan includes the tool.', 'Change their role or create a custom role.'),
      p('The tool is hidden entirely when the person lacks the permission.'),
    ], { related: ['employees/permissions'] }),

    article('branch-stock', 'Branch stock discrepancies', 'Counts differ between locations.', [
      list('Check which location each person is selling from.', 'Check stock transfers are marked **received**.', 'Look at **Stock, History** for the location.', 'Adjust with **Set count** at the right location.'),
      p('Do not adjust both locations to hide a difference. First find out what moved, then correct only what is wrong.'),
    ], { related: ['branches/transfer-stock'] }),

    article('contact-support', 'Contacting ShopScale Support', 'Call or message us on WhatsApp.', [
      p('ShopScale Customer Support is by phone and WhatsApp. Use the buttons at the bottom of every Help page.'),
      list('Call 09122609070.', 'WhatsApp 09122609070 (opens a chat with ShopScale Support).', 'Signed in? **More, Support** lets you send a request to the ShopScale Team and follow the replies.'),
      tip('Tell us your business name, what you were doing and the exact message you saw. It helps us fix it faster.'),
    ], { related: ['getting-started/first-steps'] }),
  ],
}
