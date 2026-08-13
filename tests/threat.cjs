// THREAT PER SCREEN — the budget metric this game can actually use.
//
// A flat "N threat per room" ceiling is the standard answer and it is wrong
// here, because CLAWBYTE's rooms are not the same size: they run from 22 tiles
// wide to 60, nearly three to one. Four machines spread down a 60-tile hall and
// four machines in a 22-tile box are the same number and completely different
// encounters, and the player never experiences a room — they experience a
// SCREEN, 960 px of it, which is thirty tiles.
//
// So this measures the worst 30-tile window in every room: slide a viewport
// across the room and report the highest threat total it ever contains. That is
// the number a player actually meets, and it is the one worth budgeting.
//
// Roles and threat values come from docs/combat/GLOBAL_REGISTRY.md §4.
const { chromium } = require('playwright');

const THREAT = { crawler: 1, hopper: 1, flier: 2, turret: 2, blob: 2, guard: 3 };
const ROLE = { crawler: 'pressure', hopper: 'pressure', flier: 'disruptor', turret: 'zoner', blob: 'denial', guard: 'anchor' };
const SCREEN_TILES = 30;          // 960 px at TILE = 32

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof ROOMS === 'object', { timeout: 30000 });

  const rooms = await p.evaluate(({ THREAT, SCREEN_TILES }) => {
    const out = [];
    for (const id of Object.keys(ROOMS)) {
      const R = ROOMS[id];
      if (!R || !R.ents) continue;
      const foes = R.ents
        .filter(e => THREAT[e[0]] != null)
        .map(e => ({ kind: e[0], tx: e[1], v: THREAT[e[0]] }));
      const total = foes.reduce((s, f) => s + f.v, 0);
      // worst 30-tile window, anchored on each enemy in turn
      let peak = 0, peakAt = 0, peakSet = [];
      for (const anchor of foes) {
        const win = foes.filter(f => f.tx >= anchor.tx && f.tx < anchor.tx + SCREEN_TILES);
        const s = win.reduce((a, f) => a + f.v, 0);
        if (s > peak) { peak = s; peakAt = anchor.tx; peakSet = win.map(f => f.kind); }
      }
      out.push({ id, zone: R.zone, w: R.w, total, peak, peakAt, peakSet, kinds: foes.map(f => f.kind) });
    }
    return out;
  }, { THREAT, SCREEN_TILES });
  await b.close();

  const zones = {};
  for (const r of rooms) (zones[r.zone] = zones[r.zone] || []).push(r);

  console.log('worst 30-tile window per room  (room total in brackets)\n');
  const peaks = [];
  for (const z of Object.keys(zones).sort()) {
    const rs = zones[z].sort((a, b) => a.id.localeCompare(b.id));
    console.log('ZONE ' + z);
    for (const r of rs) {
      const rest = r.total === 0 ? '   rest beat' : '';
      console.log('  ' + r.id.padEnd(4) + ' w=' + String(r.w).padEnd(3) +
        ' peak ' + String(r.peak).padStart(2) + ' [' + String(r.total).padStart(2) + ']  ' +
        (r.peakSet.length ? r.peakSet.map(k => k + '(' + ROLE[k] + ')').join(' + ') : '—') + rest);
      if (r.total > 0) peaks.push(r.peak);
    }
    console.log('');
  }

  peaks.sort((a, b) => a - b);
  const med = peaks[Math.floor(peaks.length / 2)];
  const p90 = peaks[Math.floor(peaks.length * 0.9)];
  console.log('across ' + peaks.length + ' fighting rooms: median peak ' + med + ', 90th percentile ' + p90 + ', max ' + peaks[peaks.length - 1]);

  // ---- the audits that are worth failing on -------------------------------
  const fails = [], warns = [];
  for (const r of rooms) {
    // registry §6.1 — two disruptors together removes player agency
    const dis = r.peakSet.filter(k => ROLE[k] === 'disruptor').length;
    if (dis >= 2) fails.push(r.id + ': ' + dis + ' disruptors inside one screen — removes player agency (registry §6.1)');
    // a room that is a big outlier against the game's own distribution
    if (r.peak > p90 + 2) warns.push(r.id + ': peak ' + r.peak + ' is well above the 90th percentile (' + p90 + ')');
  }
  // rest beats: every zone needs at least one 0-threat room, and the room
  // before a boss door should be one
  for (const z of Object.keys(zones)) {
    if (!zones[z].some(r => r.total === 0)) warns.push('zone ' + z + ' has no rest beat at all');
  }

  if (warns.length) console.log('\nWARN\n - ' + warns.join('\n - '));
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  if (errs.length) { console.log('\nFAIL - page errors: ' + errs[0]); process.exit(1); }
  console.log('\nOK');
})();
