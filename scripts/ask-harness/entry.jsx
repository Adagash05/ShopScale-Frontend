import React from 'react'
import { renderToString } from 'react-dom/server'
import AskShopScale from '../../src/pages/AskShopScale.jsx'
import Help from '../../src/pages/Help.jsx'
import Home from '../../src/pages/Home.jsx'
import RemindCustomer from '../../src/pages/invoices/RemindCustomer.jsx'
import { STATE } from './auth_mock.jsx'
import { DATA } from './api_mock.js'
let fail = 0, n = 0
const t = (name, fn) => { n++; try { fn(); console.log('PASS ' + name) } catch (e) { fail++; console.log('FAIL ' + name + ': ' + e.message + (process.env.TRACE ? '\n' + e.stack.split('\n').slice(1,4).join('\n') : '')) } }
const html = (el) => renderToString(el).replace(/<!-- -->/g, '')
const has = (h, ...s) => { for (const x of s) if (!h.includes(x)) throw new Error('missing "' + x + '"') }
const lacks = (h, ...s) => { for (const x of s) if (h.includes(x)) throw new Error('unexpected "' + x + '"') }

const QUESTIONS = [
  { key: 'SALES', title: 'What were my sales?', usesPeriod: true, allowed: true },
  { key: 'TOP_PRODUCTS_REVENUE', title: 'Which products brought in the most sales value?', usesPeriod: true, allowed: true },
  { key: 'MONEY_RECEIVED', title: 'How much money have I actually received?', usesPeriod: true, allowed: false },
]
STATE.perms = new Set(['DASHBOARD_VIEW'])

t('plan without the feature sees the upgrade explanation and no questions', () => {
  STATE.features = new Set(); globalThis.__SP = ''
  const h = html(<AskShopScale />)
  has(h, 'Ask ShopScale is on the Growth and Business plans', 'href="/more/plan"', 'See plans'); lacks(h, 'What were my sales?')
})
t('without dashboard access the page redirects', () => {
  STATE.perms = new Set(); STATE.features = new Set(['ASK_SHOPSCALE'])
  has(html(<AskShopScale />), 'data-navigate="/more"'); STATE.perms = new Set(['DASHBOARD_VIEW'])
})
t('entitled plan lists the questions, staff-only ones disabled', () => {
  STATE.features = new Set(['ASK_SHOPSCALE']); DATA['/ask/questions'] = QUESTIONS
  const h = html(<AskShopScale />)
  has(h, 'What were my sales?', 'How much money have I actually received?', 'disabled', 'Choose a question', 'Sales are not the same as money received')
})
t('an answer shows the headline, figures, rows, notes and links from the server', () => {
  globalThis.__SP = 'q=TOP_PRODUCTS_REVENUE&range=thisMonth'
  DATA['/ask/TOP_PRODUCTS_REVENUE'] = { key: 'TOP_PRODUCTS_REVENUE', question: 'x', available: true, headline: 'Rice 50kg brought in the most sales value (₦150,000), 1 Nov 2026 to 22 Nov 2026.',
    figures: [{ label: 'Total', type: 'money', value: 150000, note: null }], rows: [{ label: 'Rice 50kg', detail: '3 sold · 60% of sales', type: 'money', value: 150000, link: '/products?q=Rice%2050kg' }],
    notes: ['Ranked by sales value (revenue), not by profit.'], links: [{ label: 'See products', to: '/products' }] }
  const h = html(<AskShopScale />)
  has(h, 'Rice 50kg brought in the most sales value', '₦150,000', 'href="/products?q=Rice%2050kg"', 'Ranked by sales value (revenue), not by profit.', 'See products')
})
t('an answer with no data says so instead of showing numbers', () => {
  globalThis.__SP = 'q=SALES&range=today'
  DATA['/ask/SALES'] = { key: 'SALES', available: false, headline: 'No sales were recorded 22 Nov 2026.', figures: [], rows: [], notes: [], links: [] }
  const h = html(<AskShopScale />); has(h, 'No sales were recorded 22 Nov 2026.'); lacks(h, 'class="ask-figs"')
})
t('Help has the nine categories, search box and a link to the Help Centre and Support', () => {
  globalThis.__SP = ''
  const h = html(<Help />)
  has(h, 'Getting started', 'Sales and receipts', 'Products and stock', 'Customers', 'Suppliers', 'Money and expenses', 'Online store', 'Account and subscription', 'aria-label="Search help"', 'href="/help"', 'href="/more/support"')
  lacks(h, 'kitchen', 'Kitchen', 'catering')
})
t('remind customer: suggested overdue wording, real details, WhatsApp link with the saved phone, no send claim', () => {
  const h = html(<RemindCustomer customerName="Ada Obi" phone="08031234567" balance="12500" invoiceNumber="INV-0007" dueDate="2020-01-01" reviewTo="/more/invoices/1" onClose={() => {}} />)
  has(h, 'Remind customer', 'Ada Obi', 'Ada Stores', 'INV-0007', '12,500.00', 'still outstanding', 'href="https://wa.me/2348031234567?text=', 'Copy message', 'Open WhatsApp', 'Review first', 'does not send it for you')
})
t('remind customer: no phone means no WhatsApp button but copy still works', () => {
  const h = html(<RemindCustomer customerName="Ada" phone="" balance="500" onClose={() => {}} />)
  has(h, 'Copy message', 'no usable phone number'); lacks(h, 'Open WhatsApp')
})

