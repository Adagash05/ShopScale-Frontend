import { Tags } from 'lucide-react'

export default {
  id: 'pricing',
  routes: [{ path: 'more/pricing', component: () => import('../../pages/pricing/Pricing.jsx') }],
  nav: [{ to: '/more/pricing', label: 'Wholesale prices', hint: 'Tiers, bulk and customer prices', icon: Tags, permission: 'PRICING_MANAGE', feature: 'WHOLESALE_PRICING', order: 15 }],
}
