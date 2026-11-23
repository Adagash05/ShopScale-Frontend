import React from 'react'
export const Link = ({ to, children, ...r }) => React.createElement('a', { href: to, ...r }, children)
export const Navigate = ({ to }) => React.createElement('span', { 'data-navigate': to })
export const useSearchParams = () => [new URLSearchParams(globalThis.__SP || ''), () => {}]
export const useNavigate = () => () => {}
