// THE AAC TIER: every Ogg the game plays, again as AAC, for the phones that
// cannot decode Ogg.
//
// iOS could not decode Ogg Vorbis at all before 18.4 — not in <audio>, not in
// decodeAudioData — and it fails silently: the fetch succeeds, the decode
// rejects, the loader's catch swallows it. So on most iPhones every recorded
// effect in assets/sfx fell back to its synth stand-in (the lion's own voice,
// the metal clang, the footsteps) and every NPC line in assets/vox simply did
// not play. The game shipped a different, quieter soundtrack on iOS and nobody
// could hear the difference from a desk.
//
// RULE ZERO: the Ogg stays the master; this is derived. One .m4a per .ogg under
// assets/aac/, mirroring the path, and an index the build hands to the page
// (window.AAC_TIER). js/media.js audioSrc() swaps a path only when the device
// says it cannot play Ogg, so nothing changes anywhere Ogg already works.
//
//   node tools/aactier.cjs            derive what is missing or stale
//   node tools/aactier.cjs --all      re-derive everything
//   node tools/aactier.cjs --check    exit 1 if the tier is not complete (no writes)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), OUT = 'assets/aac', SRC = ['assets/sfx', 'assets/vox'];
const ALL = process.argv.includes('--all'), CHECK = process.argv.includes('--check');
const walk = (d) => fs.existsSync(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : /\.ogg$/i.test(e.name) ? [d + '/' + e.name] : []) : [];
const oggs = SRC.flatMap(walk).sort();
const index = {}, missing = [];
let made = 0, bytesIn = 0, bytesOut = 0;
for (const ogg of oggs) {
  const m4a = OUT + '/' + ogg.replace(/^assets\//, '').replace(/\.ogg$/i, '.m4a');
  index[ogg] = m4a;
  const a = path.join(ROOT, ogg), b = path.join(ROOT, m4a);
  const stale = !fs.existsSync(b) || fs.statSync(b).mtimeMs < fs.statSync(a).mtimeMs || fs.statSync(b).size === 0;
  if (stale && CHECK) { missing.push(ogg); continue; }
  if (stale || ALL) {
    fs.mkdirSync(path.dirname(b), { recursive: true });
    // 96 kb/s AAC-LC, the source's own rate and channels. +faststart puts the
    // index at the front; bitexact keeps the bytes the same from run to run.
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', a, '-vn', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
      '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', b]);
    made++;
  }
  bytesIn += fs.statSync(a).size; bytesOut += fs.existsSync(b) ? fs.statSync(b).size : 0;
}
if (CHECK) {
  let want = '{}'; try { want = fs.readFileSync(path.join(ROOT, OUT, 'index.json'), 'utf8'); } catch (e) {}
  const same = JSON.stringify(JSON.parse(want)) === JSON.stringify(index);
  if (missing.length || !same) { console.error('AAC tier incomplete: ' + missing.length + ' missing/stale' + (same ? '' : ', index out of date') + '. Run node tools/aactier.cjs'); process.exit(1); }
  console.log('AAC tier complete: ' + oggs.length + ' files'); process.exit(0);
}
// an .m4a whose .ogg is gone is a file nothing will ever ask for
const live = new Set(Object.values(index));
const prune = (d) => { if (!fs.existsSync(path.join(ROOT, d))) return; for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
  const p = d + '/' + e.name; if (e.isDirectory()) prune(p); else if (/\.m4a$/i.test(e.name) && !live.has(p)) { fs.unlinkSync(path.join(ROOT, p)); console.log('pruned ' + p); } } };
prune(OUT);
fs.mkdirSync(path.join(ROOT, OUT), { recursive: true });
fs.writeFileSync(path.join(ROOT, OUT, 'index.json'), JSON.stringify(index) + '\n');
console.log(oggs.length + ' ogg: ' + (bytesIn / 1048576).toFixed(2) + ' MB -> ' + (bytesOut / 1048576).toFixed(2) + ' MB of AAC (' + made + ' derived this run)');
