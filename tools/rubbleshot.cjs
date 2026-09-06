// PHOTOGRAPH THE BURIED MOUTH at every stage of coming down.
//
// The pile is the one structure in the game whose whole job is to LOOK like it
// is losing — a heap that only fades out reads as a switch, not as rock — so
// the states have to be seen side by side. Each frame is the real renderer at
// the real anchor, HP forced, one row of the pile taken away at a time.
//
//   node tools/rubbleshot.cjs <out.png>
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || 'rubble.png';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const res = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom('A5');
    if (!G.rubble) return { err: 'no rubble in A5' };
    const gx = G.rubble.x;
    player.x = gx - 120; player.y = (G.roomDef.h - 3) * TILE;
    // let the room settle and the backdrop plates arrive
    const t0 = Date.now();
    while (Date.now() - t0 < 6000) await new Promise(r => requestAnimationFrame(r));

    const CW = 320, CH = 300, N = 7, ROW = 2;
    const sheet = document.createElement('canvas');
    sheet.width = CW * N; sheet.height = CH * ROW;
    const cc = sheet.getContext('2d');
    const bare = document.createElement('canvas');
    bare.width = CW; bare.height = CH;
    const bc = bare.getContext('2d');
    const c0 = c;
    for (let i = 0; i < N; i++) {
      const hp = Math.max(1, G.rubble ? G.rubble.max - i : 1);
      if (G.rubble) { G.rubble.hp = hp; G.rubble.shake = 0; G.rubble.dust = i === 0 ? 0 : 0.6; }
      if (i === N - 1) G.rubble = null;             // the last panel is the mouth itself
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => requestAnimationFrame(r));
      // ROW 1 — in the room, the room's own light, at the real anchor
      const sx = Math.round(G.rubble ? G.rubble.x - cam.x - CW / 2 : gx - cam.x - CW / 2);
      const sy = Math.round((G.roomDef.h - 2) * TILE - cam.y - CH + 44);
      cc.drawImage(cv, sx, sy, CW, CH, i * CW, 0, CW, CH);
      // ROW 2 — the same pile alone on a flat field: ART_BIBLE §5, look at it
      // LARGE, because a dark object in a dark room hides its own silhouette
      bc.fillStyle = '#5a5f66'; bc.fillRect(0, 0, CW, CH);
      c = bc;
      c.save(); c.translate(0, 0);
      if (G.rubble) drawRubble(G.rubble, CW / 2, CH - 30, PAL[G.roomDef.zone]);
      c.restore();
      c = c0;
      cc.drawImage(bare, i * CW, CH);
      for (let row = 0; row < ROW; row++) {
        cc.fillStyle = '#fff'; cc.font = 'bold 15px monospace';
        cc.fillText(i === N - 1 ? 'OPEN' : 'hp ' + hp, i * CW + 10, row * CH + 22);
        cc.strokeStyle = 'rgba(255,255,255,0.3)';
        cc.strokeRect(i * CW + 0.5, row * CH + 0.5, CW - 1, CH - 1);
      }
    }
    return { url: sheet.toDataURL('image/png') };
  });

  if (res.err) { console.error(res.err); await browser.close(); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log(out, 'written');
  if (errs.length) console.error('page errors:', errs.slice(0, 5));
  await browser.close();
})();
