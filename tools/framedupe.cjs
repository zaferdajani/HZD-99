// HOW MANY OF A STRIP'S CELLS ARE ACTUALLY NEW PICTURES.
//
// The owner, looking at a contact sheet of a generated take: "the images that
// Higgsfield is generating does not always create the correct sequence of the
// movements... a big percentage of what is inside of it is replicated images,
// instead of a sequence of images to generate a movement."
//
// That is a measurable claim and it decides how these strips should be cut. A
// take is not a metronome: the model holds a pose, then moves fast, then holds
// again. Sampling it on a CLOCK — N frames evenly across a window, which is
// what tools/vidstrip.cjs does — spends cells on the holds and skips through
// the fast part. The result has the right number of cells and the wrong
// pictures in them, and on screen that is a move that stutters, holds, and
// jumps.
//
// This measures the strip that actually shipped: every cell against the one
// before it, as a percentage of pixels whose silhouette or value changed. A
// cell that scores near zero is a frame the player sees twice.
//
//   node tools/framedupe.cjs <strip.webp|png> [cells]   (cells: default w/h)
//   node tools/framedupe.cjs --all                      (every shipped strip)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const SHIPPED = [
  ['claw_1', 'assets/characters/hero/swing/claw_1.webp'],
  ['claw_2', 'assets/characters/hero/swing/claw_2.webp'],
  ['finisher', 'assets/characters/hero/swing/finisher.webp'],
  ['burst', 'assets/characters/hero/swing/burst.webp'],
  ['servo', 'assets/characters/npc/servo/work_loop.webp'],
  ['mono', 'assets/characters/npc/mono/work_loop.webp'],
  ['patch', 'assets/characters/npc/patch/work_loop.webp'],
  ['sage', 'assets/characters/npc/sage/work_loop.webp'],
  ['lumen', 'assets/characters/npc/lumen/work_loop.webp'],
  ['ratchet', 'assets/characters/npc/ratchet/work_loop.webp'],
];

(async () => {
  const args = process.argv.slice(2);
  const list = (args[0] === '--all' || !args.length)
    ? SHIPPED
    : [[path.basename(args[0]), args[0]]];
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));

  console.log('── framedupe — how many cells of each strip are a NEW picture\n');
  console.log('  strip        cells   dead   worst pairs (cell: % changed)');
  let anyDead = 0;
  for (const [name, file] of list) {
    if (!fs.existsSync(file)) { console.log('  ' + name.padEnd(12) + ' missing'); continue; }
    const r = await page.evaluate(async ({ file }) => {
      const im = new Image();
      im.src = 'data:image/' + (file.endsWith('webp') ? 'webp' : 'png') + ';base64,'
        + await window.bytes(file);
      await im.decode();
      const H = im.naturalHeight, n = Math.round(im.naturalWidth / H);
      const W = Math.round(im.naturalWidth / n);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d', { willReadFrequently: true });
      // one downsampled signature per cell: alpha AND value, because a pose can
      // move inside an unchanged silhouette (an arm crossing the body)
      const S = 48;
      const sig = [];
      for (let i = 0; i < n; i++) {
        c.clearRect(0, 0, W, H);
        c.drawImage(im, i * W, 0, W, H, 0, 0, W, H);
        const d = c.getImageData(0, 0, W, H).data;
        const a = new Float32Array(S * S), v = new Float32Array(S * S);
        const bx = W / S, by = H / S;
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          let sa = 0, sv = 0, cnt = 0;
          for (let yy = Math.floor(y * by); yy < Math.floor((y + 1) * by); yy += 2)
            for (let xx = Math.floor(x * bx); xx < Math.floor((x + 1) * bx); xx += 2) {
              const j = ((yy * W + xx) << 2);
              sa += d[j + 3] / 255;
              sv += (0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 255 * (d[j + 3] / 255);
              cnt++;
            }
          a[y * S + x] = cnt ? sa / cnt : 0;
          v[y * S + x] = cnt ? sv / cnt : 0;
        }
        sig.push({ a, v });
      }
      // difference between two cells: mean absolute change over the union of
      // the two silhouettes, in percent — 0 is the same drawing twice
      const diff = (p, q) => {
        let d2 = 0, on = 0;
        for (let i = 0; i < S * S; i++) {
          const cov = Math.max(p.a[i], q.a[i]);
          if (cov < 0.02) continue;
          d2 += Math.abs(p.a[i] - q.a[i]) * 0.5 + Math.abs(p.v[i] - q.v[i]);
          on += cov;
        }
        return on ? (d2 / on) * 100 : 0;
      };
      const pairs = [];
      for (let i = 1; i < n; i++) pairs.push(+diff(sig[i - 1], sig[i]).toFixed(1));
      // ...and the loop's own seam, for a strip that repeats
      const wrap = +diff(sig[n - 1], sig[0]).toFixed(1);
      return { n, pairs, wrap };
    }, { file });
    // A CELL IS DEAD WHEN IT ADDS NOTHING. 3% of the union area is about the
    // smallest change a 60px-tall sprite can show and still be a different
    // drawing; below that the player is looking at the same frame twice.
    const dead = r.pairs.filter(p => p < 3).length;
    anyDead += dead;
    const worst = r.pairs.map((p, i) => [i + 1, p]).sort((x, y) => x[1] - y[1]).slice(0, 4);
    console.log('  ' + name.padEnd(12) + String(r.n).padStart(4)
      + String(dead).padStart(7) + '   '
      + worst.map(w => w[0] + ':' + w[1]).join('  ')
      + '   (loop seam ' + r.wrap + ')');
  }
  console.log('\n  dead cells total: ' + anyDead);
  await browser.close();
})();
