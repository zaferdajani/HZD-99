const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const src = fs.readFileSync('js/wolfmount.js', 'utf8');
for (const key of ['alRideGallop', 'alRideLeap', 'alRideRear']) assert.match(src, new RegExp(`['\"]${key}['\"]`));
assert.match(src, /drawStripCell\(c2, key/);
assert.match(fs.readFileSync('js/packcall.js', 'utf8'), /G\.mount && G\.mount\.w === w/);
assert.doesNotMatch(fs.readFileSync('js/nfcover.js', 'utf8').replace(/\/\/.*$/gm, ''), /Math\.random/);

class Player { update() {} hurt() {} draw() {} speed() { return 100; } }
const G = { save: { flags: { wolfMount: 1, wmTold: 1 } }, toast() {} };
const ctx = vm.createContext({ console, Player, G, player: null, PACK_CALL: { leave: 3 }, ARMS: [],
  mediaFetch() {}, sfx() {}, burst() {}, t: k => k, clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
  inD: () => false, inP: () => false, isHero: () => false, drawStripCell: () => true });
vm.runInContext(src, ctx);
const p = { x: 10, y: 10, w: 20, h: 30, vx: 0, vy: 0, face: 1, on: true, iT: 0, armCD: 0 };
const fresh = { x: 0, y: 10, w: 40, h: 28, vx: 0, vy: 0, leaveT: 0 };
G.packWolf = fresh;
assert.equal(vm.runInContext('wmMount', ctx)(p), true);
assert.equal(G.mount.stam, 100);
G.mount.stam = 35;
vm.runInContext('wmDismount', ctx)(p, false);
assert.equal(fresh.mountStam, 35);
assert.equal(vm.runInContext('wmMount', ctx)(p), true);
assert.equal(G.mount.stam, 35, 'voluntary remount must retain stamina');
vm.runInContext('wmDismount', ctx)(p, true);
assert.equal(fresh.mountStam, 35);
assert.ok(fresh.leaveT > 0, 'spent wolf leaves instead of being remounted');
G.packWolf = { x: 0, y: 10, w: 40, h: 28, vx: 0, vy: 0, leaveT: 0 };
assert.equal(vm.runInContext('wmMount', ctx)(p), true);
assert.equal(G.mount.stam, 100, 'a genuinely new summon starts full');

const manifest = JSON.parse(fs.readFileSync('assets/roomassets.json', 'utf8'));
for (const key of ['alRideGallop', 'alRideLeap', 'alRideRear']) assert.ok(manifest.boot.includes(key), `${key} must preload`);
console.log('PASS integrated wolf-mount film is wired and same-summon stamina cannot be reset');
