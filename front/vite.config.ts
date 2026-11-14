import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa permite servir o build de qualquer subpasta (ex.: GitHub Pages)
export default defineConfig({
  plugins: [react()],
  base: './'
});
