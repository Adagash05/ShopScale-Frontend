// Plan allowances are decided by the server. This file only turns the server's numbers into words.

/** "5 of 20 left this month", "Unlimited", or null when reminders are not part of the plan. */
export function reminderUsageText(u) {
  if (!u || !u.included) return null
  if (u.unlimited) return 'Unlimited WhatsApp reminders on your plan'
  return `${u.remaining} of ${u.limit} WhatsApp reminders left this billing month`
}

export const reminderExhausted = (u) => !!u && u.included && !u.unlimited && u.remaining <= 0

/** Text for an expense allowance column: "50 per month", "10", or "Unlimited*". */
export function expenseLimitText(plan, unlimited = 'Unlimited*') {
  if (plan.maxExpenses == null) return unlimited
  return plan.expensePeriod === 'MONTH' ? `${Number(plan.maxExpenses).toLocaleString('en-NG')} per month` : Number(plan.maxExpenses).toLocaleString('en-NG')
}

/** Supplier allowance: 0 reads as "None". */
export function supplierLimitText(plan, unlimited = 'Unlimited*') {
  if (plan.maxSuppliers == null) return unlimited
  return Number(plan.maxSuppliers) === 0 ? 'None' : Number(plan.maxSuppliers).toLocaleString('en-NG')
}

/** WhatsApp reminders per month: 0 reads as "None". */
export function reminderLimitText(plan, unlimited = 'Unlimited*') {
  if (plan.maxWhatsappReminders == null) return unlimited
  return Number(plan.maxWhatsappReminders) === 0 ? 'None' : `${Number(plan.maxWhatsappReminders).toLocaleString('en-NG')} per month`
}
