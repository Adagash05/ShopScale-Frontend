/**
 * V1 product scope. While on (the default) ShopScale presents the focused trading product: sales, stock, money, customers and
 * suppliers, the online store and reports. The specialised modules (restaurant, kitchen, catering, branches, purchase orders,
 * wholesale tiers, quotations, custom domains, cashier shifts) are hidden. Their code and data are kept.
 * The backend enforces the same list (app.v1-scope, V1ScopeInterceptor), so hiding is not only cosmetic.
 * Set VITE_V1_SCOPE=false (and V1_SCOPE=false on the server) to bring the modules back.
 */
export const V1_SCOPE = (() => { try { return import.meta.env.VITE_V1_SCOPE !== 'false' } catch { return true } })()

/** Route paths outside V1. A path is hidden when it equals one of these or sits below it. Keep in step with V1ScopeInterceptor.HIDDEN. */
export const HIDDEN_ROUTES = [
  'events', 'orders', 'kitchen',
  'more/menu', 'more/wastage', 'more/production', 'more/restaurant-reports', 'more/catering-packages',
  'more/pricing', 'more/quotes', 'more/orders-in',
  'more/orders', 'more/branches', 'more/transfers', 'more/shifts', 'more/store-inbox',
]

export function isHiddenRoute(path, scope = V1_SCOPE) {
  if (!scope) return false
  const p = String(path || '').replace(/^\/+/, '').replace(/\/+$/, '')
  return HIDDEN_ROUTES.some((h) => p === h || p.startsWith(h + '/'))
}
