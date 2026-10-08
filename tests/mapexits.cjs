// THE MAP SHOWS ROOMS WHERE THEY REALLY ARE.
//
// tests/mapgrid.cjs proves no two rooms share a square. That is necessary and
// not nearly enough: a board can be perfectly disjoint and still draw A8 a
// whole cell to the side of the hole in A2's ceiling that leads to it, or
// leave a two-cell gap in the middle of the meadow between A2 and A3, which
// walk straight into each other. Both shipped.
//
// The rules a crossing actually follows are the rules the board must follow:
//
//   T/B  a vertical crossing keeps her x. The upper room sits directly on the
//        lower one (its bottom edge IS the lower room's top edge), and the
//        shaft — the ceiling hole below, the floor hole above, or the arrival
//        column an exit names — falls at the same place on the chart in both
//        rooms, within ALIGN of a cell.
//   L/R  a side crossing keeps her y. The right-hand room starts where the
//        left one ends, their rows overlap, and the floor she walks across is
//        at the same height on the chart in both, within ALIGN of a cell.
//
// One honest exception, and it is MEASURED, not listed: where the world's own
// geometry overlaps (V2 hangs under B2 exactly where A4 stands; D4 rises from
// D2 into C2's span) no drawing can put the room where it is. Such a pair
// passes only while its correctly aligned square is occupied by some other
// room — free the square and the exception disappears and the pair must move.
//
// And over the whole board, not just one kingdom: no two rooms overlap at all.
//
//   node tests/mapexits.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const ALIGN = 0.2;     // cells: under a fifth of a room, the eye reads one place

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── mapexits — the map shows rooms where they really are\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof MAPPOS === 'object' && typeof buildRoom === 'function', { timeout: 20000 });

  const r = await page.evaluate((ALIGN) => {
    const E = 1e-6;
    const box = (id) => { const m = MAPPOS[id]; return { x: m[0], y: m[1], w: m[2] || 1, h: m[3] || 1 }; };
    const overlaps = (a, b) => a.x < b.x + b.w - E && b.x < a.x + a.w - E && a.y < b.y + b.h - E && b.y < a.y + a.h - E;
    const ids = Object.keys(MAPPOS);
    const dest = (v) => (v && typeof v === 'object') ? v.to : v;
    const solid = ch => ch === '#' || ch === 'B';
    // the column of the way up, in tiles, measured from the lower room's grid
    const holeOf = (id) => {
      const g = buildRoom(id), cols = [];
      if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) cols.push(x);
      else for (let x = 1; x < g[0].length - 1; x++) if (!solid(g[0][x])) cols.push(x);
      return cols.length ? (cols[0] + cols[cols.length - 1]) / 2 + 0.5 : null;
    };
    // exit-connected pieces of the world (depth doors are not exits)
    const comp = {};
    let n = 0;
    for (const id0 of ids) {
      if (comp[id0] != null || !ROOMS[id0]) continue;
      const q = [id0]; comp[id0] = n;
      while (q.length) {
        const a = q.pop();
        for (const v of Object.values(ROOMS[a].exits || {})) {
          const b = dest(v);
          if (b && ROOMS[b] && comp[b] == null) { comp[b] = n; q.push(b); }
        }
      }
      n++;
    }
    const pairs = [];
    const seen = new Set();
    for (const id of ids) {
      const def = ROOMS[id]; if (!def) continue;
      for (const [side, v] of Object.entries(def.exits || {})) {
        const to = dest(v);
        if (!to || !ROOMS[to] || !MAPPOS[to]) { pairs.push({ id, side, to, err: 'not on the board' }); continue; }
        // normalise to (lower, upper) for vertical and (left, right) for side
        let lo, hi, kind, at = null;
        if (side === 'T') { lo = id; hi = to; kind = 'V'; at = typeof v === 'object' && v.at != null ? v.at : null; }
        else if (side === 'B') {
          lo = to; hi = id; kind = 'V';
          const back = (ROOMS[to].exits || {}).T;
          at = typeof back === 'object' && dest(back) === id && back.at != null ? back.at : null;
        }
        else if (side === 'R') { lo = id; hi = to; kind = 'H'; }
        else { lo = to; hi = id; kind = 'H'; }
        const key = kind + lo + '|' + hi;
        if (seen.has(key)) continue; seen.add(key);
        const A = box(lo), B = box(hi), dA = ROOMS[lo], dB = ROOMS[hi];
        let adj, off, want;
        if (kind === 'V') {
          const hole = holeOf(lo);
          const cA = hole == null ? null : A.x + hole / dA.w * A.w;
          const cB = hole == null ? null : B.x + (at != null ? at + 0.5 : hole) / dB.w * B.w;
          adj = Math.abs(B.y + B.h - A.y) < E && A.x < B.x + B.w && B.x < A.x + A.w;
          off = hole == null ? 99 : cB - cA;
          // where the upper room belongs: on top, shifted so the shafts meet
          want = { lo, hi, mover: hi, box: { x: B.x - off, y: A.y - B.h, w: B.w, h: B.h } };
        } else {
          // the floor she walks over, as a fraction of each room's drawn height;
          // an `air` room holds its authored floor at the bottom of a taller frame
          const row = dA.h - 2.5, rowB = row + ((dB.air | 0) - (dA.air | 0));
          const yA = A.y + row / dA.h * A.h, yB = B.y + rowB / dB.h * B.h;
          adj = Math.abs(A.x + A.w - B.x) < E && A.y < B.y + B.h && B.y < A.y + A.h;
          off = yB - yA;
          want = { lo, hi, mover: hi, box: { x: A.x + A.w, y: B.y - Math.round(off), w: B.w, h: B.h } };
        }
        // the room that would move is the one with fewer ways in: a leaf hangs
        // off its neighbour, not the other way round
        const nEx = (q) => Object.keys(ROOMS[q].exits || {}).length;
        if (nEx(lo) < nEx(hi)) {
          want.mover = lo;
          want.box = kind === 'V'
            ? { x: A.x + off, y: B.y + B.h, w: A.w, h: A.h }
            : { x: B.x - A.w, y: A.y + Math.round(off), w: A.w, h: A.h };
        }
        const ok = adj && Math.abs(off) <= ALIGN;
        // ...and only a room the exits themselves pin down can hold the square:
        // one in the SAME exit-connected piece of world. A cave network or a
        // booth reached by a depth door floats free on the chart, so a room in
        // the way that could simply be moved is a layout fault, not geometry.
        let blockedBy = null;
        if (!ok) {
          for (const q of ids) {
            if (q === want.mover || comp[q] !== comp[want.mover]) continue;
            if (overlaps(want.box, box(q))) { blockedBy = q; break; }
          }
        }
        pairs.push({ lo, hi, kind, adj, off: +off.toFixed(2), ok, mover: want.mover, blockedBy });
      }
    }
    const board = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++)
      if (overlaps(box(ids[i]), box(ids[j]))) board.push(ids[i] + '/' + ids[j]);
    return { pairs, board };
  }, ALIGN);

  const missing = r.pairs.filter(p => p.err);
  check('every exit leads to a room on the board', missing.length === 0,
    missing.map(p => `${p.id}.${p.side}->${p.to}`).join(' ') || 'all placed');
  const vert = r.pairs.filter(p => !p.err && p.kind === 'V');
  const side = r.pairs.filter(p => !p.err && p.kind === 'H');
  const bad = (list) => list.filter(p => !p.ok && !p.blockedBy);
  const fmt = (p) => `${p.lo}${p.kind === 'V' ? '^' : '>'}${p.hi} ${p.adj ? '' : 'apart '}off ${p.off}`;
  check(`every shaft is drawn stacked, holes within ${ALIGN} of a cell`, bad(vert).length === 0,
    bad(vert).length ? bad(vert).map(fmt).join('  ')
      : `${vert.length} vertical pairs, worst ${Math.max(...vert.filter(p => p.ok).map(p => Math.abs(p.off))).toFixed(2)}`);
  check(`every side exit is drawn edge to edge, floors within ${ALIGN} of a cell`, bad(side).length === 0,
    bad(side).length ? bad(side).map(fmt).join('  ')
      : `${side.length} side pairs, worst ${Math.max(...side.filter(p => p.ok).map(p => Math.abs(p.off))).toFixed(2)}`);
  const held = r.pairs.filter(p => !p.ok && p.blockedBy);
  console.log('  --   overlaps in the world itself (drawn with a route line; the aligned square is taken): '
    + (held.length ? held.map(p => `${p.mover} (by ${p.blockedBy})`).join('  ') : 'none'));
  check('no two rooms overlap anywhere on the board', r.board.length === 0, r.board.join('  ') || 'every room on its own ground');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — every door on the chart opens where the room does'));
  process.exit(fails.length ? 1 : 0);
})();
