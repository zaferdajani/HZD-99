// Cut named cells out of the hero state sheet, for image-to-image restyle.
//
// Each cell goes out on a FLAT BLACK field, not on transparency. Two reasons:
// a generator handed a transparent PNG invents its own background anyway, and
// she is near-white with a red cape, so black is the field her silhouette can
// actually be keyed back off — the mistake that turned the foreground plates
// into floating blue pips was keying a near-black subject off black.
//
// The cell is also PADDED, because a subject that touches the frame edge comes
// back cropped: that cost four guardian plates.
//
//   node tools/herocut.cjs <sheet.png> <outdir> idle,walk_a,run_a ...
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const STATES = ['idle','walk_a','walk_b','run_a','run_b','rise','apex','fall','land','dash','skid',
  'wall_cling','djump_jet','claw_1','claw_2','finisher','charge','burst','hurt','heal','song','slump'];
(async () => {
  const [sheet, outdir, want] = process.argv.slice(2);
  const names = (want || STATES.join(',')).split(',').map(s => s.trim()).filter(Boolean);
  fs.mkdirSync(outdir, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const b64 = fs.readFileSync(sheet).toString('base64');
  for (const n of names) {
    const idx = STATES.indexOf(n);
    if (idx < 0) { console.log('unknown cell: ' + n); continue; }
    const url = await page.evaluate(async ({ b64, idx }) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const CW = im.naturalWidth / 22, CH = im.naturalHeight;
      const PAD = Math.round(CH * 0.22), S = 4;          // upscale so the model has pixels to work with
      const cv = document.createElement('canvas');
      cv.width = (CW + PAD * 2) * S; cv.height = (CH + PAD * 2) * S;
      const c = cv.getContext('2d');
      c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
      c.imageSmoothingQuality = 'high';
      c.drawImage(im, idx * CW, 0, CW, CH, PAD * S, PAD * S, CW * S, CH * S);
      return cv.toDataURL('image/png');
    }, { b64, idx });
    const out = path.join(outdir, n + '.png');
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log(n + '  ' + (fs.statSync(out).size / 1e3).toFixed(0) + ' KB');
  }
  await browser.close();
})();
