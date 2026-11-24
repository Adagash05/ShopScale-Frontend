import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { api } from '../lib/api'
import { useLoad, ErrorBox, Skeleton } from '../components.jsx'
import { useSeo } from './Seo.jsx'
import { Faq } from './ui.jsx'
import { SUPPORT_EMAIL, SUPPORT_MAILTO, SUPPORT_WHATSAPP, SUPPORT_WHATSAPP_NUMBER } from '../help/support.js'
import { V1_SCOPE } from '../config/scope.js'
import './contact.css'
import { ShoppingCart, Boxes, Users, Wallet, LayoutDashboard, UsersRound, Store, UtensilsCrossed, CalendarClock, ShieldCheck, Check } from 'lucide-react'



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

export function FaqList({ items }) {
  return <Faq items={items} />
}

export { HomePage } from './Home.jsx'
export { FeaturesPage, RetailPage, WholesalePage, OnlineSellingPage, RestaurantPage, CateringPage, IndustriesPage, FaqPage } from './Public.jsx'

export function AboutPage() {
  useSeo({ title: 'About ShopScale', description: 'ShopScale is a business operations app built to help Nigerian businesses run from one simple platform.', path: '/about' })
  return (
    <section className="mk-section"><div className="mk-wrap prose">
      <h1 style={{ fontSize: '2rem' }}>About ShopScale</h1>
      <p>We are building ShopScale so that a business owner who uses notebooks, calculators and WhatsApp today can run sales, stock, customers and expenses from one simple app on their phone.</p>
      <p>We design for affordable Android phones and patchy networks, and we use plain words instead of accounting jargon.</p>
      <p>ShopScale is a new product and we are building it in the open. This website only lists what already works and clearly marks what is coming.</p>
      <Cta />
    </div></section>
  )
}

export function ContactPage() {
  useSeo({ title: 'Contact', description: 'Contact ShopScale Support by email for account enquiries, technical assistance and billing questions, or message us on WhatsApp.', path: '/contact' })
  return (
    <section className="mk-section"><div className="mk-wrap ct">
      <h1 style={{ fontSize: '2rem' }}>Contact us</h1>
      <p className="ct-intro">Need assistance with ShopScale? Our support team is available by email for account enquiries, technical assistance, billing questions and other concerns. You can also reach us through WhatsApp.</p>
      <section className="ct-email" aria-labelledby="ct-email-h">
        <h2 id="ct-email-h">Email Support</h2>
        <p>The best way to reach ShopScale for technical assistance, account enquiries, billing questions and general support.</p>
        <a className="ct-address" href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
        <a className="btn primary" href={SUPPORT_MAILTO}>Send an email</a>
      </section>
      <section className="ct-wa" aria-labelledby="ct-wa-h">
        <h2 id="ct-wa-h">WhatsApp Support</h2>
        <p>Message ShopScale on WhatsApp: {SUPPORT_WHATSAPP_NUMBER}</p>
        <a className="btn" href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
      </section>
      <p className="ct-help">Looking for step-by-step guides? Visit the <Link to="/help">Help Centre</Link> or see <Link to="/how-it-works">how ShopScale works</Link>.</p>
    </div></section>
  )
}

const UPDATED = '4 November 2026'

function Legal({ seo, title, children }) {
  useSeo(seo)
  return <section className="mk-section"><div className="mk-wrap prose"><h1 style={{ fontSize: '2rem' }}>{title}</h1><p className="muted small">Last updated {UPDATED}</p>{children}</div></section>
}

export function PrivacyPage() {
  return (
    <Legal seo={{ title: 'Privacy Policy', description: 'How ShopScale collects, uses and protects your information.', path: '/privacy' }} title="Privacy Policy">
      <p>This policy explains what information ShopScale collects and how we use it. We aim to follow the Nigeria Data Protection Act 2023.</p>
      <h2>What we collect</h2>
      <ul><li>Account details: your name, email, phone number and password (stored in a protected, one-way form).</li><li>Business records you enter: products, stock, sales, customers, expenses and staff.</li><li>Technical information needed to run the service, such as sign-in times.</li></ul>
      <h2>Analytics</h2>
      <p>If you allow it, we use Google Analytics on ShopScale’s own pages to count visits and see which features are used. We ask before loading it, you can turn it off any time in Help, and we never send customer details, sales amounts, emails or phone numbers. Public online stores run by merchants are not tracked by ShopScale.</p>
      <h2>How we use it</h2>
      <p>We use your information to provide ShopScale, keep it secure, and contact you about your account. We do not sell your data.</p>
      <h2>Who can see it</h2>
      <p>Only people you add to your business, with the access you give them, and ShopScale Team members where needed to keep the service running or help you, under controlled and recorded access.</p>
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
      <p>By creating an account you agree to these terms with ShopScale, the provider of the service.</p>
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
      <h2>Automatic renewal</h2><p>Paid ShopScale plans renew automatically. The card you pay with is saved securely by Paystack and charged the plan price at the end of each month or year, until you cancel. We do not ask you again at each renewal.</p>
      <h2>Cancelling</h2><p>You can cancel at any time from Plan and billing in the app, and no further charge is made. Your paid access continues until the end of the period you have paid for, and your data is kept.</p>
      <h2>Refund requests</h2><p>If you were charged by mistake or have a problem with a payment, contact us and we will look into it and reply to you. Refunds are considered case by case.</p>
      <h2>Payments you receive from your customers</h2><p>Money your customers pay you is between you and them. ShopScale subscription fees are separate from your sales.</p>
    </Legal>
  )
}

export function NotFoundPage() {
  useSeo({ title: 'Page not found', description: 'This page does not exist.', path: '/404', noindex: true })
  return <div className="err-page"><div className="stack" style={{ justifyItems: 'center' }}><h1 style={{ fontSize: '3rem' }}>404</h1><p className="muted">We could not find that page.</p><div className="row"><Link to="/" className="btn primary">Go to the home page</Link><Link to="/contact" className="btn">Contact us</Link></div></div></div>
}
