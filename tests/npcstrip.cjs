// THE FIVE WORK STRIPS ARE TWELVE FRAMES OF WORK.
//
// WHAT THIS OWNS AND WHAT IT DOES NOT. tests/folk.cjs measures the JOB — where
// each machine-person is looking and for how long, which is game logic and
// belongs to whoever wrote it. This measures the ART: the strips themselves,
// cut from generated clips of servo, mono, patch, sage and lumen each doing
// their own work. They are drawn through drawStripCell, the same call any
// renderer will use, so a strip that passes here is a strip that will land
// wherever it is wired.
//
// Four failure modes, none of them visible by reading and barely visible by
// looking:
//
//   1. THE STRIP NEVER LANDS. drawStripCell returns false and the caller falls
//      through to the atlas. The game looks exactly as it did. Nothing errors.
//   2. THE FRAMES ARE THE SAME FRAME. Twelve copies of one cell is the defect
//      the owner named in the first place ("a slide show gif instead of a live
//      machine doing its work"), and it reads as "it isn't animating" rather
//      than as anything specific.
//   3. THE FEET LEAVE THE FLOOR. Cells are bottom-anchored, so a crop taken
//      across frames that caught one wisp of smoke below the boots hovers the
//      whole strip by a constant offset. That never looks like a crop bug — it
//      looks like the character is floating. tools/vidstrip.cjs takes a MEDIAN
//      foot row for exactly this reason; this is the check on that.
//   4. IT PUMPS. A cell whose subject is scaled differently from its
//      neighbours breathes in SIZE, which is the one thing an idle must not do.
//
//   node tests/npcstrip.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

const STRIPS = {
  servo: 'servoLoop', mono: 'monoLoop', patch: 'patchLoop',
  sage: 'sageLoop', lumen: 'lumenLoop',
};
const CELLS = 12;

// SILHOUETTE IS THE WRONG INSTRUMENT HERE, and this file measured with it first
// and reported two false failures. A guardian pose is judged by outline (§3.3)
// because a pose IS an outline. A work loop is not: the warden sweeps an arm
// across a console it is already holding and irises a lens; the tinker tracks a
// torch along a seam. Almost all of that happens INSIDE a silhouette that
// barely changes, so outline IoU called two frames identical that a player can
// plainly tell apart.
//
// So the strip is judged on what actually reaches the eye: mean absolute
// luminance change over the pixels either frame covers. Twelve copies of one
// cell score exactly 0; the quietest real pair here scores 1.8.
const MOVE_MIN = 1.5;

(async () => {
  console.log('── npcstrip — the five work strips are twelve frames of work\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async ({ STRIPS, CELLS }) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv);
    const names = Object.keys(STRIPS);
    names.forEach(n => mediaFetch(STRIPS[n]));
    // A megabyte a strip: wait for the art rather than measure nothing, which
    // would pass check 1 by drawing an empty canvas.
    const t0 = Date.now();
    while (Date.now() - t0 < 40000) {
      await new Promise(r2 => requestAnimationFrame(r2));
      if (names.every(n => mediaHas(STRIPS[n]))) break;
    }
    const missing = names.filter(n => !mediaHas(STRIPS[n]));

    // Drawn LARGE and on a bare field: a room backdrop, a contact shadow and
    // the ambient particles are not the subject and would be measured as one.
    const W = 520, H = 620, BASE = 560, DRAW = 220;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const q = cv.getContext('2d', { willReadFrequently: true });

    const out = {};
    for (const name of names) {
      const frames = [];
      let drewAll = true;
      // EVERY CELL, not a sample. Twelve is cheap and a duplicated cell in the
      // middle of a strip is exactly the thing a sample walks past.
      for (let f = 0; f < CELLS; f++) {
        q.clearRect(0, 0, W, H);
        const drew = drawStripCell(q, STRIPS[name], f, CELLS, W / 2, BASE, DRAW, false);
        if (!drew) drewAll = false;
        const d = q.getImageData(0, 0, W, H).data;
        const mask = new Uint8Array(W * H);
        const lum = new Uint8Array(W * H);        // premultiplied: empty reads 0
        let n = 0, low = -1, minX = W, maxX = -1, minY = H;
        for (let k = 0; k < W * H; k++) {
          const a = d[k * 4 + 3];
          lum[k] = ((d[k * 4] * 0.299 + d[k * 4 + 1] * 0.587 + d[k * 4 + 2] * 0.114) * a / 255) | 0;
          if (a > 60) {
            mask[k] = 1; n++;
            const x = k % W, y = (k / W) | 0;
            if (y > low) low = y;
            if (y < minY) minY = y;
            if (x < minX) minX = x; if (x > maxX) maxX = x;
          }
        }
        frames.push({ mask, lum, px: n, foot: low - BASE, h: low - minY + 1, w: maxX - minX + 1 });
      }
      // The LEAST different pair, because one still pair inside an otherwise
      // moving strip is a duplicated cell and that is the defect.
      let quietest = Infinity, loudest = 0;
      for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++) {
        const A = frames[i], B = frames[j];
        let sum = 0, n2 = 0;
        for (let k = 0; k < A.lum.length; k++) {
          if (!A.mask[k] && !B.mask[k]) continue;  // both empty: not evidence
          sum += Math.abs(A.lum[k] - B.lum[k]); n2++;
        }
        const v = n2 ? sum / n2 : 0;
        if (v < quietest) quietest = v;
        if (v > loudest) loudest = v;
      }
      const px = frames.map(f => f.px);
      out[name] = {
        drew: drewAll, quietest, loudest,
        feet: frames.map(f => f.foot),
        pxMin: Math.min.apply(null, px), pxMax: Math.max.apply(null, px),
        hMin: Math.min.apply(null, frames.map(f => f.h)),
        hMax: Math.max.apply(null, frames.map(f => f.h)),
      };
    }
    return { names, missing, out };
  }, { STRIPS, CELLS });

  check('every strip arrived', !r.missing.length,
        r.missing.join(' ') || String(r.names.length) + ' strips');

  for (const name of r.names) {
    const o = r.out[name];
    check(name + ': every cell draws a body', o.drew && o.pxMin > 200,
          o.pxMin + '..' + o.pxMax + 'px');
    check(name + ': ...and no two cells are the same cell', o.quietest > MOVE_MIN,
          'quietest pair ' + o.quietest.toFixed(2) + ' (min ' + MOVE_MIN
          + '), loudest ' + o.loudest.toFixed(2));
    // ±2px: the cells are resampled to the draw height, so a foot row can land
    // a pixel either side of the anchor without anything being wrong.
    const foot = Math.max.apply(null, o.feet.map(Math.abs));
    check(name + ': ...and the feet stay on the floor', foot <= 2,
          'offsets ' + o.feet.join(',') + 'px');
    // 15%: a welding flame and a spore cloud legitimately change the drawn area
    // frame to frame. What this rules out is the BODY rescaling, which shows up
    // in height rather than in pixel count.
    const spread = (o.hMax - o.hMin) / o.hMax * 100;
    check(name + ': ...and it does not pump in size', spread < 15,
          'height ' + o.hMin + '..' + o.hMax + 'px  spread ' + spread.toFixed(1) + '%');
  }

  check('no page errors', !errs.length, errs[0] || '');

  await browser.close();
  console.log('');
  if (fails.length) {
    console.log('FAILED:');
    for (const f of fails) console.log('  ' + f);
    process.exit(1);
  }
  console.log('all good');
})();
