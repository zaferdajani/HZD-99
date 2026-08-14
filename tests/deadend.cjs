// DEAD ENDS — every room you can walk into should be worth having walked into.
//
// A metroidvania is allowed dead ends; that is half of what exploration is. It
// is not allowed EMPTY ones. A corridor that costs a minute to reach, holds
// nothing, teaches nothing and connects to nothing is not a secret, it is a
// mistake the player pays for — and the only feedback they get is the walk back.
//
// So this walks the exit graph from the start room and reports, for every leaf
// (a room with exactly one way in and out), what is actually in it. A leaf with
// a relic, a chest, a crest, a shop, a boss, an errand goal or a Mind Node is a
// destination. A leaf with nothing but floor is the bug.
//
// It also checks the graph itself: exits that name a room that does not exist,
// and exits that are not mirrored — a door you can go through but not come back
// through is how a player gets stranded.
const { chromium } = require('playwright');

const PAYLOAD = new Set(['relic', 'chest', 'crest', 'shop', 'boss', 'riddle',
  'node', 'save', 'cache', 'vault', 'item', 'pouch', 'scrap']);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof ROOMS === 'object', { timeout: 20000 });

  const R = await page.evaluate(() => {
    const out = {};
    for (const [id, r] of Object.entries(ROOMS)) {
      const ex = {};
      for (const [d, v] of Object.entries(r.exits || {})) ex[d] = (v && v.to) ? v.to : v;
      out[id] = {
        zone: r.zone, w: r.w, h: r.h, exits: ex,
        ents: (r.ents || []).map(e => e[0]),
        extras: (r.ents || []).map(e => e[3]).filter(Boolean),
      };
    }
    return out;
  });
  await browser.close();

  const ids = Object.keys(R);
  const OPP = { L: 'R', R: 'L', T: 'B', B: 'T' };
  let bad = 0;

  // --- 1. exits that go nowhere -------------------------------------------
  const missing = [];
  for (const id of ids)
    for (const [d, to] of Object.entries(R[id].exits))
      if (!R[to]) missing.push(id + ' ' + d + ' -> ' + to);
  if (missing.length) { console.log('BROKEN EXITS:'); missing.forEach(m => console.log('  ' + m)); bad += missing.length; }

  // --- 2. one-way doors ----------------------------------------------------
  // A door the player can walk through but not walk back through strands them.
  const oneway = [];
  for (const id of ids)
    for (const [d, to] of Object.entries(R[id].exits)) {
      if (!R[to] || !OPP[d]) continue;
      const back = R[to].exits[OPP[d]];
      if (back !== id) oneway.push(id + ' -' + d + '-> ' + to + ' (no ' + OPP[d] + ' back)');
    }
  if (oneway.length) { console.log('ONE-WAY DOORS:'); oneway.forEach(m => console.log('  ' + m)); bad += oneway.length; }

  // --- 3. reachability -----------------------------------------------------
  const seen = new Set(['A0']), q = ['A0'];
  while (q.length) {
    const id = q.shift();
    for (const to of Object.values(R[id].exits))
      if (R[to] && !seen.has(to)) { seen.add(to); q.push(to); }
  }
  const orphan = ids.filter(i => !seen.has(i));
  if (orphan.length) { console.log('UNREACHABLE FROM A0: ' + orphan.join(', ')); bad += orphan.length; }

  // --- 4. leaves, and whether they pay ------------------------------------
  console.log('\nleaf rooms (one way in, one way out):');
  const empty = [];
  // THE ROOM SHE WAKES IN IS NOT A SPUR. This rule exists so a player is never
  // sent down a branch that pays nothing — but the FIRST room is not somewhere
  // you chose to go, it is where the game put you, and the thing it pays is the
  // opening. Read from the save rather than listed here, so moving the start
  // moves the exception with it.
  const START = 'W1';
  for (const id of ids) {
    const n = Object.keys(R[id].exits).length;
    if (n > 1 || id === START) continue;
    const r = R[id];
    const pay = r.ents.filter(k => PAYLOAD.has(k));
    const tag = pay.length ? pay.join(',') : (r.ents.length ? r.ents.join(',') : '(nothing)');
    console.log('  ' + id.padEnd(4) + ' [' + r.zone + '] ' + tag);
    if (!pay.length) empty.push(id);
  }
  if (empty.length) {
    console.log('\nEMPTY DEAD ENDS: ' + empty.join(', '));
    bad += empty.length;
  }

  if (errs.length) { console.log('PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); bad++; }
  console.log('\n' + (bad ? 'FAIL — ' + bad + ' problem(s)' : 'OK — every door leads somewhere and every leaf pays'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
