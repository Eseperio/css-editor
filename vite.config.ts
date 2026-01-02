import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CSSEditor',
      formats: ['umd', 'es'],
      fileName: (format) => {
        if (format === 'umd') {
          return 'css-editor.js';
        }
        return 'css-editor.esm.js';
      }
    },
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: [],
      output: {
        // Global variables to use in UMD build for externalized deps
        globals: {}
      }
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
