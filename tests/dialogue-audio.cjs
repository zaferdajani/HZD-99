// Exercise production voice ownership and async cancellation with controllable
// Audio objects; no synthetic replacement of the functions under test.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const path = require('node:path');
const made = [], timers = new Map(); let timerId = 0;
class FakeAudio {
  constructor() { this.events = {}; this.paused = true; made.push(this); }
  play() { this.paused = false; return { catch: fn => { this.reject = fn; } }; }
  pause() { this.paused = true; }
  addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
}
const c = vm.createContext({ console, Audio: FakeAudio, Math, Set, addEventListener() {},
  G: { state: 'PLAY', save: { flags: {} } }, LANG: 'en', MBUF: {},
  I18N: { en: { d_ratchet: ['Recorded greeting.', 'Recorded farewell.'] } },
  window: { VOX_FILES: { ratchet0: 'greeting.ogg', ratchet1: 'farewell.ogg' } },
  performance: { now: () => 1000 },
  setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; },
  clearTimeout: id => timers.delete(id),
  setInterval: fn => { const id = ++timerId; timers.set(id, fn); return id; },
  clearInterval: id => timers.delete(id)
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8'), c);
// Do not replace npcSay or its gates. Count the old randomized fallback only.
vm.runInContext('let chirps = 0; sfxVoice = () => { chirps++; };', c);
const call = code => vm.runInContext(code, c);
c.G.state = 'DIALOG'; c.G.dialog = { npc: 'ratchet', i: 0, lines: ['An unpowered machine’s note.'] };
assert.equal(c.npcSay('ratchet', 0), false);
assert.equal(made.length, 0, 'notes and quest text cannot reuse an unrelated recorded greeting');
assert.equal(call('chirps'), 0, 'unrecorded dialogue does not invent random chirps');
c.G.dialog.lines = ['Recorded farewell.', 'An unrecorded lesson.'];
assert.equal(c.npcSay('ratchet', 0), true);
const first = made[0]; assert.equal(first.src, 'farewell.ogg', 'match the text, not reused page index');
assert.equal(c.npcSay('ratchet', 1), false);
assert(first.paused); assert.equal(first.src, '', 'unvoiced next page cancels previous line');
first.reject(new Error('late decode failure'));
assert.equal(call('chirps'), 0, 'stale media rejection cannot restart any voice');
c.G.dialog.lines = ['Recorded greeting.', 'Recorded farewell.'];
c.npcSay('ratchet', 0); const old = made.at(-1);
c.npcSay('ratchet', 1); const next = made.at(-1);
old.reject(new Error('late error'));
assert(!next.paused, 'old rejection cannot cancel a newer sentence');
c.npcHush(); assert(next.paused); assert.equal(call('NPCNODE'), null);
c.LANG = 'ar'; assert.equal(c.npcSay('ratchet', 0), false); assert.equal(call('chirps'), 0);
c.LANG = 'en'; call('MUTED = true'); assert.equal(c.npcSay('ratchet', 0), false); call('MUTED = false');
assert.equal(c.hzdSay('purr', 0), false, 'dialogue owns the vocal channel');
assert.equal(c.hzdHold('charge'), false, 'dialogue cannot start a charge vocal');
c.G.state = 'PLAY'; c.G.wake = { t: 2 };
assert.equal(c.narrativeAudioActive(), true); assert.equal(c.hzdSay('yalla', 0), false);
c.G.wake = null; assert.equal(c.narrativeAudioActive(), false);
// A voice already playing must be faded on entry, not merely prevent new ones.
call(`let stops=0, fades=0;
AC={currentTime:0};
HZDPLAY.add({src:{stop(){stops++;}},gain:{gain:{value:.4,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){fades++;}}}});
G.wake={t:2}; narrativeAudioTick();`);
assert.equal(call('stops'), 1); assert.equal(call('fades'), 1); assert.equal(call('HZDPLAY.size'), 0);
console.log('PASS: exact dialogue takes, unpowered notes, silent unmatched locales, stale errors, page cancellation and story voice priority');

// The attack branch used to retry a rejected voice on every same-frame call
// during waking because its timestamp advanced only after successful playback.
call(`let requested=[]; player={combo:0}; wielded=()=> 'claws';
playBuf=(key)=>{requested.push(key);return true;}; HZDT=0;
G.wake={t:2}; sfx('atk'); sfx('atk');`);
assert.equal(call("requested.filter(k=>k.startsWith('hzd_')).length"), 0, 'scripted wake rejects attack vocals before submitting playback');
call("G.wake=null; requested=[]; HZDT=0; sfx('atk'); sfx('atk');");
assert.equal(call("requested.filter(k=>k.startsWith('hzd_')).length"), 1, 'two same-frame combat swings produce one vocal request');
console.log('PASS: blocked narrative attack requests and same-frame combat vocal gate');
