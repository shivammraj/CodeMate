import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Ensures relative asset paths work on GitHub Pages subpaths like /CodeMate/
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
