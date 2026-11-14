// A CANNON AND A TRAP ARE FIXED TO SOMETHING (owner, 2026-11-14).
//
// "There is a level where I go up, where I find a floating canon that does not
// make any sense. And also the trap with the blade rotating also does not make
// any sense. It's floating in the sky instead of actually being carved into the
// ground as a trap." That was A6: the turret stood nine rows over the drop to
// A1, and one end of the hazard rail — with the wheel that patrols it — hung
// over the other hole. Five more turrets and two more rails did the same.
//
// Measured in the LIVE room, not off the room list: a turret is asked where it
// is after loadRoom has placed it (mountTurret), and a rail is asked what is
// under it in the grid the game is actually standing on.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const r = await p.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.storyVersion = 2; startGame(sv);
    const sol = ch => ch === '#' || ch === '=' || ch === 'B';
    const out = { turrets: [], floatT: [], rails: 0, floatR: [], wheels: 0, floatW: [], rooms: 0 };
    for (const id of Object.keys(ROOMS)) {
      const def = ROOMS[id];
      if (def.boss || (def.ents || []).some(e => e[0] === 'boss')) continue;   // an arena stages itself
      try { loadRoom(id); } catch (e) { out.floatT.push(id + ' failed to load: ' + e.message); continue; }
      out.rooms++;
      for (const e of G.enemies) {
        if (e.kind !== 'turret') continue;
        const tx = Math.floor((e.x + e.w / 2) / TILE), fy = e.y + e.h;
        const under = tileAt(tx, Math.floor((fy + 2) / TILE));
        out.turrets.push(id);
        if (!sol(under)) out.floatT.push(id + ' turret at ' + tx + ',' + (fy / TILE).toFixed(1) + ' over "' + under + '"');
      }
      const g = G.grid;
      for (let ty = 0; ty < g.length; ty++) for (let tx = 0; tx < g[0].length; tx++) {
        if (tileAt(tx, ty) !== '^') continue;
        out.rails++;
        const under = ty + 1 < g.length ? tileAt(tx, ty + 1) : '#';
        if (!sol(under) && under !== '^') out.floatR.push(id + ' ' + tx + ',' + ty);
      }
      for (const s of (G.saws || [])) {
        if (!(s instanceof SawWheel)) continue;
        out.wheels++;
        // both ends of its patrol stand over rock or deck
        for (const x of [s.x0, s.x1]) {
          const tx = Math.floor(x / TILE), ty = Math.round(s.railY / TILE);
          const under = ty + 1 < g.length ? tileAt(tx, ty + 1) : '#';
          if (!sol(under) && under !== '^') out.floatW.push(id + ' wheel end ' + tx + ',' + ty);
        }
      }
    }
    // A6 by name: the cannon is on the east gantry, the trap is a trench in the floor
    loadRoom('A6');
    const t6 = G.enemies.find(e => e.kind === 'turret');
    out.a6 = {
      turret: t6 && [Math.floor((t6.x + t6.w / 2) / TILE), Math.round((t6.y + t6.h) / TILE)],
      trench: [13, 14, 15, 16].map(x => tileAt(x, 19)).join(''),
      bed: [13, 14, 15, 16].map(x => tileAt(x, 20)).join(''),
      overHole: tileAt(11, 18),
    };
    return out;
  });

  check('every turret in the game stands on something (' + r.turrets.length + ' turrets, ' + r.rooms + ' rooms)',
    r.turrets.length >= 10 && r.floatT.length === 0, r.floatT.join(' | '));
  check('every hazard rail has rock or a deck under it (' + r.rails + ' tiles)',
    r.rails > 20 && r.floatR.length === 0, r.floatR.slice(0, 6).join(' | '));
  check('every saw wheel patrols over ground, end to end (' + r.wheels + ' wheels)',
    r.wheels > 0 && r.floatW.length === 0, r.floatW.join(' | '));
  check('A6: the cannon is on the east gantry', !!r.a6.turret && r.a6.turret[0] === 29 && r.a6.turret[1] === 10, JSON.stringify(r.a6.turret));
  check('A6: the blade trap is a trench cut into the floor, with rock under it',
    r.a6.trench === '^^^^' && r.a6.bed === '####', r.a6.trench + ' over ' + r.a6.bed);
  check('A6: nothing hangs over the drop to A1', r.a6.overHole !== '^', r.a6.overHole);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — every cannon is bolted down and every trap is in the ground');
})().catch(e => { console.error(e); process.exit(1); });
