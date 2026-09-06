const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const path = require('node:path');
const pressed = new Set(); let saved = 0, taps = 0;
const ctx = vm.createContext({
  G: { save: { abil: {}, flags: {}, crests: [], equip: [] }, crestIdx: 0, state: 'CREST', toast() {} },
  CRESTS: { plate: 2, phantom: 2, sprint: 1, magnet: 1 }, effSlots: () => 3,
  player: { cores: 5, maxCores: () => 5 }, persist: () => saved++, sfx() {},
  t: k => k, inP: k => pressed.has(k), tPress: () => taps++
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/gear.js'), 'utf8'), ctx);
const rows = () => ctx.gearRows(ctx.G.save);
const select = id => { ctx.G.crestIdx = rows().findIndex(r => r.id === id); assert(ctx.G.crestIdx >= 0); };
assert(rows().find(r => r.id === 'boots').installed);
assert(!rows().find(r => r.id === 'dash').acquired);
select('boots'); ctx.gearActivate(); assert.equal(saved, 0, 'cannot remove base jump');
ctx.G.save.crests = ['phantom', 'plate', 'magnet'];
select('phantom'); ctx.gearActivate(); assert.equal(ctx.G.save.equip.length, 0, 'phase needs jets');
ctx.G.save.abil.dash = 1;
assert(rows().find(r => r.id === 'dash').installed);
select('phantom'); ctx.gearActivate(); assert(ctx.G.save.equip.includes('phantom'));
select('plate'); ctx.gearActivate(); assert(!ctx.G.save.equip.includes('plate'), 'power capacity enforced');
select('magnet'); ctx.gearActivate(); assert(ctx.G.save.equip.includes('magnet'));
select('phantom'); ctx.gearActivate(); assert(!ctx.G.save.equip.includes('phantom'));
ctx.G.save.abil.djump = 1;
assert.equal(rows().find(r => r.id === 'boots').name, 'm_djump');
assert(!rows().some(r => r.id === 'djump'), 'boot upgrade replaces locked preview');
select('boots'); ctx.gearActivate(); assert(ctx.G.save.abil.djump, 'cannot strand player by removing air jump');
const roundtrip = JSON.parse(JSON.stringify(ctx.G.save));
assert.deepEqual(rows().map(r => [r.id, r.installed]), ctx.gearRows(roundtrip).map(r => [r.id, r.installed]));
ctx.G.crestIdx = rows().length - 1;
let l = ctx.gearLayout();
ctx.gearTouch(l.x - 1, l.y); assert.equal(taps, 0, 'preview cannot activate equipment');
ctx.gearTouch(l.x + 20, l.y); assert.equal(taps, 1); assert.equal(ctx.G.crestIdx, l.start, 'touch resolves scrolled rows');
pressed.add('UP'); ctx.G.crestIdx = 0; ctx.updateGear(); pressed.clear();
assert.equal(ctx.G.crestIdx, rows().length - 1, 'keyboard/pad navigation wraps');
console.log('PASS: base boots, staged jets/air jump, equipment capacity, save reload, permanent traversal and scrolled touch');
