// Compare a restyled plate against the plate it replaces: mean luminance and
// mean chroma. A restyle that brightens or saturates the room is not a restyle.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const pairs = process.argv.slice(2);   // old.jpg=new.png ...
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const pg = await b.newPage();
  await pg.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  for (const pr of pairs) {
    const [o, n] = pr.split('=');
    const mime = f => f.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const r = await pg.evaluate(async ({ o, n, mo, mn }) => {
      const load = async (f, m) => {
        const im = new Image(); im.src = 'data:' + m + ';base64,' + await window.bytes(f);
        await im.decode();
        const cv = document.createElement('canvas');
        cv.width = 320; cv.height = Math.max(1, Math.round(320 * im.naturalHeight / im.naturalWidth));
        const c = cv.getContext('2d'); c.drawImage(im, 0, 0, cv.width, cv.height);
        const d = c.getImageData(0, 0, cv.width, cv.height).data;
        let L = 0, S = 0, hot = 0, np = cv.width * cv.height;
        for (let p = 0; p < np; p++) {
          const j = p << 2, R = d[j], G = d[j + 1], B = d[j + 2];
          const lum = (R * 0.299 + G * 0.587 + B * 0.114) / 2.55;
          L += lum; S += (Math.max(R, G, B) - Math.min(R, G, B)) / 2.55;
          if (lum > 80) hot++;
        }
        return { lum: L / np, sat: S / np, hot: hot / np * 100, w: im.naturalWidth, h: im.naturalHeight };
      };
      return { a: await load(o, mo), b: await load(n, mn) };
    }, { o, n, mo: mime(o), mn: mime(n) });
    const nm = path.basename(n).replace(/\.[a-z]+$/, '');
    console.log(nm.padEnd(15)
      + ' lum ' + r.a.lum.toFixed(1).padStart(5) + ' -> ' + r.b.lum.toFixed(1).padStart(5)
      + '   sat ' + r.a.sat.toFixed(1).padStart(5) + ' -> ' + r.b.sat.toFixed(1).padStart(5)
      + '   hot% ' + r.a.hot.toFixed(1).padStart(5) + ' -> ' + r.b.hot.toFixed(1).padStart(5)
      + '   ' + r.b.w + 'x' + r.b.h);
  }
  await b.close();
})();
