// Luminance and chroma INSIDE the silhouette only. A restyle that flattens a
// detailed band to a solid black shape passes the alpha check and still loses
// the plate.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const pg = await br.newPage();
  await pg.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  for (const pr of process.argv.slice(2)) {
    const [a, b] = pr.split('=');
    const r = await pg.evaluate(async ({ a, b }) => {
      const stat = async (f) => {
        const im = new Image(); im.src = 'data:image/png;base64,' + await window.bytes(f);
        await im.decode();
        const cv = document.createElement('canvas');
        cv.width = im.naturalWidth; cv.height = im.naturalHeight;
        cv.getContext('2d').drawImage(im, 0, 0);
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let L = 0, S = 0, n = 0, sq = 0;
        for (let p = 0; p < cv.width * cv.height; p++) {
          const j = p << 2; if (d[j + 3] <= 60) continue;
          const lum = (d[j] * 0.299 + d[j + 1] * 0.587 + d[j + 2] * 0.114) / 2.55;
          L += lum; sq += lum * lum; S += (Math.max(d[j], d[j+1], d[j+2]) - Math.min(d[j], d[j+1], d[j+2])) / 2.55; n++;
        }
        const m = L / n;
        return { lum: m, sd: Math.sqrt(sq / n - m * m), sat: S / n };
      };
      return { a: await stat(a), b: await stat(b) };
    }, { a, b });
    console.log('  ' + path.basename(b).replace('.png','').padEnd(8)
      + ' inside-lum ' + r.a.lum.toFixed(1).padStart(5) + ' -> ' + r.b.lum.toFixed(1).padStart(5)
      + '   detail(sd) ' + r.a.sd.toFixed(1).padStart(5) + ' -> ' + r.b.sd.toFixed(1).padStart(5)
      + '   sat ' + r.a.sat.toFixed(1).padStart(5) + ' -> ' + r.b.sat.toFixed(1).padStart(5));
  }
  await br.close();
})();
