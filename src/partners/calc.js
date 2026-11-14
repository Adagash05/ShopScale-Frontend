/**
 * The earnings calculator on the partner landing page.
 * Pure arithmetic over the real plan prices and the live programme terms. It is an illustration, never a promise:
 * what a partner actually earns is only ever what the server records for real, verified payments.
 */
export function paidPlans(plans) {
  return (plans || []).filter((p) => Number(p.monthlyPrice) > 0 && Number(p.annualPrice) > 0)
}

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * @param plan       { monthlyPrice, annualPrice }
 * @param cycle      'MONTHLY' | 'ANNUAL'
 * @param customers  how many referred customers are on this plan
 * @param programme  { commissionRate (0..1), commissionMonths }
 * @returns per-customer and total commission over the commission window, plus the first payment's commission
 */
export function estimate({ plan, cycle, customers, programme }) {
  const rate = Number(programme?.commissionRate)
  const months = Math.max(1, Math.floor(Number(programme?.commissionMonths) || 0))
  const n = Math.max(0, Math.floor(Number(customers) || 0))
  if (!plan || !(rate > 0)) return { perPayment: 0, perCustomer: 0, total: 0, payments: 0, monthly: 0 }
  const annual = cycle === 'ANNUAL'
  const price = Number(annual ? plan.annualPrice : plan.monthlyPrice)
  // A monthly customer pays once a month for the whole window; an annual payment covers 12 months, so a window shorter
  // than 12 months only earns on the part of the year inside it (the server prorates the same way).
  const payments = annual ? 1 : months
  const fraction = annual ? Math.min(1, months / 12) : 1
  const perPayment = r2(price * rate * fraction)
  const perCustomer = r2(perPayment * payments)
  const total = r2(perCustomer * n)
  return { perPayment, perCustomer, total, payments, monthly: r2(total / months) }
}
