// THE STORY PANELS — the approved manhwa at the moments it draws (js/panels.js).
//
// What this measures, in the real build:
//   - every crop lies inside its page, and every page is an approved ed.2 page
//     (never the draft set) or the Conduits backdrop;
//   - no page is fetched at boot;
//   - a sequence fires at its event, ONCE: not before the room has settled,
//     not with a hostile nearby, not over a dialogue, and not again on revisit
//     or after reloading the save;
//   - a caption reveals, the first confirm completes it and a SEPARATE confirm
//     advances; an unread caption never advances on its own;
//   - holding skips (keyboard, and a real held touch on a touch device);
//   - the replay list holds only sequences already seen, and replays them;
//   - reduced motion: no push/drift, text whole;
//   - every caption string exists in all five languages.
//   PANELS_SHOTS=<dir> also writes screenshots at 1280x720 and 844x390.
//
//   node tests/panels.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');
const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};
const URL = 'http://127.0.0.1:8220/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function boot(browser, opt) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 720 } }, opt || {}));
  const page = await ctx.newPage();
  const errs = [], manhua = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('request', r => { if (/assets\/manhua\//.test(r.url())) manhua.push(r.url()); });
  await page.goto(URL);
  await page.waitForFunction(() => typeof startGame === 'function' && typeof panelsTick === 'function', { timeout: 30000 });
  return { ctx, page, errs, manhua };
}
// a fresh save standing in `room`, quiet, with the panels' record created now
const stage = (page, room, flags, keepPanels) => page.evaluate(([room, flags, keep]) => {
  for (const k in keys) delete keys[k]; for (const k in keysP) delete keysP[k];
  const prev = keep && G.save && G.save.panels;
  const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
  startGame(sv);
  G.save.panels = prev ? JSON.parse(JSON.stringify(prev)) : { v: 1, seen: {}, past: {}, n: 0 };
  Object.assign(G.save.flags, flags || {});
  loadRoom(room); G.wake = null; G.state = 'PLAY'; G.dialog = null; G.enemies = []; G.boss = null; G.projs = [];
  G.tut = null; G.tutorialLock = null; G.hitStop = 0; G.trans = null;
  player.on = true; player.vx = player.vy = 0;
  return true;
}, [room, flags, !!keepPanels]);
const state = page => page.evaluate(() => ({ st: G.state, id: G.panels && G.panels.seq.id, i: G.panels && G.panels.i,
  ph: G.panels && G.panels.ph, done: G.panels ? panelsRevealDone(G.panels.reveal) : null,
  rev: G.panels && G.panels.reveal ? G.panels.reveal.n : null }));
const waitFor = (page, fn, ms) => page.waitForFunction(fn, null, { timeout: ms || 8000 }).then(() => true, () => false);
async function tapKey(page, code) {
  await page.evaluate(c => { keys[c] = true; keysP[c] = true; }, code);
  await sleep(70);
  await page.evaluate(c => { delete keys[c]; }, code);
  await sleep(70);
}

(async () => {
  console.log('── panels — the approved manhwa at story moments\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    let { ctx, page, errs, manhua } = await boot(browser);
    await sleep(2500);
    check('no manhwa page is fetched at boot', manhua.length === 0, manhua.slice(0, 3).join(', '));

    // ---- the data ---------------------------------------------------------------
    const data = await page.evaluate(async () => {
      const out = { bad: [], srcs: [], keys: [], missing: [] };
      const sizes = {};
      for (const s of PANEL_SEQ) for (const p of s.panels) {
        if (!p.src) continue;
        if (!/^assets\/manhua\/ch1\/p\d\d\.webp$/.test(p.src) && p.src !== 'assets/backgrounds/gate_conduits.jpg') out.bad.push(s.id + ':' + p.src);
        if (!sizes[p.src]) sizes[p.src] = await new Promise(r => { const im = new Image(); im.onload = () => r([im.naturalWidth, im.naturalHeight]); im.onerror = () => r(null); im.src = p.src; });
        const z = sizes[p.src], [x, y, w, h] = p.crop;
        if (!z || x < 0 || y < 0 || w < 40 || h < 40 || x + w > z[0] || y + h > z[1]) out.bad.push(s.id + ' ' + p.ref + ' ' + JSON.stringify(p.crop) + ' in ' + JSON.stringify(z));
      }
      const L = TEXT_LAYERS.find(l => l.en && l.en.pn_menu);
      const need = new Set(['pn_menu', 'pn_none', 'pn_hint', 'pn_next', 'pn_skip', 'pn_next_touch', 'pn_skip_touch']);
      for (const s of PANEL_SEQ) { need.add(s.title); for (const p of s.panels) if (p.cap) need.add(p.cap); }
      for (const k of need) for (const lg of ['en', 'ar', 'tr', 'zh', 'ru'])
        if (!L || !L[lg] || typeof L[lg][k] !== 'string' || !L[lg][k].trim()) out.missing.push(lg + ':' + k);
      out.untranslated = [];
      for (const k of need) for (const lg of ['ar', 'zh', 'ru'])
        if (L && L[lg] && L[lg][k] === L.en[k] && !/^(\.\.\.|CHIME)/.test(L.en[k])) out.untranslated.push(lg + ':' + k);
      out.n = PANEL_SEQ.length;
      return out;
    });
    check('every crop lies inside an approved page (or the Conduits backdrop)', data.bad.length === 0, data.bad.join(' | '));
    check('every caption and label exists in all five languages', data.missing.length === 0, data.missing.slice(0, 8).join(', '));
    check('captions are translated, not English copies', data.untranslated.length === 0, data.untranslated.slice(0, 8).join(', '));
    check('the map covers the chapter (≥ 9 sequences)', data.n >= 9, String(data.n));

    // ---- once, at its event, never during a crossing / fight / dialogue -----------
    await stage(page, 'W2', { woke: 1 });
    await sleep(350);
    let s = await state(page);
    check('arrival does not cut in before the room settles', s.st === 'PLAY', JSON.stringify(s));
    const fired = await waitFor(page, () => G.state === 'PANELS' && G.panels.seq.id === 'bay');
    check('leaving the service bay plays the bay panels in W2', fired);
    const seenSaved = await page.evaluate(() => !!JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))).panels.seen.bay);
    check('it is marked seen (and saved) as it begins', seenSaved);

    // caption: reveal, confirm completes, separate confirm advances
    await page.evaluate(() => { const P = G.panels; while (P.list[P.i] && !P.list[P.i].cap) panelsAdvance(P); });
    // pick a panel whose caption is not baked into the art in English
    await page.evaluate(() => { const P = G.panels; while (P.list[P.i] && (P.list[P.i].baked || !P.list[P.i].cap)) panelsAdvance(P); });
    await waitFor(page, () => G.panels && G.panels.ph === 'show' && G.panels.t > 0.45 && G.panels.reveal && G.panels.reveal.n > 0, 4000);
    s = await state(page);
    check('a caption reveals progressively', s.done === false && s.rev > 0, JSON.stringify(s));
    const i0 = s.i;
    await tapKey(page, 'Enter');
    s = await state(page);
    check('the first confirm completes the caption and does not turn the page', s.done === true && s.i === i0, JSON.stringify(s));
    await sleep(3500);
    s = await state(page);
    check('a read caption does not advance on its own', s.i === i0 && s.st === 'PANELS', JSON.stringify(s));
    await tapKey(page, 'Enter');
    s = await state(page);
    check('a separate confirm advances', s.i === i0 + 1 || s.ph === 'out', JSON.stringify(s));
    // hold to skip
    await page.evaluate(() => { keys.Enter = true; keysP.Enter = true; });
    await sleep(1200);
    await page.evaluate(() => { delete keys.Enter; });
    const back = await waitFor(page, () => G.state === 'PLAY', 3000);
    check('holding the key skips the sequence back to play', back);
    // never again: revisit, and reload the saved game
    await page.evaluate(() => { loadRoom('W1'); });
    await sleep(300);
    await page.evaluate(() => { loadRoom('W2'); G.state = 'PLAY'; player.on = true; });
    await sleep(2200);
    s = await state(page);
    check('a revisit does not replay it', s.st === 'PLAY', JSON.stringify(s));
    await page.evaluate(() => {
      const sv = JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));
      startGame(sv); loadRoom('W2'); G.wake = null; G.state = 'PLAY'; G.enemies = []; G.tut = null; G.tutorialLock = null; player.on = true;
    });
    await sleep(2500);
    s = await state(page);
    check('reloading the save does not replay it', s.st === 'PLAY', JSON.stringify(s));

    // replay: only what was seen
    const rows = await page.evaluate(() => panelsSeenList().map(q => q.id));
    check('the replay list holds only the seen sequence', rows.length === 1 && rows[0] === 'bay', JSON.stringify(rows));
    const row = await page.evaluate(() => pauseItems().some(it => it.id === 'panels'));
    check('the pause menu offers Story panels once one is seen', row);
    await page.evaluate(() => { G.state = 'PANELLIST'; G.panelIdx = 0; });
    await tapKey(page, 'Enter');
    s = await state(page);
    check('replay plays it again from the list', s.st === 'PANELS' && s.id === 'bay', JSON.stringify(s));
    await page.evaluate(() => { keys.Escape = true; keysP.Escape = true; });
    await sleep(1300);
    await page.evaluate(() => { delete keys.Escape; });
    const toList = await waitFor(page, () => G.state === 'PANELLIST', 3000);
    check('a replay hands back to the list, not the room', toList);
    await page.evaluate(() => { G.state = 'PLAY'; });

    // a hostile nearby, and an open dialogue, hold it back
    await stage(page, 'A0', { woke: 1, gateOpened: 1 });
    await page.evaluate(() => {
      const e = new Enemy('crawler', player.x + 120, player.y); G.enemies.push(e);
    });
    await sleep(2600);
    s = await state(page);
    check('never with a hostile in reach', s.st === 'PLAY', JSON.stringify(s));
    await page.evaluate(() => { G.enemies = []; G.dialog = { name: 'x', lines: ['x'], i: 0, onEnd: null }; G.state = 'DIALOG'; });
    await sleep(2000);
    s = await state(page);
    check('never over a dialogue', s.st === 'DIALOG', JSON.stringify(s));
    await page.evaluate(() => { G.dialog = null; G.state = 'PLAY'; });
    const gate = await waitFor(page, () => G.state === 'PANELS' && G.panels.seq.id === 'gate');
    check('the gate panels play once the room is quiet (A0)', gate);
    await page.evaluate(() => { if (G.panels) { G.panels.ph = 'out'; G.panels.t = 1; } });
    await waitFor(page, () => G.state === 'PLAY', 2000);

    // a save that had passed the event before this build never gets a recap
    await page.evaluate(() => {
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, ratchetRepaired: 1, crystal: 1 });
      startGame(sv); delete G.save.panels; loadRoom('A0B'); G.wake = null; G.state = 'PLAY'; G.enemies = []; player.on = true;
    });
    await sleep(2500);
    s = await state(page);
    const past = await page.evaluate(() => G.save.panels && G.save.panels.past);
    check('a beat the save had already passed is marked past, not replayed', s.st === 'PLAY' && past && past.forge && past.ratchet, JSON.stringify(past));

    // the corridor's conditional panel
    const cond = await page.evaluate(() => {
      const seq = panelsSeq('meet');
      G.save.panels.meetHit = 0; const a = panelsList(seq).length;
      G.save.panels.meetHit = 1; const b = panelsList(seq).length;
      return [a, b];
    });
    check('the lying-in-the-scrap panel shows only when the swipe took a core', cond[1] === cond[0] + 1, JSON.stringify(cond));

    // the teaser: on the climb, not on the camp floor
    await stage(page, 'A3', { woke: 1, bossGlitch: 1, crystal: 1, sageTame_GA1D: 1, bossChime: 1, nfMeet: 1 });
    await page.evaluate(() => { G.save.panels.past = { free: 1 }; });
    // the guardian flags hand out an evolution card on arrival; close it like a player would
    for (let k = 0; k < 20; k++) {
      await page.evaluate(() => { if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; } });
      await sleep(100);
    }
    await sleep(1200);
    s = await state(page);
    check('no teaser on the camp floor', s.st === 'PLAY', JSON.stringify(s));
    await page.evaluate(() => { player.x = 19 * TILE; player.y = 12 * TILE - player.h; player.vx = player.vy = 0; player.on = true; });
    const tz = await waitFor(page, () => {
      if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
      if (G.state === 'PLAY') { player.x = 19 * TILE; player.y = 12 * TILE - player.h; player.vy = 0; player.on = true; }
      return G.state === 'PANELS' && G.panels.seq.id === 'ch2';
    }, 6000);
    check('the chapter-two teaser plays on the climb out of the Meadows', tz);
    const last = await page.evaluate(() => { const P = G.panels; return P && P.list[P.list.length - 1].title === true; });
    check('the teaser ends on the chapter title card', last);
    await page.evaluate(() => { if (G.panels) { G.panels.ph = 'out'; G.panels.t = 1; } });
    await waitFor(page, () => G.state === 'PLAY', 2000);
    check('no page errors (desktop)', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();

    // ---- reduced motion -------------------------------------------------------------
    ({ ctx, page, errs } = await boot(browser, { reducedMotion: 'reduce' }));
    await stage(page, 'A0B', { woke: 1 });
    const rm = await page.evaluate(() => {
      panelsPlay('sage');
      const p = panelsSeq('sage').panels[0];
      const r = panelsSrcRect(p, 5);
      const R = panelsRevealStart('a caption');
      return { still: JSON.stringify(r) === JSON.stringify(p.crop), whole: panelsRevealDone(R) };
    });
    check('reduced motion: no push or drift', rm.still);
    check('reduced motion: captions appear whole', rm.whole);
    await ctx.close();

    // ---- touch: a tap confirms, a held finger skips ------------------------------
    ({ ctx, page, errs } = await boot(browser, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }));
    await stage(page, 'A0B', { woke: 1 });
    await page.evaluate(() => { TOUCH.enabled = true; panelsPlay('chime'); });
    await waitFor(page, () => G.panels && G.panels.ph === 'show' && G.panels.t > 0.5, 5000);
    const cdp = await ctx.newCDPSession(page);
    const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    let before = await state(page);
    await touch('touchStart', [{ x: box.x, y: box.y }]); await sleep(80); await touch('touchEnd', []);
    await sleep(150);
    let after = await state(page);
    check('touch: a tap completes the caption', after.done === true && after.i === before.i, JSON.stringify([before, after]));
    await touch('touchStart', [{ x: box.x, y: box.y }]); await sleep(1300);
    const held = await state(page);
    await touch('touchEnd', []);
    check('touch: a held finger skips', held.ph === 'out' || held.st !== 'PANELS', JSON.stringify(held));
    check('no page errors (touch)', errs.length === 0, errs.slice(0, 2).join(' | '));

    // ---- screenshots to look at ----------------------------------------------------
    if (process.env.PANELS_SHOTS) {
      const dir = process.env.PANELS_SHOTS;
      for (const [vw, vh, tch] of [[1280, 720, false], [844, 390, true], [390, 844, true]]) {
        const b2 = await boot(browser, { viewport: { width: vw, height: vh }, hasTouch: tch, isMobile: tch });
        for (const [id, lang] of [['sage', 'en'], ['meet', 'ar'], ['ch2', 'zh'], ['forge', 'ru']]) {
          await stage(b2.page, 'A0B', { woke: 1 });
          await b2.page.evaluate(([id, lang]) => { LANG = lang; G.save.panels.meetHit = 1; panelsPlay(id); }, [id, lang]);
          await sleep(1800);
          await b2.page.evaluate(() => { const P = G.panels; P.i = Math.min(1, P.list.length - 1); panelsBegin(P); P.prev = null; });
          await sleep(1200);
          await b2.page.screenshot({ path: dir + '/panels_' + id + '_' + lang + '_' + vw + 'x' + vh + '.png' });
        }
        await b2.ctx.close();
      }
    }
  } finally { await browser.close(); }
  console.log('\n' + (fails.length ? fails.length + ' FAILED' : 'all passed'));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
