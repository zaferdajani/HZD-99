// The payment function itself must be idempotent. UI routing hides completed
// errands, but queued callbacks and reload recovery may still replay a caller.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let persists = 0, wins = 0, bursts = 0;
const ctx = vm.createContext({
  console,
  persist: () => { persists++; },
  t: key => key,
  sfx: key => { if (key === 'win') wins++; },
  burst: () => { bursts++; },
  player: { x: 10, y: 20, w: 12 },
  G: {
    save: { quests: { servo_coil: 'active' }, bag: { coil: 1 }, scrap: 0, iq: 0, flags: {} },
    toast: () => {},
  },
});
vm.runInContext(fs.readFileSync('js/quests.js', 'utf8'), ctx);

const first = vm.runInContext("questPay(questById('servo_coil'))", ctx);
assert.equal(first, true);
assert.equal(ctx.G.save.scrap, 60);
assert.equal(ctx.G.save.iq, 10);
assert.equal(ctx.G.save.quests.servo_coil, 'done');
assert.equal(ctx.G.save.bag.coil, undefined);
assert.deepEqual({ persists, wins, bursts }, { persists: 1, wins: 1, bursts: 1 });

const paid = JSON.stringify(ctx.G.save);
const second = vm.runInContext("questPay(questById('servo_coil'))", ctx);
assert.equal(second, false);
assert.equal(JSON.stringify(ctx.G.save), paid);
assert.deepEqual({ persists, wins, bursts }, { persists: 1, wins: 1, bursts: 1 });
console.log('PASS quest payment is once-only even when its callback is replayed');