// ---- Home (dashboard) with a business that has no records at all, and one with data. These are the shapes the server returns. ----
const money0 = 0
const emptyOverview = (fin) => ({
  financial: fin,
  current: { from: '2026-11-23', to: '2026-11-23', financial: fin, salesTotal: 0, salesCount: 0, discounts: fin ? 0 : null, costOfGoods: fin ? 0 : null, estimatedGrossProfit: fin ? 0 : null,
    expensesTotal: fin ? 0 : null, estimatedOperatingProfit: fin ? 0 : null, moneyReceived: fin ? 0 : null, moneyReceivedFromSales: fin ? 0 : null, repaymentsReceived: fin ? 0 : null,
    customersOweYou: fin ? 0 : null, inventoryValue: fin ? 0 : null, lowStockCount: 0, headline: { today: 0, last7Days: 0, thisMonth: 0 }, daily: [{ date: '2026-11-23', sales: 0, expenses: fin ? 0 : null, grossProfit: fin ? 0 : null }],
    stockHealth: { outOfStock: 0, lowStock: 0, healthy: 0 }, paymentBreakdown: [], topProducts: [], salesByCategory: [], slowMoving: [], recentSales: [], totalProducts: 0, suppliersYouOwe: fin ? 0 : null },
  comparison: { available: false, from: '2026-11-22', to: '2026-11-22', sales: null, moneyReceived: null, grossProfit: null, expenses: null },
  trend: { daily: [{ date: '2026-11-23', current: 0, previous: null }], weekly: [], monthly: [] },
  bestProducts: [], bestCustomers: [], customersServed: 0,
  payments: fin ? { methods: [], received: 0, notYetPaid: 0 } : null,
  expenses: fin ? { total: 0, categories: [], recent: [] } : null,
  stock: { totalProducts: 0, lowStock: 0, outOfStock: 0, attention: [], recentReceipts: [] },
  debts: fin ? { customersOweYou: 0, customersOwing: 0, oldestUnpaidCreditDays: null, youOweSuppliers: 0, suppliersOwed: 0, invoicesOutstanding: 0, invoicesOpen: 0, invoicesOverdue: 0, invoicesOverdueCount: 0 } : null,
  costDataComplete: true, recent: [],
})
for (const [name, fin] of [['owner (financial)', true], ['cashier-level (no financial)', false]]) {
  t('Home renders for a business with no records, ' + name, () => {
    STATE.perms = new Set(fin ? ['DASHBOARD_VIEW', 'DASHBOARD_FINANCIAL'] : ['DASHBOARD_VIEW']); STATE.features = new Set()
    for (const range of ['today', 'yesterday', 'thisWeek', 'thisMonth']) {
      globalThis.__SP = 'range=' + range; DATA['/dashboard/overview'] = emptyOverview(fin)
      const h = html(<Home />)
      has(h, 'How your business is doing'); lacks(h, 'NaN', 'undefined', 'null', 'Something went wrong')
    }
  })
}
t('Home shows unpaid invoices only when there are some', () => {
  STATE.perms = new Set(['DASHBOARD_VIEW', 'DASHBOARD_FINANCIAL']); globalThis.__SP = 'range=today'
  const o = emptyOverview(true); DATA['/dashboard/overview'] = o; lacks(html(<Home />), 'Unpaid invoices')
  o.debts = { ...o.debts, invoicesOutstanding: 6000, invoicesOpen: 2, invoicesOverdue: 2500, invoicesOverdueCount: 1 }
  has(html(<Home />), 'Unpaid invoices', '2 invoices', '1 overdue')
})


