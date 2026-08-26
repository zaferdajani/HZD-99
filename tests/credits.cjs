// EVERY SHIPPED SOUND IS DECLARED.
//
// assets/CREDITS.md carries its own rule — "a generated asset is not finished
// until it has a line here" — and that rule was prose, so it was not followed:
// forty-nine generated audio files landed in one day with no disclosure line,
// on top of a score and three voice sets that had never had one. Steam requires
// AI generation to be disclosed at store-page level and docs/STEAM.md draws its
// text from that table, so an undeclared file is a store problem, not an
// etiquette one.
//
// SCOPE IS AUDIO, DELIBERATELY. Every sound the game ships is declarable today
// and this harness proves it. The picture tree is not in scope YET: its rows
// are prose globs naming .png masters while the shipped tier is the derived
// .webp from tools/lowres.cjs, so a coverage check there measures the deriving
// tool rather than the declaration. Widening it means teaching the matcher
// about derived tiers — worth doing, and not worth blocking the sound on.
const fs = require('fs'), path = require('path');

const DIRS = ['assets/music', 'assets/sfx', 'assets/vox'];
const AUDIO = /\.(ogg|mp3|m4a|wav)$/i;

const md = fs.readFileSync('assets/CREDITS.md', 'utf8');

// Every path-shaped token in the document is a coverage pattern. `*` matches a
// run of characters inside one path segment; {a,b} expands. A bare filename
// covers that filename in any directory, because the tables above were written
// that way and rewriting them is not this harness's job.
const toks = [...md.matchAll(/[A-Za-z0-9_*{},/.-]+\.(?:ogg|mp3|m4a|wav)/g)].map(m => m[0]);
function expand(t) {
  let out = [t];
  for (let i = 0; i < 4; i++) {
    const next = [];
    for (const s of out) {
      const m = s.match(/\{([^}]*)\}/);
      if (!m) { next.push(s); continue; }
      for (const o of m[1].split(',')) next.push(s.slice(0, m.index) + o + s.slice(m.index + m[0].length));
    }
    out = next;
  }
  return out;
}
const pats = [];
for (const t of toks) for (const e of expand(t)) {
  pats.push(new RegExp('^(?:.*/)?' + e.replace(/[.+^$()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$'));
}

const files = [];
for (const d of DIRS) {
  (function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (AUDIO.test(f)) files.push(p.replace(/^assets\//, ''));
    }
  })(d);
}
files.sort();

const bad = files.filter(f => !pats.some(r => r.test(f)));
console.log('  ' + files.length + ' shipped audio files, ' + pats.length + ' coverage patterns in CREDITS.md');
for (const b of bad) console.log('  FAIL undeclared: assets/' + b);

// ...and the declaration itself has to still say what it is declaring
const claims = [
  [/\*\*generated with Higgsfield\*\*/i, 'the picture table declares generation'],
  [/Generated audio/i, 'there is a generated-audio section'],
  [/Steam requires/i, 'the Steam disclosure requirement is written down'],
];
let missing = 0;
for (const [rx, what] of claims) {
  const ok = rx.test(md);
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + what);
  if (!ok) missing++;
}

if (bad.length || missing) {
  console.log('\n' + bad.length + ' undeclared sound(s), ' + missing + ' missing declaration(s)');
  process.exit(1);
}
console.log('\nOK — every shipped sound traces to a line in assets/CREDITS.md');
