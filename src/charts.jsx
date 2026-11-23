// Small dependency-free SVG charts. They stay light on cheap phones and render the same on every device.
import { useEffect, useRef, useState } from 'react'
import { money } from './lib/format.js'
import { labelIndexes, niceScale, nearestIndex } from './lib/chartMath.js'

export const COLORS = {
  blue: '#2563eb', teal: '#0d9488', navy: '#6366f1', amber: '#f59e0b', slate: '#94a3b8', red: '#dc2626', sky: '#38bdf8',
}
const PALETTE = [COLORS.blue, COLORS.teal, COLORS.navy, COLORS.amber, COLORS.sky, COLORS.slate]

const compact = new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 })
export const short = (n) => compact.format(Number(n) || 0)

function niceMax(v) {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p
}

/** Grouped bars over time. series: [{key,label,color}], data: [{label, title, values:{key:number}, onClick}] */
export function BarChart({ data, series, height = 200, ariaLabel }) {
  const W = 640, H = height, L = 44, B = 24, T = 8, R = 6
  const max = niceMax(Math.max(0, ...data.flatMap((d) => series.map((s) => Number(d.values[s.key]) || 0))))
  const slot = (W - L - R) / Math.max(data.length, 1)
  const gw = Math.min(slot * 0.78, 56)
  const bw = gw / series.length
  const ph = H - T - B
  const y = (v) => T + ph - (Math.max(v, 0) / max) * ph
  const every = Math.ceil(data.length / 8)
  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(max * t)} y2={y(max * t)} style={{ stroke: 'var(--line)' }} />
          <text x={L - 6} y={y(max * t) + 4} textAnchor="end">{short(max * t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x0 = L + slot * i + (slot - gw) / 2
        return (
          <g key={i} className={d.onClick ? 'bar' : undefined} onClick={d.onClick} role={d.onClick ? 'link' : undefined}>
            <title>{d.title}</title>
            {series.map((s, j) => {
              const v = Number(d.values[s.key]) || 0
              return <rect key={s.key} x={x0 + bw * j} y={y(v)} width={Math.max(bw - 1.5, 1)} height={Math.max(T + ph - y(v), v > 0 ? 1.5 : 0)} rx="2" fill={s.color} />
            })}
            <rect x={L + slot * i} y={T} width={slot} height={ph} fill="transparent" />
            {i % every === 0 && <text x={L + slot * i + slot / 2} y={H - 6} textAnchor="middle">{d.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}

export function Legend({ items }) {
  return <div className="legend">{items.map((s) => <span key={s.label}><i style={{ background: s.color }} />{s.label}</span>)}</div>
}

/** segments: [{label, value, color?}] */
export function Donut({ segments, centerLabel, centerValue, format = money, ariaLabel }) {
  const total = segments.reduce((s, x) => s + Number(x.value), 0)
  const R = 54, C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label={ariaLabel}>
        <circle cx="70" cy="70" r={R} fill="none" style={{ stroke: 'var(--track)' }} strokeWidth="18" />
        {total > 0 && segments.map((s, i) => {
          const len = (Number(s.value) / total) * C
          const el = (
            <circle key={s.label} cx="70" cy="70" r={R} fill="none" stroke={s.color || PALETTE[i % PALETTE.length]} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)"><title>{`${s.label}: ${format(s.value)}`}</title></circle>
          )
          offset += len
          return el
        })}
        <text x="70" y="66" textAnchor="middle" style={{ fontSize: 11 }}>{centerLabel}</text>
        <text x="70" y="84" textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: 'var(--text)' }}>{centerValue}</text>
      </svg>
      <div className="legend-list">
        {segments.map((s, i) => (
          <div key={s.label}><span><i style={{ background: s.color || PALETTE[i % PALETTE.length] }} />{s.label}</span>
            <strong className="num">{format(s.value)}{total > 0 ? ` · ${Math.round((Number(s.value) / total) * 100)}%` : ''}</strong></div>
        ))}
      </div>
    </div>
  )
}

