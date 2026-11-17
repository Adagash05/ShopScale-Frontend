// Renders the Help Centre and How It Works pages to HTML and checks them. Needs esbuild + react.
//   NPM_TOOLS=/opt/npm-tools/node_modules node scripts/help-harness/build.mjs && node scripts/help-harness/out.cjs
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const here = path.dirname(fileURLToPath(import.meta.url))
const tools = process.env.NPM_TOOLS || path.join(here, '../../node_modules')
const { build } = await import(path.join(tools, 'esbuild/lib/main.js'))
await build({
  entryPoints: [path.join(here, 'entry.jsx')], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(here, 'out.cjs'), logLevel: 'error', jsx: 'automatic',
  loader: { '.js': 'jsx', '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl' },
  alias: { 'react-router-dom': path.join(here, 'router-stub.jsx'), 'lucide-react': path.join(here, 'lucide-stub.jsx') },
  define: { 'import.meta.env': '{}', 'import.meta': 'globalThis.__IM' }, banner: { js: 'globalThis.__IM = { env: {}, glob: () => ({}) };' },
  nodePaths: [tools],
})
