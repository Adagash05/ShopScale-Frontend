import React from 'react'
import { renderToString } from 'react-dom/server'
import * as P1 from '../../src/superadmin/Pages1.jsx'
import * as P2 from '../../src/superadmin/Pages2.jsx'
import { adminSession, isSuperAdminPath } from '../../src/superadmin/adminSession.js'
import { bytes, num } from '../../src/superadmin/kit.jsx'
let fail = 0
const t = (name, fn) => { try { const r = fn(); console.log('PASS ' + name + (r ? ' ' + r : '')) } catch (e) { fail++; console.log('FAIL ' + name + ': ' + e.message) } }
const has = (el, ...s) => { const h = renderToString(el); for (const x of s) if (!h.includes(x)) throw new Error('missing "' + x + '"'); return '' }
t('Overview shows real figures and labels expected MRR as an estimate', () => has(<P1.Overview />, 'Collected this month', '₦51,000', 'Expected monthly recurring', 'Not money received'))
t('Businesses list', () => has(<P1.Businesses />, 'Ada Stores', 'ada@x.com', 'GROWTH'))
t('Business detail', () => has(<P1.BusinessDetail />, 'Ada Stores', 'Suspend', 'Referred by partner', 'Administrative history'))
t('Users list', () => has(<P1.Users />, 'Ada O', 'Ada Stores (OWNER)'))
t('User detail', () => has(<P1.UserDetail />, 'Send password reset', 'Open partner'))
t('Subscriptions', () => has(<P1.Subscriptions />, 'Ada Stores', 'GROWTH'))
t('Transactions (collected vs failed, no card data)', () => has(<P1.Transactions />, 'Collected, all time', 'SS-1', 'Verified successful payments only'))
t('Support list', () => has(<P2.Support />, 'Charged twice', 'High'))
t('Ticket detail (internal note flagged)', () => has(<P2.TicketDetail />, 'Charged twice', 'Internal, not visible to the merchant', 'Assign to me'))
t('Announcements', () => has(<P2.Announcements />, 'Maintenance', 'Publish'))
t('Audit logs', () => has(<P2.AuditLogs />, 'BUSINESS_SUSPENDED', 'cannot be edited or deleted'))
t('Settings has no secret fields', () => { has(<P2.PlatformSettings />, 'Platform name', 'never stored'); const h = renderToString(<P2.PlatformSettings />); if (/api key|secret key/i.test(h.replace('API keys, passwords and other secrets are never stored or shown here.', ''))) throw new Error('secret field') })
t('Partner directory', () => has(<P2.PartnerDirectory />, 'Tolu', 'New partner', 'Delete'))
t('Storage: unconfigured is stated clearly, no delete-all', () => { has(<P2.Storage />, 'Not configured', 'CLOUDFLARE_R2_ACCOUNT_ID', 'Roll back a batch', 'Find images'); if (/delete all/i.test(renderToString(<P2.Storage />))) throw new Error('delete-all present') })
t('helpers', () => { if (bytes(2048) !== '2.0 KB' || bytes(5) !== '5 B' || num(1234) !== '1,234') throw new Error('format') })
t('console path detection', () => { if (!isSuperAdminPath('/super-admin') || !isSuperAdminPath('/super-admin/users') || isSuperAdminPath('/super-administrator') || isSuperAdminPath('/dashboard')) throw new Error('paths') })
t('session store: set, get, expiry, clear', () => {
  const store = {}; globalThis.sessionStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v }, removeItem: (k) => { delete store[k] } }
  adminSession.set({ token: 'tkn', expiresAt: new Date(Date.now() + 60000).toISOString() })
  if (adminSession.get()?.token !== 'tkn') throw new Error('get')
  adminSession.clear(); if (adminSession.get() !== null) throw new Error('clear')
  adminSession.set({ token: 'old', expiresAt: new Date(Date.now() - 1000).toISOString() }); if (adminSession.get() !== null) throw new Error('expired token must read as signed out')
  adminSession.clear(); if (store['shopscale.superadmin.session'] !== undefined) throw new Error('not removed')
})
process.exit(fail ? 1 : 0)