// ---- Pricing page: the four plans exactly as the server sends them (V31) ----
import { PlanCards, CompareTable } from '../../src/pages/Pricing.jsx'
import UpgradeNote from '../../src/widgets/UpgradeNote.jsx'
const F = ['POS', 'BASIC_INVENTORY', 'EXPENSES', 'BASIC_DASHBOARD', 'CUSTOMER_CREDIT', 'STOCK_HISTORY']
const ESS = [...F, 'WHATSAPP_REMINDERS', 'CASH_ACCOUNTS', 'SUPPLIER_BALANCES']
const GRO = [...ESS, 'DATA_EXPORT', 'ASK_SHOPSCALE', 'BEST_SELLING_PRODUCTS', 'BEST_SELLING_CUSTOMERS', 'ACTIVITY_HISTORY', 'STOREFRONT', 'ONLINE_ORDERS']
const PLANS = [
  { code: 'FREE', name: 'Free', monthlyPrice: 0, annualPrice: 0, maxUsers: 1, maxLocations: 1, maxItems: 10, maxCustomers: 10, maxExpenses: 10, maxSuppliers: 0, maxWhatsappReminders: 0, expensePeriod: 'TOTAL', recommended: false, features: F },
  { code: 'ESSENTIAL', name: 'Essential', monthlyPrice: 4999, annualPrice: 49990, maxUsers: 2, maxLocations: 1, maxItems: 50, maxCustomers: 50, maxExpenses: 50, maxSuppliers: 10, maxWhatsappReminders: 20, expensePeriod: 'MONTH', recommended: false, features: ESS },
  { code: 'GROWTH', name: 'Growth', monthlyPrice: 14999, annualPrice: 149990, maxUsers: 5, maxLocations: 2, maxItems: 200, maxCustomers: null, maxExpenses: null, maxSuppliers: 50, maxWhatsappReminders: 50, expensePeriod: 'TOTAL', recommended: true, features: GRO },
  { code: 'BUSINESS', name: 'Business', monthlyPrice: 24999, annualPrice: 249990, maxUsers: 10, maxLocations: 5, maxItems: null, maxCustomers: null, maxExpenses: null, maxSuppliers: null, maxWhatsappReminders: null, expensePeriod: 'TOTAL', recommended: false, features: [...GRO, 'CUSTOM_DOMAINS'] },
]
const cardOf = (h, name) => { const parts = h.split('<section'); return parts.find((p) => p.includes('<h2>' + name + '</h2>')) || '' }
t('pricing cards: exact allowances per plan, Growth recommended', () => {
  const h = html(<PlanCards plans={PLANS} annual={false} />)
  const free = cardOf(h, 'Free'), ess = cardOf(h, 'Essential'), gro = cardOf(h, 'Growth'), biz = cardOf(h, 'Business')
  has(free, '1 user', 'Up to 10 active products', 'Up to 10 customers', 'Up to 10 expense records', 'No supplier records', 'No WhatsApp invoice reminders')
  lacks(free, 'Ask ShopScale', 'CSV data export', 'Activity history', 'Best-selling', 'per month</li>')
  has(ess, '2 users', 'Up to 50 active products', 'Up to 50 customers', 'Up to 50 expense records per month', 'Up to 10 suppliers', '20 WhatsApp invoice reminders per month', 'Cash and bank accounts', 'Supplier balances')
  lacks(ess, 'Ask ShopScale', 'CSV data export', 'Activity history', 'Best-selling', 'Online storefront')
  has(gro, '5 users', 'Up to 200 active products', 'Unlimited customers', 'Unlimited expense records', 'Up to 50 suppliers', '50 WhatsApp invoice reminders per month',
    'Ask ShopScale', 'CSV data export', 'Best-selling product reports', 'Best-selling customer reports', 'Online order management', 'Online storefront', 'Activity history', 'Recommended', 'pop')
  has(biz, '10 users', 'Unlimited active products', 'Unlimited customers', 'Unlimited expense records', 'Unlimited suppliers', 'Unlimited WhatsApp invoice reminders')
  lacks(biz, 'Recommended')
})
t('pricing cards: prices monthly and yearly', () => {
  has(html(<PlanCards plans={PLANS} annual={false} />), '₦4,999', '₦14,999', '₦24,999')
  has(html(<PlanCards plans={PLANS} annual={true} />), '₦49,990', '₦149,990', '₦249,990')
})
t('compare table: allowances and the new feature rows agree with the plans', () => {
  const h = html(<CompareTable plans={PLANS} />)
  has(h, 'WhatsApp invoice reminders', 'None', '20 per month', '50 per month', 'Unlimited*', '50 per month', 'Best-selling product reports', 'Best-selling customer reports', 'Ask ShopScale', 'CSV data export', 'Activity history')
  const row = (label) => { const r = h.split('<tr>').find((x) => x.includes('>' + label + '<')) || ''; return r }
  has(row('Expense records'), '>10<', '50 per month', 'Unlimited*')
  has(row('Suppliers'), 'None', '>10<', '>50<', 'Unlimited*')
  const ask = row('Ask ShopScale (business questions answered from your records)')
  if ((ask.match(/aria-label="Included"/g) || []).length !== 2) throw new Error('Ask ShopScale should be included on exactly Growth and Business')
  const exp = row('CSV data export'); if ((exp.match(/aria-label="Included"/g) || []).length !== 2) throw new Error('CSV export should be on exactly Growth and Business')
  const act = row('Activity history'); if ((act.match(/aria-label="Included"/g) || []).length !== 2) throw new Error('Activity history should be on exactly Growth and Business')
})
t('upgrade note points at the plans', () => { has(html(<UpgradeNote title="CSV export is on Growth and Business">Not in your plan.</UpgradeNote>), 'CSV export is on Growth and Business', 'href="/more/plan"') })

console.log(`${n - fail}/${n} passed`)
process.exit(fail ? 1 : 0)
