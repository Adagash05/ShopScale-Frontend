// Shared by seed-demo.mjs and capture-help-screenshots.mjs. Everything here is fictional demo data for LOCAL development only.
// Nothing in this folder ever touches a real customer account: every demo account is created by (and only by) the seed script.

export const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
export const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '')
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoPass#2026'

/** One owner account per business (ShopScale allows one business per account). The .test domain can never receive real mail. */
export const ACCOUNTS = {
  retail:     { key: 'retail',     email: 'aminu.owner@demo.shopscale.test',   fullName: 'Aminu Bello',     phone: '08000000001', businessName: 'Aminu Stores',          type: 'RETAIL',     subtype: 'General store', slug: 'aminu-stores-demo' },
  restaurant: { key: 'restaurant', email: 'royal.owner@demo.shopscale.test',   fullName: 'Ngozi Eze',       phone: '08000000002', businessName: 'Royal Kitchen Restaurant', type: 'RESTAURANT', subtype: 'Restaurant',    slug: 'royal-kitchen-demo' },
  bakery:     { key: 'bakery',     email: 'crust.owner@demo.shopscale.test',   fullName: 'Folake Adeyemi',  phone: '08000000003', businessName: 'Golden Crust Bakery',   type: 'BAKERY',     subtype: 'Bakery',        slug: 'golden-crust-demo' },
  catering:   { key: 'catering',   email: 'harvest.owner@demo.shopscale.test', fullName: 'Chidi Okafor',    phone: '08000000004', businessName: 'Fresh Harvest Foods',   type: 'CATERING',   subtype: 'Event catering', slug: 'fresh-harvest-demo' },
  // Registered but with NO business yet, so the capture script can show the first-time setup screens (onboarding).
  newuser:    { key: 'newuser',    email: 'new.owner@demo.shopscale.test',     fullName: 'Tunde Bakare',    phone: '08000000005', noBusiness: true },
}

/** Refuses anything that is not a local backend, so the demo data can never reach a real database by accident. */
export function assertLocalBackend(url = API_BASE_URL) {
  const host = new URL(url).hostname
  const local = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)
  if (/shopscale\.com\.ng$/i.test(host)) throw new Error(`Refusing to use ${host}: that is a real ShopScale host.`)
  if (!local && process.env.DEMO_ALLOW_REMOTE !== '1') {
    throw new Error(`Refusing to use ${host}: demo data is for a LOCAL backend only (localhost). Set DEMO_ALLOW_REMOTE=1 only for a private test server that holds no real customers.`)
  }
}
