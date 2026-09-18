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
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/weapons.js'), 'utf8'), ctx);
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
  // swingClaw2, not swingHook: the second hit was rewired to the owner's drawn
  // claw jab on 2026-09-15 (see SWING_STRIP in js/entities.js). hook.webp is
  // still on disk as the filmed record, so nothing here would have failed to
  // load — the key simply stopped being the one the combo routes to, and this
  // line went on asserting the old one.
  [1, 'claw_2', 'swingClawJab'],
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
assert.equal(draws.at(-1)[1], 'swingClawCharge');
assert.ok(draws.at(-1)[2]>=6,'release must skip held-charge poses');
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

// Loaded weapon art changes only the body strip, not the attack state machine.
ctx.MEDIA_RAW={swingSingle:{naturalWidth:2560}};
for(let combo=0;combo<3;combo++){
  player.swingVis={t:.12,t0:.24,combo,weaponMode:'single',wield:1};
  draws.length=0;player.drawRoboSwing({});
  assert.equal(draws.at(-1)[1],'swingSingle');
  assert.equal(draws.at(-1)[3],8);
}
ctx.MEDIA_RAW={};draws.length=0;player.drawRoboSwing({});
assert.equal(draws.at(-1)[1],'swingUppercut','missing weapon image keeps the working fallback');
console.log('PASS single-sword combo body routing and missing-image fallback');

for(const [mode,key,cells] of [['single','swingSingleCharge',10],['dual','swingDualCharge',10]]){
  ctx.MEDIA_RAW={[key]:{naturalWidth:320*cells}};
  for(const progress of [0,.5,.99]){
    player.swingVis={t:.3*(1-progress),t0:.3,charged:true,weaponMode:mode};
    draws.length=0;player.drawRoboSwing({});
    assert.equal(draws.at(-1)[1],key);
    assert.ok(draws.at(-1)[2]>=3,'weapon release skips held-charge poses');
  }
}
player.swingVis=null;player.dead=false;player.hurtPoseT=0;player.dashT=0;
player.on=true;player.chargeT=.5;player.vx=0;ctx.G.boomer=null;
vm.runInContext("weaponMode=()=> 'claws'",ctx);
draws.length=0;assert.equal(player.drawRoboCharge({}),true);
assert.equal(draws.at(-1)[1],'swingClawCharge');
assert.ok(draws.at(-1)[2]<6,'held charge must never display the released strike');
player.vx=100;assert.equal(player.drawRoboCharge({}),false,'moving charge keeps locomotion');player.vx=0;
player.swingVis={};assert.equal(player.drawRoboCharge({}),false,'release owns rendering once a swing exists');
console.log('PASS held-charge/release frame separation for claw and weapon art');

player.swingVis=null;player.chargeT=0;player.y=100;player.on=false;player.atkCD=0;player.comboT=0;
held.add('ATK');pressed.add('ATK');tick();held.delete('ATK');
draws.length=0;player.drawRoboSwing({});
assert.equal(draws.at(-1)[1],'swingAir','airborne input selects the aerial body');
player.swingVis=null;player.atkCD=0;held.add('DOWN');held.add('ATK');pressed.add('ATK');tick();held.clear();
draws.length=0;player.drawRoboSwing({});
assert.equal(draws.at(-1)[1],'swingDown','down+attack selects plunge');
assert.ok(draws.at(-1)[2]<4,'no landing pose before contact');
player.on=true;draws.length=0;player.drawRoboSwing({});
assert.ok(draws.at(-1)[2]>=4,'ground contact selects impact/recovery');
player.swingVis=null;ctx.G.recharge={phase:'dock',dockT:.275,dock0:.55,t:1,dur:1};
draws.length=0;player.drawRoboRecharge({});assert.equal(draws.at(-1)[1],'heroRecharge');
assert.equal(draws.at(-1)[2],2);
ctx.G.recharge.phase='charge';ctx.G.recharge.t=.1;
draws.length=0;player.drawRoboRecharge({});assert.equal(draws.at(-1)[2],7);
ctx.G.recharge=null;assert.equal(player.drawRoboRecharge({}),false);
player.swingVis={t:.2,t0:.32,charged:true,chargeArtAlt:true,weaponMode:'claws'};
draws.length=0;player.drawRoboSwing({});assert.equal(draws.at(-1)[1],'swingClawChargeAlt');
console.log('PASS real aerial/plunge input, contact-gated impact, recharge phases and alternate charge');
