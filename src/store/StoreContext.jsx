import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useLoad } from '../components.jsx'
import { cartKey as lineKey, cartLines, categoriesOf, clampQty, groupProducts, parseKey, presentation } from './presentation.js'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

// Same key and shape as the original storefront ({variantId: quantity}) so customers' existing carts survive the redesign.
const cartKey = (slug) => `shopscale.cart.${slug}`
const readCart = (slug) => { try { return JSON.parse(localStorage.getItem(cartKey(slug))) || {} } catch { return {} } }
const writeCart = (slug, c) => { try { localStorage.setItem(cartKey(slug), JSON.stringify(c)) } catch { /* private mode */ } }

export function StoreProvider({ children }) {
  const { slug } = useParams()
  const info = useLoad(() => api.public.get(`/public/store/${slug}`), [slug])
  const items = useLoad(() => api.public.get(`/public/store/${slug}/products`), [slug])
  const [cart, setCart] = useState(() => readCart(slug))
  const [toast, setToast] = useState(null)
  const [removed, setRemoved] = useState(0)
  useEffect(() => { setCart(readCart(slug)) }, [slug])
  useEffect(() => writeCart(slug, cart), [slug, cart])
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t) }, [toast])

  const products = useMemo(() => groupProducts(items.data || []), [items.data])
  const categories = useMemo(() => categoriesOf(products), [products])
  const byId = useMemo(() => Object.fromEntries((items.data || []).map((i) => [i.variantId, i])), [items.data])
  const view = useMemo(() => cartLines(cart, byId), [cart, byId])

  // Once the live catalogue is known, drop cart entries that no longer exist or are sold out, and tell the customer.
  useEffect(() => {
    if (!items.data || !view.missing) return
    setRemoved((n) => n + view.missing)
    setCart((c) => Object.fromEntries(Object.entries(c).filter(([k, q]) => cartLines({ [k]: q }, byId).lines.length)))
  }, [items.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const setQty = useCallback((id, qty) => setCart((c) => {
    const item = byId[parseKey(id).variantId]
    const next = item ? clampQty(item, qty) : qty
    const n = { ...c }
    if (!(next > 0)) delete n[id]; else n[id] = next
    return n
  }), [byId])
  const add = useCallback((item, qty = 1, optionIds = []) => {
    const key = lineKey(item.variantId, optionIds)
    setCart((c) => ({ ...c, [key]: clampQty(item, (Number(c[key]) || 0) + qty) }))
    setToast({ text: `${item.name}${item.label ? ` (${item.label})` : ''} added`, to: 'cart' })
  }, [])
  const clear = useCallback(() => { setCart({}); writeCart(slug, {}) }, [slug])

  const value = {
    slug, base: `/s/${slug}`, info: info.data, infoError: info.error, infoLoading: !info.data && !info.error,
    pres: presentation(info.data?.businessType), items: items.data, itemsError: items.error, itemsLoading: items.loading && !items.data, reload: () => { info.reload(); items.reload() },
    products, categories, byId, cart, ...view, setQty, add, clear, toast, setToast, removed, dismissRemoved: () => setRemoved(0),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
