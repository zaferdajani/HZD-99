// The rig has to travel, spark while it travels, shower when it hits the box,
// hurt on contact, and never make a room impossible to cross.
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    const out = {};
    for (const room of ['C2', 'D2', 'E2']) {
      loadRoom(room);
      player.x = 6 * 24; player.y = 13 * 24; player.vx = 0; player.vy = 0;
      const n = G.saws.length;
      const sw = G.saws.find(z => z instanceof SawRig);
      let sparkFrames = 0, maxParts = 0, hits = 0, minSp = 1e9, maxSp = 0;
      const seen = new Set();
      player.x = -9999;                     // out of the way: measure the rig alone
      for (let i = 0; i < 400; i++) {
        const before = parts.length;
        for (const s2 of G.saws) s2.update(1 / 60);
        updateParts(1 / 60);
        if (parts.length > before) sparkFrames++;
        maxParts = Math.max(maxParts, parts.length);
        if (sw.hitT > 0.2) hits++;
        minSp = Math.min(minSp, sw.sp); maxSp = Math.max(maxSp, sw.sp);
        seen.add(Math.round(sw.x));
      }
      out[room] = { inList: n, isRig: !!sw, sparkFrames: Math.round(sparkFrames / 4) + '%', peakParticles: maxParts,
                    endImpacts: hits, speed: Math.round(minSp) + '-' + Math.round(maxSp) + ' px/s',
                    travelPx: Math.max(...seen) - Math.min(...seen) };
    }
    // contact damage
    loadRoom('C2');
    const sw = G.saws.find(z => z instanceof SawRig);
    const hp0 = player.cores;
    player.x = sw.x - player.w / 2; player.y = sw.y - player.h / 2; player.iT = 0;
    sw.update(1 / 60);
    out.contact = { coresBefore: hp0, coresAfter: player.cores, hurt: player.cores < hp0 || player.iT > 0 };
    return out;
  });
  for (const k in r) console.log(k.padEnd(9), JSON.stringify(r[k]));
  await p.evaluate(async () => { loadRoom('C2'); player.x = 41 * 24; player.y = 13 * 24; cam.x = 34 * 24; cam.y = 0; });
  await p.waitForTimeout(700);
  await p.screenshot({ path: OUT + 'saw.png' });
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
