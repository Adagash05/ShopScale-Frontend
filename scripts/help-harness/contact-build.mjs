// Renders the Kitchen and Catering screens with realistic API data and checks them. Needs only esbuild + react.
//   NPM_TOOLS=/path/to/node_modules node scripts/kc-harness/build.mjs && node scripts/kc-harness/../help-harness/contact-out.cjs
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here = path.dirname(fileURLToPath(import.meta.url))
const tools = process.env.NPM_TOOLS || path.join(here, '../../node_modules')
const { build } = await import(path.join(tools, 'esbuild/lib/main.js'))
await build({
  entryPoints: [path.join(here, 'contact-entry.jsx')], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(here, 'contact-out.cjs'), logLevel: 'error', jsx: 'automatic',
  loader: { '.js': 'jsx', '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl' },
  alias: { 'react-router-dom': path.join(here, 'router-stub.jsx'), 'lucide-react': path.join(here, 'lucide-stub.jsx') },
  define: { 'import.meta.env': '{}', 'import.meta': 'globalThis.__IM' }, banner: { js: 'globalThis.__IM = { env: {}, glob: () => ({}) };' },
  plugins: [{ name: 'mock', setup(b) {
    b.onResolve({ filter: /(^|\/)components\.jsx$/ }, (a) => (a.importer.startsWith(path.join(here, '../kc-harness')) ? null : { path: path.join(here, '../kc-harness/comp_mock.jsx') }))
    b.onResolve({ filter: /lib\/api(\.js)?$/ }, () => ({ path: path.join(here, '../kc-harness/api_mock.js') }))
    b.onResolve({ filter: /auth\/AuthContext(\.jsx)?$/ }, () => ({ path: path.join(here, '../kc-harness/auth_mock.jsx') }))
  } }],
  nodePaths: [tools],
})
