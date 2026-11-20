// LIVES ARE A SAGE'S (owner, 2026-11-20: "Getting extra lives should be only
// rewarded when you defeat a sage. Not everywhere. You might be able to
// purchase one life from Ratchet with a higher price, like a very high price,
// but shouldn't be available all the time" — and, playing: "after defeating
// the agent, I have pretty much unlimited lives ... Lives should not be easy
// to obtain"). The purification ladder paid a core at its first and sixth
// rung (each a full refill too), three quarry chests held a core apiece, and a
// guardian's spoil could roll one. Now: a sage fallen is one life, every time;
// Ratchet's one spare is 1200 and locked until a sage has fallen; nothing
// else raises her lives.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const R = await p.evaluate(() => {
    const fresh = () => { const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { woke: 1, tut: 1, heal: 1 }); startGame(sv); loadRoom('A0'); G.state = 'PLAY'; G.dialog = null; return G.save.coresMax; };
    const out = {};
    // the ladder: every rung
    let m0 = fresh(); for (const g of PURE_GIFTS) { pureGift(g[0]); G.dialog = null; if (typeof OVERLAY_Q !== 'undefined') OVERLAY_Q.length = 0; }
    out.ladder = G.save.coresMax - m0;
    // the quarry chest
    m0 = fresh(); const ch = { type: 'chest', extra: 'core', x: 0, y: 0, w: 10, h: 10 }; doInteract(ch);
    out.chest = G.save.coresMax - m0;
    // a guardian's spoil, every roll
    m0 = fresh(); let spoilCores = 0;
    for (const kind of ['glitch', 'brood', 'zero', 'atlas', 'prism']) for (const pick of ['L', 'R']) { const before = G.save.coresMax; bossSpoil(kind, pick); spoilCores += G.save.coresMax - before; }
    out.spoil = spoilCores;
    // a sage fallen
    m0 = fresh(); sageLife(); out.sage = G.save.coresMax - m0; out.sageCount = G.save.flags.sageLives;
    // the shop's spare
    fresh();
    const core = SHOP.find(q => q.type === 'core');
    out.cost = core && core.cost;
    out.lockedBefore = !shopCoreOpen();
    G.save.flags.sageLives = 1; out.openAfter = shopCoreOpen();
    return out;
  });
  check('the purification ladder pays no lives', R.ladder === 0, String(R.ladder));
  check('a quarry chest pays no life', R.chest === 0, String(R.chest));
  check('a guardian\'s spoil never rolls a life', R.spoil === 0, String(R.spoil));
  check('a sage fallen is one life, every time', R.sage === 1 && R.sageCount === 1, JSON.stringify(R));
  check('Ratchet\'s one spare is dear (1200) and locked until a sage has fallen', R.cost >= 1200 && R.lockedBefore && R.openAfter, JSON.stringify(R));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — lives are a sage\'s');
})().catch(e => { console.error(e); process.exit(1); });
