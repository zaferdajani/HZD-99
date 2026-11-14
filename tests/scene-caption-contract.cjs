// Scene captions are non-blocking, but they are still story. The visible stack
// is deliberately limited to three; a fourth line must wait, never erase an
// unread first line. This source contract exercises the real overlay functions
// without pretending to be rendered-browser evidence.
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
  throw new Error('visible caption stack changed or evicted its unread first line: ' + JSON.stringify(names(ctx.G.sceneCaps)));
if (JSON.stringify(names(ctx.G.sceneCapQ)) !== JSON.stringify(['fourth']))
  throw new Error('fourth caption did not wait intact: ' + JSON.stringify(names(ctx.G.sceneCapQ)));
if (ctx.sceneCaptionShown() || ctx.sceneCaptionRead())
  throw new Error('queued unread caption was ignored by scene completion gates');

// Once a visible caption has genuinely been read and faded, the queued reader
// takes its slot in FIFO order and begins from its untouched first page.
ctx.G.sceneCaps[0].R.done = true;
ctx.G.sceneCaps[0].R.since = 2;
ctx.sceneCaptionTick(1.3);
if (JSON.stringify(names(ctx.G.sceneCaps)) !== JSON.stringify(['second', 'third', 'fourth']) || ctx.G.sceneCapQ.length)
  throw new Error('queued caption was not promoted in FIFO order: ' + JSON.stringify({ live: names(ctx.G.sceneCaps), queued: names(ctx.G.sceneCapQ) }));
if (ctx.G.sceneCaps[2].R.done || ctx.G.sceneCaps[2].fade !== 0)
  throw new Error('promoted caption did not retain its unread reader state');

ctx.overlayClear();
if (ctx.G.sceneCaps !== null || ctx.G.sceneCapQ !== null)
  throw new Error('overlay reset does not clear visible and queued scene captions together');

console.log('PASS scene captions retain unread lines, display three, and promote queued text in FIFO order');
