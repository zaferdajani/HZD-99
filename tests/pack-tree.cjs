// HER SKILL TREES (owner, 2026-11-26: "when I get the wolf skill, there should be a new skill tree
// opening that allows me to upgrade, showing at the end Alpha mount ... a better way to access my
// skill tree, showing it in a nicer way that does not look like a mathematically generated AI
// layout"). js/packtree.js drawTree / ptLayout / ptBoxes; G.state 'TREE'.
//   A  it opens from the pause menu (its own row) and closes back to it
//   B  it opens from play by its own key (O) and closes with it
//   C  on a phone, opened UPRIGHT first: the rotate screen; turned, the game; the tree's own corner
//      button (once the pack is hers) opens it with a tap, and ONE ✕ closes it — the touch layer's
//      (the tree draws no second close button inside its frame)
//   D  every node — the creature in its socket, its name and its state — is on the screen in a
//      960x540 frame and inside the game's frame on the phone
//   E  nothing on it overlaps (sockets, labels, the card, the hint), in every language
//   F  every rung says what it is now in few words: hers; for sale (price and WHERE); or shut —
//      and then where it is got and what comes first; the ride names Patch-7 and the Foundry
//   G  nothing is bought on it: OK on a rung for sale changes neither her shards nor her ladder
//   H  it is drawn with its open-source frame, sockets and card (assets/ui/skilltree, CC0)
//   I  no page errors
const { chromium, devices } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
const SETUP = async (lv) => {
  const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.scrap = 900;
  Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, pack: 1 }); sv.arms = ['pack']; sv.packLv = lv; startGame(sv);
  for (const k of ['ptFrame', 'ptSocket', 'ptCard', 'wolfIdle6', 'alRest', 'alRideGallop']) mediaFetch(k, 1);
  await new Promise(r => setTimeout(r, 2500));
  window.__T = performance.now();
  window.__step = (n, each) => { for (let i = 0; i < n; i++) { each && each(i); window.__T += 1000 / 60; mainLoop(window.__T); } };
  __step(5);
};
(async () => {
  console.log('── pack-tree — her skill trees: the Pack, from the small wolf to the ride');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const errs = [];
  // ---- desktop 960x540
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async (SETUP) => {
    await (new Function('return (' + SETUP + ')')())(2);
    const out = {};
    // A: pause row
    G.state = 'PAUSE'; G.pauseIdx = pauseLayout().items.findIndex(i => i.id === 'tree');
    out.A = { row: G.pauseIdx };
    __step(2, (i) => { if (i === 0) keysP.Enter = 1; });
    out.A.opened = G.state;
    __step(2, (i) => { if (i === 0) keysP.Escape = 1; });
    out.A.back = G.state;
    // B: its own key
    G.state = 'PLAY';
    __step(2, (i) => { if (i === 0) keysP.KeyO = 1; });
    out.B = { opened: G.state };
    __step(2, (i) => { if (i === 0) keysP.KeyO = 1; });
    out.B.back = G.state;
    // D/E: geometry, every language
    const inside = (b) => b.x >= 0 && b.y >= 0 && b.x + b.w <= 960 && b.y + b.h <= 540;
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    out.D = []; out.E = [];
    const keepLang = LANG;
    for (const lv of [1, 2, 3, 5]) for (const L of ['en', 'ar', 'tr', 'zh', 'ru']) {
      LANG = L; G.save.packLv = lv === 5 ? 3 : lv; G.save.flags.alphaRide = lv === 5 ? 1 : 0; G.save.flags.wolfMount = lv === 5 ? 1 : 0;
      const B = ptBoxes();
      for (const b of B) if (!inside(b)) out.D.push(L + lv + ' ' + b.id);
      for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
        if (B[i].id.split(':')[0] === B[j].id.split(':')[0]) continue;     // a node's label under its own socket
        if (hit(B[i], B[j])) out.E.push(L + lv + ' ' + B[i].id + ' x ' + B[j].id);
      }
    }
    LANG = keepLang; G.save.packLv = 2; G.save.flags.alphaRide = 0; G.save.flags.wolfMount = 0;
    // F: states and words
    LANG = 'en';
    out.F = {};
    for (const n of PACK_TREE) { const s = ptState(n); out.F[n.id] = { k: s.k, line: s.line, why: s.why, words: (s.line + ' ' + s.why).split(/\s+/).filter(w => /\w/.test(w)).length }; }
    G.save.arms = []; out.F.noPack = ptState(ptNode('pack'));
    G.save.arms = ['pack'];
    // G: nothing buys
    ptOpen('PLAY'); G.treeIdx = ptLayout().nodes.findIndex(q => q.n.id === 'packup');
    G.save.packLv = 1; const sc = G.save.scrap;
    __step(2, (i) => { if (i === 0) keysP.Enter = 1; });
    out.G = { scrap: sc - G.save.scrap, lv: G.save.packLv, state: G.state };
    G.save.packLv = 2;
    // H: its art
    const drawn = new Set(); const keep = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (im) { for (const k of ['ptFrame', 'ptSocket', 'ptCard']) if (im === MEDIA_RAW[k] || (typeof MEDIA_BMP !== 'undefined' && MEDIA_BMP[k] === im)) drawn.add(k); return keep.apply(this, arguments); };
    G.state = 'TREE'; __step(2);
    CanvasRenderingContext2D.prototype.drawImage = keep;
    out.H = { drawn: [...drawn], loaded: ['ptFrame', 'ptSocket', 'ptCard'].map(k => !!(MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth)) };
    return out;
  }, SETUP.toString());
  await page.close();
  // ---- the phone, upright first
  const ctx = await browser.newContext(Object.assign({}, devices['Pixel 7'], { serviceWorkers: 'block', viewport: { width: 412, height: 839 } }));
  const ph = await ctx.newPage(); ph.on('pageerror', e => errs.push(String(e)));
  await ph.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); });
  await ph.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await ph.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  await ph.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.scrap = 900;
    Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, pack: 1 }); sv.arms = ['pack']; sv.packLv = 2; startGame(sv);
    for (const k of ['ptFrame', 'ptSocket', 'ptCard', 'wolfIdle6', 'alRest', 'alRideGallop']) mediaFetch(k, 1);
  });
  await ph.waitForTimeout(1500);
  const up = await ph.evaluate(() => ({ portrait: TOUCH.portrait, touch: !!TOUCH.enabled }));
  await ph.setViewportSize({ width: 915, height: 412 }); await ph.waitForTimeout(1200);
  const C = await ph.evaluate(() => {
    G.state = 'PLAY'; G.dialog = null; G.cut = null;
    const L = tLayout(); const b = L.corners.find(q => q.code === 'VTREE');
    return { portrait: TOUCH.portrait, button: b ? { x: b.x, y: b.y, shown: b.show() } : null };
  });
  if (C.button && C.button.shown) { await ph.touchscreen.tap(C.button.x, C.button.y); await ph.waitForTimeout(500); }
  C.afterTap = await ph.evaluate(() => G.state);
  // D on the phone: every node's box, mapped through the game's frame, is inside the frame and the screen
  C.nodes = await ph.evaluate(() => {
    const r = cv.getBoundingClientRect(), k = r.width / 960, bad = [];
    for (const b of ptBoxes()) {
      const x0 = r.left + b.x * k, y0 = r.top + b.y * (r.height / 540), x1 = x0 + b.w * k, y1 = y0 + b.h * (r.height / 540);
      if (x0 < r.left - 1 || y0 < r.top - 1 || x1 > r.right + 1 || y1 > r.bottom + 1 || x0 < 0 || y0 < 0 || x1 > innerWidth || y1 > innerHeight) bad.push(b.id);
    }
    return { frame: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], bad };
  });
  await ph.screenshot({ path: process.env.PT_SHOT || '/tmp/pack-tree-phone.png' });
  // ONE close control: the touch layer's own ✕ (BACK), top of the left gutter; the tree draws none of its own
  C.treeCloses = await ph.evaluate(() => { const keep = window.ftxt; let n = 0; window.ftxt = function (str) { if (/✕|×/.test(String(str))) n++; return keep.apply(this, arguments); }; try { drawTree(); } finally { window.ftxt = keep; } return n; });
  const back = await ph.evaluate(() => ({ x: tLayout().lgx, y: 28 }));
  await ph.touchscreen.tap(back.x, back.y); await ph.waitForTimeout(400);
  C.afterClose = await ph.evaluate(() => G.state);
  await ctx.close();

  check('A  it opens from the pause menu (its own row) and closes back to it', R.A.row >= 0 && R.A.opened === 'TREE' && R.A.back === 'PAUSE', R.A);
  check('B  it opens from play by its own key (O) and closes with it', R.B.opened === 'TREE' && R.B.back === 'PLAY', R.B);
  check('C  on a phone opened upright: the rotate screen; turned, the tree\'s corner button opens it with a tap; ONE ✕ (the touch layer\'s) closes it, the tree draws none of its own',
    up.portrait === true && up.touch && C.portrait === false && C.button && C.button.shown && C.afterTap === 'TREE' && C.afterClose === 'PLAY' && C.treeCloses === 0, Object.assign({ up }, C, { nodes: undefined }));
  check('D  every node, its name and its state are on the screen at 960x540 (every language, every rung) and inside the game frame on the phone', R.D.length === 0 && C.nodes.bad.length === 0, { desk: R.D.slice(0, 6), phone: C.nodes });
  check('E  nothing on it overlaps, in every language and at every rung', R.E.length === 0, R.E.slice(0, 6));
  const F = R.F;
  const placed = (s) => /Ratchet|Patch-7|Alpha/.test(s.line);
  check('F  every rung says what it is in few words: hers, or for sale with its price and where, or shut with where and what comes first; the ride names Patch-7 in the Foundry',
    F.pack.k === 'own' && F.packup.k === 'own' && F.alcall.k === 'buy' && placed(F.alcall) && /1150/.test(F.alcall.line)
    && F.alhowl.k === 'lock' && placed(F.alhowl) && /Call the Alpha/.test(F.alhowl.why)
    && F.alride.k === 'lock' && /Patch-7, in the Foundry/.test(F.alride.line) && /Call the Alpha/.test(F.alride.why)
    && F.noPack.k === 'lock' && /Alpha/.test(F.noPack.line)
    && PACK_WORDS(F), F);
  check('G  nothing is bought on it: OK on a rung for sale changes neither her shards nor her ladder', R.G.scrap === 0 && R.G.lv === 1 && R.G.state === 'TREE', R.G);
  check('H  it is drawn with its open-source frame, sockets and card', R.H.loaded.every(Boolean) && ['ptFrame', 'ptSocket', 'ptCard'].every(k => R.H.drawn.includes(k)), R.H);
  check('I  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — her skill tree');
})().catch(e => { console.error(e); process.exit(1); });
// few words: a rung's state is at most ten words (ledger: few words to read)
function PACK_WORDS(F) { return ['pack', 'packup', 'alcall', 'alhowl', 'alride'].every(id => F[id].words <= 10); }
