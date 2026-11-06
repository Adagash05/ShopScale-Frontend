import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import { Empty, ErrorBox, ListSkeleton, useLoad } from '../components.jsx'
import StockAdjust from '../StockAdjust.jsx'
import { dateTime } from '../lib/format.js'

const TYPE = { OPENING: 'Opening stock', SALE: 'Sold', RESTOCK: 'Stock added', ADJUSTMENT: 'Adjusted', REFUND: 'Returned (refund)', DAMAGED: 'Damaged', CORRECTION: 'Counted' }

export default function Stock() {
  const { can } = useAuth()
  const showLow = can('STOCK_VIEW')
  const showHistory = can('STOCK_MOVEMENTS_VIEW')
  const [tab, setTab] = useState(showLow ? 'low' : 'history')
  const low = useLoad(() => (showLow ? api.get('/inventory/low-stock') : Promise.resolve([])), [])
  const hist = useLoad(() => (tab === 'history' ? api.get('/inventory/movements', { size: 50 }) : Promise.resolve(null)), [tab])
  const [adjust, setAdjust] = useState(null)

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Stock</h1><p className="sub">What is running low and what changed</p></div></div>
      <div className="seg" role="tablist" aria-label="Stock view">
        {showLow && <button role="tab" aria-selected={tab === 'low'} className={`chip ${tab === 'low' ? 'on' : ''}`} onClick={() => setTab('low')}>Running low</button>}
        {showHistory && <button role="tab" aria-selected={tab === 'history'} className={`chip ${tab === 'history' ? 'on' : ''}`} onClick={() => setTab('history')}>History</button>}
      </div>
      {tab === 'low' && (
        <>
          <ErrorBox error={low.error} onRetry={low.reload} />
          {low.loading && <ListSkeleton />}
          {low.data && low.data.length === 0 && <div className="section"><Empty title="All good">Nothing is running low right now.</Empty></div>}
          {low.data && low.data.length > 0 && (
            <div className="section list">
              {low.data.map((i) => (
                <div className="list-item" key={i.variantId} style={{ cursor: 'default' }}>
                  <div className="grow"><div className="title">{i.variantLabel ? `${i.productName} (${i.variantLabel})` : i.productName}</div>
                    <div className="meta">{i.quantity <= 0 ? <span style={{ color: 'var(--danger)' }}>Out of stock</span> : `${i.quantity} left`}</div></div>
                  {can('STOCK_RESTOCK') && <button className="btn sm" onClick={() => setAdjust({ variantId: i.variantId, name: i.variantLabel ? `${i.productName} (${i.variantLabel})` : i.productName, current: i.quantity })}>Add stock</button>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {tab === 'history' && (
        <>
          <ErrorBox error={hist.error} onRetry={hist.reload} />
          {hist.loading && <ListSkeleton />}
          {hist.data && hist.data.content.length === 0 && <div className="section"><Empty title="No stock changes yet" /></div>}
          {hist.data && hist.data.content.length > 0 && (
            <div className="section list">
              {hist.data.content.map((m) => (
                <div className="list-item" key={m.id} style={{ cursor: 'default' }}>
                  <div className="grow"><div className="title">{m.variantLabel ? `${m.productName} (${m.variantLabel})` : m.productName}</div>
                    <div className="meta">{TYPE[m.type] || m.type} · {dateTime(m.createdAt)}{m.note ? ` · ${m.note}` : ''}</div></div>
                  <div className="right"><div className="num title" style={{ color: m.quantityChange < 0 ? 'var(--danger)' : 'var(--ok)' }}>{m.quantityChange > 0 ? '+' : ''}{m.quantityChange}</div><div className="meta num">now {m.balanceAfter}</div></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {adjust && <StockAdjust {...adjust} onClose={() => setAdjust(null)} onDone={low.reload} />}
    </div>
  )
}
