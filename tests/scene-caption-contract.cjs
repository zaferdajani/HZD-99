const fs = require('fs');
const vm = require('vm');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'overlay.js'), 'utf8');
const ctx = {
  console,
  G: { state: 'PLAY', dialog: null, sceneCaps: null, sceneCapQ: null },
  c: {},
  paginate(_canvas, text) { return [[text]]; },
  revealStart() { return { done: false, t: 0, since: 0 }; },
  revealDone(R) { return !!R.done; },
  revealSince(R) { return R.since || 0; },
  revealTick() {},
  readingTime() { return 1; },
};
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename: 'js/overlay.js' });

for (const text of ['first', 'second', 'third', 'fourth']) ctx.sceneCaption(text);
const names = a => (a || []).map(q => q.text);
if (JSON.stringify(names(ctx.G.sceneCaps)) !== JSON.stringify(['first', 'second', 'third']))
  throw new Error('visible captions evicted unread text: ' + JSON.stringify(names(ctx.G.sceneCaps)));
if (JSON.stringify(names(ctx.G.sceneCapQ)) !== JSON.stringify(['fourth']))
  throw new Error('fourth caption did not wait intact: ' + JSON.stringify(names(ctx.G.sceneCapQ)));
if (ctx.sceneCaptionShown() || ctx.sceneCaptionRead()) throw new Error('completion gates ignored queued unread text');

ctx.G.sceneCaps[0].R.done = true;
ctx.G.sceneCaps[0].R.since = 2;
ctx.sceneCaptionTick(1.3);
if (JSON.stringify(names(ctx.G.sceneCaps)) !== JSON.stringify(['second', 'third', 'fourth']) || ctx.G.sceneCapQ.length)
  throw new Error('caption FIFO promotion failed');
if (ctx.G.sceneCaps[2].R.done || ctx.G.sceneCaps[2].fade !== 0)
  throw new Error('promoted caption lost unread state');

ctx.overlayClear();
if (ctx.G.sceneCaps !== null || ctx.G.sceneCapQ !== null) throw new Error('reset did not clear both caption lanes');
console.log('PASS scene captions retain unread lines and promote queued text in FIFO order');
