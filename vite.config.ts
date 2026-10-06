import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'Rishta Ghar – Muslim Marriage Bureau',
        short_name: 'Rishta Ghar',
        description: 'Browse Muslim biodata, register your profile and send interests through the bureau.',
        lang: 'en',
        theme_color: '#1f5c4f',
        background_color: '#f7f4f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['lifestyle', 'social'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // Public profile photos: show cached copies quickly, refresh in the background
            urlPattern: ({ url }) => url.pathname.includes('/storage/v1/object/public/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'photos', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
})
