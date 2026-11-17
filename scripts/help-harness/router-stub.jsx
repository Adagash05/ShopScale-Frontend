import React from 'react'
export const STATE = { params: {}, search: '', path: '/help' }
export const Link = ({ to, children, ...r }) => React.createElement('a', { href: to, ...r }, children)
export const NavLink = ({ to, children, className, ...r }) => React.createElement('a', { href: to, className: typeof className === 'function' ? className({ isActive: false }) : className, ...r }, children)
export const Navigate = ({ to }) => React.createElement('span', { 'data-navigate': to })
export const Outlet = () => React.createElement('span', { 'data-outlet': 1 })
export const useLocation = () => ({ pathname: STATE.path, search: STATE.search, hash: '' })
export const useParams = () => STATE.params
export const useSearchParams = () => [new URLSearchParams(STATE.search), () => {}]
export const useNavigate = () => () => {}
