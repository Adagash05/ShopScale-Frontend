import { COLORS } from '../charts.jsx'

/** Illustrations that reuse the real interface styles. Every figure is sample data and the caption says so. */
export function DashboardPreview() {
  const bars = [38, 52, 44, 70, 62, 85, 74]
  return (
    <div className="preview" role="img" aria-label="Illustration of the ShopScale dashboard with sample figures">
      <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="kpi accent"><div className="label">Sales</div><div className="value num">₦186,500</div></div>
        <div className="kpi accent teal"><div className="label">Money received</div><div className="value num">₦164,000</div></div>
        <div className="kpi accent warn"><div className="label">Expenses</div><div className="value num">₦38,200</div></div>
        <div className="kpi accent navy"><div className="label">Estimated profit</div><div className="value num">₦61,300</div></div>
      </div>
      <div className="chart-card"><strong style={{ fontSize: 14 }}>Sales and expenses</strong>
        <div className="mini-bars">{bars.map((b, i) => <i key={i} className={i % 3 === 2 ? 't' : ''} style={{ height: `${b}%` }} />)}</div></div>
      <div className="cap">Illustration with sample figures, not real business data</div>
    </div>
  )
}

export function SellPreview() {
  return (
    <div className="preview" role="img" aria-label="Illustration of the ShopScale sales screen with sample items">
      <div className="section list">
        {[['Ankara shirt (M)', '2 × ₦8,500'], ['Leather belt', '1 × ₦6,000'], ['Sneakers (42)', '1 × ₦24,000']].map(([n, p]) => (
          <div className="list-item" key={n} style={{ cursor: 'default' }}><div className="grow"><div className="title">{n}</div><div className="meta">{p}</div></div></div>))}
      </div>
      <div className="seg"><span className="chip on">Paid in full</span><span className="chip">Part payment</span><span className="chip">Pay later</span></div>
      <div className="total-bar"><div><div className="small" style={{ opacity: 0.85 }}>Total</div><div className="amt num">₦47,000</div></div></div>
      <div className="cap">Illustration with sample items, not real business data</div>
    </div>
  )
}

export function Dot({ color = COLORS.blue }) { return <i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: color, marginRight: 8 }} /> }
