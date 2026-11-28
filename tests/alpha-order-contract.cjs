const assert = require('node:assert/strict');
const fs = require('node:fs');

const wolves = fs.readFileSync('js/wolves.js', 'utf8');
const game = fs.readFileSync('js/game.js', 'utf8');
const quests = fs.readFileSync('js/quests.js', 'utf8');
const offer = wolves.match(/function alphaQuestOffer\(\) \{([\s\S]*?)\n\}/);
assert.ok(offer, 'Alpha offer function must exist');
assert.match(offer[1], /!G\.save\.flags\.bossGlitch/, 'new Alpha offer must wait for purified NULLFANG');
assert.match(game, /G\.save\.flags\.crystal && G\.save\.flags\.bossGlitch && !G\.save\.flags\.alphaLead/,
  'Ratchet talk must not activate Alpha before NULLFANG');
assert.match(quests, /id:'alpha_pack'[\s\S]*?after:'bossGlitch'/, 'quest authority must record the post-NULLFANG order');
console.log('PASS Alpha side quest cannot be offered before NULLFANG is purified');

