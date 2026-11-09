import { lazy } from 'react'

/**
 * Feature modules register themselves by default-exporting from src/modules/<name>/index.js:
 *   export default {
 *     id: 'finance',
 *     routes: [{ path: 'more/accounts', component: () => import('../../pages/finance/Accounts.jsx') }],   // path is relative to the app shell
 *     nav: [{ to: '/more/accounts', label: 'Cash and bank', hint: '…', icon: Landmark,
 *             permission: 'CASH_MANAGE',      // optional: needs this permission
 *             feature: 'CASH_ACCOUNTS',       // optional: needs this plan feature
 *             workflow: 'RESTAURANT',         // optional: needs this business workflow (string or array = any of)
 *             placement: 'more' | 'bar',      // 'more' = the More menu (default), 'bar' = main navigation
 *             order: 50 }],
 *   }
 * App.jsx and More.jsx read this registry, so adding a module never requires editing them.
 */
const found = import.meta.glob('./*/index.js', { eager: true })

export const modules = Object.values(found).map((m) => m.default).filter(Boolean)

export const moduleRoutes = modules.flatMap((m) =>
  (m.routes || []).map((r) => ({ path: r.path, Component: lazy(r.component) })),
)

export function moduleNav(placement = 'more') {
  return modules
    .flatMap((m) => m.nav || [])
    .filter((n) => (n.placement || 'more') === placement)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
}

/** True when the nav item is allowed for this user, plan and business configuration. */
export function allowed(item, { can, hasFeature, hasWorkflow }) {
  if (item.permission) {
    const need = Array.isArray(item.permission) ? item.permission : [item.permission]
    if (!need.some((p) => can(p))) return false
  }
  if (item.feature && !hasFeature(item.feature)) return false
  if (item.workflow) {
    const need = Array.isArray(item.workflow) ? item.workflow : [item.workflow]
    if (!need.some((w) => hasWorkflow(w))) return false
  }
  return true
}
