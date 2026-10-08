// EVERY ONE-WAY ROUTE LOOPS BACK TO A BENCH.
//
// tests/deadend.cjs proves every exit is mirrored on paper: a door named on
// one side is named on the other. Paper is not the body. A drop she can fall
// down and cannot climb back up is a one-way route however the exits read,
// and so is a depth door with no door behind it (W2's city gates, by design).
// A one-way route is fine — the plan's §2 lesson from Hollow Knight is that
// they are how a world folds back on itself — on one condition: wherever it
// lets her out, she can still reach somewhere to rest. Otherwise a death, a
// quit, or simply wanting to go home is a walk with no end.
//
// So this builds the room graph the way her body sees it:
//
//   side exits     two-way (tests/seam.cjs holds both edges equal);
//   down (B)       always — falling is free;
//   up (T)         only where a real jump carries her out through the lower
//                  room's ceiling opening — simulated from every footing near
//                  it (a brittle 'B' over the hole counts as footing: it is
//                  cut from below);
//   depth doors    one edge per door, in the direction it walks (gateDoorsAll,
//                  every flag assumed earned — a door locked behind a fight is
//                  still a door once the fight is won).
//
// Every edge whose reverse is NOT in that graph is a one-way route. From the
// room each one lands in, the bench rooms must still be reachable — a room
// with a bench in it, or one of BENCH_ROOMS.
//
//   node tests/benchloop.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const JUMP_ROWS = 6;      // a standing jump lifts her feet ~201 px: nothing lower can clear the lid
const REACH_COLS = 4;     // footings this far either side of the hole are tried

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── benchloop — every one-way route loops back to a bench\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const r = await page.evaluate(({ JUMP_ROWS, REACH_COLS }) => {
    // a current-story save, so the doors the game builds per save exist
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    const dest = (v) => (v && typeof v === 'object') ? v.to : v;
    const solid = (ch) => ch === '#' || ch === 'B';
    const ids = Object.keys(ROOMS);
    const bench = new Set(BENCH_ROOMS);
    for (const id of ids) if ((ROOMS[id].ents || []).some(e => e[0] === 'bench')) bench.add(id);

    // CAN SHE RISE OUT OF `id` THROUGH ITS CEILING OPENING? Asked of the real
    // body, not of a rule of thumb: a rung three columns short of the hole
    // reads as "within a jump" on paper and bonks her head on the lid in the
    // game (D5 and E5 shipped exactly that). So from every footing near the
    // opening — a top with air over it, within JUMP_ROWS of the lid and
    // REACH_COLS of the hole — she jumps, straight up and steering toward
    // the hole, early and late, and the route counts if any of those carries
    // her whole body above the frame inside the opening.
    const DT = 1 / 60;
    const realCheck = window.checkTransitions;
    const climb = {};
    const canClimb = (id) => {
      if (climb[id] != null) return climb[id];
      const g = buildRoom(id), W = g[0].length;
      const cols = [];
      if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) cols.push(x);
      else for (let x = 1; x < W - 1; x++) if (g[0][x] !== '#') cols.push(x);
      if (!cols.length) return (climb[id] = { ok: false, why: 'no opening' });
      const c0 = cols[0], c1 = cols[cols.length - 1], mid = (c0 + c1 + 1) / 2 * TILE;
      const lo = Math.max(1, c0 - REACH_COLS), hi = Math.min(W - 2, c1 + REACH_COLS);
      const feet = [];
      for (let y = 1; y <= Math.min(JUMP_ROWS + 1, g.length - 1); y++)
        for (let x = lo; x <= hi; x++) {
          const ch = g[y][x];
          if ((solid(ch) || ch === '=') && g[y - 1][x] === '.' && (y < 2 || g[y - 2][x] === '.')) feet.push([x, y]);
        }
      window.checkTransitions = () => {};          // measure the rise, do not take the door
      try {
        for (const [fx, fy] of feet) for (const steer of [0, 1]) for (const delay of [0, 6]) {
          loadRoom(id); G.dialog = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
          G.bossEntry = null; G.gateWalk = null; G.wake = null; G.tut = null; G.trans = null;
          player.x = fx * TILE + (TILE - player.w) / 2; player.y = fy * TILE - player.h;
          player.vx = 0; player.vy = 0; player.dead = false;
          for (let i = 0; i < 12; i++) update(DT);
          const dir = steer ? Math.sign(mid - (player.x + player.w / 2)) : 0;
          const key = dir > 0 ? 'ArrowRight' : 'ArrowLeft';
          keysP.KeyZ = 1; keys.KeyZ = 1; update(DT); keysP.KeyZ = 0;
          let out = false;
          for (let i = 0; i < 70 && !out; i++) {
            if (dir && i === delay) keys[key] = 1;
            if (i === 24) keys.KeyZ = 0;
            update(DT);
            const cx = player.x + player.w / 2;
            if (player.y + player.h < -2 && cx >= c0 * TILE - 8 && cx <= (c1 + 1) * TILE + 8) out = true;
          }
          keys.ArrowRight = 0; keys.ArrowLeft = 0; keys.KeyZ = 0;
          if (out) return (climb[id] = { ok: true, at: fx + ',' + fy });
        }
      } finally { window.checkTransitions = realCheck; }
      return (climb[id] = { ok: false, why: feet.length ? 'no jump from ' + feet.length + ' footings clears the lid' : 'no footing near the opening' });
    };
    // the body's graph
    const edges = [];
    for (const id of ids) {
      for (const [side, v] of Object.entries(ROOMS[id].exits || {})) {
        const to = dest(v);
        if (!to || !ROOMS[to]) continue;
        if (side === 'T' && !canClimb(id).ok) continue;
        edges.push({ a: id, b: to, kind: side });
      }
      for (const d of gateDoorsAll(id)) if (ROOMS[d.to]) edges.push({ a: id, b: d.to, kind: 'door' });
    }
    const out = {};
    for (const e of edges) (out[e.a] || (out[e.a] = [])).push(e.b);
    const has = (a, b) => (out[a] || []).includes(b);
    const oneway = edges.filter(e => !has(e.b, e.a));
    // from where each one lands, the nearest bench (BFS)
    const nearest = (start) => {
      const seen = new Map([[start, 0]]), q = [start];
      while (q.length) {
        const n = q.shift();
        if (bench.has(n)) return { room: n, steps: seen.get(n) };
        for (const m of out[n] || []) if (!seen.has(m)) { seen.set(m, seen.get(n) + 1); q.push(m); }
      }
      return null;
    };
    const report = oneway.map(e => ({ a: e.a, b: e.b, kind: e.kind, bench: nearest(e.b),
      why: e.kind === 'B' ? (canClimb(e.b).why || '') : (e.kind === 'door' ? 'no door back' : '') }));
    const unclimbed = ids.filter(id => (ROOMS[id].exits || {}).T && !canClimb(id).ok);
    return { report, benches: [...bench], unclimbed, edgeCount: edges.length };
  }, { JUMP_ROWS, REACH_COLS });

  console.log('  --   bench rooms: ' + r.benches.join(' '));
  console.log('  --   one-way routes found: ' + (r.report.length
    ? r.report.map(o => `${o.a}->${o.b} (${o.kind}${o.why ? ': ' + o.why : ''}) rest at ${o.bench ? o.bench.room + ' in ' + o.bench.steps : 'NOTHING'}`).join('  ')
    : 'none'));
  check('the graph has one-way routes to check', r.report.length > 0, r.edgeCount + ' edges');
  const stranded = r.report.filter(o => !o.bench);
  check('every one-way route can reach a bench again', stranded.length === 0,
    stranded.length ? stranded.map(o => `${o.a}->${o.b}`).join('  ') : r.report.length + ' routes, every one reaches a rest');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — wherever a one-way route lets her out, a bench is still within reach'));
  process.exit(fails.length ? 1 : 0);
})();
