const assert = require('assert');
const { assessFilm } = require('../tools/castreel.cjs');

let r = assessFilm([], [], { expected: ['wake', 'roar'], observed: ['wake', 'roar'] });
assert.equal(r.complete, true, 'complete coverage without errors certifies');

r = assessFilm([], [], { expected: ['wake', 'roar'], observed: ['wake'] });
assert.equal(r.complete, false, 'missing required move fails closed');
assert.deepEqual(r.coverage.missing, ['roar']);

r = assessFilm(['draw: boom'], [], { expected: ['wake'], observed: ['wake'] });
assert.equal(r.complete, false, 'runtime error fails closed');

r = assessFilm([], ['pageerror: boom'], null);
assert.equal(r.complete, false, 'browser page error fails closed even without a coverage manifest');

console.log('reel contract passed');
