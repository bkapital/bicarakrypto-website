import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
        },
        '/binance-spot-api': {
          target: 'https://api-gcp.binance.com',
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/binance-spot-api/, '/api'),
        },
        '/binance-api': {
          target: 'https://fapi.binance.com',
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/binance-api/, '/fapi'),
        },
        '/binance-data': {
          target: 'https://fapi.binance.com',
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/binance-data/, ''),
        },
        '/binance-ws': {
          target: 'wss://fstream.binance.com',
          changeOrigin: true,
          ws: true,
          rewrite: (requestPath) => requestPath.replace(/^\/binance-ws/, '/stream'),
        },
        '/gate-api': {
          target: 'https://api.gateio.ws',
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/gate-api/, '/api/v4'),
        },
      },
    },
  };
});
