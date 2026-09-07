// Production save/equipment helpers plus real Player.update input. Scene/audio
// services are inert; no copied combat decisions or synthetic attack objects.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const held = new Set(), pressed = new Set();
const noop = () => {};
const ctx = vm.createContext({
  console, TILE: 32, PAL: { A: { glow: '#fff' } },
  inD: k => held.has(k), inP: k => pressed.has(k),
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, k) => a + (b - a) * k,
  rnd: (a, b) => (a + b) / 2, chance: () => false,
  isHero: () => false, addPart: noop, burst: noop, sfx: noop,
  sfxChargeTick: noop, cam: { shake: 0 },
  G: { save: { diff: 1, equip: [], abil: {}, skills: [], relics: [],
    flags: {}, broken: {}, coresMax: 5, weaponVersion: 1, weaponMode: 'claws' },
    roomId: 'TEST', roomDef: { zone: 'A', w: 80, h: 20 },
    grid: Array.from({ length: 20 }, (_, y) => (y === 15 ? '#' : '.').repeat(80)),
    enemies: [], projs: [], statics: [], plats: [], addRing: noop, toast: noop, onPlayerDeath: noop },
});
for (const name of ['weapons', 'entities'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + name + '.js'), 'utf8'), ctx);
const { weaponMode, weaponOwned, equipWeapon, grantWeapon, migrateWeapons } = ctx;
const fresh = { flags: {}, weaponVersion: 1, weaponMode: 'claws' };
assert.equal(weaponMode(fresh), 'claws');
for (const mode of ['single', 'dual', 'joined']) assert.equal(equipWeapon(mode, fresh), false);
assert.equal(grantWeapon('dual', fresh), false, 'second sword requires first forged sword');
assert.equal(grantWeapon('joined', fresh), false, 'connector requires both swords');
assert.equal(grantWeapon('single', fresh), true);
assert.equal(weaponMode(fresh), 'single');
assert.equal(weaponOwned('joined', fresh), false);
assert.equal(grantWeapon('dual', fresh), true);
migrateWeapons(fresh);
assert.equal(weaponMode(fresh), 'dual');
assert.equal(weaponOwned('joined', fresh), false, 'new second sword never manufactures connector');
assert.equal(equipWeapon('claws', fresh), true, 'owned swords can be put away');
assert.equal(weaponMode(fresh), 'claws');
assert.equal(grantWeapon('joined', fresh), true);
assert.equal(weaponMode(fresh), 'joined');
equipWeapon('dual', fresh);
const restored = JSON.parse(JSON.stringify(fresh)); migrateWeapons(restored);
assert.equal(weaponMode(restored), 'dual', 'equipped selection persists even with connector owned');
const legacy = { flags: { crystal2: 1 } };
migrateWeapons(legacy);
assert.equal(weaponMode(legacy), 'joined', 'legacy joined entitlement survives migration');
assert.equal(legacy.flags.connector, 1);
equipWeapon('single', legacy); migrateWeapons(legacy);
assert.equal(weaponMode(legacy), 'single', 'migration only selects a weapon once');
const malformed = { flags: { connector: 1 }, weaponVersion: 1, weaponMode: 'joined' };
migrateWeapons(malformed);
assert.equal(weaponMode(malformed), 'claws', 'connector alone cannot bypass forging');

vm.runInContext('var player = new Player(900, 444); player.on = true;', ctx);
const p = ctx.player;
function tick(n = 1) { for (let i = 0; i < n; i++) { p.update(1 / 60); pressed.clear(); } }
function reset(mode, face = 1) {
  held.clear(); pressed.clear(); ctx.G.boomer = null;
  p.x = 900; p.y = 444; p.vx = 0; p.vy = 0; p.on = true; p.face = face;
  p.swing = null; p.swingVis = null; p.atkCD = 0; p.atkBuf = 0;
  p.combo = 0; p.comboT = 0; p.chargeT = 0; p.swirlT = 0; p.volts = 99;
  ctx.G.save.flags = { crystal: 1, crystal2: 1, connector: 1 };
  equipWeapon(mode);
}
function press() { held.add('ATK'); pressed.add('ATK'); tick(); }
function release() { held.delete('ATK'); tick(); }
function charged() { press(); tick(40); release(); }
for (const face of [-1, 1]) {
  for (const mode of ['claws', 'single', 'dual', 'joined']) {
    reset(mode, face);
    for (let beat = 0; beat < 3; beat++) {
      press();
      assert.ok(p.swing, mode + ' has a melee swing');
      assert.equal(!!p.swing.twin, mode === 'dual', 'dual melee does not depend on a timer');
      assert.equal(!!ctx.G.boomer, false, 'regular combo never throws, including finisher');
      release(); tick(19);
    }
  }
  reset('dual', face); charged();
  assert.ok(p.swirlT > 0, 'held dual attack starts hurricane');
  assert.equal(ctx.G.boomer, null);
  tick(450);
  assert.equal(weaponMode(), 'dual', 'dual is permanent beyond old six second window');
  p.atkCD = 0; press();
  assert.equal(p.swing.twin, true, 'paired melee remains available after hurricane recovery');
  release();

  reset('joined', face); charged();
  assert.ok(ctx.G.boomer, 'held joined attack throws');
  assert.equal(Math.sign(ctx.G.boomer.vx), face, 'throw follows current facing');
  assert.equal(p.swirlT, 0, 'joined mode does not invoke dual hurricane');
  const blade = ctx.G.boomer;
  p.releaseCharged();
  assert.equal(ctx.G.boomer, blade, 'a blade in flight cannot be duplicated');
  let range = 0;
  for (let i = 0; i < 180 && ctx.G.boomer; i++) {
    range = Math.max(range, Math.abs(ctx.G.boomer.x - (p.x + p.w / 2)));
    tick();
  }
  assert.ok(range > 120, 'throw travels a meaningful distance');
  assert.equal(ctx.G.boomer, null, 'blade returns and is caught');
  assert.equal(weaponMode(), 'joined', 'catch preserves equipped joined weapon');
  reset('joined', face); charged(); p.die();
  assert.equal(ctx.G.boomer, null, 'death clears the projectile');
  assert.equal(p.swirlT, 0); assert.equal(p.chargeT, 0);
  assert.equal(p.swing, null); assert.equal(p.swingVis, null);
  assert.equal(weaponMode(), 'joined', 'death does not consume earned equipment');
  p.dead = false;
}
console.log('PASS: gated sword progression, legacy migration, saved selection, both-facing real melee and charged specials.');
