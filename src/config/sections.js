/**
 * The eight V1 navigation sections. Each section is a group of related screens shown as tabs, so the main menu stays short
 * and the same on desktop and phone. Which screens a person sees still depends on their permissions and plan (the server
 * enforces the same rules).
 */
export const SECTIONS = [
  { id: 'home', label: 'Home', icon: 'Home', tabs: [{ to: '/dashboard', label: 'Home', needs: 'DASHBOARD_VIEW' }] },
  { id: 'sales', label: 'Sales', icon: 'ShoppingCart', tabs: [
    { to: '/sell', label: 'Record a sale', needs: 'SALES_CREATE' },
    { to: '/more/sales', label: 'Sales history', needsAny: ['SALES_VIEW', 'SALES_HISTORY_VIEW'] },
    { to: '/more/invoices', label: 'Invoices', needs: 'CUSTOMER_INVOICES_VIEW' },
  ] },
  { id: 'products', label: 'Products & Stock', icon: 'Package', tabs: [
    { to: '/products', label: 'Products', needs: 'PRODUCTS_VIEW' },
    { to: '/more/stock', label: 'Stock', needsAny: ['STOCK_VIEW', 'STOCK_MOVEMENTS_VIEW'] },
    { to: '/purchases/new', label: 'Receive stock', needsAny: ['PURCHASES_CREATE', 'STOCK_RESTOCK'] },
  ] },
  { id: 'money', label: 'Money', icon: 'Wallet', tabs: [
    { to: '/more/money', label: 'Money overview', needs: 'FINANCE_OVERVIEW' },
    { to: '/expenses', label: 'Business expenses', needs: 'EXPENSES_VIEW' },
    { to: '/more/accounts', label: 'Cash and bank', needs: 'CASH_ACCOUNTS_MANAGE', feature: 'CASH_ACCOUNTS' },
  ] },
  { id: 'people', label: 'Customers & Suppliers', icon: 'Users', tabs: [
    { to: '/customers', label: 'Customers', needs: 'CUSTOMERS_VIEW' },
    { to: '/suppliers', label: 'Suppliers', needsAny: ['SUPPLIERS_VIEW', 'PURCHASES_VIEW'] },
  ] },
  { id: 'store', label: 'Online Store', icon: 'Store', tabs: [
    { to: '/more/store', label: 'Store settings', needs: 'STORE_VIEW' },
    { to: '/more/store-orders', label: 'Online orders', needs: 'STORE_ORDERS_MANAGE', feature: 'STOREFRONT' },
  ] },
  { id: 'reports', label: 'Reports', icon: 'BarChart3', tabs: [
    { to: '/more/sales-report', label: 'Sales reports', needs: 'REPORTS_SALES' },
    // Shown to everyone who can see the dashboard; the page explains the plan when the feature is not included.
    { to: '/more/ask', label: 'Ask ShopScale', needs: 'DASHBOARD_VIEW' },
  ] },
  { id: 'settings', label: 'Settings', icon: 'Settings', tabs: [
    { to: '/more/settings', label: 'Business settings', needs: 'SETTINGS_VIEW' },
    { to: '/more/team', label: 'Team', needs: 'TEAM_VIEW' },
    { to: '/more/plan', label: 'Plan and billing', needs: 'SUBSCRIPTION_VIEW' },
    { to: '/more/export', label: 'Export data', needs: 'DATA_EXPORT', feature: 'DATA_EXPORT' },
    { to: '/more/activity', label: 'Activity history', needs: 'ACTIVITY_VIEW' },
    { to: '/more/notifications', label: 'Notifications' },
    { to: '/more/help', label: 'Help' },
  ] },
]

/** Pages that belong to a section without being one of its tabs (detail pages). */
const EXTRA = { products: ['/products'], people: ['/customers', '/suppliers'], sales: ['/more/pending-sales'], settings: ['/more/support', '/more/pending-sales'] }

const within = (path, base) => path === base || path.startsWith(base + '/')

function tabAllowed(t, { can, hasFeature }) {
  if (t.needs && !can(t.needs)) return false
  if (t.needsAny && !t.needsAny.some((p) => can(p))) return false
  if (t.feature && hasFeature && !hasFeature(t.feature)) return false
  return true
}

/** The tabs of one section that this person may use. */
export function sectionTabs(section, ctx) {
  return section.tabs.filter((t) => tabAllowed(t, ctx))
}

/** The main menu: one entry per section that has at least one usable screen, linking to the first of them. */
export function v1Nav(ctx) {
  return SECTIONS.map((s) => ({ id: s.id, label: s.label, icon: s.icon, tabs: sectionTabs(s, ctx) }))
    .filter((s) => s.tabs.length)
    .map((s) => ({ id: s.id, label: s.label, icon: s.icon, to: s.tabs[0].to }))
}

/** Which section a path belongs to (for the active menu entry and the tab strip). */
export function sectionFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  for (const s of SECTIONS) {
    if (s.tabs.some((t) => within(path, t.to)) || (EXTRA[s.id] || []).some((b) => within(path, b))) return s
  }
  return null
}
