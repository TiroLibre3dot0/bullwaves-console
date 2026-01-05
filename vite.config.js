import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.webmanifest',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Bullwaves — Console',
        short_name: 'Bullwaves',
        description: 'Bullwaves analytics & support console',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0a122a',
        theme_color: '#0036ff',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
  server: {
    watch: {
      // Upload sanitizers rewrite these files; in dev we don't want Vite to full-reload the app.
      ignored: [
        '**/public/*Report.csv',
        '**/public/raw/**',
        '**/uploads/**',
      ],
    },
    proxy: {
      '/api/upload': 'http://localhost:4000',
      '/api/upload-stream': 'http://localhost:4000',
      '/api/health': 'http://localhost:4000',
    },
  },
})
