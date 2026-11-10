import { Download } from 'lucide-react'
import { tokens } from '../../lib/api'
import { useToast } from '../../components.jsx'

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '') + '/api'
const SETS = [['products', 'Products and stock'], ['customers', 'Customers and what they owe'], ['sales', 'Sales'], ['expenses', 'Expenses']]

export default function Export() {
  const toast = useToast()
  async function download(what) {
    try {
      const res = await fetch(`${BASE}/export/${what}.csv`, { headers: { Authorization: `Bearer ${tokens.get()?.accessToken}` } })
      if (!res.ok) throw new Error(res.status === 402 ? 'Data export is not included in your plan' : res.status === 403 ? 'You do not have permission to export' : 'Could not export. Please try again.')
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a'); a.href = url; a.download = `shopscale-${what}.csv`; a.click(); URL.revokeObjectURL(url)
    } catch (e) { toast(e.message, 'error') }
  }
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Export your data</h1><p className="sub">Download CSV files you can open in Excel or Google Sheets</p></div></div>
      <div className="section list">
        {SETS.map(([k, label]) => <button key={k} className="list-item" onClick={() => download(k)}><div className="grow"><div className="title">{label}</div></div><Download size={18} /></button>)}
      </div>
    </div>
  )
}
