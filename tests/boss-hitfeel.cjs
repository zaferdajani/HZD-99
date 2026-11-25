// A BLOW FEELS LIKE A BLOW ON EVERY BOSS, AND FROM EVERY BOSS (owner,
// 2026-11-15: "apply the same solid turn and hit feel to all bosses").
//
// The lion got its hit feel first — the step back, the clash, the double
// flash, the scrap; and for her the freeze, the flash and the throw — and each
// of those was written as a general rule. This measures whether the rule
// actually reaches all thirteen fights, because when it was first measured it
// did not: no flier ever stepped, and GRAVEHORN did not step in his own two
// longest openings.
//
// Each fight is run on seeded dice against a player who cannot be hurt, and
// every 40 simulated frames a claw-sized blow is dealt:
//
//   A. in any state the boss is OPEN in (js/boss-motion.js) the blow starts a
//      step, and the step really moves the body away from her;
//   B. in a wind-up or a strike it never does;
//   C. every blow, in every state, rings, flashes and throws scrap;
//   D. and each boss's own blow on HER stops the world, lights her and throws
//      her clear — with no key held.
//
//   node tests/boss-hitfeel.cjs
const { chromium } = require('playwright');
const FIGHTS = [['A4', 'glitch'], ['A10', 'alpha'], ['B4', 'brood'], ['X1', 'prism'], ['C3', 'atlas'], ['D3', 'zero'], ['E3', 'mother'],
  ['CV3', 'horn'], ['A9', 'chime'], ['B8', 'carrier'], ['C7', 'moth'], ['D6', 'lattice'], ['E6', 'lens']];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    console.log('── boss-hitfeel — all thirteen bosses: the step, the clash, the flash, the scrap, and her being thrown');
    for (const [id, kind] of FIGHTS) {
      const R = await page.evaluate(async ([id]) => {
        window.requestAnimationFrame = () => 0;
        let s = 0x51f0c0de; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
        const stage = () => {
          const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; sv.flags.nfMeet = 1; sv.flags.ghMet = 1; if (id === 'B4') Object.assign(sv.flags, { crystal: 1, crystal2: 1, connector: 1 });   // (TALONHOST is home once the throw is hers)
          startGame(sv); loadRoom(id);
          G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.ghHold = null; G.toasts = [];
          const b = G.boss; b.meet = null; if (b.st === 'dorm' || b.st === 'intro') { b.st = 'idle'; b.t = 0.5; }
          if (b.kind === 'horn' && typeof ghInit === 'function' && !b.missiles) ghInit(b);
          b.dark = 0; b.fade = 0; return b;
        };
        const b = stage();
        const heard = []; const sfxWas = sfx; sfx = (n) => { heard.push(n); };
        const open = {}, shut = {}; let blows = 0, rang = 0, flashed = 0, scrapped = 0, noFeel = [];
        for (let f = 0; f < 60 * 45; f++) {
          player.iT = 9; player.cores = 5; b.hp = Math.max(b.hp, b.hpMax * 0.7);
          // she stands beside it, changing sides every five seconds — and always INSIDE the room:
          // against the room's edge the only side there is to stand on is the other one
          let side = (Math.floor(f / 300) % 2) ? 1 : -1;
          { const want = b.cx() + side * (b.w / 2 + 40); if (want < 24 || want > G.roomDef.w * TILE - 24) side = -side; }
          player.x = b.cx() + side * (b.w / 2 + 40) - player.w / 2; player.vx = 0;
          update(1 / 60); for (const k in keysP) keysP[k] = 0; cam.shake = 0; G.hitStop = 0;
          if (f % 40 !== 20 || b.dead) continue;
          // (where she IS when the blow lands, after the frame: a flier's body can be carried past the
          // spot she was put — 'away from her' is away from her, not from where she was placed)
          side = Math.sign(player.x + player.w / 2 - b.cx()) || side;
          const st = String(b.st), hp0 = b.hp, n0 = heard.length, p0 = parts.length, imp0 = b.impactAt;
          const wasOpen = bossKickable(b);
          G.clashAt = 0; b._kickV = 0;
          dealDmg(b, 12, null, b.cx() - side * 20, b.cy(), true, 'slash');
          if (!(b.hp < hp0)) continue;
          blows++;
          const ring = heard.slice(n0).includes('clash'), flash = b.impactAt !== imp0, scrap = parts.length - p0 >= 6;
          if (ring) rang++; if (flash) flashed++; if (scrap) scrapped++;
          if (!(ring && flash && scrap) && noFeel.length < 3) noFeel.push(st + (ring ? '' : ' -clash') + (flash ? '' : ' -flash') + (scrap ? '' : ' -scrap'));
          const kick = b._kickV || 0;
          const rec = (wasOpen ? open : shut)[st] || ((wasOpen ? open : shut)[st] = { n: 0, kicked: 0, away: 0, moved: 0, walled: 0, best: 0 });
          rec.n++;
          if (kick) { rec.kicked++; if (Math.sign(kick) === -side) rec.away++;
            // the step itself, alone: the recoil's own resolver, without its AI moving it as well
            const x0 = b.x, y0 = b.y; for (let i = 0; i < 14 && b._kickV; i++) bossKickStep(b, 1 / 60);
            const dx = (b.x - x0) * -side; rec.best = Math.max(rec.best, dx);
            if (dx >= 2.5) rec.moved++;
            else {
              // it did not move: by design that is a wall at its back or the edge of what it stands on
              // (bossKickStep), and anything else is a step that was swallowed
              const away = -side, probe = { x: x0, y: y0, w: b.w, h: b.h, vx: away * 240, vy: 0 };
              const col = moveEnt(probe, 1 / 60), edge = x0 + away * 6 < 0 || x0 + b.w + away * 6 > G.roomDef.w * TILE;      // the room's own edge is a wall too
              const wall = edge || !!(col && (col.l || col.r));
              const lead = away > 0 ? x0 + b.w + 4 : x0 - 4, tx = Math.floor(lead / TILE), fr = Math.floor((y0 + b.h + 2) / TILE);
              const g = (ch) => ch === '#' || ch === 'B' || ch === '=';
              const ledge = !bossFlies(b) && !g(tileAt(tx, fr - 1)) && !g(tileAt(tx, fr)) && !g(tileAt(tx, fr + 1)) && !g(tileAt(tx, fr + 2));
              if (wall) { rec.walled++; rec.byWall = (rec.byWall || 0) + 1; } else if (ledge) { rec.walled++; rec.byLedge = (rec.byLedge || 0) + 1; } else { rec.lost = (rec.lost || 0) + 1; rec.lostAt = Math.round(x0) + ',' + Math.round(y0) + ' dx ' + dx.toFixed(1); }
            }
            b.x = x0; b.y = y0; b._kickV = 0; }
        }
        sfx = sfxWas;
        // ---- D. its blow on her -----------------------------------------------------
        const b2 = stage(); b2.update = function () {}; G.enemies = G.enemies.filter(e => e === b2);
        for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
        // on open floor beside it (or under it, for the ones that hang in the air): wherever she can stand
        player.x = b2.cx() - b2.w / 2 - 70; player.vx = player.vy = 0; player.iT = 0; player.cores = 5;
        for (let i = 0; i < 50; i++) { player.iT = 9; update(1 / 60); }
        player.iT = 0; player.knockT = 0; G.hitStop = 0; G.clashAt = 0;
        const heard2 = []; const sw2 = sfx; sfx = (n) => { heard2.push(n); };
        const xHit = player.x, sideHer = Math.sign(player.x + player.w / 2 - b2.cx()) || -1;
        player.hurt(DF().edmg, b2.cx(), b2.kind + '.blow', b2);
        const stop = G.hitStop, flashMs = (player.hitFlashUntil || 0) - (player.hitFlashAt || 0), cores = player.cores;
        let frozen = 0; while (G.hitStop > 0 && frozen < 40) { update(1 / 60); frozen++; }
        const heldStill = Math.abs(player.x - xHit) < 1.5;
        for (let i = 0; i < 26; i++) update(1 / 60);
        sfx = sw2;
        return { kind: b.kind, blows, rang, flashed, scrapped, noFeel, open, shut,
          her: { stop: +stop.toFixed(3), flashMs: Math.round(flashMs), hurt: cores < 5, heldStill, thrown: +((player.x - xHit) * sideHer).toFixed(1), clash: heard2.includes('clash') } };
      }, [id]);
      const O = Object.entries(R.open), S = Object.entries(R.shut);
      const openN = O.reduce((a, [, r]) => a + r.n, 0), unkicked = O.filter(([, r]) => r.kicked < r.n).map(([st, r]) => st + ' ' + r.kicked + '/' + r.n);
      const wrongWay = O.filter(([, r]) => r.away < r.kicked).map(([st]) => st);
      const moved = O.reduce((a, [, r]) => a + r.moved, 0), kicked = O.reduce((a, [, r]) => a + r.kicked, 0), best = Math.max(0, ...O.map(([, r]) => r.best));
      const walled = O.reduce((a, [, r]) => a + r.walled, 0), byWall = O.reduce((a, [, r]) => a + (r.byWall || 0), 0), byLedge = O.reduce((a, [, r]) => a + (r.byLedge || 0), 0), lost = O.filter(([, r]) => r.lost).map(([st, r]) => st + ' ×' + r.lost + ' (at ' + r.lostAt + ')');
      const shutKicked = S.filter(([, r]) => r.kicked > 0).map(([st]) => st);
      console.log('  ── ' + kind + '  (' + R.blows + ' blows; open in: ' + O.map(([st, r]) => st + '×' + r.n).join(' ') + ')');
      check(kind + ': it is caught open often enough to judge', openN >= 8 && R.blows >= 40, openN + ' of ' + R.blows + ' blows');
      check(kind + ': a blow in any opening starts a step, away from her', unkicked.length === 0 && wrongWay.length === 0, unkicked.concat(wrongWay.map(s => s + ' toward her')).join(', ') || kicked + ' steps');
      check(kind + ': ...and the step moves the body, unless a wall or a ledge is behind it', moved >= 3 && best >= 4 && lost.length === 0, moved + ' of ' + kicked + ' moved it (best ' + best.toFixed(1) + ' px), ' + byWall + ' stopped by a wall, ' + byLedge + ' by a ledge' + (lost.length ? '; SWALLOWED: ' + lost.join(', ') : ''));
      check(kind + ': a wind-up or a strike is never moved', shutKicked.length === 0, shutKicked.join(', ') || S.map(([st, r]) => st + '×' + r.n).join(' '));
      check(kind + ': every blow rings, flashes and throws scrap', R.rang === R.blows && R.flashed === R.blows && R.scrapped === R.blows, R.noFeel.join('; ') || R.blows + ' of ' + R.blows);
      const H = R.her;
      check(kind + ': its blow on her stops the world, lights her and rings', H.hurt && H.stop >= 0.12 && H.flashMs >= 200 && H.clash && H.heldStill, JSON.stringify(H));
      check(kind + ': ...and throws her clear of it, no key held', H.thrown >= 40, H.thrown + ' px');
    }
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nboss-hitfeel: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
