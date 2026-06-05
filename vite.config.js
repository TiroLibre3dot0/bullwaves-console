import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      // Vercel/Rollup sometimes fails to resolve CSS subpath exports from `reactflow`.
      // Keep a hard alias so legacy imports like `reactflow/dist/style.css` keep working.
      'reactflow/dist/style.css': '@reactflow/core/dist/style.css',
      'reactflow/dist/base.css': '@reactflow/core/dist/base.css',
    },
  },
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
        // IMPORTANT: do not precache HTML. Precaching index.html can pin users
        // to an older UI after deploy if the SW doesn't refresh immediately.
        // Hashed JS/CSS assets are still cached safely.
        globPatterns: ['**/*.{js,css,ico,png,svg,webmanifest}'],
        // Ensure new deployments take effect without users being stuck on an older SW + cached HTML.
        // This makes share-report UX updates visible immediately (or after a single refresh at most).
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-pages',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // Skip per-chunk gzip size reporting — saves 3-5s on large builds
    reportCompressedSize: false,
    // Raise the warning threshold to avoid noise (we know about the large chunks)
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime → tiny, always-cached chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react'
          }
          // ReactFlow / XY-flow — large graph library
          if (id.includes('node_modules/@reactflow/') || id.includes('node_modules/@xyflow/') || id.includes('node_modules/reactflow/')) {
            return 'vendor-reactflow'
          }
          // Charting
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
            return 'vendor-charts'
          }
          // Date / utility libs
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/dayjs') || id.includes('node_modules/lodash')) {
            return 'vendor-utils'
          }
        },
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    watch: {
      // Upload sanitizers rewrite these files; in dev we don't want Vite to full-reload the app.
      ignored: [
        '**/public/*Report.csv',
        '**/public/comments.csv',
        '**/public/reports_meta.json',
        '**/public/*_index.json',
        '**/public/skale/**',
        '**/public/share/org-chart-people.json',
        '**/public/fraud_monitor_*.json',
        '**/public/fraud_monitor_*.csv',
        '**/public/raw/**',
        '**/artifacts/**',
        '**/uploads/**',
      ],
    },
    proxy: {
      '/api/upload': 'http://localhost:4000',
      '/api/upload-stream': 'http://localhost:4000',
      '/api/health': 'http://localhost:4000',
      '/api/skale': 'http://localhost:4000',
      '/api/auth': 'http://localhost:4000',
      '/api/email': 'http://localhost:4000',
      '/api/gmail': 'http://localhost:4000',
      '/api/acuity': 'http://localhost:4000',
      '/api/qlik': 'http://localhost:4000',
    },
  },
})
