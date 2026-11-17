import React from 'react'
const Null = () => null
export const Link = ({ to, children, ...r }) => React.createElement('a', { href: to, ...r }, children)
export const NavLink = Link
export const Navigate = ({ to }) => React.createElement('span', { 'data-navigate': to })
export const Outlet = () => React.createElement('span', { 'data-outlet': 1 })
export const useLocation = () => ({ pathname: '/x', search: '', hash: '' })
export const useParams = () => ({ id: 'abc' })
export const useSearchParams = () => [new URLSearchParams(), () => {}]
export const useNavigate = () => () => {}
export const Routes = Null, Route = Null
const handler = { get: (_, k) => (k === '__esModule' ? true : Null) }
export default new Proxy({}, handler)
