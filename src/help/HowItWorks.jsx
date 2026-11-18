import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useSeo } from '../marketing/Seo.jsx'
import Illustration from './Illustrations.jsx'
import { SupportCard } from './HelpCentre.jsx'
import DemoVideo from './DemoVideo.jsx'
import './help.css'

const Section = ({ id, title, sub, alt, children }) => (
  <section className={`hiw-sec ${alt ? 'alt' : ''}`} id={id} aria-labelledby={`${id}-h`}>
    <div className="mk-wrap">
      <h2 id={`${id}-h`}>{title}</h2>
      {sub && <p className="sub">{sub}</p>}
      {children}
    </div>
  </section>
)

const Cards = ({ items }) => (
  <div className="hiw-grid">
    {items.map((c) => (
      <div className="hiw-card" key={c.title}>
        <h3>{c.title}</h3>
        <p>{c.text}</p>
        {c.to && <Link to={c.to}>{c.link || 'Read the guide'} <ArrowRight size={14} aria-hidden="true" /></Link>}
      </div>
    ))}
  </div>
)

const Steps = ({ items }) => (
  <ol className="hiw-steps">
    {items.map((s) => (<li key={s.title}><strong>{s.title}</strong><span>{s.text}</span></li>))}
  </ol>
)

export const HIW_FAQ = [
  ['Do I need a website to sell online?', 'No. When you open your online store, ShopScale gives you a store link that you can share with customers. You can add a custom domain later if you want one.'],
  ['Does an online order mean I have been paid?', 'No. An order is created when the customer checks out. For card or transfer payments, the order stays in Pending payment until Paystack confirms the payment. Only then does it become a New order for you to prepare.'],
  ['When does my stock go down?', 'Stock is reduced when the sale is recorded, which for an online order happens when you complete it. Creating an order does not remove stock.'],
  ['Do I have to use Paystack?', 'No. Paystack is optional and only needed if you want customers to pay online. Without it, customers can choose to pay when they receive the order.'],
  ['Can I use ShopScale in a shop and online at the same time?', 'Yes. The same products and stock feed both your point of sale and your online store, so one number is shared.'],
  ['Can my staff use it too?', 'Yes. You can add team members and choose what each person is allowed to see and do. Your plan sets how many users you can have.'],
  ['Can I try it first?', 'Yes. Every new business starts with a 14-day free trial.'],
  ['Who do I contact if I get stuck?', 'Email support@shopscale.com.ng, or message ShopScale on WhatsApp. The Help Centre also has step-by-step guides for each task.'],
]

