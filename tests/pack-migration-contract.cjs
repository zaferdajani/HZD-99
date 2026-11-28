const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const src = fs.readFileSync('js/story-opening.js', 'utf8');
function functionSource(name) {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

const box = {};
vm.runInNewContext(`const PACK_SAVE_VERSION = 1; ${functionSource('migratePack')}; this.migratePack = migratePack;`, box);
const migrate = box.migratePack;

const clean = { storyVersion: 3, flags: {}, arms: [] };
migrate(clean);
assert.equal(clean.packVersion, 1);
assert.deepEqual(clean.arms, []);

const pack = { storyVersion: 3, flags: {}, arms: ['pack'] };
migrate(pack);
assert.equal(pack.packLv, 1, 'an earned Pack remains the first rung');

const legacyRide = { storyVersion: 3, flags: { wolfMount: 1 }, arms: [] };
migrate(legacyRide);
assert.ok(legacyRide.arms.includes('pack'));
assert.equal(legacyRide.packLv, 3, 'a legacy rider keeps the called Alpha prerequisite');
assert.equal(legacyRide.flags.alphaRide, 1, 'a legacy rider keeps the ride capability');
const once = JSON.stringify(legacyRide);
migrate(legacyRide);
assert.equal(JSON.stringify(legacyRide), once, 'migration is idempotent');

const hero = { theme: 'hero', flags: { wolfMount: 1 }, arms: [] };
migrate(hero);
assert.equal(hero.packVersion, undefined, 'NOSTOS is not migrated onto robot Pack rules');

const call = src.indexOf('migratePack(save);');
const early = src.indexOf('if ((save.storyVersion | 0) >= STORY_VERSION) return save;');
assert.ok(call >= 0 && call < early, 'Pack migration runs even for current-story saves');
console.log('PASS legacy Pack and mount saves retain earned capability exactly once');
