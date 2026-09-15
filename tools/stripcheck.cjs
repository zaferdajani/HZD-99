// MEASURE A MOVE STRIP BEFORE CLAIMING IT IS GOOD.
//
// Written because a candidate strip was sent to the owner on the strength of
// "it looks coherent" in the same breath as an argument that the strip it
// replaced was bad BECAUSE it had been measured. He looked at it for five
// seconds and found a fat cell and inconsistent claws. Eyeballing a contact
// sheet is not validation; this is.
//
// Per cell it reports, all normalised to that cell's own figure height so the
// numbers are comparable across a strip that is deliberately scaled uniformly:
//
//   h        figure height in px — the scale check. movestrip.cjs already
//            applies ONE scale, so a tall outlier here means the PLATE is off
//            model, not the assembly.
//   mass     opaque pixels / h^2. THE FAT-CAT DETECTOR. A generated set drifts
//            in body mass between plates and the eye reads it instantly as a
//            different character; this is the number that catches it before the
//            owner does.
//   waist    opaque width at 55% height / h — body bulk at the belly, the place
//            the drift actually shows.
//   eyes     cyan eye-pair gap / h — the facing law from tests/hero.cjs. Wide
//            means she is facing the camera instead of her target.
//   dark     fraction of opaque pixels that are dark steel — a PROXY FOR CLAWS.
//            Her claws are the only dark-metal mass on a near-white body, so a
//            cell where this collapses is a cell where the claws are retracted
//            while its neighbours have them out.
//
// Everything is flagged against the strip's own MEDIAN, not an absolute, since
// a move legitimately changes shape frame to frame. Outliers are the finding.
//
//   node tools/stripcheck.cjs <strip.png> [cells]
const { chromium } = require('playwright');
const fs = require('fs');

const PAGE = `
window.measure = async (dataUrl, cells) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight, CW = W / cells;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;
  const at = (px, py) => (py * W + px) * 4;
  const out = [];
  for (let i = 0; i < cells; i++) {
    const cx0 = Math.round(i * CW), cx1 = Math.round((i + 1) * CW) - 1;
    let x0 = cx1, y0 = H, x1 = cx0, y1 = 0, area = 0, dark = 0;
    for (let py = 0; py < H; py++) for (let px = cx0; px <= cx1; px++) {
      const k = at(px, py);
      if (d[k + 3] < 140) continue;
      area++;
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
      // dark steel: low luminance and not strongly cyan (her visor is dark too
      // but it is a fixed small area in every cell, so it cancels in the ratio)
      const lum = d[k] * 0.3 + d[k+1] * 0.59 + d[k+2] * 0.11;
      if (lum < 95 && d[k+2] < 150) dark++;
    }
    if (x1 < x0) { out.push(null); continue; }
    const h = y1 - y0 + 1, w = x1 - x0 + 1;
    // WAIST IS THE LONGEST CONTIGUOUS RUN, NOT THE SPAN.
    //
    // Measured min-to-max this reads torso PLUS any arm out to the side plus the
    // empty air between them, so it fired on every extended-arm cell in the game
    // and reported a slash as a wide body. The torso is the widest solid thing
    // crossing the middle of her; an arm is a separate, narrower run. So take the
    // longest unbroken run and the arms stop counting.
    //
    // Sampled over a BAND rather than one row, because a single row can land on a
    // belt seam or between two plates and read narrow by accident.
    let waistPx = 0, wany = false;
    for (let f2 = 0.45; f2 <= 0.68; f2 += 0.023) {
      const wy = Math.round(y0 + h * f2);
      if (wy < 0 || wy >= H) continue;
      let run = 0, best = 0;
      for (let px = cx0; px <= cx1; px++) {
        if (d[at(px, wy) + 3] > 140) { run++; if (run > best) best = run; }
        else run = 0;
      }
      if (best > waistPx) { waistPx = best; wany = true; }
    }
    // eye pair: brightest cyan blobs in the top 45% of the figure
    const cyan = [];
    for (let py = y0; py < y0 + h * 0.45; py++) for (let px = cx0; px <= cx1; px++) {
      const k = at(px, py);
      if (d[k + 3] > 140 && d[k+2] > 170 && d[k+1] > 150 && d[k] < 165) cyan.push([px, py]);
    }
    let eyes = null;
    if (cyan.length > 6) {
      const xs = cyan.map(p => p[0]).sort((a, b) => a - b);
      // the gap between the two clusters: widest jump in the sorted x's
      let bi = 0, bg = 0;
      for (let j = 1; j < xs.length; j++) if (xs[j] - xs[j-1] > bg) { bg = xs[j] - xs[j-1]; bi = j; }
      if (bg > 1) {
        const l = xs.slice(0, bi), r = xs.slice(bi);
        eyes = ((r[0] + r[r.length-1]) / 2) - ((l[0] + l[l.length-1]) / 2);
      }
    }
    out.push({
      h, w, area,
      waist: wany ? +(waistPx / h).toFixed(4) : null,
      eyes: eyes != null ? +(eyes / h).toFixed(4) : null,
      dark: +(dark / area).toFixed(4),
    });
  }
  return out;
};
`;

