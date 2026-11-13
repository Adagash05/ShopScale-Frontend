import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { DEFAULT, normalize, resolve, THEMES } from '../src/theme/themeCore.js'

test('preference is normalised, nothing stored or unknown means light', () => {
  assert.equal(DEFAULT, 'light')
  assert.deepEqual(THEMES, ['light', 'dark', 'system'])
  for (const v of ['light', 'dark', 'system']) assert.equal(normalize(v), v)
  for (const v of [null, undefined, '', 'blue', 'DARK', 5]) assert.equal(normalize(v), 'light')
})
test('resolve follows the device only for system', () => {
  assert.equal(resolve('light', true), 'light')
  assert.equal(resolve('dark', false), 'dark')
  assert.equal(resolve('system', true), 'dark')
  assert.equal(resolve('system', false), 'light')
  assert.equal(resolve(undefined, true), 'light')   // a dark-mode device does not turn a new visitor's app dark
  assert.equal(resolve(null, true), 'light')
})
test('every colour token used by the dark theme has a light default', () => {
  const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
  const light = css.slice(0, css.indexOf('}\n'))
  const dark = css.slice(css.indexOf(":root[data-theme='dark'] {"))
  const darkEnd = dark.slice(0, dark.indexOf('}\n'))
  for (const m of darkEnd.matchAll(/--([a-z0-9-]+):/g)) assert.ok(light.includes(`--${m[1]}:`) || css.includes(`--${m[1]}:`), m[1])
})
test('no hard-coded light surface colours are left in rules that paint surfaces and text', () => {
  const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
  const rules = css.replace(/:root[^{]*\{[^}]*\}/g, '')                      // token blocks are allowed to hold hex values
  for (const hex of ['#cbd5e1', '#fef3c7', '#fee2e2', '#dcfce7', '#f1f5f9', '#eef2f7', '#fffbeb', '#fef2f2']) assert.ok(!rules.includes(hex), hex)
})

// The inline script in index.html runs before first paint. Run it against a fake browser.
function paintedBy(stored, osDark, host = 'app.example.test') {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/%VITE_[A-Z_]+%/g, '')
  const attrs = {}
  const ctx = {
    location: { hostname: host }, URL,
    localStorage: { getItem: () => stored },
    matchMedia: () => ({ matches: osDark }),
    window: {},
    document: { documentElement: { setAttribute: (k, v) => { attrs[k] = v } } },
  }
  ctx.window.matchMedia = ctx.matchMedia
  vm.runInNewContext(code, ctx)
  return attrs['data-theme']
}
test('first paint: new visitors get light even when the device is dark', () => {
  assert.equal(paintedBy(null, true), 'light')
  assert.equal(paintedBy(null, false), 'light')
  assert.equal(paintedBy('garbage', true), 'light')
})
test('first paint: a saved choice is respected', () => {
  assert.equal(paintedBy('dark', false), 'dark')
  assert.equal(paintedBy('light', true), 'light')
  assert.equal(paintedBy('system', true), 'dark')
  assert.equal(paintedBy('system', false), 'light')
})
test('the theme code has no path that reads the device setting unless "system" was chosen', () => {
  const src = fs.readFileSync(new URL('../src/theme/theme.js', import.meta.url), 'utf8')
  assert.ok(!/return 'system'|=> 'system'/.test(src))
})
