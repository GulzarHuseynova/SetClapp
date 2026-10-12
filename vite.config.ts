import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { UserConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://api-businesscard.setclapp.com').replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    test: {
      testTimeout: 10000,
    } satisfies UserConfig['test'],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
  }
})
