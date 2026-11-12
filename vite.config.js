import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { checkEnv } from './scripts/check-env.mjs'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('VITE_'))) }
  const problems = checkEnv(env, mode)
  if (problems.length) throw new Error('Invalid ShopScale build configuration:\n - ' + problems.join('\n - '))
  return {
    plugins: [react()],
    build: { target: 'es2019', chunkSizeWarningLimit: 600 },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      css: false,
    },
  }
})
