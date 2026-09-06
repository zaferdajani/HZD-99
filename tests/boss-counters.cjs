// Drive production state machines: the warning must tell the truth about
// where the attack will land, and moving out must actually escape its target.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:8220/index.html');
    await page.waitForFunction(() => typeof startGame === 'function');
    const result = await page.evaluate(() => {
      window.update = () => {};
      const setup = room => {
        const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1;
        startGame(sv); loadRoom(room);
        G.state = 'PLAY'; G.dialog = G.cut = G.wake = G.bossEntry = null;
        G.projs = []; G.enemies = [];
        player.iT = 10;
        const b = G.boss; b.stagT = b.hurtT = 0; b.st = 'idle'; b.t = 1;
        return b;
      };
      const out = [];
      for (const phase of [1, 2]) {
        let b = setup('D3'); b.phase = phase;
        b.st = 'prisonwarn'; b.t = 0.5;
        b.prisonAim = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
        const aim = { ...b.prisonAim };
        // A real run can travel 170px in the warning's 500ms.
        for (let i = 0; i < 31; i++) { player.x += 340 / 60; b.update(1 / 60); }
        out.push({ phase, prison: b.prison && { x: b.prison.x, y: b.prison.y }, aim,
          escaped: b.prison && Math.abs(player.x + player.w / 2 - b.prison.x) > 100 });
        b = setup('D3'); b.phase = phase; b.st = 'dashwarn'; b.t = 0.55;
        player.x = b.x + 200; player.y = b.y + 100;
        for (let i = 0; i < 16; i++) b.update(1 / 60);
        const angle = b.dashAng;
        player.x -= 250; player.y -= 100;
        for (let i = 0; i < 18; i++) b.update(1 / 60);
        out.push({ phase, angle, finalAngle: b.dashAng, launched: b.st === 'dash', face: b.face, vx: b.vx });
        b = setup('X1'); b.phase = phase; b.st = 'lsvanish'; b.t = 0.001;
        b.lsSpots = [{x:200,y:420},{x:500,y:420},{x:800,y:420}]; b.lsReal = 1;
        b.update(1 / 60);
        out.push({ phase, origins: G.projs.map(p => ({x:p.x,y:p.y})) });
      }
      return out;
    });
    for (const r of result) {
      if ('prison' in r) { assert.deepEqual(r.prison, r.aim); assert(r.escaped, 'running escapes the announced cage location'); }
      if ('angle' in r) { assert.equal(r.finalAngle, r.angle, 'dash aim stays committed'); assert(r.launched); assert.equal(r.face, Math.sign(r.vx)); }
      if ('origins' in r) assert.deepEqual(r.origins, [{x:200,y:400},{x:800,y:400}], 'decoys fire from their visible positions');
    }
    assert.deepEqual(errors, []);
    console.log('OK — both phases: cage can be escaped, dash line commits, decoy projectiles match their visible origins');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
