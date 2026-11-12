import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
const Loc = createContext(null), Par = createContext({}), Rem = createContext(null), Out = createContext(null)
const subs = new Set()
const go = (to, replace) => { history[replace ? 'replaceState' : 'pushState']({}, '', to); subs.forEach((f) => f()) }
export function BrowserRouter({ children }) {
  const [loc, setLoc] = useState({ pathname: location.pathname, search: location.search })
  useEffect(() => { const f = () => setLoc({ pathname: location.pathname, search: location.search }); subs.add(f); addEventListener('popstate', f); return () => { subs.delete(f); removeEventListener('popstate', f) } }, [])
  return <Loc.Provider value={loc}>{children}</Loc.Provider>
}
export function Route() { return null }
const toRoutes = (children) => React.Children.toArray(children).filter(Boolean).map((c) => ({ path: c.props.path, index: c.props.index, element: c.props.element, kids: c.props.children ? toRoutes(c.props.children) : null }))
function matchPath(pattern, rem) {
  const ps = pattern.split('/').filter(Boolean), rs = rem.split('/').filter(Boolean), params = {}
  for (let i = 0; i < ps.length; i++) {
    if (ps[i] === '*') return { params, rest: '/' + rs.slice(i).join('/'), splat: true }
    if (rs[i] === undefined) return null
    if (ps[i].startsWith(':')) params[ps[i].slice(1)] = decodeURIComponent(rs[i]); else if (ps[i] !== rs[i]) return null
  }
  return { params, rest: '/' + rs.slice(ps.length).join('/') }
}
function match(routes, rem) {
  for (const r of routes) {
    if (r.index) { if (rem === '/' || rem === '') return [{ r, params: {}, rest: '' }]; continue }
    if (r.path === undefined) { const sub = match(r.kids || [], rem); if (sub) return [{ r, params: {}, rest: rem }, ...sub]; continue }
    const m = matchPath(r.path, rem); if (!m) continue
    if (r.kids) { const sub = match(r.kids, m.rest); if (sub) return [{ r, params: m.params, rest: m.rest }, ...sub]; continue }
    if (m.splat || m.rest === '/' || m.rest === '') return [{ r, params: m.params, rest: m.rest }]
  }
  return null
}
function Level({ chain, i }) {
  const m = chain[i]; if (!m) return null
  const par = useContext(Par)
  return <Par.Provider value={{ ...par, ...m.params }}><Rem.Provider value={m.rest}><Out.Provider value={<Level chain={chain} i={i + 1} />}>{m.r.element}</Out.Provider></Rem.Provider></Par.Provider>
}
export function Routes({ children }) {
  const loc = useContext(Loc), rem = useContext(Rem)
  const routes = useMemo(() => toRoutes(children), [children])
  const chain = match(routes, rem == null ? loc.pathname : rem)
  return chain ? <Level chain={chain} i={0} /> : null
}
export const Outlet = () => useContext(Out)
export const useParams = () => useContext(Par)
export const useLocation = () => useContext(Loc)
export const useNavigate = () => (to, o) => go(to, o && o.replace)
export function useSearchParams() { const l = useContext(Loc); return [new URLSearchParams(l.search), (p, o) => go(location.pathname + (String(p) ? '?' + new URLSearchParams(p) : ''), o && o.replace)] }
export function Link({ to, children, ...r }) { return <a href={to} {...r} onClick={(e) => { if (e.metaKey || e.ctrlKey || r.target) return; e.preventDefault(); go(to) }}>{children}</a> }
export function NavLink({ to, end, children, ...r }) { const l = useContext(Loc); const on = end ? l.pathname === to : l.pathname.startsWith(to); return <Link to={to} aria-current={on ? 'page' : undefined} {...r}>{children}</Link> }
export const Navigate = ({ to }) => { useEffect(() => go(to, true), []); return null }
