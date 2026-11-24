import { AreaChart, Donut, HBars } from '../charts.jsx'
import { Kpi } from '../pages/homeParts.jsx'
import { money } from '../lib/format.js'
import { TEMPLATES, reminderText } from '../lib/reminders.js'
import { STATUS_BADGE, STATUS_LABEL } from '../lib/invoiceShare.js'
import { Frame, Phone } from './ui.jsx'

/**
 * Product visuals for the public website. They are built from the application's own components (Kpi, AreaChart, Donut, HBars) and its own
 * CSS classes, and they show the same screens, labels and statuses the app has. Every figure is invented demonstration data for a
 * fictional shop and each frame says "Sample data". Nothing here calls the server and no customer data is shown.
 */

const TREND = [182, 205, 168, 240, 262, 231, 198, 275, 301, 288, 262, 334, 356, 391].map((v, i) => ({
  label: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'][i], title: `Day ${i + 1}`, value: v * 1000,
  previous: [150, 171, 160, 190, 205, 199, 176, 214, 240, 236, 228, 251, 262, 270][i] * 1000,
}))
const Row = ({ title, meta, right, badge, tone = '' }) => (
  <div className="list-item"><div className="grow"><div className="title">{title}</div>{meta && <div className="meta">{meta}</div>}</div>
    {right && <div className="num title">{right}</div>}{badge && <span className={`badge ${tone}`}>{badge}</span>}</div>
)

export function DashboardFrame() {
  return (
    <Frame title="Demo Stores · Dashboard">
      <div className="kpis four">
        <Kpi label="Total sales" value={money(1248500)} hint="38 sales" delta={{ dir: 'up', text: '12%' }} />
        <Kpi label="Money received" value={money(1052000)} tone="teal" />
        <Kpi label="Business expenses" value={money(214300)} tone="warn" />
        <Kpi label="Customers owing you" value={money(196500)} hint="7 customers · today" />
      </div>
      <div className="mkx-cols two">
        <section className="dash-card pad"><h3 style={{ margin: '0 0 6px', fontSize: '.9375rem' }}>Sales over time</h3>
          <AreaChart points={TREND} height={200} ariaLabel="Sample sales over 14 days" /></section>
        <section className="dash-card pad"><h3 style={{ margin: '0 0 10px', fontSize: '.9375rem' }}>Best-selling products</h3>
          <HBars items={[{ label: 'Ankara fabric', value: 312000 }, { label: 'Bag of rice (50kg)', value: 268000 }, { label: 'Phone charger', value: 141500 }, { label: 'Cooking oil (5L)', value: 96000 }]} /></section>
      </div>
      <div className="mkx-cols eq">
        <section className="dash-card pad"><h3 style={{ margin: '0 0 6px', fontSize: '.9375rem' }}>How customers paid</h3>
          <Donut ariaLabel="Sample payment methods" centerLabel="Received" centerValue="₦1.05M" segments={[{ label: 'Cash', value: 520000 }, { label: 'Transfer', value: 380000 }, { label: 'Card', value: 152000 }]} /></section>
        <section className="section list">
          <Row title="Sale #1042" meta="Ngozi · Paid in full" right={money(18500)} />
          <Row title="Sale #1041" meta="Tunde · Part payment" right={money(64000)} badge="Owes ₦24,000" tone="warn" />
          <Row title="Sale #1040" meta="Walk-in customer" right={money(7500)} />
        </section>
      </div>
    </Frame>
  )
}

export function SellFrame() {
  return (
    <Frame title="Sell">
      <div className="mkx-chip-row"><span className="chip on">All products</span><span className="chip">Fabric</span><span className="chip">Provisions</span></div>
      <div className="section list">
        <Row title="Ankara fabric (6 yards)" meta="2 × ₦26,000" right={money(52000)} />
        <Row title="Phone charger (fast)" meta="1 × ₦4,500" right={money(4500)} />
        <Row title="Cooking oil (5L)" meta="2 × ₦9,600" right={money(19200)} />
      </div>
      <div className="mkx-chip-row"><span className="chip on">Paid in full</span><span className="chip">Part payment</span><span className="chip">Pay later</span></div>
      <div className="total-bar"><div><div className="small" style={{ opacity: 0.85 }}>Total</div><div className="amt num">{money(75700)}</div></div><span className="btn" style={{ background: '#fff', color: 'var(--blue-deep)' }}>Confirm sale</span></div>
    </Frame>
  )
}

