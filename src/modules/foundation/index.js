import { Truck, ClipboardList, MapPin } from 'lucide-react'

export default {
  id: 'foundation',
  routes: [
    { path: 'more/branches', component: () => import('../../pages/Branches.jsx') },
    { path: 'more/suppliers', component: () => import('../../pages/Suppliers.jsx') },
    { path: 'more/purchases', component: () => import('../../pages/Purchases.jsx') },
  ],
  nav: [
    { to: '/more/suppliers', label: 'Suppliers', hint: 'Who you buy from and what you owe', icon: Truck, permission: 'SUPPLIERS_MANAGE', feature: 'PURCHASING', order: 30 },
    { to: '/more/purchases', label: 'Purchases', hint: 'Orders to suppliers and goods received', icon: ClipboardList, permission: 'PURCHASES_MANAGE', feature: 'PURCHASING', order: 31 },
    { to: '/more/branches', label: 'Locations', hint: 'Your shops and branches', icon: MapPin, order: 90 },
  ],
}
