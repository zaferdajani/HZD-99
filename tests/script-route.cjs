// THE SCRIPT IS NOT ALLOWED TO DRIFT FROM THE ROUTE.
//
// docs/STORY_SCRIPT.md is what the STORY session draws chapter one from, page by
// page, and for months it described a kingdom the build has never played: CHIME
// first, and the Meadow Sage locked away behind NULLFANG's lair. Seven drawn pages
// were fired in that order before anybody compared the two documents.
//
// The route is already measured in the game (tests/story-opening.cjs and
// tests/first-sage-route.cjs). What was never measured is the PROSE, so this
// harness reads the script the way a reader does — in order — and fails if the
// sage stops coming before the bell, or the bell before the guardian.
//
// It deliberately checks the documents rather than the code: the code is covered,
// and the failure this exists to catch is somebody rewriting §2.12 back.
const assert = require('node:assert/strict'), fs = require('node:fs');

const script = fs.readFileSync('docs/STORY_SCRIPT.md', 'utf8');
const heads = script.split('\n').filter(l => l.startsWith('### 2.'));
const at = (re) => {
  const i = heads.findIndex(h => re.test(h));
  assert(i >= 0, `chapter one has no section matching ${re}`);
  return i;
};

const forge = at(/^### 2\.\d+ The forging/);
const sage = at(/maintenance door and the first sage/);
const chime = at(/The Chime/);
const nullfang = at(/^### 2\.\d+ NULLFANG/);

assert(forge < sage, 'the blade is forged before the Sage — the maintenance door needs it');
assert(sage < chime, 'the Sage sends her to CHIME; the script must not reach the bell first');
assert(chime < nullfang, 'CHIME is silenced before NULLFANG, as openingGateHint says at the lair door');

// The sage's section has to carry the revelation, because that line is the only
// thing in the story that explains why the bell is an errand and not a detour.
const sageBody = script.split('\n### ')[sage + 1] || '';
assert.match(sageBody, /CHIME writes the command back/,
  'the sage section must quote the revelation the game fires (firstSageRevelation)');
assert.match(sageBody, /maintenance door|quarry/i,
  'the sage is reached through the quarry maintenance door, not a grotto behind the lair');

// The old geography, in the words it used to be written in. If either comes back,
// the script has been reverted and the pages drawn from it will be wrong again.
assert(!/Behind the lair: a grotto with a bench/.test(script),
  'the sage is no longer reached from behind NULLFANG\'s lair');

// And the settled order is recorded where the comic sessions look for it.
for (const doc of ['docs/COMIC_PARITY_AUDIT.md', 'docs/MANHUA.md']) {
  assert.match(fs.readFileSync(doc, 'utf8'), /THE ROUTE RULING/,
    `${doc} must carry the route ruling the pages are drawn against`);
}

// The shipped reward never depended on the script, and must keep its own order:
// the Sage's episode unlocks on the sage alone; the guardian's needs all three.
const chapters = JSON.parse(fs.readFileSync('assets/manhua/chapters.json', 'utf8')).chapters;
const byId = Object.fromEntries(chapters.map(c => [c.id, c]));
assert.deepEqual(byId['chapter-one-sage'].unlock, ['first-sage'],
  'the sage episode is earned by the sage alone — it happens before the bell');
assert.deepEqual(byId['chapter-one-guardian'].unlock.slice().sort(),
  ['chime-silenced', 'first-sage', 'nullfang-freed'].sort(),
  'the guardian episode needs the whole route behind it');

console.log('PASS script-route: forge < sage < CHIME < NULLFANG in the script, the revelation is in the sage\'s section, the ruling is recorded, and the reward unlocks match');
