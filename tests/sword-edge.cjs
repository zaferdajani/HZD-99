// A BLADE OUT-REACHES A PAW, AND ITS CHARGED CUT IS ITS OWN.
//
// The owner, 2026-11-15, holding the crystal blade: "Getting the sword means I
// need to have longer attacks, longer reach, a little bit longer. Also, the
// supercharge attack did not change. The attack itself did not change in motion
// and characteristics and VFX. You need to give it a unique perspective."
//
// Measured before: the sword's jab reached 89 px to the claws' 86, and its
// FINISHER 95 to the claws' 100 — the sword was the shorter weapon on the third
// hit. And charged, the single blade fell through to the claws' radial burst:
// same rings, same 165 px round her.
//
//   A  reach: the single blade's far edge is at least a quarter past the claws'
//      on the jab and a sixth past on the (rising) finisher; the joined blade is
//      past the single;
//   B  the picture admits it: the blade's drawn cut is scaled out with it;
//   C  charged with REAL input (hold ATTACK, let go) the single blade throws
//      THE CRESCENT: it runs more than twice the burst's radius, cuts each
//      thing in its line once, and touches nothing behind her;
//   D  ...it is stopped by a wall;
//   E  the claws' charge is still the burst: round her, and it does reach behind.
//
//   node tests/sword-edge.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── sword-edge — a blade out-reaches a paw, and its charged cut is its own');
    const page = await (await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const stage = (mode, x) => { const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1, nfMeet: 1, heal: 1, burstDone: 1, crystal: 1, crystal2: 1, connector: 1 }); sv.weaponMode = mode; startGame(sv);
        loadRoom('A2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.enemies = [];
        player.x = (x == null ? 28 : x) * TILE; const g = groundColumnAt(player.x + 12); player.y = Math.min.apply(null, g) - player.h; player.face = 1;
        for (let i = 0; i < 60; i++) { player.iT = 9; update(1 / 60); G.panels = null; G.state = 'PLAY'; G.dialog = null; } for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0; };
      const out = { reach: {}, fx: {} };
      // ---- A: the far edge of each swing ----
      for (const mode of ['claws', 'single', 'joined']) for (const combo of [0, 2]) {
        stage(mode); let far = 0;
        for (let n = 0; n <= combo; n++) { keysP.KeyX = 1; keys.KeyX = 1;
          for (let i = 0; i < 40; i++) { update(1 / 60); G.hitStop = 0; keysP.KeyX = 0; keys.KeyX = 0; if (player.swing && player.swing.combo === n) { if (n === combo) { const b = player.hitbox(); far = b.x + b.w - (player.x + player.w / 2); } break; } }
          if (n < combo) for (let i = 0; i < 9; i++) { update(1 / 60); G.hitStop = 0; } }
        out.reach[mode + combo] = Math.round(far); }
      out.fx = { single: HERO_WEAPON_SWINGS.single.map(s => s.fxK), joined: HERO_WEAPON_SWINGS.joined.map(s => s.fxK), claws: (typeof SWING_STRIP !== 'undefined' && SWING_STRIP.jab ? SWING_STRIP.jab.fxK : undefined) };
      // ---- C, E: the charged cut, by real input ----
      const charged = (mode, wallAt) => { stage(mode, wallAt ? null : 28); player.volts = 100;
        const mk = (dx) => { const e = new Enemy('crawler', player.x + dx, player.y + player.h - 26); G.enemies.push(e); return e; };
        const ahead = [mk(120), mk(230), mk(330)], behind = mk(-110), all = ahead.concat([behind]), hp0 = all.map(e => e.hp), hits = all.map(() => 0);
        let wallX = null;
        if (wallAt) { const tx = Math.floor((player.x + wallAt) / TILE); for (let ty = 0; ty < G.grid.length; ty++) { const row = G.grid[ty]; if (typeof row === 'string') G.grid[ty] = row.slice(0, tx) + '#' + row.slice(tx + 1); else row[tx] = '#'; } wallX = tx * TILE; G.enemies = []; }
        keysP.KeyX = 1; keys.KeyX = 1; update(1 / 60); keysP.KeyX = 0;
        for (let i = 0; i < 120 && player.chargeT < 0.62; i++) { player.iT = 9; update(1 / 60); G.hitStop = 0; for (const e of G.enemies) { e.vx = 0; e.x = e._x == null ? (e._x = e.x) : e._x; } }
        const x0 = player.x + player.w / 2; keys.KeyX = 0;
        let far = 0, frames = 0, seen = 0; const prev = all.map(e => e.hp);
        for (let i = 0; i < 50; i++) { player.iT = 9; update(1 / 60); G.hitStop = 0; const L = G.crescents || []; if (L.length) { seen++; far = Math.max(far, (L[0].x - x0) * L[0].dir); frames++; }
          all.forEach((e, k) => { if (e.hp < prev[k]) { hits[k]++; prev[k] = e.hp; } }); }
        return { seen, far: Math.round(far), ahead: ahead.map((e, k) => +(hp0[k] - Math.max(0, e.hp)).toFixed(0)), behind: +(hp0[3] - Math.max(0, behind.hp)).toFixed(0), hits, wallX: wallX == null ? null : Math.round(wallX - x0), rings: (G.rings || []).length }; };
      out.single = charged('single');
      out.wall = charged('single', 170);
      out.claws = charged('claws');
      out.burstR = 165; out.table = { reach: CRESCENT.reach, h: CRESCENT.h, sword: SWORD_REACH };
      return out;
    });
    const r = R.reach;
    check('A  the single blade\'s jab reaches at least a quarter past the claws\'', r.single0 >= r.claws0 * 1.25, 'claws ' + r.claws0 + ' px, single ' + r.single0 + ' px (it was 86 to 89)');
    check('A  ...and its finisher (a rising cut, so its level reach is less than its length) is a sixth past theirs — no longer the SHORTER one', r.single2 >= r.claws2 * 1.17, 'claws ' + r.claws2 + ' px, single ' + r.single2 + ' px (it was 100 to 95)');
    check('A  the joined blade is past the single, jab and finisher', r.joined0 > r.single0 + 6 && r.joined2 > r.single2 + 6, 'joined ' + r.joined0 + ' / ' + r.joined2 + ' px');
    check('B  the picture admits it: every sword swing\'s drawn cut is scaled out with its reach', R.fx.single.every(k => k > 1.2) && R.fx.joined.every(k => k > 1.2), 'single x' + R.fx.single.join('/') + ', joined x' + R.fx.joined.join('/'));
    const S = R.single;
    check('C  held and let go, the single blade throws the crescent', S.seen >= 8, S.seen + ' frames of it in the air');
    check('C  ...which runs more than twice the burst\'s radius', S.far >= R.burstR * 2, S.far + ' px against the burst\'s ' + R.burstR);
    check('C  ...cuts everything in its line, each thing once', S.ahead.every(d => d > 0) && S.hits.slice(0, 3).every(n => n === 1), 'damage ' + S.ahead.join(' / ') + ', hits ' + S.hits.slice(0, 3).join(' / '));
    check('C  ...and touches nothing behind her', S.behind === 0, 'the one at her back lost ' + S.behind);
    check('D  it is stopped by a wall', R.wall.seen > 0 && R.wall.far <= R.wall.wallX + 34, 'wall ' + R.wall.wallX + ' px out, the crescent got to ' + R.wall.far);
    const C = R.claws;
    check('E  the claws\' charge is still the burst: no crescent, and it reaches behind her', C.seen === 0 && C.behind > 0 && C.ahead[0] > 0 && C.ahead[2] === 0, 'behind ' + C.behind + ', ahead ' + C.ahead.join(' / ') + ' (the far one, 330 px out, is past it)');
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nsword-edge: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
