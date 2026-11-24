import React from 'react'
export const SmartLink = ({ to, children, ...r }) => React.createElement('a', { href: to, ...r }, children)
