// EVERY FLOOR SHE CAN LAND ON, SHE CAN LEAVE — WITH THE MOVES SHE HAS.
//
// deadend.cjs asks whether the rooms connect. This asks the question one level
// down, inside a room: fall into that gap, and can you get out again? A pit you
// can only climb with a skill bought later is not a challenge, it is a save
// file thrown away, and it was reported by a player who fell into one.
//
// It reads static tiles and three kits — base, +dash, +double jump — and names
// the weakest one that frees each patch of ground, so a gate somebody designed
// and a trap nobody noticed stop looking alike.
//
// WHAT IT DOES NOT SEE: moving platforms. A room whose only route up rides a
// lift will be reported as gated when it is not — C1's climb back to B3 is the
// standing example. That is the safe direction to be wrong in, but it is the
// reason a `gated` line is a question rather than a verdict. A `TRAPPED` line
// is a verdict.
//
//   node tests/climbout.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof ROOMS === 'object', { timeout: 20000 });

  const res = await page.evaluate(() => {
    // --- the jump, SIMULATED with the game's own numbers ---------------------
    //
    // A box — "four tiles up OR six across" — is the obvious model and it is
    // useless, because it says she can do both at once. She cannot: the four
    // tiles of height exist only at the apex, three tiles downrange, and a ledge
    // four tiles up and one tile away is unreachable. A box-shaped model reports
    // every room clean, which is exactly what it did.
    //
    // So the arc is integrated the way Player.update integrates it — the same
    // asymmetric gravity, the same hang under 90 px/s, the same fixed step —
    // and what comes out is the honest envelope: how high she can be at each
    // horizontal offset. Run speed is the base 340, no crest, no relic.
    const V = 770, GU = 2150, GD = 3050, RUN = 340, DT = 1 / 30;
    const ARC = [];                                // ARC[dx tiles] = max px above launch
    {
      let vy = -V, y = 0, x = 0;
      for (let i = 0; i < 200 && (y < 0 || i < 4); i++) {
        let g = vy < 0 ? GU : GD;
        if (Math.abs(vy) < 90) g *= 0.55;
        vy = Math.min(vy + g * DT, 1020);
        y += vy * DT; x += RUN * DT;
        const tx = Math.floor(x / 32);
        ARC[tx] = Math.max(ARC[tx] || 0, -y);
        if (y > 0) break;                          // back below the launch line
      }
      for (let i = 0; i < ARC.length; i++) ARC[i] = ARC[i] || 0;
      // NOT a running maximum. She has to be at that height WHEN she is at that
      // x, and past the apex she is falling — a prefix-max says she can land at
      // peak height any distance downrange, which is how a four-tile climb seven
      // tiles away looked reachable.
    }
    const ACROSS = ARC.length;
    const UP = Math.floor(Math.max.apply(null, ARC) / 32);
    // THE KIT IS THE POINT. "Can she get out" has a different answer in the
    // first room and the fifth kingdom, so the question is asked three times and
    // the report names the weakest kit that frees each area. Anything still
    // stuck with everything on is a real trap; anything freed by the dash in
    // zone B is a gate somebody designed.
    const DASH = Math.floor(940 * 0.16 / 32);      // 940 px/s for 0.16 s
    const KITS = [
      { name: 'base', dash: 0, air: 0 },
      { name: 'dash', dash: DASH, air: 0 },
      { name: 'double jump', dash: DASH, air: 1 },
    ];
    // can she land on a ledge `up` tiles higher, `dx` tiles away, with this kit?
    const canClimb = (dx, up, kit) => {
      // a second jump buys another arc's worth of height, taken from wherever
      // the first one left her — modelled as the two envelopes stacked
      const climb = d => (ARC[Math.min(d, ARC.length - 1)] || 0)
        + (kit.air ? (ARC[Math.max(0, Math.min(d, ARC.length - 1) - 3)] || 0) * 0.88 : 0);
      const span = ACROSS + kit.dash;
      if (up > 0) return dx <= span && climb(dx) >= up * 32;
      if (up === 0) return dx <= span;
      // falling: the drop buys airtime, and airtime buys distance. A one-tile
      // step down does NOT let her cross the room, which "any fall, any gap"
      // quietly assumed.
      const drop = -up * 32;
      return dx <= Math.max(span, RUN * Math.sqrt(2 * drop / GD) / 32 + span * 0.5);
    };
    // ...and she has to have room to jump. A full jump under a low ceiling is
    // not a full jump, and a model that ignores ceilings will call a covered
    // pit climbable.
    const headroom = (at, x, y, up) => {
      for (let k = 1; k <= up; k++) if (solid(at(x, y - k))) return false;
      return true;
    };

    // 'B' is BREAKABLE — a secret wall or ceiling that any hit opens, and the
    // way through to B5, X1 and C4. Treating it as stone reported three boss
    // rooms as having no route to their own far door.
    const solid = ch => ch === '#';
    const floor = ch => ch === '#' || ch === '=';                 // '=' is one-way
    // Landing on a hazard is a death, not a trap, and the run continues from the
    // checkpoint. Counting spike beds as standing ground reported B1's dash gap
    // as a soft-lock, which it is not.
    const hazard = ch => ch === '^' || ch === 'v' || ch === '~' || ch === 'L';
    const out = [];

    for (const id in ROOMS) {
      const def = ROOMS[id];
      if (!def.build) continue;
      const g = mk(def.w, def.h);
      try { def.build(g); } catch (e) { out.push({ id: id, err: String(e) }); continue; }
      // Off the sides and off the top is stone; off the BOTTOM is the void she
      // falls into. Returning stone in every direction made the last row of a
      // drop shaft look like ground standing on bedrock, so the shaft's mouth
      // counted as the door instead of the ledge you step off to reach it.
      const at = (x, y) => (y >= def.h) ? '.'
        : (y < 0 || x < 0 || x >= def.w) ? '#' : g[y][x];

      // ---- every cell she can stand in: air with a floor under it -----------
      const cells = [];
      const key = (x, y) => x + ',' + y;
      const index = {};
      for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
        if (floor(at(x, y)) || hazard(at(x, y))) continue;
        if (!floor(at(x, y + 1))) continue;
        index[key(x, y)] = cells.length;
        cells.push({ x: x, y: y });
      }
      // ---- who can reach whom, base kit only --------------------------------
      // A jump from A reaches B if B is at most UP tiles above and ACROSS tiles
      // sideways, with a clear column at the target and no wall taller than the
      // jump in between. Falling is free: any drop, any distance across.
      const clearBetween = (a, b) => {
        const lo = Math.min(a.x, b.x), hi = Math.max(a.x, b.x);
        const top = Math.min(a.y, b.y) - 1;        // she has to fit over the lip
        for (let x = lo; x <= hi; x++) {
          let blocked = true;
          for (let y = top; y <= Math.max(a.y, b.y); y++) if (!solid(at(x, y))) { blocked = false; break; }
          if (blocked) return false;               // a full-height wall in the way
        }
        return true;
      };
      const graphFor = (kit) => {
        const adj = cells.map(() => []);
        for (let i = 0; i < cells.length; i++) for (let j = 0; j < cells.length; j++) {
          if (i === j) continue;
          const a = cells[i], b = cells[j];
          const dx = Math.abs(b.x - a.x), up = a.y - b.y;
          if (!canClimb(dx, up, kit)) continue;
          if (up > 0 && !headroom(at, a.x, a.y, up)) continue;
          if (!clearBetween(a, b)) continue;
          adj[i].push(j);
        }
        return adj;
      };
      // ---- the exits: the HOLE, not merely somewhere near the edge ----------
      //
      // "a standing cell within three tiles of the bottom" was the old test and
      // it is why A6 passed for months: its drop-out was carved through the
      // lower floor row only, leaving a cellar under an unbroken floor, and the
      // whole bottom of the room counted as a door because it was near the
      // bottom. A door is where the frame is actually open, and the player has
      // to be able to GET to that opening — walk into it, fall through it, or
      // jump up through it. Anything else is a wall with a room behind it.
      const ex = def.exits || {};
      const doors = {};
      const near = (i, fn) => fn(cells[i].x, cells[i].y);
      const openCol = [];                          // x where BOTH floor rows are open
      for (let x = 0; x < def.w; x++)
        if (!solid(at(x, def.h - 2)) && !solid(at(x, def.h - 1))) openCol.push(x);
      const openTop = [];
      for (let x = 0; x < def.w; x++) if (!solid(at(x, 0))) openTop.push(x);
      const openL = [], openR = [];
      for (let y = 0; y < def.h; y++) {
        if (!solid(at(0, y))) openL.push(y);
        if (!solid(at(def.w - 1, y))) openR.push(y);
      }
      for (let i = 0; i < cells.length; i++) {
        // side doors: standing in the doorway's own rows, at the wall
        if (ex.L && openL.length && near(i, (x, y) => x <= 1 && openL.indexOf(y) >= 0))
          (doors.L = doors.L || []).push(i);
        if (ex.R && openR.length && near(i, (x, y) => x >= def.w - 2 && openR.indexOf(y) >= 0))
          (doors.R = doors.R || []).push(i);
        // the drop-out: anywhere she can step off into the shaft. Height does
        // not matter — falling is free — but being over the hole does.
        if ((ex.B || ex.D) && openCol.length && near(i, (x) =>
              x >= openCol[0] - 1 && x <= openCol[openCol.length - 1] + 1))
          (doors.B = doors.B || []).push(i);
        // the way up: close enough under the ceiling hole to jump through it
        if (ex.T && openTop.length && near(i, (x, y) => {
              for (const ox of openTop) if (canClimb(Math.abs(x - ox), y, KITS[KITS.length - 1])) return true;
              return false;
            })) (doors.T = doors.T || []).push(i);
      }
      const sides = Object.keys(doors);
      if (!sides.length) continue;                 // no way out at all is deadend.cjs's job
      const flood = (seed, graph) => {
        const seen = new Array(cells.length).fill(false), q = seed.slice();
        for (const s of q) seen[s] = true;
        while (q.length) { const n = q.shift(); for (const p of graph[n]) if (!seen[p]) { seen[p] = true; q.push(p); } }
        return seen;
      };
      const allDoors = [].concat.apply([], sides.map(s => doors[s]));
      // needs[i] = index of the weakest kit that lets cell i reach a door;
      // -1 means nothing in the game gets her out of there.
      const needs = new Array(cells.length).fill(-1);
      const gates = {};                            // "L→R" -> weakest kit index
      for (let k = 0; k < KITS.length; k++) {
        const adj = graphFor(KITS[k]);
        const rev = cells.map(() => []);
        for (let i = 0; i < cells.length; i++) for (const j of adj[i]) rev[j].push(i);
        const canLeave = flood(allDoors, rev);
        for (let i = 0; i < cells.length; i++) if (needs[i] < 0 && canLeave[i]) needs[i] = k;
        for (const from of sides) {
          const can = flood(doors[from], adj);
          for (const to of sides) {
            if (to === from) continue;
            const nm = from + '→' + to;
            if (gates[nm] == null && doors[to].some(i => can[i])) gates[nm] = k;
          }
        }
      }
      // a cell freed only by kit >0 is a gate; a cell freed by nothing is a trap
      const trapped = [], gatedCells = {};
      for (let i = 0; i < cells.length; i++) {
        if (needs[i] < 0) trapped.push(cells[i]);
        else if (needs[i] > 0) (gatedCells[KITS[needs[i]].name] = gatedCells[KITS[needs[i]].name] || []).push(cells[i]);
      }
      const gated = [];
      for (const from of sides) for (const to of sides) {
        if (to === from) continue;
        const nm = from + '→' + to;
        if (gates[nm] == null) gated.push(nm + ' IMPOSSIBLE');
        else if (gates[nm] > 0) gated.push(nm + ' needs ' + KITS[gates[nm]].name);
      }
      if (trapped.length || gated.length || Object.keys(gatedCells).length)
        out.push({ id: id, zone: def.zone, trapped: trapped, gated: gated,
                   gatedCells: gatedCells, total: cells.length });
    }
    return { rooms: Object.keys(ROOMS).length, UP: UP, ACROSS: ACROSS, out: out };
  });

  console.log('one jump clears ' + res.UP + ' tiles up and ' + res.ACROSS + ' across; '
    + res.rooms + ' rooms checked, base kit only');
  let bad = 0, gates = 0;
  for (const r of res.out) {
    if (r.err) { console.log('  ERROR ' + r.id + ': ' + r.err); bad++; continue; }
    if (r.trapped.length) {
      bad++;
      const by = {};
      for (const t of r.trapped) (by[t.y] = by[t.y] || []).push(t.x);
      const rows = Object.keys(by).sort((a, b) => a - b)
        .map(y => 'y=' + y + ' x=' + Math.min.apply(null, by[y]) + '..' + Math.max.apply(null, by[y]));
      console.log('  TRAPPED  ' + r.id + ' [' + r.zone + ']  ' + r.trapped.length + '/' + r.total
        + ' standing cells cannot reach ANY exit');
      for (const s of rows.slice(0, 6)) console.log('             ' + s);
      if (rows.length > 6) console.log('             …and ' + (rows.length - 6) + ' more rows');
    }
    const imp = r.gated.filter(s => /IMPOSSIBLE/.test(s));
    if (imp.length) { bad++; console.log('  NO ROUTE ' + r.id + ' [' + r.zone + ']  ' + imp.join(', ')); }
    const soft = r.gated.filter(s => !/IMPOSSIBLE/.test(s));
    if (soft.length) { gates++; console.log('  gated    ' + r.id + ' [' + r.zone + ']  ' + soft.join(', ')); }
    for (const kit in r.gatedCells) {
      const by = {};
      for (const t of r.gatedCells[kit]) (by[t.y] = by[t.y] || []).push(t.x);
      const rows = Object.keys(by).sort((a, b) => a - b)
        .map(y => 'y=' + y + ' x=' + Math.min.apply(null, by[y]) + '..' + Math.max.apply(null, by[y]));
      console.log('  gated    ' + r.id + ' [' + r.zone + ']  ground that needs ' + kit
        + ' to leave:  ' + rows.join('  '));
    }
  }
  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); bad++; }
  await browser.close();
  if (bad) { console.log('\nFAILED — ' + bad + ' room(s) can strand the player'); process.exit(1); }
  console.log('\nOK — no room can strand her'
    + (gates ? '; ' + gates + ' room(s) gate a door behind a later power (listed above — by design or not, it is now visible)' : ''));
})().catch(e => { console.error(e); process.exit(1); });
