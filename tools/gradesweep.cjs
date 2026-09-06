// HOW DARK IS THE BACKGROUND, REALLY — and what do the alternatives look like.
//
// The owner's report, more than once and finally in capitals: "Background is
// toooooo dark and faded", and "can't even see the door artwork". Three
// previous attempts fixed it by raising the SCREEN LIFT, which is why the
// second half of that sentence is "faded" — lifting the black floor of a frame
// whose picture has already been crushed out of it gives you grey, not depth.
//
// So this measures the thing itself. It renders one real room per zone at a
// grid of far-plane grades, reports what each does to the three planes the
// ART_BIBLE laws are written about, and writes a contact sheet so the choice
// is made by LOOKING as well as by the numbers.
//
// The laws are the boundary, not the target:
//   §9.1  background plane <= 25% luminance, and the playable plane clear of it
//   §9.4  background absolute chroma <= 12
//
//   node tools/gradesweep.cjs [room=W2] [out=/tmp/grade.png]   (repo on :8220)
const { chromium } = require('playwright');
const fs = require('fs');

// desat, sit, haze — the three knobs in js/game.js bgPlanePass()
const GRADES = [
  { name: 'shipped', desat: 0.94, sit: 0.42, haze: 0.13 },
  { name: 'b', desat: 0.88, sit: 0.54, haze: 0.13 },
  { name: 'c', desat: 0.80, sit: 0.66, haze: 0.13 },
  { name: 'd', desat: 0.72, sit: 0.78, haze: 0.15 },
  { name: 'e', desat: 0.62, sit: 0.90, haze: 0.15 },
];

(async () => {
  const ROOM = process.argv[2] || 'W2';
  const OUT = process.argv[3] || '/tmp/grade.png';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  await page.evaluate(async (ROOM) => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse'];
    sv.roomId = ROOM;
    G.save = sv; startGame(sv); loadRoom(ROOM);
    await new Promise(r => setTimeout(r, 1800));
    G.toasts = [];
    Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
    Object.defineProperty(G, 'state', { get: () => 'PLAY', set: () => {}, configurable: true });
    // the cast leaves the shot for the same reason grammar.cjs makes it leave:
    // a body standing in front of the wall is not the wall
    G.enemies = []; G.boss = null; G.parts = []; G.impact = null;
    const t0 = performance.now(); performance.now = () => t0;
  }, ROOM);

  const shots = [];
  for (const g of GRADES) {
    const r = await page.evaluate(async (g) => {
      BG_DESAT = g.desat; BG_SIT = g.sit; BG_HAZE = g.haze;
      G.planeProbe = {};
      draw();
      const bg = G.planeProbe.bg, mid = G.planeProbe.mid;
      // ...and the FRAME as the player sees it, screen lift and all
      const cv = document.querySelector('canvas');
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let L = 0, S = 0, n = 0;
      for (let p = 0; p < cv.width * cv.height; p += 7) {
        const j = p << 2, rr = d[j], gg = d[j + 1], bb = d[j + 2];
        L += (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 2.55;
        S += ((Math.max(rr, gg, bb) - Math.min(rr, gg, bb)) / 255) * 100;
        n++;
      }
      return { bg, mid, frame: { lum: L / n, sat: S / n }, png: cv.toDataURL('image/png') };
    }, g);
    shots.push({ g, r });
    const f = (v) => (v == null ? '  —  ' : v.toFixed(1).padStart(5));
    console.log('  ' + g.name.padEnd(8)
      + ' desat ' + g.desat.toFixed(2) + '  sit ' + g.sit.toFixed(2)
      + '   BG lum' + f(r.bg && r.bg.lum) + ' sat' + f(r.bg && r.bg.sat)
      + '   terrain lum' + f(r.mid && r.mid.lum)
      + '   frame lum' + f(r.frame.lum) + ' sat' + f(r.frame.sat)
      + ((r.bg && (r.bg.lum > 25 || r.bg.sat > 12)) ? '   ⚠ OVER THE LAW' : ''));
  }

  // the contact sheet, because numbers do not have a look
  const b64 = shots.map(s => s.r.png.split(',')[1]);
  const sheet = await page.evaluate(async ({ b64, names }) => {
    const W = 480, H = 270;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = (H + 22) * b64.length;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#111'; c2.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < b64.length; i++) {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64[i];
      await im.decode();
      c2.drawImage(im, 0, i * (H + 22) + 22, W, H);
      c2.fillStyle = '#eee'; c2.font = '600 14px system-ui';
      c2.fillText(names[i], 8, i * (H + 22) + 16);
    }
    return cv.toDataURL('image/png');
  }, { b64, names: GRADES.map(g => g.name + '  desat ' + g.desat + '  sit ' + g.sit) });
  fs.writeFileSync(OUT, Buffer.from(sheet.split(',')[1], 'base64'));
  console.log('\n  ' + OUT);
  if (errs.length) console.log('  page errors: ' + errs.slice(0, 2).join(' | '));
  await browser.close();
})();
