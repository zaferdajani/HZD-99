const fs = require('node:fs');
function edit(file, old, replacement) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes(replacement)) return;
  if (text.split(old).length !== 2) throw new Error('Changed source baseline: ' + file);
  fs.writeFileSync(file, text.replace(old, replacement));
}
for (const dir of ['music', 'video', 'vox'])
  edit('build.cjs', "fs.readdirSync('assets/" + dir + "')", "fs.readdirSync('assets/" + dir + "').sort()");
edit('build.cjs', "const buildId=require('crypto').createHash('sha256').update(html)",
  "const buildId=require('crypto').createHash('sha256').update(require('./tools/runtime-asset-digest.cjs')()).update(fs.readFileSync('sw.js')).update(fs.readFileSync(__filename)).update(html)");
edit('tools/pack-www.cjs', "  html = html.replace(/navigator\\.serviceWorker\\.register\\('sw\\.js'\\)/g, 'void 0');",
  "  html = require('./package-html.cjs')(html);");
edit('tests/platform.cjs', "    const norm = (s) => s.replace(/navigator\\.serviceWorker\\.register\\('sw\\.js'\\)/g, 'void 0');",
  "    const norm = require('../tools/package-html.cjs');");
edit('tests/platform.cjs', "      !/serviceWorker\\.register\\('sw\\.js'\\)/.test(app));",
  "      !/navigator\\.serviceWorker\\.register\\s*\\(/.test(app));");
edit('tools/pack-desktop.cjs', "    author: 'Zafer Dajani', license: 'UNLICENSED'",
  "    author: 'VibeSolutions', license: 'UNLICENSED'");
console.log('Build/cache identity and native payload corrections applied');
