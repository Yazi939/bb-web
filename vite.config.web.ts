import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Конфигурация для веб-сборки (GitHub Pages)
export default defineConfig({
  plugins: [react()],
  base: './',
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'web-deploy'),
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index-web.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name].[ext]`;
          }
          if (/css/i.test(ext)) {
            return `styles/[name].[ext]`;
          }
          return `assets/[name].[ext]`;
        },
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'utils-vendor': ['dayjs', 'xlsx', 'axios']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  define: {
    '__ELECTRON_DEV__': JSON.stringify(false),
    '__WEB_VERSION__': JSON.stringify(true),
    'process.env.NODE_ENV': JSON.stringify('production')
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
      '@styles': resolve(__dirname, './src/styles'),
      // Заменяем electron-специфичные модули на веб-версии
      'electron': resolve(__dirname, './src/mock-electron.ts')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    exclude: ['electron', 'sqlite3'],
    include: ['xlsx', 'dayjs', 'axios', 'antd']
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2020'
  }
}); 