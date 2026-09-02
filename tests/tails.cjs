// EVERY AUTHORED SOUND ENDS, AND ENDS QUIETLY — the tail law from
// docs/ART_QUEUE.md §2ae, in the suite. The owner's report was "sounds
// produced are always cut and not smooth or complete", and the cause was
// measured: the generator fills its requested duration and stops, so 36 of
// 39 takes ended hot — a click where a decay should be. The rule that fixed
// them: a take's last 25 ms sits at least 35 dB under its peak, and its
// first 5 ms are not the loudest thing in it (no attack click either).
//
// This decodes every shipped one-shot with ffmpeg and measures it; a new
// take that skips the fade fails here before anyone hears it. Loops (the
// hums, the ambiences) are excluded by name: their tails ARE their heads.
//
//   node tests/tails.cjs
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FF = fs.existsSync('node_modules/ffmpeg-static/ffmpeg') ? 'node_modules/ffmpeg-static/ffmpeg' : 'ffmpeg';
const DIR = 'assets/sfx';
const LOOPS = /^(hum_|amb_|loop_)/;
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(ogg|wav|mp3|m4a)$/i.test(f)) files.push(p); } })(DIR);
console.log('── tails — every authored sound decays to silence instead of stopping (' + files.length + ' files)');
const fails = [];
let seen = 0, loops = 0;
const worst = [];
for (const f of files) {
  const base = path.basename(f);
  if (LOOPS.test(base)) { loops++; continue; }
  let pcm;
  try {
    pcm = execFileSync(FF, ['-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', '44100', '-'], { maxBuffer: 64 * 1024 * 1024 });
  } catch (e) { fails.push(base + ' — does not decode'); continue; }
  const n = pcm.length >> 2; if (n < 441) { fails.push(base + ' — under 10 ms'); continue; }
  const s = new Float32Array(pcm.buffer, pcm.byteOffset, n);
  let peak = 0; for (let i = 0; i < n; i++) { const a = Math.abs(s[i]); if (a > peak) peak = a; }
  if (peak < 1e-4) { fails.push(base + ' — silent'); continue; }
  const rms = (a, b) => { let e = 0; for (let i = a; i < b; i++) e += s[i] * s[i]; return Math.sqrt(e / Math.max(1, b - a)); };
  const tailN = Math.round(44100 * 0.025);
  const tail = rms(n - tailN, n), head = rms(0, Math.round(44100 * 0.005));
  const tailDb = 20 * Math.log10(tail / peak + 1e-12), headDb = 20 * Math.log10(head / peak + 1e-12);
  seen++;
  worst.push([tailDb, base]);
  if (tailDb > -35) fails.push(base + ' — ends at ' + tailDb.toFixed(1) + ' dB under its peak (needs -35)');
  if (headDb > -1) fails.push(base + ' — starts on a click (' + headDb.toFixed(1) + ' dB in its first 5 ms)');
}
worst.sort((a, b) => b[0] - a[0]);
console.log('  measured ' + seen + ' one-shots, skipped ' + loops + ' loops');
console.log('  hottest tails: ' + worst.slice(0, 4).map(w => w[1] + ' ' + w[0].toFixed(1) + ' dB').join(', '));
for (const f of fails) console.log('  FAIL ' + f);
if (fails.length) { console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
console.log('  ok   every one-shot ends at least 35 dB under its peak, and none starts on a click');
console.log('\nOK — nothing is cut; every sound has its decay');