export default function HowItWorks() {
  useSeo({ title: 'How ShopScale works', description: 'See how a business sets up ShopScale, sells in the shop and online, receives and processes orders, manages staff and branches, and tracks money. Step by step, in plain language.', path: '/how-it-works' })
  return (
    <>
      <section className="hiw-hero" aria-labelledby="hiw-title">
        <div className="mk-wrap">
          <h1 id="hiw-title">How ShopScale works</h1>
          <p>From adding your first product to receiving an online order, here is how a business runs on ShopScale, one simple step at a time. No technical knowledge needed.</p>
          <div className="hiw-cta">
            <Link className="btn primary" to="/register">Start your 14-day free trial <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link className="btn" to="/help"><BookOpen size={16} aria-hidden="true" /> Explore the Help Centre</Link>
          </div>
        </div>
      </section>
      <div className="mk-wrap" style={{ paddingTop: 24 }}><DemoVideo /></div>

      <Section id="overview" title="How businesses use ShopScale" sub="ShopScale is one place to run your business day to day.">
        <Cards items={[
          { title: 'Keep your products and stock in order', text: 'List what you sell, set prices and track how much you have. Low-stock alerts tell you what to reorder.', to: '/help/products/understand-inventory' },
          { title: 'Sell in person', text: 'Use the sell screen as a point of sale: pick products, take payment, and record the sale.', to: '/help/sales/understand-pos' },
          { title: 'Sell online', text: 'Open your own online store. Customers browse, order and pay, and the orders arrive in ShopScale.', to: '/help/storefront/overview' },
          { title: 'Know where your money is', text: 'See sales, money received, expenses and what customers owe you in one place.', to: '/help/finance/overview' },
        ]} />
      </Section>

      <Section id="workflow" alt title="The operating workflow" sub="The path most businesses follow, from setup to a recorded sale.">
        <Illustration name="store-journey" />
        <p className="sub" style={{ marginTop: 12 }}>This is a diagram of the workflow, not a screenshot. Each step is explained below.</p>
      </Section>

      <Section id="getting-started" title="Getting started" sub="Set up takes a few minutes.">
        <Steps items={[
          { title: 'Create your account', text: 'Sign up with your email and start the 14-day free trial.' },
          { title: 'Choose your business type', text: 'Pick the type that fits you, such as a shop, restaurant, bakery or caterer. ShopScale shows the tools for that type.' },
          { title: 'Add your business details', text: 'Your business name and contact details appear on receipts and your store.' },
          { title: 'Add your first products and start selling', text: 'The first-steps guide takes you through the order that works best.' },
        ]} />
        <p><Link to="/help/getting-started/first-steps">Read: Your first steps in ShopScale</Link></p>
      </Section>

      <Section id="products" alt title="Products and inventory" sub="Everything you sell, and how much of it you have.">
        <Cards items={[
          { title: 'Create products', text: 'Add a name, price and starting stock. Add a photo so customers can recognise it online.', to: '/help/products/create-product' },
          { title: 'Keep stock correct', text: 'Stock goes down when sales are recorded. When you count and find a difference, record a stock adjustment.', to: '/help/products/stock-adjustments' },
          { title: 'Reorder in time', text: 'Set a low-stock level and ShopScale flags products that need restocking.', to: '/help/products/low-stock' },
        ]} />
      </Section>

      <Section id="pos" title="Selling in person with the point of sale" sub="For counters, market stalls and walk-in customers.">
        <Steps items={[
          { title: 'Open the sell screen', text: 'Find the product by name or pick it from the list.' },
          { title: 'Add to the sale', text: 'Set quantities and, where allowed, a discount.' },
          { title: 'Take payment', text: 'Choose how the customer is paying and complete the sale.' },
          { title: 'Receipt and records', text: 'The sale is saved, stock goes down and your reports update.' },
        ]} />
        <p><Link to="/help/sales/make-a-sale">Read: Make a sale</Link></p>
      </Section>

      <Section id="storefront" alt title="Creating and running an online storefront" sub="Your own store link, with your products, ready for customers.">
        <Steps items={[
          { title: 'Add products with prices and stock', text: 'Active products that you sell appear in your store. A product at zero stock shows as Sold out.' },
          { title: 'Open your store', text: 'Go to More, then Online store, and choose Open my store to customers.' },
          { title: 'Choose how customers pay', text: 'Connect Paystack for card and transfer payments, or let customers pay on handover.' },
          { title: 'Share your link', text: 'Send the store link to customers on WhatsApp, social media or print it.' },
        ]} />
        <p><Link to="/help/storefront/activate-store">Read: Open your online store</Link> · <Link to="/help/storefront/overview">How the online store works</Link></p>
      </Section>

      <Section id="customers" title="How customers discover and order" sub="What your customer experiences.">
        <Steps items={[
          { title: 'They open your store link', text: 'No account is needed to browse.' },
          { title: 'They add products to a cart', text: 'They see your prices and which items are sold out.' },
          { title: 'They check out', text: 'They give their details and choose how to pay.' },
          { title: 'They pay', text: 'Online payments are confirmed by Paystack. Pay-on-handover orders are settled when the customer receives the order.' },
        ]} />
        <p><Link to="/help/storefront/checkout">Read: What happens at checkout</Link></p>
      </Section>

      <Section id="receiving" alt title="How you receive and process online orders" sub="An order is not the same as a payment.">
        <Illustration name="order-lifecycle" />
        <p className="sub" style={{ marginTop: 12 }}>
          Do not prepare an order that is still <strong>Pending payment</strong>. It has been created but the payment is not confirmed. <Link to="/help/orders/process-orders">Read: Process an order from start to finish</Link>.
        </p>
      </Section>

      <Section id="payments" title="Payments and fulfilment" sub="Getting paid, then getting the order to the customer.">
        <Cards items={[
          { title: 'Confirming payment', text: 'Paystack payments are verified before the order moves forward. If a payment seems stuck, you can check it.', to: '/help/orders/verify-payments' },
          { title: 'Pickup and delivery', text: 'Mark the order Ready when it is packed, then complete it once the customer has it.', to: '/help/orders/fulfilment' },
          { title: 'Cancelled and unpaid orders', text: 'Orders that are never paid are cancelled automatically, and you can cancel an order before it is completed.', to: '/help/orders/cancelled' },
        ]} />
      </Section>

      <Section id="people" alt title="Employees and branches" sub="Run ShopScale with your team and more than one location.">
        <Cards items={[
          { title: 'Add your team', text: 'Invite staff and give each person only the access they need.', to: '/help/employees/add-team' },
          { title: 'Roles and permissions', text: 'Choose what each role can see and do.', to: '/help/employees/permissions' },
          { title: 'Branches', text: 'Add locations, keep stock for each one and move stock between them.', to: '/help/branches/create-branch' },
        ]} />
      </Section>

      <Section id="kitchen" title="Restaurants, kitchens and catering" sub="For businesses that prepare food.">
        <Cards items={[
          { title: 'Menu and orders', text: 'Build your menu, take dine-in, takeaway and delivery orders and track them.', to: '/help/restaurant/orders' },
          { title: 'Kitchen screen', text: 'The kitchen sees what is waiting, being made and ready to serve.', to: '/help/restaurant/kitchen' },
          { title: 'Bakeries', text: 'Bakeries use the same tools with a simpler set-up.', to: '/help/restaurant/bakery' },
          { title: 'Catering events', text: 'Create packages, record events and bookings, and track payments and profit.', to: '/help/catering/events' },
        ]} />
      </Section>

      <Section id="money" alt title="Monitoring your money and operations" sub="See how the business is doing without a spreadsheet.">
        <Cards items={[
          { title: 'Dashboard', text: 'Sales, money received, expenses and estimated profit at a glance.', to: '/help/getting-started/dashboard' },
          { title: 'Expenses and cash', text: 'Record what you spend and keep track of your cash and bank accounts.', to: '/help/finance/expenses' },
          { title: 'Customers who owe you', text: 'See who owes you and how much.', to: '/help/finance/debtors' },
          { title: 'Reports', text: 'Sales and stock reports for the period you choose.', to: '/help/finance/financial-reports' },
        ]} />
      </Section>

      <Section id="types" title="Supported business types" sub="ShopScale adapts to how you work.">
        <Cards items={[
          { title: 'Shop and retail', text: 'Fashion, supermarkets, pharmacies, general stores and more. Sell in person and online.', to: '/retail', link: 'See retail' },
          { title: 'Restaurant', text: 'Menus, tables, orders and a kitchen screen.', to: '/restaurant', link: 'See restaurants' },
          { title: 'Bakery', text: 'A simple set-up for baked goods, ingredients and production.', to: '/help/restaurant/bakery' },
          { title: 'Catering', text: 'Events, packages, bookings and payments.', to: '/catering', link: 'See catering' },
        ]} />
      </Section>

      <Section id="faq" alt title="Frequently asked questions">
        <div className="hiw-faq">
          {HIW_FAQ.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}
        </div>
      </Section>

      <section className="hiw-final" aria-labelledby="hiw-final-h">
        <div className="mk-wrap">
          <h2 id="hiw-final-h">Ready to get started?</h2>
          <p>Try ShopScale free for 14 days, or browse step-by-step guides first.</p>
          <div className="hiw-cta">
            <Link className="btn primary" to="/register">Get started <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link className="btn" to="/help"><BookOpen size={16} aria-hidden="true" /> Explore the Help Centre</Link>
          </div>
        </div>
      </section>
      <div className="mk-wrap" style={{ padding: '28px 0' }}><SupportCard /></div>
    </>
  )
}
