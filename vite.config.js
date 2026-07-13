import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/fuel-tracker-DPNE03/',
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Xóa bỏ hoàn toàn console.log khi build production
        drop_debugger: true // Xóa bỏ debugger khi build production
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'Icon1.png', 'icon-128.png', 'favicon-32.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Xăng Xe',
        short_name: 'Xăng Xe',
        description: 'Ứng dụng quản lý nhiên liệu và chi phí xe offline-first',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
