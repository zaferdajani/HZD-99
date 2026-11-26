// THE SWORD IS THE CRYSTAL SWORD — owner, 2026-11-26: "Why are you wasting my tokens on
// hallucination of wrong versions of the sword and how it looks in its stages, instead of giving
// [Higgsfield a] reference using the existing images of the sword and its shapes?"
// The canon plates are assets/source/crystal/ (crystal_single, sword_ground, crystal_double). Every
// image of her holding a weapon is generated FROM them. assets/source/weapons/canon.json registers
// every weapon-tier art key the game loads:
//   A  every weapon-tier key in js/media.js (a key naming Single, Dual or Joined, not a light strip)
//      is registered: either in `canon` (made from the crystal plates) or in `queue` (older art,
//      waiting to be re-fired)
//   B  every `canon` entry names at least one crystal plate as a reference, and that plate is on disk,
//      and names its generation job
//   C  the queue only shrinks: never more than the 25 keys it held on 2026-11-26, and every queued
//      key still exists in js/media.js (a re-fired key moves to `canon`, it is not dropped)
//   D  a key added after 2026-11-26 cannot go into the queue: new weapon art is canon or it fails
// No browser: it reads the files.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
console.log('── weapon-canon — every image of her weapon is made from the crystal sword plates');
const src = fs.readFileSync(path.join(root, 'js/media.js'), 'utf8');
const reg = JSON.parse(fs.readFileSync(path.join(root, 'assets/source/weapons/canon.json'), 'utf8'));
const keys = {}; const re = /(\w+):\s*'(assets\/[^']+)'/g; let m;
while ((m = re.exec(src))) if (/(Single|Dual|Joined)/.test(m[1]) && !/Fx$/.test(m[1])) keys[m[1]] = m[2];
const canon = reg.canon || {}, queue = reg.queue || {};
const QUEUE_2026_11_26 = ['swingDual', 'swingDualCharge', 'swingJoined', 'heroJoinedProjectile', 'heroJoinedThrow', 'swingSingle',
  'swingSingleCharge', 'swingDownSingle', 'swingDownDual', 'swingDownJoined', 'heroHeldSingle', 'heroHeldDual', 'heroHeldJoined',
  'heroGateSingle', 'heroGateDual', 'heroGateJoined', 'heroClimbSingle', 'heroClimbDual', 'heroClimbJoined', 'heroHatchSingle',
  'heroHatchDual', 'heroHatchJoined', 'heroHopSingle', 'heroHopDual', 'heroHopJoined'];
const unreg = Object.keys(keys).filter(k => !canon[k] && !queue[k]);
check('A  every weapon-tier art key is registered (canon or queued)', unreg.length === 0, unreg.length ? unreg : Object.keys(keys).length + ' keys');
const crystal = Object.values(reg.refs || {});
const weak = Object.entries(canon).filter(([, e]) => !e || !Array.isArray(e.refs) || !e.refs.some(r => crystal.includes(r) && fs.existsSync(path.join(root, r))) || !e.job);
check('B  every canon entry was generated from a crystal plate on disk, with its job named', weak.length === 0 && crystal.length >= 2 && crystal.every(r => fs.existsSync(path.join(root, r))), weak.map(([k]) => k));
const gone = Object.keys(queue).filter(k => !keys[k]);
check('C  the queue only shrinks (<= 25) and every queued key still exists', Object.keys(queue).length <= QUEUE_2026_11_26.length && gone.length === 0, { queued: Object.keys(queue).length, gone });
const sneaked = Object.keys(queue).filter(k => !QUEUE_2026_11_26.includes(k));
check('D  no weapon art added after 2026-11-26 is queued instead of made from the plates', sneaked.length === 0, sneaked);
console.log('   still to re-fire from the crystal plates: ' + Object.keys(queue).length + ' strips; missing per-weapon art: ' + (reg.missing || []).join(', '));
if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
console.log('\nOK — weapon art is registered against the crystal sword');
