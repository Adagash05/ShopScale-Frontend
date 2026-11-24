import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { ArrowRight, Check, Globe, Layers, Store, Truck, UtensilsCrossed, CalendarClock } from 'lucide-react'
import { useSeo } from './Seo.jsx'
import { CtaBand, Faq, Section, SectionHead, Showcase, StartButton } from './ui.jsx'
import { ActivityFrame, AskFrame, CustomerProfileFrame, CustomersFrame, DashboardFrame, InvoiceFrame, MoneyFrame, ReportsFrame, SellFrame, StockFrame, StoreFrame, SuppliersFrame } from './Showcase.jsx'
import { FAQ_ITEMS, INDUSTRIES } from './content.js'
import { V1_SCOPE } from '../config/scope.js'

function PageHero({ title, lead, children }) {
  return (
    <section className="mkx-page-hero"><div className="mkx-wrap">
      <h1>{title}</h1><p className="mkx-lead">{lead}</p>
      <div className="mkx-cta-row"><StartButton>Start free</StartButton><Link to="/pricing" className="mkx-btn">View pricing</Link></div>
      <p className="mkx-fine">No card required. Free plan, or a 14-day trial of paid features.</p>
      {children}
    </div></section>
  )
}

const Problem = ({ children }) => <p className="mkx-problem"><b>The problem it solves: </b>{children}</p>

const FEATURES = [
  { id: 'sales', title: 'Manage sales', body: 'Record a sale in a few taps from a phone, tablet or computer. Choose how the customer is paying, apply a discount, print a receipt and refund a sale if you need to.', problem: 'Sales written in notebooks get lost, miscounted or forgotten.', points: ['Cash, transfer or card, paid in full, part payment or pay later', 'Printable receipts, refunds and a searchable sales history', 'Works on a weak connection and sends sales when you are back online'], visual: <SellFrame />, plan: null },
  { id: 'inventory', title: 'Control inventory', body: 'Every sale reduces stock automatically. Add stock, record damaged items, count your shelves and see a full history for every product.', problem: 'You find out something is finished only when a customer asks for it.', points: ['Products with sizes and colours, each with its own stock', 'Low-stock and out-of-stock warnings', 'A stock history you can read, product by product'], visual: <StockFrame />, flip: true },
  { id: 'customers', title: 'Manage customers', body: 'Keep your customers’ details and see everything each one has bought, what they have paid and what they still owe.', problem: 'Customer details and history live in your head or in a chat.', points: ['A record for every customer with their purchase history', 'Know your best customers', 'Part payments and repayments recorded against the customer'], visual: <CustomerProfileFrame /> },
  { id: 'debts', title: 'Track customer debts', body: 'Sell on credit with confidence. See who owes you, how much, and collect repayments as they arrive. Remind customers on WhatsApp when payment is due.', problem: 'Customers who owe money get forgotten, and the money never comes in.', points: ['Total owed today and who owes it', 'Part payments, repayments and history', 'WhatsApp payment reminders on Essential and above'], visual: <CustomersFrame />, flip: true },
  { id: 'invoices', title: 'Create invoices', body: 'Create an invoice for a customer, share it, and keep track of whether it is sent, partly paid, paid or overdue.', problem: 'Chasing payment without a proper invoice makes it hard to be paid.', points: ['Draft, sent, partly paid, paid and overdue statuses', 'Reminder messages for friendly, due and overdue payments', 'Essential: 20 reminders per billing month · Growth: 50 · Business: unlimited'], visual: <InvoiceFrame />, plan: 'Invoice reminders · Essential and above' },
  { id: 'money', title: 'Manage expenses and money', body: 'Record what you spend, keep cash and bank accounts, and see estimated profit after expenses with a plain explanation of how it is worked out.', problem: 'You cannot tell whether you made a profit, or where the money went.', points: ['Expenses by type', 'Cash and bank accounts (Essential and above)', 'Estimated profit with the working shown'], visual: <MoneyFrame />, flip: true },
  { id: 'suppliers', title: 'Manage suppliers', body: 'Keep supplier records, record the stock you receive and see how much you still owe each supplier.', problem: 'You lose track of what you owe suppliers and what you paid for stock.', points: ['Supplier records and balances (Essential and above)', 'Stock you receive goes straight into inventory', 'A purchase history for every supplier'], visual: <SuppliersFrame /> },
  { id: 'online', title: 'Sell online', body: 'Open an online store, take orders and manage each one from new to completed. Customers pay with your own Paystack account, or when they pick up or receive their order.', problem: 'Online orders and shop sales are kept apart, so stock goes wrong.', points: ['An online storefront with cart and checkout', 'Order management for confirming, preparing and completing orders', 'The same products and stock as your shop'], visual: <StoreFrame />, plan: 'Storefront and orders · Growth and Business', flip: true },
  { id: 'performance', title: 'Understand business performance', body: 'A dashboard built from your own records: sales, money received, expenses, estimated profit, who owes you and what is selling.', problem: 'You work hard but cannot see how the business is really doing.', points: ['Sales trends, payment methods and stock health', 'Best-selling product and customer reports (Growth and Business)', 'Export your data as CSV (Growth and Business)'], visual: <DashboardFrame /> },
  { id: 'ask', title: 'Ask ShopScale questions', body: 'Pick a question and a period and get an answer worked out from your own records. It answers a fixed set of business questions, so every answer comes from your data and nothing is guessed.', problem: 'Finding one answer means searching through pages of records.', points: ['Which products sold the most', 'Which customers owe you money', 'Which expenses were highest, how customers pay, and how sales compare with the period before'], visual: <AskFrame />, plan: 'Ask ShopScale · Growth and Business', flip: true },
]

