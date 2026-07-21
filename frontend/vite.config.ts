import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const backendUrl = env.VITE_BACKEND_HOST
  const devServerPort = Number(env.VITE_DEV_SERVER_PORT ?? '5173')
  const proxyTimeoutMs = Number(env.VITE_PROXY_TIMEOUT_MS ?? String(10 * 60 * 1000))

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: devServerPort,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          timeout: proxyTimeoutMs,
          proxyTimeout: proxyTimeoutMs,
        },
        '/receipts': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/media': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
