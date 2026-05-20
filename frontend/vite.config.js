import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Use polling for OneDrive / network-mounted paths on Windows
      usePolling: true,
      interval: 300,
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (
            id.includes('\\react\\') ||
            id.includes('/react/') ||
            id.includes('\\react-dom\\') ||
            id.includes('/react-dom/') ||
            id.includes('\\react-router-dom\\') ||
            id.includes('/react-router-dom/')
          ) {
            return 'vendor-react';
          }

          if (
            id.includes('\\socket.io-client\\') ||
            id.includes('/socket.io-client/')
          ) {
            return 'vendor-socket';
          }

          if (
            id.includes('\\lucide-react\\') ||
            id.includes('/lucide-react/')
          ) {
            return 'vendor-icons';
          }

          return undefined;
        },
      }
    }
  }
})
