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
    cores: 3, maxCores: () => 3, volts: 0, healCost: () => 33 },
  cam: { x: 0, y: 0, shake: 0 }, TOUCH: { enabled: false }, PAD: { on: false },
  TILE: 32, c: canvas, performance: { now: () => 1000 }, doors: [],
  gateWorldX: d => d.x, sfx() {}, burst() {}, addPart() {},
  persist: () => writes++, inD: () => false, rnd: () => 0,
  rr() {}, ftxt() {}, t: key => key, clamp: (n, lo, hi) => Math.max(lo, Math.min(hi, n)),
});
ctx.isHero = () => false; ctx.LANG = 'en';
for (const name of ['npcKey','npcCellItem','invCount']) {
  const pos=source.indexOf('function '+name+'('), line=source.slice(pos,source.indexOf('\n',pos));
  vm.runInContext(line.endsWith('}')?line:source.slice(pos,source.indexOf('\n}',pos)+2),ctx);
}
vm.runInContext('function gateDoors() { return doors; }\n' + source.slice(start, end), ctx);
const run = code => vm.runInContext(code, ctx);
const step = id => run(`TUT_STEPS.find(s => s.id === '${id}')`);
const prompt = id => ctx.tutPrompt(step(id));
const hand = id => ctx.tutHand(prompt(id));

// The player's own controls, by the production resolver (js/story-opening.js).
const so = fs.readFileSync(path.join(__dirname, '../js/story-opening.js'), 'utf8');
vm.runInContext(so.slice(so.indexOf('const CTL_TOUCH ='), so.indexOf('// EVERY SAVE PLAYS THE SAME STORY')), ctx);
ctx.KEYB = { UP: ['ArrowUp', 'KeyW'], INT: ['KeyE'], JUMP: ['KeyZ', 'Space'], ATK: ['KeyX', 'KeyJ'], HEAL: ['KeyF'] };
const engine = fs.readFileSync(path.join(__dirname, '../js/engine.js'), 'utf8');
vm.runInContext(engine.slice(engine.indexOf('function howToOpen('),
  engine.indexOf('// The same answer, phrased')), ctx);
ctx.padLabel = n => ({ 0: 'A', 1: 'B', 2: 'X', 5: 'RB', 9: 'Start' }[n] || '—');

// THE BOOTH IS THE FIRST STEP PAST THE GATES. Approaching it teaches only
// movement (an arrow, no button lit); at its door the one control is UP.
ctx.doors = [{ x: 500, style: 'booth' }];
assert.equal(hand('booth'), '→');
assert.equal(prompt('booth').vb, null);
assert.equal(prompt('booth').label, 'op_booth');
ctx.player.x = 488;
assert.equal(hand('booth'), '↑');
assert.equal(prompt('booth').action, 'UP');
assert.equal(prompt('booth').target.x, 500);
ctx.player.x = 600;
assert.equal(hand('booth'), '←');

// Inside: the letter on Ratchet first, then the drawer, then Ratchet again.
ctx.G.roomId = 'A0B'; ctx.G.roomDef.exits = {};
// The room switch precedes the completion hold. Do not briefly tell the
// arriving player to leave again during either part of that transition.
for (const hold of [0, 0.7]) {
  ctx.G.tut = { i: run("TUT_STEPS.findIndex(s => s.id === 'booth')"), hold };
  assert.equal(prompt('booth').suppressed, true);
  assert.equal(prompt('booth').action, null);
  assert.equal(prompt('booth').target, null);
  ctx.G.tutChip = { stale: true };
  ctx.drawTutor();
  assert.equal(ctx.G.tutChip, null, 'no stale exit chip after entering the booth');
}
const ratchet = { type: 'npc', extra: 'ratchet', x: 300, y: 400, w: 32, h: 40 };
ctx.G.statics = [ratchet]; ctx.G.near = ratchet; ctx.player.x = 290;
assert.equal(hand('note'), 'E');
assert.equal(prompt('note').target.x, 316);
assert.equal(prompt('note').label, 'op_note', 'read the letter before anything else');
ctx.G.save.storyVersion = 2; ctx.G.save.items = {};
const drawer = { type: 'chest', extra: 'it:batt', x: 400, y: 400, w: 32, h: 32, opened: false };
ctx.G.statics.push(drawer); ctx.G.near = ratchet;
assert.equal(prompt('drawer').label, 'op_drawer', 'the drawer step points to the drawer');
assert.equal(prompt('drawer').target.x, 416);
assert.equal(prompt('drawer').action, 'MOVE', 'standing at Ratchet, the drawer is walked to');
ctx.G.near = drawer;
assert.equal(prompt('drawer').action, 'INT');
drawer.opened = true; ctx.G.near = ratchet;
assert.equal(prompt('drawer').target.x, 316, 'an opened drawer hands the marker back to Ratchet');
assert.equal(prompt('repair').label, 'op_repair');
assert.equal(prompt('repair').action, 'INT');
const pod = { type: 'bench', x: 880, y: 400, w: 44, h: 52 };
ctx.G.statics.push(pod);
assert.equal(prompt('pod').target.x, 902, 'the pod is the one thing marked');
assert.equal(prompt('pod').action, 'MOVE');
ctx.G.near = pod; assert.equal(hand('pod'), 'E');
ctx.G.near = ratchet;
ctx.PAD.on = true; ctx.PAD.map = { JUMP: 5, INT: 2, SKILL: -1, PAUSE: 9 };
assert.equal(hand('pack'), 'X', 'interaction follows remapping');
ctx.PAD.on = false; ctx.TOUCH.enabled = true; assert.equal(hand('pack'), 'E', 'touch names the on-screen E button');
ctx.TOUCH.enabled = false; ctx.PAD.on = true;
ctx.G.roomId = 'W2';
assert.equal(hand('jump'), 'RB', 'jump follows remapping');
ctx.PAD.on = false; ctx.PAD.map.JUMP = 0;

