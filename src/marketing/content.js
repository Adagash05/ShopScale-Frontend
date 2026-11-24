// Shared public-site copy. Every statement here has to match what the application and the subscription system actually do.
// Plan facts (prices, limits, which plan has which feature) are NOT written here: pricing comes from the API (plans table).

export const FAQ_ITEMS = [
  ['What is ShopScale?', 'ShopScale is business management software for Nigerian businesses that buy and sell. It brings your sales, stock, customers, suppliers, expenses, invoices and online store together in one place, so you can see what is happening in your business without notebooks and spreadsheets.'],
  ['Who is ShopScale designed for?', 'Shops and retail businesses, traders and wholesalers, and businesses that sell online. If you buy and sell products and want to know your stock, your sales, your money and who owes you, ShopScale is built for you.'],
  ['Do I need a card to start?', 'No. The Free plan and the 14-day trial do not ask for a card. You only add a card if you decide to pay for a plan.'],
  ['What happens after the 14-day trial?', 'The trial gives you full access to everything in the Business plan. When it ends, your business moves to the Free plan unless you have subscribed. Nothing is deleted: you can still see all your records, and you can add new ones within the Free plan allowances. Subscribe to a paid plan whenever you need more.'],
  ['Will I be charged automatically?', 'Not during the trial and never on the Free plan. If you subscribe to a paid plan by card through Paystack, it renews automatically each month or year until you cancel. Paystack saves the card securely, and ShopScale never sees your card details.'],
  ['Can I cancel my subscription?', 'Yes, at any time from Plan and billing in the app. No further payment is taken, your paid access continues to the end of the period you already paid for, and your data is kept.'],
  ['Can I manage multiple users?', 'Yes. Free includes 1 user, Essential 2, Growth 5 and Business 10. You give each person a role, for example a cashier who can record sales but cannot see your profit, and you can remove anyone’s access at any time.'],
  ['Can I manage customers who owe me money?', 'Yes. Sell on credit, record part payments, see exactly who owes what, and record repayments as they come in. Essential and above can also create invoices and send WhatsApp payment reminders.'],
  ['Can I manage online orders?', 'Yes, on the Growth and Business plans. You get an online store, and customers can order and pay with your own Paystack account or choose to pay on pickup or delivery. You confirm, prepare and complete each order in ShopScale, and stock stays in step with your shop.'],
  ['Does ShopScale support multiple business operations?', 'ShopScale keeps sales, stock, customers, suppliers, expenses, invoices and online orders connected in one platform, so your shop and your online store use the same stock numbers. The number of people who can use it depends on your plan.'],
  ['Which plan includes Ask ShopScale?', 'Growth and Business. Ask ShopScale answers a set of business questions, such as which products sold the most, which customers owe you money and which expenses were highest, using your own records. It is not a general chatbot.'],
  ['Can I export my business data?', 'Yes, on the Growth and Business plans. You can export products and stock, customers with the amounts they owe, sales and expenses as CSV files. Your records always stay yours on every plan.'],
  ['How do WhatsApp invoice reminders work?', 'On Essential and above, open an unpaid invoice or a customer who owes you, choose a message (a friendly reminder, payment due or overdue), edit it if you like, and open WhatsApp. ShopScale prepares the message and you press send, so you stay in control. Essential includes 20 reminders per billing month, Growth 50 and Business unlimited. Free has no reminders.'],
]

export const PROBLEMS = [
  ['Sales written in notebooks and spreadsheets', 'Every sale recorded once, in seconds, with the payment type and the customer.'],
  ['Not sure what is really in stock', 'Stock goes down with every sale, with a full history and low-stock warnings.'],
  ['Customers who owe you money get forgotten', 'See who owes what, record part payments, and send a WhatsApp reminder.'],
  ['Expenses are unclear', 'Record costs by type and see estimated profit after expenses.'],
  ['Hard to keep track of suppliers', 'Record stock you receive and see what you still owe each supplier.'],
  ['No idea what sells and what does not', 'Best-selling products and customers, from your own sales.'],
  ['Online orders and shop sales kept apart', 'One set of products and stock for your shop and your online store.'],
]

export const INDUSTRIES = [
  { key: 'retail', to: '/retail', title: 'Retail and shops', text: 'Fashion, cosmetics, electronics, groceries and general stores.', points: ['Fast sales at the counter or on your phone', 'Sizes and colours with their own stock', 'Credit sales and customers who owe you'] },
  { key: 'wholesale', to: '/wholesale', title: 'Trading and wholesale', text: 'Distributors and traders who sell in bulk and buy from suppliers.', points: ['Record stock you receive from suppliers', 'Track what customers owe and what you owe', 'Invoices with WhatsApp payment reminders'] },
  { key: 'online', to: '/online-selling', title: 'Online commerce', text: 'Sellers who take orders through a store link and social media.', points: ['An online store with cart and checkout', 'Pay with Paystack or on delivery', 'Orders and stock managed with your shop'] },
  { key: 'growing', to: '/features', title: 'Other growing businesses', text: 'Any business that buys and sells products and has outgrown notebooks.', points: ['Sales, stock, expenses and customers together', 'Team access with roles', 'Reports that grow with you'] },
]
