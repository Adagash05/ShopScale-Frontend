import React from 'react'
import { renderToString } from 'react-dom/server'
import AskShopScale from '../../src/pages/AskShopScale.jsx'
import Help from '../../src/pages/Help.jsx'
import RemindCustomer from '../../src/pages/invoices/RemindCustomer.jsx'
import { STATE } from './auth_mock.jsx'
import { DATA } from './api_mock.js'
let fail = 0, n = 0
const t = (name, fn) => { n++; try { fn(); console.log('PASS ' + name) } catch (e) { fail++; console.log('FAIL ' + name + ': ' + e.message) } }
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
  has(h, 'Ask ShopScale is on the Essential plan and above', 'href="/more/plan"', 'See plans'); lacks(h, 'What were my sales?')
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

console.log(`${n - fail}/${n} passed`)
process.exit(fail ? 1 : 0)
