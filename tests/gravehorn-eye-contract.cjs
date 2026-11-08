// Source-level color contract for the procedural stand-in. Rendered motion and
// authored replacement art still require browser/gameplay-size review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const gh = fs.readFileSync('js/gravehorn.js', 'utf8');
const brief = fs.readFileSync('docs/ART_QUEUE.md', 'utf8');
const combatBrief = fs.readFileSync('docs/combat/BOSS_GRAVEHORN.md', 'utf8');
const story = fs.readFileSync('docs/STORY_SCRIPT.md', 'utf8');

assert.match(gh, /eye:\s*'#ba5cff'/, 'Gravehorn eye base must use boss purple');
assert.match(gh, /ghMix\(GHC\.eye, TELL_COL, tk\)/, 'tell may blend from, not replace, boss purple');
assert.match(gh, /rgba\(186,92,255,0\)/, 'eye glow must fade in the same purple family');
assert.match(gh, /c\.fillStyle = GHC\.eye; c\.beginPath\(\); c\.arc\(eyeP\[0\], eyeP\[1\], 3\.4/, 'dark-intro eye must use boss purple');
assert.match(gh, /c\.fillStyle = GHC\.eye; c\.beginPath\(\); c\.arc\(-36, -12, 5/, 'dialogue portrait eye must use boss purple');
assert.match(gh, /infEyeMark\(c, eyeP\[0\], eyeP\[1\]\)/, 'trail anchor must remain on the animated eye');
assert.match(brief, /boss infection eye glow PURPLE at runtime/);
assert.doesNotMatch(brief, /glowing RED eye per side/);
assert.match(combatBrief, /boss-infection purple `#ba5cff` \(eye\)/,
  'combat brief must keep the boss infection eye purple');
assert.doesNotMatch(combatBrief, /identity red[^\n|]*\(eye/,
  'combat brief must not assign the infection eye to the attack-red palette');
assert.match(story, /GRAVEHORN[^\n]+purple boss-infection eye/);
assert.doesNotMatch(story, /GRAVEHORN[^\n]+red eye|head, red eye/i,
  'story panels must not regress the boss infection eye to ordinary red');
console.log('PASS Gravehorn eye core, glow, anchor and art brief agree on boss purple');
