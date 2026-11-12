import { useEffect, useState } from 'react'
import { api } from './api'

const KEY = 'shopscale.branch'

/** The branches of this business and the one the person is working in (remembered per browser). */
export function useBranch() {
  const [branches, setBranches] = useState([])
  const [branchId, setId] = useState(null)
  useEffect(() => {
    let live = true
    api.get('/branches').then((list) => {
      if (!live) return
      const active = list.filter((b) => b.active)
      setBranches(active)
      let saved = null
      try { saved = localStorage.getItem(KEY) } catch { /* private mode */ }
      const pick = active.find((b) => b.id === saved) || active.find((b) => b.main) || active[0]
      setId(pick ? pick.id : null)
      if (pick) { try { localStorage.setItem(KEY, pick.id) } catch { /* ignore */ } }
    }).catch(() => {
      // Offline: keep working in the branch used last time. The server re-checks it when the sale is sent.
      try { const saved = localStorage.getItem(KEY); if (live && saved) setId(saved) } catch { /* ignore */ }
    })
    return () => { live = false }
  }, [])
  const setBranchId = (id) => {
    setId(id)
    try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
  }
  return { branches, branchId, setBranchId, multiple: branches.length > 1 }
}

export function BranchSelect({ branch, label = 'Location', id = 'branch-select' }) {
  if (!branch.multiple) return null
  return (
    <div className="field" style={{ maxWidth: 260 }}>
      <label htmlFor={id}>{label}</label>
      <select id={id} className="input" value={branch.branchId || ''} onChange={(e) => branch.setBranchId(e.target.value)}>
        {branch.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </div>
  )
}
