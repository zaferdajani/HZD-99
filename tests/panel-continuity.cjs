// THE COMIC SHOWS ONLY WHAT SHE HAS (owner, 2026-11-17: "why images show me entering cave
// with marble holding my sword when i dont have it yet ?").
// Two cave panels were re-fired with a sword in her hand, two sequences before the forge that
// makes it. Nothing could have caught that: a picture's CONTENT is not measurable here. What is
// measurable is whether somebody LOOKED. So every panel that plays before the blade exists is
// declared in assets/source/manhua/continuity.json — what she holds in it, and the md5 of the
// file that was looked at. Re-fire a panel and its md5 changes: this fails until the new picture
// has been looked at and declared again.
//   A  every game panel a pre-forge sequence uses is declared, and declared empty-handed
//   B  the file on disk is the one that was looked at
//   C  the blade's first panel is in the forge, and no pre-forge sequence uses it or a later one
//   D  the corridor meeting no longer crops page 14's white lion
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null && d !== '' ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
const src = fs.readFileSync(path.join(ROOT, 'js/panels.js'), 'utf8');
const body = src.slice(src.indexOf('const PANEL_SEQ = ['));
const marks = [...body.matchAll(/\{ id: '([a-z0-9_]+)'/g)].map(m => [m.index, m[1]]);
const seqs = {}; marks.forEach(([pos, id], i) => { const end = i + 1 < marks.length ? marks[i + 1][0] : body.length; seqs[id] = { text: body.slice(pos, end), game: [...new Set([...body.slice(pos, end).matchAll(/PANEL_GAME\('([a-z0-9_]+)'\)/g)].map(m => m[1]))] }; });
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/source/manhua/continuity.json'), 'utf8'));
console.log('── panel-continuity — a panel shows only what she has at that point in the story');
const PRE = C.before_the_blade, missing = [], armed = [], stale = [];
check('the story order is declared and every sequence in it exists', PRE.length >= 8 && PRE.every(id => seqs[id]), PRE.filter(id => !seqs[id]));
for (const id of PRE) for (const name of (seqs[id] || { game: [] }).game) {
  const d = C.panels[name]; if (!d) { missing.push(id + ':' + name); continue; }
  if (d.holds !== 'nothing') armed.push(id + ':' + name + ' holds ' + d.holds);
  const f = path.join(ROOT, 'assets/manhua/ch1/game', name + '.webp');
  const md5 = fs.existsSync(f) ? crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex') : 'no file';
  if (md5 !== d.md5) stale.push(name + ' (looked at ' + d.md5.slice(0, 8) + ', on disk ' + md5.slice(0, 8) + ')'); }
check('A  every panel that plays before the blade exists is declared', missing.length === 0, missing);
check('   ...and in every one of them her hands are empty', armed.length === 0, armed);
check('B  the file on disk is the one that was looked at (a re-fire must be looked at again)', stale.length === 0, stale);
check('C  the blade first appears in the forge', (seqs.forge || { game: [] }).game.includes(C.blade_first) && PRE.every(id => !seqs[id].game.includes(C.blade_first)), C.blade_first);
check('D  the corridor meeting draws NULLFANG from his own panel, not page 14\'s white lion', seqs.meet.game.includes('m_stalk') && !/p14 panel [34]/.test(seqs.meet.text), seqs.meet.game);
if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
console.log('\nOK — nothing is in her hands before she has made it');
