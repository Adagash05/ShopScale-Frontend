import { useEffect } from 'react'

export const SITE = (import.meta.env.VITE_SITE_URL || 'https://shopscale.fidmap.co').replace(/\/$/, '')

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

/** Sets the title, description, canonical URL and Open Graph tags for a public page. */
export function useSeo({ title, description, path = '/', noindex = false }) {
  useEffect(() => {
    const full = title.includes('ShopScale') ? title : `${title} · ShopScale`
    document.title = full
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', full)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'ShopScale by AMSATI')
    setMeta('property', 'og:url', SITE + path)
    setMeta('name', 'twitter:card', 'summary')
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link) }
    link.setAttribute('href', SITE + path)
  }, [title, description, path, noindex])
}
