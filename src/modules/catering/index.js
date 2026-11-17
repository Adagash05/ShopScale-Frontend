import { CalendarDays, Package } from 'lucide-react'

export default {
  id: 'catering',
  routes: [
    { path: 'events', component: () => import('../../pages/catering/CateringHome.jsx') },
    { path: 'events/list', component: () => import('../../pages/catering/Events.jsx') },
    { path: 'events/new', component: () => import('../../pages/catering/EventForm.jsx') },
    { path: 'events/:id', component: () => import('../../pages/catering/EventDetail.jsx') },
    { path: 'events/:id/edit', component: () => import('../../pages/catering/EventForm.jsx') },
    { path: 'more/catering-packages', component: () => import('../../pages/catering/Packages.jsx') },
  ],
  nav: [
    { to: '/events', label: 'Events', hint: 'Enquiries, bookings, payments', icon: CalendarDays, permission: 'CATERING_VIEW', workflow: 'CATERING', feature: 'CATERING', placement: 'bar', order: 10 },
    { to: '/more/catering-packages', label: 'Packages and services', hint: 'What you offer and what it costs', icon: Package, permission: 'CATERING_VIEW', workflow: 'CATERING', feature: 'CATERING', order: 20 },
  ],
}
