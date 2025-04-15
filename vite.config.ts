import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable minification for production builds
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
      },
    },
    // Enable CSS minification
    cssMinify: true,
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'react-hot-toast'],
        },
      },
    },
    // Generate sourcemaps for production
    sourcemap: true,
  },
  // Enable SPA routes
  server: {
    // Configure to handle SPA routes
    proxy: {
      // Handle SPA routes
      "/*": {
        target: "index.html",
        changeOrigin: false
      }
    }
  },
  preview: {
    port: 3000,
  },
  // Improve caching with dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'lucide-react', 'react-hot-toast'],
  },
});
