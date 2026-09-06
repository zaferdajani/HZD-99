const assert = require('node:assert/strict');
const { selectMotionFrames } = require('../tools/motion-sampling.cjs');
const clip = values => values.map((sig, i) => ({ t: i / 24, sig }));
const dist = (a, b) => Math.abs(a - b);
assert.throws(() => selectMotionFrames(clip(Array(90).fill(3)), 10, dist), /too few/);
assert.throws(() => selectMotionFrames(clip(Array.from({length:90}, (_,i) => 3 + i % 2 * 0.01)), 10, dist), /too few/);
assert.throws(() => selectMotionFrames(clip(Array.from({length:90}, (_,i) => i % 2 * 50)), 10, dist), /too few/);
// A real strike followed by a long hold, then recoil/return. The old greedy
// sampler filled its slots before the hold and omitted the entire return.
const c = clip([...Array.from({length:20}, (_,i) => i * 5), ...Array(50).fill(95), ...Array.from({length:20}, (_,i) => 95 - i * 5)]);
const r = selectMotionFrames(c, 10, dist);
assert.equal(r.indices[0], 0);
assert.equal(r.indices.at(-1), c.length - 1);
assert(r.indices.some(i => i > 70 && i < c.length - 1), 'recoil has in-betweens');
assert(r.indices.filter(i => i >= 20 && i < 70).length <= 1, 'hold not padded');
assert(r.indices.every((n,i,a) => !i || n > a[i-1]), 'source order preserved');
console.log('OK — static/noisy clips rejected, complete strike and return retained without padding');
