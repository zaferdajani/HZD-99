// Exercise the shipped special attacks and shared damage/sage rules together.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const read = n => fs.readFileSync(path.join(__dirname, '../js/' + n + '.js'), 'utf8');
const entities = read('entities'), types = read('types');
function fn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  assert(start >= 0, name + ' exists');
  return src.slice(start, src.indexOf('\n}', start) + 2);
}
function method(name) {
  const start = entities.indexOf('  ' + name + '() {');
  assert(start >= 0, name + ' exists');
  return entities.slice(start, entities.indexOf('\n  }', start) + 4);
}
const noop = () => {};
let mode = 'single', giftCount = 0, element = null;
const ctx = vm.createContext({ console, Math, Set, Boss: class Boss {},
  SWIRL_R: 150, TILE: 32, PAL: { A: { glow: '#fff' } },
  weaponMode: () => mode, wielded: () => mode === 'claws' ? 'claw' : mode === 'joined' ? 'crystal2' : 'crystal1',
  armEl: () => element, armDef: () => ({ el: 'hott' }),
  bossGateOpen: e => e.shieldT > 0, elOf: () => null, elemMul: () => 1,
  BOSS_GATE: { guardian: 'fireArm' }, ELEM: { hott: { glow: '#fff' } }, DAZE_WINDOW: 1, DAZE_MUL: 1.4,
  burst: noop, sfx: noop, persist: noop, hasSkill: () => false, tileAt: () => '.',
  isPet: e => !!e.pet, isWolf: e => e.kind === 'wolf', packTamed: () => true,
  invAdd: () => giftCount++, t: s => s, cam: { shake: 0 },
  G: { boomer: null, hitStop: 0, flash: 0, roomId: 'GA1D', roomDef: { zone: 'A' },
    save: { flags: {}, scrap: 0, iq: 0 }, statics: [], enemies: [], boss: null, addRing: noop, toast: noop },
});
const run = s => vm.runInContext(s, ctx);
run(fn(types, 'dealDmg'));
run(fn(entities, 'sageStruck'));
const gifts = entities.indexOf('const SAGE_GIFT =');
run(entities.slice(gifts, entities.indexOf('\n};', gifts) + 3));
run(fn(entities, 'sageTame'));
run('class SpecialPlayer { ' + ['swirlPass', 'releaseCharged'].map(method).join('\n') + ' }\nthis.SpecialPlayer = SpecialPlayer;');
const p = new ctx.SpecialPlayer();
Object.assign(p, { x: 0, y: 0, w: 28, h: 36, swirlT: 0, swirlHits: 0,
  volts: 0, dmg: () => 10, gainVolts(n) { this.volts += n; } });
function enemy(overrides = {}) {
  return { x: 35, y: 0, w: 28, h: 36, hp: 100, hpMax0: 100, vx: 0, vy: 0,
    pureM: 0, kind: 'sage', dead: false, die() { this.dead = true; }, ...overrides };
}
function hit(e, special, chosenMode) {
  mode = chosenMode; ctx.G.enemies = [e]; p[special]();
}
for (const [special, chosenMode] of [['releaseCharged', 'single'], ['swirlPass', 'dual']]) {
  const e = enemy();
  for (let i = 0; i < 25 && !e.locked; i++) hit(e, special, chosenMode);
  assert.equal(e.hp, 30, special + ' respects sage health floor');
  assert(!e.dead && e.locked, special + ' song-locks instead of deleting sage');
  for (let i = 0; i < 4; i++) hit(e, special, chosenMode);
  assert(e.tame && !e.dead, special + ' cleanses the locked sage');
  const before = [e.hp, e.vx, e.vy, p.volts, giftCount];
  hit(e, special, chosenMode);
  assert.deepEqual([e.hp, e.vx, e.vy, p.volts, giftCount], before,
    special + ' cannot damage, throw or farm a cleansed sage');
}
assert.equal(giftCount, 1, 'sage gift is persisted once per chamber');
const locked = enemy({ hp: 30, locked: true });
for (let i = 0; i < 6; i++) hit(locked, 'releaseCharged', 'claws');
assert.equal(locked.hp, 30, 'unarmed burst cannot pass the sage floor');
assert.equal(locked.pureM, 0, 'unarmed burst cannot cleanse');
assert(!locked.dead && !locked.tame, 'unarmed burst leaves sage available for crystal rescue');
for (const special of ['releaseCharged', 'swirlPass']) {
  for (const flags of [{ stormT: 2 }, { kind: 'wolf' }, { pet: true }]) {
    const e = enemy({ kind: 'drone', ...flags }), before = p.volts;
    hit(e, special, 'single');
    assert.deepEqual([e.hp, e.vx, e.vy, p.volts], [100, 0, 0, before],
      special + ' respects protected target ' + JSON.stringify(flags));
  }
  const guarded = enemy({ kind: 'drone', guard: true }), before = p.volts;
  hit(guarded, special, 'single');
  const damage = special === 'releaseCharged' ? 26 : 10;
  assert.equal(guarded.hp, 100 - Math.max(1, Math.round(damage * .12)), 'guard absorbs special');
  assert.deepEqual([guarded.vx, guarded.vy, p.volts], [0, 0, before], 'guard denies launch/energy');
  const shielded = enemy({ kind: 'guardian', hpMax: 100 });
  hit(shielded, special, 'single');
  assert.equal(shielded.hp, 100 - Math.max(1, Math.round(damage * .4)), 'guardian plating reduces wrong-element special');
  const countered = enemy({ kind: 'guardian', hpMax: 100 });
  element = 'hott'; hit(countered, special, 'single'); element = null;
  assert.equal(countered.hp, 100 - damage, 'counter-element special breaks guardian plating');
  assert.equal(countered.shieldT, 6, 'special opens the ordinary counter window');
  const normal = enemy({ kind: 'drone' });
  hit(normal, special, 'single');
  assert.equal(normal.hp, 100 - damage, 'ordinary target retains base special damage');
  const lethal = enemy({ kind: 'drone', hp: 1 });
  hit(lethal, special, 'single');
  assert(lethal.dead, 'ordinary targets still resolve lethal special damage');
}
console.log('OK — held specials cleanse sages, protect allies and respect defenses');
