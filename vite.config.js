import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    // Base public path when served in development or production
    // Set the base path for GitHub Pages deployment
    // Use '/matter-js-experiments/' for production builds, '/' for development
    base: command === 'build' ? '/matter-js-experiments/' : '/',
  // Configure server options
  server: {
    // Enable hot module replacement
    hmr: true,
    // Open browser automatically
    open: true
  },
  // Build options
  build: {
    // Output directory for production build
    outDir: '../dist',
    // Generate sourcemaps for better debugging
    sourcemap: true
  },
  // Specify the entry point
  root: 'src'
  }
});
