import { useState } from 'react'
import { SmartLink as Link } from '../lib/SmartLink.jsx'
import { api } from '../lib/api'
import { Confirm, ErrorBox, Field, ListSkeleton, Skeleton, useLoad, useToast } from '../components.jsx'
import { CopyButton, DataTable, Kpi, StatusBadge, fmtDate, fmtTime, label, money, pct } from './ui.jsx'
import { SocialsEditor, emptySocial } from './PartnerApply.jsx'
import { usePartner } from './PartnerShell.jsx'

const Loading = () => <div className="stack"><Skeleton height={80} /><ListSkeleton rows={4} /></div>

function Head({ title, sub }) {
  return <div className="page-head"><div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div></div>
}

// ---------------------------------------------------------------- dashboard
export function Dashboard() {
  const d = useLoad(() => api.get('/partners/dashboard'), [])
  if (d.loading) return <Loading />
  if (d.error) return <ErrorBox error={d.error} onRetry={d.reload} />
  const { partner, stats: s, programme: p, canWithdraw, bank } = d.data
  const short = Math.max(0, Number(p.minWithdrawal) - Number(s.available))
  return (
    <div className="stack">
      <Head title="Dashboard" sub={`${p.name}: ${pct(p.commissionRate)} for the first ${p.commissionMonths} months of each customer's subscription`} />
      <div className="pt-card stack">
        <h2 style={{ margin: 0 }}>Your referral link</h2>
        <div className="pt-link-box"><code>{partner.referralUrl}</code><CopyButton text={partner.referralUrl}>Copy link</CopyButton></div>
        <div className="row wrap small"><span>Your code: <b className="num">{partner.code}</b></span><CopyButton text={partner.code} className="btn sm">Copy code</CopyButton></div>
        <p className="pt-note">A person who registers within {p.attributionDays} days of opening your link is attributed to you. If they open another partner's link afterwards, the newest link counts.</p>
      </div>

      <div className="kpis">
        <Kpi label="Link clicks" value={s.clicks.toLocaleString('en-NG')} hint="Unique visitors per day" />
        <Kpi label="Sign-ups" value={s.registrations.toLocaleString('en-NG')} hint={`${s.signupRate}% of clicks`} />
        <Kpi label="Paying customers" value={s.payingCustomers.toLocaleString('en-NG')} hint="Made a successful payment" tone="teal" />
        <Kpi label="Click to paying" value={`${s.conversionRate}%`} hint="Paying customers ÷ clicks" />
      </div>

      <div className="kpis">
        <Kpi label="Total earned" value={money(s.totalEarned)} hint="After reversals" tone="navy" />
        <Kpi label="Pending" value={money(s.pending)} hint={s.nextAvailableAt ? `Next releases ${fmtDate(s.nextAvailableAt)}` : `Held ${p.holdingDays} days`} tone="warn" />
        <Kpi label="Available" value={money(s.available)} hint="Ready to withdraw" />
        <Kpi label="Paid out" value={money(s.paid)} hint={Number(s.reserved) > 0 ? `${money(s.reserved)} in a withdrawal` : 'Bank transfers sent'} tone="teal" />
      </div>
      {Number(s.reversed) > 0 && <p className="muted small">{money(s.reversed)} of commission has been reversed because of refunds or adjustments. It is already taken off the figures above.</p>}
      {Number(s.outstandingDeductions) > 0 && <div className="banner" role="status"><p>{money(s.outstandingDeductions)} will be deducted from your next earnings, because a payment we had already paid you commission on was refunded.</p></div>}

      <div className="pt-card stack">
        <h2 style={{ margin: 0 }}>Withdraw</h2>
        {canWithdraw
          ? <p>You have <b>{money(s.available)}</b> available. {bank ? 'Request a bank transfer from the Withdrawals page.' : 'Add your bank details, then request a transfer.'}</p>
          : <p className="muted">Withdrawals open at {money(p.minWithdrawal)} available. {short > 0 ? <>You need {money(short)} more.</> : null}</p>}
        <div className="pt-actions">
          <Link to="/partners/withdrawals" className={`btn ${canWithdraw ? 'primary' : ''}`}>{canWithdraw ? 'Go to withdrawals' : 'View withdrawals'}</Link>
          {!bank && <Link to="/partners/payment-details" className="btn">Add bank details</Link>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- referrals
export function Referrals() {
  const r = useLoad(() => api.get('/partners/referrals'), [])
  return (
    <div className="stack">
      <Head title="Referrals" sub="Businesses that registered through your link. Names are shortened to protect their privacy." />
      {r.loading ? <Loading /> : r.error ? <ErrorBox error={r.error} onRetry={r.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={r.data} empty="No sign-ups yet. Share your link and they will appear here."
            columns={[
              { key: 'c', label: 'Customer', render: (x) => x.customer },
              { key: 'at', label: 'Signed up', render: (x) => fmtDate(x.attributedAt) },
              { key: 's', label: 'Status', render: (x) => <StatusBadge status={x.customerStatus} /> },
              { key: 'plan', label: 'Plan', render: (x) => x.planCode ? label(x.planCode) : '' },
              { key: 'fp', label: 'First payment', render: (x) => fmtDate(x.firstPaidAt) || 'Not yet' },
              { key: 'until', label: 'Earning until', render: (x) => fmtDate(x.eligibleUntil) },
            ]} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- earnings (commission history)
export function Earnings() {
  const c = useLoad(() => api.get('/partners/commissions'), [])
  return (
    <div className="stack">
      <Head title="Earnings" sub="Every commission, adjustment and deduction on your account. Entries are never edited: a reversal adds its own record." />
      {c.loading ? <Loading /> : c.error ? <ErrorBox error={c.error} onRetry={c.reload} /> : (
        <div className="pt-card" style={{ padding: 0 }}>
          <DataTable rows={c.data} empty="No commission yet. It appears here after a referred customer's first successful payment."
            columns={[
              { key: 'd', label: 'Date', render: (x) => fmtDate(x.earnedAt) },
              { key: 'k', label: 'Type', render: (x) => <StatusBadge status={x.kind} /> },
              { key: 'p', label: 'Payment', render: (x) => x.kind === 'EARNED' ? <>{x.planCode ? label(x.planCode) : ''} {x.billingCycle ? label(x.billingCycle).toLowerCase() : ''}<div className="pt-note num">{money(x.paymentAmount)} at {pct(x.rate)}{Number(x.eligibleFraction) < 1 ? ` · ${Math.round(Number(x.eligibleFraction) * 100)}% inside the commission period` : ''}</div></> : (x.reason || '') },
              { key: 'a', label: 'Amount', right: true, render: (x) => <>{money(x.netAmount)}{Number(x.reversedAmount) > 0 && <div className="pt-note">of {money(x.amount)}</div>}</> },
              { key: 's', label: 'Status', render: (x) => <><StatusBadge status={x.status} />{x.status === 'PENDING' && x.availableAt && <div className="pt-note">Available {fmtDate(x.availableAt)}</div>}{x.reversalReason && <div className="pt-note">{x.reversalReason}</div>}</> },
            ]} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- withdrawals
export function Withdrawals() {
  const toast = useToast()
  const dash = useLoad(() => api.get('/partners/dashboard'), [])
  const list = useLoad(() => api.get('/partners/withdrawals'), [])
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const reload = () => { dash.reload(); list.reload() }

  async function request() {
    setBusy(true)
    try { await api.post('/partners/withdrawals'); toast('Withdrawal requested. We will review it and email you.'); setConfirm(null); reload() }
    catch (e) { toast(e.message, 'error'); setConfirm(null); reload() } finally { setBusy(false) }
  }
  async function cancel(id) {
    setBusy(true)
    try { await api.post(`/partners/withdrawals/${id}/cancel`); toast('Request cancelled'); setConfirm(null); reload() }
    catch (e) { toast(e.message, 'error'); setConfirm(null); reload() } finally { setBusy(false) }
  }

  if (dash.loading || list.loading) return <Loading />
  if (dash.error || list.error) return <ErrorBox error={dash.error || list.error} onRetry={reload} />
  const { stats: s, programme: p, bank } = dash.data
  const open = list.data.some((w) => ['REQUESTED', 'APPROVED', 'PROCESSING'].includes(w.status))
  const short = Math.max(0, Number(p.minWithdrawal) - Number(s.available))
  const can = !open && !!bank && short === 0 && Number(s.available) > 0
  const why = open ? 'You already have a withdrawal in progress.' : !bank ? 'Add your bank details first.' : short > 0 ? `You need ${money(short)} more available (minimum ${money(p.minWithdrawal)}).` : ''
  return (
    <div className="stack">
      <Head title="Withdrawals" sub="Paid by bank transfer in naira after our team approves the request." />
      <div className="pt-card stack">
        <div className="row between wrap"><div><div className="muted small">Available to withdraw</div><div style={{ fontSize: '1.75rem', fontWeight: 800 }} className="num">{money(s.available)}</div></div>
          <button className="btn primary" disabled={!can || busy} onClick={() => setConfirm({ type: 'request' })}>Request withdrawal</button></div>
        {why && <p className="muted small">{why} {!bank && <Link to="/partners/payment-details">Add bank details</Link>}</p>}
        {Number(s.outstandingDeductions) > 0 && <p className="small">{money(s.outstandingDeductions)} of earlier payouts was refunded and will come off your next earnings.</p>}
        {bank && <p className="small muted">Paying to {bank.holderName}, {bank.bankName}, {bank.accountNumberMasked}. <Link to="/partners/payment-details">Change</Link></p>}
        <p className="pt-note">The whole available balance is requested together. Pending commission is not included until its {p.holdingDays}-day hold ends.</p>
      </div>
      <div className="pt-card" style={{ padding: 0 }}>
        <DataTable rows={list.data} empty="No withdrawals yet."
          columns={[
            { key: 'r', label: 'Requested', render: (w) => fmtTime(w.requestedAt) },
            { key: 'a', label: 'Amount', right: true, render: (w) => money(w.amount) },
            { key: 's', label: 'Status', render: (w) => <><StatusBadge status={w.status} />{w.closedReason && <div className="pt-note">{w.closedReason}</div>}</> },
            { key: 'b', label: 'To', render: (w) => `${w.bankName} ${w.accountNumberMasked}` },
            { key: 'p', label: 'Paid', render: (w) => w.paidAt ? <>{fmtTime(w.paidAt)}<div className="pt-note">Ref {w.transferReference}</div></> : '' },
            { key: 'x', label: '', render: (w) => w.status === 'REQUESTED' ? <button className="btn sm" onClick={() => setConfirm({ type: 'cancel', id: w.id })}>Cancel</button> : null },
          ]} />
      </div>
      {confirm?.type === 'request' && <Confirm title="Request withdrawal?" message={`${money(s.available)} will be reserved and sent to ${bank.holderName}, ${bank.bankName} ${bank.accountNumberMasked} once approved.`} confirmLabel="Request withdrawal" busy={busy} onConfirm={request} onClose={() => setConfirm(null)} />}
      {confirm?.type === 'cancel' && <Confirm title="Cancel this request?" message="The money goes back to your available balance." confirmLabel="Cancel request" danger busy={busy} onConfirm={() => cancel(confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------- bank details
export function PaymentDetails() {
  const toast = useToast()
  const b = useLoad(() => api.get('/partners/bank-account'), [])
  const [f, setF] = useState({ holderName: '', bankName: '', bankCode: '', accountNumber: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  if (b.loading) return <Loading />
  if (b.error) return <ErrorBox error={b.error} onRetry={b.reload} />
  const saved = b.data.saved ? b.data.bank : null

  async function save(e) {
    e.preventDefault()
    const errs = {}
    if (!f.holderName.trim()) errs.holderName = 'Enter the name on the account'
    if (!f.bankName.trim()) errs.bankName = 'Enter your bank'
    if (!/^\d{10}$/.test(f.accountNumber.replace(/[\s-]/g, ''))) errs.accountNumber = 'A Nigerian bank account number has 10 digits'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await api.put('/partners/bank-account', { holderName: f.holderName.trim(), bankName: f.bankName.trim(), bankCode: f.bankCode.trim() || null, accountNumber: f.accountNumber.replace(/[\s-]/g, '') })
      toast('Bank details saved'); setF({ holderName: '', bankName: '', bankCode: '', accountNumber: '' }); b.reload()
    } catch (err) { setErrors(err.fieldErrors || {}); toast(err.message, 'error') } finally { setBusy(false) }
  }
  return (
    <div className="stack">
      <Head title="Payment details" sub="Where we send your commission. Your account number is stored encrypted and is only ever shown to you in part." />
      {saved && <div className="pt-card"><h2>Current account</h2><dl className="pt-kv"><dt>Name</dt><dd>{saved.holderName}</dd><dt>Bank</dt><dd>{saved.bankName}</dd><dt>Account</dt><dd className="num">{saved.accountNumberMasked}</dd><dt>Updated</dt><dd>{fmtDate(saved.updatedAt)}</dd></dl></div>}
      <form className="pt-card stack" onSubmit={save} noValidate>
        <h2 style={{ margin: 0 }}>{saved ? 'Replace bank details' : 'Add bank details'}</h2>
        <Field label="Name on the account" htmlFor="holderName" error={errors.holderName}><input id="holderName" className="input" autoComplete="off" value={f.holderName} onChange={set('holderName')} /></Field>
        <div className="pt-two">
          <Field label="Bank" htmlFor="bankName" error={errors.bankName}><input id="bankName" className="input" autoComplete="off" value={f.bankName} onChange={set('bankName')} /></Field>
          <Field label="Account number" htmlFor="accountNumber" error={errors.accountNumber} hint="10 digits"><input id="accountNumber" className="input" inputMode="numeric" autoComplete="off" value={f.accountNumber} onChange={set('accountNumber')} /></Field>
        </div>
        <p className="pt-note">If you have a withdrawal in progress it is paid to the account that was saved when you requested it.</p>
        <button className="btn primary" style={{ justifySelf: 'start' }} disabled={busy}>{busy ? 'Saving…' : 'Save bank details'}</button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------- resources
export function Resources() {
  const r = useLoad(() => api.get('/partners/resources'), [])
  if (r.loading) return <Loading />
  if (r.error) return <ErrorBox error={r.error} onRetry={r.reload} />
  const groups = [['GUIDE', 'Guides'], ['FAQ', 'Answers to common questions'], ['LINK', 'Links'], ['ASSET', 'Materials']]
  return (
    <div className="stack">
      <Head title="Resources" sub="Provided by the ShopScale team." />
      {r.data.length === 0 && <p className="muted">No resources have been published yet.</p>}
      {groups.map(([kind, title]) => {
        const items = r.data.filter((x) => x.kind === kind)
        if (!items.length) return null
        return (
          <div key={kind} className="stack">
            <h2>{title}</h2>
            {items.map((x) => (
              <article key={x.id} className="pt-card">
                <h3 style={{ marginBottom: 6 }}>{x.title}</h3>
                {x.body && <p className="pt-pre">{x.body}</p>}
                {x.url && /^https?:\/\//i.test(x.url) && <p style={{ marginTop: 8 }}><a className="btn sm" href={x.url} target="_blank" rel="noopener noreferrer">Open</a></p>}
              </article>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- profile
export function Profile() {
  const { partner, reload } = usePartner()
  const toast = useToast()
  const [f, setF] = useState({
    phone: partner.phone || '', audienceSize: String(partner.audienceSize ?? ''), niche: partner.niche || '', location: partner.location || '', website: partner.website || '',
    socials: partner.socials?.length ? partner.socials.map((s) => ({ ...s })) : [emptySocial()],
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    const errs = {}
    if (f.phone.replace(/\D/g, '').length < 7) errs.phone = 'Enter a phone number we can reach you on'
    if (!f.niche.trim()) errs.niche = 'Tell us what you create or work on'
    if (!/^\d+$/.test(f.audienceSize.trim())) errs.audienceSize = 'Enter a whole number'
    if (!f.socials.some((s) => s.url.trim())) errs.socials = 'Add at least one link'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await api.put('/partners/profile', { phone: f.phone.trim(), audienceSize: Number(f.audienceSize), niche: f.niche.trim(), location: f.location.trim() || null, website: f.website.trim() || null,
        socials: f.socials.filter((s) => s.url.trim()).map((s) => ({ platform: s.platform, url: s.url.trim() })) })
      toast('Profile saved'); reload()
    } catch (err) { setErrors(err.fieldErrors || {}); toast(err.message, 'error') } finally { setBusy(false) }
  }
  return (
    <div className="stack">
      <Head title="Profile" />
      <div className="pt-card"><dl className="pt-kv"><dt>Name</dt><dd>{partner.fullName}</dd><dt>Email</dt><dd>{partner.email}</dd><dt>Country</dt><dd>{partner.country}</dd><dt>Partner code</dt><dd className="num">{partner.code}</dd><dt>Approved</dt><dd>{fmtDate(partner.approvedAt)}</dd></dl>
        <p className="pt-note" style={{ marginTop: 10 }}>To change your name, email or country, contact us.</p></div>
      <form className="pt-card stack" onSubmit={save} noValidate>
        <div className="pt-two">
          <Field label="Phone / WhatsApp" htmlFor="phone" error={errors.phone}><input id="phone" className="input" type="tel" value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Audience size" htmlFor="aud" error={errors.audienceSize}><input id="aud" className="input" inputMode="numeric" value={f.audienceSize} onChange={set('audienceSize')} /></Field>
        </div>
        <SocialsEditor value={f.socials} onChange={(socials) => setF((x) => ({ ...x, socials }))} error={errors.socials} />
        <div className="pt-two">
          <Field label="Niche" htmlFor="niche" error={errors.niche}><input id="niche" className="input" value={f.niche} onChange={set('niche')} /></Field>
          <Field label="City or state" htmlFor="location"><input id="location" className="input" value={f.location} onChange={set('location')} /></Field>
        </div>
        <Field label="Website" htmlFor="website"><input id="website" className="input" value={f.website} onChange={set('website')} /></Field>
        <button className="btn primary" style={{ justifySelf: 'start' }} disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </div>
  )
}
