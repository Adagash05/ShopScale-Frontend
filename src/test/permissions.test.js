import { describe, expect, it } from 'vitest'
import { describeActivity, groupPermissions, roleGrantable, timeAgo } from '../lib/permissions.js'

const catalogue = [
  { module: 'Sales and POS', permissions: [{ key: 'SALES_CREATE', label: 'Record sales' }, { key: 'SALES_REFUND', label: 'Refund sales' }] },
  { module: 'Kitchen', permissions: [{ key: 'KITCHEN_VIEW', label: 'View kitchen orders' }] },
]

describe('permission helpers', () => {
  it('only offers roles that need no more access than you have', () => {
    const manager = new Set(['SALES_CREATE', 'SALES_REFUND'])
    expect(roleGrantable(manager, { permissions: ['SALES_CREATE'] })).toBe(true)
    expect(roleGrantable(manager, { permissions: ['SALES_CREATE', 'KITCHEN_VIEW'] })).toBe(false)
    expect(roleGrantable(new Set(), { permissions: ['SALES_CREATE'] })).toBe(false)
  })

  it('groups chosen permissions by module and drops empty modules', () => {
    const g = groupPermissions(['SALES_CREATE'], catalogue)
    expect(g).toHaveLength(1)
    expect(g[0].module).toBe('Sales and POS')
    expect(g[0].items.map((i) => i.label)).toEqual(['Record sales'])
    expect(groupPermissions([], catalogue)).toEqual([])
  })

  it('describes real events in plain words', () => {
    expect(describeActivity({ action: 'SALE_CREATED' })[0]).toBe('Sale recorded')
    expect(describeActivity({ action: 'TEAM_INVITED' })[0]).toBe('Staff member invited')
    expect(describeActivity({ action: 'STOCK_RESTOCK' })[0]).toBe('Stock updated')
    expect(describeActivity({ action: 'SOMETHING_NEW' })[0]).toBe('something new')
  })

  it('shows friendly relative times', () => {
    const now = new Date('2026-06-10T12:00:00Z')
    expect(timeAgo('2026-06-10T11:59:50Z', now)).toBe('Just now')
    expect(timeAgo('2026-06-10T11:30:00Z', now)).toBe('30 min ago')
    expect(timeAgo('2026-06-10T09:00:00Z', now)).toBe('3 h ago')
    expect(timeAgo('2026-06-08T12:00:00Z', now)).toBe('2 d ago')
  })
})
