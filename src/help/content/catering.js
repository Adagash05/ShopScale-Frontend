import { article, h, list, p, steps, tip, warn, shot } from './b.js'

export default {
  id: 'catering', title: 'Catering', icon: 'calendar',
  desc: 'Packages, enquiries, quotations, deposits, preparation and event profit.',
  articles: [
    article('set-up', 'Setting up catering operations', 'Create packages and services, then take your first enquiry.', [
      p('Catering tools are available when you chose **Catering or small chops**. Open **Events** in the bottom bar.'),
      steps('Add what you offer in [Packages and services](/help/catering/packages).', 'Capture an enquiry: [Creating events](/help/catering/events).', 'Work it through to a booking and payment.'),
      tip('Add ingredients to each package so ShopScale can plan what to buy and show your estimated profit.'),
    ], { related: ['catering/packages'] }),

    article('packages', 'Managing catering packages and services', 'A package is a menu priced per guest. Services are extras.', [
      steps('Open **More, Packages and services** and tap **New package**.', 'Enter the **Package name**, a short description and **What is included**.', 'Set **Price per guest (₦)**, a **Fixed price (₦)** if you want one, and **Minimum guests**. Smaller events are charged for the minimum.', 'Under **Ingredients per guest** add the ingredients or dishes and quantity per guest.', 'Save.'),
      p('For **Additional services** tap **New service**, name it (for example Waiters, Tent and chairs, Delivery), set the price and choose **One price** or **Per guest**.'),
      p('Turn off **Offer this package** to stop using it for new events. Existing events keep their prices.'),
    ], { related: ['catering/events'] }),

    article('events', 'Creating catering events and quotations', 'From enquiry to quotation, with the price worked out for you.', [
      steps('Open **Events** and tap **New enquiry**.', 'Enter the **Event name**, the customer (search an existing customer or enter a name and phone), **Event date**, **Start time**, **Expected guests**, **Venue** and **Requirements**.', 'Choose a **Package** and tick any **Additional services**. The price updates as you go.', 'Add a **Discount** and the **Deposit needed to confirm** if you want.', 'Set when the quotation is valid until, or leave it for 14 days.', 'Save the enquiry.'),
      shot('catering-event-form', 'The new enquiry form with a package and services chosen.'),
      p('Then open the event and tap **Send quotation**. The status changes from Enquiry to Quotation sent.'),
      warn('The final price is always worked out again on the server when you save. The preview is only a guide.'),
    ], { related: ['catering/bookings', 'catering/payments'] }),

    article('bookings', 'Recording customer bookings', 'Confirm a booking and avoid clashes.', [
      steps('Open the event and tap **Confirm booking**.', 'If a deposit is required, record it first on the **Payments** tab.', 'If another event is on the same date or at the same venue, you are warned and must resolve it.'),
      p('The status becomes **Booked**. Dates and venues are checked so two events do not double-book.'),
      p('To cancel, tap **Cancel**, give a reason and, if the customer paid, choose how much to refund and how.'),
    ], { related: ['catering/payments'] }),

    article('payments', 'Managing deposits and balances', 'Record each payment once. Never above what is owed.', [
      steps('Open the event and the **Payments** tab.', 'Tap **Record payment**.', 'Enter **Amount received (₦)** and choose **Paid by**.', 'Save. "Payment recorded" appears.'),
      list('The tab shows **Total**, **Received** and **Still owed**, and a history of payments and refunds.', 'You cannot record more than the balance.', 'A repeated tap does not record a payment twice.', 'Payments post to your cash and bank accounts once, and show under **Catering deposits** in your money overview.'),
    ], { related: ['catering/profit', 'finance/overview'] }),

    article('preparation', 'Preparing catering orders', 'Checklist, ingredient planning and taking stock out once.', [
      steps('Open a booked event and tap **Start preparation**. A checklist and ingredient list appear on the **Preparation** tab.', 'Tick tasks as they are done, or add your own, for example "Buy drinks".', 'Check the ingredient list. Items you are short of are flagged.', 'Tap **Take out of stock** to deduct the ingredients. This can be done once for an event.', 'Tap **Food is ready** when done and **Complete event** after the event.'),
      p('If you use more, bring some back or waste some, tap **Extra, returned or wasted** so your stock stays correct.'),
      warn('Taking ingredients out of stock cannot be repeated for the same event.'),
    ], { related: ['catering/profit'] }),

    article('profit', 'Monitoring event profitability', 'Compare what you planned to spend with what you spent.', [
      p('Open the **Costs and profit** tab on an event.'),
      list('**Revenue**, **Estimated cost**, **Actual cost** and profit so far.', 'Add costs with **Add a cost**. Choose **Already paid** (added to your expenses) or **Estimate** (a plan only).', 'Ingredients used and other costs are separate lines.'),
      p('The **Events** home page shows upcoming events, pending enquiries, confirmed bookings, amounts customers still owe, events in preparation and profit this month.'),
    ], { related: ['finance/overview'] }),
  ],
}
