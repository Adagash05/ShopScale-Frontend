// Display text only. Prices, limits and which plan has which feature all come from the backend.
export const FEATURE_LABELS = {
  POS: 'Record sales (POS)',
  BASIC_INVENTORY: 'Stock management',
  EXPENSES: 'Expense tracking',
  BASIC_DASHBOARD: 'Business overview',
  CUSTOMER_CREDIT: 'Customer credit tracking',
  STOCK_HISTORY: 'Stock history',
  DATA_EXPORT: 'Data export',
  STOREFRONT: 'Online storefront (coming soon)',
  ONLINE_ORDERS: 'Online order management (coming soon)',
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
}

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
