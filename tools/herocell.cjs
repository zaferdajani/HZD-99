// Replace individual CELLS in HZD-99's state sheet, without rebuilding it.
//
// tools/herostates.cjs builds the whole sheet from a directory of 22 plates,
// and that is the right tool when the whole set is being re-fired. It is the
// wrong tool for re-firing two cells: the sheet's ONE global scale is derived
// from the median grounded plate, so feeding it a directory to change run_a
// and run_b re-derives that scale and quietly moves the other twenty cells.
// It also cannot be used at all once the as-fired originals are only in the
// archive at 1024/q90 — rebuilding from those would undo the fixes that were
// applied to the SHEET afterwards (tools/cleanstates.cjs scrubbed baked floor
// slabs out of eight cells; the archive still has them).
//
// So this tool goes the other way: the sheet is the source of truth, and a new
// plate is fitted INTO it. Scale is taken from the cells that are staying —
// the mean subject height of the reference cells named on the command line —
// so the replacement lands at the size its neighbours already agreed on, and
// no cell but the named one is touched.
//
// The new plates must already carry real alpha (matted, not luminance-keyed):
// see the keying note in docs/ART_QUEUE.md §2g on why the black key is wrong
// for these.
//
//   node tools/herocell.cjs <sheet.png> <out.png> <cell>=<plate.png>[,ground|air] ...
//     --ref a,b     cells to take the scale from (default: walk_a,walk_b)
//
// Example, the §1e run re-fire:
//   node tools/herocell.cjs states.png states.png run_a=a.png,ground run_b=b.png,air
const { chromium } = require('playwright');
const fs = require('fs');

// mirrors HERO_CELL in js/entities.js — the sheet's wire format.
// KEEP THESE TWO IN STEP. This table went stale once already: walk_c and run_c
// were appended to the sheet (24 cells now, not 22) and this copy still said
// 22, so the tool would have rebuilt the sheet a cell-pair SHORT and silently
// dropped the two opposite-contact poses off the end. A mirror that is allowed
// to drift is a mirror that deletes art.
const CELL = {
  idle: 0, walk_a: 1, walk_b: 2, run_a: 3, run_b: 4, rise: 5, apex: 6,
  fall: 7, land: 8, dash: 9, skid: 10, wall_cling: 11, djump_jet: 12,
  claw_1: 13, claw_2: 14, finisher: 15, charge: 16, burst: 17, hurt: 18,
  heal: 19, song: 20, slump: 21, walk_c: 22, run_c: 23,
};
const CELLS = 24;
const FLOOR = 4;   // the margin herostates.cjs leaves under a grounded pose

const PAGE = `
// alpha bounding box of a region, off SOLID pixels only so a soft edge or a
// bloom halo does not inflate the measurement
window.bbox = (ctx, x0, y0, w, h) => {
  const d = ctx.getImageData(x0, y0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (d[(y * w + x) * 4 + 3] > 140) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return maxX < minX ? null : { x0: minX, y0: minY, x1: maxX, y1: maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
};
`;

(async () => {
  const argv = process.argv.slice(2);
  const refI = argv.indexOf('--ref');
  let refNames = ['walk_a', 'walk_b'];
  if (refI >= 0) { refNames = argv[refI + 1].split(','); argv.splice(refI, 2); }
  const [sheet, out, ...specs] = argv;
  if (!sheet || !out || !specs.length) {
    console.log('usage: herocell.cjs <sheet.png> <out.png> <cell>=<plate.png>[,ground|air] ... [--ref a,b]');
    process.exit(1);
  }
  const jobs = specs.map((s) => {
    const [name, rest] = s.split('=');
    const [file, mode] = rest.split(',');
    if (!(name in CELL)) { console.log('unknown cell ' + name); process.exit(1); }
    if (!fs.existsSync(file)) { console.log('missing ' + file); process.exit(1); }
    return { name, file, grounded: mode !== 'air' };
  });

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.addScriptTag({ content: PAGE });

  const sheetB64 = fs.readFileSync(sheet).toString('base64');
  const plates = jobs.map((j) => ({ ...j, b64: fs.readFileSync(j.file).toString('base64') }));

  const res = await page.evaluate(async ({ sheetB64, plates, refNames, CELL, CELLS, FLOOR }) => {
    const sh = new Image(); sh.src = 'data:image/png;base64,' + sheetB64; await sh.decode();
    const CW = Math.round(sh.naturalWidth / CELLS), CH = sh.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = sh.naturalWidth; cv.height = CH;
    const c = cv.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.drawImage(sh, 0, 0);

    // the scale every replacement must agree with, read off the cells staying
    const refH = [];
    for (const n of refNames) {
      const b = window.bbox(c, CELL[n] * CW, 0, CW, CH);
      if (b) refH.push(b.h);
    }
    const targetH = refH.reduce((a, b) => a + b, 0) / refH.length;

    // ONE SCALE FOR THE WHOLE CALL, and this is the whole point.
    //
    // Normalising each plate to targetH independently is what an earlier
    // version did, and it is wrong in a way that only shows up in motion: a
    // tucked or crouched pose is genuinely SHORTER than a standing one, so
    // forcing it to the same height scales the character UP for that frame.
    // Played back at run cadence that is the owner's report — "making it
    // smaller and bigger" — a body that pulses instead of a body that runs.
    // herostates.cjs derives one global scale for the same reason.
    //
    // So the scale comes from the FIRST plate in the call, which should be a
    // full-height grounded pose, and every other plate in that call inherits
    // it. Relative sizes between the poses are then preserved exactly as the
    // generator drew them.
    let K = null;

    const report = [];
    for (const p of plates) {
      const im = new Image(); im.src = 'data:image/png;base64,' + p.b64; await im.decode();
      const tmp = document.createElement('canvas');
      tmp.width = im.naturalWidth; tmp.height = im.naturalHeight;
      const tc = tmp.getContext('2d');
      tc.drawImage(im, 0, 0);
      const b = window.bbox(tc, 0, 0, tmp.width, tmp.height);
      if (!b) { report.push({ name: p.name, err: 'empty plate' }); continue; }

      if (K === null) K = targetH / b.h;   // first plate sets the scale
      const k = K;
      const bw = b.w * k, bh = b.h * k;
      const x = CELL[p.name] * CW;
      c.clearRect(x, 0, CW, CH);
      const dx = x + (CW - bw) / 2;
      const dy = p.grounded ? (CH - FLOOR) - bh : (CH - bh) / 2;
      c.drawImage(im, b.x0, b.y0, b.w, b.h, dx, dy, bw, bh);
      report.push({ name: p.name, cell: CELL[p.name], src: b.w + 'x' + b.h, k: +k.toFixed(3),
                    placed: Math.round(bw) + 'x' + Math.round(bh), grounded: p.grounded, over: bw > CW });
    }
    return { url: cv.toDataURL('image/png'), CW, CH, targetH: Math.round(targetH), report };
  }, { sheetB64, plates, refNames, CELL, CELLS, FLOOR });

  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log(`sheet ${res.CW}x${res.CH} per cell · scale target ${res.targetH}px (from ${refNames.join(', ')})`);
  for (const r of res.report) {
    if (r.err) { console.log(`  ${r.name}: ${r.err}`); continue; }
    console.log(`  ${r.name} -> cell ${r.cell}  ${r.src} x${r.k} = ${r.placed}  ${r.grounded ? 'grounded' : 'airborne'}${r.over ? '  ** WIDER THAN THE CELL — it will bleed into its neighbour' : ''}`);
  }
  await browser.close();
})();
