import React from 'react'
import { renderToString } from 'react-dom/server'
import CateringHome from '../../src/pages/catering/CateringHome.jsx'
import Events from '../../src/pages/catering/Events.jsx'
import Packages from '../../src/pages/catering/Packages.jsx'
import EventDetail from '../../src/pages/catering/EventDetail.jsx'
import Kitchen from '../../src/pages/restaurant/Kitchen.jsx'
import { PERMS } from './auth_mock.jsx'
import { allowed } from '../../src/modules/registry.js'
import cateringMod from '../../src/modules/catering/index.js'
import restaurantMod from '../../src/modules/restaurant/index.js'
let fail = 0, n = 0
const t = (name, fn) => { n++; try { fn(); console.log('PASS ' + name) } catch (e) { fail++; console.log('FAIL ' + name + ': ' + e.message) } }
const html = (el) => renderToString(el).replace(/<!-- -->/g, '')
const has = (h, ...s) => { for (const x of s) if (!h.includes(x)) throw new Error('missing "' + x + '"') }
const lacks = (h, ...s) => { for (const x of s) if (h.includes(x)) throw new Error('should not show "' + x + '"') }
const as = (perms, status, extra) => { PERMS.current = new Set(perms); globalThis.__status = status; globalThis.__extra = extra }
const MGR = ['CATERING_VIEW', 'CATERING_MANAGE', 'STOCK_WASTAGE', 'KITCHEN_STATUS_UPDATE']

as(MGR); t('catering dashboard shows counts, money and lists', () => has(html(<CateringHome />), 'Waiting for a decision', 'Customers still owe', '₦900,000', 'Church dinner', 'New enquiry'))
as(['CATERING_VIEW']); t('view-only user gets no "New enquiry" button', () => lacks(html(<CateringHome />), 'New enquiry'))
as(MGR); t('events list has status filters and rows', () => has(html(<Events />), 'Quotation sent', 'In preparation', 'Church dinner', 'owes'))
as(MGR); t('packages show price, ingredient cost and manage buttons', () => has(html(<Packages />), 'Wedding Gold', 'per guest', 'Ingredient cost about', 'New package', 'New service', 'Waiters'))
as(['CATERING_VIEW']); t('packages are read-only without manage permission', () => lacks(html(<Packages />), 'New package', 'Edit'))
as(MGR, 'ENQUIRY'); t('enquiry: can send quote / confirm / edit / cancel, no prep tab', () => { const h = html(<EventDetail />); has(h, 'Send quotation', 'Confirm booking', 'Edit details and price', 'Cancel'); lacks(h, 'Preparation<', 'Start preparation') })
as(MGR, 'BOOKED'); t('booked: start preparation offered, no send quotation', () => { const h = html(<EventDetail />); has(h, 'Start preparation', 'Ade wedding', '₦520,000'); lacks(h, 'Send quotation', 'Confirm booking') })
as(MGR, 'IN_PREPARATION'); t('in preparation: tabs, ready + complete actions', () => { const h = html(<EventDetail />); has(h, 'Food is ready', 'Complete event', 'Preparation', 'Costs and profit') })
as(MGR, 'COMPLETED'); t('completed: no lifecycle buttons', () => lacks(html(<EventDetail />), 'Food is ready', 'Start preparation', 'Complete event', '>Cancel<'))
as(MGR, 'CANCELLED'); t('cancelled shows the reason and no actions', () => { const h = html(<EventDetail />); has(h, 'Cancelled: Venue changed'); lacks(h, 'Confirm booking', '>Cancel<') })
as(['CATERING_VIEW'], 'BOOKED'); t('view-only user sees no action buttons', () => lacks(html(<EventDetail />), 'Start preparation', 'Edit details', '>Cancel<'))
as(['CATERING_VIEW'], 'BOOKED', { showMoney: false, quote: null, payments: [], summary: null }); t('money is hidden when the server redacts it', () => { const h = html(<EventDetail />); lacks(h, 'Payments<', 'Costs and profit', 'Total', '₦') })
as(['KITCHEN_VIEW', 'KITCHEN_STATUS_UPDATE', 'KITCHEN_MARK_READY', 'SALES_VOID', 'STOCK_WASTAGE']); t('kitchen ticket shows items, modifiers, notes, elapsed and actions', () => has(html(<Kitchen />), '2 × Jollof rice', 'Extra chicken', 'No pepper', 'Allergy: nuts', 'Ready', 'Cancel', 'Being made', '#7'))
as(['KITCHEN_VIEW']); t('kitchen with view only has no status buttons', () => lacks(html(<Kitchen />), '>Start<', '>Served<'))
const ctx = (perms, workflows = ['RESTAURANT', 'CATERING', 'PRODUCTION']) => ({ can: (p) => perms.includes(p), hasFeature: () => true, hasWorkflow: (w) => workflows.includes(w) })
t('nav: catering item respects permission and workflow', () => {
  const item = cateringMod.nav.find((i) => i.to === '/events')
  if (!allowed(item, ctx(['CATERING_VIEW']))) throw new Error('should be allowed')
  if (allowed(item, ctx([]))) throw new Error('allowed without permission')
  if (allowed(item, ctx(['CATERING_VIEW'], ['RETAIL']))) throw new Error('allowed for a retail business')
})
t('nav: kitchen/orders only for restaurant workflow', () => {
  for (const to of ['/orders', '/kitchen']) { const item = restaurantMod.nav.find((i) => i.to === to); if (allowed(item, ctx(['SALES_CREATE', 'KITCHEN_VIEW'], ['RETAIL']))) throw new Error(to + ' visible to retail') ; if (!allowed(item, ctx(['SALES_CREATE', 'KITCHEN_VIEW'], ['RESTAURANT']))) throw new Error(to + ' hidden from restaurant') }
})
console.log(`${n - fail}/${n} passed`)
process.exit(fail ? 1 : 0)
