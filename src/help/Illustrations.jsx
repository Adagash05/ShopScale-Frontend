import { ArrowRight, ArrowDown } from 'lucide-react'

/**
 * Process diagrams drawn with the site's own styles. They are diagrams of how ShopScale works, not screenshots.
 * Every step here matches the real behaviour of the application.
 */
function Flow({ label, steps, caption }) {
  return (
    <figure className="hc-diagram" aria-label={label}>
      <ol className="hc-flow">
        {steps.map((s, i) => (
          <li key={s.title} className={s.tone || ''}>
            <span className="n">{i + 1}</span>
            <strong>{s.title}</strong>
            <span>{s.text}</span>
            {i < steps.length - 1 && <ArrowRight className="arr h" size={18} aria-hidden="true" />}
            {i < steps.length - 1 && <ArrowDown className="arr v" size={18} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

export const JOURNEY = [
  { title: 'Add products', text: 'Name, price, stock and a photo in Products.' },
  { title: 'Open your store', text: 'More, Online store, then Open my store to customers.' },
  { title: 'Connect Paystack', text: 'Optional. Lets customers pay by card or transfer.' },
  { title: 'Customer orders', text: 'Browses, adds to cart and checks out.' },
  { title: 'Payment confirmed', text: 'Paystack confirms the amount. Or the customer pays on handover.', tone: 'ok' },
  { title: 'You process it', text: 'Confirm, mark ready, hand over and complete.' },
  { title: 'Sale recorded', text: 'Stock goes down and your money overview updates.', tone: 'ok' },
]

export const LIFECYCLE = [
  { title: 'Order created', text: 'Customer checks out. Nothing is paid yet for online payments.', tone: 'warn' },
  { title: 'Pending payment', text: 'Waiting for Paystack. You do not prepare this order.', tone: 'warn' },
  { title: 'New', text: 'Payment confirmed, or the customer chose pay on handover.' },
  { title: 'Confirmed', text: 'You accepted it and are preparing it.' },
  { title: 'Ready', text: 'Packed. Waiting for pickup or delivery.' },
  { title: 'Completed', text: 'Handed over. Sale recorded and stock reduced.', tone: 'ok' },
]

const DIAGRAMS = {
  'store-journey': () => <Flow label="From no online store to your first order" steps={JOURNEY} caption="Diagram: from no online store to your first order." />,
  'order-lifecycle': () => (
    <>
      <Flow label="The life of an online order" steps={LIFECYCLE} caption="Diagram: the life of an online order. Creating an order, confirming payment, preparing it and completing it are separate steps." />
      <p className="hc-diagram-note">An order can be <strong>Cancelled</strong> while it is New, Confirmed or Ready if no sale has been recorded yet. Orders that are never paid are cancelled automatically.</p>
    </>
  ),
}

export default function Illustration({ name }) {
  const D = DIAGRAMS[name]
  return D ? <D /> : null
}
