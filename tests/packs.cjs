// CAMPAIGN PACKS: a folder of JSON is a playable campaign, and the base game
// cannot tell packs exist until the query string says so.
//
//   1. Without ?pack= — PACK is inert, no pack room in ROOMS, save key normal.
//   2. With ?pack=demo — the pack loads, its rooms register, a new game starts
//      at the pack's own bench, both rooms build and cross, the machine wakes.
//   3. The seam law binds pack rooms too: both sides of P1|P2 agree per row.
//   4. A malformed room is refused with a reason, not registered broken.
//   5. The pack's save lives under its own key (rule 2 in js/packs.js).
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const fails = [];
  const ok = (cond, what) => { console.log((cond ? '  ok  ' : '  FAIL ') + what); if (!cond) fails.push(what); };

  // — 1: the base game does not know —
  let p = await br.newPage({ viewport: { width: 960, height: 540 } });
  const errs1 = []; p.on('pageerror', (e) => errs1.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3000);
  const base = await p.evaluate(() => ({
    id: PACK.id, room: typeof ROOMS.P1, key: saveKeyFor('robo'),
  }));
  ok(base.id === null, 'no query string: pack inert');
  ok(base.room === 'undefined', 'no query string: no pack room in ROOMS');
  ok(!base.key.includes('_pk_'), 'no query string: save key untouched');
  ok(errs1.length === 0, 'base boot clean' + (errs1.length ? ': ' + errs1[0] : ''));
  await p.close();

  // — 2..5: the demo pack —
  p = await br.newPage({ viewport: { width: 960, height: 540 } });
  const errs2 = []; p.on('pageerror', (e) => errs2.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html?pack=demo');
  await p.waitForFunction(() => PACK.ready || PACK.err, { timeout: 15000 });
  const st = await p.evaluate(() => {
    if (PACK.err) return { err: PACK.err };
    const out = { err: null, rooms: !!(ROOMS.P1 && ROOMS.P2), key: saveKeyFor('robo') };
    startGame(newSave(0));
    out.startRoom = G.roomId;
    out.floor = G.grid[15][5]; out.air = G.grid[5][5];
    // the seam law, measured on the pack's own boundary
    const a = buildRoom('P1'), b = buildRoom('P2');
    out.seam = true;
    for (let y = 1; y <= 14; y++) {
      if ((a[y][ROOMS.P1.w - 1] === '#') !== (b[y][0] === '#')) out.seam = false;
    }
    loadRoom('P2'); G.state = 'PLAY';
    out.p2Enemies = G.enemies.length;
    out.crest = G.grid[12][17];              // the heap's top: real material
    loadRoom('P1');
    out.backRoom = G.roomId;
    // a malformed room is refused, not registered
    out.refused = packApply({ id: 'x', rooms: { BAD: { w: 5, h: 5, grid: ['##'] } } }).length;
    out.badKept = typeof ROOMS.BAD;
    return out;
  });
  ok(!st.err, 'pack fetched and applied' + (st.err ? ': ' + st.err : ''));
  if (!st.err) {
    ok(st.rooms, 'P1 and P2 registered in ROOMS');
    ok(st.key.includes('_pk_demo'), 'pack save isolated under its own key');
    ok(st.startRoom === 'P1', 'new game starts at the pack bench (' + st.startRoom + ')');
    ok(st.floor === '#' && st.air === '.', 'grid rows stamped as authored');
    ok(st.seam, 'P1|P2 seam agrees on every row');
    ok(st.p2Enemies >= 1, 'the crawler wakes in P2 (' + st.p2Enemies + ')');
    ok(st.crest === '#', 'the heap is material, one tile per column');
    ok(st.backRoom === 'P1', 'crossing back works');
    ok(st.refused === 1 && st.badKept === 'undefined', 'malformed room refused with a reason');
  }
  ok(errs2.length === 0, 'pack session clean' + (errs2.length ? ': ' + errs2[0] : ''));
  await p.close();

  await br.close();
  if (fails.length) { console.log('FAILED: ' + fails.join(' | ')); process.exit(1); }
  console.log('packs: a folder of JSON is a campaign, and the base game never knew');
})();
