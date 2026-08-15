// EVERY ERRAND MUST BE FINISHABLE.
//
// `lumen_light` asked for a beacon lens. The lens was not placed anywhere in the
// world. The quest could be accepted and could never be completed, and nothing
// would ever have said so — a fetch goal is checked against the player's bag,
// and an item that does not exist simply never arrives. It reads, in play, as
// "I must have missed it somewhere", which is the worst possible failure: it
// sends the player looking for something that is not there.
//
// It shipped that way because the two halves live in different files and
// nothing compared them. This compares them, on every run, for every kind of
// errand there is.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof QUESTS !== 'undefined' && typeof ROOMS === 'object', { timeout: 30000 });

  const r = await p.evaluate(() => {
    // where everything in the world actually is
    const items = {}, foes = {}, npcs = {};
    for (const id of Object.keys(ROOMS)) {
      const R = ROOMS[id]; if (!R || !R.ents) continue;
      for (const e of R.ents) {
        if (e[0] === 'item') (items[e[3]] = items[e[3]] || []).push(id);
        // the crystal pillar is a fetch SOURCE too: quarrying it (the
        // supercharged claw) is what puts its shard in the bag — the item is
        // real, it just is not lying on the floor
        if (e[0] === 'pillar') (items[e[3] || 'cshard'] = items[e[3] || 'cshard'] || []).push(id);
        else if (e[0] === 'npc') (npcs[e[3]] = npcs[e[3]] || []).push(id);
        else (foes[e[0]] = foes[e[0]] || []).push(id);
      }
    }
    return {
      items, npcs,
      foeCounts: Object.fromEntries(Object.entries(foes).map(([k, v]) => [k, v.length])),
      rooms: Object.keys(ROOMS),
      quests: QUESTS.map(q => ({ ...q })),
    };
  });
  await b.close();

  const fails = [], lines = [];
  for (const q of r.quests) {
    let state = '';
    if (!r.npcs[q.npc]) fails.push(q.id + ': asked by "' + q.npc + '", who is not placed in any room');
    if (q.kind === 'fetch') {
      const where = r.items[q.item];
      state = 'fetch ' + q.item + ' -> ' + (where ? where.join(',') : 'NOWHERE');
      if (!where) fails.push(q.id + ': asks for item "' + q.item + '", which is not placed in any room — the errand can never be finished');
      else if (where.length > 1) fails.push(q.id + ': item "' + q.item + '" is placed in ' + where.length + ' rooms (' + where.join(',') + ') — a fetch goal must exist in exactly one place');
    } else if (q.kind === 'cull') {
      const n = r.foeCounts[q.foe] | 0;
      state = 'cull ' + q.count + ' x ' + q.foe + ' -> ' + n + ' authored in the world';
      // culls count across the whole run, so the world only has to contain enough
      // for the errand to be finishable at all
      if (n < q.count) fails.push(q.id + ': asks for ' + q.count + ' ' + q.foe + ' kills but only ' + n + ' exist in the entire game');
    } else if (q.kind === 'reach') {
      state = 'reach ' + q.room + ' -> ' + (r.rooms.includes(q.room) ? 'exists' : 'NO SUCH ROOM');
      if (!r.rooms.includes(q.room)) fails.push(q.id + ': asks you to reach "' + q.room + '", which is not a room');
    }
    lines.push('  ' + q.id.padEnd(14) + ' [' + q.zone + ']  ' + state);
  }

  // and the reverse: an item placed in the world that no errand ever asks for is
  // a pickup the player collects, is told they got, and can never spend
  const wanted = new Set(r.quests.filter(q => q.kind === 'fetch').map(q => q.item));
  for (const it of Object.keys(r.items))
    if (!wanted.has(it)) fails.push('item "' + it + '" is placed in ' + r.items[it].join(',') + ' but no errand asks for it');

  console.log('errands:\n' + lines.join('\n'));
  console.log('\nquest items in the world: ' + (Object.keys(r.items).join(', ') || 'none'));

  if (errs.length) fails.push('page errors: ' + errs.slice(0, 2).join(' | '));
  if (fails.length) { console.log('\nFAIL\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('\nOK — every errand has a reachable goal');
})();
