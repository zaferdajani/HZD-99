// THE LIGHT FILM TIER — the same films, encoded for a phone on mobile data.
//
// THE MASTERS ARE NOT TOUCHED. This is the house rule: author once at the
// quality you actually want, and let the pipeline DERIVE the cheaper versions.
// assets/video/*.mp4 stays exactly as generated; this writes a second copy
// beside it and the game chooses at runtime.
//
// WHAT THE MEASUREMENT SAID (2026-08-15). The films are already 960x540 —
// precisely the game's own internal resolution — so there is nothing to gain by
// making them smaller in pixels, and something to lose. What they are is
// over-encoded: intro1 ships at 2615 kb/s for a picture that is visually
// identical at less than half that. Frame-for-frame comparison at CRF 26 shows
// a barely-perceptible softening in the darkest gradients and nothing else,
// while the file halves.
//
// AND IT MATTERS MOST WHERE IT IS WORST. Browsers that take webm already get a
// light tier for free — the webm set is 13.4 MB against the mp4 set's 33 MB.
// It is iOS Safari, which takes mp4, that pays full price for every film. So
// this tier is mp4 only: it is aimed squarely at the platform that has no
// cheaper option, rather than encoding everything twice for its own sake.
//
//   node tools/lightvid.cjs           # build the tier
//   node tools/lightvid.cjs --check   # report only, write nothing
//
// Needs ffmpeg. Any of these will do, in this order:
//   - `ffmpeg` on PATH
//   - the FFMPEG environment variable pointing at a binary
//   - an ffmpeg-static install anywhere under node_modules
// The npm package is a TOOL dependency and must never enter package.json —
// nothing the game ships comes from npm (see CLAUDE.md, Style).
//
// Writes assets/video/light/<name>.mp4 and assets/video/light/index.json,
// which build.cjs compiles into the page as window.VID_LIGHT.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CRF = 26;
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'video');
const OUT = path.join(SRC, 'light');
// below this the second copy is not worth the disk or the extra path
const MIN_BYTES = 300 * 1024;

function findFfmpeg() {
  if (process.env.FFMPEG && fs.existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch (e) {}
  const seen = [];
  const hunt = (dir, depth) => {
    if (depth > 6 || seen.length) return;
    let ents = [];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of ents) {
      if (seen.length) return;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== '.git') hunt(p, depth + 1); }
      else if (e.name === 'ffmpeg') seen.push(p);
    }
  };
  for (const base of [path.join(ROOT, 'node_modules'), process.env.SCRATCH || '']) {
    if (base && fs.existsSync(base)) hunt(base, 0);
  }
  return seen[0] || null;
}

const check = process.argv.includes('--check');
const FF = findFfmpeg();
if (!FF) {
  console.log('no ffmpeg found. Install one, or set FFMPEG=/path/to/ffmpeg.');
  console.log('(ffmpeg-static via npm works, but keep it OUT of package.json.)');
  process.exit(1);
}

if (!check) fs.mkdirSync(OUT, { recursive: true });
const index = {};
let before = 0, after = 0, skipped = 0;

for (const f of fs.readdirSync(SRC).sort()) {
  if (!/\.mp4$/i.test(f)) continue;
  const src = path.join(SRC, f);
  const size = fs.statSync(src).size;
  if (size < MIN_BYTES) { skipped++; continue; }
  const dst = path.join(OUT, f);
  if (!check) {
    execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', src,
      '-c:v', 'libx264', '-crf', String(CRF), '-preset', 'slow',
      // main profile and yuv420p because that is what every phone decoder in
      // the world agrees on — a clever encode nobody can play is not an encode
      '-profile:v', 'main', '-pix_fmt', 'yuv420p',
      // the index goes at the FRONT, so playback can start before the whole
      // file has arrived. Without this a streamed mp4 must download fully first,
      // which would undo the entire point of a light tier
      '-movflags', '+faststart',
      // these films are silent; the game scores them itself
      '-an', dst], { stdio: 'inherit' });
  }
  const ns = fs.existsSync(dst) ? fs.statSync(dst).size : 0;
  index[f.replace(/\.mp4$/i, '')] = 'assets/video/light/' + f;
  before += size; after += ns;
  console.log('  ' + f.replace(/\.mp4$/, '').padEnd(16)
    + (size / 1048576).toFixed(2).padStart(6) + ' MB -> '
    + (ns / 1048576).toFixed(2).padStart(6) + ' MB');
}
if (!check) fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
console.log('\n' + Object.keys(index).length + ' films:  '
  + (before / 1048576).toFixed(1) + ' MB -> ' + (after / 1048576).toFixed(1) + ' MB  ('
  + (after / before * 100).toFixed(0) + '%)   ' + skipped + ' already small enough');