export function StockFrame() {
  return (
    <Frame title="Products">
      <div className="mkx-chip-row"><span className="chip on">All</span><span className="chip">Low stock</span><span className="chip">Out of stock</span></div>
      <div className="section list">
        <Row title="Bag of rice (50kg)" meta="Provisions" right="48 in stock" />
        <Row title="Phone charger (fast)" meta="Electronics" right="3 left" badge="Low stock" tone="warn" />
        <Row title="Ankara fabric (6 yards)" meta="Fabric · 4 colours" right="21 in stock" />
        <Row title="Cooking oil (5L)" meta="Provisions" right="0 left" badge="Out of stock" tone="danger" />
      </div>
      <p className="mkx-mini" style={{ margin: 0 }}>Every sale reduces stock. Every stock change is recorded in the stock history.</p>
    </Frame>
  )
}

export function CustomersFrame() {
  return (
    <Frame title="Customers owing you">
      <div className="kpis"><Kpi label="Customers owing you" value={money(196500)} hint="7 customers · today" tone="warn" /><Kpi label="Paid back this month" value={money(88000)} tone="teal" /></div>
      <div className="section list">
        <Row title="Tunde Adeyemi" meta="0801 234 5678" badge="Owes ₦24,000" tone="warn" />
        <Row title="Mama Chidi Stores" meta="0803 987 6543" badge="Owes ₦112,500" tone="warn" />
        <Row title="Ibrahim Yusuf" meta="0806 111 2233" right="Settled" />
      </div>
    </Frame>
  )
}

export function InvoiceFrame() {
  const ctx = { customerName: 'Mama Chidi', businessName: 'Demo Stores', balance: 112500, invoiceNumber: 'INV-0042', dueDate: '2026-11-01' }
  return (
    <Frame title="Invoice INV-0042">
      <div className="mkx-cols">
        <section className="section pad" style={{ display: 'grid', gap: 8 }}>
          <div className="row between"><strong>INV-0042</strong><span className={`badge ${STATUS_BADGE.PARTIALLY_PAID}`}>{STATUS_LABEL.PARTIALLY_PAID}</span></div>
          <div className="mkx-mini">Mama Chidi Stores</div>
          <div className="row between"><span>Total</span><b className="num">{money(150000)}</b></div>
          <div className="row between"><span>Paid</span><span className="num">{money(37500)}</span></div>
          <div className="row between"><strong>Balance</strong><strong className="num">{money(112500)}</strong></div>
        </section>
        <section className="section pad" style={{ display: 'grid', gap: 10 }}>
          <strong style={{ fontSize: '.9375rem' }}>Remind customer</strong>
          <div className="mkx-chip-row">{TEMPLATES.map((t) => <span key={t.key} className={`chip ${t.key === 'OVERDUE' ? 'on' : ''}`}>{t.label}</span>)}</div>
          <div className="textarea" style={{ whiteSpace: 'pre-wrap', fontSize: '.8125rem', lineHeight: 1.45, minHeight: 0, cursor: 'default' }}>{reminderText('OVERDUE', ctx)}</div>
          <span className="btn primary block" style={{ textAlign: 'center' }}>Open WhatsApp</span>
        </section>
      </div>
    </Frame>
  )
}

export function MoneyFrame() {
  return (
    <Frame title="Cash and bank, Expenses">
      <div className="kpis"><Kpi label="Cash" value={money(184200)} /><Kpi label="Bank" value={money(921000)} tone="teal" /></div>
      <div className="section list">
        <Row title="Shop rent" meta="Rent · Today" right={money(80000)} />
        <Row title="Transport" meta="Transport · Yesterday" right={money(12500)} />
        <Row title="Staff wages" meta="Wages · 3 days ago" right={money(60000)} />
      </div>
      <p className="mkx-mini" style={{ margin: 0 }}>Cash sales go to your cash account. Transfers and card payments go to your bank account.</p>
    </Frame>
  )
}

export function SuppliersFrame() {
  return (
    <Frame title="Suppliers">
      <div className="section list">
        <Row title="Lagos Wholesale Ltd" meta="0802 555 0101" badge="You owe ₦140,000" tone="warn" />
        <Row title="Kano Grains Supply" meta="0805 555 0199" right="Settled" />
        <Row title="Purchase #18 · Lagos Wholesale Ltd" meta="Stock received" right={money(320000)} badge="Owe ₦140,000" tone="warn" />
      </div>
    </Frame>
  )
}