export function FeaturesPage() {
  useSeo({ title: 'Features', description: 'Sales and POS, inventory, customers and credit, invoices and WhatsApp reminders, expenses, suppliers, online orders and Ask ShopScale in one platform.', path: '/features' })
  return (
    <>
      <PageHero title="Everything your business runs on, in one place." lead="Each part of ShopScale solves a problem you already have. Here is what it does and how it helps.">
        <nav className="mkx-jump" aria-label="Jump to a feature">{FEATURES.map((f) => <a key={f.id} href={`#${f.id}`}>{f.title}</a>)}</nav>
      </PageHero>
      <Section>
        {FEATURES.map((f) => (
          <Showcase key={f.id} id={f.id} flip={f.flip} eyebrow={f.plan ? undefined : f.title} plan={f.plan} title={f.title} body={f.body} points={f.points}
            visual={<div>{f.visual}<Problem>{f.problem}</Problem></div>} />
        ))}
      </Section>
      <Section tone="tint" tight><SectionHead center title="Also included" lead="Best-selling reports, activity history and CSV export are on the Growth and Business plans." />
        <div className="mkx-ask" style={{ gap: 28 }}><ReportsFrame /><ActivityFrame /></div></Section>
      <CtaBand />
    </>
  )
}

const ICONS = { retail: Store, wholesale: Truck, online: Globe, growing: Layers, restaurant: UtensilsCrossed, catering: CalendarClock }

function IndustryPage({ seo, title, lead, scenarios, points, visual, visualTitle }) {
  useSeo(seo)
  return (
    <>
      <PageHero title={title} lead={lead} />
      <Section labelledBy="sc-h">
        <SectionHead id="sc-h" eyebrow="Sound familiar?" title="Problems you will recognise" />
        <div className="mkx-pillars">{scenarios.map(([t, d]) => <div className="mkx-pillar" key={t}><Check size={22} aria-hidden="true" /><h3>{t}</h3><p>{d}</p></div>)}</div>
      </Section>
      <Section tone="tint" labelledBy="do-h">
        <SectionHead id="do-h" eyebrow="What you can do today" title={visualTitle || 'How ShopScale helps'} />
        <div className="mkx-show" style={{ paddingTop: 0 }}>
          <div className="mkx-show-copy"><ul className="mkx-ticks" style={{ marginTop: 0, gap: 16 }}>{points.map(([t, d]) => <li key={t}><Check size={18} aria-hidden="true" /><span><strong>{t}.</strong> {d}</span></li>)}</ul></div>
          <div>{visual}</div>
        </div>
      </Section>
      <CtaBand />
    </>
  )
}

