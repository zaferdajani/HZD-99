// Source-level hostile/zero-damage contract. The browser grapple harness still
// owns geometry and motion; this keeps the safety boundary independently
// executable when a local browser is unavailable.
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'grapple.js'), 'utf8');
const calls = { knock: 0, volts: 0, sfx: 0, burst: 0, freeze: 0, rumble: 0 };
const ctx = {
  console,
  G: { enemies: [], boss: null, save: { abil: {}, flags: {} }, roomDef: { zone: 'meadow' } },
  PAL: { meadow: { glow: '#fff' } },
  isPet: e => !!e.pet,
  isWolf: e => !!e.wolf,
  packTamed: () => true,
  dealDmg: () => 0,
  armEl: () => null,
  attackKnock: () => calls.knock++,
  sfx: () => calls.sfx++,
  burst: () => calls.burst++,
  attackFreeze: () => calls.freeze++,
  padRumble: () => calls.rumble++,
  cam: { shake: 0 }, Boss: function Boss() {},
  TEXT_LAYERS: [],
};
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__test = { grapHostile, grapTargets, grapBite };', ctx);

const { grapHostile, grapTargets, grapBite } = ctx.__test;
const flags = ['dead', 'disabled', 'rescued', 'meet', 'calm', 'tame', 'tamed', 'purified', 'friendly', 'yielded', 'pet'];
const bad = flags.filter(k => grapHostile({ [k]: true }));
const tamedPackRejected = !grapHostile({ wolf: true });
const live = { x: 0, y: 0 };
ctx.G.enemies = [live, { rescued: true }, { disabled: true }];
ctx.G.boss = { purified: true, st: 'fight' };
const targets = grapTargets();
const p = { attackDmg: () => 10, gainVolts: () => calls.volts++, vx: 0, vy: 0, iT: 0 };
const accepted = grapBite(p, {}, { tx: 1, ty: 2, dx: 1, dy: 0 }, 'grapBite', false);

const ok = bad.length === 0 && tamedPackRejected && targets.length === 1 && targets[0] === live && accepted === false
  && Object.values(calls).every(n => n === 0) && ctx.cam.shake === 0;
console.log(JSON.stringify({ rejectedStates: flags.length, tamedPackRejected, bad, targets: targets.length, accepted, calls }));
if (!ok) process.exit(1);
