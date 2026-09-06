// Did the restyle keep the silhouette? Compare alpha coverage and the overlap
// of the two masks. A generator told "the black is emptiness" sometimes paints
// a scene into it anyway, and the result is a RECTANGLE where a cut-out used to
// be — which reads in game as a black box dropped over the room. Coverage and
// IoU catch it without anyone having to squint at a contact sheet.
//
//   node tools/alphacmp.cjs <a.png> <b.png> [more pairs...]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const pairs = process.argv.slice(2);
  const br = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const pg = await br.newPage();
  await pg.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  for (const pr of pairs) {
    const [a, b] = pr.split('=');
    const r = await pg.evaluate(async ({ a, b }) => {
      const mask = async (f, W, H) => {
        const im = new Image(); im.src = 'data:image/png;base64,' + await window.bytes(f);
        await im.decode();
        const w = W || im.naturalWidth, h = H || im.naturalHeight;
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const c = cv.getContext('2d'); c.drawImage(im, 0, 0, w, h);
        const d = c.getImageData(0, 0, w, h).data;
        const m = new Uint8Array(w * h);
        for (let p = 0; p < w * h; p++) m[p] = d[(p << 2) + 3] > 60 ? 1 : 0;
        return { m, w, h };
      };
      const A = await mask(a);
      const B = await mask(b, A.w, A.h);
      let ca = 0, cb = 0, inter = 0, uni = 0;
      for (let p = 0; p < A.w * A.h; p++) {
        ca += A.m[p]; cb += B.m[p];
        if (A.m[p] && B.m[p]) inter++;
        if (A.m[p] || B.m[p]) uni++;
      }
      const n = A.w * A.h;
      return { ca: ca / n * 100, cb: cb / n * 100, iou: uni ? inter / uni * 100 : 0 };
    }, { a, b });
    const ok = r.iou >= 80 && Math.abs(r.cb - r.ca) < 12;
    console.log((ok ? '  ok   ' : '  BAD  ') + path.basename(b).replace('.png', '').padEnd(10)
      + ' coverage ' + r.ca.toFixed(1).padStart(5) + '% -> ' + r.cb.toFixed(1).padStart(5) + '%'
      + '   overlap ' + r.iou.toFixed(1) + '%');
  }
  await br.close();
})();
