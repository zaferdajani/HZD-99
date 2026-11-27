const fs = require('fs');
const vm = require('vm');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'infection-eyes.js'), 'utf8');
const eyeMap = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'eyes.json'), 'utf8'));
const cleanDecl = source.match(/const INF_EYE_CLEAN_KINDS = new Set\([^;]+;/);
const classify = source.match(/function infEyeClass\(e\) \{[\s\S]*?\n\}/);
if (!cleanDecl || !classify) throw new Error('infection authority source is missing');

class Boss { constructor(kind) { this.kind = kind; } }
const ctx = { Boss, alphaFreed: () => false, isWolf: () => false, isCheetah: () => false, packTamed: () => false };
vm.createContext(ctx);
vm.runInContext(cleanDecl[0] + '\n' + classify[0], ctx);

for (const kind of ['alpha', 'horn', 'prism', 'chime', 'carrier', 'moth', 'lattice', 'lens']) {
  if (ctx.infEyeClass(new Boss(kind)) !== null) throw new Error(kind + ' incorrectly emits infection smoke');
}
if (ctx.infEyeClass(new Boss('glitch')) !== 'purple') throw new Error('infected guardian is not purple');
if (ctx.infEyeClass({ kind: 'crawler' }) !== 'red') throw new Error('infected ordinary machine is not red');
if (ctx.infEyeClass({ kind: 'crawler', purified: true }) !== null) throw new Error('purified machine still emits');
const rear = eyeMap.beastStudioRear;
if (!rear || rear.c !== 30 || rear.r !== 1 || rear.e.length !== 30 || rear.e.some(p => !Array.isArray(p) || p.length < 2)) {
  throw new Error('NULLFANG signature rear is missing per-cell infection-eye anchors');
}
console.log('PASS only infected bodies receive finite red/purple eye trails');
