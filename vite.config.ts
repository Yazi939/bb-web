import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Check if HMR is disabled via environment variable
const disableHmr = process.env.VITE_DISABLE_HMR === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/bb-web/',
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'chrome95',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'utils-vendor': ['dayjs', 'xlsx']
        }
      },
      external: [
        'electron',
        'path',
        'util',
        'crypto',
        'assert',
        'events',
        'os'
      ]
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    headers: {
      'Content-Security-Policy': [
        "default-src 'self' file: http://localhost:* ws://localhost:* http://89.169.170.164:* ws://89.169.170.164:*;",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' file:;",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com file:;",
        "img-src 'self' data: blob: file: http://localhost:* https:;",
        "font-src 'self' data: https://fonts.gstatic.com file:;",
        "connect-src 'self' ws://localhost:* http://localhost:* ws://89.169.170.164:* http://89.169.170.164:* ws://89.169.170.164:5000 http://89.169.170.164:5000;",
        "worker-src 'self' blob: file:;",
        "frame-src 'self' file:;"
      ].join(' ')
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: !disableHmr && {
      protocol: 'ws',
      host: 'localhost',
      port: 5174,
      clientPort: 5174,
      timeout: 5000
    }
  },
  define: {
    '__ELECTRON_DEV__': JSON.stringify(true),
    '__DISABLE_HMR__': JSON.stringify(disableHmr),
    '__dirname': JSON.stringify(__dirname),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@assets': resolve(__dirname, './src/assets'),
      '@styles': resolve(__dirname, './src/styles')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    exclude: ['electron', 'sqlite3'],
    include: ['xlsx']
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    tsconfigRaw: {
      compilerOptions: {
        // ignoreDeprecations: "5.0"  // <-- удалено
      }
    }
  }
}); 