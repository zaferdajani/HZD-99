// Measure a matte: alpha coverage, subject bbox, and whether the frame border
// survived. A cutout that kept the paper edge is not a cutout, and that is not
// visible at thumbnail size — it has to be counted.
// What did the matte actually leave? Report alpha coverage and whether the
// frame border is clear — a matte that kept the paper edge is not a matte.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b64 = fs.readFileSync(process.argv[2]).toString('base64');
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await br.newPage();
  console.log(JSON.stringify(await p.evaluate(async b64 => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    let on = 0, edge = 0, edgeN = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      const a = d[(y * cv.width + x) * 4 + 3];
      if (a > 24) { on++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x < 4 || y < 4 || x > cv.width - 5 || y > cv.height - 5) { edgeN++; if (a > 24) edge++; }
    }
    return { w: cv.width, h: cv.height, coverage: +(on / (cv.width * cv.height) * 100).toFixed(1),
      borderKept: +(edge / edgeN * 100).toFixed(1), bbox: [x0, y0, x1, y1] };
  }, b64)));
  await br.close();
})();
