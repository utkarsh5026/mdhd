import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import checker from 'vite-plugin-checker';
import compression from 'vite-plugin-compression';
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
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('codemirror') || id.includes('@codemirror')) {
                return 'codemirror';
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              if (id.includes('zustand')) {
                return 'state-vendor';
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
