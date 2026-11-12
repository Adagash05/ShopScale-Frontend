import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js'
const alias = { 'react-router-dom': '/tmp/sfh/router-shim.jsx', 'lucide-react': '/tmp/sfh/lucide-shim.jsx' }
await build({
  entryPoints: ['/tmp/sfh/entry.jsx'], bundle: true, outdir: '/tmp/sfh/dist', format: 'iife', jsx: 'automatic', minify: false, loader: { '.js': 'jsx' },
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' }, nodePaths: ['/opt/npm-tools/node_modules'],
  plugins: [{ name: 'alias', setup(b) {
    b.onResolve({ filter: /^(react-router-dom|lucide-react)$/ }, (a) => ({ path: alias[a.path] }))
    b.onResolve({ filter: /components\.jsx$/ }, () => ({ path: '/tmp/sfh/comp-shim.jsx' }))
  } }],
})
console.log('built')
