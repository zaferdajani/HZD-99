// Cut a generated clip into a sprite strip the game can draw.
//
// The owner's report on the first NPC was "looks like a slide show gif instead
// of a live machine doing its work", and he was right about the cause: the work
// cycle was seven STILL PLATES held for a second each, and a cut every second
// between stills is a slideshow no matter how good the stills are.
//
// Video is the frame source, not the shipped asset. A <video> drawn into the
// world would carry a black rectangle with it — video has no alpha — so the
// clip is sampled at N even times, keyed off its black field, and written as
// one horizontal strip that composites exactly like every other plate here.
//
// The crop is taken ACROSS ALL FRAMES, not per frame: cropping each frame to
// its own content makes the character jitter around its own centre, which is
// the one thing an idle loop must not do.
//
//   node tools/vidstrip.cjs <in.mp4> <out.png> [frames=12] [cell=320] [thr=26]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [inp, out, nArg, cellArg, thrArg] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: vidstrip.cjs <in.mp4> <out.png> [frames] [cell] [thr]'); process.exit(2); }
  const N = parseInt(nArg || '12', 10), CELL = parseInt(cellArg || '320', 10);
  const THR = parseInt(thrArg || '26', 10);

  // OVER HTTP, NOT AS A DATA URI. A 2 MB base64 video URL is refused outright,
  // and the failure looks exactly like a codec failure, which cost a detour.
  // The clip is served from the same local server the harnesses use.
  const SRC = process.env.CLIP_URL || ('http://127.0.0.1:8220/' + path.basename(inp));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  // SAME ORIGIN, or getImageData refuses to read the frame: a video served
  // from the local server into an about:blank page taints the canvas, and the
  // error arrives at the read rather than at the load.
  try { await page.goto(new URL(SRC).origin + '/'); } catch (e) {}

  const res = await page.evaluate(async ({ N, CELL, THR, SRC }) => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true;
    v.src = SRC;
    await new Promise((ok, no) => {
      v.onloadeddata = ok; v.onerror = () => no(new Error('cannot decode clip'));
    });
    const W = v.videoWidth, H = v.videoHeight, D = v.duration;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true });
    const seek = (t) => new Promise(ok => { v.onseeked = ok; v.currentTime = t; });

    // pass 1: grab every frame, key it, and collect one box that holds them all
    const frames = [];
    const feet = [];
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let i = 0; i < N; i++) {
      await seek(Math.min(D - 0.02, (i + 0.5) * D / N));
      c.clearRect(0, 0, W, H);
      c.drawImage(v, 0, 0, W, H);
      const im = c.getImageData(0, 0, W, H), d = im.data;
      for (let p = 0; p < W * H; p++) {
        const j = p << 2;
        // the field is pure black and the subject is pale plating, so a
        // luminance ramp is honest here — and cheaper and steadier across
        // frames than a flood fill, which would wander with the compression
        const lum = (d[j] * 2 + d[j + 1] * 5 + d[j + 2]) / 8;
        const a = lum <= THR ? 0 : lum >= THR * 2 ? 255 : Math.round((lum - THR) / THR * 255);
        d[j + 3] = a;
        // THE BOX IS MEASURED AT THE ALPHA THE RENDERER CALLS SOLID (60), not
        // at the first pixel that is not empty. The key ramps alpha in over a
        // couple of pixels so the cut does not read as a sticker, and those
        // faint rows are real pixels under the boots — measuring from them put
        // the foot line five pixels below the last row anything can see, and
        // tests/tinker.cjs read that as him hovering.
        if (a > 60) {
          const x = p % W, y = (p / W) | 0;
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      // ...and this frame's OWN foot row, kept separately from the union
      let low = -1;
      for (let p = 0; p < W * H; p++) if (d[(p << 2) + 3] > 60) { const y = (p / W) | 0; if (y > low) low = y; }
      feet.push(low);
      frames.push(im);
    }
    if (x1 < 0) return { err: 'every frame keyed to nothing — wrong threshold?' };
    // PAD THE TOP AND THE SIDES. NEVER THE BOTTOM. The bottom of the union box
    // IS the foot line, and the cell is drawn with its bottom on the floor — so
    // three per cent of breathing room under the lowest pixel is three per cent
    // of hovering. tests/tinker.cjs measured it as five pixels of float.
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03);
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(W - 1, x1 + pad);
    // THE FOOT LINE IS THE MEDIAN FRAME'S, NOT THE LOWEST FRAME'S. A single
    // wisp of vent smoke or one dropped particle reaching below the boots sets
    // the union bottom, and then every cell is bottom-aligned to THAT — which
    // puts the actual feet a few pixels above the floor in every frame at once.
    // A constant offset shared by every frame is never the animation; it is
    // always the box. The median is the row he is really standing on.
    const sorted = feet.slice().sort((a2, b2) => a2 - b2);
    const foot = sorted[sorted.length >> 1];
    if (foot > 0) y1 = Math.min(y1, foot);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;

    // pass 2: same box for every frame, laid out left to right
    const s = Math.min(CELL / bw, CELL / bh);
    const dw = Math.round(bw * s), dh = Math.round(bh * s);
    const strip = document.createElement('canvas');
    strip.width = CELL * N; strip.height = CELL;
    const sc = strip.getContext('2d');
    sc.imageSmoothingQuality = 'high';
    const one = document.createElement('canvas'); one.width = W; one.height = H;
    const oc = one.getContext('2d');
    for (let i = 0; i < N; i++) {
      oc.clearRect(0, 0, W, H);
      oc.putImageData(frames[i], 0, 0);
      // FEET ON THE SAME LINE IN EVERY CELL: bottom-aligned, centred. The rig
      // draws a cell by its foot line, so a frame that floats is a frame that
      // hops.
      sc.drawImage(one, x0, y0, bw, bh,
        i * CELL + (CELL - dw) / 2, CELL - dh, dw, dh);
    }
    return { png: strip.toDataURL('image/png'), N, CELL, src: W + 'x' + H, dur: +D.toFixed(2), box: bw + 'x' + bh, feet, foot };
  }, { N, CELL, THR, SRC });

  if (res.err) { console.error('  ' + res.err); process.exit(1); }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log('  ' + out + '  ' + res.N + ' cells of ' + res.CELL
    + '  (source ' + res.src + ', ' + res.dur + 's, subject ' + res.box
    + ', foot row ' + res.foot + ' of ' + res.feet.join('/') + ')  '
    + (fs.statSync(out).size / 1024 | 0) + ' KB');
  await browser.close();
})();
