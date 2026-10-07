import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/game-glassworks/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: "Glassworks – A Glass-Blower's Sorting Puzzle",
        short_name: 'Glassworks',
        description: "A real-time Venetian glass-blower's conveyor sorting puzzle for iPad and mobile.",
        theme_color: '#2b160c',
        background_color: '#160c08',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/game-glassworks/',
        scope: '/game-glassworks/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'glassworks-data',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ]
})
