// Exercise real Player.update input, then inspect both rendering paths.
// No DOM or browser is needed: scene/audio services are inert, but the player,
// combo clocks, attack buffer, pose selector and strip selector are production
// code. The visual harness separately measures the resulting artwork.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const held = new Set(), pressed = new Set(), draws = [];
const noop = () => {};
const ctx = vm.createContext({
  console, TILE: 32, PAL: { A: { glow: '#ffffff' } },
  inD: k => held.has(k), inP: k => pressed.has(k),
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, k) => a + (b - a) * k,
  rnd: (a, b) => (a + b) / 2, chance: () => false,
  isHero: () => false, addPart: noop, burst: noop, sfx: noop,
  cam: { shake: 0 },
  G: {
    save: { diff: 1, equip: [], abil: {}, skills: [], relics: [],
      flags: {}, broken: {}, coresMax: 5 },
    roomId: 'TEST', roomDef: { zone: 'A', w: 80, h: 20 },
    grid: Array.from({ length: 20 }, (_, y) => (y === 15 ? '#' : '.').repeat(80)),
    enemies: [], projs: [], statics: [], plats: [], addRing: noop,
  },
  drawStripCell: (...args) => { draws.push(args); return true; },
});
vm.runInContext(fs.readFileSync(process.argv[2] || path.join(__dirname, '../js/entities.js'), 'utf8'), ctx);
vm.runInContext('var player = new Player(300, 444); player.on = true;', ctx);
const player = ctx.player;
function tick(dt = 1 / 60) { player.update(dt); pressed.clear(); }
function attack() {
  held.add('ATK'); pressed.add('ATK'); tick(); held.delete('ATK');
  return { combo: player.swingVis.combo, pose: player.heroState(false) };
}
function advance(seconds) { for (let t = 0; t < seconds; t += 1 / 60) tick(); }
const expected = [
  [0, 'claw_1', 'swingClaw1'],
  [1, 'claw_2', 'swingHook'],
  [2, 'finisher', 'swingUppercut'],
];
for (const [combo, pose, key] of expected) {
  const result = attack();
  assert.equal(result.combo, combo);
  assert.equal(result.pose, pose, `input combo ${combo} must select ${pose}`);
  draws.length = 0; player.drawRoboSwing({});
  assert.equal(draws.at(-1)[1], key, 'strip must agree with the fallback pose');
  advance(0.35);
}
assert.equal(attack().pose, 'claw_1', 'completed chain wraps to jab');
advance(1.0);
assert.equal(attack().combo, 0, 'expired chain starts at zero');
player.chargeOk = true; player.volts = 99; player.releaseCharged();
assert.equal(player.heroState(false), 'burst', 'held charge keeps its own animation');
draws.length = 0; player.drawRoboSwing({});
assert.equal(draws.at(-1)[1], 'swingBurst');
// NOSTOS shares the movement phase, even though its artwork is different.
// Holding the same stride while wall-clock animation advances must not skate.
ctx.MEDIA_IMG = { heroIdle: {}, heroRun: {}, heroJump: {}, heroAtk: {} };
player.swingVis = null; player.on = true; player.stridePh = 1;
const spriteCalls = [], canvas = { drawImage: (...args) => spriteCalls.push(args) };
player.anim = 0; player.drawHeroSprite(canvas, true, 0);
const plantedFrame = spriteCalls.at(-1)[1];
player.anim = 7.3; player.drawHeroSprite(canvas, true, 0);
assert.equal(spriteCalls.at(-1)[1], plantedFrame, 'stationary stride ignores wall-clock time');
player.stridePh = 2; player.drawHeroSprite(canvas, true, 0);
assert.notEqual(spriteCalls.at(-1)[1], plantedFrame, 'travel advances the human gait');
console.log('PASS: actual attack inputs select jab, cross, uppercut; wrap, timeout and charged burst agree.');
