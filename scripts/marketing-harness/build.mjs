// Static-render check of the public marketing pages. Needs only esbuild + react (NPM_TOOLS=/path/to/node_modules).
//   NPM_TOOLS=... node scripts/marketing-harness/build.mjs && node scripts/marketing-harness/out.cjs [outDir]
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here = path.dirname(fileURLToPath(import.meta.url))
const tools = process.env.NPM_TOOLS || path.join(here, '../../node_modules')
const { build } = await import(path.join(tools, 'esbuild/lib/main.js'))
// Every icon the source imports becomes a plain square, so layout is checked without the icon package.
import fs from 'node:fs'
const names = new Set()
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, f.name); if (f.isDirectory()) walk(q); else if (/\.jsx?$/.test(f.name)) for (const m of fs.readFileSync(q, 'utf8').matchAll(/import\s*\{([^}]+)\}\s*from\s*'lucide-react'/g)) m[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach((n) => names.add(n)) } }
walk(path.join(here, '../../src'))
fs.writeFileSync(path.join(here, 'icons.jsx'), "import React from 'react'\nconst make = (n) => ({ size = 20, className }) => React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', 'data-icon': n, className, 'aria-hidden': 'true' }, React.createElement('rect', { x: 4, y: 4, width: 16, height: 16, rx: 4, fill: 'currentColor', opacity: .35 }))\n" + [...names].map((n) => `export const ${n} = make('${n}')`).join('\n') + '\n')
await build({
  entryPoints: [path.join(here, 'entry.jsx')], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(here, 'out.cjs'), logLevel: 'error', jsx: 'automatic',
  loader: { '.js': 'jsx', '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl' },
  alias: { 'react-router-dom': path.join(here, 'router.jsx') },
  define: { 'import.meta.env': '{}', 'import.meta': 'globalThis.__IM' }, banner: { js: 'globalThis.__IM = { env: {}, glob: () => ({}) };' },
  plugins: [{ name: 'mock', setup(b) {
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: path.join(here, 'icons.jsx') }))
    b.onResolve({ filter: /(^|\/)components\.jsx$/ }, (a) => (a.importer.startsWith(here) ? null : { path: path.join(here, 'comp.jsx') }))
    b.onResolve({ filter: /lib\/api(\.js)?$/ }, () => ({ path: path.join(here, 'api.js') }))
    b.onResolve({ filter: /lib\/SmartLink(\.jsx)?$/ }, () => ({ path: path.join(here, 'smartlink.jsx') }))
    b.onResolve({ filter: /analytics\/analytics(\.js)?$/ }, () => ({ path: path.join(here, 'null.js') }))
  } }],
  nodePaths: [tools],
})
