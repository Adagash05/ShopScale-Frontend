import { Link } from 'react-router-dom'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { money } from '../lib/format.js'
import { contactLines, faqFor, hoursLines, socialLinks } from './presentation.js'
import { useStore } from './StoreContext.jsx'
import { usePageTitle } from './StoreLayout.jsx'
import { Empty } from './ui.jsx'

const ICON = { phone: Phone, whatsapp: MessageCircle, email: Mail, address: MapPin }
const NAME = { phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email', address: 'Address' }

function Page({ eyebrow, title, children, wide }) {
  const { info, base } = useStore()
  usePageTitle(`${title} | ${info.name}`)
  return (
    <>
      <div className="page-head"><div className="wrap"><nav className="crumbs" aria-label="Breadcrumb"><Link to={base}>Home</Link><span>/</span><span>{title}</span></nav><span className="eyebrow">{eyebrow}</span><h1 style={{ fontSize: 'clamp(1.9rem, 4.4vw, 3rem)', marginTop: 8 }}>{title}</h1></div></div>
      <div className="wrap" style={{ paddingTop: 36 }}><div className={wide ? '' : 'prose'} style={wide ? { paddingBottom: 72 } : undefined}>{children}</div></div>
    </>
  )
}

function ContactCards() {
  const { info } = useStore()
  const c = contactLines(info)
  if (!c.length) return <div className="note">{info.name} has not added contact details yet. You can still place an order and follow it on your order page.</div>
  return (
    <div className="contact-cards">
      {c.map((x) => {
        const I = ICON[x.kind]
        const body = <><I size={20} aria-hidden="true" /><div><b>{NAME[x.kind]}</b><span>{x.label.replace(/^WhatsApp /, '')}</span></div></>
        return x.href ? <a key={x.kind} className="contact-card" href={x.href} {...(x.kind === 'whatsapp' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{body}</a> : <div key={x.kind} className="contact-card">{body}</div>
      })}
    </div>
  )
}

export function About() {
  const { info, base, pres } = useStore()
  return (
    <Page eyebrow="About us" title={`About ${info.name}`}>
      {info.description ? <p style={{ fontSize: '1.12rem', whiteSpace: 'pre-line' }}>{info.description}</p> : <p style={{ fontSize: '1.12rem' }}>{info.name} sells online through this store. Browse the {pres.shop.toLowerCase()} and place your order for {[info.pickup && 'pickup', info.delivery && 'delivery'].filter(Boolean).join(' or ') || 'collection'}.</p>}
      {info.address && <p><b>Find us:</b> {info.address}</p>}
      <p><Link className="btn primary" to={`${base}/shop`}>{pres.cta}</Link></p>
      <h2>Get in touch</h2>
      <ContactCards />
    </Page>
  )
}

export function Contact() {
  const { info, base } = useStore()
  return (
    <Page eyebrow="Contact" title={`Contact ${info.name}`}>
      <p>Questions about a product, your order or delivery? Reach {info.name} directly.</p>
      <ContactCards />
      {hoursLines(info).length > 0 && <><h2>Opening hours</h2><p style={{ whiteSpace: 'pre-line' }}>{hoursLines(info).join('\n')}</p></>}
      {socialLinks(info).length > 0 && <><h2>Follow us</h2><p>{socialLinks(info).map((s, i) => <span key={s.label}>{i > 0 && ' · '}<a className="link" href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p></>}
      {info.businessType === 'CATERING' && <p><Link className="btn primary" to={`${base}/enquiry`}>Enquire about an event</Link></p>}
      <p className="muted small">For an existing order, have your order number ready (find it under <Link className="link" to={`${base}/orders`}>My orders</Link>).</p>
    </Page>
  )
}

export function Faq() {
  const { info, pres } = useStore()
  return (
    <Page eyebrow="Help" title="Frequently asked questions">
      <div className="facts" style={{ maxWidth: 720 }}>
        {faqFor(info, pres).map(([q, a]) => <details key={q}><summary>{q}</summary><div><p>{a}</p></div></details>)}
      </div>
    </Page>
  )
}

export function Shipping() {
  const { info, base } = useStore()
  return (
    <Page eyebrow="Delivery" title="Shipping & delivery">
      {!info.delivery && !info.pickup && <div className="note">{info.name} has not set up delivery or pickup options. Contact them to arrange your order.</div>}
      {info.delivery && (<><h2>Delivery</h2><p>{info.name} delivers orders. {Number(info.deliveryFee) > 0 ? `The delivery fee is ${money(info.deliveryFee)}, added to your order at checkout.` : 'There is no delivery fee.'}</p>{info.deliveryNote && <p>{info.deliveryNote}</p>}<p>Delivery areas and times are arranged by the business. If you are unsure whether they deliver to you, ask before you order.</p></>)}
      {info.pickup && (<><h2>Pickup</h2><p>You can collect your order from {info.name}{info.address ? ` at ${info.address}` : ''}. The business will let you know when it is ready.</p></>)}
      <h2>Tracking your order</h2>
      <p>After you order, your order page shows its current status. Find it again any time under <Link className="link" to={`${base}/orders`}>My orders</Link>.</p>
    </Page>
  )
}

export function Returns() {
  const { info } = useStore()
  const c = contactLines(info).filter((x) => x.kind !== 'address')
  return (
    <Page eyebrow="After your order" title="Returns & refunds">
      <p>Returns and refunds are handled by {info.name}, the seller. Each business sets its own arrangements, so please contact them as soon as you receive your order if something is wrong, wrong item, damaged or missing.</p>
      <h2>If something is wrong</h2>
      <ul><li>Contact {info.name} promptly and have your order number ready.</li><li>Keep the item and its packaging until the business tells you what to do.</li><li>Any refund is arranged directly with the business, to the way you paid.</li></ul>
      <h2>Payments taken in error</h2>
      <p>If you were charged twice, or charged for an order that was cancelled, contact {info.name} with your order number and payment reference.</p>
      {c.length > 0 && <><h2>Contact the business</h2><ContactCards /></>}
    </Page>
  )
}

export function Privacy() {
  const { info } = useStore()
  return (
    <Page eyebrow="Policies" title="Privacy policy">
      <p className="muted small">A standard notice provided by ShopScale for stores on its platform. {info.name} is the seller and is responsible for the orders it receives.</p>
      <h2>What we collect when you order</h2>
      <p>Your name, phone number, delivery address (for delivery), email (to send a payment receipt, or if you choose to give it), any note you add, and what you ordered.</p>
      <h2>How it is used</h2>
      <p>{info.name} uses this to prepare, deliver and confirm your order and to contact you about it. It is not shown to other customers.</p>
      <h2>Payments</h2>
      <p>Online payments are processed by Paystack. Your card or bank details are entered on Paystack's page and are never seen or stored by {info.name} or ShopScale.</p>
      <h2>On your device</h2>
      <p>This store keeps your cart and the links to your orders in your browser so you can come back to them. Clear your browser data to remove them.</p>
      <h2>Your choices</h2>
      <p>To ask {info.name} to correct or remove your order details, contact them{info.phone ? ` on ${info.phone}` : info.email ? ` at ${info.email}` : ''}.</p>
    </Page>
  )
}

export function Terms() {
  const { info, base } = useStore()
  return (
    <Page eyebrow="Policies" title="Terms & conditions">
      <p className="muted small">Standard terms provided by ShopScale for stores on its platform. Your purchase is with {info.name}.</p>
      <h2>Orders</h2>
      <p>When you place an order, {info.name} confirms the final price and availability. An order is accepted when the business confirms it. Prices are in Nigerian naira.</p>
      <h2>Payment</h2>
      <p>You can pay in the ways shown at checkout. Orders paid online are marked paid only after the payment is confirmed with Paystack.</p>
      <h2>Delivery and pickup</h2>
      <p>See the <Link className="link" to={`${base}/shipping`}>shipping &amp; delivery</Link> page. Times and areas are arranged by the business.</p>
      <h2>Changes, returns and refunds</h2>
      <p>See <Link className="link" to={`${base}/returns`}>returns &amp; refunds</Link>. Contact the business promptly about any problem.</p>
      <h2>ShopScale's role</h2>
      <p>ShopScale provides the online store technology. The seller is {info.name}; ShopScale is not a party to your purchase.</p>
    </Page>
  )
}

export function NotFound() {
  const { base, pres } = useStore()
  return <div className="wrap"><Empty title="Page not found" action={<Link className="btn primary" to={base}>Back to the store</Link>}>The page you are looking for does not exist. Try the {pres.shop.toLowerCase()} instead.</Empty></div>
}
