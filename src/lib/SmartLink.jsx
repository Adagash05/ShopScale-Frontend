import { Link } from 'react-router-dom'
import { crossTarget } from '../config/env.js'

/**
 * Drop-in replacement for <Link> that works across the two domains: a link to a page the current host does
 * not serve (Sign in on the marketing site, Pricing from inside the app) becomes a normal <a href> to the
 * right origin; everything else stays a client-side router link.
 */
export function SmartLink({ to, children, ...rest }) {
  const abs = typeof to === 'string' ? crossTarget(to) : null
  if (abs) return <a href={abs} {...rest}>{children}</a>
  return <Link to={to} {...rest}>{children}</Link>
}
export default SmartLink
