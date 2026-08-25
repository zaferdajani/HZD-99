// A COMPARISON PLATE — old art beside new, so a style decision is made by eye
// rather than by description. Not part of the build; it exists to answer
// "show me how this would look" with a picture instead of a paragraph.
//
// Usage: node tools/sheetcmp.cjs <out.png> "<label>:<file>" ...
// Files are served from the repo root at :8220 so the browser can load them.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = process.argv[2];
  const cols = process.argv.slice(3).map(s => {
    const i = s.indexOf(':');
    return { label: s.slice(0, i), src: s.slice(i + 1) };
  });
  const CW = 620, CH = 620, PAD = 18, HEAD = 52;
  const W = PAD + cols.length * (CW + PAD), H = HEAD + CH + PAD;

  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('http://127.0.0.1:8220/');
  const buf = await p.evaluate(async ({ cols, CW, CH, PAD, HEAD, W, H }) => {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0d10'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < cols.length; i++) {
      const x = PAD + i * (CW + PAD);
      const im = await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.onerror = () => r(null); m.src = '/' + cols[i].src; });
      c.save();
      c.beginPath(); c.rect(x, HEAD, CW, CH); c.clip();
      c.fillStyle = '#000'; c.fillRect(x, HEAD, CW, CH);
      if (im) {
        const s = Math.min(CW / im.width, CH / im.height);
        const w = im.width * s, h = im.height * s;
        c.drawImage(im, x + (CW - w) / 2, HEAD + (CH - h) / 2, w, h);
      }
      c.restore();
      c.strokeStyle = '#2a3138'; c.lineWidth = 2; c.strokeRect(x + 1, HEAD + 1, CW - 2, CH - 2);
      c.fillStyle = '#cfe3ea';
      c.font = '600 26px system-ui, sans-serif';
      c.textBaseline = 'middle';
      c.fillText(cols[i].label, x + 4, HEAD / 2 + 4);
    }
    const url = cv.toDataURL('image/png');
    return url.slice(url.indexOf(',') + 1);
  }, { cols, CW, CH, PAD, HEAD, W, H });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(buf, 'base64'));
  await b.close();
  console.log(out, fs.statSync(out).size, 'bytes');
})();
