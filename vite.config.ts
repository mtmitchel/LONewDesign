import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://tauri.app/v1/guides/getting-started/setup/vite/#vite-configuration
export default defineConfig(() => ({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to other ports
    host: 'localhost',
    // Tauri recommends these for dev
    hmr: { overlay: true }
  },
  build: {
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    outDir: 'dist'
  },
  optimizeDeps: {
    exclude: []
  }
}));