// The owner made Alpha an optional side quest. Keep the living script and
// route declarations aligned so no future handoff puts it before NULLFANG.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const story = fs.readFileSync('docs/STORY_SCRIPT.md', 'utf8');
const caves = fs.readFileSync('docs/CAVES_CH1.md', 'utf8');
const game = fs.readFileSync('js/game.js', 'utf8');
const world = fs.readFileSync('js/world.js', 'utf8');

assert.match(story, /Optional and off the required road/);
assert.doesNotMatch(story, /On the road, not off it/);
assert.match(caves, /Alpha is\s*\n?optional and outside it/);
assert.match(world, /optional post-Purifier depth-door branch from A2/);
assert.doesNotMatch(world, /A2\|A10,\s*A10\|A3/,
  'the seam diagram must not put optional Alpha inline on the required road');
assert.doesNotMatch(world, /way rather than off it/,
  'world authority must not describe optional Alpha as mandatory-road content');
assert.match(game, /A2:\s*\{\s*at:\s*0\.84,\s*to:\s*'A10'/,
  'the Alpha den must remain a depth-door branch from A2');
assert.match(game, /G2\.to === 'A10'[^\n]+!G\.save\.flags\.crystal/,
  'the branch must remain locked until the blade is forged');
console.log('PASS Alpha is documented and wired as an optional forged-blade depth branch');