const med = a => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };

(async () => {
  const [strip, cellArg] = process.argv.slice(2);
  if (!strip) { console.log('usage: stripcheck.cjs <strip.png> [cells]'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.addScriptTag({ content: PAGE });
  const b64 = fs.readFileSync(strip).toString('base64');
  // cells from the aspect if not given: these strips are square-celled
  let cells = +cellArg;
  if (!cells) {
    const b = fs.readFileSync(strip);
    cells = Math.round(b.readUInt32BE(16) / b.readUInt32BE(20));
  }
  const m = await page.evaluate(([u, n]) => window.measure(u, n), ['data:image/png;base64,' + b64, cells]);
  await browser.close();

  const ok = m.filter(Boolean);
  // MASS IS NORMALISED BY THE STRIP'S TYPICAL HEIGHT, NOT BY EACH CELL'S OWN.
  //
  // It used to be area / h^2 per cell, and that is only a fat-cat detector while
  // the height is constant. Give it a move with real vertical range and the
  // metric measures the POSE: a crouch keeps its area over a smaller h and reads
  // as 30% heavier, an uppercut at full stretch reads as thin. The uppercut
  // flagged its own crouch and its own extension, which is the animation working.
  //
  // The defect being hunted is MORE CAT, and movestrip already draws every cell
  // at one scale — so area against the strip's median height answers it directly
  // and a change of pose no longer moves the number.
  const medH = med(ok.map(c => c.h));
  for (const c of ok) c.mass = +(c.area / (medH * medH)).toFixed(4);
  const M = {
    h: medH, mass: med(ok.map(c => c.mass)),
    waist: med(ok.filter(c => c.waist != null).map(c => c.waist)),
    dark: med(ok.map(c => c.dark)),
    eyes: med(ok.filter(c => c.eyes != null).map(c => c.eyes)),
  };
  console.log(strip + ' — ' + cells + ' cells');
  console.log('cell     h    mass   waist    eyes    dark   flags');
  const findings = [];
  m.forEach((c, i) => {
    if (!c) { console.log(String(i).padEnd(5) + '  EMPTY'); findings.push(i + ': empty cell'); return; }
    const f = [];
    // ±18% of the strip's own median is the band. Body mass does change through
    // a swing (a lunge is longer and thinner) but not by a fifth.
    const massOff = Math.abs(c.mass - M.mass) / M.mass > 0.18;
    if (massOff) f.push(c.mass > M.mass ? 'BULKY' : 'THIN');
    // WAIST ONLY COUNTS ALONGSIDE MASS, and that is a correction, not a
    // loosening. On its own this fired on four separate clean strips — the
    // passing pose of a walk, the extended-arm cells of two different slashes,
    // a breath in an idle — because every one of them legitimately changes the
    // silhouette's width without changing how much cat there is. Width plus
    // unchanged mass is a limb moving; width plus changed mass is a different
    // character, and only the second is a defect. `mass` already catches that
    // directly, so waist's job is to say WHERE the drift shows, not to raise it.
    // WAIST FLAGS ONLY ON GROSS DEVIATION, and the band is calibrated rather
    // than chosen. A torso's apparent width is a function of POSE as much as of
    // build: seen edge-on mid-turn it is genuinely narrow, at full extension the
    // shoulders square up and it is genuinely wide. Across the strips known good
    // those move it by up to about a quarter; the drawing the owner rejected on
    // sight moves it by 46%. So the line sits between: a third.
    //
    // This is the limit of what a width number can separate on its own, and it
    // is stated rather than hidden — the check is here to catch a cell that is a
    // DIFFERENT CAT, not to adjudicate posture.
    if (c.waist != null && Math.abs(c.waist - M.waist) / M.waist > 0.33)
      f.push(c.waist > M.waist ? 'WIDE-BODY' : 'NARROW-BODY');
    // Claws: half the median dark fraction means the metal is not there. The
    // first and last cells are exempt — a move opens and closes on a guard, and
    // a guard with the claws in is the correct drawing, not a flicker.
    const edge = i === 0 || i === m.length - 1;
    if (!edge && c.dark < M.dark * 0.55) f.push('NO-CLAWS?');
    if (c.eyes == null) f.push('NO-EYES');
    else if (c.eyes > M.eyes * 1.35) f.push('FACING-CAMERA?');
    console.log(String(i).padEnd(5) + String(c.h).padStart(5) + String(c.mass).padStart(8)
      + String(c.waist).padStart(8) + String(c.eyes).padStart(8) + String(c.dark).padStart(8)
      + '   ' + f.join(' '));
    if (f.length) findings.push(i + ': ' + f.join(' '));
  });
  console.log('median   ' + String(M.h).padStart(3) + String(M.mass).padStart(8)
    + String(M.waist).padStart(8) + String(M.eyes).padStart(8) + String(M.dark).padStart(8));
  console.log('');
  if (findings.length) {
    console.log('NOT CLEAN — ' + findings.length + ' cell(s) off the strip\'s own median:');
    findings.forEach(s => console.log('  ' + s));
    process.exit(1);
  }
  console.log('clean — every cell is within band of the strip\'s own median');
})();