export function RetailPage() {
  return <IndustryPage seo={{ title: 'ShopScale for shops and retail', description: 'Control your stock and record sales fast. Sizes, colours, credit sales, expenses and profit for fashion, cosmetics, electronics and general stores.', path: '/retail' }}
    title="Control your stock. Know your sales." lead="For fashion, cosmetics, electronics, grocery and general stores. Record a sale in a few taps, see what is left on the shelf and know who still owes you."
    scenarios={[['The shelf and the book disagree', 'You are never sure how many of an item you really have.'], ['Credit sales are hard to follow', 'Customers take goods on credit and the notebook gets messy.'], ['You do not know your real profit', 'Sales look good, but expenses and costs are not counted.']]}
    points={[['Fast sales', 'Search or tap a product, choose how the customer is paying and confirm. Print a receipt if they want one'], ['Sizes and colours', 'One product, many options, each with its own price and stock count'], ['Stock you can trust', 'Every sale, restock, damaged item and count is recorded in a history you can read'], ['Credit and part payments', 'Sell on credit, take part payments and see who owes you'], ['Real profit', 'Enter what products cost you and what you spend to see estimated profit'], ['Staff access', 'Let a cashier sell without seeing your profit or changing prices']]}
    visual={<SellFrame />} />
}

export function WholesalePage() {
  return <IndustryPage seo={{ title: 'ShopScale for trading and wholesale', description: 'Track stock you buy from suppliers, what customers owe you and what you owe, with invoices and WhatsApp payment reminders.', path: '/wholesale' }}
    title="Buy, sell and get paid, with every balance in view." lead="For traders, distributors and wholesalers who buy stock from suppliers and sell to shops and other businesses, often on credit."
    scenarios={[['Large credit balances', 'Several customers owe you at once and you cannot see who or how much.'], ['Supplier payments pile up', 'You are not sure what you owe each supplier.'], ['Stock arrives and leaves quickly', 'The count in your head is different from the count in the store.']]}
    points={[['Record stock you receive', 'Purchases from suppliers go straight into inventory'], ['Supplier balances', 'See what you still owe each supplier (Essential and above)'], ['Customer credit', 'Part payments, repayments and the total owed today'], ['Invoices and reminders', 'Create invoices and send WhatsApp reminders (Essential and above)'], ['Cash and bank', 'Know where your money is (Essential and above)']]}
    visual={<SuppliersFrame />} visualTitle="Keep both sides of the balance in view" />
}

export function OnlineSellingPage() {
  return <IndustryPage seo={{ title: 'ShopScale for online selling', description: 'Open an online store, take orders and manage them next to your shop sales with shared stock. Growth and Business plans.', path: '/online-selling' }}
    title="Take your business beyond the physical shop." lead="Open an online store, receive orders and manage them next to your shop sales, using one set of products and one stock count."
    scenarios={[['Orders arrive in chats', 'Orders come through messages and are easy to miss or mix up.'], ['Stock is counted twice', 'Online and shop sales are not connected, so stock goes wrong.'], ['Payments are hard to confirm', 'You are not sure which orders have actually been paid.']]}
    points={[['Online storefront', 'A store link and checkout for your customers (Growth and Business)'], ['Order management', 'Confirm, prepare and complete every order (Growth and Business)'], ['Your own Paystack', 'Online payments go to your own Paystack account; an order is paid only once Paystack confirms'], ['Pay on delivery or pickup', 'Customers can choose to pay when they receive the order'], ['Shared stock', 'Stock reduces when the sale is recorded, in step with your shop']]}
    visual={<StoreFrame />} visualTitle="Your shop and your store, together" />
}

