const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness(save, persistResult = true) {
  const out = { persists: 0, wins: 0, bursts: 0, relicCards: 0, forgeCards: 0, itemCards: 0, stored: null };
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
    showItem: () => { out.itemCards++; },
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

{
  const { ctx, out } = harness({ quests: { servo_coil: 'active' }, bag: { coil: 1 }, scrap: 0, iq: 0, flags: {} });
  assert.equal(vm.runInContext("questPay(questById('servo_coil'))", ctx), true);
  assert.equal(out.stored, JSON.stringify(ctx.G.save));
  assert.equal(ctx.G.save.scrap, 60);
  assert.equal(ctx.G.save.iq, 10);
  assert.equal(ctx.G.save.quests.servo_coil, 'done');
  assert.equal(ctx.G.save.bag.coil, undefined);
  assert.equal(out.persists, 1);
  assert.equal(vm.runInContext("questPay(questById('servo_coil'))", ctx), false);
  assert.equal(out.persists, 1);
}

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

{
  const save = { quests: { patch_harness: 'active' }, packKills: 3, flags: {}, scrap: 0, iq: 0 };
  const { ctx, out } = harness(save);
  assert.equal(vm.runInContext("questPay(questById('patch_harness'))", ctx), true);
  const disk = JSON.parse(out.stored);
  assert.equal(disk.quests.patch_harness, 'done');
  assert.equal(disk.flags.wolfMount, 1);
  assert.equal(out.itemCards, 1);
}

{
  const save = { quests: { patch_harness: 'active' }, packKills: 3, flags: {}, scrap: 0, iq: 0 };
  const before = JSON.stringify(save);
  const { ctx, out } = harness(save, false);
  assert.equal(vm.runInContext("questPay(questById('patch_harness'))", ctx), false);
  assert.equal(JSON.stringify(ctx.G.save), before);
  assert.equal(out.itemCards + out.wins + out.bursts, 0);
}

{
  const save = { quests: { ratchet_forge: 'active' }, bag: { cshard: 1 }, flags: {}, scrap: 0, iq: 0 };
  const before = JSON.stringify(save);
  const { ctx, out } = harness(save, false);
  assert.equal(vm.runInContext("questPay(questById('ratchet_forge'))", ctx), false);
  assert.equal(JSON.stringify(ctx.G.save), before);
  assert.equal(out.forgeCards + out.wins + out.bursts, 0);
}

{
  const broken = { quests: { ratchet_forge: 'done' }, flags: {}, weaponVersion: 1, weaponMode: 'claws' };
  const { ctx } = harness(broken);
  vm.runInContext('questMigrate(G.save)', ctx);
  assert.equal(ctx.G.save.flags.crystal, 1);
  assert.equal(ctx.G.save.flags.ratchetCamp, 1);
  assert.equal(ctx.G.save.weaponMode, 'single');
  const repaired = JSON.stringify(ctx.G.save);
  vm.runInContext('questMigrate(G.save)', ctx);
  assert.equal(JSON.stringify(ctx.G.save), repaired);
}

{
  const broken = { quests: { patch_harness: 'done' }, flags: {} };
  const { ctx } = harness(broken);
  vm.runInContext('questMigrate(G.save)', ctx);
  assert.equal(ctx.G.save.flags.wolfMount, 1);
}
console.log('PASS quest payments are atomic and completed forge/harness saves recover their rewards');

