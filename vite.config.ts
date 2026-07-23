import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  // Relative asset paths — the built site is served from a GCS subdirectory.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // The player must get the latest build on a plain refresh (a stale
    // bundle was observed during gate 3): never let the dev server's
    // responses be cached.
    headers: {'Cache-Control': 'no-store'},
  },
});
