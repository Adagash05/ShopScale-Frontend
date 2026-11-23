// Development-time validation report for the visual Help Centre. Lists, per article, every picture the article expects and whether
// the file exists, so a missing screenshot is never silently hidden. Reads src/help/shots.js and the real article content.
//   node scripts/help-visual-report.mjs            exit code 1 if anything is missing
//   node scripts/help-visual-report.mjs --json     machine-readable
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SHOTS, VISUAL } from '../src/help/shots.js'
import { ARTICLES } from '../src/help/data.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const dir = path.join(here, '../public/help/shots')
const has = (id) => fs.existsSync(path.join(dir, id + '.png'))
const byId = new Map(SHOTS.map((s) => [s.id, s]))
const rows = []
for (const a of ARTICLES) {
  const key = `${a.cat}/${a.id}`
  const need = []
  for (const b of a.blocks) {
    if (b.t === 'vsteps') b.items.forEach((x, i) => x.shot && need.push({ kind: 'step ' + (i + 1), id: x.shot }))
    if (b.t === 'shot') need.push({ kind: 'figure', id: b.id })
  }
  if (need.length) rows.push({ article: key, title: a.title, need: need.map((n) => ({ ...n, present: has(n.id), known: byId.has(n.id) })) })
}
const missing = rows.flatMap((r) => r.need.filter((n) => !n.present).map((n) => ({ article: r.article, ...n })))
const unknown = rows.flatMap((r) => r.need.filter((n) => !n.known).map((n) => ({ article: r.article, ...n })))
const priority = ['getting-started', 'products', 'sales', 'storefront', 'orders', 'purchasing', 'restaurant', 'catering', 'employees', 'branches', 'finance']
const noVisual = ARTICLES.filter((a) => priority.includes(a.cat) && !rows.find((r) => r.article === `${a.cat}/${a.id}`)).map((a) => `${a.cat}/${a.id}`)

if (process.argv.includes('--json')) { console.log(JSON.stringify({ rows, missing, unknown, noVisual }, null, 1)); process.exit(missing.length || unknown.length ? 1 : 0) }
let total = 0, ok = 0
for (const r of rows) {
  console.log(`\n${r.article}  (${r.title})`)
  for (const n of r.need) { total++; if (n.present) ok++; console.log(`  ${n.present ? 'ok     ' : 'MISSING'} ${n.kind.padEnd(8)} ${n.id}${n.known ? '' : '  <- not defined in shots.js'}`) }
}
console.log(`\nArticles with pictures: ${rows.length}.  Picture slots: ${total}.  Files present: ${ok}.  Missing: ${total - ok}.`)
console.log(`Distinct shots defined: ${SHOTS.length}; files present: ${SHOTS.filter((s) => has(s.id)).length}.`)
if (unknown.length) console.log(`\nReferenced but not defined: ${unknown.map((u) => u.id).join(', ')}`)
if (noVisual.length) console.log(`\nPriority-category articles with no step pictures (text only, by design or not yet covered):\n - ${noVisual.join('\n - ')}`)
if (missing.length) console.log(`\n${missing.length} missing slot(s). Run the capture script (docs/LOCAL_DEMO_AND_SCREENSHOTS.md).`)
process.exit(missing.length || unknown.length ? 1 : 0)
