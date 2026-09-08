// Execute production quest, interaction, equipment and crossing decisions.
// Scene/audio are inert; this is not a substitute for a physical playthrough.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '../js/' + name + '.js'), 'utf8');
const game = read('game');
// Production functions use column-zero closing braces (nested blocks indent).
function fn(name) {
  const start = game.indexOf('function ' + name + '(');
  assert(start >= 0, 'production function exists: ' + name);
  const firstLine = game.slice(start, game.indexOf('\n', start));
  return firstLine.endsWith('}') ? firstLine : game.slice(start, game.indexOf('\n}', start) + 2);
}
const noop = () => {}, messages = [];
let hero = false;
const ctx = vm.createContext({ console, Math, Set,
  isHero: () => hero, persist: noop, burst: noop, sfx: noop, npcSay: noop,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  bossActive: () => false, demoWall: () => false, standingTier: () => 0,
  t: key => key.startsWith('d_') ? ['Greeting'] : key,
  cam: { shake: 0 }, PURIFY_VID: {}, NPC_AWAKE: new Set(),
  TRANS_DUR: 0.4, transHeld: false, transCv: null, transSnap: null,
  player: { x: 20, y: 420, w: 28, h: 36, vx: 0, vy: 0, lastSafe: { x: 20, y: 420 }, hurt: noop },
  G: { state: 'PLAY', flash: 0, statics: [],
    save: { flags: { tut: 1 }, quests: {}, items: {}, bag: {}, iq: 0, scrap: 0, weaponVersion: 1, weaponMode: 'claws' },
    toast: s => messages.push(s) },
});
const run = s => vm.runInContext(s, ctx);
for (const name of ['world', 'weapons', 'quests']) run(read(name));
for (const name of ['invCount', 'invAdd', 'invTake', 'npcKey', 'npcLive', 'npcCharge', 'forgeCrystal', 'doInteract', 'checkTransitions', 'gateDoorsAll', 'gateDoors']) run(fn(name));
run(game.slice(game.indexOf('const NPC_GIFT ='), game.indexOf('\n};', game.indexOf('const NPC_GIFT =')) + 3));
run(game.slice(game.indexOf('const GATE_ROOM ='), game.indexOf('\n};', game.indexOf('const GATE_ROOM =')) + 3));
ctx.showItem = (name, desc) => { ctx.G.state = 'DIALOG'; ctx.G.dialog = { name, lines: [desc], onEnd: null }; };
const rooms = run('ROOMS');
// Graph reachability uses production depth-door visibility and exit flags.
// This proves ordering has no circular weapon dependency, not jump geometry.
function route(from, to) {
  const queue = [[from]], seen = new Set();
  while (queue.length) {
    const steps = queue.shift(), id = steps.at(-1);
    if (id === to) return steps;
    if (seen.has(id)) continue;
    seen.add(id);
    const exits = Object.values(rooms[id].exits || {}).filter(e => typeof e !== 'object' || !e.flag || ctx.G.save.flags[e.flag]);
    const next = exits.map(e => typeof e === 'object' ? e.to : e).concat(ctx.gateDoors(id).map(e => e.to));
    for (const n of next) if (rooms[n] && !seen.has(n)) queue.push(steps.concat(n));
  }
  return null;
}
assert(route('A0B', 'CV3'), 'stone cave is reachable in the room graph without any sword or sage flag');
assert(route('CV3', 'A0B'), 'stone cave has a return route to the first forge');
function finishDialog() {
  const next = ctx.G.dialog && ctx.G.dialog.onEnd;
  ctx.G.dialog = null; ctx.G.state = 'PLAY'; if (next) next();
}
const ratchet = { type: 'npc', room: 'A0B', extra: 'ratchet', x: 160, y: 420, w: 28, h: 36 };
ctx.G.roomId = 'A0B';
ctx.doInteract(ratchet); finishDialog();
assert(!ctx.npcLive(ratchet), 'Ratchet cannot wake without his battery');
ctx.invAdd('batt'); ctx.doInteract(ratchet); finishDialog();
assert(ctx.npcLive(ratchet), 'inserting battery wakes Ratchet');
assert.equal(ctx.invCount('batt'), 0, 'battery is used exactly once');
assert(!ctx.weaponOwned('single'), 'waking Ratchet must not give an unearned sword');
finishDialog(); finishDialog(); finishDialog();
assert.equal(ctx.qState('ratchet_forge'), 'active', 'waking dialogue leads into the stone quest automatically');
assert(!ctx.qDone(ctx.questById('ratchet_forge')), 'empty inventory cannot finish forge errand');
ctx.G.state = 'PLAY'; ctx.doInteract(ratchet); finishDialog();
assert(!ctx.weaponOwned('single'), 'talking again without stone cannot grant sword');
assert(rooms.CV3.ents.some(e => e[0] === 'pillar'), 'stone has a real quarry pillar in CV3');
ctx.questTake('cshard');
assert(ctx.qDone(ctx.questById('ratchet_forge')));
assert(!ctx.weaponOwned('single'), 'finding stone alone does not forge remotely');
ctx.G.state = 'PLAY'; ctx.doInteract(ratchet); finishDialog();
assert(ctx.weaponOwned('single'), 'returning stone to Ratchet forges the first sword');
assert.equal(ctx.qState('ratchet_forge'), 'done');
assert.equal(ctx.G.save.bag.cshard, undefined, 'forge consumes the stone');
assert(!ctx.weaponOwned('dual') && !ctx.weaponOwned('joined'), 'forge grants only first sword');

