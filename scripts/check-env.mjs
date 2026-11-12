/** Build-time guard: a production build must know its API and, unless it is a single-origin build, both site URLs. */
export function checkEnv(env, mode) {
  if (mode !== 'production') return []
  const problems = []
  const api = env.VITE_API_BASE_URL || env.VITE_API_URL
  if (!api) problems.push('VITE_API_BASE_URL is not set (production builds must never fall back to localhost).')
  else if (/localhost|127\.0\.0\.1/.test(api)) problems.push(`VITE_API_BASE_URL points at ${api}; use the public API URL.`)
  if (env.VITE_SITE_MODE !== 'unified') {
    if (!(env.VITE_PUBLIC_SITE_URL || env.VITE_SITE_URL)) problems.push('VITE_PUBLIC_SITE_URL is not set (e.g. https://shopscale.com.ng). Set VITE_SITE_MODE=unified for a single-origin build.')
    if (!env.VITE_APP_URL) problems.push('VITE_APP_URL is not set (e.g. https://app.shopscale.com.ng). Set VITE_SITE_MODE=unified for a single-origin build.')
  }
  for (const k of Object.keys(env)) if (/^VITE_.*(SECRET|PASSWORD|PRIVATE)/i.test(k)) problems.push(`${k} looks like a secret. VITE_* values are public; remove it.`)
  return problems
}
