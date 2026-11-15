// A FALL IS SWEPT, NOT SAMPLED.
//
// moveEnt resolved a downward move by looking at the row the feet LANDED in,
// which is right for as long as a step is shorter than a tile. The step is not
// always shorter than a tile: the fall cap is 1020 px/s and SIM_STEP is 1/30,
// so a body at terminal velocity covers 34 px through 32 px tiles and the row
// it crossed was never asked. Measured before the fix, on A1's floor: feet
// starting exactly on the surface ended 31.99 px BELOW it with vy zeroed —
// standing a whole tile inside the ground — and the one-tile ledges in A6 and
// the one-way platforms in W1 are the shapes that are passed clean through.
//
// It needs a long fall (terminal takes about 170 px, five tiles) and a step at
// the full 1/30, which the loop only takes when a frame cost 33 ms or more. A
// bug that only appears on a slow device is the worst kind to leave in: it
// cannot be reproduced on the machine it was written on, so it has to be a test.
//
// Every shape in the world that a body can land on is checked here at the worst
// step, from every sub-pixel phase of the crossing, and 1/60 is checked beside
// it so the common case is pinned too.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const p = await browser.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8220/index.html');
    await p.waitForFunction(() => typeof moveEnt === 'function' && typeof buildRoom === 'function');

    const r = await p.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      const s = newSave(1); s.time = 99; s.flags.tut = 1; s.flags.woke = 1;
      startGame(s); G.wake = G.cut = null;

      // Every landable shape: a thick floor, a ledge one tile thick (the one
      // that is passed through rather than sunk into), and a one-way platform.
      const want = [
        { kind: 'floor', solid: (c) => c === '#', thin: false },
        { kind: 'ledge', solid: (c) => c === '#', thin: true },
        { kind: 'oneway', solid: (c) => c === '=', thin: false },
      ];
      const targets = [];
      for (const w of want) {
        let found = null;
        for (const id in ROOMS) {
          if (found) break;
          let g; try { g = buildRoom(id); } catch (e) { continue; }
          const H = ROOMS[id].h, W = ROOMS[id].w;
          for (let x = 3; x < W - 3 && !found; x++) for (let y = 4; y < H - 2; y++) {
            if (!w.solid(g[y][x])) continue;
            if (w.thin && g[y + 1][x] !== '.') continue;
            // three clear rows above, so a 48 px body starts in free air
            if (g[y - 1][x] !== '.' || g[y - 2][x] !== '.' || g[y - 3][x] !== '.') continue;
            found = { room: id, x, y, kind: w.kind }; break;
          }
        }
        if (found) targets.push(found);
      }

      const drop = (t, dt) => {
        loadRoom(t.room);
        const top = t.y * TILE;
        let worstSink = 0, missed = 0, phases = 0;
        for (let k = 0; k < 68; k++) {
          const phase = k / 2;                       // 0 .. 34 px of crossing
          const e = { x: t.x * TILE + 4, y: top - 1 - phase - 48, w: 24, h: 48,
                      vx: 0, vy: 1020, on: false };
          moveEnt(e, dt);
          phases++;
          const feet = e.y + e.h;
          // Not every phase reaches the surface in one step — at 1/60 the body
          // moves 17 px and the later phases start further than that above it.
          // Falling short is not tunnelling; ENDING BELOW THE SURFACE without
          // having been stopped is.
          if (e.vy !== 0) { if (feet > top) missed++; continue; }
          const sink = feet - top;
          if (sink > worstSink) worstSink = sink;
        }
        return { worstSink: +worstSink.toFixed(2), missed, phases };
      };

      const out = { TILE, SIM_STEP, perStep: +(1020 * SIM_STEP).toFixed(1), targets: [] };
      for (const t of targets) {
        out.targets.push({ ...t, slow: drop(t, SIM_STEP), fast: drop(t, 1 / 60) });
      }
      return out;
    });

    assert(r.perStep > r.TILE, 'the premise: a step at the cap must cross more than a tile ('
      + r.perStep + ' px through ' + r.TILE + ')');
    for (const kind of ['floor', 'ledge', 'oneway']) {
      const t = r.targets.find(x => x.kind === kind);
      assert(t, 'no ' + kind + ' found in the world — this check would be vacuous');
      for (const step of ['slow', 'fast']) {
        const m = t[step];
        assert.equal(m.missed, 0, kind + ' (' + t.room + ') at the ' + step
          + ' step: ' + m.missed + '/' + m.phases + ' falls went straight through');
        assert(m.worstSink <= 1, kind + ' (' + t.room + ') at the ' + step
          + ' step: feet ended ' + m.worstSink + ' px inside it');
      }
    }
    assert.deepEqual(errs, [], 'no page errors');

    console.log('PASS fallthrough: ' + r.perStep + ' px of fall per step through ' + r.TILE
      + ' px tiles lands ON the first surface crossed, at both steps, for '
      + r.targets.map(t => t.kind + ' ' + t.room).join(', '), r.targets);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
