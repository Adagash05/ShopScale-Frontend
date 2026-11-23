import { describe, expect, it } from 'vitest'
import { changeInfo, labelIndexes, nearestIndex, niceScale } from '../lib/chartMath.js'
import { trendPoints } from '../lib/trend.js'

describe('chart maths', () => {
  it('niceScale gives round ticks that cover the maximum', () => {
    const s = niceScale(8300)
    expect(s.max).toBeGreaterThanOrEqual(8300)
    expect(s.ticks[0]).toBe(0)
    expect(s.ticks.at(-1)).toBe(s.max)
  })
  it('niceScale copes with all zeros', () => { expect(niceScale(0).max).toBe(1) })
  it('labelIndexes keeps first and last and never exceeds max', () => {
    const i = labelIndexes(30, 5)
    expect(i[0]).toBe(0); expect(i.at(-1)).toBe(29); expect(i.length).toBeLessThanOrEqual(5)
    expect(labelIndexes(3, 5)).toEqual([0, 1, 2]); expect(labelIndexes(0)).toEqual([])
  })
  it('nearestIndex clamps to the data', () => {
    expect(nearestIndex(-50, 40, 400, 10)).toBe(0)
    expect(nearestIndex(900, 40, 400, 10)).toBe(9)
    expect(nearestIndex(240, 40, 400, 11)).toBe(5)
  })
  it('changeInfo shows nothing when there is no percentage', () => {
    expect(changeInfo(null)).toBeNull()
    expect(changeInfo(12.5)).toMatchObject({ dir: 'up' })
    expect(changeInfo(-3)).toMatchObject({ dir: 'down' })
    expect(changeInfo(0)).toMatchObject({ dir: 'flat' })
  })
  it('trendPoints carries the previous period only on the day view', () => {
    const t = { daily: [{ date: '2026-11-01', sales: 100, previousSales: 80 }, { date: '2026-11-02', sales: 50, previousSales: null }], weekly: [{ start: '2026-10-26', end: '2026-11-01', total: 100 }], monthly: [] }
    const d = trendPoints(t, 'day')
    expect(d[0].previous).toBe(80); expect(d[1].previous).toBeNull()
    expect(trendPoints(t, 'week')[0].previous).toBeUndefined()
  })
})
