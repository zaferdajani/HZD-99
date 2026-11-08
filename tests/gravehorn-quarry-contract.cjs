// Source/state contract only. Rendered timing, reachability and the legitimate
// fight still belong to gravehorn.cjs and the uninterrupted campaign lane.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const src = fs.readFileSync('js/entities.js', 'utf8');
const start = src.indexOf('function pillarRewardReady(');
const end = src.indexOf('\n}\n', start) + 3;
assert(start >= 0 && end > start, 'pillarRewardReady source missing');
const ctx = vm.createContext({ G: { save: null, roomId: null } });
vm.runInContext(src.slice(start, end), ctx);

const pillar = { type: 'pillar' };
assert.equal(ctx.pillarRewardReady(pillar, { flags: {} }, 'CV3'), false,
  'marble became available while Gravehorn still owns CV3');
assert.equal(ctx.pillarRewardReady(pillar, { flags: { bossHorn: 1 } }, 'CV3'), true,
  'legitimate retreat did not release the marble');
assert.equal(ctx.pillarRewardReady({ type: 'pillar', extra: 'other' }, { flags: {} }, 'CV3'), true,
  'the story gate leaked onto an unrelated pillar reward');
assert.equal(ctx.pillarRewardReady(pillar, { flags: {} }, 'A5'), true,
  'the CV3 story gate leaked into another room');

const loop = src.slice(
  src.indexOf('for (let i = G.statics.length - 1'),
  src.indexOf("if (hasSkill('wave'))", src.indexOf('for (let i = G.statics.length - 1'))
);
assert(loop.indexOf('if (!pillarRewardReady(s)) continue;') >= 0,
  'charged burst does not consult the Gravehorn quarry gate');
assert(loop.indexOf('if (!pillarRewardReady(s)) continue;') < loop.indexOf('G.statics.splice(i, 1)'),
  'the quarry gate runs only after the pillar is already removed');
assert(loop.indexOf('if (!pillarRewardReady(s)) continue;') < loop.indexOf("questTake('cshard')"),
  'the quarry gate runs only after the marble is already awarded');

const migration = fs.readFileSync('js/gravehorn.js', 'utf8');
assert(/sv\.flags\.pl_cshard[^\n]+sv\.flags\.bossHorn\s*=\s*1/.test(migration),
  'migration no longer exposes why illicit marble would erase the boss on reload');

console.log('PASS CV3 marble remains visible but unrewarded until Gravehorn legitimately retreats');
