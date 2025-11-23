import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '逆袭成长中控台',
        short_name: 'Growth',
        description: '极简个人成长任务管理系统',
        theme_color: '#ffffff',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://img.icons8.com/fluency/192/wind-rose.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://img.icons8.com/fluency/512/wind-rose.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
