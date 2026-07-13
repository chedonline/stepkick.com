import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// base './' so it works both at stepkick.com and at the *.github.io/<repo>/ URL.
export default defineConfig({
  base: './',
  build: {
    // Build OUTSIDE the Dropbox tree: Dropbox watchers hold Windows file locks
    // on dist/ and randomly break `vite build` with EBUSY.
    outDir: join(tmpdir(), 'stepkick-build'),
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      workbox: {
        // Precache everything — the whole game works offline.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'Stepkick',
        short_name: 'Stepkick',
        description: 'A picture, four choices. Learning that feels like a game.',
        theme_color: '#0f1226',
        background_color: '#0f1226',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
