// A labelled contact sheet of a directory of plates, for the owner to judge.
//
// Every art pass ends the same way: a folder of PNGs that nobody can evaluate
// one file at a time. A pose only reads as right or wrong NEXT TO its
// neighbours — a run cycle whose two frames drifted apart in weight is
// invisible until they sit side by side. So this is a general tool, not a
// per-pass one: point it at a directory and it lays the whole set out in
// filename order (or an order file, if the set has a meaningful sequence).
//
// Dark ground, because these plates are near-black fields; on white the
// silhouette edge disappears into the page.
//
//   node tools/contact.cjs <dir> <out.png> "Title" [cols] [order.txt]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const [dir, out, title, colsArg, orderFile, cellBg] = process.argv.slice(2);
  let names = fs.readdirSync(dir).filter(f => /\.(png|webp|jpg)$/i.test(f));
  if (orderFile && fs.existsSync(orderFile)) {
    const order = fs.readFileSync(orderFile, 'utf8').split('\n')
      .map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
    names.sort((a, b) => {
      const ia = order.indexOf(path.parse(a).name), ib = order.indexOf(path.parse(b).name);
      return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
    });
  } else names.sort();
  const cols = +(colsArg || 6);
  const items = names.map(f => ({ label: path.parse(f).name, file: path.join(dir, f) }));

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  // The plates are multi-megabyte PNGs and there can be dozens. Handing them
  // all to evaluate() as one base64 blob killed the page at 78 MB of files —
  // so the page PULLS one plate at a time and drops it before asking for the
  // next, and peak memory is one image instead of the whole set.
  await page.exposeFunction('plateBytes', i =>
    fs.readFileSync(items[i].file).toString('base64'));
  const url = await page.evaluate(async ({ items, cols, title, cellBg }) => {
    const CELL = 300, PAD = 14, CAP = 30, HEAD = 74;
    const rows = Math.ceil(items.length / cols);
    const W = PAD + cols * (CELL + PAD);
    const H = HEAD + rows * (CELL + CAP + PAD) + PAD;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0e14'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e8edf6'; c.font = '600 30px system-ui, sans-serif';
    c.fillText(title || '', PAD, 46);

    for (let i = 0; i < items.length; i++) {
      const x = PAD + (i % cols) * (CELL + PAD);
      const y = HEAD + Math.floor(i / cols) * (CELL + CAP + PAD);
      // A cutout has to be judged against something it does not match:
      // black fringe on a black cell is invisible until it ships.
      c.fillStyle = cellBg || 'rgba(255,255,255,0.035)';
      c.fillRect(x, y, CELL, CELL);
      const im = new Image();
      im.src = 'data:image/png;base64,' + (await window.plateBytes(i));
      await im.decode();
      const s = Math.min(CELL / im.naturalWidth, CELL / im.naturalHeight);
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      c.drawImage(im, x + (CELL - w) / 2, y + (CELL - h) / 2, w, h);
      c.fillStyle = '#93a0b8'; c.font = '17px system-ui, sans-serif';
      c.fillText(items[i].label, x + 2, y + CELL + 21);
    }
    return cv.toDataURL('image/png');
  }, { items: items.map(it => ({ label: it.label })), cols, title, cellBg });

  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out + '  ' + items.length + ' plates  ' + (fs.statSync(out).size / 1e6).toFixed(2) + ' MB');
  await browser.close();
})();
