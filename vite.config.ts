import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // The service worker and precache manifest are generated rather than
    // hand-written: cache invalidation on every deploy is exactly the kind of
    // infrastructure not worth owning by hand.
    VitePWA({
      // The single-file demo is one self-contained HTML file with no origin to
      // serve /sw.js from, so registering one there would only throw. Disabled
      // turns the virtual register module into a no-op.
      disable: mode === 'demo',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Finini Dashboard',
        short_name: 'Finini',
        description:
          'Personal task and project dashboard with a week-by-week timeline view.',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The app's data lives on the device, so precaching the shell is all
        // that's needed for it to open with no connection at all.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
      },
      // Off in dev: a service worker caching a dev server is a debugging trap.
      devOptions: { enabled: false },
    }),
  ],
}))
