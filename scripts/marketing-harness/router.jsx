import React from 'react'
export const Link = ({ to, children, ...r }) => React.createElement('a', { href: to, ...r }, children)
export const NavLink = ({ to, children, className, ...r }) => React.createElement('a', { href: to, className: typeof className === 'function' ? className({ isActive: false }) : className, ...r }, children)
export const Outlet = () => globalThis.__PAGE
export const useLocation = () => ({ pathname: globalThis.__PATH || '/' })
export const useNavigate = () => () => {}
export const useSearchParams = () => [new URLSearchParams(''), () => {}]
export const Navigate = () => null
