/**
 * V1 wording for the Help Centre. While the V1 scope is on (src/config/scope.js), data.js applies these on top of the shared
 * content: three articles are rewritten for the focused trading product, and a few sentences that describe hidden modules are
 * reworded or dropped. The content files themselves are unchanged, so turning the scope off restores the original text.
 */
export const OVERRIDES = {
  'getting-started/what-is-shopscale': {
    desc: 'One app to record sales, control stock, track your money and sell online.',
    blocks: [
      { t: 'p', text: 'ShopScale helps you run your business, control your stock, keep track of your money and sell online. It replaces the notebook, calculator and WhatsApp chats you may use today with one place that keeps your records straight.' },
      { t: 'h', text: 'What you can do with it' },
      { t: 'list', items: [
        '**Record sales** in your shop or on the go and print a receipt.',
        '**Control your stock**: know what you have, receive new stock, and get a warning when something runs low.',
        '**Keep track of your money**: record expenses, see what came in and what went out.',
        '**Know who owes you**: record credit sales and the payments customers make later.',
        '**Know what you owe suppliers** and record what you pay them.',
        '**Sell online** with your own store link where customers order and pay with your Paystack account.',
        '**Add cashiers** who can record sales without seeing your profit.',
      ] },
      { t: 'h', text: 'Who it is for' },
      { t: 'p', text: 'Shops, wholesalers, distributors and other businesses that buy and sell products. See [Choosing your business type](/help/getting-started/business-type).' },
      { t: 'tip', text: 'You do not need to be an accountant. ShopScale uses plain words like "Money received" and "Customers owing you".' },
    ],
  },
  'getting-started/business-type': {
    desc: 'Pick Shop or Wholesale when you set up your business.',
    related: ['getting-started/business-setup', 'getting-started/first-steps'],
    blocks: [
      { t: 'p', text: 'The first set-up screen asks "what do you sell?". Both choices give you the same tools: sales, stock, money, customers, suppliers and the online store.' },
      { t: 'h', text: 'The options' },
      { t: 'list', items: [
        '**Shop or retail business**: fashion, cosmetics, electronics, groceries, provisions and general goods.',
        '**Wholesale or distribution**: you sell in bulk to shops and other businesses.',
      ] },
      { t: 'p', text: 'On the next screen you add your business name and an optional phone number. You can change your details later in **Settings**.' },
      { t: 'tip', text: 'Not sure? Choose Shop. You can change your business details at any time, and every tool works for both.' },
    ],
  },
  'getting-started/navigation': {
    desc: 'Eight sections in one menu. On a phone, the rest are under More.',
    related: ['getting-started/dashboard', 'employees/permissions'],
    blocks: [
      { t: 'p', text: 'ShopScale has the same menu on every screen size. On a computer all sections are listed down the left. On a phone the first four are along the bottom and the rest are under **More**.' },
      { t: 'shot', id: 'nav-sidebar' },
      { t: 'h', text: 'The sections' },
      { t: 'list', items: [
        '**Home**: today\'s sales, expenses, profit estimate, low stock and who owes whom, with quick actions.',
        '**Sales**: record a sale, and see your sales history.',
        '**Products & Stock**: your products, your stock, and receiving new stock.',
        '**Money**: your money overview, business expenses, and cash and bank.',
        '**Customers & Suppliers**: who you sell to and who you buy from, with balances.',
        '**Online Store**: your store settings and the orders that arrive.',
        '**Reports**: sales reports.',
        '**Settings**: business details, team, plan and billing, and help.',
      ] },
      { t: 'p', text: 'Inside a section, the tabs at the top move between its screens, for example Products, Stock and Receive stock.' },
      { t: 'tip', text: 'If a section or tab you expect is missing, either your plan does not include it ([Understanding subscriptions](/help/getting-started/subscriptions)) or your role does not allow it ([Roles and permissions](/help/employees/permissions)).' },
    ],
  },
}

/** [match, replacement] per article. A replacement of null drops the whole sentence or list item that contains the match. */
export const PATCHES = {
  'getting-started/subscriptions': [['more users, locations and tools', 'more users and tools'], [' A custom domain for your store needs the Business plan.', '']],
  'products/pricing': [['If your plan includes wholesale pricing, **More, Wholesale prices** lets you set tiers and bulk or customer-specific prices. Choose a customer\'s price tier on their profile.', null]],
  'storefront/customers': [['Catering stores show an enquiry form; mark each enquiry as contacted.', null]],
  'orders/preparing': [['Online orders for restaurant businesses are separate from dine-in orders on the kitchen screen. See [Receiving and managing orders](/help/restaurant/orders).', null]],
  'sales/make-a-sale': [['If your business has more than one location, check **Selling from**.', null]],
  'sales/receipts': [['Customers who want a bill instead can be sent an **Invoice**: open the sale and tap **Create invoice** if your role allows it.', null]],
  'sales/sales-history': [['**Create invoice**, ', '']],
  'sales/reports': [['**By location**: each shop or branch.', null]],
  'sales/customers': [[', for wholesale, a price tier', ''], ['**Quotations** (More): give a customer a price before they commit.', null], ['**Invoices** (More): bills for customers that you can share as a PDF or on WhatsApp.', null]],
  'purchasing/receive-stock': [['Choose the location under **Receiving into** if you have more than one.', null], [' and add the supplier invoice number if you have it', '']],
  'purchasing/received-stock': [['To send stock to another shop, use a [stock transfer](/help/branches/transfer-stock).', null]],
  'employees/cashiers': [['Cashier shifts', null], ['At the start of the day open **More, Cashier shifts** and tap **Start your shift**.', null], ['Enter **Working at** (the location) and the **Cash in the till at the start (₦)**.', null], ['At the end tap **Close your shift** and enter the **Cash counted (₦)**.', null], ['The shift compares what the till **Should hold** with what was **Counted**. A manager with permission marks it **Reviewed**. See [Cashier reconciliation](/help/finance/cashier-reconciliation).', null]],
  'finance/overview': [['customer payments, invoice payments, online orders, catering deposits and more', 'customer payments, online orders and more']],
  'finance/financial-reports': [['**Sales reports**: by employee, location, payment and channel.', '**Sales reports**: by employee, payment method and channel.']],
  'troubleshooting/stock-incorrect': [['Check you are looking at the right **location**.', null]],
}

const patchText = (t, rules) => {
  let out = t
  for (const [m, r] of rules) if (out.includes(m)) { if (r === null) return null; out = out.split(m).join(r) }
  return out
}

/** Applies the V1 overrides and patches to one article. */
export function applyV1(path, article) {
  const o = OVERRIDES[path]
  if (o) return { ...article, ...o }
  const rules = PATCHES[path]
  if (!rules) return article
  const blocks = article.blocks.map((b) => {
    if (b.items) {
      const items = b.items.map((x) => (typeof x === 'string' ? patchText(x, rules) : x)).filter((x) => x !== null)
      return { ...b, items }
    }
    if (typeof b.text === 'string') { const t = patchText(b.text, rules); return t === null ? null : { ...b, text: t } }
    return b
  }).filter(Boolean)
  return { ...article, blocks }
}