export function RestaurantPage() {
  return <IndustryPage seo={{ title: 'ShopScale for restaurants and takeaways', description: 'Menu, kitchen orders, pickup and delivery for restaurants, cafes and takeaways. Available in ShopScale.', path: '/restaurant' }}
    title="Restaurants and takeaways" lead="Run your menu, tables and kitchen from one app. Orders reach the kitchen screen, ingredients come off stock, and bakeries can record what they baked."
    scenarios={[['Orders get lost between counter and kitchen', 'Paper slips are missed or misread.'], ['Ingredients disappear', 'You cannot tell what was wasted and what was sold.']]}
    points={[['Menu with options', 'Sizes, paid add-ons and extras that calculate the right price, plus a sold-out switch'], ['Tables and kitchen screen', 'Dine-in, takeaway and other orders appear for the kitchen with items, notes and waiting time'], ['Recipes and wastage', 'Optional recipes take ingredients off stock. Record spoilage and waste with a reason'], ['Bakery production', 'Record what you baked. Ingredients go down and finished stock goes up']]}
    visual={<StockFrame />} />
}

export function CateringPage() {
  return <IndustryPage seo={{ title: 'ShopScale for catering and small chops', description: 'Advance orders, event dates, deposits and balances for catering and small-chops businesses. Available in ShopScale.', path: '/catering' }}
    title="Catering and small chops" lead="Take an enquiry, send a quotation, confirm with a deposit, prepare, and see what each event earned."
    scenarios={[['Deposits and balances are hard to track', 'You are not sure what each client still owes.'], ['Events clash', 'Two bookings land on the same date.']]}
    points={[['Packages and quotations', 'Price by guest count with services and discounts'], ['Deposits and balances', 'Part payments, a full payment history and what is still owed'], ['No double bookings', 'Warns you about another event on the same date']]}
    visual={<MoneyFrame />} />
}

export function IndustriesPage() {
  useSeo({ title: 'Who ShopScale is for', description: 'ShopScale helps shops, traders, wholesalers and online sellers run sales, stock, customers, suppliers and expenses from one platform.', path: '/industries' })
  const list = V1_SCOPE ? INDUSTRIES : [...INDUSTRIES.slice(0, 3), { key: 'restaurant', to: '/restaurant', title: 'Restaurants and bakeries', text: 'Menu, kitchen orders and production.', points: ['Menu and kitchen screen', 'Recipes and wastage', 'Bakery production'] }, { key: 'catering', to: '/catering', title: 'Catering and small chops', text: 'Quotations, deposits and events.', points: ['Quotations and deposits', 'Event dates', 'Profit per event'] }]
  return (
    <>
      <PageHero title="Built for businesses that buy and sell." lead="ShopScale fits different kinds of business. Pick yours to see the problems it solves and what you can do today." />
      <Section><div className="mkx-ind three">
        {list.map((i) => { const Icon = ICONS[i.key] || Layers; return (
          <Link key={i.key} to={i.to} className="mkx-ind-card"><span className="ico"><Icon size={22} aria-hidden="true" /></span><h3>{i.title}</h3><p>{i.text}</p>
            <ul>{i.points.map((p) => <li key={p}><Check size={16} aria-hidden="true" /><span>{p}</span></li>)}</ul><span className="more mkx-link">Learn more <ArrowRight size={16} aria-hidden="true" /></span></Link>) })}
      </div></Section>
      <CtaBand />
    </>
  )
}

export function FaqPage() {
  useSeo({ title: 'Frequently asked questions', description: 'Answers about the ShopScale free trial, pricing, users, online orders, Ask ShopScale, data export and WhatsApp reminders.', path: '/faq' })
  return (
    <>
      <section className="mkx-page-hero"><div className="mkx-wrap"><h1>Frequently asked questions</h1><p className="mkx-lead">Straight answers about the trial, billing, plans and how ShopScale works.</p></div></section>
      <Section><Faq items={FAQ_ITEMS} /></Section>
      <CtaBand />
    </>
  )
}
