import { ClipboardList, ChefHat, UtensilsCrossed, Trash2, BarChart3, Croissant } from 'lucide-react'

const MENU_BUSINESS = ['RESTAURANT']
const MAKERS = ['RESTAURANT', 'PRODUCTION']

export default {
  id: 'restaurant',
  routes: [
    { path: 'orders', component: () => import('../../pages/restaurant/Orders.jsx') },
    { path: 'kitchen', component: () => import('../../pages/restaurant/Kitchen.jsx') },
    { path: 'more/menu', component: () => import('../../pages/restaurant/Menu.jsx') },
    { path: 'more/wastage', component: () => import('../../pages/restaurant/Wastage.jsx') },
    { path: 'more/production', component: () => import('../../pages/restaurant/Production.jsx') },
    { path: 'more/restaurant-reports', component: () => import('../../pages/restaurant/RestaurantReports.jsx') },
  ],
  nav: [
    { to: '/orders', label: 'Orders', hint: 'Tables, takeaway and payment', icon: ClipboardList, permission: 'SALES_CREATE', workflow: MENU_BUSINESS, feature: 'RESTAURANT', placement: 'bar', order: 10 },
    { to: '/kitchen', label: 'Kitchen', hint: 'What to cook now', icon: ChefHat, permission: 'KITCHEN_VIEW', workflow: MENU_BUSINESS, feature: 'RESTAURANT', placement: 'bar', order: 11 },
    { to: '/more/menu', label: 'Menu and tables', hint: 'Dishes, prices, recipes, options, tables', icon: UtensilsCrossed, permission: ['PRODUCTS_VIEW', 'TABLES_MANAGE'], workflow: MENU_BUSINESS, feature: 'RESTAURANT', order: 20 },
    { to: '/more/production', label: 'Production', hint: 'Record what you baked or made', icon: Croissant, permission: 'PRODUCTION_MANAGE', workflow: 'PRODUCTION', feature: 'PRODUCTION', order: 21 },
    { to: '/more/wastage', label: 'Wastage', hint: 'Food and ingredients thrown away', icon: Trash2, permission: 'STOCK_WASTAGE', workflow: MAKERS, feature: 'WASTAGE', order: 22 },
    { to: '/more/restaurant-reports', label: 'Kitchen reports', hint: 'Best sellers, orders, ingredients used', icon: BarChart3, permission: 'REPORTS_SALES', workflow: MAKERS, order: 23 },
  ],
}
