// Six rooms of the new land on one sheet, so the terrain can be judged across
// kingdoms rather than one screenshot at a time — the whole point of the
// surface curve is that it behaves the same everywhere.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOMS = [
  ['A0', 'SCRAP MEADOWS'], ['A1', 'SCRAP MEADOWS · deeper'],
  ['B4', 'DATA CONDUITS'],  ['C3', 'THE FOUNDRY'],
  ['D3', 'FROZEN ARCHIVES'],['X1', 'CRYSTAL CACHE'],
];
(async () => {
  const S = process.argv[2], out = process.argv[3];
  const imgs = ROOMS.map(([id, name]) => ({
    name, b64: fs.readFileSync(path.join(S, 'land_' + id + '.png')).toString('base64'),
  }));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const url = await page.evaluate(async (imgs) => {
    const CW = 700, CH = 394, PAD = 14, HEAD = 84;
    const cv = document.createElement('canvas');
    cv.width = CW * 2 + PAD * 3; cv.height = HEAD + (CH + PAD) * 3;
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0e13'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#e8edf6'; c.font = '600 30px system-ui, sans-serif';
    c.fillText('THE NEW LAND', PAD, 40);
    c.fillStyle = '#7f8ba3'; c.font = '17px system-ui, sans-serif';
    c.fillText('one surface curve per room — the collider is unchanged in every one of these', PAD, 66);
    for (let i = 0; i < imgs.length; i++) {
      const cx = PAD + (i % 2) * (CW + PAD), cy = HEAD + Math.floor(i / 2) * (CH + PAD);
      const im = new Image(); im.src = 'data:image/png;base64,' + imgs[i].b64; await im.decode();
      c.drawImage(im, cx, cy, CW, CH);
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(cx, cy, 260, 30);
      c.fillStyle = '#ffd479'; c.font = '600 17px system-ui, sans-serif';
      c.fillText(imgs[i].name, cx + 10, cy + 21);
    }
    return cv.toDataURL('image/png');
  }, imgs);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out);
  await browser.close();
})();
