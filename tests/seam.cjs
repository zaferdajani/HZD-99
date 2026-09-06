// A ROOM BOUNDARY IS A PLACE SHE WALKS THROUGH, NOT A DOOR SHE PASSES.
//
// tests/cross.cjs proved the CROSSING is a move: the camera carries through,
// the picture she left is pushed off the side she left by, the world keeps
// running underneath. This asks the question one level down — what does she
// actually walk through when it happens?
//
// Measured before this harness existed, every horizontal join in kingdom 1:
//
//     ###########....##      A1|A2, A2|A10, A10|A3, A3|A4, W1|W2, A0|A1
//
// Eleven tiles of solid rock over her head and a four-tile hole punched in
// it. frame() builds a sealed box and openL/openR cuts a doorway. So the
// carry-through was carrying her through a door, and two rooms joined by a
// door are two rooms — the owner's report (2026-08-23) about the map reading
// as "cubicles of rooms connected" rather than "actual world connected".
//
// Three things are measured, and the first one is a correctness bug, not a
// matter of taste:
//
//   1. NO CROSSING LANDS IN ROCK. applyTransition keeps player.y across an
//      L/R crossing — she arrives at the height she left. So a row that is
//      open on the departing side and solid on the arriving side is a jumped
//      crossing that ends with her inside the wall. Both edge columns of
//      every mirrored horizontal exit must agree, row for row. This is
//      checked EVERYWHERE, in every kingdom: it is the invariant that makes
//      an open seam safe, and it is what would break first if someone widened
//      one side of a join and not the other.
//
//   2. THE MEADOW'S SEAMS ARE WALKS. Kingdom 1's surface joins open the whole
//      standing space, not a doorway. A regression back to a four-tile hole
//      fails here rather than being noticed in a screenshot six weeks later.
//
//   3. THE ROOF AND THE GROUND SURVIVE IT. Opening a seam must not open the
//      lid (row 0 carries the kingdom's roof line) or the floor (the bottom
//      two rows are what keeps void off the frame edge — the thing
//      tests/deadend.cjs measures from the other direction).
//
//   node tests/seam.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

// the meadow kingdom's SURFACE rooms — the ones built with frame(), where the
// join is a field running on rather than a tunnel mouth. The caves (CV*) are
// in kingdom 1 too but a cave is allowed rock over her head; what it is not
// allowed is a different amount of it on each side, and that is check 1.
const MEADOW = ['W1', 'W2', 'A0', 'A1', 'A2', 'A10', 'A3', 'A4'];

