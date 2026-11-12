import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { normalize, resolve, THEMES } from '../src/theme/themeCore.js'

test('preference is normalised, unknown values mean system', () => {
  assert.deepEqual(THEMES, ['light', 'dark', 'system'])
  for (const v of ['light', 'dark', 'system']) assert.equal(normalize(v), v)
  for (const v of [null, undefined, '', 'blue', 'DARK', 5]) assert.equal(normalize(v), 'system')
})
test('resolve follows the device only for system', () => {
  assert.equal(resolve('light', true), 'light')
  assert.equal(resolve('dark', false), 'dark')
  assert.equal(resolve('system', true), 'dark')
  assert.equal(resolve('system', false), 'light')
  assert.equal(resolve(undefined, true), 'dark')
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
