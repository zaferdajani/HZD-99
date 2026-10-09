// Execute the production handlers with deterministic browser lifecycle events.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const path = require('node:path');
const handlers = {};
const add = (name, fn) => (handlers[name] ||= []).push(fn);
const emit = (name, e = {}) => { for (const fn of handlers[name] || []) fn(e); };
const pad = { connected: true, index: 0, id: 'Test', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
const document = { hidden: false, hasFocus: () => true, addEventListener: add };
const c = vm.createContext({ console, window: {}, document, navigator: { maxTouchPoints: 0, getGamepads: () => [pad] },
  localStorage: { getItem: () => null }, addEventListener: add, performance: { now: () => 10000 }, audioOn() {} });
for (const file of ['engine', 'touch']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + file + '.js'), 'utf8'), c);
const run = code => vm.runInContext(code, c);
// No canvas is needed to exercise input ownership; disable its layout side effect.
run('tcResize = () => {};');
// GOING AWAY IS INSTALLED, NOT AMBIENT. blur / focus / visibilitychange used to
// be three top-level listeners in engine.js; they are one MobilePlatform
// Lifecycle now, installed from boot.js because the file that defines it is
// concatenated after engine.js. This context loads engine and touch ONLY, so
// js/mobile-platform.js is absent and installLifecycle takes its fallback path
// and registers the old three — which is the point: everything below this line
// is now also a test that losing the generated file cannot take the input with
// it. The wired path is measured in a real browser by tests/gesture-input.cjs.
assert.equal(run('typeof MobilePlatform'), 'undefined', 'this context is the fallback case');
run('installLifecycle();');
assert.equal(run('LIFE'), null, 'and it really did fall back rather than build one');
const key = (code, repeat = false) => ({ code, repeat, preventDefault() {} });
emit('keydown', key('KeyX'));
assert.equal(run("!!inP('ATK')"), true);
run("TOUCH.joy = {id: 1}; TOUCH.held[2] = 'VOK'; keys.VOK = keysP.VOK = 1; TOUCH.wheel = {open: true}; TOUCH.mapT = {3: {x: 1}};");
emit('blur');
assert.equal(run('Object.values(keys).some(Boolean) || Object.values(keysP).some(Boolean)'), false);
assert.equal(run('!!(TOUCH.joy || TOUCH.wheel || TOUCH.mapT || Object.keys(TOUCH.held).length)'), false);
pad.buttons[0].pressed = true;
c.pollGamepad(); emit('keydown', key('KeyX'));
assert.equal(run('Object.values(keys).some(Boolean)'), false, 'background poll and key event stay silent');
emit('focus'); c.pollGamepad();
assert.equal(run("!!inP('JUMP') || !!inD('JUMP')"), false, 'held pad does not jump on focus');
pad.buttons[0].pressed = false; c.pollGamepad();
pad.buttons[0].pressed = true; c.pollGamepad();
assert.equal(run("!!inP('JUMP')"), true, 'fresh controller press works after release');
document.hidden = true; emit('visibilitychange');
assert.equal(run('Object.values(keysP).some(Boolean)'), false, 'mobile app switch clears press edges');
document.hidden = false; emit('visibilitychange');
emit('keydown', key('KeyX', true));
assert.equal(run("!!inP('ATK')"), false, 'key repeat cannot replay cancelled attack');
emit('keyup', key('KeyX')); emit('keydown', key('KeyX'));
assert.equal(run("!!inP('ATK')"), true, 'fresh keyboard press recovers');
run("TOUCH.wheel = {id: 7, sel: {code: 'VCAST', on: () => true}}; keys.VHEAL = keysP.VHEAL = 1; TOUCH.held[7] = 'VHEAL';");
c.tCancel({ preventDefault() {}, changedTouches: [{identifier: 7}] });
assert.equal(run('!!keys.VCAST || !!keysP.VCAST || !!keys.VHEAL || !!keysP.VHEAL || !!TOUCH.wheel'), false, 'touch cancellation never casts or leaves a hold');
console.log('OK — focus loss clears all input, background input is blocked, fresh input recovers and touch cancellation cannot fire');
