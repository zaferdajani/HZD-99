// Exercise the real pack boot with a download that stalls in headers or body.
const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('js/packs.js', 'utf8');
async function stalled(body) {
  let expire, cleared = false, started = 0, signal;
  const context = vm.createContext({
    URLSearchParams, AbortController, location: { search: '?pack=test' },
    console: { error() {} }, saveKeyFor: () => 'save', newSave: () => ({}),
    startGame: () => started++, ROOMS: {},
    setTimeout(fn, ms) { assert.equal(ms, 15000); expire = fn; return 1; },
    clearTimeout(id) { assert.equal(id, 1); cleared = true; },
    fetch(url, options) {
      assert.equal(url, 'packs/test/pack.json'); signal = options.signal;
      const wait = () => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(Error('aborted')), { once: true });
      });
      return body ? Promise.resolve({ ok: true, json: wait }) : wait();
    },
  });
  vm.runInContext(source, context);
  vm.runInContext('startGame({bench:{room:"test"}})', context);
  assert.equal(started, 0);
  await new Promise(resolve => setImmediate(resolve));
  expire();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(signal.aborted, true);
  assert.equal(started, 1, 'queued Start is released through the existing error path');
  assert.equal(cleared, true);
  assert.ok(vm.runInContext('PACK.err', context));
}
(async () => {
  await stalled(false);
  await stalled(true);
  console.log('pack timeout: stalled headers and body release Start and clear timer');
})().catch(error => { console.error(error); process.exitCode = 1; });
