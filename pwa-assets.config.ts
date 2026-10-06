import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the app icons (Android, iPhone home screen, favicon) from public/logo.svg.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.1, resizeOptions: { background: '#1f5c4f' } },
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions: { background: '#1f5c4f' } },
  },
  images: ['public/logo.svg'],
})
