import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { api } from '../lib/api'
import { useLoad, ErrorBox, Skeleton } from '../components.jsx'
import { useSeo } from './Seo.jsx'
import { DashboardPreview, SellPreview } from './Previews.jsx'
import { PlanCards } from '../pages/Pricing.jsx'
import { ShoppingCart, Boxes, Users, Wallet, LayoutDashboard, UsersRound, Store, UtensilsCrossed, CalendarClock, ShieldCheck, Check } from 'lucide-react'

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || ''
const WHATSAPP = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/[^\d]/g, '')

function Soon() { return <span className="tag-soon">Coming soon</span> }

function Cta({ primary = 'Start your 14-day free trial', secondary = ['Explore ShopScale', '/features'] }) {
  return (
    <div className="mk-cta">
      <Link to="/register" className="btn primary">{primary}</Link>
      {secondary && <Link to={secondary[1]} className="btn">{secondary[0]}</Link>}
    </div>
  )
}

function FinalCta({ title = 'Start running your business from one place', text = 'Try everything free for 14 days. No card needed.' }) {
  return (
    <section className="mk-final"><div className="mk-wrap"><h2>{title}</h2><p>{text}</p>
      <div className="mk-cta" style={{ justifyContent: 'center' }}><Link to="/register" className="btn primary">Start your 14-day free trial</Link></div></div></section>
  )
}

const FAQ = [
  ['Do I need a card to start the free trial?', 'No. Your 14-day trial starts when you create your business and includes full Business plan access.'],
  ['What happens when the trial ends?', 'Your data stays safe. You can still sign in and look at everything, but you need a plan to record new sales and changes. Nothing is deleted.'],
  ['Will ShopScale charge me automatically?', 'Never without your clear permission.'],
  ['Does it work on a phone?', 'Yes. ShopScale is designed for phones first, including affordable Android phones, and also works on tablets and computers.'],
  ['Can my staff use it?', 'Yes. You can invite people and give each one a role, for example a cashier who can record sales but cannot see your profit. You can remove anyone’s access at any time.'],
  ['Can I sell online with ShopScale?', 'Yes. Paid plans include an online store with your products, cart and checkout. Customers can pay online with your own Paystack account, or pay when they pick up or receive their order.'],
  ['Is there support for restaurants and catering?', 'Restaurant and catering tools are planned for after launch and are not available yet. Shops, wholesalers and retail businesses can start today.'],
  ['Who can see my business data?', 'Only the people you add to your business, with the access you give them.'],
]

export function FaqList({ items = FAQ }) {
  return <div className="section">{items.map(([q, a]) => <details className="pad" key={q} style={{ borderBottom: '1px solid var(--line)' }}><summary style={{ cursor: 'pointer', fontWeight: 600 }}>{q}</summary><p className="muted" style={{ marginTop: 8 }}>{a}</p></details>)}</div>
}

