import { FileText } from 'lucide-react'

export default {
  id: 'invoices',
  routes: [
    { path: 'more/invoices', component: () => import('../../pages/invoices/Invoices.jsx') },
    { path: 'more/invoices/new', component: () => import('../../pages/invoices/InvoiceForm.jsx') },
    { path: 'more/invoices/:id', component: () => import('../../pages/invoices/InvoiceDetail.jsx') },
  ],
  nav: [
    { to: '/more/invoices', label: 'Invoices', hint: 'Bills for customers, PDF and WhatsApp', icon: FileText, permission: 'CUSTOMER_INVOICES_VIEW', order: 12 },
  ],
}
