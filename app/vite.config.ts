import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import checker from 'vite-plugin-checker';
import compression from 'vite-plugin-compression';
import svgr from 'vite-plugin-svgr';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

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

      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }),
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
