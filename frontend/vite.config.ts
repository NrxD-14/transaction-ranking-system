/**
 * Vite dev config — proxies /api/* to FastAPI backend on port 8000.
 * This avoids CORS issues during local development.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['framer-motion', 'react-router-dom', 'recharts', 'axios'],
  },
});
