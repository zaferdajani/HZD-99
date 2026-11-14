// SHE CANNOT WALK THROUGH A MACHINE (owner, 2026-11-14: "I shouldn't be able
// to walk through enemies").
//
// Before js/solid.js a hostile body was a damage volume: touch it, be thrown
// back, and for the second of invulnerability afterwards walk straight through
// it. This plays the real loop with real key state and holds the rule and its
// edges:
//
//   A. held against a standing guardian — hurt or invulnerable — she never
//      reaches its far side, from either side, and stops at its DRAWN body
//      rather than 60 px inside it;
//   B. ...and from there her claw still reaches it;
//   C. she can JUMP over it;
//   D. a rank-and-file machine blocks the same way, and stops blocking the
//      moment it is bound (a body lying in a corridor must not seal it);
//   E. a guardian that comes over HER still hits her: the pounce is not
//      turned into a shove;
//   F. pinned between a wall and a body she is let out, not crushed;
//   G. the table the wall is built from matches the art it was measured from;
//   H. the phantom dash phases; an ordinary dash does not.
//
//   node tests/solid-enemies.cjs
const { chromium } = require('playwright');
const { measure } = require('../tools/bodybox.cjs');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  const url = process.env.GAME_URL || 'http://127.0.0.1:8220/index.html';
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    console.log('── solid-enemies — a hostile body is a wall to her feet, and still a fight');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const out = { table: !!(window.BODY_BOX && window.BODY_BOX['boss:glitch'] && window.BODY_BOX.crawler) };
      const lion = () => {
        let s = 0x51f0c0de; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
        const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; sv.flags.nfMeet = 1;
        startGame(sv); loadRoom('A4');
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.zoneToast = null; G.toasts = [];
        const b = G.boss; G.enemies = G.enemies.filter(e => e === b);
        b.st = 'idle'; b.t = 9; b.meet = null; b.face = b.faceVis = -1; b.roarCD = b.ambushCD = 99;
        for (let i = 0; i < 30; i++) { b.st = 'idle'; b.t = 9; update(1 / 60); }
        return b;
      };
      const still = (b, x0) => { b.st = 'idle'; b.t = 9; b.vx = 0; b.x = x0; b.roarCD = b.ambushCD = 99; b.swipeCD = 9; b.turnStreak = 0; };
      const put = (b, side, d) => { player.x = b.cx() + side * d - player.w / 2; player.y = b.y + b.h - player.h; player.vx = player.vy = 0; player.on = true; player.hurtPoseT = 0; player.kbT = 0; };
      const clear = () => { for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0; };
      const pcx = () => player.x + player.w / 2;
      const hold = (b, key, frames, opt) => {
        const x0 = b.x; let far = null, hurts = 0; const hp0 = player.cores;
        for (let f = 0; f < frames; f++) {
          still(b, x0); clear(); keys[key] = 1;
          if (opt && opt.invuln) player.iT = 9; else if (opt && opt.hittable) { player.cores = 5; }
          if (opt && opt.each) opt.each(f);
          const c0 = player.cores; update(1 / 60); if (player.cores < c0) hurts++;
          const d = pcx() - b.cx(); far = far == null ? d : (key === 'ArrowRight' ? Math.max(far, d) : Math.min(far, d));
        }
        clear();
        return { far: +far.toFixed(1), end: +(pcx() - b.cx()).toFixed(1), hurts, y: +(player.y + player.h - (b.y + b.h)).toFixed(1) };
      };

      // ---- A. she never reaches the far side ---------------------------------------
      { const b = lion(); const B = solidBox(b); out.box = { half: +((B.x1 - B.x0) / 2).toFixed(1), top: +(B.y1 - B.y0).toFixed(1), hurtHalf: b.w / 2, hurtH: b.h, art: window.BODY_BOX['boss:glitch'] };
        put(b, -1, 220); out.rightInv = hold(b, 'ArrowRight', 200, { invuln: 1 });
        put(b, 1, 220); out.leftInv = hold(b, 'ArrowLeft', 200, { invuln: 1 });
        put(b, -1, 220); out.rightHit = hold(b, 'ArrowRight', 260, { hittable: 1 });
        put(b, 1, 220); out.leftHit = hold(b, 'ArrowLeft', 260, { hittable: 1 });
        // the control: with the rule off she is through it in the same time
        SOLID.on = false; put(b, -1, 220); out.rightOff = hold(b, 'ArrowRight', 200, { invuln: 1 }); SOLID.on = true;
      }
      // ---- B. from the wall, the claw still lands -------------------------------------
      { const b = lion(); put(b, -1, 220); hold(b, 'ArrowRight', 120, { invuln: 1 });
        const hp0 = b.hp, x0 = b.x; out.reach = { at: +(pcx() - b.cx()).toFixed(1) };
        for (let f = 0; f < 90; f++) { still(b, x0); clear(); player.iT = 9; player.face = 1; if (f % 18 === 0) { keys.KeyX = 1; keysP.KeyX = 1; } update(1 / 60); }
        clear(); out.reach.dealt = +(hp0 - b.hp).toFixed(1);
      }
      // ---- C. over it ---------------------------------------------------------------------
      { const b = lion(); put(b, -1, 240); const x0 = b.x; let crossed = null, top = 0;
        for (let f = 0; f < 240 && crossed == null; f++) {
          still(b, x0); clear(); player.iT = 9; keys.ArrowRight = 1;
          const gap = (b.cx() - pcx());
          if (gap < 150 && gap > 0) { keys.KeyZ = 1; if (player.on) keysP.KeyZ = 1; }
          update(1 / 60);
          top = Math.max(top, (b.y + b.h) - (player.y + player.h));
          if (pcx() - b.cx() > out.box.half + 14 && player.on) crossed = f;
        }
        clear(); out.over = { crossed, top: +top.toFixed(0) };
      }
      // ---- D. the rank and file, and a bound one ------------------------------------
      { const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1;
        startGame(sv); loadRoom('A1');
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.toasts = [];
        const e = G.enemies.find(q => q.kind === 'crawler') || G.enemies[0];
        G.enemies = [e];
        for (let i = 0; i < 40; i++) { e.vx = 0; update(1 / 60); }
        const ex = e.x, ey = e.y;
        const pin = () => { e.x = ex; e.y = ey; e.vx = 0; e.vy = 0; e.stagT = 0.2; };       // held where it stands: the wall is under test, not its AI
        const walk = (frames) => { let far = -1e9; for (let f = 0; f < frames; f++) { pin(); clear(); keys.ArrowRight = 1; player.iT = 9; update(1 / 60); far = Math.max(far, pcx() - (e.x + e.w / 2)); } clear(); return +far.toFixed(1); };
        const start = () => { player.x = e.x - 150; player.y = e.y + e.h - player.h; player.vx = player.vy = 0; player.on = true; for (let i = 0; i < 6; i++) { pin(); player.iT = 9; update(1 / 60); } };
        out.rank = { kind: e.kind, solid: bodySolid(e) };
        start(); out.rank.blocked = walk(150);
        e.disabled = true; out.rank.boundSolid = bodySolid(e);
        start(); out.rank.bound = walk(150);
      }
      // ---- E. it comes over her, and it still hits -----------------------------------
      { const b = lion(); put(b, -1, 150);
        player.cores = 5; player.iT = 0; const c0 = player.cores;
        b.st = 'pounce'; b.face = b.faceVis = -1; b.vx = -520; b.vy = -260; b.t = 0.6; b.lastMove = 'pounce';
        let hurtAt = null;
        for (let f = 0; f < 70 && hurtAt == null; f++) { clear(); update(1 / 60); if (player.cores < c0 || player.hurtPoseT > 0) hurtAt = f; }
        out.slam = { hurtAt, cores: [c0, player.cores] };
      }
      // ---- F. pinned against a wall --------------------------------------------------------
      { const b = lion();
        // the arena's left wall: walk her into it, then stand the lion on top of her
        player.x = 200; player.y = b.y + b.h - player.h;
        for (let f = 0; f < 240; f++) { still(b, b.x); clear(); keys.ArrowLeft = 1; player.iT = 9; update(1 / 60); }
        clear(); const wallX = player.x; const x0 = wallX - (b.w - player.w) / 2;        // its hurt box centred on her
        let inside = 0, inTile = 0;
        for (let f = 0; f < 90; f++) {
          still(b, x0); b.y = player.y + player.h - b.h; clear(); player.iT = 9; update(1 / 60);
          if (f >= 60) { if (player.x + player.w > x0 + 0.5 && player.x < x0 + b.w - 0.5) inside++; if (!solidTileFree(player, player.x)) inTile++; }
        }
        out.pin = { wallX: +wallX.toFixed(1), end: +player.x.toFixed(1), lion: [+x0.toFixed(1), +(x0 + b.w).toFixed(1)], inside, inTile };
      }
      // ---- H. the dash -----------------------------------------------------------------------
      { const dashAt = (phantom) => {
          const b = lion(); G.save.abil = G.save.abil || {}; G.save.abil.dash = 1;
          const hc = hasCrest; if (phantom) hasCrest = (k) => k === 'phantom' || hc(k);
          put(b, -1, 150); const x0 = b.x; let far = -1e9;
          for (let f = 0; f < 60; f++) { still(b, x0); clear(); player.iT = 9; player.face = 1; keys.ArrowRight = 1; if (f === 2) { keys.KeyC = 1; keysP.KeyC = 1; } update(1 / 60); far = Math.max(far, pcx() - b.cx()); }
          clear(); hasCrest = hc; return +far.toFixed(1);
        };
        out.dash = { plain: dashAt(false), phantom: dashAt(true), has: typeof hasMod === 'function' && hasMod('dash') };
      }
      return out;
    });
    const half = R.box.half, edge = -(half + 12);
    check('the table of drawn bodies is compiled into the page', R.table === true);
    check('the lion\'s wall is its body, not its hurt box', half >= R.box.hurtHalf + 30 && half <= R.box.hurtHalf + 46 && R.box.top > R.box.hurtH, 'wall ±' + half + ' × ' + R.box.top + ' px, hurt box ±' + R.box.hurtHalf + ' × ' + R.box.hurtH + ', drawn ' + R.box.art.l + '/' + R.box.art.r + ' × ' + R.box.art.top);
    check('with the rule off she walks straight through it (the control)', R.rightOff.far > half, 'reached ' + R.rightOff.far + ' px past its middle');
    check('invulnerable, held right: she stops at its body', Math.abs(R.rightInv.far - edge) <= 1.5 && R.rightInv.end < 0, 'furthest ' + R.rightInv.far + ' px (wall at ' + edge + ')');
    check('invulnerable, held left: the same from the other side', Math.abs(R.leftInv.far + edge) <= 1.5 && R.leftInv.end > 0, 'furthest ' + R.leftInv.far + ' px');
    check('open to a hit, held right: she never reaches its far side', R.rightHit.far < 0 && R.rightHit.end < 0, 'furthest ' + R.rightHit.far + ' px, ' + R.rightHit.hurts + ' hits taken');
    check('open to a hit, held left: nor from there', R.leftHit.far > 0 && R.leftHit.end > 0, 'furthest ' + R.leftHit.far + ' px, ' + R.leftHit.hurts + ' hits taken');
    check('from the wall her claw still lands', R.reach.dealt > 0, 'standing ' + R.reach.at + ' px from its middle, ' + R.reach.dealt + ' damage');
    check('she can jump over it', R.over.crossed != null, R.over.crossed == null ? 'never crossed (peak ' + R.over.top + ' px)' : 'down on the far side at frame ' + R.over.crossed + ', peak ' + R.over.top + ' px');
    check('a rank-and-file machine is solid', R.rank.solid === true && R.rank.blocked < 0, R.rank.kind + ': furthest ' + R.rank.blocked + ' px from its middle');
    check('...and not once it is bound', R.rank.boundSolid === false && R.rank.bound > 20, 'walked to ' + R.rank.bound + ' px past it');
    check('a pounce that comes down on her still hits her', R.slam.hurtAt != null, R.slam.hurtAt == null ? 'never hurt' : 'hurt at frame ' + R.slam.hurtAt);
    check('pinned against a wall she is let out, not crushed', R.pin.inside === 0 && R.pin.inTile === 0, JSON.stringify(R.pin));
    check('an ordinary dash does not go through', R.dash.has && R.dash.plain < 0, 'furthest ' + R.dash.plain + ' px');
    check('the phantom dash does', R.dash.phantom > 0, 'furthest ' + R.dash.phantom + ' px past its middle');
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
    // ---- G. the table is the art -------------------------------------------------------------
    const M = await measure(url), T = await page.evaluate(() => window.BODY_BOX);
    const off = [];
    for (const k of Object.keys(T)) { const m = M[k]; if (!m) { off.push(k + ': not measured'); continue; }
      const d = Math.max(Math.abs(m.l - T[k].l), Math.abs(m.r - T[k].r), Math.abs(m.top - T[k].top));
      if (d > 16 || m.hurt[0] !== T[k].w || m.hurt[1] !== T[k].h) off.push(k + ': off by ' + d + ' px'); }
    // (16 px: several of these bodies bob, flare and breathe, and the measure catches them mid-motion;
    // a re-scaled or re-authored body moves by far more than that)
    check('every body in the table still measures as its row', Object.keys(T).length >= 20 && off.length === 0, Object.keys(T).length + ' bodies' + (off.length ? '; ' + off.slice(0, 4).join(', ') + ' — run node tools/bodybox.cjs && node build.cjs' : ''));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nsolid-enemies: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
