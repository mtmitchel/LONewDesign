import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://tauri.app/v1/guides/getting-started/setup/vite/#vite-configuration
export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@/features/canvas': path.resolve(__dirname, 'components/modules/Canvas/runtime/features'),
      '@/features': path.resolve(__dirname, 'components/modules/Canvas/runtime/features'),
      '@canvas': path.resolve(__dirname, 'components/modules/Canvas/runtime'),
      '@features/canvas': path.resolve(__dirname, 'components/modules/Canvas/runtime/features'),
      '@': path.resolve(__dirname, 'components/modules/Canvas/runtime'),
      '@canvas-types': path.resolve(__dirname, 'components/modules/Canvas/types/index.ts'),
      '@types': path.resolve(__dirname, 'components/modules/Canvas/types/index.ts'),
      '@canvas-utils': path.resolve(__dirname, 'components/modules/Canvas/runtime/utils')
    }
  },
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