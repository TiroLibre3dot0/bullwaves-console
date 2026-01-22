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
        // Keep SW disabled in dev to avoid "blank screen" issues caused by stale caches.
        // Enable explicitly if you want to debug the PWA locally: `VITE_PWA_DEV=true npm run dev`
        enabled: process.env.VITE_PWA_DEV === 'true',
        // Allow SPA routes like /analysis to fall back to index.html in dev SW
        navigateFallbackAllowlist: [/^\/(?!api)/],
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
        // Ensure new deployments take effect without users being stuck on an older SW + cached HTML.
        // This makes share-report UX updates visible immediately (or after a single refresh at most).
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Upload sanitizers rewrite these files; in dev we don't want Vite to full-reload the app.
      ignored: [
        '**/public/*Report.csv',
        '**/public/comments.csv',
        '**/public/reports_meta.json',
        '**/public/*_index.json',
        '**/public/share/org-chart-people.json',
        '**/public/fraud_monitor_*.json',
        '**/public/fraud_monitor_*.csv',
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
