// THE WAY UP ENDS ON A LEDGE, AND A SHAFT IS ONE PLACE.
//
// The owner's rule for every top crossing: rising into the room above, she is
// lifted onto the nearest floor beside the hole in a short arc with the
// controls held — and if the room above has no such floor, the crossing does
// not happen at all. And the plan's continuous vertical rooms: the 24 up/down
// pairs draw each other, collide into each other, and change rooms silently
// when her centre crosses the line, with no held picture and no camera snap.
//
// None of that can be read off the source, so this drives the real build:
//
//   1. THE LEDGE TABLE. Every T exit in the world (24), every column of its
//      opening that her body can actually rise through, asked the same
//      question the game asks (topLedge). A column with no reachable ledge is
//      a failure, named. Hatches are read as cut and the kernel as broken —
//      that is the state the route is designed to be climbed in.
//   2. EVERY WAY UP, PLAYED. Each of the 24, from under its opening with the
//      jump held: she must end standing on a ledge in the room above, never
//      back in the room below, and while the arc runs her controls are held —
//      a held direction does not move her off it.
//   3. EVERY WAY DOWN, PLAYED. Each of the 24 falls: the room changes with no
//      crossing state, no held frame, and where she is on the screen moves by
//      a body's fall, not by a cut.
//   4. NO LEDGE, NO CROSSING. An unbroken hatch above her is a ceiling.
//   5. THE ROOM ABOVE IS DRAWN. With the neighbour baked, the strip of screen
//      above the room is painted by it; without the link it is not.
//
//   node tests/vlink.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── vlink — the way up ends on a ledge, and a shaft is one place\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(() => {
    // the simulation is stepped by hand: the page's own loop would race it
    window.requestAnimationFrame = () => 0;
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.comics = {};
    for (const ch of ((window.COMIC_MANIFEST || {}).chapters || [])) sv.comics[ch.id] = { offered: true, revision: ch.revision };
    // the state the shafts are designed to be climbed in: the kernel sealed
    // over E1 is open once ZERO is down, and every guardian's chamber is
    // walked into as a room rather than staged as an entrance
    for (const b of ['Glitch', 'Brood', 'Atlas', 'Zero', 'Prism', 'Mother', 'Alpha', 'Chime', 'Carrier', 'Moth', 'Lattice', 'Lens']) sv.flags['boss' + b] = 1;
    // ...and carrying the blade: A3's climb to the Conduits is a story gate
    // (NULLFANG down AND the blade forged), and a save that has beaten every
    // guardian has forged it — blade-only taming says so
    sv.flags.crystal = 1;
    startGame(sv);
    const out = { table: [], up: [], down: [], blocked: null };
    const ups = [];
    for (const [id, def] of Object.entries(ROOMS)) {
      let up = (def.exits || {}).T, at = null;
      if (!up) continue;
      if (typeof up === 'object') { at = up.at != null ? up.at : null; up = up.to; }
      if (!ROOMS[up]) continue;
      ups.push([id, up, at]);
    }
    out.count = ups.length;
    // ---- 1. the table --------------------------------------------------------
    for (const [id, up] of ups) {
      const g = buildRoom(id), def = ROOMS[id];
      const cols = [];
      if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) cols.push(x);
      else for (let x = 1; x < def.w - 1; x++) if (g[0][x] === '.') cols.push(x);
      const L = vlinkFor(id).T;
      const U = buildRoom(up);
      const row = { id, up, usable: 0, ok: 0, none: [], rock: [] };
      for (const cx of cols) {
        const x = cx * TILE + (TILE - 24) / 2, y = -18;            // centre just over the line
        const ax = x - L.ox, ay = y - L.oy;
        // can her body rise here at all? (the room above's own cells, hatches cut)
        const a0 = Math.floor(ax / TILE), a1 = Math.floor((ax + 23) / TILE);
        let rock = false;
        for (let ty = Math.floor(ay / TILE); ty < U.length; ty++) for (let tx = a0; tx <= a1; tx++) {
          const ch = U[ty] && U[ty][tx];
          if (ch === '#') rock = true;
        }
        if (rock) { row.rock.push(cx); continue; }
        row.usable++;
        const led = topLedge(up, ax, ay, 1, true);
        if (led) row.ok++; else row.none.push(cx);
      }
      out.table.push(row);
    }
    // ---- 2. every way up, played --------------------------------------------
    const breakHatch = (id) => {
      const U = buildRoom(id);
      for (let ty = U.length - 3; ty < U.length; ty++) for (let tx = 0; tx < U[0].length; tx++)
        if (U[ty][tx] === 'B' || U[ty][tx] === 'v') G.save.broken[id + ':' + tx + ',' + ty] = 1;
    };
    // a room's own story beats (a dialogue, an impact panel) are not the
    // question here; they would freeze the body mid-shaft
    const quiet = () => { if (G.state !== 'PLAY') { G.dialog = null; G.state = 'PLAY'; } G.impact = null; G.meet = null; G.lesson = null; };
    const step = (n, fn) => { for (let i = 0; i < n; i++) { quiet(); update(1 / 60); if (fn && fn(i)) return i; } return -1; };
    for (const [id, up] of ups) {
      breakHatch(up);
      loadRoom(id); G.state = 'PLAY'; G.wake = null; G.bossEntry = null; G.dialog = null;
      G.enemies = []; G.boss = null; G.projs = [];
      const g = G.grid, def = ROOMS[id];
      const cols = [];
      if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) cols.push(x);
      else for (let x = 1; x < def.w - 1; x++) if (g[0][x] === '.') cols.push(x);
      const row = out.table.find(q => q.id === id);
      const good = cols.filter(cx => row.rock.indexOf(cx) < 0);
      const cx = good[Math.floor(good.length / 2)];
      for (const k in keys) keys[k] = 0;
      player.x = cx * TILE + (TILE - player.w) / 2; player.y = TILE + 2; player.vx = 0; player.vy = -760;
      player.on = false; player.iT = 99; player.dead = false;
      keys[KEYB.JUMP[0]] = 1;
      const res = { id, up, arrived: false, back: false, landed: false, climb: false, held: true, trans: 0, steps: 0 };
      let climbSteps = 0;
      const n = step(150, (i) => {
        G.enemies = []; G.projs = []; player.iT = 99;
        if (G.trans) res.trans++;
        if (G.roomId === up) res.arrived = true;
        if (res.arrived && G.roomId === id) res.back = true;
        if (G.climb) {
          res.climb = true; climbSteps++;
          // a held direction must not steer the arc: the controls are the
          // script's for its length
          keys[(climbSteps % 2 ? KEYB.LEFT : KEYB.RIGHT)[0]] = 1;
          const k = G.climb, p = climbPos(k, clamp(k.t / k.dur, 0, 1));
          if (Math.abs(p[0] - player.x) > 0.5 || Math.abs(p[1] - player.y) > 0.5) res.held = false;
        } else { keys[KEYB.LEFT[0]] = 0; keys[KEYB.RIGHT[0]] = 0; }
        if (res.arrived && !G.climb && player.on && G.roomId === up) { res.landed = true; return true; }
        return false;
      });
      for (const k in keys) keys[k] = 0;
      res.steps = n;
      res.feet = Math.round(player.y + player.h); res.room = G.roomId;
      out.up.push(res);
    }
    // ---- 3. every way down, played --------------------------------------------
    for (const [lo, upId] of ups) {
      loadRoom(upId); G.state = 'PLAY'; G.wake = null; G.bossEntry = null; G.dialog = null;
      G.enemies = []; G.boss = null; G.projs = [];
      const ex = ROOMS[upId].exits || {};
      let dn = ex.B; if (dn && typeof dn === 'object') dn = dn.to;
      const res = { id: upId, to: dn, ok: false, trans: 0, snap: null, held: 0 };
      if (dn !== lo) { res.skip = 'B exit goes to ' + dn; out.down.push(res); continue; }
      // stand her over the hole the way up came through, falling
      const L = G.vlink.B, H = G.roomDef.h * TILE;
      const gl = buildRoom(lo), dl = ROOMS[lo];
      const cols = [];
      if (gl.tGap) for (let x = gl.tGap[0]; x <= gl.tGap[1]; x++) cols.push(x);
      else for (let x = 1; x < dl.w - 1; x++) if (gl[0][x] === '.') cols.push(x);
      const row = out.table.find(q => q.id === lo);
      const good = cols.filter(cx => row.rock.indexOf(cx) < 0);
      const cx = good[Math.floor(good.length / 2)];
      player.x = cx * TILE + (TILE - player.w) / 2 + L.ox; player.y = H - 3 * TILE; player.vx = 0; player.vy = 300;
      player.on = false; player.iT = 99;
      // let the camera settle where she is, then fall
      for (let i = 0; i < 4; i++) { update(1 / 60); player.y = H - 3 * TILE; player.vy = 300; }
      let prevS = player.y - cam.y, prevRoom = G.roomId, prevPx = player.y;
      step(120, () => {
        G.enemies = []; G.projs = []; player.iT = 99;
        if (G.trans) res.trans++;
        if (typeof transSnap !== 'undefined' && transSnap) res.held++;
        const s = player.y - cam.y;
        if (G.roomId !== prevRoom) {
          // the screen moves by her own fall this step, plus the camera's
          // ordinary follow — never by a room's height
          res.snap = Math.round(Math.abs(s - prevS));
          res.ok = G.roomId === lo;
          return true;
        }
        prevS = s; prevRoom = G.roomId; prevPx = player.y;
        return false;
      });
      out.down.push(res);
    }
    // ---- 4. no ledge, no crossing ---------------------------------------------
    {
      // A7's way up is A5's hatch; uncut, it is a ceiling
      for (const k in G.save.broken) if (k.indexOf('A5:') === 0) delete G.save.broken[k];
      loadRoom('A7'); G.state = 'PLAY'; G.enemies = []; G.boss = null;
      const g = G.grid; let cx = 0;
      for (let x = 1; x < ROOMS.A7.w - 1; x++) if (g[0][x] === '.') { cx = x; break; }
      player.x = cx * TILE + 4; player.y = TILE + 2; player.vy = -900; player.on = false; player.iT = 99;
      keys[KEYB.JUMP[0]] = 1;
      let minY = 1e9;
      step(60, () => { G.enemies = []; minY = Math.min(minY, player.y + player.h / 2); return false; });
      keys[KEYB.JUMP[0]] = 0;
      out.blocked = { room: G.roomId, minCentre: Math.round(minY) };
    }
    // ---- 4b. a CLOSED story gate is not a seamless shaft ----------------------
    // A3 -> B1 waits on NULLFANG and the blade. With the gate shut, the room
    // above must be neither a handover nor a floor: rising through the hole
    // ends back in A3, never standing on B1's floor outside both rooms.
    {
      const keep = { g: G.save.flags.bossGlitch, c: G.save.flags.crystal, v: G.save.visited && G.save.visited.B1 };
      G.save.flags.bossGlitch = 0; G.save.flags.crystal = 0; if (G.save.visited) delete G.save.visited.B1;
      loadRoom('A3'); G.state = 'PLAY'; G.enemies = []; G.boss = null;
      const L = G.vlink && G.vlink.T;
      const seam = !!vlinkSeamless('T');
      let solidAbove = 0;
      if (L) for (let x = 0; x < ROOMS.A3.w; x++) for (let y = -6; y < 0; y++) { const ch = vlinkTile(x, y); if (ch === '#' || ch === 'B') solidAbove++; }
      const g = G.grid; let cx = -1;
      for (let x = 1; x < ROOMS.A3.w - 1; x++) if (g[0][x] === '.') { cx = x; break; }
      let room = 'A3', minY = 1e9, stood = false;
      if (cx >= 0) {
        player.x = cx * TILE + 4; player.y = TILE + 2; player.vy = -1100; player.on = false; player.iT = 99;
        step(90, () => { G.enemies = []; minY = Math.min(minY, player.y); if (player.on && player.y < 0) stood = true; return false; });
        room = G.roomId;
      }
      out.gate = { link: !!L, seam, solidAbove, room, stood, opening: cx };
      G.save.flags.bossGlitch = keep.g; G.save.flags.crystal = keep.c; if (keep.v && G.save.visited) G.save.visited.B1 = keep.v;
      loadRoom('A3');
      out.gate.openSeam = !!vlinkSeamless('T');
    }
    // ---- 5. the room above is drawn -------------------------------------------
    {
      breakHatch('B7');
      loadRoom('B2'); G.state = 'PLAY'; G.enemies = []; G.boss = null;
      // bake the room above the way the game does it ahead of her
      tileStore.delete('B7');
      const ent = tileEntry('B7', ROOMS.B7.w * TILE, ROOMS.B7.h * TILE);
      tileJob = { id: 'B7', cv: ent.cv, ctx: ent.cv.getContext('2d'), grid: buildRoom('B7'), curve: null,
        sig: tileSig('B7'), it: tileBakeSteps(PAL[ROOMS.B7.zone]), born: 0 };
      tileJobSlice(Infinity);
      const g = G.grid; let cx = 0;
      for (let x = 1; x < ROOMS.B2.w - 1; x++) if (g[0][x] === '.') { cx = x + 1; break; }
      player.x = cx * TILE; player.y = 2 * TILE; player.vy = 0; player.on = false;
      // hang her under the opening long enough for the frame to rise to her
      for (let i = 0; i < 90; i++) { update(1 / 60); player.y = 2 * TILE; player.vy = 0; G.enemies = []; }
      const grab = () => {
        draw(performance.now());
        const d = c.getImageData(0, 0, cv.width, Math.round(cv.height * 0.18)).data;
        let h = 0; for (let i = 0; i < d.length; i += 16) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0;
        return h;
      };
      const camY = cam.y;
      const withArt = grab();
      const saved = window.drawVLinkArt; window.drawVLinkArt = () => {};
      const without = grab();
      window.drawVLinkArt = saved;
      out.drawn = { camY: Math.round(camY), differs: withArt !== without, ext: Math.round(cam.extUp || 0) };
    }
    return out;
  });

  // ---- report -----------------------------------------------------------------
  check('every way up in the world is listed', r.count === 24, r.count + ' T exits');
  for (const row of r.table) {
    const tag = row.id + ' -> ' + row.up;
    check(tag + ': a ledge from every column she can rise through',
      row.usable > 0 && row.none.length === 0,
      row.ok + '/' + row.usable + ' columns' + (row.rock.length ? ' (cols ' + row.rock.join(',') + ' meet rock above)' : '')
        + (row.none.length ? ' — NO LEDGE from ' + row.none.join(',') : ''));
  }
  for (const u of r.up) {
    const tag = 'up ' + u.id + ' -> ' + u.up;
    check(tag + ': carried onto a ledge, controls held, never back down',
      u.arrived && u.landed && u.climb && u.held && !u.back && u.trans === 0,
      (u.landed ? 'standing in ' + u.room + ' at feet ' + u.feet + ' after ' + u.steps + ' steps'
                : 'ended in ' + u.room + ' feet ' + u.feet) +
      (u.climb ? '' : ', no arc') + (u.held ? '' : ', ARC STEERED') + (u.back ? ', FELL BACK' : '') +
      (u.trans ? ', ' + u.trans + ' steps of cut crossing' : ''));
  }
  for (const d of r.down) {
    const tag = 'down ' + d.id + ' -> ' + d.to;
    if (d.skip) { check(tag, false, d.skip); continue; }
    check(tag + ': silent handover, no cut, no snap', d.ok && d.trans === 0 && d.held === 0 && d.snap != null && d.snap < 40,
      d.ok ? 'screen moved ' + d.snap + ' px on the crossing step' : 'did not arrive');
  }
  check('an uncut hatch overhead is a ceiling, not a door', r.blocked.room === 'A7' && r.blocked.minCentre >= -2,
    'still in ' + r.blocked.room + ', centre never above ' + r.blocked.minCentre);
  check('a closed story gate (A3 -> B1) is no seamless shaft and no floor above',
    r.gate && r.gate.link && !r.gate.seam && r.gate.solidAbove === 0 && r.gate.room === 'A3' && !r.gate.stood && r.gate.openSeam,
    r.gate ? ('seamless ' + r.gate.seam + ', solid tiles above ' + r.gate.solidAbove + ', ended in ' + r.gate.room +
      (r.gate.stood ? ', STOOD ABOVE THE FRAME' : '') + ', seamless once open ' + r.gate.openSeam) : 'not run');
  check('the room above is drawn above the room', r.drawn.differs && r.drawn.camY < 0,
    'camera at y ' + r.drawn.camY + ' (extension ' + r.drawn.ext + ' px), top strip ' + (r.drawn.differs ? 'painted by B7' : 'unchanged'));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — every way up ends on a ledge, and every shaft is one place'));
  process.exit(fails.length ? 1 : 0);
})();
