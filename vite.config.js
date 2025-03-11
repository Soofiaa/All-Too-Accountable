import { defineConfig } from 'vite';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      crypto: 'rollup-plugin-node-polyfills/polyfills/crypto-browserify.js'
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['crypto', 'uuid'],
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
  },
});
