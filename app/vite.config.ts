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

      checker({
        typescript: true,
      }),

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
    server: {
      port: 5173,
      open: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  };
});