export function HomePage() {
  useSeo({ title: 'ShopScale · Your entire business. One simple platform.', description: 'Record sales, control stock, track expenses and customers who owe you, and see your profit. ShopScale by AMSATI is built for Nigerian businesses. Start a 14-day free trial.', path: '/' })
  const plans = useLoad(() => api.public.get('/subscriptions/plans'), [])
  const benefits = [
    [ShoppingCart, 'Record sales in seconds', 'Tap a product, check the total, confirm. Stock and payments update by themselves.'],
    [Boxes, 'Know what is in stock', 'See what is running low before it runs out. Sizes and colours are built in.'],
    [Users, 'Know who owes you', 'Record part payments and credit sales, and collect repayments without a notebook.'],
    [Wallet, 'See your real profit', 'Add expenses and see estimated profit, not just sales.'],
    [LayoutDashboard, 'A dashboard that tells you things', 'Sales by day, best sellers, how customers paid and stock health.'],
    [UsersRound, 'Add your team safely', 'Give cashiers, stock keepers and accountants only the access they need.'],
  ]
  return (
    <>
      <section className="mk-hero"><div className="mk-wrap mk-hero-grid">
        <div>
          <span className="badge teal">Free for 14 days · No card needed</span>
          <h1 style={{ marginTop: 14 }}>Your entire business. One simple platform.</h1>
          <p className="lead">Manage sales, inventory, expenses, customers and orders without juggling notebooks, spreadsheets and disconnected apps. If you can use WhatsApp, you can use ShopScale.</p>
          <Cta />
        </div>
        <SellPreview />
      </div></section>

      <section className="mk-section"><div className="mk-wrap">
        <h2>Everything you need to run your shop day to day</h2>
        <p className="intro">Built for business owners who are not accountants or computer experts.</p>
        <div className="mk-grid c3">{benefits.map(([Icon, t, d], i) => (
          <div className="mk-card" key={t}><span className={`ico ${i % 2 ? 'teal' : ''}`}><Icon size={22} aria-hidden="true" /></span><h3>{t}</h3><p>{d}</p></div>))}</div>
      </div></section>

      <section className="mk-section alt"><div className="mk-wrap mk-hero-grid">
        <div><h2>See how your business is really doing</h2>
          <p className="intro">Your dashboard uses your own records: what you sold, what you spent, how customers paid, and which products are selling or sitting.</p>
          <ul className="prose" style={{ marginTop: 16, listStyle: 'none', padding: 0 }}>
            {['Sales today, this week and this month', 'Estimated profit with a clear explanation of how it is worked out', 'Best sellers and products that are not selling', 'Customers who owe you and stock running low'].map((t) => <li key={t} className="row"><Check size={18} color="var(--teal)" aria-hidden="true" /><span>{t}</span></li>)}
          </ul></div>
        <DashboardPreview />
      </div></section>

      <section className="mk-section"><div className="mk-wrap">
        <h2>Made for the way you work</h2>
        <div className="mk-grid c3">
          <Link to="/retail" className="mk-card"><span className="ico"><Store size={22} aria-hidden="true" /></span><h3>Shops and retail</h3><p>Fashion, cosmetics, electronics, groceries and general stores. Available now.</p></Link>
          <Link to="/restaurant" className="mk-card"><span className="ico teal"><UtensilsCrossed size={22} aria-hidden="true" /></span><h3>Restaurants and takeaways <Soon /></h3><p>Menu, kitchen orders, pickup and delivery. In development.</p></Link>
          <Link to="/catering" className="mk-card"><span className="ico"><CalendarClock size={22} aria-hidden="true" /></span><h3>Catering and small chops <Soon /></h3><p>Advance orders, deposits and balances. In development.</p></Link>
        </div>
      </div></section>

      <section className="mk-section alt"><div className="mk-wrap">
        <h2>Simple pricing</h2><p className="intro">Try everything free for 14 days, then choose the plan that fits.</p>
        <div style={{ marginTop: 24 }}>
          <ErrorBox error={plans.error} onRetry={plans.reload} />
          {plans.loading && <Skeleton height={260} />}
          {plans.data && <PlanCards plans={plans.data} annual={false} renderAction={() => <Link to="/register" className="btn primary block">Start free trial</Link>} />}
          <p style={{ marginTop: 16 }}><Link to="/pricing">Compare plans and see yearly prices</Link></p>
        </div>
      </div></section>

      <section className="mk-section"><div className="mk-wrap mk-grid c2" style={{ marginTop: 0 }}>
        <div><span className="ico" style={{ display: 'inline-grid', width: 40, height: 40, borderRadius: 10, background: 'var(--blue-light)', color: 'var(--blue-deep)', placeItems: 'center' }}><ShieldCheck size={22} aria-hidden="true" /></span>
          <h2 style={{ marginTop: 12 }}>Your records stay yours</h2></div>
        <ul className="prose">
          <li>Your data is never deleted if a trial or subscription ends. You can always sign in and look.</li>
          <li>Each business is kept separate. People only see what their role allows.</li>
          <li>Passwords are stored securely, and you can remove any staff member’s access instantly.</li>
          <li>We never charge you without your clear permission.</li>
        </ul>
      </div></section>

      <section className="mk-section alt"><div className="mk-wrap"><h2>Questions</h2><div style={{ marginTop: 20 }}><FaqList items={FAQ.slice(0, 5)} /></div>
        <p style={{ marginTop: 14 }}><Link to="/faq">More questions</Link></p></div></section>
      <FinalCta />
    </>
  )
}

