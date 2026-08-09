import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import compression from 'vite-plugin-compression';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
/// <reference types="vitest" />

const API_PROXY_TARGET = process.env.VITE_API_URL || 'http://localhost:8080';
const API_ROUTES = ['/api', '/auth'];

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    base: '',
    plugins: [
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      tailwindcss(),

      svgr(),

      // Dev only. The `build` script already runs `tsc -b` ahead of Vite, so on
      // a production build the checker re-typechecks for nothing — and its
      // TypeScript worker keeps a handle open that stops the build process from
      // exiting once output is written. Locally that just delays the prompt; on
      // Vercel the build hangs past the 45-minute cap and the deploy is killed.
      ...(isDev ? [checker({ typescript: true })] : []),

      ...(!isDev
        ? [
            compression({ algorithm: 'gzip' }),
            compression({
              algorithm: 'brotliCompress',
              ext: '.br',
              threshold: 10240,
            }),
            ViteImageOptimizer({
              png: { quality: 80 },
              jpeg: { quality: 80 },
              webp: { quality: 80 },
              avif: { quality: 70 },
            }),
          ]
        : []),

      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'MDHD - Markdown Reader',
          short_name: 'MDHD',
          description: 'Distraction-free markdown reading experience',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          icons: [
            { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // The `vendor` chunk is just over Workbox's 2 MiB default. Leaving it
          // unprecached is not an option: MDHD is offline-first, and an app
          // shell that cannot boot without the network defeats that. Raised
          // with headroom so an ordinary dependency bump doesn't fail the build.
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
          ],
        },
      }),

      ...(process.env.ANALYZE
        ? [
            visualizer({
              open: true,
              gzipSize: true,
              brotliSize: true,
              filename: 'stats.html',
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    esbuild: {
      drop: isDev ? [] : ['console', 'debugger'],
      legalComments: 'none',
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
    },
    build: {
      minify: 'esbuild',
      target: 'es2020',
      cssMinify: 'lightningcss',
      sourcemap: 'hidden', // Generates source maps without bundle references
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Document import (Word/HTML → markdown). Pulled in only by the
              // dynamic imports in services/import; without its own chunk the
              // catch-all `vendor` rule below would drag ~500 KB of mammoth,
              // jszip, and xmldom into the entry bundle.
              if (
                id.includes('/mammoth/') ||
                id.includes('/turndown/') ||
                id.includes('/turndown-plugin-gfm/') ||
                id.includes('/jszip/') ||
                id.includes('/@xmldom/') ||
                id.includes('/dingbat-to-unicode/')
              ) {
                return 'doc-import';
              }
              // Legacy stream modes (shell, Ruby, Swift, TOML, …) are loaded
              // one language at a time by `language-loader`. Letting Rollup
              // split them keeps each mode its own small async chunk; naming a
              // chunk here would instead pull all of them into the eagerly
              // loaded `codemirror` bundle below.
              if (id.includes('/@codemirror/legacy-modes/')) {
                return undefined;
              }
              if (id.includes('/codemirror/') || id.includes('/@codemirror/')) {
                return 'codemirror';
              }
              if (id.includes('/@radix-ui/') || id.includes('/lucide-react/')) {
                return 'ui-vendor';
              }
              if (id.includes('/zustand/')) {
                return 'state-vendor';
              }
              if (id.includes('/dexie/') || id.includes('/d3-force/') || id.includes('/d3-')) {
                return 'data-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
    server: {
      port: 5173,
      host: true,
      open: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
      proxy: Object.fromEntries(
        API_ROUTES.map((route) => [route, { target: API_PROXY_TARGET, changeOrigin: true }])
      ),
    },
  };
});
