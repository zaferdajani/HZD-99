const assert = require('assert');
const { assessFilm, encodeAndCertify } = require('../tools/castreel.cjs');
const fs = require('fs'), path = require('path'), os = require('os');

let r = assessFilm([], [], { expected: ['wake', 'roar'], observed: ['wake', 'roar'] });
assert.equal(r.complete, true, 'complete coverage without errors certifies');

r = assessFilm([], [], { expected: ['wake', 'roar'], observed: ['wake'] });
assert.equal(r.complete, false, 'missing required move fails closed');
assert.deepEqual(r.coverage.missing, ['roar']);

r = assessFilm(['draw: boom'], [], { expected: ['wake'], observed: ['wake'] });
assert.equal(r.complete, false, 'runtime error fails closed');

r = assessFilm([], ['pageerror: boom'], null);
assert.equal(r.complete, false, 'browser page error fails closed even without a coverage manifest');

assert.equal(assessFilm([], [], null, true).complete, false, 'required manifest cannot disappear');
assert.equal(assessFilm([], [], { expected: [], observed: [] }, true).complete, false, 'empty expectations fail');
assert.equal(assessFilm([], [], { expected: ['roar'], observed: null }, true).complete, false, 'malformed observations fail');
r = assessFilm([], [], { expected: ['wake', 'roar'], observed: ['wake'], missing: [] }, true);
assert.equal(r.complete, false, 'producer cannot suppress derived missing beats');
assert.deepEqual(r.coverage.missing, ['roar']);
r = assessFilm([], [], null);
assert.equal(r.scope, 'capture-only-no-move-certification', 'generic capture does not claim move coverage');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-contract-'));
const certPath = path.join(tmp, 'certificate.json'), out = path.join(tmp, 'fixture.mp4');
try {
  const cert = () => assessFilm([], [], { expected: ['roar'], observed: ['roar'] }, true);
  assert.throws(() => encodeAndCertify(cert(), certPath, out, () => { throw new Error('injected encoder failure'); }), /injected/);
  r = JSON.parse(fs.readFileSync(certPath));
  assert.equal(r.complete, false); assert.equal(r.encoding, 'failed');
  assert.throws(() => encodeAndCertify(cert(), certPath, out, () => fs.writeFileSync(out, '')), /empty/);
  r = encodeAndCertify(cert(), certPath, out, () => {
    assert.equal(JSON.parse(fs.readFileSync(certPath)).complete, false, 'pending encode must not certify');
    fs.writeFileSync(out, 'fixture bytes, not a playable film');
  });
  assert.equal(r.complete, true); assert.equal(r.encoding, 'complete');
  assert.equal(r.artifact.sha256.length, 64);
  const missing = assessFilm([], [], { expected: ['roar'], observed: [] }, true);
  r = encodeAndCertify(missing, certPath, out, () => fs.writeFileSync(out, 'diagnostic bytes'));
  assert.equal(r.complete, false, 'successful encoding cannot erase coverage failure');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log('reel contract passed (coverage + injected encoder cases; no real video claim)');
