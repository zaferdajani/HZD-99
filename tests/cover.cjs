// STANDING ON A PLATFORM IS COVER.
//
// The projectile terrain test reused solidAt, which is correctly honest about
// '=' being a one-way platform a body can jump up through. A shot is not a
// body: every round fired from under a gantry went straight up through the
// floor and hit whoever was standing on it, which was reported as exactly what
// it is — unfair. This checks the two halves of the fix:
//
//   1. '=' stops a shot, from either side.
//   2. The test is SWEPT. A fast round covers more than a tile in one step, and
//      a point sample taken only at the end of the step walks it clean through
//      a one-tile floor without ever having been inside it.
//
//   node tests/cover.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); });
  await page.waitForTimeout(600);

  const res = await page.evaluate(() => {
    // find a '=' platform run in the live room and put her on top of it
    const W = G.roomDef.w, H = G.roomDef.h;
    let plat = null;
    for (let ty = 0; ty < H && !plat; ty++)
      for (let tx = 1; tx < W - 1; tx++)
        if (tileAt(tx, ty) === '=' && tileAt(tx, ty + 1) !== '=' && tileAt(tx, ty + 1) !== '#') { plat = { tx: tx, ty: ty }; break; }
    if (!plat) return { err: 'no one-way platform in this room' };

    const cx = plat.tx * TILE + TILE / 2;
    const top = plat.ty * TILE;
    const shoot = (fromBelow, speed) => {
      G.projs.length = 0;
      player.x = cx - player.w / 2; player.y = top - player.h; player.vx = 0; player.vy = 0;
      player.iT = 0; player.cores = 5;
      const startY = fromBelow ? top + TILE * 2.5 : top - TILE * 3;
      const vy = fromBelow ? -speed : speed;
      const p = new Proj(cx, startY, 0, vy, false, 5, 4, '#f00', 0, 3);
      G.projs.push(p);
      // step the projectile exactly as the loop does, at the slowest sane rate
      for (let i = 0; i < 30 && !p.dead; i++) p.update(1 / 30);
      return { dead: p.dead, y: Math.round(p.y), passed: fromBelow ? p.y < top - 4 : p.y > top + 4 };
    };

    return {
      plat: plat, top: top,
      up_slow: shoot(true, 300),
      up_fast: shoot(true, 1400),     // > one tile per step: only a sweep catches it
      down_slow: shoot(false, 300),
      down_fast: shoot(false, 1400),
    };
  });

  if (res.err) { console.log('  ' + res.err); await browser.close(); process.exit(1); }
  const fails = [];
  console.log('── cover  — a one-way platform stops a shot from either side, at any speed');
  console.log('   platform at tile ' + res.plat.tx + ',' + res.plat.ty + ' (top y=' + res.top + ')');
  for (const k of ['up_slow', 'up_fast', 'down_slow', 'down_fast']) {
    const r = res[k];
    const ok = r.dead && !r.passed;
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + k.padEnd(10) + ' stopped=' + r.dead + '  passed through=' + r.passed + '  y=' + r.y);
    if (!ok) fails.push(k);
  }
  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the floor she is standing on is cover');
})().catch(e => { console.error(e); process.exit(1); });
