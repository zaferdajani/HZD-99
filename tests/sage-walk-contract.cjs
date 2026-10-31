// Fast source contract for the rescue-motion wiring. The browser harness
// drives production update/draw and remains the rendered authority.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync('js/entities.js', 'utf8');

assert.match(src, /const WALKERS = \{[^}]*sage:\s*1[^}]*\}/,
  'the calm Sage must accumulate distance-based grounded gait');
assert.match(src, /const sageWalking = !!e\.tame && Math\.abs\(e\.vx \|\| 0\) > 12/,
  'moving/rescued state must be derived from actual velocity');
assert.match(src, /e\.tame && !sageWalking \? 'sagePure'/,
  'the kneeling rescue plate is for rest, not translation');
assert.match(src, /drawStripCell\([^\n]+sageWalk8[^\n]+!!e\.tame\)/,
  'moving rescued gait must use the authored strip with purified material');
console.log('PASS purified Sage source wiring uses distance gait, walk strip and rest kneel');
