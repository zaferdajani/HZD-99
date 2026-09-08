// Execute the production tutorial functions, including its rendering and save
// progression. No copies of the implementation and no string-presence tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
const start = source.indexOf('const TUT_STEPS =');
const end = source.indexOf('const MOD_LESSON =', start);
assert(start >= 0 && end > start, 'production tutorial boundaries');
let rings = 0, writes = 0;
const canvas = new Proxy({}, { get: (_, name) => name === 'arc' ? () => rings++ :
  name === 'measureText' ? text => ({ width: text.length * 7 }) :
  name === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} });
const ctx = vm.createContext({
  G: { roomId: 'A0', roomDef: { w: 64, exits: { R: 'A1' } }, state: 'PLAY',
    save: { flags: {}, scrap: 0 }, enemies: [], statics: [], pickups: [], flash: 0 },
  player: { x: 10, y: 400, w: 24, h: 28, vx: 0, vy: 0, on: true,
    cores: 3, maxCores: () => 3 },
  cam: { x: 0, y: 0, shake: 0 }, TOUCH: { enabled: false }, PAD: { on: false },
  TILE: 32, c: canvas, performance: { now: () => 1000 }, doors: [],
  gateWorldX: d => d.x, sfx() {}, burst() {}, addPart() {},
  persist: () => writes++, inD: () => false, rnd: () => 0,
  rr() {}, ftxt() {}, t: key => key, clamp: (n, lo, hi) => Math.max(lo, Math.min(hi, n)),
});
vm.runInContext('function gateDoors() { return doors; }\n' + source.slice(start, end), ctx);
const run = code => vm.runInContext(code, ctx);
const step = id => run(`TUT_STEPS.find(s => s.id === '${id}')`);
const prompt = id => ctx.tutPrompt(step(id));
const hand = id => ctx.tutHand(prompt(id));

// The booth door is UP, never the NPC's E. Approach teaches only movement.
ctx.doors = [{ x: 500, style: 'booth' }];
assert.equal(hand('buy'), '→');
assert.equal(prompt('buy').vb, null);
ctx.player.x = 488;
assert.equal(hand('buy'), '↑');
assert.equal(prompt('buy').target.x, 500);
ctx.player.x = 600;
assert.equal(hand('buy'), '←');

// Inside, the sole target becomes Ratchet, not the door back outside.
ctx.G.roomId = 'A0B'; ctx.G.roomDef.exits = {};
const ratchet = { type: 'npc', extra: 'ratchet', x: 300, y: 400, w: 32, h: 40 };
ctx.G.statics = [ratchet]; ctx.G.near = ratchet; ctx.player.x = 290;
assert.equal(hand('buy'), 'E');
assert.equal(prompt('buy').target.x, 316);
ctx.npcLive = () => false;
assert.equal(prompt('buy').label, 'tut_note', 'read the sleeping robot note before shopping');
ctx.npcLive = () => true;
assert.equal(prompt('buy').label, 'tut_buy');
ctx.PAD.on = true; assert.equal(hand('buy'), 'B');
ctx.TOUCH.enabled = true; assert.equal(hand('buy'), 'INT');
ctx.TOUCH.enabled = false; ctx.PAD.on = false;

// Use the production binding resolver for remapped controls and menu-only
// actions. A fixed "View" label would point at claws, not the skill tree.
const engine = fs.readFileSync(path.join(__dirname, '../js/engine.js'), 'utf8');
vm.runInContext(engine.slice(engine.indexOf('function howToOpen('),
  engine.indexOf('// The same answer, phrased')), ctx);
ctx.padLabel = n => ({ 0: 'A', 1: 'B', 2: 'X', 5: 'RB', 9: 'Start' }[n] || '—');
ctx.PAD.map = { JUMP: 5, INT: 2, SKILL: -1, PAUSE: 9 };
ctx.PAD.on = true;
assert.equal(hand('buy'), 'X', 'interaction follows remapping');
assert.equal(hand('skill'), 'Start ▸ pa_SKILL', 'unbound skills show the menu route');
ctx.G.roomId = 'W2';
assert.equal(hand('jump'), 'RB', 'jump follows remapping');
ctx.TOUCH.enabled = true;
ctx.G.roomId = 'A0';
assert.equal(hand('skill'), '☰ ▸ pm_skills', 'touch skills show their real menu route');
ctx.TOUCH.enabled = false; ctx.PAD.on = false; ctx.PAD.map.JUMP = 0;

