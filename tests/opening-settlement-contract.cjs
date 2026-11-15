'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/opening.js', 'utf8');
function harness(save, writes) {
  const out = { writes: 0, charges: 0, cards: 0 };
  const ctx = vm.createContext({
    console,
    G: { save, roomId: 'A0B', state: 'PLAY', dialog: null },
    player: null,
    persist: () => {
      const ok = writes[out.writes] !== false;
      out.writes++;
      return ok;
    },
    npcKey: s => s.key,
    npcLive: s => !!ctx.G.save.flags['on_' + s.key],
    npcCharge: () => { out.charges++; return true; },
    invCount: id => (ctx.G.save.items && ctx.G.save.items[id]) || 0,
    isHero: () => false,
    t: k => k,
    sfx: () => {},
    mediaFetch: () => {},
    ratchetReleaseStart: () => true,
    showItem: () => { out.cards++; return {}; },
    qState: id => (ctx.G.save.quests && ctx.G.save.quests[id]) || 'none',
    setTimeout,
  });
  vm.runInContext(source, ctx);
  return { ctx, out };
}

// Exercise the real repair callback. A failed write must leave the unique
// cell and dark body untouched; retry settles all durable repair flags once.
{
  const initial = { storyVersion: 3, flags: {}, items: { ratchetCell: 1 }, quests: {} };
  const { ctx, out } = harness(initial, [false, true, false, true, true]);
  vm.runInContext("opRatchetRestored({key:'A0B|ratchet'})", ctx);
  assert.equal(out.writes, 1);
  assert.equal(out.charges, 0);
  assert.equal(ctx.G.save, initial, 'failed repair did not restore original save object');
  assert.equal(ctx.G.save.items.ratchetCell, 1);

  vm.runInContext("opRatchetRestored({key:'A0B|ratchet'})", ctx);
  assert.equal(out.writes, 2);
  assert.equal(out.charges, 1);
  assert.equal(ctx.G.save.items.ratchetCell, undefined);
  assert.equal(ctx.G.save.flags['on_A0B|ratchet'], 1);
  assert.equal(ctx.G.save.flags.ratchetRepaired, 1);
  assert.equal(ctx.G.save.flags.ratchetReleasePending, 1);

  const restored = ctx.G.save;
  vm.runInContext("opExplain({key:'A0B|ratchet'})", ctx);
  vm.runInContext('G.dialog.onEnd()', ctx);
  assert.equal(out.writes, 3);
  assert.equal(ctx.G.save, restored, 'failed story settlement did not roll back to restored save');
  assert.equal(ctx.G.save.flags.opTold, undefined);
  assert.equal(ctx.G.save.items.batt, undefined);

  vm.runInContext("opExplain({key:'A0B|ratchet'}); G.dialog.onEnd()", ctx);
  assert.equal(out.writes, 4);
  assert.equal(ctx.G.save.flags.opTold, 1);
  assert.equal(ctx.G.save.flags.ratchetSpareGiven, 1);
  assert.equal(ctx.G.save.items.batt, 1);
  assert.equal(ctx.G.save.quests.ratchet_forge, 'active');
  assert.equal(out.cards, 1, 'spare presentation must follow durable settlement');

  vm.runInContext("opExplain({key:'A0B|ratchet'}); G.dialog.onEnd()", ctx);
  assert.equal(ctx.G.save.items.batt, 1, 'replayed explanation duplicated the spare cell');
}

// If the optional wrist reaction cannot start, it is retired durably before
// the explanation opens, so it cannot replay later in the wrong order.
{
  const save = { storyVersion: 3, flags: { ratchetRepaired: 1, ratchetReleasePending: 1 }, items: {}, quests: {} };
  const { ctx, out } = harness(save, [true]);
  ctx.ratchetReleaseStart = () => false;
  vm.runInContext("if (opSkipRatchetRelease()) opExplain({key:'A0B|ratchet'})", ctx);
  assert.equal(out.writes, 1);
  assert.equal(ctx.G.save.flags.ratchetReleased, 1);
  assert.equal(ctx.G.save.flags.ratchetReleasePending, undefined);
  assert.equal(ctx.G.state, 'DIALOG');
}

// Exercise Old Servo's actual interaction callback at the same failure edge.
{
  const initial = { storyVersion: 3, flags: {}, items: { batt: 1 }, quests: {} };
  const { ctx, out } = harness(initial, [false, true]);
  const servo = "({type:'npc',extra:'servo',key:'A1|servo'})";
  assert.equal(vm.runInContext(`opServo(${servo})`, ctx), true);
  vm.runInContext('G.dialog.onEnd()', ctx);
  assert.equal(ctx.G.save, initial);
  assert.equal(ctx.G.save.items.batt, 1);
  assert.equal(ctx.G.save.flags['on_A1|servo'], undefined);
  assert.equal(out.charges, 0);

  assert.equal(vm.runInContext(`opServo(${servo})`, ctx), true);
  vm.runInContext('G.dialog.onEnd()', ctx);
  assert.equal(ctx.G.save.items.batt, undefined);
  assert.equal(ctx.G.save.flags['on_A1|servo'], 1);
  assert.equal(ctx.G.save.flags.servoIntro, 1);
  assert.equal(out.charges, 1);
}

console.log('PASS actual Ratchet/Servo callbacks settle durable opening state atomically');