export function StoreFrame() {
  return (
    <div className="mkx-cols eq" style={{ alignItems: 'start', gap: 28 }}>
      <Phone title="Your online store">
        <div className="section list">
          <Row title="Ankara fabric (6 yards)" meta="₦26,000" />
          <Row title="Bag of rice (50kg)" meta="₦56,000" />
          <Row title="Phone charger (fast)" meta="₦4,500" />
        </div>
        <span className="btn primary block" style={{ textAlign: 'center' }}>Checkout · pay with Paystack or on delivery</span>
      </Phone>
      <Frame title="Online orders">
        <div className="mkx-chip-row">{['All', 'New', 'Confirmed', 'Ready', 'Done'].map((t, i) => <span key={t} className={`chip ${i === 1 ? 'on' : ''}`}>{t}</span>)}</div>
        <div className="section list">
          <Row title="Order #208" meta="Ada · Delivery" right={money(60500)} badge="New" tone="warn" />
          <Row title="Order #207" meta="Chinedu · Pickup" right={money(26000)} badge="Confirmed" />
          <Row title="Order #206" meta="Bola · Delivery" right={money(18500)} badge="Completed" tone="ok" />
        </div>
      </Frame>
    </div>
  )
}

/** The eight questions the app really answers (Ask ShopScale), with a real-shaped answer. */
export const ASK_QUESTIONS = ['What were my sales?', 'Which products sold the most?', 'Which products brought in the most sales value?', 'How much money have I actually received?',
  'Which customers owe me money?', 'Which expenses were highest?', 'How do my sales compare with the period before?', 'How do customers pay me?']

export function AskFrame() {
  return (
    <Frame title="Ask ShopScale">
      <div className="mkx-chip-row" role="list">{ASK_QUESTIONS.slice(0, 5).map((q) => <span role="listitem" key={q} className={`chip ${q === 'Which customers owe me money?' ? 'on' : ''}`}>{q}</span>)}</div>
      <section className="dash-card">
        <p className="ask-headline">7 customers owe you ₦196,500 in total.</p>
        <div className="ask-figs"><div><b className="num">{money(196500)}</b><span>Total owed today</span></div><div><b className="num">7</b><span>Customers owing</span></div></div>
        <ol className="rank people">
          {[['Mama Chidi Stores', '3 invoices', 112500], ['Tunde Adeyemi', 'Credit sale', 24000], ['Bola Fashola', 'Credit sale', 18000]].map(([n, d, v], i) => (
            <li key={n}><span className="n">{i + 1}</span><div style={{ minWidth: 0 }}><span className="name">{n}</span><div className="meta">{d}</div></div><span className="amt">{money(v)}</span></li>))}
        </ol>
        <p className="note-line" style={{ marginTop: 8 }}>Answered from your own records. Nothing is estimated or guessed.</p>
      </section>
    </Frame>
  )
}

export function ActivityFrame() {
  return (
    <Frame title="Activity history">
      <div className="section list">
        <Row title="Ngozi recorded a sale" meta="Sale #1042 · 10:42" right={money(18500)} />
        <Row title="Musa adjusted stock" meta="Phone charger · 9 damaged removed · 09:15" />
        <Row title="You received a customer payment" meta="Tunde Adeyemi · Yesterday" right={money(30000)} />
        <Row title="Amaka exported sales to CSV" meta="Yesterday · 17:03" />
      </div>
      <p className="mkx-mini" style={{ margin: 0 }}>See who did what, and when, across your business.</p>
    </Frame>
  )
}

export function CustomerProfileFrame() {
  return (
    <Frame title="Mama Chidi Stores">
      <div className="kpis"><Kpi label="Bought in total" value={money(642000)} /><Kpi label="Owes you" value={money(112500)} tone="warn" /></div>
      <div className="section list">
        <Row title="Invoice INV-0042" meta="Due 1 Nov" right={money(150000)} badge="Partly paid" tone="warn" />
        <Row title="Sale #986" meta="Cash" right={money(48000)} />
        <Row title="Payment received" meta="Transfer · last week" right={money(37500)} badge="Paid" tone="ok" />
      </div>
    </Frame>
  )
}

export function ReportsFrame() {
  return (
    <Frame title="Best sellers">
      <div className="mkx-cols eq">
        <section className="dash-card pad"><h3 style={{ margin: '0 0 10px', fontSize: '.9375rem' }}>Best-selling products</h3>
          <HBars items={[{ label: 'Ankara fabric', value: 312000 }, { label: 'Bag of rice (50kg)', value: 268000 }, { label: 'Phone charger', value: 141500 }]} /></section>
        <section className="dash-card pad"><h3 style={{ margin: '0 0 10px', fontSize: '.9375rem' }}>Best-selling customers</h3>
          <HBars color="#0d9488" items={[{ label: 'Mama Chidi Stores', value: 642000 }, { label: 'Tunde Adeyemi', value: 311000 }, { label: 'Bola Fashola', value: 187000 }]} /></section>
      </div>
    </Frame>
  )
}
