import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const require = createRequire(import.meta.url)
const pinoEntryPath = require.resolve('pino')
const pinoBrowserEntryPath = resolve(dirname(pinoEntryPath), 'browser.js')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^pino$/,
        replacement: fileURLToPath(new URL('./src/shims/pino.ts', import.meta.url)),
      },
      {
        find: /^pino\/browser$/,
        replacement: pinoBrowserEntryPath,
      },
    ],
  },
  optimizeDeps: {
    exclude: ['@swmansion/smelter-web-wasm'],
  },
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/ws': {
        target: 'ws://localhost:3002',
        ws: true,
      },
    },
  },
})
