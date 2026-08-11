import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.SERVER_URL ?? 'http://localhost:8787';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      /* Keeps the browser on one origin, so the OpenRouter key never has to
         leave the server. */
      '/api': { target: API, changeOrigin: true },
    },
  },
});
