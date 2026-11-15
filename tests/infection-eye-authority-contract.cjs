// Runtime already distinguishes red ordinary infection from purple bosses.
// Lock the story and art briefs to that same rule so future panels do not bake
// a red eye into NULLFANG and visibly flicker when the live purple VFX appears.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const runtime = fs.readFileSync('js/infection-eyes.js', 'utf8');
const story = fs.readFileSync('docs/STORY_SCRIPT.md', 'utf8');
const queue = fs.readFileSync('docs/ART_QUEUE.md', 'utf8');

assert.match(runtime, /return boss \? 'purple' : 'red'/,
  'runtime must keep bosses purple and ordinary infected bodies red');
assert.match(story, /NULLFANG[^\n]+purple boss-infection light behind the eyes/i,
  'NULLFANG story identity must name its purple boss eye');
assert.match(story, /ordinary infected\s*\n?eyes glow red while bosses and guardians glow purple/i,
  'picture authority must preserve the red ordinary / purple boss distinction');
assert.match(story, /ordinary hostiles read\s*\n?red; bosses and guardians purple/i,
  'aura-sense authority must use the same class colours as runtime');
assert.doesNotMatch(story, /guardians red|NULLFANG[^\n]+red light behind the eyes/i,
  'story authority must not reintroduce a red boss optic');
assert.match(queue, /nullfang_coil[^\n]+EYE MASK CORRECTION REQUIRED[^\n]+infection eyes must be masked[^\n]+PURPLE/i,
  'the existing red-eye plate must be queued for a bounded purple-eye mask correction');

console.log('PASS story, runtime and art authority agree: ordinary infected eyes red, bosses purple');
