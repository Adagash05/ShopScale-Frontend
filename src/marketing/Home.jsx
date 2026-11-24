import { Link as RouterLink } from 'react-router-dom'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { ArrowRight, Boxes, Check, Globe, LineChart, MessageSquareText, Receipt, ShieldCheck, ShoppingCart, Sparkles, Store, Truck, Users, UsersRound, Wallet, X, Layers, Banknote, History } from 'lucide-react'
import { api } from '../lib/api'
import { useLoad, ErrorBox, Skeleton } from '../components.jsx'
import { PlanCards } from '../pages/Pricing.jsx'
import { useSeo } from './Seo.jsx'
import { CtaBand, Faq, Section, SectionHead, Showcase, StartButton, Ticks } from './ui.jsx'
import { ActivityFrame, AskFrame, ASK_QUESTIONS, CustomersFrame, DashboardFrame, InvoiceFrame, MoneyFrame, SellFrame, StockFrame, StoreFrame, SuppliersFrame } from './Showcase.jsx'
import { FAQ_ITEMS, INDUSTRIES, PROBLEMS } from './content.js'
import { V1_SCOPE } from '../config/scope.js'

const STRIP = [
  [ShoppingCart, 'Sales and inventory', 'Record every sale and know your stock'],
  [Users, 'Customers and suppliers', 'Who owes you and who you owe'],
  [Wallet, 'Financial visibility', 'Money received, expenses and profit'],
  [Globe, 'Online selling', 'A store and orders on Growth and Business'],
  [LineChart, 'Business intelligence', 'Reports and Ask ShopScale on Growth and Business'],
]

const IND_ICON = { retail: Store, wholesale: Truck, online: Globe, growing: Layers }

