// WHAT IS NEW IN EACH ROOM — chapter one's cadence, measured off the world list.
//
// Owner's order, 2026-11-14 (hook review, item 5: "something new every few
// minutes: a verb, an enemy type, a place or a secret. Fill the gaps"). The
// critique this answers is the one made of Hollow Knight by Ori's director:
// when the next room seems to offer nothing new, the controller goes down.
//
// It walks the chapter's critical path in order and, for each room, lists what
// she has not met before: a lesson, a machine kind, a person, a guardian, a
// hazard, a kind of secret, a save point, a place (a new backdrop or a cave).
// A room that adds nothing is FLAT; two flat rooms in a row is a GAP.
//
//   node tools/cadence.cjs            (needs the repo served on :8220)
//   node tools/cadence.cjs --json     machine-readable, for tests/cadence.cjs
const { chromium } = require('playwright');
// the road the chapter sends her down (docs/CHAPTER_ONE_WALKTHROUGH.md)
const PATH = ['W1', 'W2', 'A0', 'A0B', 'A1', 'A2', 'A5', 'CV1', 'CV1B', 'CV2', 'CV3', 'GA1T', 'GA1D', 'A8', 'A9', 'A3', 'A4'];
async function cadence(url) {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto(url || 'http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const rows = await p.evaluate((PATH) => {
    const seen = new Set(), rows = [];
    const first = (k) => { if (seen.has(k)) return false; seen.add(k); return true; };
    const lessons = {}; for (const s of TUT_STEPS) { const r = s.room || s.at; if (r) (lessons[r] = lessons[r] || []).push(s.id); }
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.flags.woke = 1; startGame(sv);
    for (const id of PATH) {
      const d = ROOMS[id]; if (!d) { rows.push({ id, missing: true, fresh: [] }); continue; }
      const g = buildRoom(id), fresh = []; let rest = false;
      for (const l of lessons[id] || []) if (first('lesson:' + l)) fresh.push('lesson ' + l);
      // (the walk's first foe is spawned by loadRoom, not listed)
      if (id === 'W2' && first('foe:mite')) fresh.push('machine mite');
      for (const e of d.ents || []) {
        const k = e[0];
        if (EKIND[k]) { const name = id === 'A0' && k === 'crawler' ? 'winch' : k; if (first('foe:' + name)) fresh.push('machine ' + name); }
        else if (k === 'npc') { if (first('npc:' + e[3])) fresh.push('person ' + e[3]); }
        else if (k === 'boss') { if (first('boss:' + e[3])) fresh.push('guardian ' + e[3]); }
        else if (k === 'sage') { if (first('sage')) fresh.push('the sage'); }
        // (a save point is a breath, not something new: it is noted, never counted)
        else if (k === 'bench') { rest = true; }
        else if (k === 'riddle') { if (first('node')) fresh.push('mind node'); }
        else if (k === 'chest') { if (first('chest:' + e[3])) fresh.push('chest ' + e[3]); }
        else if (k === 'mod') { if (first('mod:' + e[3])) fresh.push('ability ' + e[3]); }
        // every terminal is its own log: a piece of the story she has not read
        else if (k === 'term') { if (first('term:' + id)) fresh.push('a log to read'); }
        else if (k === 'pillar') { if (first('pillar')) fresh.push('the marble'); }
        else if (k === 'plat') { if (first('plat')) fresh.push('moving platform'); }
        else if (k === 'saw') { if (first('saw')) fresh.push('saw rig'); }
        else if (k === 'secret') { if (first('secret')) fresh.push('hidden relic'); }
        else if (k === 'item') { if (first('item:' + e[3])) fresh.push('errand item ' + e[3]); }
      }
      let spikes = false, wall = false, floor = false;
      for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
        const ch = g[y][x];
        if (ch === '^') spikes = true;
        if (ch === 'B') { if (y >= g.length - 3 || (y + 1 < g.length && g[y + 1][x] === '.')) floor = true; else wall = true; }
      }
      if (spikes && first('hazard:spikes')) fresh.push('spike rail');
      if (wall && first('secret:wall')) fresh.push('hollow wall');
      if (floor && first('secret:floor')) fresh.push('hollow floor');
      if (d.cave && first('place:cave')) fresh.push('the caves');
      if (d.indoor && first('place:indoor:' + id)) fresh.push('an interior');
      const zoneKey = 'place:zone:' + d.zone + (d.cave ? ':cave' : '');
      if (first(zoneKey) && !d.cave) fresh.push('kingdom ' + d.zone);
      const gates = typeof GATE_ROOM !== 'undefined' ? [].concat(GATE_ROOM[id] || []) : [];
      if (gates.length && first('door')) fresh.push('a door into the backdrop');
      if (gates.some(q => q && q.rubble) && first('rubble')) fresh.push('a buried cave mouth to break open');
      // a room three screens tall is a different kind of room: the first climb
      if (d.h >= 20 && first('climb')) fresh.push('a climb');
      for (const side of ['T', 'B', 'L', 'R']) { const v = (d.exits || {})[side]; if (v && typeof v === 'object' && v.flag && first('ward')) fresh.push('a sealed way'); }
      if (id === 'A0' && first('glimpse')) fresh.push('NULLFANG glimpsed');
      if (id === 'A0' && first('prize')) fresh.push('the prize out of reach');
      if (id === 'A2' && first('meet')) fresh.push('NULLFANG met');
      const ex = d.exits || {};
      if ((ex.T || ex.B) && first('vertical')) fresh.push('a way up or down');
      const guard = (d.ents || []).some(e => e[0] === 'boss' || e[0] === 'sage');
      rows.push({ id, w: d.w, fresh, rest, guard });
    }
    return rows;
  }, PATH);
  await b.close();
  let run = 0; const gaps = [];
  for (const r of rows) { r.flat = !r.fresh.length; run = r.flat ? run + 1 : 0; if (run >= 2) gaps.push(r.id); }
  return { path: PATH, rows, flat: rows.filter(r => r.flat).map(r => r.id), gaps };
}
module.exports = { cadence, PATH };
if (require.main === module) cadence().then(R => {
  if (process.argv.includes('--json')) { console.log(JSON.stringify(R, null, 1)); return; }
  console.log('chapter one, room by room — what she has not met before\n');
  for (const r of R.rows) console.log('  ' + (r.flat ? '·' : '+') + ' ' + r.id.padEnd(5) + (r.fresh.length ? r.fresh.join(', ') : '(nothing new)') + (r.rest ? '   [save point]' : ''));
  console.log('\nflat rooms: ' + (R.flat.join(', ') || 'none') + '\ngaps (two flat in a row): ' + (R.gaps.join(', ') || 'none'));
}).catch(e => { console.error(e); process.exit(1); });
