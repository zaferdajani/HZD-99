// CHAPTER ONE NEVER GOES FLAT (owner's order, 2026-11-14, hook review item 5:
// "something new every few minutes: a verb, an enemy type, a place or a secret").
//
// The critique this guards against is the one made of Hollow Knight by Ori's
// director: when the next room seems to offer nothing new, the controller goes
// down. tools/cadence.cjs walks the chapter's critical path and lists, room by
// room, what she has not met before. The rule held here:
//   - no two rooms in a row with nothing new;
//   - a room with nothing new is a BREATH, and has to earn it: it holds a save
//     point and the very next room is a guardian or the sage;
//   - the first three rooms each teach something AND show something.
// A save point is never counted as "new": a rest is a rest.
const { cadence } = require('../tools/cadence.cjs');
(async () => {
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const R = await cadence('http://127.0.0.1:8220/index.html');
  for (const r of R.rows) console.log('  ' + (r.flat ? '·' : '+') + ' ' + r.id.padEnd(5) + (r.fresh.length ? r.fresh.join(', ') : '(nothing new)') + (r.rest ? '   [save point]' : ''));
  console.log('');
  check('every room on the path exists', R.rows.every(r => !r.missing), R.rows.filter(r => r.missing).map(r => r.id).join(','));
  check('no two rooms in a row with nothing new', R.gaps.length === 0, R.gaps.join(','));
  const unearned = R.rows.filter((r, i) => r.flat && !(r.rest && R.rows[i + 1] && R.rows[i + 1].guard)).map(r => r.id);
  check('a room with nothing new is a breath before a guardian, with a save point in it', unearned.length === 0, unearned.join(',') || R.flat.join(',') + ' (earned)');
  const kinds = (r) => ({ lesson: r.fresh.some(f => /^lesson /.test(f)), other: r.fresh.some(f => !/^lesson /.test(f)) });
  const open3 = R.rows.slice(0, 3).map(kinds);
  check('each of the first three rooms teaches something and shows something', open3.every(k => k.lesson && k.other), JSON.stringify(open3));
  const a0 = R.rows.find(r => r.id === 'A0').fresh;
  check('the first room past the gates holds the glimpse and the prize', a0.includes('NULLFANG glimpsed') && a0.includes('the prize out of reach'));
  const firstFoe = R.rows.findIndex(r => r.fresh.some(f => /^machine /.test(f))), firstPerson = R.rows.findIndex(r => r.fresh.some(f => /^person /.test(f)));
  check('she meets something to fight before she meets someone to listen to', firstFoe >= 0 && firstFoe < firstPerson, R.rows[firstFoe].id + ' before ' + R.rows[firstPerson].id);
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — every room on the way gives her something she has not met');
})().catch(e => { console.error(e); process.exit(1); });
