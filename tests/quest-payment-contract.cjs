// A hand-in is one durable transaction. Queued callbacks, crashes and reload
// recovery may replay a caller, but must never split reward from quest state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness(save, persistResult = true) {
  const out = { persists: 0, wins: 0, bursts: 0, relicCards: 0, forgeCards: 0, stored: null };
  const ctx = vm.createContext({
    console,
    persist: () => {
      out.persists++;
      if (!persistResult) return false;
      out.stored = JSON.stringify(ctx.G.save);
      return true;
    },
    t: key => key,
    sfx: key => { if (key === 'win') out.wins++; },
    burst: () => { out.bursts++; },
    player: { x: 10, y: 20, w: 12 },
    revisedStory: () => true,
    grantWeapon: (stage, target) => {
      if (stage !== 'single') return false;
      target.flags = target.flags || {};
      target.flags.crystal = 1;
      target.weaponMode = 'single';
      return true;
    },
    forgeCrystal: stored => { assert.equal(stored, true); out.forgeCards++; return true; },
    G: {
      save,
      toast: () => {},
      grantRelic: (id, stored) => {
        assert.equal(stored, true);
        assert(ctx.G.save.relics.includes(id));
        out.relicCards++;
      },
    },
  });
  vm.runInContext(fs.readFileSync('js/quests.js', 'utf8'), ctx);
  return { ctx, out };
}

// Ordinary fetch: one write contains reward, item removal and done state.
{
  const { ctx, out } = harness({ quests: { servo_coil: 'active' }, bag: { coil: 1 }, scrap: 0, iq: 0, flags: {} });
  assert.equal(vm.runInContext("questPay(questById('servo_coil'))", ctx), true);
  assert.equal(out.stored, JSON.stringify(ctx.G.save));
  assert.equal(ctx.G.save.scrap, 60);
  assert.equal(ctx.G.save.iq, 10);
  assert.equal(ctx.G.save.quests.servo_coil, 'done');
  assert.equal(ctx.G.save.bag.coil, undefined);
  assert.deepEqual({ persists: out.persists, wins: out.wins, bursts: out.bursts }, { persists: 1, wins: 1, bursts: 1 });
  const paid = JSON.stringify(ctx.G.save);
  assert.equal(vm.runInContext("questPay(questById('servo_coil'))", ctx), false);
  assert.equal(JSON.stringify(ctx.G.save), paid);
  assert.equal(out.persists, 1);
}

// Relic reward: persisted save is already done, paid and owns the coin.
{
  const save = { quests: { ratchet_deep: 'active' }, flags: { termRead: { 20: 1 } }, scrap: 5, iq: 0, relics: [] };
  const { ctx, out } = harness(save);
  assert.equal(vm.runInContext("questPay(questById('ratchet_deep'))", ctx), true);
  const disk = JSON.parse(out.stored);
  assert.equal(disk.quests.ratchet_deep, 'done');
  assert.equal(disk.scrap, 85);
  assert.deepEqual(disk.relics, ['coin']);
  assert.equal(out.relicCards, 1);
  const reload = harness(disk);
  assert.equal(vm.runInContext("questPay(questById('ratchet_deep'))", reload.ctx), false);
  assert.equal(reload.out.persists, 0);
}

// Forge reward: no durable save can be done without the Purifier and camp move.
{
  const save = { quests: { ratchet_forge: 'active' }, bag: { cshard: 1 }, flags: {}, scrap: 0, iq: 0 };
  const { ctx, out } = harness(save);
  assert.equal(vm.runInContext("questPay(questById('ratchet_forge'))", ctx), true);
  const disk = JSON.parse(out.stored);
  assert.equal(disk.quests.ratchet_forge, 'done');
  assert.equal(disk.bag.cshard, undefined);
  assert.equal(disk.flags.crystal, 1);
  assert.equal(disk.flags.ratchetCamp, 1);
  assert.equal(disk.weaponMode, 'single');
  assert.equal(out.forgeCards, 1);
}

// A failed disk write rolls the in-memory hand-in back and presents nothing.
{
  const save = { quests: { ratchet_forge: 'active' }, bag: { cshard: 1 }, flags: {}, scrap: 0, iq: 0 };
  const before = JSON.stringify(save);
  const { ctx, out } = harness(save, false);
  assert.equal(vm.runInContext("questPay(questById('ratchet_forge'))", ctx), false);
  assert.equal(JSON.stringify(ctx.G.save), before);
  assert.equal(out.forgeCards, 0);
  assert.equal(out.wins, 0);
  assert.equal(out.bursts, 0);
}

console.log('PASS quest payments persist reward, ownership, item removal and done state atomically');
