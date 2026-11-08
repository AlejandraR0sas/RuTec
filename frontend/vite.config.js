/**
 * ARCHIVO: frontend/vite.config.js — RESPONSABLE: Persona C (Frontend)
 * El proxy manda /api al backend (puerto 3000). Así la cookie de sesión funciona sin configurar CORS.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
