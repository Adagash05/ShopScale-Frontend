import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { useToast } from '../components.jsx'

export const RESEND_COOLDOWN_SECONDS = 60

/** Resend action shared by the sign-up notice and the top bar: one request at a time, then a short cooldown. */
export function useResendVerification() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)
  const lock = useRef(false)
  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])
  async function resend() {
    if (lock.current || wait > 0) return
    lock.current = true
    setBusy(true)
    try {
      await api.post('/auth/resend-verification')
      toast('Confirmation email sent. Check your inbox and spam folder.')
      setWait(RESEND_COOLDOWN_SECONDS)
    } catch (e) {
      toast(e.status === 429 ? 'Too many requests. Wait a minute and try again.' : e.message, 'error')
    } finally { lock.current = false; setBusy(false) }
  }
  return { resend, busy, wait }
}

/** Fetches the account's confirmation status once. null until known. */
export function useVerificationStatus() {
  const [ver, setVer] = useState(null)
  useEffect(() => {
    let live = true
    api.get('/auth/verification-status').then((v) => { if (live) setVer(v) }).catch(() => {})
    return () => { live = false }
  }, [])
  return ver
}

/** Shown after sign-up: says what happened to the confirmation email, truthfully, with a working resend. */
export default function VerifyNotice({ email }) {
  const ver = useVerificationStatus()
  const { resend, busy, wait } = useResendVerification()
  if (!ver || ver.verified) return null
  return (
    <div className="card pad" role="status" style={{ marginBottom: 16 }}>
      {ver.emailConfigured ? (
        <>
          <strong>Check your email</strong>
          <p className="muted small" style={{ margin: '4px 0 8px' }}>We sent a confirmation link{email ? <> to <b>{email}</b></> : ''}. It can take a minute to arrive; check your spam folder too.</p>
          <button type="button" className="btn sm" onClick={resend} disabled={busy || wait > 0}>
            {busy ? 'Sending…' : wait > 0 ? `Send again in ${wait}s` : 'Send the email again'}
          </button>
        </>
      ) : (
        <>
          <strong>Email confirmation is not available yet</strong>
          <p className="muted small" style={{ margin: '4px 0 0' }}>Your account is ready to use. We could not send a confirmation email because email sending is not set up on this server.</p>
        </>
      )}
    </div>
  )
}
