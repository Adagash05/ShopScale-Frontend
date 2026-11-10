import { MapPin, ArrowLeftRight, ClipboardList } from 'lucide-react'

export default {
  id: 'foundation',
  routes: [
    { path: 'more/branches', component: () => import('../../pages/Branches.jsx') },
    { path: 'more/orders', component: () => import('../../pages/Purchases.jsx') },
    { path: 'more/transfers', component: () => import('../../pages/Transfers.jsx') },
  ],
  nav: [
    { to: '/more/orders', label: 'Supplier orders', hint: 'Order stock and receive deliveries', icon: ClipboardList, permission: 'PURCHASES_VIEW', feature: 'PURCHASING', order: 31 },
    { to: '/more/branches', label: 'Locations', hint: 'Your shops and branches', icon: MapPin, permission: 'LOCATIONS_MANAGE', order: 90 },
    { to: '/more/transfers', label: 'Stock transfers', hint: 'Move stock between branches', icon: ArrowLeftRight, permission: 'STOCK_TRANSFER', feature: 'BRANCH_TRANSFERS', order: 32 },
  ],
}
