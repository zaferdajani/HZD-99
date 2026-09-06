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
const { selectMotionFrames } = require('./motion-sampling.cjs');

(async () => {
  const [inp, out, nArg, cellArg, thrArg, fromArg, toArg] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: vidstrip.cjs <in.mp4> <out.png> [frames] [cell] [thr]'); process.exit(2); }
  // `auto` picks the frames by content instead of by clock — see the long note
  // in the sampling loop. The number that follows it is the CEILING, not the
  // count: a take with fewer distinct pictures in it yields a shorter strip.
  const AUTO = /^auto/i.test(String(nArg || ''));
  const N = AUTO ? parseInt(String(nArg).replace(/^auto:?/i, '') || '24', 10)
                 : parseInt(nArg || '12', 10);
  const CELL = parseInt(cellArg || '320', 10);
  // A WINDOW, because a swing is not a loop. An idle cycle fills its whole
  // clip and can be sampled end to end; a STRIKE is a fraction of one — the
  // generator is asked for several swings so at least one comes out clean, and
  // then exactly one of them has to be cut out. Sampling the whole clip instead
  // gives six frames spread across three strikes and two guards, which is a
  // flipbook of unrelated poses. Seconds; omit for the whole clip.
  const FROM = fromArg === undefined ? null : parseFloat(fromArg);
  const TO = toArg === undefined ? null : parseFloat(toArg);
  const THR = parseInt(thrArg || '26', 10);
  // Normalized source rectangle around the MOVING BODY PART. Exclude cape,
  // sparks and background when they would masquerade as an animated body.
  // This changes only the measurement, never the delivered image crop.
  const ROI = (process.env.MOTION_ROI || '0,0,1,1').split(',').map(Number);
  if (ROI.length !== 4 || ROI.some(v => !Number.isFinite(v)) || ROI[0] < 0 || ROI[1] < 0
      || ROI[2] <= 0 || ROI[3] <= 0 || ROI[0] + ROI[2] > 1 || ROI[1] + ROI[3] > 1)
    throw new Error('MOTION_ROI must be normalized x,y,width,height within the source');

  // OVER HTTP, NOT AS A DATA URI. A 2 MB base64 video URL is refused outright,
  // and the failure looks exactly like a codec failure, which cost a detour.
  // The clip is served from the same local server the harnesses use.
  const SRC = process.env.CLIP_URL || ('http://127.0.0.1:8220/' + path.basename(inp));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  // SAME ORIGIN, or getImageData refuses to read the frame: a video served
  // from the local server into an about:blank page taints the canvas, and the
  // error arrives at the read rather than at the load.
  try { await page.goto(new URL(SRC).origin + '/'); } catch (e) {}
  await page.addScriptTag({ content: selectMotionFrames.toString() });

  const res = await page.evaluate(async ({ N: N0, CELL, THR, SRC, FROM, TO, AUTO, ROI }) => {
    let N = N0, autoThr = null;
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
    // HOW MUCH SUBJECT EACH COLUMN AND ROW ACTUALLY HOLDS, summed over every
    // frame. The extreme box alone cannot tell the character from a hairline:
    // this generator drew a one-pixel HORIZON straight across the plate behind
    // her, the fill could not cross it, and the union box came back 1280 wide
    // for a cat 400 wide — every cell then framed the room instead of her.
    // Raising the key threshold does not help, because the line is brighter
    // than she is in places. Mass does: a horizon contributes two pixels to a
    // column, a shoulder contributes three hundred.
    const colMass = new Float64Array(W), rowMass = new Float64Array(H);
    // ---- WHICH MOMENTS TO CUT, and this is the whole difference between a
    // sequence and a flip-book of the same picture.
    //
    // The owner, looking at a contact sheet of a take: "the images that
    // Higgsfield is generating does not always create the correct sequence of
    // the movements... a big percentage of what is inside of it is replicated
    // images." Measured with tools/framedupe.cjs on the shipped strips he was
    // right and it was worse than one sheet shows: 19 of patch's 24 cells and
    // 12 of mono's were the same drawing as the cell before them.
    //
    // The cause is sampling on a CLOCK. A generated take is not a metronome —
    // the model holds a pose, moves fast, holds again — so N evenly spaced
    // samples spend most of their cells inside the holds and skip through the
    // part where the body actually moves. The cell count comes out right and
    // the pictures in it are wrong, and on screen that is a move that stutters
    // and then jumps.
    //
    // So the frames are chosen by CONTENT: walk the window finely, and keep a
    // frame only when it differs from the last one KEPT by more than a
    // threshold. Every cell is then a picture the player has not seen, which is
    // what "a sequence of images to generate a movement" means. If the take
    // does not hold N different pictures, the strip comes out SHORTER rather
    // than padded — a shorter strip of real frames plays better than a long one
    // of repeats, and it is also the honest report on what the take contains.
    const t0w = (FROM === null ? 0 : FROM), t1w = (TO === null ? D : Math.min(TO, D));
    let times = [];
    if (AUTO) {
      // a cheap signature per candidate: coarse alpha+value, on the raw frame.
      // It only has to rank "same picture" against "different picture".
      const SG = 40;
      const sigOf = () => {
        const im2 = c.getImageData(0, 0, W, H).data;
        const a = new Float32Array(SG * SG);
        const ox = Math.floor(W * ROI[0]), oy = Math.floor(H * ROI[1]);
        const bx = W * ROI[2] / SG, by = H * ROI[3] / SG;
        for (let y = 0; y < SG; y++) for (let x = 0; x < SG; x++) {
          let sv = 0, cnt = 0;
          for (let yy = Math.floor(y * by); yy < Math.floor((y + 1) * by); yy += 3)
            for (let xx = Math.floor(x * bx); xx < Math.floor((x + 1) * bx); xx += 3) {
              const j = (((oy + yy) * W + ox + xx) << 2);
              sv += (im2[j] * 2 + im2[j + 1] * 5 + im2[j + 2]) / 8 / 255;
              cnt++;
            }
          a[y * SG + x] = cnt ? sv / cnt : 0;
        }
        return a;
      };
      const dist = (p, q) => {
        let d2 = 0, on = 0;
        for (let i = 0; i < SG * SG; i++) {
          const cov = Math.max(p[i], q[i]);
          if (cov < 0.02) continue;         // both empty here: the black field
          d2 += Math.abs(p[i] - q[i]); on += cov;
        }
        return on ? (d2 / on) * 100 : 0;
      };
      const STEP = 1 / 48;                  // finer than any source frame rate
      const cand = [];
      for (let t = t0w; t <= t1w + 1e-6; t += STEP) {
        await seek(Math.min(D - 0.02, t));
        c.clearRect(0, 0, W, H); c.drawImage(v, 0, 0, W, H);
        cand.push({ t, sig: sigOf() });
      }
      // Scan the WHOLE window, retain the return, never relax the quality
      // floor to manufacture a cell count. This is retiming only: the source
      // must still be reviewed for actual limb motion, facing and continuity.
      const selected = selectMotionFrames(cand, N, dist);
      times = selected.indices.map(i => cand[i].t);
      autoThr = selected.threshold;
      N = times.length;
    } else {
      for (let i = 0; i < N; i++)
        times.push(Math.min(D - 0.02, t0w + (i + 0.5) * (t1w - t0w) / N));
    }
    for (let i = 0; i < N; i++) {
      await seek(times[i]);
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
          colMass[x]++; rowMass[y]++;
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
    // ...and the box is trimmed to the columns and rows that carry real mass.
    // The floor is one per cent of the frame — thin enough to keep a whisker,
    // a claw tip and a cape edge, thick enough to drop a drawn horizon or a
    // stray one-pixel scanline. Only ever tightens: if nothing is thin, this
    // does nothing at all, which is why every strip cut before it is unchanged.
    // COLUMNS ONLY, and that asymmetry is deliberate. The artifact this exists
    // for is a HORIZONTAL hairline, which is thin in every column it crosses
    // and enormous in the one row it occupies — so columns can be judged by
    // mass and rows cannot: her EAR TIPS are legitimately thin rows, and a row
    // rule strict enough to drop a horizon would cut the top off her head.
    // Rows are already anchored below by the median foot line.
    const wide0 = x0, wide1 = x1;
    {
      const cMin = N * H * 0.012;             // ~9 px of subject per frame
      let a2 = x0, b2 = x1;
      while (a2 < b2 && colMass[a2] < cMin) a2++;
      while (b2 > a2 && colMass[b2] < cMin) b2--;
      if (b2 > a2 + 16) { x0 = a2; x1 = b2; }
    }
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
    return { png: strip.toDataURL('image/png'), N, CELL, src: W + 'x' + H, dur: +D.toFixed(2),
             box: bw + 'x' + bh, feet, foot, autoThr,
             times: times.map(t => +t.toFixed(3)) };
  }, { N, CELL, THR, SRC, FROM, TO, AUTO, ROI });

  if (res.err) { console.error('  ' + res.err); process.exit(1); }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  fs.writeFileSync(out + '.motion.json', JSON.stringify({ source: inp, mode: AUTO ? 'content-retime' : 'even-time', roi: ROI, frames: res.N, times: res.times, threshold: res.autoThr, reviewed: false }, null, 2) + '\n');
  console.log('  ' + out + '  ' + res.N + ' cells of ' + res.CELL
    + (res.autoThr !== null && res.autoThr !== undefined
       ? '  [auto, kept at ' + res.autoThr.toFixed(1) + '% apart]' : '')
    + '  (source ' + res.src + ', ' + res.dur + 's, subject ' + res.box
    + ', foot row ' + res.foot + ' of ' + res.feet.join('/') + ')  '
    + (fs.statSync(out).size / 1024 | 0) + ' KB');
  await browser.close();
})();
