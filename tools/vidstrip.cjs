// Cut a generated clip into a sprite strip the game can draw.
//
// The owner's report on the first NPC was "looks like a slide show gif instead
// of a live machine doing its work", and he was right about the cause: the work
// cycle was seven STILL PLATES held for a second each, and a cut every second
// between stills is a slideshow no matter how good the stills are.
//
// Video is the frame source, not the shipped asset. A <video> drawn into the
// world would carry a black rectangle with it — video has no alpha — so the
// clip is sampled at N even times, keyed off its field, and written as one
// horizontal strip that composites exactly like every other plate here.
//
// THE FIELD IS WHICHEVER ONE THE CLIP ARRIVED ON. Black is the norm and is
// keyed by flood fill from the border, so black in a fold stays. A subject
// that is ITSELF black cannot be fired on black at all — measured, not
// guessed: two clips came back with cloak and coat at the same luminance as
// the empty corner — so those are fired on a chroma screen and keyed by
// colour distance, with a despill pass. Both paths land in the same strip.
//
// The crop is taken ACROSS ALL FRAMES, not per frame: cropping each frame to
// its own content makes the character jitter around its own centre, which is
// the one thing an idle loop must not do.
//
//   node tools/vidstrip.cjs <in.mp4> <out.png> [frames=12] [cell=320] [thr=26] [from] [to]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [inp, out, nArg, cellArg, thrArg, fromArg, toArg] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: vidstrip.cjs <in.mp4> <out.png> [frames] [cell] [thr]'); process.exit(2); }
  const N = parseInt(nArg || '12', 10), CELL = parseInt(cellArg || '320', 10);
  // A WINDOW, because a swing is not a loop. An idle cycle fills its whole
  // clip and can be sampled end to end; a STRIKE is a fraction of one — the
  // generator is asked for several swings so at least one comes out clean, and
  // then exactly one of them has to be cut out. Sampling the whole clip instead
  // gives six frames spread across three strikes and two guards, which is a
  // flipbook of unrelated poses. Seconds; omit for the whole clip.
  const FROM = fromArg === undefined ? null : parseFloat(fromArg);
  const TO = toArg === undefined ? null : parseFloat(toArg);
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
      const t0w = (FROM === null ? 0 : FROM), t1w = (TO === null ? D : Math.min(TO, D));
      await seek(Math.min(D - 0.02, t0w + (i + 0.5) * (t1w - t0w) / N));
      c.clearRect(0, 0, W, H);
      c.drawImage(v, 0, 0, W, H);
      const im = c.getImageData(0, 0, W, H), d = im.data;
      // THE FIELD IS FOUND BY FLOOD FILL FROM THE BORDER, not by a luminance
      // ramp. The ramp was written for a subject in pale plating and it is
      // right for one — and it destroyed the two clips whose subject is DARK:
      // the archivist in a black cloak keyed to an outline and a screen, the
      // tinker in a black coat came back with his chest and legs punched out.
      // A luma key cannot tell a black coat from a black background; only
      // CONNECTEDNESS can, which is the same lesson tools/blackkey.cjs learned
      // on the lion den plate. Black that touches the frame edge is field;
      // black in a fold, a hollow or under an arm is the subject and stays.
      // THE FIELD IS DETECTED, NOT ASSUMED. A black field is the norm here, but
      // a black field cannot hold a BLACK SUBJECT: measured on the archivist and
      // the tinker, their cloak and coat sit at luminance 2 and the empty corner
      // sits at luminance 2 as well. There is no information in those pixels to
      // key on and no cleverness recovers it — so those clips are fired on a
      // chroma screen instead, and this decides which one arrived by looking.
      let keyR = 0, keyG = 0, keyB = 0, chroma = false;
      {
        const rs = [], gs = [], bs = [];
        for (let x = 0; x < W; x += 4) for (const y of [0, H - 1]) {
          const j = (y * W + x) << 2; rs.push(d[j]); gs.push(d[j + 1]); bs.push(d[j + 2]);
        }
        for (let y = 0; y < H; y += 4) for (const x of [0, W - 1]) {
          const j = (y * W + x) << 2; rs.push(d[j]); gs.push(d[j + 1]); bs.push(d[j + 2]);
        }
        const med = (a) => { a.sort((p2, q) => p2 - q); return a[a.length >> 1]; };
        keyR = med(rs); keyG = med(gs); keyB = med(bs);
        chroma = Math.max(keyR, keyG, keyB) - Math.min(keyR, keyG, keyB) > 40;
      }
      const field = new Uint8Array(W * H);
      if (chroma) {
        // Colour distance, not connectedness: a chroma screen separates a black
        // coat from the background by HUE, which is exactly the axis luminance
        // threw away. The ramp is generous at the top so a soft edge stays soft.
        const D0 = 90, D1 = 165;
        for (let p = 0; p < W * H; p++) {
          const j = p << 2;
          const dr = d[j] - keyR, dg = d[j + 1] - keyG, db = d[j + 2] - keyB;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          if (dist <= D0) { field[p] = 1; continue; }
          if (dist < D1) d[j + 3] = Math.round((dist - D0) / (D1 - D0) * 255);
          // DESPILL: green bounced onto a bronze helmet is not part of the
          // helmet, and it is the single thing that makes a keyed figure read
          // as pasted. Any channel that matches the screen and outruns both of
          // its neighbours is pulled back to their level.
          if (keyG > keyR && keyG > keyB && d[j + 1] > (d[j] + d[j + 2]) / 2)
            d[j + 1] = Math.round((d[j] + d[j + 2]) / 2);
          else if (keyB > keyR && keyB > keyG && d[j + 2] > (d[j] + d[j + 1]) / 2)
            d[j + 2] = Math.round((d[j] + d[j + 1]) / 2);
        }
      } else {
        const stack = new Int32Array(W * H);
        let sp = 0;
        const push = (p) => { if (!field[p]) { const j = p << 2;
          if ((d[j] * 2 + d[j + 1] * 5 + d[j + 2]) / 8 <= THR) { field[p] = 1; stack[sp++] = p; } } };
        for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
        for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
        while (sp > 0) {
          const p = stack[--sp], x = p % W, y = (p / W) | 0;
          if (x > 0) push(p - 1);
          if (x < W - 1) push(p + 1);
          if (y > 0) push(p - W);
          if (y < H - 1) push(p + W);
        }
      }
      // FEATHER, because a hard cut-out reads as a sticker laid on the room —
      // the same couple of pixels the ramp used to buy for free. A pixel that
      // survived the fill but has field neighbours fades by how many.
      for (let p = 0; p < W * H; p++) {
        const j = p << 2;
        let a;
        if (field[p]) a = 0;
        else if (chroma) a = d[j + 3];   // the distance ramp above already IS the edge
        else {
          const x = p % W, y = (p / W) | 0;
          let n = 0, tot = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
            tot++; if (field[yy * W + xx]) n++;
          }
          a = tot ? Math.round(255 * (1 - n / tot)) : 255;
        }
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
