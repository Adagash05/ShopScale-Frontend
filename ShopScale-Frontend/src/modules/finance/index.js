import { Landmark, LineChart, Clock } from 'lucide-react'

export default {
  id: 'finance',
  routes: [
    { path: 'more/accounts', component: () => import('../../pages/finance/Accounts.jsx') },
    { path: 'more/money', component: () => import('../../pages/finance/Overview.jsx') },
    { path: 'more/shifts', component: () => import('../../pages/finance/Shifts.jsx') },
  ],
  nav: [
    { to: '/more/money', label: 'Money overview', hint: 'Money in, money out, who owes whom', icon: LineChart, permission: 'FINANCE_OVERVIEW', order: 20 },
    { to: '/more/accounts', label: 'Cash and bank', hint: 'Balances and moving money', icon: Landmark, permission: 'CASH_ACCOUNTS_MANAGE', feature: 'CASH_ACCOUNTS', order: 21 },
    { to: '/more/shifts', label: 'Cashier shifts', hint: 'Open, close and check the till', icon: Clock, permission: ['SHIFTS_MANAGE', 'SHIFTS_RECONCILE'], order: 22 },
  ],
}
