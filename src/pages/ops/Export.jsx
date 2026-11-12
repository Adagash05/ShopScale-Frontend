import { Download } from 'lucide-react'
import { api } from '../../lib/api'
import { track } from '../../analytics/analytics.js'
import { useToast } from '../../components.jsx'

const SETS = [['products', 'Products and stock'], ['customers', 'Customers and what they owe'], ['sales', 'Sales'], ['expenses', 'Expenses']]

export default function Export() {
  const toast = useToast()
  async function download(what) {
    try {
      const blob = await api.download(`/export/${what}.csv`).catch((e) => { throw new Error(e.status === 402 ? 'Data export is not included in your plan' : e.status === 403 ? 'You do not have permission to export' : e.status === 0 ? e.message : 'Could not export. Please try again.') })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `shopscale-${what}.csv`; a.click(); URL.revokeObjectURL(url)
      track('data_export', { export_type: what })
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
