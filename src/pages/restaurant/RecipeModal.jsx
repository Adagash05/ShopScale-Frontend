import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { Confirm, ErrorBox, Field, ListSkeleton, Modal, useLoad, useToast } from '../../components.jsx'
import { money } from '../../lib/format.js'
import { loadProducts, variantName } from './shared.js'

const MODES = {
  ON_SALE: 'Use the ingredients when it is sold (made fresh)',
  PRODUCTION: 'Use the ingredients when I record production (made ahead)',
}

/** Recipe for one menu item or finished product: how much of each ingredient it takes to make `yield` units. */
export default function RecipeModal({ product, variant, onClose, onDone }) {
  const toast = useToast()
  const data = useLoad(async () => {
    const [recipe, products] = await Promise.all([api.get(`/recipes/${variant.id}`), loadProducts()])
    const ingredients = products.filter((p) => p.kind === 'INGREDIENT').flatMap((p) => p.variants.map((v) => ({ id: v.id, name: variantName(p, v), unit: v.unit })))
    return { recipe: recipe || null, ingredients }
  }, [variant.id])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(false)

  const d = data.data
  if (d && !form) {
    setForm({
      yieldQuantity: String(d.recipe?.yieldQuantity ?? 1),
      mode: d.recipe?.mode || (product.kind === 'FINISHED' ? 'PRODUCTION' : 'ON_SALE'),
      notes: d.recipe?.notes || '',
      lines: d.recipe ? d.recipe.lines.map((l) => ({ ingredientVariantId: l.ingredientVariantId, quantity: String(l.quantity) })) : [{ ingredientVariantId: '', quantity: '' }],
    })
  }
  const unitOf = (id) => d?.ingredients.find((i) => i.id === id)?.unit || ''

  async function save() {
    const lines = form.lines.filter((l) => l.ingredientVariantId || l.quantity)
    if (lines.length === 0) { setError('Add at least one ingredient'); return }
    if (lines.some((l) => !l.ingredientVariantId || !(Number(l.quantity) > 0))) { setError('Every ingredient needs a quantity above zero'); return }
    if (!(Number(form.yieldQuantity) > 0)) { setError('Say how many it makes'); return }
    setBusy(true); setError('')
    try {
      await api.put(`/recipes/${variant.id}`, { yieldQuantity: Number(form.yieldQuantity), mode: form.mode, notes: form.notes || null, lines: lines.map((l) => ({ ingredientVariantId: l.ingredientVariantId, quantity: Number(l.quantity) })) })
      toast('Recipe saved'); onDone(); onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true)
    try { await api.del(`/recipes/${variant.id}`); toast('Recipe removed'); onDone(); onClose() } catch (e) { toast(e.message, 'error'); setRemoving(false) } finally { setBusy(false) }
  }

  return (
    <Modal title={`Recipe: ${variantName(product, variant)}`} onClose={onClose}>
      {data.loading && <ListSkeleton rows={3} />}
      <ErrorBox error={data.error} onRetry={data.reload} />
      {d && d.ingredients.length === 0 && <div className="banner warn">You have no ingredients yet. Add products of type "Ingredient" first (Products, Add product).</div>}
      {form && d && (
        <>
          <Field label="This recipe makes" htmlFor="rc-yield" hint="For example 1 plate, or 12 for a batch of buns"><input id="rc-yield" className="input" type="number" inputMode="decimal" min="0" value={form.yieldQuantity} onChange={(e) => setForm({ ...form, yieldQuantity: e.target.value })} /></Field>
          <div className="stack-sm" role="radiogroup" aria-label="When ingredients are used">
            {Object.entries(MODES).map(([id, label]) => <label key={id} className="row"><input type="radio" name="mode" checked={form.mode === id} onChange={() => setForm({ ...form, mode: id })} /><span>{label}</span></label>)}
          </div>
          <div className="stack-sm">
            {form.lines.map((l, i) => (
              <div className="row" key={i}>
                <select className="select grow" aria-label={`Ingredient ${i + 1}`} value={l.ingredientVariantId} onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => (j === i ? { ...x, ingredientVariantId: e.target.value } : x)) })}>
                  <option value="">Choose ingredient</option>
                  {d.ingredients.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <input className="input" style={{ maxWidth: 110 }} type="number" inputMode="decimal" min="0" placeholder={unitOf(l.ingredientVariantId) || 'Qty'} aria-label={`Quantity of ingredient ${i + 1}`} value={l.quantity}
                  onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)) })} />
                <button className="icon-btn" aria-label={`Remove ingredient ${i + 1}`} onClick={() => setForm({ ...form, lines: form.lines.filter((_, j) => j !== i) })}><Trash2 size={18} /></button>
              </div>
            ))}
            <button className="btn sm" onClick={() => setForm({ ...form, lines: [...form.lines, { ingredientVariantId: '', quantity: '' }] })}><Plus size={16} /> Add ingredient</button>
          </div>
          <Field label="Notes (optional)" htmlFor="rc-notes"><input id="rc-notes" className="input" maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          {d.recipe && <div className="muted">Cost to make one: {money(d.recipe.costPerUnit)} (from your ingredient costs)</div>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn primary block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save recipe'}</button>
          {d.recipe && <button className="btn danger block" onClick={() => setRemoving(true)} disabled={busy}>Remove recipe</button>}
        </>
      )}
      {removing && <Confirm title="Remove this recipe?" danger busy={busy} message="Stock will no longer be used up when this is sold or made." confirmLabel="Remove" onConfirm={remove} onClose={() => setRemoving(false)} />}
    </Modal>
  )
}
