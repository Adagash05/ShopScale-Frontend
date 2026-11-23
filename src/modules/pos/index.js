import { FileText, ClipboardCheck, BarChart3, MessageCircleQuestion } from 'lucide-react'

export default {
  id: 'pos',
  routes: [
    { path: 'more/quotes', component: () => import('../../pages/pos/Documents.jsx').then((m) => ({ default: m.Quotes })) },
    { path: 'more/orders-in', component: () => import('../../pages/pos/Documents.jsx').then((m) => ({ default: m.Orders })) },
    { path: 'more/sales-report', component: () => import('../../pages/pos/SalesReport.jsx') },
    { path: 'more/ask', component: () => import('../../pages/AskShopScale.jsx') },
  ],
  nav: [
    { to: '/more/quotes', label: 'Quotations', hint: 'Give customers a price', icon: FileText, permission: 'QUOTES_MANAGE', order: 12 },
    { to: '/more/orders-in', label: 'Customer orders', hint: 'Orders with deposits', icon: ClipboardCheck, permission: 'QUOTES_MANAGE', order: 13 },
    { to: '/more/sales-report', label: 'Sales reports', hint: 'By employee, location, payment, channel', icon: BarChart3, permission: 'REPORTS_SALES', order: 14 },
    { to: '/more/ask', label: 'Ask ShopScale', hint: 'Plain answers about your business', icon: MessageCircleQuestion, permission: 'DASHBOARD_VIEW', order: 14.5 },
  ],
}