// Backtracking leads FORWARD to the room the lesson lives in, never replays it.
ctx.G.roomId = 'W1'; ctx.G.roomDef.exits = { R: 'W2' }; ctx.player.x = 10;
assert.equal(hand('node'), '→');
assert.equal(prompt('node').vb, null);
ctx.G.roomId = 'W2'; ctx.G.roomDef.exits = {}; ctx.player.x = 488;
assert.equal(hand('note'), '↑', 'from the road, the way to the den is the gate');
ctx.G.roomId = 'A0B';
ctx.G.tut = { i: run("TUT_STEPS.findIndex(s => s.id === 'pack')"), hold: 0, t: 1 };
ctx.G.statics = [ratchet]; ctx.G.near = null; ctx.player.x = 100;
ctx.drawTutor(); assert.equal(rings, 1, 'only Ratchet gets a ring');
ctx.G.state = 'DIALOG'; ctx.drawTutor(); assert.equal(rings, 1, 'dialogue owns the screen');
ctx.G.state = 'PLAY'; ctx.G.gateWalk = {}; ctx.drawTutor(); assert.equal(rings, 1, 'door film owns the screen');
ctx.G.gateWalk = null;
// a lesson outside, asked for in the den: the den's own door, never its right wall
ctx.player.x = 488;
assert.equal(hand('node'), '↑');
assert.equal(prompt('node').label, 'op_back');
assert.equal(hand('atk'), '↑');
assert.equal(prompt('go').target.x, 500);

// One keyboard binding shown per step, and the pad/touch names for it.
ctx.G.roomId = 'W2';
assert.equal(hand('jump'), 'Z');
ctx.PAD.on = true; assert.equal(hand('jump'), 'A');
ctx.TOUCH.enabled = true; ctx.PAD.on = false; assert.equal(hand('jump'), '⤒');
ctx.TOUCH.enabled = false;

// SAVES RESUME ON THE LESSON BY NAME, and an index written by the old list
// lands on the lesson that replaced it — carried past what the save already did.
assert.equal(run("TUT_STEPS[" + ctx.tutRestore({ flags: { tutId: 'pod' } }) + "].id"), 'pod');
assert.equal(run("TUT_STEPS[" + ctx.tutRestore({ flags: { tutI: 7 } }) + "].id"), 'note', 'old "buy" resumes at the letter');
assert.equal(run("TUT_STEPS[" + ctx.tutRestore({ flags: { tutI: 7, ratchetRepaired: 1, opTold: 1 } }) + "].id"), 'pod',
  'an old save that already woke him is not asked to read his letter again');
assert.equal(run("TUT_STEPS[" + ctx.tutRestore({ flags: { tutI: 2 } }) + "].id"), 'jump');
ctx.G.save.flags = { tutId: 'repair', tutI: 7 };
const repairAt = run("TUT_STEPS.findIndex(s => s.id === 'repair')");
ctx.tutSave(ctx.G.save, { i: 2 });
assert.equal(ctx.G.save.flags.tutId, 'repair', 'never written backwards'); assert.equal(writes, 0);
ctx.tutSave(ctx.G.save, { i: repairAt + 1 });
assert.equal(ctx.G.save.flags.tutId, 'pod'); assert.equal(writes, 1);

// Real updateTutor progression still requires doing the lesson, then waits
// for its acknowledgement before advancing exactly once.
ctx.G.roomId = 'W1'; ctx.G.roomDef = { w: 32, exits: { R: 'W2' } };
ctx.G.save.flags = {}; ctx.G.tut = null; ctx.G.statics = []; ctx.player.x = 10; ctx.player.vx = 0;
ctx.updateTutor(0.3); assert.equal(ctx.G.tut.i, 0); assert.equal(ctx.G.tut.hold, 0);
ctx.player.vx = 200; ctx.updateTutor(0.3);
assert.equal(ctx.G.tut.i, 0); assert(ctx.G.tut.hold > 0);
ctx.updateTutor(0.8); assert.equal(ctx.G.tut.i, 1); assert.equal(ctx.G.save.flags.tutId, 'out');
assert.equal(ctx.tutAllows('ATK'), false);
assert.equal(ctx.tutAllows('JUMP'), true, 'already available movement remains responsive');
// NOSTOS shares the rooms, not Ratchet's story: its walk passes over his steps.
ctx.isHero = () => true; ctx.G.roomId = 'A0'; ctx.G.roomDef = { w: 64, exits: { R: 'A1' } };
ctx.G.tut = { i: run("TUT_STEPS.findIndex(s => s.id === 'booth')"), t: 0, hold: 0 };
for (let k = 0; k < 8; k++) ctx.updateTutor(0.1);
assert.equal(run('TUT_STEPS[G.tut.i].id'), 'heal', 'the hero world skips the den lessons');
assert.equal(prompt('heal').label, 'tut_heal', '...and keeps its own wording');
ctx.isHero = () => false;
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
