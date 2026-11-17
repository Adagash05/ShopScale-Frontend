const quote = { basePrice: '0', pricePerGuest: '5000', billedGuests: 100, packageTotal: '500000', services: [{ id: 's1', name: 'Waiters', basis: 'FIXED', unitPrice: '30000', quantity: 1, lineTotal: '30000' }], servicesTotal: '30000', discount: '10000', total: '520000' }
export const EVENT = (status, extra = {}) => ({ id: 'abc', number: 12, title: 'Ade wedding', customerId: null, customerName: 'Mrs Ade', customerPhone: '0803', venue: 'Eko Hall', eventDate: '2026-12-20', startTime: '14:00:00', guests: 100,
  requirements: 'No pork', status, packageId: 'p1', packageName: 'Wedding Gold', quote, depositRequired: '200000', quoteValidUntil: '2026-12-01', received: '200000', balance: '320000', stockIssued: false,
  createdAt: '2026-11-01T10:00:00Z', confirmedAt: null, completedAt: null, cancelReason: status === 'CANCELLED' ? 'Venue changed' : null,
  payments: [{ id: 'pay1', kind: 'PAYMENT', method: 'TRANSFER', amount: '200000', note: 'Deposit', createdAt: '2026-11-02T10:00:00Z' }],
  tasks: [{ id: 't1', title: 'Buy rice', done: true, doneAt: null }, { id: 't2', title: 'Hire chairs', done: false, doneAt: null }],
  plan: [{ variantId: 'v1', name: 'Rice', unit: 'kg', planned: '30', issued: '0', extra: '0', returned: '0', wasted: '0', used: '0', onHand: '10', unitCost: '1500' }],
  costs: [{ id: 'c1', category: 'Transport', description: 'Van', amount: '15000', estimated: false, createdAt: '2026-11-03T10:00:00Z' }],
  summary: { revenue: '520000', received: '200000', balance: '320000', estimatedIngredients: '45000', estimatedOther: '0', estimatedCost: '45000', actualIngredients: '0', actualOther: '15000', actualCost: '15000', estimatedProfit: '475000', grossProfit: '505000', marginPercent: '97.1' },
  showMoney: true, ...extra })
const row = (s) => ({ id: 'e' + s, number: 3, title: 'Church dinner', customerName: 'Pastor Bode', venue: 'Hall', eventDate: '2026-12-01', guests: 80, status: s, total: '300000', received: '100000', balance: '200000' })
export const FIX = (path, q) => {
  if (path === '/catering/dashboard') return { upcoming: [row('BOOKED')], pending: [row('ENQUIRY')], pendingCount: 4, bookedCount: 6, inPreparationCount: 2, readyCount: 1, completedThisMonth: 5, outstanding: '900000', receivedThisMonth: '1200000', profitThisMonth: '700000', revenueThisMonth: '1500000', showMoney: true }
  if (path === '/catering/events') return [row('QUOTED'), row('BOOKED')]
  if (path.startsWith('/catering/events/')) return EVENT(globalThis.__status || 'BOOKED', globalThis.__extra || {})
  if (path === '/catering/packages') return [{ id: 'p1', name: 'Wedding Gold', description: '', inclusions: 'Jollof, chicken', basePrice: '0', pricePerGuest: '5000', minGuests: 50, active: true, costPerGuest: '450', lines: [{ variantId: 'v1', name: 'Rice', unit: 'kg', qtyPerGuest: '0.3', costPerGuest: '450' }] }]
  if (path === '/catering/services') return [{ id: 's1', name: 'Waiters', description: '', price: '30000', basis: 'FIXED', active: true }]
  if (path === '/restaurant/kitchen') return [{ id: 'k1', number: 7, tableName: 'Table 4', orderType: 'DINE_IN', stage: 'PREPARING', createdAt: new Date(Date.now() - 9 * 60000).toISOString(), acceptedAt: null, paymentStatus: 'PAID', note: 'Allergy: nuts',
    items: [{ id: 'i1', name: 'Jollof rice', quantity: 2, status: 'PREPARING', modifiers: ['Extra chicken'], note: 'No pepper' }, { id: 'i2', name: 'Chapman', quantity: 1, status: 'READY', modifiers: [], note: null }] }]
  return null
}
