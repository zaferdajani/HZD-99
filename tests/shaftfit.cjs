// A SHAFT IS ONE HOLE CUT THROUGH TWO ROOMS.
//
// A vertical crossing keeps her x (applyTransition), so the opening in the
// floor of the room above and the opening in the ceiling of the room below
// are the same columns or one of them is a trap. tests/seam.cjs already
// proves the way UP: every column of a ceiling opening is open in the floor
// above it. This proves the other three things that went wrong while that
// check stayed green:
//
//   1. THE WAY DOWN. Four upper rooms (A9, B8, C7, D5) cut their drop one
//      column wider than the ceiling hole under it. Falling down the extra
//      column put her inside the lower room's roof. So: every column open
//      through an upper room's floor is open in the lower room's lid — and
//      the two openings are equal, column for column.
//
//   2. NO SKY UNDER ROCK. A1, A2 and A3 are open-sky rooms, but A6, A8 and
//      B1 stand on top of them. She saw sky overhead and climbed into a slab.
//      Wherever the room above has solid floor, the sky room below has rock
//      in its lid (js/world.js skyUnder) — and wherever that floor is open,
//      the lid is open too, so a drop from above never lands inside it.
//
//   3. A ROOM IS AS WIDE AS IT IS BUILT. C1 was declared 32 wide and walled
//      at 29, which left a two-column strip of void behind its east wall —
//      and a hole punched in B3's floor to "answer" the void's open lid. An
//      edge column that is open from the lid to the bottom row is not a
//      seam or a door; it is the outside of the room showing.
//
//   node tests/shaftfit.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── shaftfit — a shaft is one hole cut through two rooms\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof ROOMS === 'object' && typeof buildRoom === 'function', { timeout: 20000 });

  const r = await page.evaluate(() => {
    const solid = ch => ch === '#' || ch === 'B';
    const pairs = [], skies = [], strips = [];
    for (const [id, def] of Object.entries(ROOMS)) {
      let up = (def.exits || {}).T, at = null;
      if (up && typeof up === 'object') { at = up.at != null ? up.at : null; up = up.to; }
      if (!up || !ROOMS[up] || at != null) continue;   // an arrival column is a scripted pair
      const g = buildRoom(id), U = buildRoom(up), uh = U.length, uw = U[0].length;
      // the lower room's way up: the authored opening (a sky room remembers it
      // in tGap before its lid is opened), otherwise its open lid columns
      const lower = [];
      if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) lower.push(x);
      else for (let x = 1; x < g[0].length - 1; x++) if (!solid(g[0][x])) lower.push(x);
      // the upper room's way down: columns open through BOTH floor rows,
      // walls excluded. 'B' counts as open — it is a hatch she cuts and falls through
      const upper = [];
      for (let x = 1; x < uw - 1; x++)
        if (U[uh - 1][x] !== '#' && U[uh - 2][x] !== '#') upper.push(x);
      // ...and where each of those lands in the room below: never in its lid
      const landsInRock = upper.filter(x => x >= g[0].length || solid(g[0][x]));
      // an upper floor may hold more than one hole (A6 keeps a one-way drop
      // beside its climb); the hole that IS this shaft is the run of open
      // columns the way up arrives in, and that run must be the way up exactly
      const runs = [];
      for (const x of upper) {
        const last = runs[runs.length - 1];
        if (last && x === last[last.length - 1] + 1) last.push(x); else runs.push([x]);
      }
      const shaft = [].concat(...runs.filter(run => run.some(x => lower.includes(x))));
      pairs.push({ id, up, lower: lower.join(','), upper: shaft.join(','), landsInRock,
        equal: lower.length > 0 && lower.join(',') === shaft.join(',') });
      // sky under a room: every column the room above floors in solid rock
      // has rock in this lid
      if (def.sky) {
        const span = Math.min(g[0].length, uw);
        const open = [];
        for (let x = 0; x < span; x++) if (U[uh - 1][x] === '#' && !solid(g[0][x])) open.push(x);
        skies.push({ id, up, span, open });
      }
    }
    // edge columns open from lid to floor: void, not room
    for (const [id, def] of Object.entries(ROOMS)) {
      if (def.cave) continue;                         // caves carve their own outline
      const g = buildRoom(id), H = g.length, W = g[0].length;
      for (const x of [0, 1, W - 2, W - 1]) {
        let open = true;
        for (let y = 0; y < H && open; y++) if (solid(g[y][x]) || g[y][x] === '=') open = false;
        if (open) strips.push(id + ':' + x);
      }
      if (W !== def.w || H !== def.h) strips.push(id + ' grid ' + W + 'x' + H + ' vs def ' + def.w + 'x' + def.h);
    }
    return { pairs, skies, strips };
  });

  const unequal = r.pairs.filter(p => !p.equal);
  check('every shaft is the same columns at both ends', unequal.length === 0,
    unequal.length ? unequal.map(p => `${p.id}|${p.up} up ${p.lower} vs down ${p.upper}`).join('  ')
      : r.pairs.length + ' vertical pairs');
  const trap = r.pairs.filter(p => p.landsInRock.length);
  check('no drop from above lands inside the roof below', trap.length === 0,
    trap.length ? trap.map(p => `${p.up}->${p.id} cols ${p.landsInRock.join(',')}`).join('  ') : 'every drop lands in air');
  const skyRock = r.skies.filter(s => s.open.length);
  check('no open sky under another room\'s floor', skyRock.length === 0,
    skyRock.length ? skyRock.map(s => `${s.id} under ${s.up}: sky at ${s.open.join(',')}`).join('  ')
      : r.skies.map(s => `${s.id} under ${s.up} (cols 0-${s.span - 1} roofed)`).join('  ') || 'no sky room has a room above');
  check('every room is as wide as it is built', r.strips.length === 0,
    r.strips.length ? r.strips.join('  ') : 'no void strip at any edge');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — every shaft is one hole, and nothing hangs over open sky'));
  process.exit(fails.length ? 1 : 0);
})();
