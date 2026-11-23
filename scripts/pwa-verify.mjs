// Static checks of the PWA and domain configuration: node scripts/pwa-verify.mjs
// These read the files that will be deployed. They do NOT replace opening the real https://app.shopscale.com.ng and installing it.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectMode } from '../src/config/domains.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const manifest = JSON.parse(read('public/manifest.webmanifest'))
const base = 'https://app.shopscale.com.ng'
const urls = { siteUrl: 'https://shopscale.com.ng', appUrl: base }

test('start_url, scope and id stay on the application origin, inside the scope', () => {
  const start = new URL(manifest.start_url, base), scope = new URL(manifest.scope, base)
  assert.equal(start.origin, base); assert.equal(scope.origin, base)
  assert.ok(start.pathname.startsWith(scope.pathname)); assert.equal(scope.pathname, '/')
  assert.equal(new URL(manifest.id, base).origin, base)
  for (const s of manifest.shortcuts || []) assert.ok(new URL(s.url, base).pathname.startsWith(scope.pathname), s.url)
})
test('the manifest is relative, so it can never point an install at the marketing domain', () => {
  const raw = read('public/manifest.webmanifest')
  assert.ok(!/shopscale\.com\.ng/.test(raw))
})
test('icons exist and a maskable icon is provided', () => {
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(root, 'public', i.src)), i.src)
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'))
  assert.ok(manifest.icons.some((i) => i.sizes === '192x192') && manifest.icons.some((i) => i.sizes === '512x512'))
  assert.equal(manifest.display, 'standalone')
})
test('the service worker never touches API traffic or other origins', () => {
  const sw = read('public/sw.js')
  assert.match(sw, /url\.origin !== self\.location\.origin\) return/)
  assert.match(sw, /startsWith\('\/api\/'\)\) return/)
  assert.ok(!/cache\.put\([^)]*\/api/.test(sw))
  assert.match(sw, /event\.data === 'SKIP_WAITING'/)       // updates wait for the person
  assert.ok(!/self\.skipWaiting\(\)\s*;?\s*\}\)\s*;?\s*\n\s*self\.addEventListener\('activate'/.test(sw))
})
test('the service worker file is registered at the root scope and is never cached by the browser', () => {
  assert.match(read('src/pwa/pwa.js'), /register\('\/sw\.js'\)/)
  const h = read('public/_headers')
  assert.match(h, /\/sw\.js\n\s+Cache-Control: no-cache, no-store, must-revalidate/)
})
test('the app is installable only on the app host: the marketing host retires the PWA', () => {
  assert.equal(detectMode('app.shopscale.com.ng', urls), 'app')
  assert.equal(detectMode('shopscale.com.ng', urls), 'public')
  assert.equal(detectMode('www.shopscale.com.ng', urls), 'public')
  assert.equal(detectMode('localhost', urls), 'unified')
  const main = read('src/main.jsx')
  assert.match(main, /if \(MODE !== 'public'\) initPwa\(\)\nelse retirePwa\(\)/)
  assert.match(read('src/pwa/pwa.js'), /link\[rel="manifest"\]/)
})
test('the app host is not indexed', () => { assert.match(read('public/_headers'), /https:\/\/app\.shopscale\.com\.ng\/\*\n\s+X-Robots-Tag: noindex/) })
test('local and production settings are kept apart', () => {
  const ex = read('.env.example')
  assert.match(ex, /^VITE_API_BASE_URL=http:\/\/localhost:8080$/m)          // the only active line is local
  assert.ok(!/^VITE_(API_BASE_URL|APP_URL|PUBLIC_SITE_URL)=https/m.test(ex))
  assert.match(read('.env.production.example'), /^VITE_APP_URL=https:\/\/app\.shopscale\.com\.ng$/m)
})
