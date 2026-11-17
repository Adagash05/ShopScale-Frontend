import { article, h, list, p, steps, tip, warn } from './b.js'

export default {
  id: 'finance', title: 'Money and Finance', icon: 'wallet',
  desc: 'Expenses, cash and bank, who owes you, who you owe and cashier reconciliation.',
  articles: [
    article('overview', 'Understanding the money overview', 'What came in, what went out and who owes whom.', [
      p('Open **More, Money overview**. Choose a period.'),
      list('**Money received**, **Money paid out** and **Money you hold now**.', '**Where it came from**: customer payments, invoice payments, online orders, catering deposits and more.', '**Where it went**: expenses, supplier payments and money taken out.', '**Customers who owe you** and **Suppliers you owe**.'),
      p('Moving money between your own accounts is not counted as money received or paid out.'),
    ], { related: ['finance/income', 'finance/expenses'] }),

    article('expenses', 'Recording expenses', 'Rent, transport, salaries, airtime: record them so profit is right.', [
      steps('Open **Expenses** and tap **Add expense**.', 'Enter **What was it for?**, the **Amount (₦)** and **Paid with**.', 'Set the **Date** (leave empty for today) and an optional note.', 'Save. "Expense added" appears.'),
      list('If you are offline, the expense is saved on your phone and sent when you are back online.', 'Some roles send expenses for approval; someone with permission can **Approve** or **Reject**.', 'Delete an expense you entered by mistake.'),
    ], { related: ['finance/overview'] }),

    article('cash-accounts', 'Managing cash accounts', 'See where your money is right now.', [
      p('Open **More, Cash and bank**. You see each account and the **Total money you hold**.'),
      steps('Tap **Add account** to add a cash or bank account. Enter its **Name**, **Type** and **Money in it today (₦)**.', 'Tap **Move money** to add money, take money out or move between accounts, with a note.'),
      p('Cash sales go to your cash account. Transfers and card payments go to your bank account.'),
    ], { related: ['finance/bank-accounts'] }),

    article('bank-accounts', 'Managing bank accounts', 'Add each bank account as an account in Cash and bank.', [
      p('Bank accounts work like cash accounts. Add one for each bank account you use, so transfer and card sales land in the right place. You can switch an account off when you stop using it.'),
      p('ShopScale tracks the figures you record. It does not connect to your bank, so record movements as they happen.'),
    ], { related: ['finance/cash-accounts'] }),

    article('income', 'Monitoring income', 'See what money came in and from where.', [
      list('**Money received** in the money overview, with the source of each part.', 'The dashboard\'s **Money received** and **How customers paid**.', 'Payments you record on a customer\'s balance count as money received when they are paid.'),
      steps('Open **More, Money overview**.', 'Choose the period at the top.', 'Read **Where it came from** to see income by source.'),
    ], { related: ['finance/overview'] }),

    article('debtors', 'Managing debtors (customers who owe you)', 'See who owes you and record what they pay.', [
      p('A customer owes you when a sale is part paid or pay later.'),
      list('Open **Customers** and use **Customers who owe you** to filter.', 'Open a customer to see the balance and record a payment.', 'The dashboard and money overview show the total owed.'),
      p('Nobody owing you shows "Nobody owes you money".'),
    ], { related: ['sales/payment-methods'] }),

    article('supplier-liabilities', 'Managing supplier liabilities', 'See what you owe suppliers.', [
      list('**Suppliers you owe** in the money overview.', 'Open each supplier for their balance and record a payment.', 'Unpaid parts of purchases add to what you owe.'),
      steps('Open **More, Suppliers and purchases** and a supplier.', 'Check "You owe this supplier".', 'Tap **Record a payment** when you pay.'),
    ], { related: ['purchasing/supplier-balances'] }),

    article('cashier-reconciliation', 'Cashier reconciliation', 'Check the till against what was recorded.', [
      steps('The cashier starts a shift with the opening cash and closes it with the cash counted.', 'ShopScale shows **Started with**, **Should hold** and **Counted**.', 'A manager with permission reviews the shift and marks it **Reviewed**.'),
      warn('A difference between what the till should hold and what was counted is your signal to check sales and cash movements.'),
    ], { related: ['employees/cashiers'] }),

    article('financial-reports', 'Understanding financial reports', 'Money overview, sales reports and the dashboard.', [
      list('**Money overview**: cash in, cash out and balances.', '**Sales reports**: by employee, location, payment and channel.', '**Dashboard**: profit estimates, best sellers and stock value.', '**Export data**: CSV files for your accountant.'),
      p('Profit shown is an estimate: sales minus cost of goods and recorded expenses. Keep cost prices and expenses up to date.'),
    ], { related: ['sales/reports', 'finance/export-records'] }),

    article('export-records', 'Exporting your records', 'Download CSV files.', [
      steps('Open **More, Export data**.', 'Choose **Products and stock** or **Customers and what they owe**.', 'Open the downloaded CSV in Excel or Google Sheets.'),
      p('Export needs a plan that includes it and the export permission. Otherwise the page explains which is missing.'),
    ], { related: ['products/inventory-reports'] }),
  ],
}
