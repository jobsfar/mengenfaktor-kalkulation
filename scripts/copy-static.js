const fs = require('fs');
const path = require('path');

const files = ['index.html', 'styles.css'];
const src = path.join(__dirname, '..', 'src');
const out = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

files.forEach(f => {
  const s = path.join(src, f);
  const d = path.join(out, f);
  if (fs.existsSync(s)) fs.copyFileSync(s, d);
});

console.log('Copied static files to dist/');
