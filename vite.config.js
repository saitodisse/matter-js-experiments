// vite.config.js
export default {
  // Base public path when served in development or production
  base: './',
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