(async () => {
  console.log('── seam — a room boundary is a place she walks through\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof ROOMS === 'object', { timeout: 20000 });

  const r = await page.evaluate(() => {
    const solid = ch => ch === '#' || ch === 'B';
    const col = (g, x) => g.map(row => row[x]);
    const out = { joins: [], edges: [] };

    for (const [id, def] of Object.entries(ROOMS)) {
      const ex = def.exits || {};
      // only R, so each mirrored pair is measured once
      let to = ex.R;
      if (to && typeof to === 'object') to = to.to;
      if (!to || !ROOMS[to]) continue;
      let back = (ROOMS[to].exits || {}).L;
      if (back && typeof back === 'object') back = back.to;
      if (back !== id) continue;                 // not a mirrored pair; deadend.cjs owns that

      const A = buildRoom(id), B = buildRoom(to);
      // she leaves through A's last column and arrives spanning B's first —
      // player.w is 24 at x=10, so column 0; and x = W-34 on the way back,
      // so column W-1. The edge columns are the ones that meet.
      const ca = col(A, ROOMS[id].w - 1), cb = col(B, 0);
      const rows = Math.min(ca.length, cb.length);
      const bad = [];
      let open = 0;
      // row 0 is the LID and has its own law below — a sky room (skyLid) is
      // open there while a lidded neighbor is not, and no body is ever in
      // row 0 at a seam (the seam opens rows 1..h-3), so the body-agreement
      // rule starts under the roofline
      for (let y = 1; y < rows; y++) {
        const sa = solid(ca[y]), sb = solid(cb[y]);
        if (sa !== sb) bad.push(y + ':' + ca[y] + '|' + cb[y]);
        if (!sa && !sb) open++;
      }
      out.joins.push({ id, to, open, bad, hA: ROOMS[id].h, hB: ROOMS[to].h,
        profA: ca.join(''), profB: cb.join('') });
    }

    // the lid and the ground at every seam column of every room with a side exit
    for (const [id, def] of Object.entries(ROOMS)) {
      const ex = def.exits || {}, g = buildRoom(id), H = def.h, W = def.w;
      for (const side of ['L', 'R']) {
        if (!ex[side]) continue;
        const x = side === 'L' ? 0 : W - 1;
        out.edges.push({ id, side, sky: !!def.sky,
          lid: solid(g[0][x]),
          floor: solid(g[H - 2][x]) && solid(g[H - 1][x]) });
      }
    }

    // THE VERTICAL SEAM: every way UP must be open on BOTH sides. A T
    // crossing keeps her x and arrives at the bottom of the room above — so
    // the lower room's ceiling opening and the upper room's floor must
    // answer each other, or the jump arrives EMBEDDED in the upper floor,
    // hangs on the resolver, and falls back down the shaft (A1|A6 shipped
    // exactly that). '#' is the fault; a 'B' breakable floor is a designed
    // secret, not a wall. X1's arrival is scripted onto its bridge and is
    // excluded on purpose.
    out.vert = [];
    for (const [id, def] of Object.entries(ROOMS)) {
      let up = (def.exits || {}).T, at = null;
      if (up && typeof up === 'object') { at = up.at != null ? up.at : null; up = up.to; }
      if (!up || !ROOMS[up] || up === 'X1') continue;
      const g = buildRoom(id), U = buildRoom(up);
      const uh = ROOMS[up].h, uw = ROOMS[up].w;
      if (at != null) {
        // an arrival-column pair: the answering window is around `at`, and a
        // 'B' breakable there is the cut she made, not a wall
        const bad = [];
        for (let x = Math.floor(at); x <= Math.floor(at) + 1; x++) {
          if (x < uw && (U[uh - 2][x] === '#' || U[uh - 1][x] === '#')) bad.push(x);
        }
        out.vert.push({ id, up, cols: 2, bad });
        continue;
      }
      // the columns she can actually rise through: inside the sky's
      // remembered gap, or wherever the lid is open — not a first-to-last
      // span, which reads two separate openings as one wide one
      const cols = [];
      if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) cols.push(x);
      else for (let x = 1; x < def.w - 1; x++) if (g[0][x] === '.') cols.push(x);
      if (!cols.length) { out.vert.push({ id, up, err: 'T exit with no ceiling opening' }); continue; }
      const bad = cols.filter((x) => x < uw && (U[uh - 2][x] === '#' || U[uh - 1][x] === '#'));
      out.vert.push({ id, up, cols: cols.length, bad });
    }
    return out;
  });

  // ---- 1. no crossing lands in rock ---------------------------------------
  const mismatched = r.joins.filter(j => j.bad.length && j.hA === j.hB);
  check('every mirrored horizontal join agrees on both sides',
    mismatched.length === 0,
    mismatched.length ? mismatched.map(j => `${j.id}|${j.to} ${j.bad.join(' ')}`).join('  ')
      : `${r.joins.length} joins`);

  // rooms of unequal height joined sideways can't agree everywhere; what they
  // must not do is offer an opening the other side answers with rock
  const uneven = r.joins.filter(j => j.hA !== j.hB);
  check('...including the joins between rooms of different heights',
    uneven.every(j => j.bad.length === 0),
    uneven.length ? uneven.map(j => `${j.id}|${j.to}`).join(' ') : 'none in the world');

  // ---- 2. the meadow's seams are walks, not doorways -----------------------
  const meadowJoins = r.joins.filter(j => MEADOW.includes(j.id) && MEADOW.includes(j.to));
  check('every meadow room pair is joined', meadowJoins.length >= 6,
    meadowJoins.map(j => `${j.id}|${j.to}`).join(' '));
  const doorways = meadowJoins.filter(j => j.open < 12);
  check('...and none of them is a doorway (>= 12 rows of standing space)',
    doorways.length === 0,
    doorways.length ? doorways.map(j => `${j.id}|${j.to} only ${j.open}`).join('  ')
      : meadowJoins.map(j => `${j.id}|${j.to}=${j.open}`).join(' '));

  // the crystal cave keeps rock overhead, but a mouth she can jump through
  const caveJoins = r.joins.filter(j => j.id.startsWith('CV') && j.to.startsWith('CV'));
  check('the crystal cave mouths are tunnels, not slots (> 4 rows)',
    caveJoins.length > 0 && caveJoins.every(j => j.open > 4),
    caveJoins.map(j => `${j.id}|${j.to}=${j.open}`).join(' '));

  // ---- 3. the roof and the ground survive it ------------------------------
  // ...unless the room is OPEN SKY (js/world.js skyLid): there the missing lid
  // is the feature, and physics closes the hole instead — no side crossing
  // happens above the roofline (checkTransitions), so a body never walks from
  // open air onto a neighbor's roof
  const noLid = r.edges.filter(e => !e.lid && !e.sky);
  const skyEdges = r.edges.filter(e => e.sky).length;
  check('a seam never opens the lid (sky rooms excepted)', noLid.length === 0,
    noLid.length ? noLid.map(e => e.id + '.' + e.side).join(' ')
                 : `${r.edges.length - skyEdges} lidded + ${skyEdges} open-sky seam columns`);
  const noFloor = r.edges.filter(e => !e.floor);
  check('...and never opens the ground under it', noFloor.length === 0,
    noFloor.length ? noFloor.map(e => e.id + '.' + e.side).join(' ') : 'ground unbroken to every edge');

  // ---- 4. every way up is open on both sides ------------------------------
  const vbad = r.vert.filter(v => v.err || (v.bad && v.bad.length));
  check('every T opening answers through the floor above it', vbad.length === 0,
    vbad.length ? vbad.map(v => v.id + '|' + v.up + (v.err ? ': ' + v.err : ' solid at ' + v.bad.join(','))).join('  ')
                : r.vert.length + ' vertical seams open both ways');

  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — the meadow is joined by ground, not by doors'));
  process.exit(fails.length ? 1 : 0);
})();
