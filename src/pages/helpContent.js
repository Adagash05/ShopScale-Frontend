/**
 * Quick answers for business owners, grouped the way people look for them. Every answer points to a full guide in the public Help Centre
 * (which exists: /help) and the support page. Nothing here is a feature or channel that ShopScale does not have.
 */
export const CATEGORIES = [
  { id: 'start', title: 'Getting started' },
  { id: 'sales', title: 'Sales and receipts' },
  { id: 'products', title: 'Products and stock' },
  { id: 'customers', title: 'Customers' },
  { id: 'suppliers', title: 'Suppliers' },
  { id: 'money', title: 'Money and expenses' },
  { id: 'store', title: 'Online store' },
  { id: 'account', title: 'Account and subscription' },
  { id: 'invoices', title: 'Invoices and payments' },
]

export const ARTICLES = [
  { id: 'start-1', cat: 'start', title: 'How do I set up my business?', body: [
    'Create your account, tell ShopScale what you sell and choose your store address. It takes about two minutes.',
    'Next add your products, then record your first sale. Your Home page fills in as you work.' ], guide: '/help/getting-started/first-steps' },
  { id: 'start-2', cat: 'start', title: 'What do the Home figures mean?', body: [
    'Sales is what you sold. Money received is what customers actually paid. They are different when someone buys on credit.',
    'Profit is sales minus what the products cost you (and, for the estimate, minus your expenses). It is only as accurate as the cost prices you entered.' ], guide: '/help/getting-started/dashboard' },
  { id: 'start-3', cat: 'start', title: 'How do I find things in the menu?', body: [
    'The menu has Home, Sales, Products & Stock, Money, Customers & Suppliers, Online Store, Reports and Settings. Each one has tabs for the related screens.',
    'You only see the screens your role is allowed to use.' ], guide: '/help/getting-started/navigation' },

  { id: 'sales-1', cat: 'sales', title: 'How do I record a sale?', body: [
    'Open Sales, tap the product, check the total and tap Confirm sale. Stock goes down by itself.',
    'You see "Sale recorded successfully" and the receipt only after ShopScale has saved the sale. If something goes wrong, your items stay on the screen so you can try again.' ], guide: '/help/sales/make-a-sale' },
  { id: 'sales-2', cat: 'sales', title: 'What if a customer pays part now and the rest later?', body: [
    'Part payment: enter what the customer paid now. The rest is recorded as owed, so you must choose the customer.',
    'Pay later: the whole amount is owed. See who owes you under Customers & Suppliers.' ], guide: '/help/sales/payment-methods' },
  { id: 'sales-3', cat: 'sales', title: 'How do I print or find a receipt?', body: [
    'The receipt opens right after a sale. Tap Print.',
    'To see an older sale, open Sales, then Sales history. You can open any sale from there.' ], guide: '/help/sales/receipts' },
  { id: 'sales-4', cat: 'sales', title: 'I tapped Confirm twice. Is the sale recorded twice?', body: [
    'No. A repeated tap is ignored and the server only accepts each sale once.' ], guide: '/help/orders/duplicates' },
  { id: 'sales-5', cat: 'sales', title: 'How do I undo a sale?', body: [
    'Open the sale in Sales history and choose Refund sale. Stock goes back. Hand any money back yourself.' ], guide: '/help/sales/returns' },

  { id: 'products-1', cat: 'products', title: 'How do I add products?', body: [
    'Open Products & Stock, then Products, then Add product. You only need a name, a price and how many you have.',
    'Many products at once? Use Import on the Products page to upload a CSV file; a template is provided.' ], guide: '/help/products/create-product' },
  { id: 'products-2', cat: 'products', title: 'Sizes, colours and other options', body: [
    'When adding a product, tick "This product comes in sizes, colours or other options". Each option has its own price and stock.' ], guide: '/help/products/variants-units' },
  { id: 'products-3', cat: 'products', title: 'How do I add stock or correct a count?', body: [
    'Open the product and tap Update stock. Choose Add stock when new stock arrives, or Set count after counting the shelf.' ], guide: '/help/products/manage-stock' },
  { id: 'products-4', cat: 'products', title: 'How do I know what is running low?', body: [
    'Products running low show on Home and under Stock. You choose the warning level under "Add more details" on each product.' ], guide: '/help/products/low-stock' },
  { id: 'products-5', cat: 'products', title: 'Can I hide a product I no longer sell?', body: [
    'Archive it. It disappears from Sales but your history stays, and you can restore it any time.' ], guide: '/help/products/edit-product' },

  { id: 'customers-1', cat: 'customers', title: 'How do I add a customer?', body: [
    'Add customers while selling, or under Customers & Suppliers, then Customers. Open a customer to see their purchases and what they owe.' ], guide: '/help/sales/customers' },
  { id: 'customers-2', cat: 'customers', title: 'A customer paid what they owed', body: [
    'Open the customer and tap Record a payment. You can record part of what they owe.' ], guide: '/help/finance/debtors' },
  { id: 'customers-3', cat: 'customers', title: 'Who owes me money?', body: [
    'Home shows the total. Under Customers, choose the filter for customers who owe you to see each person.' ], guide: '/help/finance/debtors' },

  { id: 'suppliers-1', cat: 'suppliers', title: 'How do I record stock from a supplier?', body: [
    'Open Products & Stock, then Receive stock. Search the product, enter how many came and what each cost you.',
    'ShopScale adds the stock and works out your average cost, so profit uses what the shelf really cost.' ], guide: '/help/purchasing/receive-stock' },
  { id: 'suppliers-2', cat: 'suppliers', title: 'I have not paid the supplier in full', body: [
    'Choose the supplier when you receive the stock. ShopScale remembers what you owe and you record each payment on the supplier page.',
    'Supplier balances are included from the Essential plan.' ], guide: '/help/purchasing/supplier-balances' },

  { id: 'money-1', cat: 'money', title: 'How do I record an expense?', body: [
    'Open Money, then Business expenses, and add what you spent, such as rent, transport or wages.' ], guide: '/help/finance/expenses' },
  { id: 'money-2', cat: 'money', title: 'How is profit worked out?', body: [
    'Gross profit is sales minus what the products cost you. Estimated profit also takes off your recorded expenses.',
    'Buying stock is not an expense. Its cost shows up in profit when you sell the items.' ], guide: '/help/finance/overview' },
  { id: 'money-3', cat: 'money', title: 'Can I download my records?', body: [
    'Settings, then Export data, gives CSV files. It is included from the Essential plan.' ], guide: '/help/finance/export-records' },

  { id: 'store-1', cat: 'store', title: 'How do I open my online store?', body: [
    'Open Online Store, then Store settings, and turn on "Open my store to customers". Your store link is shown there.',
    'The online store is included from the Growth plan. On other plans the screen says so and links to the plans.' ], guide: '/help/storefront/activate-store' },
  { id: 'store-2', cat: 'store', title: 'How do customers pay online?', body: [
    'Customers pay through your own Paystack account. Add your Paystack keys under Store settings.' ], guide: '/help/storefront/paystack' },
  { id: 'store-3', cat: 'store', title: 'Where do online orders appear?', body: [
    'Under Online Store, then Online orders. You are notified when an order is paid, so you never prepare an unpaid order.' ], guide: '/help/storefront/receiving-orders' },

  { id: 'account-1', cat: 'account', title: 'How do I change my plan?', body: [
    'Open Settings, then Plan and billing, choose a plan and follow the payment steps. Payment is processed by Paystack.' ], guide: '/help/settings/plans' },
  { id: 'account-2', cat: 'account', title: 'What happens when my trial or plan ends?', body: [
    'Every new business gets 14 days free. If a trial or paid plan ends, you move to the Free plan so you can keep selling. Free has lower limits and fewer features, and your data is never deleted.' ], guide: '/help/getting-started/subscriptions' },
  { id: 'account-3', cat: 'account', title: 'How do I add a cashier?', body: [
    'Open Settings, then Team, then Add. Enter their name and email. A cashier can record sales but cannot see profit or change settings.',
    'To stop someone using the business, choose Remove access. It takes effect straight away and past records stay.' ], guide: '/help/employees/add-team' },
  { id: 'account-4', cat: 'account', title: 'Cancelling or updating my card', body: [
    'Plans renew automatically. Plan and billing shows your next renewal and lets you update the payment method or cancel. Access continues until the period you paid for ends.' ], guide: '/help/settings/billing' },
  { id: 'invoices-1', cat: 'invoices', title: 'How do I create an invoice?', body: [
    'Go to Sales, then Invoices, then New invoice. Choose a customer, add products from your catalogue (the price comes from your product list) or type an item by hand, and set a due date if you want one.',
    'You can also open a sale and tap Create invoice. ShopScale works out the totals when you save.' ] },
  { id: 'invoices-2', cat: 'invoices', title: 'How do I send an invoice on WhatsApp?', body: [
    'Open the invoice and tap Share via WhatsApp. On phones that allow it the PDF itself is shared. Otherwise WhatsApp opens with a message and a link to the invoice.',
    'ShopScale cannot see whether you pressed send, so it asks you to confirm before marking the invoice as sent.' ] },
  { id: 'invoices-3', cat: 'invoices', title: 'Is a sent invoice money I have received?', body: [
    'No. An invoice is a request for payment. Money is counted as received only when you record a payment against it.',
    'Part payments are allowed. The invoice shows Partly paid until the balance is cleared, and Overdue once the due date has passed with a balance left.' ] },
  { id: 'invoices-4', cat: 'invoices', title: 'How do I remind a customer who has not paid?', body: [
    "Open the invoice (or the customer) and tap Remind customer. Pick a friendly, due or overdue message, edit the wording, then copy it or open WhatsApp with the customer's saved number.",
    'ShopScale never sends reminders for you. You decide when each one goes.' ] },
]

/** Case-insensitive match on the question, the answer and the category name. */
export function searchArticles(term, articles = ARTICLES) {
  const words = String(term || '').toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return articles
  return articles.filter((a) => {
    const hay = `${a.title} ${a.body.join(' ')} ${CATEGORIES.find((c) => c.id === a.cat)?.title || ''}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
}
