import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import scss from 'rollup-plugin-scss';
import * as sass from 'sass';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

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
    json(),
    scss({
      output: (styles) => {
        const outPath = path.resolve('dist/css-editor.css');
        mkdirSync(path.dirname(outPath), { recursive: true });
        writeFileSync(outPath, styles);
      },
      sourceMap: true,
      sass
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist'
    })
  ]
};