/** items: [{label, value, note?, onClick?}] */
export function HBars({ items, color = COLORS.blue, format = money }) {
  const max = Math.max(1, ...items.map((i) => Number(i.value) || 0))
  return (
    <div className="hbar">
      {items.map((it) => {
        const inner = (
          <>
            <div className="top"><span>{it.label}</span><strong className="num">{it.note ?? format(it.value)}</strong></div>
            <div className="hbar-track"><div className="hbar-fill" style={{ width: `${Math.max(2, (Number(it.value) / max) * 100)}%`, background: color }} /></div>
          </>
        )
        return it.onClick
          ? <button key={it.label} className="hbar-row" onClick={it.onClick}>{inner}</button>
          : <div key={it.label} className="hbar-row">{inner}</div>
      })}
    </div>
  )
}

/** One stacked bar: parts [{label, value, color}] */
export function StackBar({ parts, ariaLabel }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  return (
    <div>
      <div className="stackbar" role="img" aria-label={ariaLabel}>
        {total > 0 && parts.map((p) => <div key={p.label} title={`${p.label}: ${p.value}`} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
      </div>
    </div>
  )
}

export function ChartEmpty({ children }) {
  return <div className="chart-empty">{children}</div>
}

/**
 * Sales trend: a clean area/line chart with an optional dashed line for the previous period, a few date labels, three value
 * ticks and a tooltip that follows a finger or mouse. It measures its own width so text stays a readable size on a phone.
 * points: [{ label, value, previous?, title? }]; previous is null/undefined when there is nothing honest to compare with.
 */
export function AreaChart({ points, height = 240, ariaLabel, format = money, previousName = 'Previous period' }) {
  const ref = useRef(null)
  const [w, setW] = useState(600)
  const [hover, setHover] = useState(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const set = () => setW(Math.max(260, Math.floor(el.getBoundingClientRect().width)))
    set()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const n = points.length
  const hasPrev = points.some((p) => p.previous != null)
  const maxV = Math.max(0, ...points.map((p) => Number(p.value) || 0), ...(hasPrev ? points.map((p) => Number(p.previous) || 0) : [0]))
  const scale = niceScale(maxV)
  const pad = { l: w < 420 ? 40 : 52, r: 12, t: 12, b: 28 }
  const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b
  const x = (i) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v) => pad.t + ih - (Number(v) / scale.max) * ih
  const line = (key) => points.map((p, i) => (p[key] == null ? null : `${x(i)},${y(p[key])}`)).filter(Boolean).join(' ')
  const area = n > 1 ? `${pad.l},${pad.t + ih} ${line('value')} ${x(n - 1)},${pad.t + ih}` : ''
  const move = (e) => {
    const r = ref.current.getBoundingClientRect()
    setHover(nearestIndex(e.clientX - r.left, pad.l, iw, n))
  }
  const hp = hover != null ? points[hover] : null
  return (
    <div className="area-chart" ref={ref} style={{ position: 'relative' }} onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel} style={{ display: 'block', touchAction: 'pan-y' }}>
        <defs><linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={COLORS.blue} stopOpacity="0.22" /><stop offset="1" stopColor={COLORS.blue} stopOpacity="0.02" /></linearGradient></defs>
        {scale.ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} style={{ stroke: 'var(--line)' }} strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" style={{ fontSize: 11, fill: 'var(--muted)' }}>{short(t)}</text>
          </g>
        ))}
        {labelIndexes(n, w < 420 ? 4 : 6).map((i) => (
          <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} style={{ fontSize: 11, fill: 'var(--muted)' }}>{points[i].label}</text>
        ))}
        {n > 1 && <polygon points={area} fill="url(#area-fill)" />}
        {hasPrev && n > 1 && <polyline points={line('previous')} fill="none" style={{ stroke: COLORS.slate }} strokeWidth="1.75" strokeDasharray="5 4" />}
        {n > 1 ? <polyline points={line('value')} fill="none" stroke={COLORS.blue} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
        {n === 1 && <circle cx={x(0)} cy={y(points[0].value)} r="4" fill={COLORS.blue} />}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} style={{ stroke: 'var(--muted)' }} strokeWidth="1" />
            <circle cx={x(hover)} cy={y(hp.value)} r="4.5" fill="#fff" stroke={COLORS.blue} strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {hp && (
        <div className="area-tip" role="status" style={{ left: Math.min(Math.max(x(hover) - 70, 4), w - 150) }}>
          <div className="t">{hp.title || hp.label}</div>
          <div><i style={{ background: COLORS.blue }} />Sales <strong>{format(hp.value)}</strong></div>
          {hp.previous != null && <div><i style={{ background: COLORS.slate }} />{previousName} <strong>{format(hp.previous)}</strong></div>}
        </div>
      )}
    </div>
  )
}
