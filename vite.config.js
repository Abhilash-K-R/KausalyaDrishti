import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// KausalyaDrishti — Vite configuration
// NOTE: `allowedHosts: true` lets the app render inside proxied preview hosts
// (e.g. https://<port>-<sandbox>.e2b.app) without Host-header rejection.
// HMR is disabled so the proxied preview never degrades into a broken
// websocket state; a full browser reload always serves the latest build.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: true,
    hmr: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    cors: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});
