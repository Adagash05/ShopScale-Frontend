import { Store, ShoppingBasket, MessageSquare } from 'lucide-react'

export default {
  id: 'store',
  routes: [
    { path: 'more/store', component: () => import('../../pages/store/StoreSettings.jsx') },
    { path: 'more/store-inbox', component: () => import('../../pages/store/StoreInbox.jsx') },
    { path: 'more/store-orders', component: () => import('../../pages/store/StoreOrders.jsx') },
  ],
  nav: [
    { to: '/more/store-orders', label: 'Online orders', hint: 'Orders from your store', icon: ShoppingBasket, permission: 'STORE_ORDERS_MANAGE', feature: 'STOREFRONT', order: 12 },
    { to: '/more/store-inbox', label: 'Store inbox', hint: 'Reviews, enquiries and subscribers', icon: MessageSquare, permission: 'STORE_ORDERS_MANAGE', feature: 'STOREFRONT', order: 12.5 },
    { to: '/more/store', label: 'Online store', hint: 'Store settings and payments', icon: Store, permission: 'STORE_VIEW', order: 13 },
  ],
}