export function FeaturesPage() {
  useSeo({ title: 'Features', description: 'Sales and POS, stock management, customer credit, expenses, profit, dashboard and team access, all in one simple app for your business.', path: '/features' })
  const available = [
    ['Sales and POS', 'Search or tap products, apply a discount, take cash, transfer or card, sell on credit, print a receipt, and refund a sale.'],
    ['Stock management', 'Products with sizes and colours, adding stock, damaged items, stock counts, a full history and running-low warnings.'],
    ['Buying from suppliers', 'Receive stock, keep your costs up to date automatically and see what you owe each supplier.'],
    ['A dashboard that tells you what to do', 'Products about to run out, items that are not selling, customers who owe you for too long and weak margins, each with how it was worked out.'],
    ['Customers', 'Keep customer details, see what each one has bought, record part payments and see who owes you.'],
    ['Expenses and profit', 'Record costs by type and see estimated profit with a plain explanation.'],
    ['Dashboard and reports', 'Sales by day, best sellers, payment methods, sales by category, stock health and an activity feed.'],
    ['Online store and orders', 'A store link for your customers, a cart and checkout, and a screen to confirm, prepare and complete each order. Not on the Free plan.'],
    ['Online payments with Paystack', 'Customers pay online and the money goes straight to your own Paystack account.'],
    ['Wholesale pricing', 'Price tiers, bulk price breaks and agreed customer prices, applied automatically at the till.'],
    ['Works on a weak connection', 'Install ShopScale on your phone. Sales you make offline are saved on the device and sent when you are back online.'],
    ['Team and permissions', 'Invite staff, give them a role, create custom roles, and remove access instantly.'],
  ]
  const soon = [['Restaurant and kitchen tools', 'Menu, kitchen orders, pickup and delivery.'], ['Catering orders', 'Advance bookings, deposits and balances.']]
  return (
    <>
      <section className="mk-section"><div className="mk-wrap"><h1 style={{ fontSize: '2rem' }}>Everything in one simple app</h1>
        <p className="intro">What you can do in ShopScale today.</p>
        <div className="mk-grid c3">{available.map(([t, d]) => <div className="mk-card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div></div></section>
      <section className="mk-section alt"><div className="mk-wrap"><h2>On the way</h2><p className="intro">We are building these now. They are not available yet.</p>
        <div className="mk-grid c2">{soon.map(([t, d]) => <div className="mk-card" key={t}><h3>{t} <Soon /></h3><p>{d}</p></div>)}</div></div></section>
      <FinalCta />
    </>
  )
}

function IndustryPage({ seo, title, lead, points, soon, extra }) {
  useSeo(seo)
  return (
    <>
      <section className="mk-hero"><div className="mk-wrap"><h1 style={{ maxWidth: '20ch' }}>{title} {soon && <Soon />}</h1><p className="lead">{lead}</p>
        {soon ? <div className="mk-cta"><Link to="/contact" className="btn primary">Tell us what you need</Link><Link to="/retail" className="btn">See what is available for shops</Link></div> : <Cta />}</div></section>
      <section className="mk-section"><div className="mk-wrap"><h2>{soon ? 'What we are building' : 'What you can do today'}</h2>
        <div className="mk-grid c2">{points.map(([t, d]) => <div className="mk-card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>{extra}</div></section>
      <FinalCta />
    </>
  )
}

export function RetailPage() {
  return <IndustryPage seo={{ title: 'ShopScale for shops and retail', description: 'Control your stock and record sales fast. Sizes, colours, credit sales, expenses and profit for fashion, cosmetics, electronics and general stores.', path: '/retail' }}
    title="Control your stock. Know your sales." lead="For fashion, cosmetics, electronics, grocery and general stores. Record a sale in a few taps, see what is left on the shelf and know who still owes you."
    points={[['Fast sales', 'Search or tap a product, choose how the customer is paying and confirm. Print a receipt if they want one.'], ['Sizes and colours', 'One product, many options, each with its own price and stock count.'], ['Stock you can trust', 'Every sale, restock, damaged item and count is recorded in a history you can read.'], ['Credit and part payments', 'Sell on credit, take part payments and see who owes you.'], ['Real profit', 'Enter what products cost you and what you spend to see estimated profit.'], ['Staff access', 'Let a cashier sell without seeing your profit or changing prices.']]} />
}

export function RestaurantPage() {
  return <IndustryPage soon seo={{ title: 'ShopScale for restaurants and takeaways', description: 'Menu, kitchen orders, pickup and delivery for restaurants, cafes and takeaways. Coming soon to ShopScale.', path: '/restaurant' }}
    title="Restaurants and takeaways" lead="We are building tools for menus, kitchen orders, pickup and delivery. They are not available yet. Sales, customers, expenses and staff access already work for any business."
    points={[['Menu with options', 'Sizes, add-ons and extras that calculate the right price.'], ['Kitchen orders', 'A simple screen for the kitchen to see and update orders.'], ['Takeaway and delivery', 'Pickup, delivery addresses and delivery fees.'], ['Ingredient stock', 'Optional ingredient tracking that never makes you set up recipes first.']]} />
}

export function CateringPage() {
  return <IndustryPage soon seo={{ title: 'ShopScale for catering and small chops', description: 'Advance orders, event dates, deposits and balances for catering and small-chops businesses. Coming soon to ShopScale.', path: '/catering' }}
    title="Catering and small chops" lead="We are building advance orders for party platters and events: choose the date, take a deposit and see the balance. They are not available yet."
    points={[['Advance bookings', 'Accept an order today for an event days or weeks away.'], ['Deposits and balances', 'Record the deposit and always see what is left to pay.'], ['Pickup and delivery dates', 'Schedule when each order goes out.'], ['Upcoming orders', 'A calendar of what you need to prepare.']]} />
}

export function AboutPage() {
  useSeo({ title: 'About ShopScale', description: 'ShopScale is a business operations app by AMSATI, built to help Nigerian businesses run from one simple platform.', path: '/about' })
  return (
    <section className="mk-section"><div className="mk-wrap prose">
      <h1 style={{ fontSize: '2rem' }}>About ShopScale</h1>
      <p>ShopScale is a product of AMSATI. We are building it so that a business owner who uses notebooks, calculators and WhatsApp today can run sales, stock, customers and expenses from one simple app on their phone.</p>
      <p>We design for affordable Android phones and patchy networks, and we use plain words instead of accounting jargon.</p>
      <p>ShopScale is a new product and we are building it in the open. This website only lists what already works and clearly marks what is coming.</p>
      <Cta />
    </div></section>
  )
}

export function ContactPage() {
  useSeo({ title: 'Contact', description: 'Get in touch with the ShopScale team at AMSATI.', path: '/contact' })
  return (
    <section className="mk-section"><div className="mk-wrap prose">
      <h1 style={{ fontSize: '2rem' }}>Contact us</h1>
      <p>Questions about ShopScale, pricing, or what is coming next? We would like to hear from you.</p>
      <div className="row wrap">
        {SUPPORT_EMAIL && <a className="btn primary" href={`mailto:${SUPPORT_EMAIL}`}>Email {SUPPORT_EMAIL}</a>}
        {WHATSAPP && <a className="btn" href={`https://wa.me/${WHATSAPP}`} rel="noopener noreferrer">Message us on WhatsApp</a>}
      </div>
      {!SUPPORT_EMAIL && !WHATSAPP && <div className="banner">Our contact details are being set up. Please check back shortly.</div>}
    </div></section>
  )
}

export function FaqPage() {
  useSeo({ title: 'Frequently asked questions', description: 'Answers about the ShopScale free trial, pricing, staff access, data safety and what is available today.', path: '/faq' })
  return <section className="mk-section"><div className="mk-wrap"><h1 style={{ fontSize: '2rem', marginBottom: 20 }}>Frequently asked questions</h1><FaqList /></div></section>
}

const UPDATED = '4 November 2026'

function Legal({ seo, title, children }) {
  useSeo(seo)
  return <section className="mk-section"><div className="mk-wrap prose"><h1 style={{ fontSize: '2rem' }}>{title}</h1><p className="muted small">Last updated {UPDATED}</p>{children}</div></section>
}

export function PrivacyPage() {
  return (
    <Legal seo={{ title: 'Privacy Policy', description: 'How ShopScale collects, uses and protects your information.', path: '/privacy' }} title="Privacy Policy">
      <p>This policy explains what information ShopScale, a product of AMSATI, collects and how we use it. We aim to follow the Nigeria Data Protection Act 2023.</p>
      <h2>What we collect</h2>
      <ul><li>Account details: your name, email, phone number and password (stored in a protected, one-way form).</li><li>Business records you enter: products, stock, sales, customers, expenses and staff.</li><li>Technical information needed to run the service, such as sign-in times.</li></ul>
      <h2>Analytics</h2>
      <p>If you allow it, we use Google Analytics on ShopScale’s own pages to count visits and see which features are used. We ask before loading it, you can turn it off any time in Help, and we never send customer details, sales amounts, emails or phone numbers. Public online stores run by merchants are not tracked by ShopScale.</p>
      <h2>How we use it</h2>
      <p>We use your information to provide ShopScale, keep it secure, and contact you about your account. We do not sell your data.</p>
      <h2>Who can see it</h2>
      <p>Only people you add to your business, with the access you give them, and AMSATI staff where needed to keep the service running or help you, under controlled and recorded access.</p>
      <h2>Your customers’ information</h2>
      <p>You decide what customer details to record. You are responsible for having a good reason to hold them. We store them on your behalf.</p>
      <h2>Keeping and deleting data</h2>
      <p>If a trial or subscription ends we keep your data so you can still view it. You can ask us to delete your account and records by contacting us.</p>
      <h2>Your rights</h2>
      <p>You may ask to see, correct or delete your personal information. Contact us using the details on our Contact page.</p>
    </Legal>
  )
}

export function TermsPage() {
  return (
    <Legal seo={{ title: 'Terms of Service', description: 'The terms for using ShopScale.', path: '/terms' }} title="Terms of Service">
      <p>By creating an account you agree to these terms with AMSATI, the provider of ShopScale.</p>
      <h2>Your account</h2><p>Keep your password safe. You are responsible for activity under your account and for the people you add to your business.</p>
      <h2>Free trial and plans</h2><p>New businesses get a 14-day free trial. After that you need a paid plan to record new activity. We will not charge you without your clear permission. Plan prices and limits are shown on our Pricing page and may change with notice.</p>
      <h2>Your data</h2><p>Your business records belong to you. If your trial or subscription ends we keep your data and you can still view it.</p>
      <h2>Estimates</h2><p>Figures such as estimated profit are calculated from the information you enter. They are estimates and are not accounting, tax or legal advice.</p>
      <h2>Acceptable use</h2><p>Do not use ShopScale to break the law, to harm others, or to try to access other businesses’ data.</p>
      <h2>Service availability</h2><p>We work to keep ShopScale available but cannot promise it will always be uninterrupted or free of errors.</p>
      <h2>Changes</h2><p>We may update these terms. If we make an important change we will tell you.</p>
      <h2>Contact</h2><p>Questions about these terms? See our Contact page.</p>
    </Legal>
  )
}

export function RefundPage() {
  return (
    <Legal seo={{ title: 'Refund Policy', description: 'How refunds and cancellations work for ShopScale subscriptions.', path: '/refunds' }} title="Refund Policy">
      <h2>Free trial</h2><p>You can try ShopScale free for 14 days with no payment details. Nothing is charged during the trial.</p>
      <h2>Cancelling</h2><p>You can cancel at any time. Your paid access continues until the end of the period you have paid for, and your data is kept.</p>
      <h2>Refund requests</h2><p>If you were charged by mistake or have a problem with a payment, contact us and we will look into it and reply to you. Refunds are considered case by case.</p>
      <h2>Payments you receive from your customers</h2><p>Money your customers pay you is between you and them. ShopScale subscription fees are separate from your sales.</p>
    </Legal>
  )
}

export function NotFoundPage() {
  useSeo({ title: 'Page not found', description: 'This page does not exist.', path: '/404', noindex: true })
  return <div className="err-page"><div className="stack" style={{ justifyItems: 'center' }}><h1 style={{ fontSize: '3rem' }}>404</h1><p className="muted">We could not find that page.</p><div className="row"><Link to="/" className="btn primary">Go to the home page</Link><Link to="/contact" className="btn">Contact us</Link></div></div></div>
}
