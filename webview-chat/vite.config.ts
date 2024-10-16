import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    // Ensure .tsx files are recognized
    extensions: ['.mjs', '.js', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../out/webview-ui'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Explicitly set the entry point to the correct TypeScript file
      input: path.resolve(__dirname, 'src/main.tsx'),
      output: {
        entryFileNames: 'assets/index.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
