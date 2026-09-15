// FIND THE FRAMES IN A DELIVERED STRIP, AND MEASURE THEM BEFORE TRUSTING THEM.
//
// External art arrives as one wide PNG with the frames laid out left to right
// and transparent gutters between them. Nothing guarantees the gutters are
// evenly spaced, so slicing on a fixed pitch silently cuts limbs off — the
// frames have to be FOUND, not assumed.
//
// What it then measures is the set of things that decide whether a strip can be
// animated at all, each of which has already shipped as a bug in this project:
//
//   height drift   she must be the same size in every frame. A strip that ramps
//                  scale (a "walking into the distance" layout, which is what
//                  one delivered walk cycle turned out to be) is unusable as a
//                  cycle no matter how good each drawing is.
//   foot drift     the floor line must be the same in every frame, or she bobs
//                  through the ground. Airborne frames are legitimately off it,
//                  so this reports rather than fails.
//   gutter width   a gutter under a few px means two frames are touching and the
//                  slice is a guess.
//   body vs FX     effects are keyed out by hue so the BODY's height is measured
//                  rather than the slash arc's, which is three times taller and
//                  would swamp every number here.
//
//   node tools/sheetslice.cjs <strip.png> [--cut <outdir>] [--frames N]
//
// --frames N is for sheets the runs cannot answer: frames that touch end to end
// (one run, no median to measure against) and effects sheets that are loose
// blobs (many runs, none of them a frame). Give it the count from the brief.
//
// With --cut it writes <outdir>/0.png, 1.png ... ready for tools/movestrip.cjs.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const PAGE = `
window.slice = async (dataUrl, forceN) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;
  const A = (px, py) => d[(py * W + px) * 4 + 3];
  // BODY vs EFFECT. Her plating is near-white and warm; the FX are saturated
  // blue. Measuring height off everything makes a slash arc the character.
  const isBody = (px, py) => {
    const i = (px + py * W) * 4;
    if (d[i + 3] < 140) return false;
    const r = d[i], g = d[i+1], b = d[i+2];
    if (b > 150 && b - r > 45) return false;        // blue FX
    return true;
  };

  // columns that hold anything at all -> frames are the runs between gaps,
  // and HOW MUCH each column holds, which is what splits a bridged pair
  const col = new Array(W).fill(false);
  const ink = new Array(W).fill(0);
  for (let px = 0; px < W; px++) {
    let n = 0;
    for (let py = 0; py < H; py++) if (A(px, py) > 30) n++;
    ink[px] = n;
    col[px] = n > 0;
  }

  const runs = [];
  let s = -1;
  for (let px = 0; px < W; px++) {
    if (col[px] && s < 0) s = px;
    else if (!col[px] && s >= 0) { runs.push([s, px - 1]); s = -1; }
  }
  if (s >= 0) runs.push([s, W - 1]);
  // drop specks: anything under 1.5% of the strip width is not a frame
  let keep = runs.filter(r => r[1] - r[0] + 1 > W * 0.015);

  // SPLIT THE BRIDGED ONES. An effect that reaches across a gutter — a claw at
  // full extension, a slash arc — welds two frames into one run, and the merged
  // run then measures as a single frame twice as wide as its neighbours. The
  // bridge is THIN (it is an arm, not a body), so the split is found rather than
  // guessed: take runs far wider than the median, work out how many frames they
  // ought to hold, and cut each boundary at the column carrying the least ink
  // within a window around where it should fall.
  const splits = [];
  // FORCED COUNT. Two failures defeat inference from the runs alone, and the
  // supercharge sheet arrived with both: its twelve body frames TOUCH end to end,
  // so there is one run and no median to compare it against; and its effects
  // sheet is loose blobs of energy, so there are twenty-three runs for twelve
  // frames. Neither is a defect in the art — an effect has no obligation to be
  // one connected shape — so when the count is known it is given, and the runs
  // are ignored entirely: divide the inked span into N and slide each boundary
  // to the thinnest column near where it falls.
  if (forceN && forceN > 1 && keep.length) {
    const a = keep[0][0], b = keep[keep.length - 1][1], w = b - a + 1;
    const out = [];
    let prev = a;
    for (let j = 1; j <= forceN; j++) {
      if (j === forceN) { out.push([prev, b]); break; }
      const target = a + Math.round(w * j / forceN);
      const half = Math.max(6, Math.round(w / forceN * 0.3));
      let best = target, bestInk = Infinity;
      for (let px = Math.max(prev + 4, target - half); px <= Math.min(b - 4, target + half); px++)
        if (ink[px] < bestInk) { bestInk = ink[px]; best = px; }
      out.push([prev, best]);
      splits.push({ at: best, ink: bestInk });
      prev = best + 1;
    }
    keep = out;
  } else
  {
    const widths = keep.map(r => r[1] - r[0] + 1).sort((a, b) => a - b);
    const medW = widths[widths.length >> 1];
    const out = [];
    for (const [a, b] of keep) {
      const w = b - a + 1, n = Math.round(w / medW);
      if (w < medW * 1.55 || n < 2) { out.push([a, b]); continue; }
      const bounds = [a];
      for (let j = 1; j < n; j++) {
        const target = a + Math.round(w * j / n);
        const half = Math.max(8, Math.round(medW * 0.22));
        let best = target, bestInk = Infinity;
        for (let px = Math.max(a + 4, target - half); px <= Math.min(b - 4, target + half); px++)
          if (ink[px] < bestInk) { bestInk = ink[px]; best = px; }
        bounds.push(best);
        splits.push({ at: best, ink: bestInk });
      }
      bounds.push(b + 1);
      for (let j = 0; j < bounds.length - 1; j++)
        out.push([bounds[j] + (j ? 1 : 0), bounds[j + 1] - 1]);
    }
    keep = out;
  }

  const frames = keep.map(([x0, x1], i) => {
    let by0 = H, by1 = 0, bx0 = x1, bx1 = x0, area = 0;
    let ay0 = H, ay1 = 0;                              // all pixels, FX included
    for (let py = 0; py < H; py++) for (let px = x0; px <= x1; px++) {
      if (A(px, py) > 140) { if (py < ay0) ay0 = py; if (py > ay1) ay1 = py; }
      if (!isBody(px, py)) continue;
      area++;
      if (px < bx0) bx0 = px; if (px > bx1) bx1 = px;
      if (py < by0) by0 = py; if (py > by1) by1 = py;
    }
    // A boundary this tool CREATED abuts by construction, so reporting it as
    // "touching" is the tool complaining about its own decision. The split is
    // already announced on its own line; flagging it twice trains the reader to
    // ignore the flag, which is the one thing a measurement tool must not do.
    const gutter = i < keep.length - 1 ? keep[i + 1][0] - x1 - 1 : null;
    const wasSplit = splits.some(s2 => Math.abs(s2.at - x1) <= 1);
    return {
      i, x0, x1,
      bodyH: by1 >= by0 ? by1 - by0 + 1 : 0,
      bodyW: bx1 >= bx0 ? bx1 - bx0 + 1 : 0,
      foot: by1, area, wasSplit,
      fullH: ay1 >= ay0 ? ay1 - ay0 + 1 : 0,
      gutter,
    };
  });
  return { W, H, frames, splits };
};
window.cutFrame = async (dataUrl, x0, x1, H) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const w = x1 - x0 + 1;
  const c = document.createElement('canvas'); c.width = w; c.height = H;
  const x = c.getContext('2d');
  x.drawImage(img, x0, 0, w, H, 0, 0, w, H);
  return c.toDataURL('image/png');
};
`;

const med = a => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };

(async () => {
  const argv = process.argv.slice(2);
  const strip = argv[0];
  const cutIdx = argv.indexOf('--cut');
  const outdir = cutIdx >= 0 ? argv[cutIdx + 1] : null;
  const fIdx = argv.indexOf('--frames');
  const forceN = fIdx >= 0 ? +argv[fIdx + 1] : 0;
  // An EFFECTS sheet has no body, so every body measurement below is meaningless
  // on it: an arc three times her height is not a size defect, and energy that
  // floats has no foot line to hold. --fx keeps the cutting and drops the flags.
  const fx = argv.includes('--fx');
  if (!strip) { console.log('usage: sheetslice.cjs <strip.png> [--cut <outdir>] [--frames N]'); process.exit(1); }

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.addScriptTag({ content: PAGE });
  const url = 'data:image/png;base64,' + fs.readFileSync(strip).toString('base64');
  const { W, H, frames, splits } = await page.evaluate(([u, n]) => window.slice(u, n), [url, forceN]);

  const name = path.basename(strip);
  console.log(name + '  ' + W + 'x' + H + '  ->  ' + frames.length + ' frames');
  if (splits && splits.length) {
    // never silent: a split is the tool deciding where a frame boundary is, and
    // that decision has to be visible enough to argue with
    console.log('  split ' + splits.length + ' bridged frame(s) at x='
      + splits.map(s2 => s2.at + ' (' + s2.ink + 'px of ink)').join(', '));
  }
  if (!frames.length) { console.log('  no frames found'); await browser.close(); process.exit(1); }

  const mh = med(frames.map(f => f.bodyH)), mf = med(frames.map(f => f.foot));
  console.log('  #   x0    x1   bodyH   bodyW    foot   fullH  gutter   flags');
  const bad = [];
  for (const f of frames) {
    const fl = [];
    const dh = (f.bodyH - mh) / mh, df = f.foot - mf;
    if (!fx && Math.abs(dh) > 0.12) fl.push((dh > 0 ? '+' : '') + (dh * 100).toFixed(0) + '% SIZE');
    if (!fx && Math.abs(df) > H * 0.05) fl.push((df > 0 ? '+' : '') + df + 'px FOOT');
    if (f.gutter != null && f.gutter < 4 && !f.wasSplit) fl.push('TOUCHING(' + f.gutter + 'px)');
    if (!fx && !f.bodyH) fl.push('NO BODY');
    console.log('  ' + String(f.i).padEnd(3) + String(f.x0).padStart(5) + String(f.x1).padStart(6)
      + String(f.bodyH).padStart(8) + String(f.bodyW).padStart(8) + String(f.foot).padStart(8)
      + String(f.fullH).padStart(8) + String(f.gutter == null ? '-' : f.gutter).padStart(8)
      + '   ' + fl.join(' '));
    if (fl.length) bad.push(f.i + ': ' + fl.join(' '));
  }
  const hs = frames.map(f => f.bodyH);
  const spread = (Math.max(...hs) - Math.min(...hs)) / mh;
  console.log('  median body height ' + mh + 'px, foot line y=' + mf
    + ', height spread ' + (spread * 100).toFixed(0) + '%');

  if (outdir) {
    fs.mkdirSync(outdir, { recursive: true });
    for (const f of frames) {
      const u = await page.evaluate(([a, b, c, d]) => window.cutFrame(a, b, c, d), [url, f.x0, f.x1, H]);
      fs.writeFileSync(path.join(outdir, f.i + '.png'), Buffer.from(u.split(',')[1], 'base64'));
    }
    console.log('  cut ' + frames.length + ' frames -> ' + outdir);
  }
  await browser.close();
  if (bad.length) { console.log('  NOT CLEAN: ' + bad.length + ' frame(s) flagged'); process.exit(1); }
  console.log('  clean');
})();
