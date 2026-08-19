// Put restyled parts back into a guardian atlas, without moving the rig.
//
// A guardian's parts are addressed by ABSOLUTE PIXEL RECT. If a restyled head
// comes back 4px taller, the rig does not scale it — it draws it from the same
// rect and the animal comes apart at the neck. Prompting cannot guarantee the
// silhouette; nothing that goes through a generator can. So the guarantee is
// made here, mechanically, in two steps:
//
//   1. FIT BY BOX. The restyled part's own alpha box is scaled and translated
//      onto the box the original part occupied inside its rect. Wherever the
//      generator drifted in scale or position, this undoes it.
//   2. CLIP TO THE ORIGINAL SILHOUETTE. The result is then masked by the
//      original part's own shape — where "empty" is whatever rigcut MEASURED
//      the sheet to mean, transparency or black. Anything the restyle added
//      outside the old outline is cut, so the outline is unchanged by
//      construction and the assembled animal cannot dislocate.
//
// The cost is that the new ink contour lands just INSIDE the old edge rather
// than on it. That is the right trade: a line 1px in is invisible at play
// size, a leg 4px out is a broken boss.
//
//   node rigpaste.cjs <atlas.png> <meta.json> <keyeddir> <out.png>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [atlas, metaFile, keyedDir, out] = process.argv.slice(2);
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const alphaSheet = meta._alphaSheet !== false;
  const names = Object.keys(meta).filter(n => n[0] !== '_').filter(n =>
    fs.existsSync(path.join(keyedDir, n + '.png')));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('atlasBytes', () => fs.readFileSync(atlas).toString('base64'));
  await page.exposeFunction('partBytes', n =>
    fs.readFileSync(path.join(keyedDir, n + '.png')).toString('base64'));

  const res = await page.evaluate(async ({ meta, names, alphaSheet }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + (await window.atlasBytes());
    await im.decode();
    const W = im.naturalWidth, H = im.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
    const report = [];

    for (const name of names) {
      const m = meta[name], r = m.rect;
      const p = new Image();
      p.src = 'data:image/png;base64,' + (await window.partBytes(name));
      await p.decode();

      // where the restyled part actually sits inside its own plate
      const s = document.createElement('canvas');
      s.width = p.naturalWidth; s.height = p.naturalHeight;
      const sc = s.getContext('2d'); sc.drawImage(p, 0, 0);
      const sd = sc.getImageData(0, 0, s.width, s.height).data;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++)
        if (sd[(y * s.width + x) * 4 + 3] > 24) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      if (x1 < 0) { report.push(name + ': empty, skipped'); continue; }

      // the box it must land on: the original part's own box inside the rect
      const b = m.bbox, tw = b[2] - b[0] + 1, th = b[3] - b[1] + 1;
      const sw = x1 - x0 + 1, sh = y1 - y0 + 1;

      // 1. fit by box, into a scratch the size of the rect
      const t = document.createElement('canvas');
      t.width = r[2]; t.height = r[3];
      const tc = t.getContext('2d');
      tc.imageSmoothingQuality = 'high';
      tc.drawImage(p, x0, y0, sw, sh, b[0], b[1], tw, th);

      // 2. clip to the ORIGINAL silhouette, measured by tone off the black sheet
      const o = document.createElement('canvas');
      o.width = r[2]; o.height = r[3];
      const oc = o.getContext('2d');
      oc.drawImage(im, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
      const od = oc.getImageData(0, 0, r[2], r[3]).data;
      const td = tc.getImageData(0, 0, r[2], r[3]);
      const q = td.data;
      let kept = 0, lost = 0;
      for (let i = 0; i < r[2] * r[3]; i++) {
        const j = i * 4;
        const lit = alphaSheet
          ? od[j + 3] > 24
          : (od[j] * 0.299 + od[j + 1] * 0.587 + od[j + 2] * 0.114) > 16;
        if (!lit) { if (q[j + 3] > 24) lost++; q[j + 3] = 0; }
        else if (q[j + 3] > 24) kept++;
      }
      tc.putImageData(td, 0, 0);

      // The rect is cleared to the sheet's OWN kind of empty before the paste,
      // so nothing of the old part survives in a gap the new one leaves. On an
      // alpha-cut sheet that means clearRect: filling it black instead put an
      // opaque box around every part and would have drawn a black tile behind
      // the boss on screen.
      c.save();
      if (alphaSheet) c.clearRect(r[0], r[1], r[2], r[3]);
      else { c.fillStyle = '#000'; c.fillRect(r[0], r[1], r[2], r[3]); }
      c.drawImage(t, r[0], r[1]);
      c.restore();
      report.push(name + ': fit ' + sw + 'x' + sh + ' -> ' + tw + 'x' + th
        + ', clipped ' + lost + 'px outside the old outline');
    }
    return { url: cv.toDataURL('image/png'), report, W, H };
  }, { meta, names, alphaSheet });

  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  res.report.forEach(l => console.log('  ' + l));
  console.log(out + '  ' + res.W + 'x' + res.H + '  ' + names.length + ' parts replaced');
  await browser.close();
})();
