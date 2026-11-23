// Display text only. Prices, limits and which plan has which feature all come from the backend.
export const FEATURE_LABELS = {
  POS: 'Record sales (POS)',
  BASIC_INVENTORY: 'Stock management',
  EXPENSES: 'Expense tracking',
  BASIC_DASHBOARD: 'Business overview',
  CUSTOMER_CREDIT: 'Customer credit tracking',
  STOCK_HISTORY: 'Stock history',
  DATA_EXPORT: 'CSV data export',
  PURCHASING: 'Purchase orders to suppliers',
  CASH_ACCOUNTS: 'Cash and bank accounts',
  WHOLESALE_PRICING: 'Wholesale pricing',
  CASH_RECONCILIATION: 'Cash reconciliation',
  BRANCH_TRANSFERS: 'Branch stock transfers',
  ADVANCED_INVENTORY: 'Advanced inventory controls',
  CONSOLIDATED_REPORTING: 'Consolidated business reporting',
  STOREFRONT: 'Online storefront',
  ONLINE_ORDERS: 'Online order management',
  ADVANCED_FINANCE: 'Advanced financial reporting',
  ENHANCED_DASHBOARD: 'Advanced dashboard',
  SUPPLIER_BALANCES: 'Supplier balances',
  STAFF_PERMISSIONS: 'Staff permissions',
  ADVANCED_REPORTS: 'Advanced sales and stock reports',
  LOCATION_REPORTING: 'Location-level reports',
  ACTIVITY_HISTORY: 'Activity history',
  CUSTOM_DOMAINS: 'Custom storefront domain',
  ADVANCED_STAFF_PERMISSIONS: 'Advanced staff permissions',
  PRIORITY_SUPPORT: 'Priority support',
  ASK_SHOPSCALE: 'Ask ShopScale (business questions answered from your records)',
}

/** Plan features that only unlock modules hidden in the V1 product. They are not advertised while V1 is on; the plan data itself is unchanged. */
export const V1_HIDDEN_FEATURES = ['PURCHASING', 'WHOLESALE_PRICING', 'CASH_RECONCILIATION', 'BRANCH_TRANSFERS', 'ADVANCED_INVENTORY', 'CONSOLIDATED_REPORTING',
  'ADVANCED_FINANCE', 'ENHANCED_DASHBOARD', 'ADVANCED_REPORTS', 'LOCATION_REPORTING', 'CUSTOM_DOMAINS', 'ADVANCED_STAFF_PERMISSIONS']
/**
 * Advertised on the pricing page but not delivered as described, so not advertised until it is (plan data is unchanged):
 * STAFF_PERMISSIONS (not enforced by the server; custom roles are hidden in V1) and PRIORITY_SUPPORT (support tickets are not prioritised by plan).
 * ACTIVITY_HISTORY is a separate decision for the owner: the server does not restrict it to Business, so every plan has it today.
 */
export const NOT_YET_DELIVERED = ['STAFF_PERMISSIONS', 'PRIORITY_SUPPORT']
export const advertised = (feature, scope = true) => !NOT_YET_DELIVERED.includes(feature) && !(scope && V1_HIDDEN_FEATURES.includes(feature))

export function annualSavings(plan) {
  return Math.max(0, Number(plan.monthlyPrice) * 12 - Number(plan.annualPrice))
}

export function limitText(n, unlimited = 'Unlimited*') {
  return n == null ? unlimited : Number(n).toLocaleString('en-NG')
}

/** Features a plan has that the previous (cheaper) plan does not. */
export function newFeatures(plan, previous) {
  const prev = new Set(previous?.features || [])
  return plan.features.filter((f) => !prev.has(f))
}

export function allFeatureKeys(plans) {
  const seen = []
  plans.forEach((p) => p.features.forEach((f) => { if (!seen.includes(f)) seen.push(f) }))
  return seen
}
