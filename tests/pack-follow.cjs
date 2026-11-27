// HER WOLF COMES WITH HER (owner, 2026-11-27: "it should move with the screens
// when I go from one screen to another, which also is not. Not all the time,
// at least").
//
// loadRoom used to drop the called wolf at every door. This drives the real
// build through every kind of crossing the game has and fails if a called
// wolf that still has time left is left behind:
//   A  SIDE    walking off a room's side edge (the slide crossing)
//   B  DOWN    dropping down a vertical shaft into the room below (the seam):
//              it comes once her feet are down
//   C  UP      jumping up a shaft into the room above
//   D  RING    walking through a ring gate (the gate walk)
//   E  ALPHA   the called Alpha (packLv 3) crosses the same way
//   F  TIME    it keeps the seconds it had left — not a fresh stay
//   G  BESIDE  it arrives beside her (within a few strides), standing on
//              ground, never in rock, and no second howl is heard
//   H  NOT A CROSSING  a respawn at the bench brings no wolf; a wolf already
//              loping off is not brought; a fresh call is a fresh stay
//
//   node tests/pack-follow.cjs     (the repo served on :8220, or TEST_PORT)
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); });
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function' && typeof packCall === 'function', { timeout: 30000 });
    console.log('── pack-follow — her called wolf crosses every kind of room change with her');

    const R = await page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      let s = 0x2468ace1; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      const fresh = (lv) => {
        const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
        Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1, alpha: 1, ratchetRepaired: 1 });
        for (const b of ['Glitch', 'Brood', 'Atlas', 'Zero', 'Prism', 'Mother', 'Alpha', 'Chime', 'Carrier', 'Moth', 'Lattice', 'Lens', 'Mirejaw', 'Horn']) sv.flags['boss' + b] = 1;
        sv.flags.vaultOpen = 1; sv.flags.ferryPaid = 1;
        sv.panels = { v: 1, seen: {}, past: {}, n: 0, k: {} };
        if (typeof PANEL_SEQ !== 'undefined') for (const sq of PANEL_SEQ) { sv.panels.past[sq.id] = 1; sv.panels.k[sq.id] = 1; }
        sv.comics = {}; for (const ch of ((window.COMIC_MANIFEST || {}).chapters || [])) sv.comics[ch.id] = { offered: true, revision: ch.revision };
        sv.arms = ['pack']; sv.armIdx = 1; sv.packLv = lv || 1;
        startGame(sv);
      };
      const heard = [];
      const sfx0 = sfx; sfx = (n) => { heard.push(n); };
      const quiet = () => { G.state = 'PLAY'; G.dialog = G.cut = G.wake = G.meet = G.bossEntry = null; G.toasts = []; if (typeof overlayClear === 'function') try { overlayClear(); } catch (e) {} };
      const room = (id) => { loadRoom(id); quiet(); G.enemies = []; G.boss = null; G.projs = []; G.packWolf = null; G.packCarry = null; };
      const stand = (x) => { player.x = x - player.w / 2; const g = groundColumnAt(x); if (g) player.y = Math.min(g[0], g[1]) - player.h; player.vx = player.vy = 0; player.on = true; };
      const step = (n, each) => { for (let i = 0; i < n; i++) { player.iT = 99; G.enemies = []; update(1 / 60); if (G.state !== 'PLAY' && !G.gateWalk) quiet(); if (each && each(i)) return i; } return n; };
      const inRock = (w) => { for (let y = w.y + 3; y < w.y + w.h - 2; y += 6) for (const x of [w.x + 3, w.x + w.w - 3]) if (solidAt(Math.floor(x / TILE), Math.floor(y / TILE))) return true; return false; };
      const look = (tag, from, t0, n0) => {
        const w = G.packWolf, p = player;
        const r = { tag, from, to: G.roomId, crossed: G.roomId !== from, wolf: !!w };
        if (!w) return r;
        r.alpha = !!w.alpha; r.t = +w.t.toFixed(2); r.t0 = +t0.toFixed(2);
        r.dist = Math.round(Math.abs(w.x + w.w / 2 - (p.x + p.w / 2)));
        r.dy = Math.round(Math.abs(w.y + w.h - (p.y + p.h)));
        r.rock = inRock(w); r.howls = heard.slice(n0).filter(h => /howl/.test(h)).length;
        r.carried = w.carried | 0;
        return r;
      };
      const call = () => { player.armCD = 0; player.volts = 200; G.packWolf = null; G.packCarry = null; packCall(player); step(20); return G.packWolf; };
      // a room whose right side is an ordinary open crossing to another room
      const sideRooms = Object.keys(ROOMS).filter(id => { const ex = ROOMS[id].exits || {}; return typeof ex.R === 'string' && ROOMS[ex.R] && /^[ABC]\d$/.test(id); });
      const out = { side: [], down: [], up: [], ring: [], alpha: [], misc: {} };
      // ---- A. SIDE -----------------------------------------------------------
      const sideOnce = (id, lv, tag) => {
        fresh(lv); room(id);
        const W = G.roomDef.w * TILE;
        stand(W - 90); player.face = 1;
        const w = call(); if (!w) return { tag, from: id, err: 'no call' };
        w.x = player.x - 120; w.t = 7.3; const t0 = w.t, n0 = heard.length;
        keys.ArrowRight = 1;
        let crossedAt = -1;
        step(240, (i) => { if (G.roomId !== id && crossedAt < 0) crossedAt = i; return crossedAt >= 0 && i > crossedAt + 30; });
        keys.ArrowRight = 0;
        return look(tag, id, t0, n0);
      };
      for (const id of sideRooms.slice(0, 4)) out.side.push(sideOnce(id, 1, 'side'));
      // ---- B/C. DOWN and UP a shaft ------------------------------------------
      const pairs = [];
      for (const id of Object.keys(ROOMS)) { const ex = ROOMS[id].exits || {}; let dn = ex.B; if (dn && typeof dn === 'object') dn = dn.to; if (typeof dn === 'string' && ROOMS[dn]) pairs.push([id, dn]); }
      for (const [hi, lo] of pairs.slice(0, 12)) {
        if (out.down.filter(r => r.crossed).length >= 3) break;
        fresh(1); room(hi);
        if (!G.vlink || !G.vlink.B || !vlinkSeamless('B')) continue;
        const L = G.vlink.B, H = G.roomDef.h * TILE, gl = buildRoom(lo), cols = [];
        if (gl.tGap) for (let x = gl.tGap[0]; x <= gl.tGap[1]; x++) cols.push(x);
        else for (let x = 1; x < ROOMS[lo].w - 1; x++) if (gl[0][x] === '.' && gl[1] && gl[1][x] === '.') cols.push(x);
        if (!cols.length) continue;
        const cx = cols[Math.floor(cols.length / 2)];
        // her wolf, at her heel on the floor above, with seven seconds left
        const w = call(); if (!w) continue;
        player.x = cx * TILE + (TILE - player.w) / 2 + L.ox; player.y = H - 3 * TILE; player.vx = 0; player.vy = 300; player.on = false;
        w.t = 7.3; const t0 = w.t, n0 = heard.length;
        let crossedAt = -1, landed = -1;
        step(360, (i) => { if (G.roomId !== hi && crossedAt < 0) crossedAt = i; if (crossedAt >= 0 && player.on && landed < 0) landed = i; return landed >= 0 && i > landed + 20; });
        const r = look('down', hi, t0, n0); r.fall = crossedAt >= 0 && landed >= 0 ? +((landed - crossedAt) / 60).toFixed(2) : null;
        out.down.push(r);
      }
      // up: the way up a shaft, jumped the way tests/vlink.cjs plays it (held, steered onto the ledge)
      for (const [id, def] of Object.entries(ROOMS)) {
        if (out.up.filter(r => r.crossed).length >= 2) break;
        let up = (def.exits || {}).T; if (up && typeof up === 'object') up = up.to;
        if (!ROOMS[up] || !/^[ABC]/.test(id)) continue;
        fresh(1);
        const U = buildRoom(up);
        for (let ty = U.length - 3; ty < U.length; ty++) for (let tx = 0; tx < U[0].length; tx++)
          if (U[ty][tx] === 'B' || U[ty][tx] === 'v') G.save.broken[up + ':' + tx + ',' + ty] = 1;
        room(id);
        const g = G.grid, cols = [];
        if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) cols.push(x);
        else for (let x = 1; x < def.w - 1; x++) if (g[0][x] === '.' && g[1][x] === '.') cols.push(x);
        if (!cols.length) continue;
        const cx = cols[Math.floor(cols.length / 2)];
        stand(cx * TILE + TILE / 2 + 140);
        const w = call(); if (!w) continue;
        for (const k in keys) keys[k] = 0;
        player.x = cx * TILE + (TILE - player.w) / 2; player.y = TILE + 2; player.vx = 0; player.vy = -760; player.on = false; G.climb = null;
        keys[KEYB.JUMP[0]] = 1;
        w.t = 7.3; const t0 = w.t, n0 = heard.length;
        let arrived = false, landed = -1, dir = 1, tx = null;
        step(360, (i) => {
          if (G.roomId === up && !arrived) { arrived = true; const led = topLedge(up, player.x, player.y, 1, true); dir = led ? (Math.sign(led.x1 - led.x0) || 1) : 1; tx = led ? led.x1 : null; }
          if (arrived && G.roomId === up && landed < 0) {
            const go = tx == null || (dir > 0 ? player.x < tx - 4 : player.x > tx + 4);
            keys[KEYB.LEFT[0]] = go && dir < 0 ? 1 : 0; keys[KEYB.RIGHT[0]] = go && dir > 0 ? 1 : 0;
            if (player.on && !G.climb) { landed = i; for (const k in keys) keys[k] = 0; }
          }
          return landed >= 0 && i > landed + 20;
        });
        for (const k in keys) keys[k] = 0;
        if (G.roomId === up) out.up.push(look('up', id, t0, n0));
      }
      // ---- D. A RING GATE ----------------------------------------------------
      const ringRooms = ['A1', 'A2', 'A3', 'A4', 'A6', 'A0', 'B1', 'B2', 'C1', 'CV1', 'CV2', 'A8', 'A9'];
      for (const id of ringRooms) {
        if (out.ring.filter(r => r.crossed).length >= 2) break;
        if (!ROOMS[id]) continue;
        fresh(1); room(id);
        const doors = typeof gateDoors === 'function' ? gateDoors() : [];
        const d = doors.find(q => q && !gateLocked(q) && !ringAsleep(q) && !(typeof rubbleFor === 'function' && rubbleFor(q)) && ROOMS[q.to] && q.style !== 'hatch');
        if (!d) continue;
        stand(gateWorldX(d)); player.face = 1;
        const w = call(); if (!w) continue;
        w.t = 7.3; const t0 = w.t, n0 = heard.length;
        if (!gateEnter()) { out.ring.push({ tag: 'ring', from: id, err: 'gate refused' }); continue; }
        let done = -1;
        step(600, (i) => { if (!G.gateWalk && G.roomId !== id && done < 0) done = i; return done >= 0 && i > done + 20; });
        const r = look('ring', id, t0, n0); r.walk = d.to; out.ring.push(r);
      }
      // ---- E. THE ALPHA ------------------------------------------------------
      out.alpha.push(sideOnce(sideRooms[0], 3, 'alpha side'));
      // ---- H. NOT A CROSSING -------------------------------------------------
      {
        fresh(1); room(sideRooms[0]); stand(400); const w = call();
        G.save.bench = { room: sideRooms[0], x: 300, y: player.y }; respawn(); quiet();
        step(60); out.misc.respawn = !!G.packWolf;
        // loping off when she leaves: it is not brought
        fresh(1); room(sideRooms[0]); const W = G.roomDef.w * TILE; stand(W - 90); player.face = 1;
        const w2 = call(); w2.t = 0; step(2);
        keys.ArrowRight = 1; let ca = -1; step(240, (i) => { if (G.roomId !== sideRooms[0] && ca < 0) ca = i; return ca >= 0 && i > ca + 30; }); keys.ArrowRight = 0;
        out.misc.leaving = !!G.packWolf;
        // a fresh call after a crossing is a full stay
        G.packWolf = null; player.armCD = 0; packCall(player); out.misc.freshT = G.packWolf ? +G.packWolf.t.toFixed(2) : null; out.misc.stay = packStat('stay');
      }
      sfx = sfx0;
      return out;
    });
    const fmt = (r) => r.err ? r.from + ' ' + r.err : r.from + '>' + r.to + (r.wolf ? ' t ' + r.t0 + '->' + r.t + ' dist ' + r.dist + ' dy ' + r.dy + (r.rock ? ' IN ROCK' : '') + (r.howls ? ' howls ' + r.howls : '') : ' NO WOLF');
    const all = [...R.side, ...R.down, ...R.up, ...R.ring, ...R.alpha].filter(r => r.crossed);
    const good = (r) => r.wolf && r.dist <= 220 && r.dy <= 40 && !r.rock && !r.howls && r.t < r.t0 && r.t > r.t0 - 6.5;
    const side = R.side.filter(r => r.crossed), down = R.down.filter(r => r.crossed), up = R.up.filter(r => r.crossed), ring = R.ring.filter(r => r.crossed), alpha = R.alpha.filter(r => r.crossed);
    check('A. off a side edge, every time: the wolf is in the new room with her', side.length >= 3 && side.every(r => r.wolf), side.map(fmt).join(' | '));
    check('B. down a shaft: it comes once her feet are down', down.length >= 1 && down.every(r => r.wolf), down.map(fmt).join(' | '));
    check('C. up a shaft: it comes once she stands on the ledge', up.length >= 1 && up.every(r => r.wolf), up.map(fmt).join(' | ') || JSON.stringify(R.up.slice(0, 3)));
    check('D. through a ring gate', ring.length >= 1 && ring.every(r => r.wolf), ring.map(fmt).join(' | ') || JSON.stringify(R.ring.slice(0, 3)));
    check('E. the called Alpha crosses the same way', alpha.length === 1 && alpha.every(r => r.wolf && r.alpha), alpha.map(fmt).join(' | '));
    check('F. it keeps the seconds it had left (not a fresh stay)', all.every(r => !r.wolf || (r.t < r.t0 && r.t > r.t0 - 6.5)), all.map(r => r.t0 + '->' + r.t).join(' '));
    check('G. it arrives beside her, standing on ground, never in rock, with no second howl', all.every(good), all.filter(r => !good(r)).map(fmt).join(' | ') || all.length + ' crossings');
    check('H. a respawn brings no wolf; a wolf already loping off is not brought; a fresh call is a full stay',
      !R.misc.respawn && !R.misc.leaving && R.misc.freshT === R.misc.stay, JSON.stringify(R.misc));
    check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\npack-follow: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
