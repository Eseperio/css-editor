const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src', 'styles', 'editor-panel.scss');
const outDir = path.join(__dirname, '..', 'dist');
const outPath = path.join(outDir, 'css-editor.css');

if (!fs.existsSync(srcPath)) {
  console.error('SCSS source not found:', srcPath);
  process.exit(1);
}

let sass;
try {
  sass = require('sass');
} catch (err) {
  console.error('sass is required to build styles. Install it with "npm install --save-dev sass".');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const result = sass.compile(srcPath);
fs.writeFileSync(outPath, result.css);
console.log('[styles] Compiled SCSS to CSS with dart-sass.');
