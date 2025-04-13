import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Improve build performance
    target: 'es2015',
    // Increase the warning limit to reduce noise
    chunkSizeWarningLimit: 1000,
    // Completely disable source maps to fix Recharts errors
    sourcemap: false,
    // Enable minification for production
    minify: mode === 'production',
    // Optimize chunk size for better performance
    rollupOptions: {
      output: {
        // Optimize for smaller initial download size
        manualChunks: {
          // Core vendor libraries
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom',
          ],
          // UI related chunks
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-slot',
            'class-variance-authority',
          ],
          // Data handling
          data: [
            'axios', 
            '@tanstack/react-query'
          ]
        },
        // Add compression hints for better organization
        assetFileNames: (assetInfo) => {
          // Make sure name exists before using it
          const fileName = assetInfo.name || '';
          if (/\.(png|jpe?g|gif|svg|webp)$/.test(fileName)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Provide better module names for easier debugging
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Improve loading speed for mobile/low-bandwidth
    assetsInlineLimit: 4096, // Inline small assets (4kb)
  },
}));
