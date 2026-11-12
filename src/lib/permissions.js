/** UI helpers only. The server decides what is allowed; these just avoid showing things people cannot use. */

export function roleGrantable(myPermissions, role) {
  const mine = new Set(myPermissions)
  return role.permissions.every((p) => mine.has(p))
}

export function groupPermissions(keys, catalogue) {
  const set = new Set(keys)
  return catalogue
    .map((g) => ({ module: g.module, items: g.permissions.filter((p) => set.has(p.key)) }))
    .filter((g) => g.items.length > 0)
}

export function describeActivity(a) {
  const map = {
    SALE_CREATED: ['Sale recorded', 'teal', 'sale'], SALE_REFUNDED: ['Sale refunded', 'warn', 'sale'],
    CUSTOMER_PAYMENT: ['Payment received', 'teal', 'money'], INVOICE_PAYMENT: ['Invoice payment received', 'teal', 'money'], INVOICE_CREATED: ['Invoice created', 'blue', 'money'], INVOICE_SENT: ['Invoice sent', 'blue', 'money'], INVOICE_CANCELLED: ['Invoice cancelled', 'gray', 'money'], EXPENSE_CREATED: ['Expense recorded', 'warn', 'money'],
    EXPENSE_DELETED: ['Expense deleted', 'gray', 'money'], PRODUCT_CREATED: ['Product added', 'blue', 'box'],
    PRODUCT_UPDATED: ['Product updated', 'blue', 'box'], PRODUCT_ARCHIVED: ['Product archived', 'gray', 'box'],
    PRODUCT_RESTORED: ['Product restored', 'blue', 'box'], CUSTOMER_CREATED: ['Customer added', 'blue', 'user'],
    BUSINESS_CREATED: ['Business created', 'teal', 'store'], BUSINESS_UPDATED: ['Business settings changed', 'gray', 'store'],
    TEAM_INVITED: ['Staff member invited', 'blue', 'user'], TEAM_JOINED: ['Staff member joined', 'teal', 'user'],
    TEAM_INVITE_RESENT: ['Invitation resent', 'gray', 'user'], TEAM_INVITE_REVOKED: ['Invitation cancelled', 'gray', 'user'],
    TEAM_ROLE_CHANGED: ['Staff role changed', 'blue', 'user'], TEAM_DEACTIVATED: ['Staff access removed', 'warn', 'user'],
    TEAM_REACTIVATED: ['Staff access restored', 'teal', 'user'], ROLE_CREATED: ['Custom role created', 'blue', 'user'],
    ROLE_UPDATED: ['Custom role updated', 'blue', 'user'], ROLE_DELETED: ['Custom role deleted', 'gray', 'user'],
  }
  if (map[a.action]) return map[a.action]
  if (a.action.startsWith('STOCK_')) return ['Stock updated', 'blue', 'box']
  return [a.action.toLowerCase().replace(/_/g, ' '), 'gray', 'dot']
}

export function timeAgo(iso, now = new Date()) {
  const s = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}
