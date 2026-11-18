// NO LIGHT ROUND A BODY — NOT EVEN PAINTED ON ITS PLATE.
// Owner, four times: "Why still framed with light ?!!!" The engine's rim was removed on
// 2026-11-16 and the cheetah still wore one: its standing plate was FIRED with a cyan rim
// light down its back and tail (12% of its outer edge cyan, 1% of its inside), while its
// filmed walk had none. tests/contrast.cjs watches what the engine draws; nothing watched
// the pictures. tools/defringe.cjs measures every keyed plate under assets/characters:
//   A  no plate's outer edge is cyan where its inside is not (5% of the edge, 3x the inside)
//   B  the ones the sweep found and cleaned stay clean: the cheetah's three poses, the guard's
//      walk, the roster sheet the blob and the turrets are cut from
//   C  the plates that are cyan BY DESIGN are still cyan: the cleaning is not a blanket desaturate
const path = require('path');
const { run, isRim, LEAVE, walk, ROOT } = require('../tools/defringe.cjs');
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null && d !== '' ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── no-rim-baked — no plate is framed with light it was painted with');
  const R = (await run(walk(path.join(ROOT, 'assets/characters'), []).sort(), false)).filter(r => r.before);
  const pc = v => (v * 100).toFixed(1) + '%', by = {}; for (const r of R) by[r.file] = r.before;
  const rims = R.filter(r => isRim(r.before) && !LEAVE.test('/' + r.file));
  check('A  no keyed plate wears a cyan rim on its outer edge', R.length >= 250 && rims.length === 0, rims.length ? rims.map(r => r.file + ' ' + pc(r.before.edge) + ' edge / ' + pc(r.before.inside) + ' inside') : R.length + ' plates');
  const FOUND = ['assets/characters/beasts/cheetah.webp', 'assets/characters/beasts/cheetah_warn.webp', 'assets/characters/beasts/cheetah_run.webp', 'assets/characters/roster/guard_walk8.webp', 'assets/characters/roster_8yaw.webp'];
  check('B  the cheetah, the guard and the roster sheet stay clean (under 3% of the edge)', FOUND.every(f => by[f] && by[f].edge < 0.03), FOUND.map(f => path.basename(f) + ' ' + (by[f] ? pc(by[f].edge) : 'missing')).join('  '));
  const DESIGN = ['assets/characters/eye/lattice.webp', 'assets/characters/agents/tally/pure.webp', 'assets/characters/sage/pure.webp'];
  check('C  what is cyan by design is still cyan', DESIGN.every(f => by[f] && by[f].inside > 0.05), DESIGN.map(f => path.basename(path.dirname(f)) + '/' + path.basename(f) + ' ' + (by[f] ? pc(by[f].inside) + ' inside' : 'missing')).join('  '));
  if (bad) { console.log('\nFAILED: ' + bad + '  (node tools/defringe.cjs --all, then look at each plate)'); process.exit(1); }
  console.log('\nOK — ' + R.length + ' plates, none framed with light');
})().catch(e => { console.error(e); process.exit(1); });
