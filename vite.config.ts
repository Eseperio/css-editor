import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  const isServe = command === 'serve';
  
  return {
    plugins: [svelte()],
    root: isServe ? '.' : undefined,
    publicDir: isServe ? false : undefined,
    server: {
      port: 3000,
      open: '/example/index.html'
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: isServe ? undefined : {
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
        // No external dependencies - everything is bundled
        output: {
          globals: {}
        }
      },
      sourcemap: true,
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
