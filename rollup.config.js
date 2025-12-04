import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';
import * as sass from 'sass';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/css-editor.js',
      format: 'umd',
      name: 'CSSEditor',
      sourcemap: true
    },
    {
      file: 'dist/css-editor.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    scss({
      fileName: 'css-editor.css',
      sourceMap: true,
      sass: sass
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist'
    })
  ]
};
