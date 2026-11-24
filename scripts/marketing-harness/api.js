// Plans exactly as the server sends them after V31 (copied from the ask-harness test data).
const F = ['POS', 'BASIC_INVENTORY', 'EXPENSES', 'BASIC_DASHBOARD', 'CUSTOMER_CREDIT', 'STOCK_HISTORY']
const ESS = [...F, 'WHATSAPP_REMINDERS', 'CASH_ACCOUNTS', 'SUPPLIER_BALANCES']
const GRO = [...ESS, 'DATA_EXPORT', 'ASK_SHOPSCALE', 'BEST_SELLING_PRODUCTS', 'BEST_SELLING_CUSTOMERS', 'ACTIVITY_HISTORY', 'STOREFRONT', 'ONLINE_ORDERS']
const PLANS = [
  { code: 'FREE', name: 'Free', monthlyPrice: 0, annualPrice: 0, maxUsers: 1, maxLocations: 1, maxItems: 10, maxCustomers: 10, maxExpenses: 10, maxSuppliers: 0, maxWhatsappReminders: 0, expensePeriod: 'TOTAL', recommended: false, features: F },
  { code: 'ESSENTIAL', name: 'Essential', monthlyPrice: 4999, annualPrice: 49990, maxUsers: 2, maxLocations: 1, maxItems: 50, maxCustomers: 50, maxExpenses: 50, maxSuppliers: 10, maxWhatsappReminders: 20, expensePeriod: 'MONTH', recommended: false, features: ESS },
  { code: 'GROWTH', name: 'Growth', monthlyPrice: 14999, annualPrice: 149990, maxUsers: 5, maxLocations: 2, maxItems: 200, maxCustomers: null, maxExpenses: null, maxSuppliers: 50, maxWhatsappReminders: 50, expensePeriod: 'TOTAL', recommended: true, features: GRO },
  { code: 'BUSINESS', name: 'Business', monthlyPrice: 24999, annualPrice: 249990, maxUsers: 10, maxLocations: 5, maxItems: null, maxCustomers: null, maxExpenses: null, maxSuppliers: null, maxWhatsappReminders: null, expensePeriod: 'TOTAL', recommended: false, features: [...GRO, 'CUSTOM_DOMAINS'] },
]
export const PLANS_DATA = PLANS
const wrap = (v) => { const p = Promise.resolve(v); p.__v = v; return p }
export const api = { get: (u) => wrap(u === '/subscriptions/plans' ? PLANS : null), post: () => wrap(null), public: { get: (u) => wrap(u === '/subscriptions/plans' ? PLANS : null) } }
export class ApiError extends Error {}
