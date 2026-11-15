// A SAVE POINT BEFORE EVERY BOSS (owner's order, 2026-11-14).
//
// From the review of what keeps a player in a game of this kind: the walk back
// after a death is where the controller goes down (it was the loudest complaint
// about Silksong's checkpoints). Ten rooms here led into a guardian or a
// sub-boss with the nearest rest two to four rooms behind.
//
// The rule, measured off the world list and then in the live room:
//   - every room that holds a boss has a pod in a room that leads INTO it — one
//     door away — not counting a guardian's own lair, which only opens after
//     the fight it belongs to is over;
//   - and every pod in the game stands on something, clear of a hazard rail.
//
// ...AND NOWHERE ELSE (owner, 2026-11-15: "there are so many save points. It
// shouldn't be this way. Only near critical areas, not everywhere"). The first
// rule alone had no ceiling: a pod could stand anywhere, and five stood near
// nothing — and the meadow hub's stood 41 tiles from the one in Ratchet's camp
// next door. So both halves are held now (world.js, SAVE POINTS ARE FOR
// CRITICAL PLACES):
//   - "near" is one door away, OR under forty tiles' walk through one more
//     door (the camp's pod is 22 tiles from the Wolf King's gate, and that is
//     nearer than most pods that share a wall with their boss);
//   - every pod has a reason: it is near a boss, or it is the den's (where the
//     game begins and resting is taught), or it is in a Sage's cave, or it is
//     at the bottom of a drop she cannot climb back out of (the vault, V2 —
//     tests/benchloop.cjs is what demands that one);
//   - and no two pods stand within sixty tiles' walk of each other through one
//     door.
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
    const ids = Object.keys(ROOMS);
    const lair = id => /^G[A-EX]\d/.test(id);
    const nb = id => { const out = new Set(), ex = ROOMS[id].exits || {};
      for (const k in ex) { const v = ex[k], to = typeof v === 'object' ? v.to : v; if (to && ROOMS[to]) out.add(to); }
      const gr = typeof GATE_ROOM !== 'undefined' && GATE_ROOM[id];
      for (const d of [].concat(gr || [])) if (d && d.to && ROOMS[d.to]) out.add(d.to);
      return [...out]; };
    const into = {}; for (const id of ids) for (const n of nb(id)) (into[n] = into[n] || new Set()).add(id);
    const hasBench = id => (ROOMS[id].ents || []).some(e => e[0] === 'bench');
    const bosses = [], far = [], short = [], served = {};
    // where in room `a` the way to room `b` is, in tiles along the floor: a
    // depth door stands where it is drawn, a side exit is that edge, and a
    // way up or down is the middle of its opening
    const grids = {}; const grid = id => grids[id] || (grids[id] = buildRoom(id));
    const doorX = (a, b2) => { const W = ROOMS[a].w;
      for (const d of [].concat((typeof GATE_ROOM !== 'undefined' && GATE_ROOM[a]) || [])) if (d && d.to === b2) return Math.round(d.at * W);
      const ex = ROOMS[a].exits || {};
      for (const k in ex) { const v = ex[k], to = typeof v === 'object' ? v.to : v; if (to !== b2) continue;
        if (k === 'L') return 0; if (k === 'R') return W;
        const g = grid(a), row = g[k === 'T' ? 0 : g.length - 1]; const open = []; for (let x = 0; x < row.length; x++) if (row[x] !== '#') open.push(x);
        return open.length && open.length < W - 4 ? Math.round((open[0] + open[open.length - 1]) / 2) : Math.round(W / 2); }
      return Math.round(W / 2); };
    // a way up or down is also that room's height to cross
    const climb = (a, b2) => { const ex = ROOMS[a].exits || {}; for (const k in ex) { const v = ex[k], to = typeof v === 'object' ? v.to : v; if (to === b2 && (k === 'T' || k === 'B')) return ROOMS[a].h; } return 0; };
    for (const id of ids) for (const e of ROOMS[id].ents || []) {
      if (e[0] !== 'boss') continue;
      const ways = [...new Set([...(into[id] || []), ...nb(id)])].filter(q => !lair(q));
      const rest = hasBench(id) ? [id] : ways.filter(hasBench);
      bosses.push(id + ':' + e[3]);
      // ...or a short walk through one more door
      let walk = null;
      if (!rest.length) for (const n of ways) for (const m of nb(n)) {
        if (m === id || lair(m) || !hasBench(m)) continue;
        for (const be of ROOMS[m].ents.filter(q => q[0] === 'bench')) {
          const d = Math.abs(be[1] - doorX(m, n)) + Math.abs(doorX(n, m) - doorX(n, id)) + climb(m, n) + climb(n, m) + climb(n, id);
          if (!walk || d < walk.d) walk = { d, m, n };
        }
      }
      if (rest.length) for (const q of rest) served[q] = 1;
      else if (walk && walk.d <= 40) { served[walk.m] = 1; short.push(id + ' (' + e[3] + '): ' + walk.d + ' tiles from the pod in ' + walk.m + ', through ' + walk.n); }
      else far.push(id + ' (' + e[3] + ') — approached from ' + ways.join(', ') + ', none with a pod' + (walk ? '; the nearest is ' + walk.d + ' tiles off in ' + walk.m : ''));
    }
    // a pod with no reason to be there; and two pods a short walk apart
    const idle = [], close = [];
    const benchRooms = ids.filter(hasBench);
    const PIT = { V2: 1 };      // one-way drops that must hold a rest (tests/benchloop.cjs)
    for (const id of benchRooms) if (!served[id] && id !== 'A0B' && !lair(id) && !PIT[id]) idle.push(id);
    for (const a of benchRooms) for (const c2 of nb(a)) {
      if (c2 <= a || !hasBench(c2) || lair(a) || lair(c2)) continue;
      for (const pa of ROOMS[a].ents.filter(q => q[0] === 'bench')) for (const pc of ROOMS[c2].ents.filter(q => q[0] === 'bench')) {
        const d = Math.abs(pa[1] - doorX(a, c2)) + Math.abs(pc[1] - doorX(c2, a)) + climb(a, c2) + climb(c2, a);
        if (d < 60) close.push(a + ' and ' + c2 + ' (' + d + ' tiles)');
      }
    }
    // every pod, in its live room
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.storyVersion = 2; startGame(sv);
    const sol = ch => ch === '#' || ch === '=' || ch === 'B';
    const pods = [], bad = [];
    for (const id of ids) {
      if (!hasBench(id)) continue;
      try { loadRoom(id); } catch (e) { bad.push(id + ' failed to load'); continue; }
      for (const s of G.statics) { if (s.type !== 'bench') continue;
        pods.push(id);
        const cx = s.x + s.w / 2, fy = s.y + s.h, tx = Math.floor(cx / TILE), row = Math.round(fy / TILE);
        // ground within a tile under its feet (a cave's floor curve sits a little
        // below the row the pod is written on, and the plate carries its own base)
        const under = sol(tileAt(tx, row)) || sol(tileAt(tx, row + 1));
        let rail = false; for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 1; dy++) if (tileAt(tx + dx, row + dy) === '^') rail = true;
        // the pod is a dome four tiles wide and nearly five tall: it needs the room
        let roof = false; for (let dy = 1; dy <= 4; dy++) if (sol(tileAt(tx, row - dy))) roof = true;
        // (the den's pod is built INTO its corner on purpose — world.js A0B)
        const W = G.grid[0].length, edge = id !== 'A0B' && (tx < 3 || tx > W - 4);
        const wall = tileAt(tx - 2, row - 1) === '#' || tileAt(tx + 2, row - 1) === '#';
        const why = (under ? '' : ' floats') + (rail ? ' beside a rail' : '') + (roof ? ' under a roof it does not fit' : '') + (edge ? ' cut by the room edge' : '') + (wall ? ' into a wall' : '');
        if (why) bad.push(id + ' pod at ' + tx + ',' + row + why);
      }
    }
    return { bosses, far, short, idle, close, pods: pods.length, bad, rooms: benchRooms };
  });
  check('every boss room has a save point one door away, or a short walk through one more (' + r.bosses.length + ' bosses)', r.bosses.length >= 12 && r.far.length === 0, r.far.join(' | ') || r.short.join(' | '));
  check('...and a pod stands nowhere else: each one is near a boss, or is the den\'s, or is in a Sage\'s cave, or is at the bottom of a one-way drop', r.idle.length === 0, r.idle.length ? 'near nothing: ' + r.idle.join(', ') : r.rooms.join(' '));
  check('...and no two pods are a short walk apart', r.close.length === 0, r.close.join(' | '));
  check('every pod stands on something, clear of a hazard (' + r.pods + ' pods)', r.pods >= 15 && r.bad.length === 0, r.bad.join(' | '));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — a death before a guardian is a short walk back');
})().catch(e => { console.error(e); process.exit(1); });
