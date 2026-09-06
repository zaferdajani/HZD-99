// HOLES PUNCHED THROUGH A CHARACTER — the keying fault, findable on demand.
//
// WHAT IT LOOKS FOR. A keyed sheet's transparent pixels should all be
// BACKGROUND, and background is what the outside can reach. A transparent pixel
// the subject encloses is a hole: the room shows through the middle of a
// character. This floods inward from every border pixel and reports whatever
// transparency the flood could not get to.
//
// WHY IT EXISTS. npc_6yaw.png shipped with 45.6% of Ratchet's interior keyed
// away — his shoulder, his pack and his legs were literally missing, and the
// den behind him showed through. It was reported twice as "a ghost" and cost
// three rounds of chasing brightness before anyone looked at the alpha channel.
// The cause was tools/turnsheet.cjs keying by a global luminance threshold with
// no notion of inside or outside (fixed there now, in two ways: the band is
// measured off the border instead of hard-coded at 26, and only backdrop the
// outside can reach is cleared).
//
// READ THE OUTPUT WITH JUDGEMENT — it is a report, not a test, and that is
// deliberate. Three things trip it legitimately:
//   - PARTS ATLASES (beast_parts, mother_parts...) are grids of separate
//     pieces; the gutters between them are enclosed by their neighbours.
//   - REAL GAPS. A body has see-through space between an arm and a torso, or
//     through a handle. Those are correct and they usually reach the border,
//     but a tight one can be enclosed by the frame's own crop.
//   - SPRITE SHEETS with figures on all four sides of a gap.
// A finding is only a defect once it has been compared against the source the
// sheet was keyed from. That comparison is what made the npc_6yaw case certain.
//
//   node tools/holecheck.cjs [dir]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// A directory may be named, so a plate can be checked BEFORE it enters the
// tree — finding the fault after the commit is how npc_6yaw shipped.
const ROOT = process.argv[2]
  ? require('path').resolve(process.argv[2])
  : require('path').join(__dirname, '..', 'assets', 'characters');
function walk(d, out) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.png$/i.test(f) && st.size > 20000) out.push(p);
  }
  return out;
}
(async () => {
  const files = walk(ROOT, []);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const rows = [];
  for (const f of files) {
    const url = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    const r = await p.evaluate(async (u) => {
      const im = new Image(); im.src = u; await im.decode();
      const W = im.naturalWidth, H = im.naturalHeight;
      if (W * H > 6e6) return null;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      const D = x.getImageData(0, 0, W, H).data;
      // a transparent pixel is BACKGROUND only if it is reachable from the
      // border through other transparent pixels. Anything else is a hole
      // punched through the subject.
      const A = new Uint8Array(W * H);
      for (let i = 0, q = 0; i < D.length; i += 4, q++) A[q] = D[i + 3] < 40 ? 1 : 0;
      const seen = new Uint8Array(W * H);
      const st = [];
      for (let x2 = 0; x2 < W; x2++) { st.push(x2); st.push((H - 1) * W + x2); }
      for (let y2 = 0; y2 < H; y2++) { st.push(y2 * W); st.push(y2 * W + W - 1); }
      while (st.length) {
        const q = st.pop();
        if (seen[q] || !A[q]) continue;
        seen[q] = 1;
        const qx = q % W, qy = (q / W) | 0;
        if (qx > 0) st.push(q - 1);
        if (qx < W - 1) st.push(q + 1);
        if (qy > 0) st.push(q - W);
        if (qy < H - 1) st.push(q + W);
      }
      let holes = 0, subject = 0;
      for (let q = 0; q < A.length; q++) {
        if (A[q]) { if (!seen[q]) holes++; }
        else subject++;
      }
      return { holes, subject, pct: subject ? +(holes / (subject + holes) * 100).toFixed(1) : 0 };
    }, url);
    if (r && r.holes > 200) rows.push([f.replace(ROOT + '/', ''), r.pct, r.holes]);
  }
  rows.sort((a, z) => z[1] - a[1]);
  console.log('sheets with holes punched through the subject (of ' + files.length + ' scanned):\n');
  rows.slice(0, 22).forEach(r => console.log('  ' + String(r[1]).padStart(5) + '%  ' + String(r[2]).padStart(7) + ' px   ' + r[0]));
  console.log('\ntotal affected: ' + rows.length);
  await b.close();
})();
