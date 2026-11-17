import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Empty, ErrorBox, ListSkeleton, RangePicker, useLoad } from '../../components.jsx'
import { money, qtyText, rangeQuery } from '../../lib/format.js'
import { Kpi, DataTable } from '../../partners/ui.jsx'

const WHY = { SALE: 'Sold', WASTAGE: 'Wasted', PRODUCTION_OUT: 'Production' }

export default function RestaurantReports() {
  const [sp, setSp] = useSearchParams()
  const range = sp.get('range') || 'last7'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const ready = range !== 'custom' || (from && to)
  const rep = useLoad(() => (ready ? api.get('/restaurant/reports', rangeQuery(range, from, to)) : Promise.resolve(null)), [range, from, to])
  const d = rep.data
  const sold = d ? d.salesByItem.reduce((s, i) => s + Number(i.revenue), 0) : 0
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Kitchen reports</h1><p className="sub">What sells, how busy you are, and what you use</p></div></div>
      <RangePicker value={range} from={from} to={to} onChange={({ range: r, from: f, to: t }) => setSp(r === 'custom' ? { range: r, ...(f ? { from: f } : {}), ...(t ? { to: t } : {}) } : { range: r }, { replace: true })} />
      <ErrorBox error={rep.error} onRetry={rep.reload} />
      {rep.loading && <ListSkeleton />}
      {d && (
        <>
          <div className="kpis">
            <Kpi label="Menu sales" value={money(sold)} />
            <Kpi label="Orders" value={d.orders.total} hint={`${d.orders.cancelled} cancelled`} />
            <Kpi label="Dine in / takeaway" value={`${d.orders.dineIn} / ${d.orders.takeaway}`} hint={`${d.orders.delivery} delivery`} />
            <Kpi label="Average time to ready" value={d.orders.avgMinutesToReady == null ? '–' : `${d.orders.avgMinutesToReady} min`} />
          </div>
          <section className="section"><h2 className="section-title">Sales by menu item</h2>
            {d.salesByItem.length === 0 ? <Empty title="No menu sales in this period" /> : (
              <DataTable rows={d.salesByItem} rowKey={(r) => r.name} columns={[
                { key: 'name', label: 'Item' }, { key: 'quantity', label: 'Sold', right: true, render: (r) => qtyText(r.quantity) },
                { key: 'revenue', label: 'Sales', right: true, render: (r) => money(r.revenue) }, { key: 'profit', label: 'Profit', right: true, render: (r) => money(r.profit) },
              ]} />
            )}
          </section>
          <section className="section"><h2 className="section-title">Orders by day</h2>
            <DataTable rows={d.orders.byDay} rowKey={(r) => r.date} empty="No orders in this period." columns={[
              { key: 'date', label: 'Day' }, { key: 'orders', label: 'Orders', right: true }, { key: 'cancelled', label: 'Cancelled', right: true },
            ]} />
          </section>
          <section className="section"><h2 className="section-title">Ingredients used</h2>
            <DataTable rows={d.ingredientUse} rowKey={(r) => r.name + r.reason} empty="No ingredient use recorded. Ingredients are used up when recipes are sold, produced or wasted." columns={[
              { key: 'name', label: 'Ingredient' }, { key: 'reason', label: 'For', render: (r) => WHY[r.reason] || r.reason },
              { key: 'quantity', label: 'Used', right: true, render: (r) => `${qtyText(r.quantity)} ${r.unit || ''}` }, { key: 'cost', label: 'Cost', right: true, render: (r) => money(r.cost) },
            ]} />
          </section>
        </>
      )}
    </div>
  )
}