function pickup(extra) {
  const s = { type: 'secret', extra, x: 20, y: 420 };
  ctx.G.statics = [s]; ctx.doInteract(s); return s;
}
let s = pickup('crystal2');
assert(ctx.G.statics.includes(s) && !ctx.G.save.flags.sr_crystal2, 'locked second sword stays collectible');
ctx.G.save.flags.bossPrism = 1; pickup('crystal2');
assert.equal(ctx.weaponMode(), 'dual');
assert(!ctx.weaponOwned('joined'), 'second sword does not manufacture connector');
s = pickup('connector');
assert(ctx.G.statics.includes(s) && !ctx.G.save.flags.sr_connector, 'locked connector stays collectible');
ctx.G.save.flags.bossAtlas = 1; pickup('connector');
assert.equal(ctx.weaponMode(), 'joined', 'connector joins the two earned swords');

function crossing(room, side) {
  ctx.G.roomId = room; ctx.G.roomDef = rooms[room]; ctx.G.grid = [];
  ctx.G.trans = null; ctx.G.state = 'PLAY';
  ctx.player.x = side === 'R' ? rooms[room].w * 32 + 3 : -ctx.player.w - 3;
  ctx.player.y = 420; ctx.checkTransitions();
  return ctx.G.trans && ctx.G.trans.to;
}
delete ctx.G.save.flags.crystal; delete ctx.G.save.flags.crystal2; delete ctx.G.save.flags.connector;
ctx.G.save.weaponMode = 'claws';
assert.equal(crossing('GA1T', 'L'), 'GA1', 'unarmed player can return from sage tunnel');
messages.length = 0;
assert.equal(crossing('GA1T', 'R'), null, 'first sage chamber is blocked until cave stone returns to forge');
assert(ctx.player.x <= rooms.GA1T.w * 32 - ctx.player.w, 'blocked crossing keeps player inside room');
assert(messages.some(x => /forge|stone|sage/i.test(x)), 'blocked crossing explains the story prerequisite');
ctx.grantWeapon('single');
assert.equal(crossing('GA1T', 'R'), 'GA1D', 'forged blade opens the first sage chamber');
ctx.equipWeapon('claws');
assert.equal(crossing('GA1T', 'R'), 'GA1D', 'putting the earned sword away does not relock the story');
delete ctx.G.save.flags.crystal; hero = true;
assert.equal(crossing('GA1T', 'R'), 'GA1D', 'robot canon does not rewrite NOSTOS progression');
console.log('PASS: battery waking, automatic quest, earned forge, distinct sword/connector pickups and first sage story gate');
