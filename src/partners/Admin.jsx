import { Fragment, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { Confirm, ErrorBox, Field, ListSkeleton, Modal, Skeleton, useLoad, useToast } from '../components.jsx'
import { DataTable, Kpi, StatusBadge, fmtDate, fmtTime, label, money, pct } from './ui.jsx'

const Loading = () => <div className="stack"><Skeleton height={80} /><ListSkeleton rows={4} /></div>
const Head = ({ title, sub, children }) => <div className="page-head"><div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>{children}</div>

/** Small form modal: fields = [{ key, label, type?, hint?, multiline? }]; onSubmit(values) must throw to stay open. */
function FormModal({ title, fields, initial = {}, submitLabel, danger, onSubmit, onClose }) {
  const [v, setV] = useState(() => Object.fromEntries(fields.map((f) => [f.key, initial[f.key] ?? ''])))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function go(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await onSubmit(v); onClose() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form className="stack" onSubmit={go} noValidate>
        {fields.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`fm-${f.key}`} hint={f.hint}>
            {f.options
              ? <select id={`fm-${f.key}`} className="select" value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}><option value="">Choose…</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              : f.multiline
              ? <textarea id={`fm-${f.key}`} className="textarea" rows={3} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
              : <input id={`fm-${f.key}`} className="input" type={f.type || 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} step={f.type === 'number' ? 'any' : undefined} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
          </Field>
        ))}
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="pt-actions"><button className={`btn ${danger ? 'danger solid' : 'primary'}`} disabled={busy}>{busy ? 'Working…' : submitLabel}</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------- overview
export function Overview() {
  const o = useLoad(() => api.get('/admin/partners/overview'), [])
  const perf = useLoad(() => api.get('/admin/partners/performance'), [])
  if (o.loading) return <Loading />
  if (o.error) return <ErrorBox error={o.error} onRetry={o.reload} />
  const d = o.data, p = d.programme
  return (
    <div className="stack">
      <Head title="Partners overview" sub={`${pct(p.commissionRate)} for ${p.commissionMonths} months · held ${p.holdingDays} days · minimum withdrawal ${money(p.minWithdrawal)} · ${p.active ? 'accepting applications' : 'applications closed'}`} />
      {d.pendingApplications > 0 && <div className="banner" role="status"><p><b>{d.pendingApplications}</b> application{d.pendingApplications === 1 ? '' : 's'} waiting. <Link to="/admin/partners/applications">Review</Link></p></div>}
      {d.openWithdrawals > 0 && <div className="banner" role="status"><p><b>{d.openWithdrawals}</b> withdrawal{d.openWithdrawals === 1 ? '' : 's'} open ({money(d.openWithdrawalAmount)}). <Link to="/admin/partners/withdrawals">Open</Link></p></div>}
      <div className="kpis">
        <Kpi label="Active partners" value={d.activeAffiliates} hint={`${d.totalAffiliates} applicants in total`} />
        <Kpi label="Clicks" value={Number(d.clicks).toLocaleString('en-NG')} hint={`${d.signupRate}% sign up`} />
        <Kpi label="Referred sign-ups" value={d.registrations} />
        <Kpi label="Paying customers" value={d.payingCustomers} hint={`${d.conversionRate}% of clicks`} tone="teal" />
      </div>
      <div className="kpis">
        <Kpi label="Attributed revenue" value={money(d.attributedRevenue)} hint="Payments that earned commission" tone="navy" />
        <Kpi label="Owed: pending" value={money(d.liabilityPending)} tone="warn" />
        <Kpi label="Owed: available" value={money(d.liabilityAvailable)} hint={`${money(d.liabilityReserved)} reserved in withdrawals`} />
        <Kpi label="Paid out" value={money(d.totalPaid)} hint={`${money(d.totalReversed)} reversed`} tone="teal" />
      </div>
      <div className="pt-card" style={{ padding: 0 }}>
        <h2 style={{ padding: '16px 16px 0' }}>Partner performance</h2>
        {perf.loading ? <Loading /> : perf.error ? <ErrorBox error={perf.error} onRetry={perf.reload} /> : (
          <DataTable rows={perf.data} empty="No approved partners yet." columns={[
            { key: 'n', label: 'Partner', render: (x) => <Link to={`/admin/partners/partners/${x.id}`}>{x.fullName}</Link> },
            { key: 'c', label: 'Code', render: (x) => x.code },
            { key: 'cl', label: 'Clicks', right: true, render: (x) => x.clicks },
            { key: 'r', label: 'Sign-ups', right: true, render: (x) => x.registrations },
            { key: 'p', label: 'Paying', right: true, render: (x) => x.payingCustomers },
            { key: 'rev', label: 'Revenue', right: true, render: (x) => money(x.attributedRevenue) },
            { key: 'e', label: 'Earned', right: true, render: (x) => money(x.earned) },
            { key: 'pd', label: 'Paid', right: true, render: (x) => money(x.paid) },
          ]} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- applications / partners
function socialsText(a) { return (a.socials || []).map((s) => `${s.platform}: ${s.url}`).join('\n') }

function AffiliateActions({ a, onDone }) {
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const run = async (path, body, msg) => { await api.post(`/admin/partners/affiliates/${a.id}/${path}`, body); toast(msg); onDone() }
  return (
    <>
      <div className="pt-actions">
        {a.status === 'PENDING' && <><button className="btn sm primary" onClick={() => setModal('approve')}>Approve</button><button className="btn sm danger" onClick={() => setModal('reject')}>Reject</button></>}
        {a.status === 'APPROVED' && <button className="btn sm danger" onClick={() => setModal('suspend')}>Suspend</button>}
        {(a.status === 'SUSPENDED' || a.status === 'REJECTED') && <button className="btn sm" onClick={() => setModal('reactivate')}>{a.status === 'REJECTED' ? 'Approve after all' : 'Reactivate'}</button>}
      </div>
      {modal === 'approve' && <Confirm title="Approve this partner?" message={`${a.fullName} gets a personal referral link and code, and is emailed.`} confirmLabel="Approve" onConfirm={async () => { try { await run('approve', {}, 'Approved') } catch (e) { toast(e.message, 'error') } setModal(null) }} onClose={() => setModal(null)} />}
      {modal === 'reactivate' && <Confirm title={a.status === 'REJECTED' ? 'Approve this applicant?' : 'Reactivate this partner?'} message="Their referral link works again." confirmLabel="Continue" onConfirm={async () => { try { await run('reactivate', {}, 'Done') } catch (e) { toast(e.message, 'error') } setModal(null) }} onClose={() => setModal(null)} />}
      {(modal === 'reject' || modal === 'suspend') && <FormModal title={modal === 'reject' ? 'Reject application' : 'Suspend partner'} danger submitLabel={modal === 'reject' ? 'Reject' : 'Suspend'}
        fields={[{ key: 'reason', label: 'Reason (shown to the partner)', multiline: true, hint: 'At least 3 characters' }]}
        onSubmit={(v) => run(modal, { reason: v.reason.trim() }, modal === 'reject' ? 'Rejected' : 'Suspended')} onClose={() => setModal(null)} />}
    </>
  )
}

export function Affiliates({ pendingOnly }) {
  const [status, setStatus] = useState(pendingOnly ? 'PENDING' : '')
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const list = useLoad(() => api.get('/admin/partners/affiliates', { status, q: applied }), [status, applied])
  return (
    <div className="stack">
      <Head title={pendingOnly ? 'Applications' : 'Partners'} sub={pendingOnly ? 'Review who applied and why.' : 'Everyone who applied, with their status.'} />
      <form className="pt-filters" onSubmit={(e) => { e.preventDefault(); setApplied(q.trim()) }}>
        {!pendingOnly && <div className="field"><label htmlFor="st">Status</label><select id="st" className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div>}
        <div className="field"><label htmlFor="q">Search name, email or code</label><input id="q" className="input" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn">Search</button>
      </form>
      {list.loading ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : list.data.length === 0 ? <p className="muted">Nothing to show.</p> : list.data.map((a) => (
        <article key={a.id} className="pt-card stack">
          <div className="row between wrap"><div><h2 style={{ margin: 0 }}><Link to={`/admin/partners/partners/${a.id}`}>{a.fullName}</Link></h2><div className="small muted">{a.email} · {a.phone}</div></div><StatusBadge status={a.status} /></div>
          <dl className="pt-kv"><dt>Where</dt><dd>{[a.location, a.country].filter(Boolean).join(', ')}</dd><dt>Audience</dt><dd className="num">{a.audienceSize.toLocaleString('en-NG')} · {a.niche}</dd><dt>Links</dt><dd className="pt-pre">{socialsText(a)}{a.website ? `\nWebsite: ${a.website}` : ''}</dd><dt>Why</dt><dd className="pt-pre">{a.reason}</dd>{a.code && <><dt>Code</dt><dd className="num">{a.code}</dd></>}{a.statusReason && <><dt>Reason</dt><dd>{a.statusReason}</dd></>}<dt>Applied</dt><dd>{fmtDate(a.createdAt)}</dd></dl>
          <AffiliateActions a={a} onDone={list.reload} />
        </article>
      ))}
    </div>
  )
}

const LEDGER_COLS = (extra = []) => [
  { key: 'd', label: 'Date', render: (x) => fmtDate(x.earnedAt) },
  ...extra,
  { key: 'k', label: 'Type', render: (x) => <StatusBadge status={x.kind} /> },
  { key: 'c', label: 'Customer / payment', render: (x) => <>{x.customerName || x.reason || ''}{x.customerEmail && <div className="pt-note">{x.customerEmail}</div>}{x.paymentReference && <div className="pt-note">{x.paymentReference} · {money(x.paymentAmount)} · {x.planCode} {x.billingCycle}</div>}</> },
  { key: 'a', label: 'Amount', right: true, render: (x) => <>{money(x.netAmount)}{Number(x.reversedAmount) > 0 && <div className="pt-note">of {money(x.amount)}</div>}</> },
  { key: 's', label: 'Status', render: (x) => <StatusBadge status={x.status} /> },
]

export function AffiliateDetail() {
  const { id } = useParams()
  const toast = useToast()
  const d = useLoad(() => api.get(`/admin/partners/affiliates/${id}`), [id])
  const [modal, setModal] = useState(null)
  if (d.loading) return <Loading />
  if (d.error) return <ErrorBox error={d.error} onRetry={d.reload} />
  const { partner: a, stats: s } = d.data
  return (
    <div className="stack">
      <Head title={a.fullName} sub={`${a.email} · ${a.phone}`}><StatusBadge status={a.status} /></Head>
      <div className="pt-card stack"><AffiliateActions a={a} onDone={d.reload} />
        <dl className="pt-kv"><dt>Code</dt><dd className="num">{a.code || 'Not issued'}</dd>{a.referralUrl && <><dt>Link</dt><dd>{a.referralUrl}</dd></>}<dt>Where</dt><dd>{[a.location, a.country].filter(Boolean).join(', ')}</dd><dt>Audience</dt><dd>{a.audienceSize.toLocaleString('en-NG')} · {a.niche}</dd><dt>Links</dt><dd className="pt-pre">{socialsText(a)}</dd><dt>Application</dt><dd className="pt-pre">{a.reason}</dd></dl></div>
      <div className="kpis">
        <Kpi label="Clicks" value={s.clicks} /><Kpi label="Sign-ups" value={s.registrations} /><Kpi label="Paying" value={s.payingCustomers} tone="teal" /><Kpi label="Conversion" value={`${s.conversionRate}%`} />
        <Kpi label="Earned" value={money(s.totalEarned)} tone="navy" /><Kpi label="Pending" value={money(s.pending)} tone="warn" /><Kpi label="Available" value={money(s.available)} /><Kpi label="Paid" value={money(s.paid)} tone="teal" />
      </div>
      {Number(s.outstandingDeductions) > 0 && <p className="small">Outstanding deductions: {money(s.outstandingDeductions)}</p>}
      <div className="pt-actions">{a.status !== 'PENDING' && a.status !== 'REJECTED' && <button className="btn" onClick={() => setModal(true)}>Add ledger adjustment</button>}</div>
      <div className="pt-card" style={{ padding: 0 }}><h2 style={{ padding: '16px 16px 0' }}>Commission history</h2><DataTable rows={d.data.commissions} empty="No commission yet." columns={LEDGER_COLS()} /></div>
      <div className="pt-card" style={{ padding: 0 }}><h2 style={{ padding: '16px 16px 0' }}>Referred customers</h2><DataTable rows={d.data.referrals} empty="No referrals yet." columns={[
        { key: 'c', label: 'Customer', render: (x) => <>{x.customerName}<div className="pt-note">{x.customerEmail}</div></> }, { key: 'a', label: 'Attributed', render: (x) => fmtDate(x.attributedAt) }, { key: 's', label: 'Source', render: (x) => x.attributionSource },
        { key: 'f', label: 'First payment', render: (x) => fmtDate(x.firstPaidAt) || 'Not yet' }, { key: 'u', label: 'Earning until', render: (x) => fmtDate(x.eligibleUntil) }, { key: 't', label: 'Terms', render: (x) => `${pct(x.rate)} · ${x.commissionMonths}m · ${x.holdingDays}d hold` }]} /></div>
      <div className="pt-card" style={{ padding: 0 }}><h2 style={{ padding: '16px 16px 0' }}>History</h2><DataTable rows={d.data.audit} rowKey={(x) => x.createdAt + x.action} empty="Nothing recorded." columns={[{ key: 'w', label: 'When', render: (x) => fmtTime(x.createdAt) }, { key: 'a', label: 'Action', render: (x) => x.action }, { key: 'd', label: 'Detail', render: (x) => x.detail }]} /></div>
      {modal && <AdjustModal affiliateId={a.id} onClose={() => setModal(null)} onDone={() => { toast('Adjustment recorded'); d.reload() }} />}
    </div>
  )
}

function AdjustModal({ affiliateId, onClose, onDone }) {
  return (
    <FormModal title="Ledger adjustment" submitLabel="Record adjustment"
      fields={[{ key: 'amount', label: 'Amount in naira', type: 'number', hint: 'Positive adds to their balance, negative deducts. It cannot take the balance below zero.' }, { key: 'reason', label: 'Reason (kept in the ledger)', multiline: true, hint: 'At least 5 characters' }]}
      onSubmit={async (v) => {
        const amount = Number(v.amount)
        if (!Number.isFinite(amount) || amount === 0) throw new Error('Enter a non-zero amount')
        await api.post('/admin/partners/commissions/adjust', { affiliateId, amount, reason: v.reason.trim() }); onDone()
      }} onClose={onClose} />
  )
}

// ---------------------------------------------------------------- referrals
export function AdminReferrals() {
  const [sp] = useSearchParams()
  const r = useLoad(() => api.get('/admin/partners/referrals', { affiliateId: sp.get('affiliateId') || undefined }), [sp])
  return (
    <div className="stack"><Head title="Referrals" sub="Every referred customer and the terms frozen when they signed up." />
      {r.loading ? <Loading /> : r.error ? <ErrorBox error={r.error} onRetry={r.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}><DataTable rows={r.data} empty="No referrals yet." columns={[
          { key: 'c', label: 'Customer', render: (x) => <>{x.customerName}<div className="pt-note">{x.customerEmail}</div></> },
          { key: 'p', label: 'Partner', render: (x) => <Link to={`/admin/partners/partners/${x.affiliateId}`}>{x.affiliateName}</Link> },
          { key: 'a', label: 'Attributed', render: (x) => fmtDate(x.attributedAt) }, { key: 's', label: 'Source', render: (x) => x.attributionSource },
          { key: 'f', label: 'First payment', render: (x) => fmtDate(x.firstPaidAt) || 'Not yet' }, { key: 'u', label: 'Earning until', render: (x) => fmtDate(x.eligibleUntil) },
          { key: 't', label: 'Terms', render: (x) => `${pct(x.rate)} · ${x.commissionMonths}m · ${x.holdingDays}d` }]} /></div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- ledger
export function Ledger() {
  const toast = useToast()
  const [f, setF] = useState({ status: '', customer: '', payment: '', from: '', to: '' })
  const [applied, setApplied] = useState(f)
  const list = useLoad(() => api.get('/admin/partners/commissions', applied), [applied])
  const [modal, setModal] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const aff = useLoad(() => api.get('/admin/partners/affiliates', { status: 'APPROVED' }), [])
  return (
    <div className="stack">
      <Head title="Commission ledger" sub="Append-only: corrections are new entries, never edits.">
        <div className="pt-actions"><button className="btn" onClick={() => setModal('adjust')}>Adjustment</button><button className="btn" onClick={() => setModal('refund')}>Record refund</button></div>
      </Head>
      <form className="pt-filters" onSubmit={(e) => { e.preventDefault(); setApplied({ ...f }) }}>
        <div className="field"><label htmlFor="ls">Status</label><select id="ls" className="select" value={f.status} onChange={set('status')}><option value="">All</option>{['PENDING', 'AVAILABLE', 'RESERVED', 'PAID', 'REVERSED', 'CANCELLED'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div>
        <div className="field"><label htmlFor="lc">Customer name or email</label><input id="lc" className="input" value={f.customer} onChange={set('customer')} /></div>
        <div className="field"><label htmlFor="lp">Payment reference</label><input id="lp" className="input" value={f.payment} onChange={set('payment')} /></div>
        <div className="field"><label htmlFor="lf">From</label><input id="lf" className="input" type="date" value={f.from} onChange={set('from')} /></div>
        <div className="field"><label htmlFor="lt">To</label><input id="lt" className="input" type="date" value={f.to} onChange={set('to')} /></div>
        <button className="btn">Filter</button>
      </form>
      {list.loading ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}><DataTable rows={list.data} empty="No entries match." columns={[
          ...LEDGER_COLS([{ key: 'p', label: 'Partner', render: (x) => <Link to={`/admin/partners/partners/${x.affiliateId}`}>{x.affiliateName}</Link> }]),
          { key: 'x', label: '', render: (x) => x.kind === 'EARNED' && x.status !== 'REVERSED' && x.status !== 'CANCELLED' && Number(x.netAmount) > 0 ? <button className="btn sm danger" onClick={() => setModal({ reverse: x })}>Reverse</button> : null },
        ]} /></div>
      )}
      {modal === 'adjust' && (
        <FormModal title="Ledger adjustment" submitLabel="Record adjustment"
          fields={[{ key: 'affiliateId', label: 'Partner', options: (aff.data || []).map((x) => ({ value: x.id, label: `${x.fullName} (${x.code})` })) }, { key: 'amount', label: 'Amount in naira', type: 'number', hint: 'Negative deducts' }, { key: 'reason', label: 'Reason', multiline: true }]}
          onSubmit={async (v) => { const amount = Number(v.amount); if (!v.affiliateId) throw new Error('Choose a partner'); if (!Number.isFinite(amount) || amount === 0) throw new Error('Enter a non-zero amount'); await api.post('/admin/partners/commissions/adjust', { affiliateId: v.affiliateId, amount, reason: v.reason.trim() }); toast('Adjustment recorded'); list.reload() }}
          onClose={() => setModal(null)} />
      )}
      {modal === 'refund' && (
        <FormModal title="Record a refund or chargeback" submitLabel="Reverse commission" danger
          fields={[{ key: 'paymentReference', label: 'ShopScale payment reference', hint: 'The subscription payment that was refunded' }, { key: 'refundReference', label: 'Refund reference', hint: 'Unique per refund; recording the same one twice does nothing' }, { key: 'amount', label: 'Amount refunded (naira)', type: 'number' }]}
          onSubmit={async (v) => { const amount = Number(v.amount); if (!(amount > 0)) throw new Error('Enter the refunded amount'); await api.post('/admin/partners/refunds', { paymentReference: v.paymentReference.trim(), refundReference: v.refundReference.trim(), amount }); toast('Refund recorded'); list.reload() }}
          onClose={() => setModal(null)} />
      )}
      {modal?.reverse && (
        <FormModal title="Reverse this commission" submitLabel="Reverse" danger
          fields={[{ key: 'reason', label: 'Reason (kept in the ledger)', multiline: true, hint: 'At least 5 characters' }]}
          onSubmit={async (v) => { await api.post(`/admin/partners/commissions/${modal.reverse.id}/reverse`, { reason: v.reason.trim() }); toast('Reversed'); list.reload() }}
          onClose={() => setModal(null)} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------- withdrawals
export function AdminWithdrawals() {
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const list = useLoad(() => api.get('/admin/partners/withdrawals', { status, q: applied }), [status, applied])
  const [modal, setModal] = useState(null)
  const act = async (w, path, body, msg) => { try { await api.post(`/admin/partners/withdrawals/${w.id}/${path}`, body ?? {}); toast(msg); list.reload() } catch (e) { toast(e.message, 'error'); list.reload() } }
  return (
    <div className="stack">
      <Head title="Withdrawals" sub="Manual bank transfers. Mark as paid only after the transfer has gone through, with its reference." />
      <form className="pt-filters" onSubmit={(e) => { e.preventDefault(); setApplied(q.trim()) }}>
        <div className="field"><label htmlFor="ws">Status</label><select id="ws" className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{['REQUESTED', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED', 'CANCELLED'].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div>
        <div className="field"><label htmlFor="wq">Partner name or email</label><input id="wq" className="input" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn">Search</button>
      </form>
      {list.loading ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : list.data.length === 0 ? <p className="muted">No withdrawals.</p> : list.data.map((w) => (
        <article key={w.id} className="pt-card stack">
          <div className="row between wrap"><div><h2 style={{ margin: 0 }}><Link to={`/admin/partners/partners/${w.affiliateId}`}>{w.affiliateName}</Link></h2><div className="small muted">{w.affiliateEmail}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.25rem', fontWeight: 800 }} className="num">{money(w.amount)}</div><StatusBadge status={w.status} /></div></div>
          <dl className="pt-kv"><dt>Pay to</dt><dd>{w.bankHolderName}, {w.bankName}, {w.accountNumberMasked}</dd><dt>Requested</dt><dd>{fmtTime(w.requestedAt)} · {w.commissionCount} commission entries</dd>{w.approvedAt && <><dt>Approved</dt><dd>{fmtTime(w.approvedAt)}</dd></>}{w.processingAt && <><dt>Processing</dt><dd>{fmtTime(w.processingAt)}</dd></>}{w.paidAt && <><dt>Paid</dt><dd>{fmtTime(w.paidAt)} · ref {w.transferReference}</dd></>}{w.payoutNotes && <><dt>Notes</dt><dd>{w.payoutNotes}</dd></>}{w.closedReason && <><dt>Reason</dt><dd>{w.closedReason}</dd></>}</dl>
          <div className="pt-actions">
            {['APPROVED', 'PROCESSING'].includes(w.status) && <button className="btn sm" onClick={() => setModal({ type: 'bank', w })}>Show full account number</button>}
            {w.status === 'REQUESTED' && <button className="btn sm primary" onClick={() => setModal({ type: 'approve', w })}>Approve</button>}
            {['REQUESTED', 'APPROVED'].includes(w.status) && <button className="btn sm danger" onClick={() => setModal({ type: 'reject', w })}>Reject</button>}
            {w.status === 'APPROVED' && <button className="btn sm primary" onClick={() => setModal({ type: 'processing', w })}>Mark as processing</button>}
            {w.status === 'PROCESSING' && <><button className="btn sm primary" onClick={() => setModal({ type: 'paid', w })}>Mark as paid</button><button className="btn sm danger" onClick={() => setModal({ type: 'failed', w })}>Transfer failed</button></>}
          </div>
        </article>
      ))}
      {modal?.type === 'approve' && <Confirm title="Approve this withdrawal?" message={`${money(modal.w.amount)} for ${modal.w.affiliateName}. You still have to make the transfer and record it.`} confirmLabel="Approve" onConfirm={async () => { const w = modal.w; setModal(null); await act(w, 'approve', {}, 'Approved') }} onClose={() => setModal(null)} />}
      {modal?.type === 'processing' && <Confirm title="Start processing?" message="Mark this as being transferred now. The partner is told it is on its way." confirmLabel="Mark as processing" onConfirm={async () => { const w = modal.w; setModal(null); await act(w, 'processing', {}, 'Marked as processing') }} onClose={() => setModal(null)} />}
      {(modal?.type === 'reject' || modal?.type === 'failed') && (
        <FormModal title={modal.type === 'reject' ? 'Reject withdrawal' : 'Transfer failed'} danger submitLabel={modal.type === 'reject' ? 'Reject' : 'Mark as failed'}
          fields={[{ key: 'reason', label: 'Reason (shown to the partner)', multiline: true, hint: 'The money goes back to their available balance.' }]}
          onSubmit={async (v) => { await api.post(`/admin/partners/withdrawals/${modal.w.id}/${modal.type === 'reject' ? 'reject' : 'failed'}`, { reason: v.reason.trim() }); toast('Done'); list.reload() }} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'paid' && (
        <FormModal title="Record the transfer" submitLabel="Mark as paid"
          fields={[{ key: 'transferReference', label: 'Bank transfer reference', hint: 'From your bank. Each reference can be used once.' }, { key: 'amount', label: 'Amount transferred (naira)', type: 'number', hint: `Must equal ${money(modal.w.amount)}` }, { key: 'notes', label: 'Notes (optional)', multiline: true }]}
          initial={{ amount: String(modal.w.amount) }}
          onSubmit={async (v) => { const amount = Number(v.amount); if (!(amount > 0)) throw new Error('Enter the amount transferred'); await api.post(`/admin/partners/withdrawals/${modal.w.id}/paid`, { transferReference: v.transferReference.trim(), amount, notes: v.notes.trim() || null }); toast('Recorded as paid'); list.reload() }} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'bank' && <BankReveal w={modal.w} onClose={() => setModal(null)} />}
    </div>
  )
}

function BankReveal({ w, onClose }) {
  const d = useLoad(() => api.get(`/admin/partners/withdrawals/${w.id}/bank-details`), [w.id])
  return (
    <Modal title="Bank details" onClose={onClose}>
      {d.loading ? <Skeleton height={80} /> : d.error ? <ErrorBox error={d.error} /> : (
        <div className="stack"><dl className="pt-kv">{Object.entries(d.data).map(([k, v]) => <Fragment key={k}><dt>{label(k.replace(/([A-Z])/g, '_$1').toUpperCase())}</dt><dd className="num">{v}</dd></Fragment>)}</dl>
          <p className="pt-note">Viewing these details is recorded in the audit history.</p></div>
      )}
      <div className="pt-actions" style={{ marginTop: 12 }}><button className="btn" onClick={onClose}>Close</button></div>
    </Modal>
  )
}

// ---------------------------------------------------------------- settings
export function Settings() {
  const toast = useToast()
  const s = useLoad(() => api.get('/admin/partners/settings'), [])
  const [f, setF] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  if (s.loading) return <Loading />
  if (s.error) return <ErrorBox error={s.error} onRetry={s.reload} />
  const v = f || { commissionRate: String(Math.round(Number(s.data.commissionRate) * 10000) / 100), commissionMonths: String(s.data.commissionMonths), attributionDays: String(s.data.attributionDays), holdingDays: String(s.data.holdingDays), minWithdrawal: String(s.data.minWithdrawal), active: s.data.active }
  const set = (k) => (e) => setF({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const body = () => ({ commissionRate: Number(v.commissionRate) / 100, commissionMonths: Number(v.commissionMonths), attributionDays: Number(v.attributionDays), holdingDays: Number(v.holdingDays), minWithdrawal: Number(v.minWithdrawal), active: v.active })
  const bad = !(Number(v.commissionRate) > 0 && Number(v.commissionRate) <= 100) || !Number.isInteger(Number(v.commissionMonths)) || !Number.isInteger(Number(v.attributionDays)) || !Number.isInteger(Number(v.holdingDays)) || !(Number(v.minWithdrawal) >= 0)
  async function save() {
    setBusy(true)
    try { await api.put('/admin/partners/settings', body()); toast('Settings saved'); setF(null); setConfirm(false); s.reload() } catch (e) { toast(e.message, 'error'); setConfirm(false) } finally { setBusy(false) }
  }
  return (
    <div className="stack">
      <Head title="Programme settings" sub="Changes apply to people who register afterwards. Commission already earned, and the terms of customers already referred, never change." />
      <form className="pt-card stack" onSubmit={(e) => { e.preventDefault(); if (!bad) setConfirm(true) }} noValidate>
        <div className="pt-two">
          <Field label="Commission rate (%)" htmlFor="rate" hint="Default 30"><input id="rate" className="input" inputMode="decimal" value={v.commissionRate} onChange={set('commissionRate')} /></Field>
          <Field label="Commission months per customer" htmlFor="months" hint="Default 12"><input id="months" className="input" inputMode="numeric" value={v.commissionMonths} onChange={set('commissionMonths')} /></Field>
          <Field label="Attribution window (days)" htmlFor="attr" hint="Default 30"><input id="attr" className="input" inputMode="numeric" value={v.attributionDays} onChange={set('attributionDays')} /></Field>
          <Field label="Holding period (days)" htmlFor="hold" hint="Default 14"><input id="hold" className="input" inputMode="numeric" value={v.holdingDays} onChange={set('holdingDays')} /></Field>
          <Field label="Minimum withdrawal (naira)" htmlFor="min" hint="Default 10,000"><input id="min" className="input" inputMode="decimal" value={v.minWithdrawal} onChange={set('minWithdrawal')} /></Field>
        </div>
        <label className="row"><input type="checkbox" checked={v.active} onChange={set('active')} /> Accepting applications and new referrals</label>
        {bad && <p className="form-error" role="alert">Check the numbers: the rate is above 0 and at most 100, and the others are whole numbers.</p>}
        <button className="btn primary" style={{ justifySelf: 'start' }} disabled={bad || busy || !f}>Save settings</button>
      </form>
      {confirm && <Confirm title="Change programme settings?" message={`Rate ${v.commissionRate}%, ${v.commissionMonths} months, ${v.attributionDays}-day attribution, ${v.holdingDays}-day hold, minimum ${money(v.minWithdrawal)}. This is recorded in the audit history and affects future sign-ups only.`} confirmLabel="Save changes" busy={busy} onConfirm={save} onClose={() => setConfirm(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------- resources
export function AdminResources() {
  const toast = useToast()
  const list = useLoad(() => api.get('/admin/partners/resources'), [])
  const [modal, setModal] = useState(null)
  const fields = [{ key: 'kind', label: 'Kind', hint: 'GUIDE, FAQ, LINK or ASSET' }, { key: 'title', label: 'Title' }, { key: 'body', label: 'Text', multiline: true }, { key: 'url', label: 'Link (optional, https://)' }, { key: 'position', label: 'Order', type: 'number' }]
  const save = (id) => async (v) => {
    const kind = v.kind.trim().toUpperCase()
    if (!['GUIDE', 'FAQ', 'LINK', 'ASSET'].includes(kind)) throw new Error('Kind must be GUIDE, FAQ, LINK or ASSET')
    if (!v.title.trim()) throw new Error('Enter a title')
    if (v.url.trim() && !/^https?:\/\//i.test(v.url.trim())) throw new Error('The link must start with https://')
    const body = { kind, title: v.title.trim(), body: v.body.trim() || null, url: v.url.trim() || null, position: Number(v.position) || 0, published: modal?.r?.published ?? true }
    if (id) await api.put(`/admin/partners/resources/${id}`, body); else await api.post('/admin/partners/resources', body)
    toast('Saved'); list.reload()
  }
  async function toggle(r) { try { await api.put(`/admin/partners/resources/${r.id}`, { kind: r.kind, title: r.title, body: r.body, url: r.url, position: r.position, published: !r.published }); list.reload() } catch (e) { toast(e.message, 'error') } }
  async function remove(r) { try { await api.del(`/admin/partners/resources/${r.id}`); toast('Deleted'); setModal(null); list.reload() } catch (e) { toast(e.message, 'error'); setModal(null) } }
  return (
    <div className="stack">
      <Head title="Partner resources" sub="What approved partners see under Resources. Only publish real, accurate material."><button className="btn primary" onClick={() => setModal({ r: null })}>Add resource</button></Head>
      {list.loading ? <Loading /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}><DataTable rows={list.data} empty="No resources yet." columns={[
          { key: 'o', label: 'Order', right: true, render: (r) => r.position }, { key: 'k', label: 'Kind', render: (r) => label(r.kind) },
          { key: 't', label: 'Title', render: (r) => <>{r.title}<div className="pt-note">{(r.body || '').slice(0, 90)}</div></> },
          { key: 'p', label: 'Visible', render: (r) => <StatusBadge status={r.published ? 'APPROVED' : 'CANCELLED'} /> },
          { key: 'a', label: '', render: (r) => <div className="pt-actions"><button className="btn sm" onClick={() => setModal({ r })}>Edit</button><button className="btn sm" onClick={() => toggle(r)}>{r.published ? 'Hide' : 'Publish'}</button><button className="btn sm danger" onClick={() => setModal({ del: r })}>Delete</button></div> },
        ]} /></div>
      )}
      {modal && !modal.del && <FormModal title={modal.r ? 'Edit resource' : 'Add resource'} submitLabel="Save" fields={fields} initial={modal.r ? { ...modal.r, position: String(modal.r.position) } : { kind: 'GUIDE', position: '0' }} onSubmit={save(modal.r?.id)} onClose={() => setModal(null)} />}
      {modal?.del && <Confirm title="Delete this resource?" message={modal.del.title} confirmLabel="Delete" danger onConfirm={() => remove(modal.del)} onClose={() => setModal(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------- audit and exports
export function AuditAndExports() {
  const toast = useToast()
  const a = useLoad(() => api.get('/admin/partners/audit'), [])
  async function exportCsv(kind) {
    try {
      const blob = await api.download(`/admin/partners/export/${kind}`)
      const url = URL.createObjectURL(blob); const el = document.createElement('a')
      el.href = url; el.download = `partners-${kind}.csv`; document.body.appendChild(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) { toast(e.message, 'error') }
  }
  return (
    <div className="stack">
      <Head title="Audit and exports" />
      <div className="pt-card stack"><h2 style={{ margin: 0 }}>Download CSV</h2>
        <div className="pt-actions">{[['commissions', 'Commissions'], ['withdrawals', 'Withdrawals'], ['affiliates', 'Partners'], ['referrals', 'Referrals']].map(([k, l]) => <button key={k} className="btn" onClick={() => exportCsv(k)}>{l}</button>)}</div>
        <p className="pt-note">Exports never include bank account numbers beyond the last four digits.</p></div>
      <div className="pt-card" style={{ padding: 0 }}><h2 style={{ padding: '16px 16px 0' }}>Recent activity</h2>
        {a.loading ? <Loading /> : a.error ? <ErrorBox error={a.error} onRetry={a.reload} /> : <DataTable rows={a.data} rowKey={(x) => x.createdAt + x.action + x.entityId} empty="Nothing recorded yet." columns={[
          { key: 'w', label: 'When', render: (x) => fmtTime(x.createdAt) }, { key: 'u', label: 'By', render: (x) => x.actorEmail || 'System' }, { key: 'a', label: 'Action', render: (x) => label(x.action) }, { key: 'd', label: 'Detail', render: (x) => x.detail }]} />}</div>
    </div>
  )
}
