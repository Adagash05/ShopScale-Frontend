import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Empty, ErrorBox, ListSkeleton, useLoad } from '../../components.jsx'
import { dateOnly, money } from '../../lib/format.js'
import { Kpi } from '../../partners/ui.jsx'
import { STATUS, TONE } from './cshared.js'

function EventRow({ e, showMoney }) {
  return (
    <Link className="list-item" to={`/events/${e.id}`}>
      <div className="grow">
        <div className="title">#{e.number} · {e.title}</div>
        <div className="meta">{e.customerName} · {dateOnly(e.eventDate)} · {e.guests} guests{e.venue ? ` · ${e.venue}` : ''}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span className={`badge ${TONE[e.status]}`}>{STATUS[e.status]}</span>
        {showMoney && Number(e.balance) > 0 && <div className="meta num">Owes {money(e.balance)}</div>}
      </div>
    </Link>
  )
}

export default function CateringHome() {
  const { can } = useAuth()
  const dash = useLoad(() => api.get('/catering/dashboard'), [])
  const d = dash.data
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Events</h1><p className="sub">Enquiries, bookings and money owed</p></div>
        <div className="row">
          <Link className="btn" to="/events/list">All events</Link>
          {can('CATERING_MANAGE') && <Link className="btn primary" to="/events/new"><Plus size={18} /> New enquiry</Link>}
        </div>
      </div>
      <ErrorBox error={dash.error} onRetry={dash.reload} />
      {dash.loading && <ListSkeleton />}
      {d && (
        <>
          <div className="kpis">
            <Kpi label="Waiting for a decision" value={d.pendingCount} hint="Enquiries and quotations" />
            <Kpi label="Confirmed bookings" value={d.bookedCount} />
            <Kpi label="In preparation" value={d.inPreparationCount} hint={`${d.readyCount} ready`} />
            <Kpi label="Completed this month" value={d.completedThisMonth} />
            {d.showMoney && <Kpi label="Customers still owe" value={money(d.outstanding)} tone="warn" />}
            {d.showMoney && <Kpi label="Received this month" value={money(d.receivedThisMonth)} />}
            {d.showMoney && <Kpi label="Profit this month" value={money(d.profitThisMonth)} hint={`from ${money(d.revenueThisMonth)} on completed events`} />}
          </div>
          <section className="section"><h2 className="section-title">Coming up</h2>
            {d.upcoming.length === 0 ? <Empty title="No upcoming events">Confirmed bookings appear here in date order.</Empty> : <div className="list">{d.upcoming.map((e) => <EventRow key={e.id} e={e} showMoney={d.showMoney} />)}</div>}
          </section>
          <section className="section"><h2 className="section-title">Enquiries and quotations</h2>
            {d.pending.length === 0 ? <Empty title="No pending enquiries">New enquiries you capture will wait here until they are confirmed.</Empty> : <div className="list">{d.pending.map((e) => <EventRow key={e.id} e={e} showMoney={d.showMoney} />)}</div>}
          </section>
        </>
      )}
    </div>
  )
}