// Backtracking to an earlier room points forward without replaying lessons.
ctx.G.roomId = 'W1'; ctx.G.roomDef.exits = { R: 'W2' };
assert.equal(hand('node'), '→');
assert.equal(prompt('node').vb, null);
ctx.G.roomId = 'W2'; ctx.G.roomDef.exits = {}; ctx.player.x = 488;
assert.equal(hand('buy'), '↑');
ctx.G.roomId = 'A0B';
ctx.G.tut = { i: run("TUT_STEPS.findIndex(s => s.id === 'buy')"), hold: 0, t: 1 };
ctx.drawTutor(); assert.equal(rings, 1, 'only the NPC gets a ring');
ctx.G.state = 'DIALOG'; ctx.drawTutor(); assert.equal(rings, 1, 'dialogue owns the screen');
ctx.G.state = 'PLAY'; ctx.G.gateWalk = {}; ctx.drawTutor(); assert.equal(rings, 1, 'door film owns the screen');
ctx.G.gateWalk = null;

// Returning from the booth to a meadow lesson must point at the doorway,
// not an imaginary node, and never tell the player to walk into its right wall.
ctx.player.x = 488;
assert.equal(hand('node'), '↑');
assert.equal(prompt('node').label, 'tut_return');
assert.equal(hand('go'), '↑');
assert.equal(prompt('go').target.x, 500);

// One keyboard jump binding shown, with the corresponding pad/touch names.
ctx.G.roomId = 'W2';
assert.equal(hand('jump'), 'Space');
ctx.PAD.on = true; assert.equal(hand('jump'), 'A');
ctx.TOUCH.enabled = true; assert.equal(hand('jump'), 'JUMP');
ctx.TOUCH.enabled = false; ctx.PAD.on = false;

// Do not reset or renumber old saves when improving presentation.
assert.equal(ctx.tutRestore({ flags: { tutI: 7 } }), 7);
assert.equal(step('buy').id, run('TUT_STEPS[7].id'));
ctx.G.save.flags = { tutI: 7 };
ctx.tutSave(ctx.G.save, { i: 2 });
assert.equal(ctx.G.save.flags.tutI, 7); assert.equal(writes, 0);
ctx.tutSave(ctx.G.save, { i: 8 });
assert.equal(ctx.G.save.flags.tutI, 8); assert.equal(writes, 1);

// Real updateTutor progression still requires doing the lesson, then waits
// for its acknowledgement before advancing exactly once.
ctx.G.roomId = 'W1'; ctx.G.roomDef = { w: 32, exits: { R: 'W2' } };
ctx.G.save.flags = {}; ctx.G.tut = null; ctx.G.statics = []; ctx.player.x = 10;
ctx.updateTutor(0.3); assert.equal(ctx.G.tut.i, 0); assert.equal(ctx.G.tut.hold, 0);
ctx.player.vx = 200; ctx.updateTutor(0.3);
assert.equal(ctx.G.tut.i, 0); assert(ctx.G.tut.hold > 0);
ctx.updateTutor(0.8); assert.equal(ctx.G.tut.i, 1); assert.equal(ctx.G.save.flags.tutI, 1);
assert.equal(ctx.tutAllows('ATK'), false);
assert.equal(ctx.tutAllows('JUMP'), true, 'already available movement remains responsive');
console.log('PASS tutorial-clarity: contextual controls, one target, dialogue priority, save continuity, progression');

// The map remains available, but its first-use announcement waits for a
// clear moment instead of teaching another control over the current lesson.
vm.runInContext(source.slice(source.indexOf('function mapUnlocked()'),
  source.indexOf("addEventListener('mousedown'", source.indexOf('function mapUnlocked()'))), ctx);
ctx.braid = () => null;
let announcements = 0; ctx.G.toast = () => announcements++;
ctx.G.save.visited = { W1: 1, W2: 1 }; ctx.G.save.flags = {};
ctx.drawMapButton(); assert.equal(announcements, 0); assert(!ctx.G.save.flags.mapSeen);
ctx.G.tut = null; ctx.drawMapButton(); assert.equal(announcements, 1);
ctx.drawMapButton(); assert.equal(announcements, 1, 'announce only once after the lesson');
