// Execute the production updateTrial function and prove Back owns every Mind
// Node phase, including the two countdowns where the old branch ignored it.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/trials.js'), 'utf8');
function functionSource(name) {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, name + ' exists');
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unterminated ' + name);
}

let ui = 0, writes = 0;
const ctx = vm.createContext({
  TRI: null,
  G: { state: 'TRIAL', save: { flags: { sentinel: 1 }, iq: 42 } },
  inP: a => a === 'BACK', sfx: a => { if (a === 'ui') ui++; },
  triBuffer() {}, triStart() {}, triStartGame() {}, triEndGame() {}, triDir() { return -1; },
  triAnswer() {}, sfxMemNote() {}, persist: () => writes++,
});
vm.runInContext(functionSource('updateTrial'), ctx);

for (const st of ['pre', 'play']) {
  for (const retry of [false, true]) {
    const tri = { st, mode: 'node', node: { i: 2 }, retry, fb: 0, game: 'mem',
      memPhase: retry ? 'input' : 'show', preT: 1.3, t: 999 };
    ctx.TRI = tri; ctx.G.state = 'TRIAL';
    const before = JSON.stringify(ctx.G.save);
    ctx.updateTrial(1 / 30);
    assert.equal(ctx.G.state, 'PLAY', st + '/' + retry + ' exits immediately');
    assert.equal(tri.node, null); assert.equal(tri.mode, 'full'); assert.equal(tri.retry, false);
    assert.equal(JSON.stringify(ctx.G.save), before, 'exit never pays or changes progress');
  }
}
assert.equal(writes, 0); assert.equal(ui, 4);
console.log('PASS memnode-contract: Back exits initial, retry, show and input phases without payment');
