import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_URL = process.env['VITE_DEV_API_URL'] ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Em dev o Vite faz proxy para a API: mesma origem, sem CORS (igual à produção).
    proxy: {
      '/api': API_URL,
      '/uploads': API_URL,
      '/socket.io': { target: API_URL, ws: true },
    },
  },
});
