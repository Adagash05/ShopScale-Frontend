import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export const ARTICLES = [
  { id: 'start', title: 'Getting started', body: [
    'Create your account, then tell ShopScale what you sell and choose your store address. That takes about two minutes.',
    'Add your first product: tap Products, then Add product. You only need a name, a price and how many you have.',
    'Record your first sale: tap Sell, tap the product, check the total and confirm. Stock updates by itself.' ] },
  { id: 'products', title: 'Products and stock', body: [
    'Sizes and colours: when adding a product, tick "This product comes in sizes, colours or other options". Each option has its own price and stock.',
    'When new stock arrives, open the product and tap Update stock, then Add stock. If you count the shelf and the number is different, choose Set count.',
    'Products running low show on Home and under More, then Stock. You choose the warning level under "Add more details".',
    'Archiving a product hides it from Sell but keeps your sales history. You can restore it any time.' ] },
  { id: 'sales', title: 'Recording sales', body: [
    'Paid in full: choose Cash, Transfer or Card. Only record a transfer after the money has reached your account.',
    'Part payment: enter what the customer paid now. The rest is recorded as owed, so you must choose the customer.',
    'Pay later: the whole amount is owed by the customer. You can see who owes you under Customers.',
    'If you tap Confirm twice by mistake, the sale is only recorded once.',
    'To undo a whole sale, open it under More, then Sales, and choose Refund sale. Stock goes back. Hand any money back yourself.' ] },
  { id: 'buying', title: 'Buying stock from suppliers', body: [
    'When new stock arrives, open More, then Suppliers and purchases, then Receive stock. Search the product, enter how many came and what each one cost you.',
    'ShopScale adds the stock for you and works out the average cost of each item, so your profit uses what the shelf really cost.',
    'If you did not pay in full, choose the supplier and ShopScale remembers what you owe them. Record each payment on the supplier page.',
    'Purchases are not counted as expenses. The cost shows up in your profit when you sell the items.' ] },
  { id: 'attention', title: 'What needs your attention', body: [
    'The top of your dashboard lists things worth acting on, such as products out of stock that still sell, products that will run out within a week, items you are not selling, customers who owe you for a long time, and weak profit margins.',
    'Each one says how we worked it out, using only your own records. Tap an item to go straight to it.' ] },
  { id: 'customers', title: 'Customers and what they owe', body: [
    'Add customers while selling or under Customers. Open a customer to see what they owe and their purchases.',
    'When they pay, tap Record a payment. You can record part of what they owe.' ] },
  { id: 'money', title: 'Expenses and profit', body: [
    'Record rent, transport, salaries and other costs under More, then Expenses.',
    'Estimated profit is sales minus what the products cost you, minus your expenses. It is only as accurate as the cost prices you enter.' ] },
  { id: 'team', title: 'Adding staff', body: [
    'Open More, then Team, then Add. Enter their name and email and choose a role. A cashier can record sales but cannot see profit or change anything else.',
    'If email is not set up yet, you will see a link to copy and send to them yourself. Each link works once and expires.',
    'To stop someone using the business, choose Remove access. It takes effect straight away and their past records stay.',
    'Need a different mix of access? Under Team, then Roles, create a role and choose exactly what it can do. You can only give access you have yourself.' ] },
  { id: 'plans', title: 'Your plan and free trial', body: [
    'Every new business gets 14 days free with full access. You are never charged without your permission.',
    'If a trial or subscription ends, you can still sign in and see everything, but you cannot record new activity until you renew. Your data is never deleted.' ] },
  { id: 'soon', title: 'Coming soon', body: [
    'Restaurant and catering tools, your online store, online payments with Paystack, and notifications are being built. They are not available yet.' ] },
]

export default function Help() {
  const [open, setOpen] = useState('start')
  return (
    <div className="stack">
      <div className="page-head"><div className="row"><Link to="/more" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link><div><h1>Help</h1><p className="sub">Short guides in plain language</p></div></div></div>
      <div className="section">
        {ARTICLES.map((a) => (
          <details key={a.id} open={open === a.id} onToggle={(e) => e.target.open && setOpen(a.id)} className="pad" style={{ borderBottom: '1px solid var(--line)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, minHeight: 32 }}>{a.title}</summary>
            <div className="stack-sm" style={{ marginTop: 10 }}>{a.body.map((t, i) => <p key={i} className="muted">{t}</p>)}</div>
          </details>
        ))}
      </div>
      <p className="muted small">Still stuck? <Link to="/contact">Contact us</Link>.</p>
    </div>
  )
}
