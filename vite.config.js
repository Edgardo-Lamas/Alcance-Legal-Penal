import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.NODE_ENV === 'production' ? '/Alcance-Legal-Penal/' : '/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Alcance-Legal-Penal/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: base,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Alcance Legal Penal',
        short_name: 'Alcance Legal',
        description: 'Sistema de Inteligencia Jurídica para Defensa Penal — Buenos Aires Province',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Alcance-Legal-Penal/',
        scope: '/Alcance-Legal-Penal/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/Alcance-Legal-Penal/',
        navigateFallbackDenylist: [/^\/api\//],
      }
    })
  ],
  server: {
    host: true,
  }
}))
