import { Bell, History, CloudOff, Download } from 'lucide-react'

export default {
  id: 'ops',
  routes: [
    { path: 'more/notifications', component: () => import('../../pages/ops/Notifications.jsx') },
    { path: 'more/pending-sales', component: () => import('../../pages/PendingSales.jsx') },
    { path: 'more/export', component: () => import('../../pages/ops/Export.jsx') },
    { path: 'more/activity', component: () => import('../../pages/ops/Activity.jsx') },
  ],
  nav: [
    { to: '/more/notifications', label: 'Notifications', hint: 'Alerts about your business', icon: Bell, order: 5 },
    { to: '/more/pending-sales', label: 'Sales saved offline', hint: 'Waiting to be sent', icon: CloudOff, order: 6 },
    { to: '/more/export', label: 'Export data', hint: 'Download CSV files', icon: Download, permission: 'DATA_EXPORT', feature: 'DATA_EXPORT', order: 80 },
    { to: '/more/activity', label: 'Activity history', hint: 'Who did what', icon: History, permission: 'ACTIVITY_VIEW', order: 90 },
  ],
}
