// Durable-state contract only. Wake animation, dialogue continuation, audio and
// control feel still require the rendered browser and uninterrupted campaign.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const game = fs.readFileSync('js/game.js', 'utf8');
function fn(name) {
  const start = game.indexOf('function ' + name + '(');
  assert(start >= 0, name + ' missing');
  return game.slice(start, game.indexOf('\n}', start) + 2);
}
function runCase(save, key, item, persistResult = true) {
  const out = { writes: 0, stored: null };
  const ctx = vm.createContext({
    console,
    isHero: () => false,
    npcCellItem: () => item,
    persist: () => {
      out.writes++;
      if (!persistResult) return false;
      out.stored = JSON.stringify(ctx.G.save);
      return true;
    },
    G: { save },
  });
  vm.runInContext(fn('npcRestoreTransaction'), ctx);
  const result = vm.runInContext(`npcRestoreTransaction({}, ${JSON.stringify(key)})`, ctx);
  return { ctx, out, result };
}

{
  const save = { storyVersion: 3, flags: {}, items: { ratchetCell: 1 }, scrap: 0 };
  const { ctx, out, result } = runCase(save, 'A0B|ratchet', 'ratchetCell');
  assert.equal(result, true);
  assert.equal(out.writes, 1);
  assert.equal(out.stored, JSON.stringify(ctx.G.save));
  assert.equal(ctx.G.save.items.ratchetCell, undefined);
  assert.equal(ctx.G.save.items.kit, 1);
  assert.equal(ctx.G.save.items.batt, 1);
  assert.equal(ctx.G.save.flags['on_A0B|ratchet'], 1);
  assert.equal(ctx.G.save.flags.ratchetRepaired, 1);
  assert.equal(ctx.G.save.flags.ratchetSpareGiven, 1);
  assert.equal(vm.runInContext("npcRestoreTransaction({}, 'A0B|ratchet')", ctx), false);
  assert.equal(out.writes, 1, 'replayed restore wrote again');
}

{
  const save = { storyVersion: 3, flags: {}, items: { batt: 1 }, scrap: 0 };
  const { ctx, out, result } = runCase(save, 'A1|servo', 'batt');
  assert.equal(result, true);
  assert.equal(out.writes, 1);
  assert.equal(ctx.G.save.items.batt, undefined);
  assert.equal(ctx.G.save.items.kit, 1);
  assert.equal(ctx.G.save.flags['on_A1|servo'], 1);
}

{
  const save = { storyVersion: 3, flags: {}, items: { batt: 1 }, scrap: 7 };
  const before = JSON.stringify(save);
  const { ctx, out, result } = runCase(save, 'B1|mono', 'batt', false);
  assert.equal(result, false);
  assert.equal(out.writes, 1);
  assert.equal(JSON.stringify(ctx.G.save), before, 'failed write did not roll back memory');
}

console.log('PASS NPC restore commits cell, awake/repaired state and durable gift atomically');
