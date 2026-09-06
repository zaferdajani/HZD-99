// Contact sheet of the fired guardian motion plates, for the owner to look at.
//
// Five guardians, two plates each: the TRAVEL pose (how it moves across the
// arena) and the WIND-UP (the frame that warns you the hit is coming). Laid
// out one guardian per row so the pair reads as a pair — the whole point of
// the set is that the two silhouettes must differ enough to be told apart at
// speed, and that is only judgeable side by side.
//
// Dark ground on purpose: the plates are matted to transparency and every one
// of these guardians is lit from within, so on white they read as smoke.
//
//   node tools/bosssheet.cjs <out.png>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROWS = [
  ['NULLFANG',  'the first guardian',   'nullfang_walk.png',    'nullfang_coil.png'],
  ['GLACIERE',  'the ice guardian',     'glaciere_travel.png',  'glaciere_coil.png'],
  ['THE CHOIR', 'the furnace guardian', 'choir_drift.png',      'choir_clench.png'],
  ['TALONHOST', 'the eagle guardian',   'talonhost_glide.png',  'talonhost_strike.png'],
  ['PRISM',     'the light guardian',   'prism_stalk.png',      'prism_coil.png'],
];

(async () => {
  const out = process.argv[2] || 'bosses.png';
  const dir = path.join(__dirname, '..', 'assets', 'characters', 'guardians');
  const load = f => fs.readFileSync(path.join(dir, f)).toString('base64');
  const rows = ROWS.map(r => ({ name: r[0], sub: r[1], a: load(r[2]), b: load(r[3]) }));

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const url = await page.evaluate(async (rows) => {
    const CELL = 460, LABEL = 300, PAD = 26, HEAD = 92;
    const W = LABEL + CELL * 2 + PAD * 4;
    const H = HEAD + rows.length * (CELL + PAD) + PAD;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');

    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0e1119'); g.addColorStop(1, '#070a10');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    c.fillStyle = '#e8edf6';
    c.font = '600 34px system-ui, sans-serif';
    c.fillText('THE GUARDIANS — new artwork', PAD, 46);
    c.fillStyle = '#7f8ba3';
    c.font = '20px system-ui, sans-serif';
    c.fillText('left: how it moves     right: the wind-up that warns you', PAD, 76);

    const fit = async (b64, x, y) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const s = Math.min(CELL / im.naturalWidth, CELL / im.naturalHeight);
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      c.drawImage(im, x + (CELL - w) / 2, y + (CELL - h) / 2, w, h);
    };

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i], y = HEAD + i * (CELL + PAD);
      c.fillStyle = 'rgba(255,255,255,0.03)';
      c.fillRect(PAD, y, W - PAD * 2, CELL);
      c.fillStyle = '#e8edf6';
      c.font = '600 30px system-ui, sans-serif';
      c.fillText(r.name, PAD + 18, y + CELL / 2 - 6);
      c.fillStyle = '#7f8ba3';
      c.font = '19px system-ui, sans-serif';
      c.fillText(r.sub, PAD + 18, y + CELL / 2 + 22);
      await fit(r.a, LABEL + PAD, y);
      await fit(r.b, LABEL + PAD * 2 + CELL, y);
    }
    return cv.toDataURL('image/png');
  }, rows);

  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out + '  ' + (fs.statSync(out).size / 1e6).toFixed(2) + ' MB');
  await browser.close();
})();
