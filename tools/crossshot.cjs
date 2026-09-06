// PHOTOGRAPH A ROOM CROSSING — the owner's "cubicles of rooms connected".
// Six frames across one walk from A1 into A2, so the join can be looked at
// rather than described.
//   node tools/crossshot.cjs <out.png>
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'cross.png';
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY';
    for (let i = 0; i < 120; i++) await new Promise(k => requestAnimationFrame(k));
    G.enemies = [];
    // walk her off the right edge
    player.x = G.roomDef.w * TILE - 40; player.y = (G.roomDef.h - 4) * TILE;
    const N = 6, W = cv.width, H = cv.height;
    const sheet = document.createElement('canvas');
    sheet.width = W; sheet.height = H * N;
    const sc = sheet.getContext('2d');
    let shot = 0, guard = 0;
    keys['ArrowRight'] = 1;
    while (shot < N && guard++ < 400) {
      await new Promise(k => requestAnimationFrame(k));
      if (G.trans || shot > 0) {
        sc.drawImage(cv, 0, shot * H);
        sc.fillStyle = '#fff'; sc.font = 'bold 15px monospace';
        sc.fillText((G.trans ? 'crossing t=' + G.trans.t.toFixed(2) : 'landed') + '  room ' + G.roomId,
                    10, shot * H + 22);
        shot++;
      }
    }
    keys['ArrowRight'] = 0;
    return { url: sheet.toDataURL('image/png'), room: G.roomId };
  });
  fs.writeFileSync(out, Buffer.from(r.url.split(',')[1], 'base64'));
  console.log(out, 'written, ended in', r.room);
  if (errs.length) console.error('page errors:', errs.slice(0, 3));
  await b.close();
})();
