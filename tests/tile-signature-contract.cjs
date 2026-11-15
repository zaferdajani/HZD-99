// Save/cache identity contract only. Pixel equality and room-crossing costs
// remain the responsibility of the Chromium roomcache suite.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const src = fs.readFileSync('js/game.js', 'utf8');
const start = src.indexOf('function tileBrokenSig(');
const end = src.indexOf('\n}\n', start) + 3;
assert(start >= 0 && end > start, 'tileBrokenSig source missing');
const ctx = vm.createContext({});
vm.runInContext(src.slice(start, end), ctx);

const a = { 'A2:3:4': 1, 'A2:8:2': 1 };
const sameDifferentOrder = { 'A2:8:2': 1, 'A2:3:4': 1 };
const b = { 'A2:3:4': 1, 'A2:9:2': 1 };
assert.equal(ctx.tileBrokenSig('A2', {}), '0', 'clean room signature changed');
assert.equal(ctx.tileBrokenSig('A2', a), ctx.tileBrokenSig('A2', sameDifferentOrder),
  'signature depends on object insertion order');
assert.notEqual(ctx.tileBrokenSig('A2', a), ctx.tileBrokenSig('A2', b),
  'equal-cardinality broken layouts alias to the same room bake');
assert.equal(ctx.tileBrokenSig('A1', a), '0', 'another room leaked into the signature');

const sigStart = src.indexOf('function tileSig(');
const tileSig = src.slice(sigStart, src.indexOf('\n}\n', sigStart) + 3);
assert.match(tileSig, /const br = tileBrokenSig\(id, B\)/,
  'tileSig does not include the coordinate-stable broken-tile identity');
console.log('PASS room bake signature distinguishes equal-count broken-tile layouts');
