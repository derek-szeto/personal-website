import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Preserve the browser's Host so owner setup can redirect to its canonical
  // callback origin and favorite submissions can validate their real Origin.
  server: { proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false } } },
  preview: { proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false } } },
});