export function HomePage() {
  useSeo({ title: 'ShopScale · Run your business. Control everything. Grow with confidence.', description: 'ShopScale brings sales, inventory, customers, expenses, invoices and online orders together in one simple platform for Nigerian businesses. Start free. No card required.', path: '/' })
  const plans = useLoad(() => api.public.get('/subscriptions/plans'), [])
  return (
    <>
      {/* A. Hero */}
      <section className="mkx-hero" aria-labelledby="hero-h">
        <div className="mkx-wrap">
          <div className="mkx-hero-copy">
            <h1 id="hero-h" className="mkx-rise">Run your business. Control everything. <em>Grow with confidence.</em></h1>
            <p className="mkx-lead mkx-rise d1">ShopScale brings your sales, inventory, customers, expenses, orders and business operations together in one simple platform, so you always know what is happening in your business.</p>
            <div className="mkx-cta-row mkx-rise d2"><StartButton>Start free</StartButton><Link to="/features" className="mkx-btn">Explore ShopScale</Link></div>
            <p className="mkx-fine mkx-rise d3">Start free. No card required. Upgrade only when your business needs more.</p>
          </div>
          <div className="mkx-hero-stage mkx-rise d3"><DashboardFrame /></div>
        </div>
      </section>

      {/* C. Trust and value strip: only what the product does */}
      <div className="mkx-strip"><div className="mkx-wrap"><div className="mkx-strip-grid">
        {STRIP.map(([Icon, t, d]) => <div className="mkx-strip-item" key={t}><Icon size={22} aria-hidden="true" /><div><b>{t}</b><span>{d}</span></div></div>)}
      </div></div></div>

      {/* D. Problem, before and after */}
      <Section labelledBy="problem-h">
        <SectionHead id="problem-h" wide eyebrow="The problem" title="Running a business shouldn’t mean managing a dozen different things separately." lead="Notebooks, spreadsheets, WhatsApp chats and memory work until the business grows. Then things go missing." />
        <div className="mkx-ba">
          <div className="mkx-ba-col before">
            <span className="mkx-ba-tag">Before ShopScale</span>
            <h3>Disconnected records, manual sums and guesswork</h3>
            <ul>{PROBLEMS.map(([p]) => <li key={p}><X size={18} aria-hidden="true" /><span>{p}</span></li>)}</ul>
          </div>
          <div className="mkx-ba-col after">
            <span className="mkx-ba-tag">With ShopScale</span>
            <h3>Connected operations, organised records, clearer decisions</h3>
            <ul>{PROBLEMS.map(([p, s]) => <li key={p}><Check size={18} aria-hidden="true" /><span>{s}</span></li>)}</ul>
          </div>
        </div>
      </Section>

      {/* E. Product showcase: nine real modules */}
      <Section tone="tint" labelledBy="product-h">
        <SectionHead id="product-h" center eyebrow="What you can do" title="Every part of your business, working together" lead="These are the screens you will actually use. The figures shown are sample data." />
        <Showcase id="sales" eyebrow="Sales and POS" title="Record a sale in seconds, on any phone" body="Search or tap a product, choose how the customer is paying and confirm. Stock and payments update by themselves, and you can print a receipt." points={['Paid in full, part payment or pay later', 'Cash, transfer or card', 'Printable receipts, refunds and sales history']} visual={<SellFrame />} />
        <Showcase id="inventory" flip eyebrow="Inventory and stock" title="Always know what is on your shelf" body="Every sale reduces stock. Add stock, record damaged items and counts, and see low-stock warnings before you run out." points={['A full stock history for every product', 'Products with sizes and colours', 'Low stock and out of stock at a glance']} visual={<StockFrame />} />
        <Showcase id="customers" eyebrow="Customers and credit" title="Stop forgetting who owes you" body="Sell on credit, record part payments and see exactly what each customer owes today. Collect repayments without a notebook." points={['See who owes you, and how much', 'Record part payments and repayments', 'Every customer’s purchase history']} visual={<CustomersFrame />} />
        <Showcase id="invoicing" flip plan="Invoicing and reminders · Essential and above" title="Get paid faster with invoices and WhatsApp reminders" body="Create an invoice, share it, and remind customers who have not paid. ShopScale prepares the message and you press send in WhatsApp." points={['Friendly, due and overdue reminder messages you can edit', 'Essential: 20 reminders per billing month · Growth: 50 · Business: unlimited', 'Remaining reminders shown in the app']} visual={<InvoiceFrame />} />
        <Showcase id="money" eyebrow="Expenses and money" title="See where your money goes and where it sits" body="Record expenses by type, keep cash and bank accounts, and see estimated profit after expenses with a plain explanation." points={['Cash and bank accounts (Essential and above)', 'Expenses by type', 'Estimated profit, with how it is worked out']} visual={<MoneyFrame />} />
        <Showcase id="suppliers" flip eyebrow="Suppliers and purchasing" title="Know what you owe your suppliers" body="Record the stock you receive, keep your costs up to date and see the balance you still owe each supplier." points={['Supplier records and balances (Essential and above)', 'Stock received goes straight into your inventory', 'Purchase history per supplier']} visual={<SuppliersFrame />} />
        <Showcase id="online" plan="Online orders and storefront · Growth and Business" title="Sell online from the same stock" body="Open an online store, take orders and move each one from new to completed. Your shop and your store share one set of products and stock." points={['A store link customers can order from', 'Pay with your own Paystack account or on delivery or pickup', 'Order management for confirming, preparing and completing']} visual={<StoreFrame />} />
        <Showcase id="ask" flip plan="Ask ShopScale · Growth and Business" title="Ask your business a question" body="Pick a question and a period and get an answer worked out from your own records. It is a fixed set of questions, not a chatbot, so every answer comes from your data." cta={['See how Ask ShopScale works', '/features#ask']} visual={<AskFrame />} />
        <Showcase id="activity" eyebrow="Business activity" title="See who did what, and when" body="Activity history records what your team does in the business, so nothing happens without a trace." plan="Activity history · Growth and Business" visual={<ActivityFrame />} />
      </Section>

      {/* F. Ask ShopScale: dedicated section */}
      <Section tone="ink" labelledBy="ask-h">
        <div className="mkx-ask">
          <div>
            <p className="mkx-eyebrow">Ask ShopScale</p>
            <h2 id="ask-h" className="mkx-h2">Your business records. Answers when you need them.</h2>
            <p className="mkx-lead">Ask ShopScale questions about your business and get answers based on your actual business records.</p>
            <div className="mkx-q-list">
              {['Which products sold the most?', 'Which expenses were highest?', 'Which customers owe me money?', 'What were my sales?'].map((q) => <div className="mkx-q" key={q}><Sparkles size={18} aria-hidden="true" /><span>{q}</span></div>)}
            </div>
            <p className="mkx-note">Choose today, this week, this month, last month or your own dates. Ask ShopScale answers {ASK_QUESTIONS.length} business questions from your own records and never guesses. It is available on the Growth and Business plans.</p>
            <div className="mkx-cta-row" style={{ marginTop: 26 }}><StartButton variant="white">Start free</StartButton><Link to="/pricing" className="mkx-btn ghost-light">See which plan includes it</Link></div>
          </div>
          <AskFrame />
        </div>
      </Section>

      {/* G. Industries */}
      <Section labelledBy="ind-h">
        <SectionHead id="ind-h" eyebrow="Who it is for" title="Built for businesses that buy and sell" lead="ShopScale supports shops, traders and online sellers today. Choose your kind of business to see how it fits." />
        <div className={`mkx-ind ${V1_SCOPE ? 'four' : 'three'}`}>
          {INDUSTRIES.map((i) => { const Icon = IND_ICON[i.key]; return (
            <RouterLink key={i.key} to={i.to} className="mkx-ind-card">
              <span className="ico"><Icon size={22} aria-hidden="true" /></span><h3>{i.title}</h3><p>{i.text}</p>
              <ul>{i.points.map((p) => <li key={p}><Check size={16} aria-hidden="true" /><span>{p}</span></li>)}</ul>
              <span className="more mkx-link">Learn more <ArrowRight size={16} aria-hidden="true" /></span>
            </RouterLink>) })}
        </div>
      </Section>

      {/* H. Online selling */}
      <Section tone="tint" labelledBy="online-h">
        <SectionHead id="online-h" eyebrow="Online selling" title="Take your business beyond the physical shop." lead="Open an online store, receive orders and manage them next to your shop sales. One set of products, one stock count." />
        <StoreFrame />
        <div className="mkx-pillars" style={{ marginTop: 40 }}>
          {[[Store, 'Online storefront', 'A store link and checkout for your customers.'], [Receipt, 'Online order management', 'Confirm, prepare and complete every order.'], [Boxes, 'Shared stock', 'Shop and online sales use the same stock numbers.'], [Banknote, 'Your own Paystack', 'Online payments go to your own Paystack account.'], [Wallet, 'Pay on delivery or pickup', 'Let customers choose when they pay.'], [ShieldCheck, 'Growth and Business plans', 'Online storefront and order management are on Growth and Business.']].map(([Icon, t, d]) => (
            <div className="mkx-pillar" key={t}><Icon size={24} aria-hidden="true" /><h3>{t}</h3><p>{d}</p></div>))}
        </div>
      </Section>

      {/* I. Why ShopScale */}
      <Section labelledBy="why-h">
        <SectionHead id="why-h" eyebrow="Why ShopScale" title="One platform instead of a pile of notes" lead="ShopScale replaces scattered notebooks, spreadsheets and disconnected apps with connected records you can trust." />
        <div className="mkx-pillars">
          {[[Layers, 'One platform', 'Sales, stock, customers, suppliers, expenses and online orders connected.'], [Boxes, 'Know your stock and sales', 'Every sale updates stock. Every stock change leaves a record.'], [Users, 'Organised relationships', 'Customer and supplier records with what they owe and what you owe.'], [Wallet, 'Understand your money', 'Money received, expenses, cash and bank, and estimated profit.'], [Globe, 'Online and offline together', 'Manage shop and online sales from the same products and stock.'], [LineChart, 'Decide with real records', 'Reports and answers come from your actual business data.']].map(([Icon, t, d]) => (
            <div className="mkx-pillar" key={t}><Icon size={24} aria-hidden="true" /><h3>{t}</h3><p>{d}</p></div>))}
        </div>
        <ul className="mkx-ticks" style={{ marginTop: 28 }}>
          <li><UsersRound size={18} aria-hidden="true" /><span>Give your team their own sign-in and only the access their role needs.</span></li>
          <li><History size={18} aria-hidden="true" /><span>Your data is kept if a trial or subscription ends. Nothing is deleted.</span></li>
        </ul>
      </Section>

      {/* J. Pricing preview, read from the live plans */}
      <Section tone="tint" labelledBy="pricing-h">
        <SectionHead id="pricing-h" center eyebrow="Pricing" title="Start free. Upgrade when you grow." lead="Choose the plan that fits your business today and change it as you grow. Growth is the best value for most growing businesses." />
        <div className="mkx-pricing">
          <ErrorBox error={plans.error} onRetry={plans.reload} />
          {plans.loading && <Skeleton height={380} />}
          {plans.data && <PlanCards plans={plans.data} annual={false} renderAction={(p) => <Link to="/register" className={`mkx-btn ${p.recommended ? 'primary' : ''}`} style={{ width: '100%' }}>{Number(p.monthlyPrice) === 0 ? 'Start free' : 'Start 14-day free trial'}</Link>} />}
        </div>
        <p style={{ textAlign: 'center', marginTop: 28 }}><Link className="mkx-link" to="/pricing">Compare all plans and see yearly prices <ArrowRight size={16} aria-hidden="true" /></Link></p>
        <p className="mkx-fine" style={{ textAlign: 'center' }}>Every new business gets a 14-day trial with full access to Business plan features. No card needed.</p>
      </Section>

      {/* K. FAQ */}
      <Section labelledBy="faq-h">
        <SectionHead id="faq-h" center eyebrow="Questions" title="Answers before you start" />
        <Faq items={FAQ_ITEMS} />
        <p style={{ textAlign: 'center', marginTop: 26 }}><MessageSquareText size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> Still unsure? <Link className="mkx-link" to="/contact">Talk to us</Link> or browse the <Link className="mkx-link" to="/help">Help Centre</Link>.</p>
      </Section>

      {/* L. Final conversion */}
      <CtaBand />
    </>
  )
}
