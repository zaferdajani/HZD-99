const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const test = fs.readFileSync(path.join(__dirname, 'bosswindow.cjs'), 'utf8');
const docs = fs.readFileSync(path.join(__dirname, '../docs/combat/BOSS_PRISM.md'), 'utf8');
const entities = fs.readFileSync(path.join(__dirname, '../js/entities.js'), 'utf8');

assert.match(test, /EXPECTED = \{ prism: \['dashwarn', 'pouncewarn', 'spreadwarn', 'lsvanish', 'arcspin'\] \}/);
assert.match(test, /DISTINCT = \{ prism: \['dashwarn', 'pouncewarn', 'spreadwarn'\] \}/);
assert.doesNotMatch(test, /try \{ bo\.update\(STEP\)/, 'boss update exceptions must fail the run');
assert.doesNotMatch(test, /new Boss\(kind/, 'missing room bosses must not be synthesized');
assert(test.includes('|call|vanish/i'), 'hand-cued vanish is included in wind-up discovery');
assert.match(test, /never exercised required tell/);
assert.match(test, /differ by only/);

assert.match(entities, /this\.st = 'pouncewarn'; this\.t = TELL_SWIPE/);
assert.match(entities, /this\.st = 'spreadwarn'; this\.t = TELL_HEAVY/);
assert.match(docs, /`pp\.pounce`[^\n]+\*\*500\*\* \(`TELL_SWIPE`\)/);
assert.match(docs, /`pp\.spread`[^\n]+\*\*700\*\* \(`TELL_HEAVY`\)/);
assert.doesNotMatch(docs, /50 ms tell difference|not\*\* to separate the tell lengths/);
console.log('PASS bosswindow-contract: PRISM timing, named coverage and fail-closed harness agree');
