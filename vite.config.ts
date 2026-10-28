import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Repo's canonical name on GitHub; do not derive from the clone URL.
export default defineConfig({
  base: '/Valheim-Site/',
  // Icons stay separate files (cached by the service worker) instead of base64 inside the entry chunk.
  build: { assetsInlineLimit: 0 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Valheim Companion',
        short_name: 'Valheim',
        description:
          'Personal Valheim companion: search, recipes, checklist and progression guide.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#111111',
        theme_color: '#111111',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json,webmanifest}'],
        // Only the Latin font subsets are needed; skip the rest to keep the first load small.
        globIgnores: ['**/*cyrillic*', '**/*greek*', '**/*vietnamese*'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'] },
});
