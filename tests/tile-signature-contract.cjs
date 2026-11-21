// Terrain bakes must distinguish equal-count broken-tile layouts.
const fs = require('fs'), vm = require('vm');
const source = fs.readFileSync('js/game.js', 'utf8');
const match = source.match(/function tileBreakSig\(id, broken\) \{[\s\S]*?\n\}/);
if (!match) throw new Error('tileBreakSig helper missing');
const tileBreakSig = vm.runInNewContext('(' + match[0] + ')');

const a = { 'A2:3,4': 1, 'A2:7,8': 1, 'B1:3,4': 1 };
const b = { 'A2:3,4': 1, 'A2:9,8': 1, 'B1:3,4': 1 };
const reordered = { 'A2:7,8': 1, 'A2:3,4': 1 };
const sa = tileBreakSig('A2', a), sb = tileBreakSig('A2', b);
if (sa === sb) throw new Error('equal-count different-coordinate layouts collide');
if (sa !== tileBreakSig('A2', reordered)) throw new Error('signature depends on insertion order');
if (tileBreakSig('A2', { 'A2:3,4': 0, 'B1:3,4': 1 }) !== '') throw new Error('false or foreign cells leak into signature');
console.log('PASS broken-tile signatures are coordinate-sensitive and order-stable');
