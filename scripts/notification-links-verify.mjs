// Every in-app link the backend puts on a notification must be a route the app registers, otherwise tapping it shows a 404.
// Reads the backend source next to this repo (../ShopScale-Backend) when present; run with: SHOPSCALE_BACKEND_DIR=../ShopScale-Backend node --test scripts/notification-links-verify.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { notificationLink } from '../src/lib/notificationLink.js'

const here = dirname(fileURLToPath(import.meta.url))
const src = join(here, '..', 'src')
const backend = process.env.SHOPSCALE_BACKEND_DIR || join(here, '..', '..', 'ShopScale-Backend')

function walk(d, out = []) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p, out) : out.push(p) } return out }

// Routes of the signed-in app: App.jsx (top-level and inside the layout) + every module registry (paths relative to the shell, i.e. at the root).
const routes = new Set()
const app = readFileSync(join(src, 'App.jsx'), 'utf8')
for (const m of app.matchAll(/<Route path="([^"*]+)"/g)) routes.add('/' + m[1].replace(/^\//, ''))
for (const f of walk(join(src, 'modules')).filter((x) => x.endsWith('index.js'))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/path:\s*'([^']+)'/g)) routes.add('/' + m[1])
}
const matches = (link) => [...routes].some((r) => new RegExp('^' + r.replace(/:[^/]+/g, '[^/]+') + '$').test(link))

test('the route table was read', () => { assert.ok(routes.has('/more/stock') && routes.has('/more/plan') && routes.has('/more/store-inbox')) })

test('legacy saved links are remapped to real pages', () => {
  assert.equal(notificationLink('/stock'), '/more/stock')
  assert.equal(notificationLink('/more/plan'), '/more/plan')
  assert.equal(notificationLink(null), null)
  for (const l of ['/stock', '/more/restaurant']) assert.ok(matches(notificationLink(l)), l)
})

test('every link the backend publishes opens a registered page', { skip: !existsSync(backend) }, () => {
  const links = new Set()
  for (const f of walk(join(backend, 'src', 'main', 'java')).filter((x) => x.endsWith('.java'))) {
    const text = readFileSync(f, 'utf8')
    for (const call of text.matchAll(/\.publish\(([^;]*?)\);/gs)) for (const m of call[1].matchAll(/"(\/[a-z][a-z0-9/_-]*)"/g)) links.add(m[1])
  }
  assert.ok(links.size >= 4, 'found ' + links.size + ' links')
  const bad = [...links].filter((l) => !matches(l))
  assert.deepEqual(bad, [], 'links with no page: ' + bad.join(', '))
})
