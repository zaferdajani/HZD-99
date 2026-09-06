// THE LEAP, FRAME BY FRAME. A lion jumping is a MOTION — coil, drive, extend,
// reach, land — and the only way to know whether the game shows one is to lay
// the frames out side by side and look at them.
//
// Each column is one beat of the pounce, driven by putting the boss into that
// state at that point in its timeline and drawing it with its own code.
//
//   node tools/leapshot.cjs <out.png> [scale] [labelFilterRegex]
//
// The filter is there because the coil is four beats out of ten, and reviewing
// a wind-up at 1/10th of a sheet is how the first cut of it shipped with its
// ground arcs under the belly. `node tools/leapshot.cjs coil.png 3 coil` gives
// you the wind-up alone, big enough to see.
const { chromium } = require('playwright');

const BEATS = [
  ['stalk',    { st: 'stalk', t: 1.2, vx: -160, vy: 0 }],
  ['coil 15%', { st: 'crouch', t: 0.85, vx: 0, vy: 0 }],
  ['coil 55%', { st: 'crouch', t: 0.45, vx: 0, vy: 0 }],
  ['FLASH 88%',{ st: 'crouch', t: 0.12, vx: 0, vy: 0 }],
  ['launch',  { st: 'pounce', t: 0, vx: -520, vy: -560 }],
  ['rise',    { st: 'pounce', t: 0, vx: -520, vy: -300 }],
  ['apex',    { st: 'pounce', t: 0, vx: -520, vy: -20 }],
  ['fall',    { st: 'pounce', t: 0, vx: -520, vy: 360 }],
  ['strike',  { st: 'pounce', t: 0, vx: -420, vy: 700 }],
  ['land',    { st: 'recover', t: 0.5, vx: -80, vy: 0 }],
  // the near game — the paw, and what taking a run of hits does to it
  ['claw cock',   { st: 'swipewarn', t: 0.08, vx: 0, vy: 0 }],
  ['claw mid',    { st: 'swipe', t: 0.15, vx: 0, vy: 0 }],
  ['claw follow', { st: 'swipe', t: 0.04, vx: 0, vy: 0 }],
  ['daze open',   { st: 'daze', t: 1.60, vx: 0, vy: 0, dazeDur: 1.7 }],
  ['daze late',   { st: 'daze', t: 0.45, vx: 0, vy: 0, dazeDur: 1.7 }],
];

(async () => {
  const [out, scaleArg, filt] = process.argv.slice(2);
  const scale = parseFloat(scaleArg || '1.15');
  const beats = filt ? BEATS.filter(b => new RegExp(filt, 'i').test(b[0])) : BEATS;
  if (!beats.length) { console.log('no beat matches /' + filt + '/'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 700 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    startGame(sv); loadRoom('A4');
  });
  await page.evaluate(() => new Promise(r => {
    let i = 0; const t = () => { if (++i >= 60) return r(); requestAnimationFrame(t); };
    requestAnimationFrame(t);
  }));

  const url = await page.evaluate(async ({ scale, beats, cols }) => {
    const b = G.boss;
    if (!b) return null;
    const CW = 300, CH = 340;
    const rows = Math.ceil(beats.length / cols);
    const sheet = document.createElement('canvas');
    sheet.width = CW * scale * cols; sheet.height = CH * scale * rows;
    const S = sheet.getContext('2d');
    S.fillStyle = '#5f646c'; S.fillRect(0, 0, sheet.width, sheet.height);

    for (let i = 0; i < beats.length; i++) {
      const [label, set] = beats[i];
      for (const k in set) b[k] = set[k];
      b.face = -1; b.faceVis = -1; b.anim = 1.7; b.hurtT = 0; b.stagT = 0; b.dead = false;
      const cell = document.createElement('canvas');
      cell.width = CW * scale; cell.height = CH * scale;
      const x = cell.getContext('2d');
      x.fillStyle = '#5f646c'; x.fillRect(0, 0, cell.width, cell.height);
      x.setTransform(scale, 0, 0, scale, 0, 0);
      // the boss draws itself from x/y; put its feet on the cell's baseline
      const sx = b.x, sy = b.y;
      b.x = CW / 2 - b.w / 2; b.y = CH * 0.82 - b.h;
      try { drawBeast(x, b); } catch (e) { /* reported below */ }
      b.x = sx; b.y = sy;
      const px = CW * scale * (i % cols), py = CH * scale * Math.floor(i / cols);
      S.drawImage(cell, px, py);
      S.fillStyle = '#0b0d11';
      S.font = '600 15px monospace'; S.textAlign = 'left';
      S.fillText(label, px + 10, py + 22);
      S.strokeStyle = 'rgba(0,0,0,0.25)'; S.lineWidth = 1;
      S.strokeRect(px + 0.5, py + 0.5, CW * scale - 1, CH * scale - 1);
    }
    return sheet.toDataURL('image/png');
  }, { scale, beats, cols: Math.min(5, beats.length) });

  if (!url) { console.log('no boss in A4'); process.exit(1); }
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  if (errs.length) console.log('PAGE ERRORS: ' + errs.slice(0, 3).join(' | '));
  console.log('leap sheet -> ' + out);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
