// ONLY WHAT HE AGREED ON AND THE GAME USES — owner, 2026-11-26: "why do you actually still keep those
// wrong images, generated images of the previous swords and everything else? You should only keep the
// ones that we agreed on. And using now."
// A refused, superseded, trial or "before" image is deleted, not archived; its job id may be named in
// text (assets/source/README.md, docs/ART_QUEUE.md), the picture is not kept. No browser: it reads the tree.
//   A  no file or folder under assets/ is named as refused, rejected, superseded, replaced, retired,
//      a trial, a draft, a "before", or a review
//   B  no comic page is shipped that nothing shows: every assets/manhua page is named by the code (js/,
//      directly or through panels.js's PANEL_CLEAN(n)), by the earned-comic list (assets/manhua/chapters.json)
//      or by the comic reader (manhua/edition.json, manhua/*.html)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
console.log('── archive-clean — only the art he agreed on and the game uses is kept');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => { const p = path.join(d, e.name); return e.isDirectory() ? [p + '/', ...walk(p)] : [p]; });
const all = walk(path.join(root, 'assets')).map(f => path.relative(root, f));
const BAD = /(refus|reject|supersed|replaced|retired|trial|draft|_before|-before|before_|[-_/]review)/i;
const named = all.filter(f => BAD.test(f.replace(/^assets\//, '')));
check('A  nothing kept that was refused, superseded, a trial, a draft, a "before" or a review', named.length === 0, named.slice(0, 12));
const js = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n')
  + ['assets/manhua/chapters.json', 'manhua/edition.json', ...fs.readdirSync(path.join(root, 'manhua')).filter(f => f.endsWith('.html')).map(f => 'manhua/' + f)]
      .map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const clean = new Set([...js.matchAll(/PANEL_CLEAN\((\d+)\)/g)].map(m => +m[1]));
const pages = all.filter(f => /^assets\/manhua\/.*\.(webp|jpg|png)$/.test(f));
const unshown = pages.filter(f => {
  const m = f.match(/^assets\/manhua\/ch1\/clean\/p(\d+)\./); if (m) return !clean.has(+m[1]);
  const b = path.basename(f).replace(/\.[^.]+$/, '');
  return !js.includes(f) && !js.includes(path.basename(f)) && !new RegExp('[\'"/_ ]' + b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'"_.]').test(js);
});
check('B  every comic page shipped is one the game or the reader shows', unshown.length === 0, unshown.slice(0, 12));
if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
console.log('\nOK — only agreed, used art is kept');
