import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Helper to toggle heavier build options only in production
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    // Ensure .tsx files are recognized
    extensions: ['.mjs', '.js', '.ts', '.tsx', '.json'],
    alias: {
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@chat': path.resolve(__dirname, 'src/features/chat'),
      '@state': path.resolve(__dirname, 'src/features/chat/state'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../out/webview-ui'),
    emptyOutDir: true,
    sourcemap: isProd ? false : true,
    rollupOptions: {
      // Explicitly set the entry point to the correct TypeScript file
      input: path.resolve(__dirname, 'src/main.tsx'),
      output: {
        entryFileNames: 'assets/index.js',
        assetFileNames: 'assets/[name][extname]',
        // Basic code splitting strategy (extend as needed)
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-markdown']
        }
      },
    },
    // Tighten chunk size warnings slightly for awareness
    chunkSizeWarningLimit: 600,
    target: 'es2020',
  },
});
