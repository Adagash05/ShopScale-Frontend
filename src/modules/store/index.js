import { Store, ShoppingBasket } from 'lucide-react'

export default {
  id: 'store',
  routes: [
    { path: 'more/store', component: () => import('../../pages/store/StoreSettings.jsx') },
    { path: 'more/store-orders', component: () => import('../../pages/store/StoreOrders.jsx') },
  ],
  nav: [
    { to: '/more/store-orders', label: 'Online orders', hint: 'Orders from your store', icon: ShoppingBasket, permission: 'STORE_ORDERS_MANAGE', feature: 'STOREFRONT', order: 12 },
    { to: '/more/store', label: 'Online store', hint: 'Store settings and payments', icon: Store, permission: 'STORE_VIEW', order: 13 },
  ],
}
