import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    base: './',
    plugins: [react()],
    build: {
        outDir: path.resolve(__dirname, '../out/webview-ui'),
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: 'assets/index.js',
                assetFileNames: 'assets/[name][extname]',
                format: 'es', // Ensure ES module format
            },
        external: [
            'prismjs/themes/prism-nord.css',
            'prime-themes/themes/prism-nord.css'
        ]
        },
    },
});
