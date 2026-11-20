// THE STORY PANELS — the approved manhwa at the moments it draws (js/panels.js).
//
// What this measures, in the real build:
//   - every crop lies inside its page, and every page is an approved ed.2 page
//     (never the draft set) or the Conduits backdrop;
//   - no page is fetched at boot;
//   - a sequence fires ONCE, and only at a doorway (owner, 2026-10-12: "the
//     comics does not appear in the middle of the game"): a beat due in the
//     room she enters opens on the crossing, before a single frame of that
//     room is shown; a beat whose event happens in the room opens the moment
//     the event is over — not with a hostile nearby, not over a dialogue, and
//     not again on revisit or after reloading the save;
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
  rev: G.panels && G.panels.reveal ? panelsRevealCount(G.panels.reveal) : null }));
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
        // the unlettered copies of the approved pages, the panels made for the
        // game's chapter one, or the Conduits backdrop — never the draft set
        if (!/^assets\/manhua\/ch1\/(clean\/p\d\d|game\/[a-z0-9_]+)\.webp$/.test(p.src) && p.src !== 'assets/backgrounds/gate_conduits.jpg') out.bad.push(s.id + ':' + p.src);
        // a captioned crop must carry no lettering of its own: the player
        // letters it in the player's language (the baked English could not be)
        if (p.cap && (p.baked || /\/ch1\/p\d\d\.webp$/.test(p.src))) out.bad.push(s.id + ' ' + p.ref + ' captioned over baked lettering');
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
    check('the map covers the chapter (≥ 13 sequences: the eight scene groups the pages lacked are drawn)', data.n >= 13, String(data.n));

    // ---- the scenes made for the game's own chapter one --------------------------
    // each at its event, in its room, once; and a save from before they existed
    // is not handed one as a recap of an event it already passed
    const newSeq = await page.evaluate(() => {
      // 2026-10-11 (owner): the letter's pages play when it is READ, before the
      // repair; the drawer after the drawer; only his waking after the board
      const want = { wake: ['w_cradle', 'w_eyes', 'w_unplug'], letter: ['letter', 'l_song', 'l_marble', 'l_cell'],
        drawer: ['toolbox'], ratchet: ['r_cell', 'r_marble'], marble: ['marble_a', 'marble_b'], passage: ['passage_a', 'passage_b'],
        break: ['break_a', 'break_b'], sage: ['sage_rev', 'sage_bell'], free: ['fight_a', 'fight_b'], ch2: ['hatch', 'ch2_a', 'ch2_b', 'ch2_c'] };
      const miss = [];
      for (const id in want) { const s = panelsSeq(id); for (const n of want[id]) if (!s || !s.panels.some(p => p.src === PANEL_GAME(n))) miss.push(id + ':' + n); }
      return miss;
    });
    check('the marble, the maintenance door, the revelation, the break, the fight, the letter and the hatch are all in the map', !newSeq.length, newSeq.join(', '));
    // KEY MOMENTS ONLY (owner, 2026-11-20, choosing which stay: "It's not
    // about oversaturating the game with images and videos. Certain key
    // moments require videos or images"). The gate, the toolbox, the cave
    // mouth, the marble, the maintenance door and NULLFANG's break are library
    // pages now: at their own events, in their own rooms, nothing plays.
    for (const [id, room, flags] of [['gate', 'A0', { woke: 1, gateOpened: 1 }],
      ['drawer', 'A0B', { woke: 1, gateOpened: 1, opNote: 1 }],
      ['cave', 'CV1', { woke: 1, gateOpened: 1 }],
      ['marble', 'CV3', { woke: 1, gateOpened: 1, pl_cshard: 1 }], ['passage', 'GA1T', { woke: 1, gateOpened: 1, crystal: 1 }],
      ['break', 'A2', { woke: 1, gateOpened: 1, crystal: 1, nfMeet: 1, sageTame_GA1D: 1, nfBreak: 1 }]]) {
      await stage(page, room, flags);
      await page.evaluate(i => { const P = G.save.panels; P.k = {}; for (const s of PANEL_SEQ) { P.k[s.id] = 1; if (s.id !== i) P.seen[s.id] = 1; }
        if (i === 'drawer' && typeof invAdd === 'function') invAdd('ratchetCell', 1); }, id);
      await sleep(2500);
      const st = await state(page);
      check('the ' + id + ' pages are off the game: nothing plays in ' + room + ' at their event', st.st !== 'PANELS', JSON.stringify(st));
    }
    // ...while a key moment still has its pages: the first agent purified
    await stage(page, 'GA1D', { woke: 1, gateOpened: 1, crystal: 1, sageTame_GA1D: 1 });
    await page.evaluate(() => { const P = G.save.panels; P.k = {}; for (const s of PANEL_SEQ) { P.k[s.id] = 1; if (s.id !== 'sage') P.seen[s.id] = 1; } });
    const sageFired = await waitFor(page, `G.state === 'PANELS' && G.panels.seq.id === 'sage'`, 8000);
    check('...and a key moment keeps its pages: the first agent purified (GA1D)', sageFired, await page.evaluate(() => G.state + ' ' + (G.panels && G.panels.seq.id)));
    await page.evaluate(() => { if (G.panels) G.panels.ph = 'out'; });
    await waitFor(page, () => G.state === 'PLAY', 4000);
    const inGame = await page.evaluate(() => PANEL_SEQ.filter(q => !q.manual).map(q => q.id));
    check('...in all, chapter one plays five: the corridor, the agent, the bell, the teaser (and the letter, when she reads it)',
      inGame.join() === 'meet,sage,chime,ch2', inGame.join());
    // an old save (no `k`): its ten original sequences keep their verdicts; the
    // new ones are judged by what it has already done
    const mig = await page.evaluate(() => {
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1, gateOpened: 1, pl_cshard: 1, crystal: 1, sageTame_GA1D: 1, bossChime: 1, nfBreak: 1 });
      sv.panels = { v: 1, seen: { bay: 1, gate: 1 }, past: { ratchet: 1, cave: 1, forge: 1, sage: 1, chime: 1 }, n: 2 };
      startGame(sv); loadRoom('CV3'); G.state = 'PLAY';
      const S = panelsState();
      return { past: S.past, seen: S.seen, k: Object.keys(S.k).length };
    });
    check('an old save is not handed the marble, the door or the break as a recap', mig.past.marble && mig.past.passage && mig.past.break && !mig.past.bay, JSON.stringify(mig));
    check('...nor the wake or the letter', mig.past.wake && mig.past.letter, JSON.stringify(mig.past));

    // ---- THE ORDER OF THE OPENING (owner, 2026-10-11): pages prepare an event
    // or follow it, never tell it backwards -----------------------------------
    const order = await page.evaluate(() => {
      const post = panelsSeq('ratchet').panels.map(p => p.src);
      return { postHasLetter: post.some(src => /letter|drawer/.test(src)),
        letterManual: !!panelsSeq('letter').manual, wakeManual: !!panelsSeq('wake').manual };
    });
    check('his letter and drawer are no longer told after the repair', !order.postHasLetter, JSON.stringify(order));
    check('the wake and the letter are played by their moments, not by a room watch', order.letterManual && order.wakeManual);
    // NO COMIC WHERE A FILM TELLS IT (owner, 2026-11-16 at the lion's pages,
    // and 2026-11-19: "When there is a video no need for comic"). The opening
    // film ends on her waking; the forge film is the forging; the lion's
    // purification is its film. Their pages are library only, and a new game
    // goes from the film straight to her first step.
    const films = await page.evaluate(() => {
      const filmed = PANEL_SEQ.filter(q => q.film).map(q => ({ id: q.id, film: q.film, manual: !!q.manual }));
      for (const k in keys) delete keys[k];
      const sv = newSave(1); sv.time = 99; startGame(sv); loadRoom('W1'); G.state = 'PLAY'; G.dialog = null;
      return { filmed, pend: !!(G.wake && G.wake.pend) };
    });
    const want = { wake: 'intro8', forge: 'gift', free: 'glitch' };
    check('every beat a film shows has its comic off the room (wake, forge, the lion)',
      Object.keys(want).every(id => films.filmed.some(q => q.id === id && q.film === want[id] && q.manual))
      && films.filmed.every(q => q.manual), JSON.stringify(films.filmed));
    check('...a new game goes from the film to her first step, no wake pages', !films.pend, JSON.stringify(films));
    await sleep(1500);
    const w1 = await page.evaluate(() => ({ st: G.state, id: G.panels && G.panels.seq.id }));
    check('...and none open while she wakes', w1.st !== 'PANELS', JSON.stringify(w1));
    // the forge: the film plays, the forge's pages do not follow it
    await stage(page, 'A0B', { woke: 1, gateOpened: 1, tut: 1, ratchetRepaired: 1, 'on_A0B|ratchet': 1, crystal: 1 });
    await sleep(2000);
    const fg = await state(page);
    check('...and after the forge film, no forge pages', fg.st !== 'PANELS' || fg.id !== 'forge', JSON.stringify(fg));
    // the letter: reading it plays the pages; it is not typed out; then opNote
    await stage(page, 'A0B', { woke: 1, gateOpened: 1, tut: 1 });
    const l0 = await page.evaluate(() => {
      const r = (G.statics || []).concat(G.npcs || []).find(e => e && e.extra === 'ratchet');
      if (!r) return { err: 'no ratchet' };
      const said = opRatchet(r);
      return { said, st: G.state, id: G.panels && G.panels.seq.id, dialog: !!G.dialog };
    });
    check('reading the letter plays its pages', l0.st === 'PANELS' && l0.id === 'letter' && !l0.dialog, JSON.stringify(l0));
    await page.evaluate(() => { if (G.panels) G.panels.ph = 'out'; });
    await waitFor(page, () => G.state === 'PLAY', 4000);
    const l1 = await page.evaluate(() => ({ note: !!G.save.flags.opNote, dialog: !!G.dialog }));
    check('...and when they close the letter counts as read (the drawer lesson follows)', l1.note && !l1.dialog, JSON.stringify(l1));
    await sleep(2500);
    const sMig = await state(page);
    check('...and standing in CV3 plays nothing', sMig.st === 'PLAY', JSON.stringify(sMig));

    // ---- once, at its event, never during a crossing / fight / dialogue -----------
    // every frame drawn between the crossing and the pages: none may show the
    // room being played (panelsCovering holds it black while pages arrive)
    const coverWatch = room => page.evaluate(r => {
      const d0 = draw; window.__unc = 0; window.__draw0 = d0;
      draw = function () { if (G.state === 'PLAY' && G.roomId === r && !panelsCovering()) window.__unc++; return d0.apply(this, arguments); };
    }, room);
    const coverDone = () => page.evaluate(() => { draw = window.__draw0; return window.__unc; });
    // NO PAGES ON THE ROAD (owner, 2026-11-19: "the comic that shows before the
    // door, there's no need for it. You only show the comics when I enter the
    // door, the first gate of the city"): walking out of the service bay onto
    // the road plays nothing, and the first pages after the waking are the
    // gate's, as she enters the city.
    await stage(page, 'W1', { woke: 1 });
    await page.evaluate(() => { G.save.panels.past.wake = 1; });
    await sleep(300);
    await page.evaluate(() => { G.trans = { t: TRANS_DUR, to: 'W2', side: 'R', half: false }; });
    await sleep(2600);
    let s = await state(page);
    const road = await page.evaluate(() => ({ room: G.roomId, seqs: PANEL_SEQ.filter(q => (q.room === 'W2' || q.room === 'W1') && !q.film).map(q => q.id), seen: Object.keys(G.save.panels.seen) }));
    check('leaving the service bay onto the road plays no pages', s.st === 'PLAY' && road.room === 'W2' && road.seen.length === 0, JSON.stringify(Object.assign(s, road)));
    check('...and no pages wait on the road at all (the waking is the film\'s)', road.seqs.length === 0, road.seqs.join());
    // THE MACHINERY, ON A FIXTURE. The gate's pages are off the game (above),
    // but they are the cleanest arrival in the chapter, so the crossing, the
    // caption, the skip, the replay and the event timing are proven on them
    // with their library flag lifted for this part of the test only.
    await page.evaluate(() => { panelsSeq('gate').manual = false; });
    // a crossing into the city, through the gate: the pages cover it
    await stage(page, 'W2', { woke: 1, gateOpened: 1 });
    await page.evaluate(() => { G.save.panels.past.wake = 1; });
    await waitFor(page, () => panelsLoaded(panelsSeq('gate')), 8000);
    await sleep(300);
    await coverWatch('A0');
    await page.evaluate(() => { G.trans = { t: TRANS_DUR, to: 'A0', side: 'R', half: false }; });
    const fired = await waitFor(page, () => G.state === 'PANELS' && G.panels.seq.id === 'gate');
    check('fixture: a crossing plays pages that are due in the room it enters (A0)', fired, await page.evaluate(() => G.state + ' ' + G.roomId + ' ' + (G.panels && G.panels.seq.id)));
    const unc = await coverDone();
    check('...over the crossing: not one frame of A0 is played before them', unc === 0, unc + ' frames');
    const tr = await page.evaluate(() => ({ room: G.roomId, trans: !!G.trans }));
    check('...and the crossing is finished by them, not resumed after', tr.room === 'A0' && !tr.trans, JSON.stringify(tr));
    const seenSaved = await page.evaluate(() => !!JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))).panels.seen.gate);
    check('it is marked seen (and saved) as it begins', seenSaved);

    // caption: reveal, confirm completes, separate confirm advances
    await page.evaluate(() => { const P = G.panels; while (P.list[P.i] && !P.list[P.i].cap) panelsAdvance(P); });
    // pick a panel whose caption is not baked into the art in English
    await page.evaluate(() => { const P = G.panels; while (P.list[P.i] && (P.list[P.i].baked || !P.list[P.i].cap)) panelsAdvance(P); });
    await waitFor(page, () => G.panels && G.panels.ph === 'show' && G.panels.t > 0.45 && G.panels.reveal && panelsRevealCount(G.panels.reveal) > 0, 4000);
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
    await page.evaluate(() => { loadRoom('W2'); });
    await sleep(300);
    await page.evaluate(() => { loadRoom('A0'); G.state = 'PLAY'; G.enemies = []; player.on = true; });
    await sleep(2200);
    s = await state(page);
    check('a revisit does not replay it', s.st === 'PLAY', JSON.stringify(s));
    await page.evaluate(() => {
      const sv = JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));
      startGame(sv); loadRoom('A0'); G.wake = null; G.state = 'PLAY'; G.enemies = []; G.tut = null; G.tutorialLock = null; player.on = true;
    });
    await sleep(2500);
    s = await state(page);
    check('reloading the save does not replay it', s.st === 'PLAY', JSON.stringify(s));

    // replay: only what was seen
    const rows = await page.evaluate(() => panelsSeenList().map(q => q.id));
    check('the replay list holds only the seen sequence', rows.length === 1 && rows[0] === 'gate', JSON.stringify(rows));
    const row = await page.evaluate(() => pauseItems().some(it => it.id === 'panels'));
    check('the pause menu offers Story panels once one is seen', row);
    await page.evaluate(() => { G.state = 'PANELLIST'; G.panelIdx = 0; });
    await tapKey(page, 'Enter');
    s = await state(page);
    check('replay plays it again from the list', s.st === 'PANELS' && s.id === 'gate', JSON.stringify(s));
    await page.evaluate(() => { keys.Escape = true; keysP.Escape = true; });
    await sleep(1300);
    await page.evaluate(() => { delete keys.Escape; });
    const toList = await waitFor(page, () => G.state === 'PANELLIST', 3000);
    check('a replay hands back to the list, not the room', toList);
    await page.evaluate(() => { G.state = 'PLAY'; });

    // a hostile nearby, and an open dialogue, hold it back
    // the gate opens WHILE she is in A0 (an event, not an arrival)
    await stage(page, 'A0', { woke: 1 });
    await sleep(600);
    s = await state(page);
    check('nothing plays on arrival when no beat is due', s.st === 'PLAY', JSON.stringify(s));
    await page.evaluate(() => {
      const e = new Enemy('crawler', player.x + 120, player.y); G.enemies.push(e);
      G.save.flags.gateOpened = 1;
    });
    await sleep(2600);
    s = await state(page);
    check('never with a hostile in reach', s.st === 'PLAY', JSON.stringify(s));
    await page.evaluate(() => { G.enemies = []; G.dialog = { name: 'x', lines: ['x'], i: 0, onEnd: null }; G.state = 'DIALOG'; });
    await sleep(2000);
    s = await state(page);
    check('never over a dialogue', s.st === 'DIALOG', JSON.stringify(s));
    await waitFor(page, () => panelsLoaded(panelsSeq('gate')), 8000);
    const tQuiet = await page.evaluate(() => { G.dialog = null; G.state = 'PLAY'; return G.time || performance.now() / 1000; });
    const gate = await waitFor(page, () => G.state === 'PANELS' && G.panels.seq.id === 'gate', 8000);
    const tOpen = await page.evaluate(() => G.time || performance.now() / 1000);
    check('fixture: an event\'s pages play once the room is quiet (A0)', gate);
    // directly after the event: no settle, no walking about first
    check('...the moment it is quiet, not after a settle', tOpen - tQuiet < 0.45, (tOpen - tQuiet).toFixed(2) + ' s');
    await page.evaluate(() => { if (G.panels) { G.panels.ph = 'out'; G.panels.t = 1; } });
    await waitFor(page, () => G.state === 'PLAY', 2000);

    await page.evaluate(() => { panelsSeq('gate').manual = true; });
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

    // the teaser: not in the Meadows at all — it plays over the crossing into
    // the Data Conduits (B1), the next screen after her victory
    for (const room of ['A3', 'A4']) {
      await stage(page, room, { woke: 1, bossGlitch: 1, crystal: 1, sageTame_GA1D: 1, bossChime: 1, nfMeet: 1 });
      await page.evaluate(() => { G.save.panels.past = { free: 1 }; });
      for (let k = 0; k < 20; k++) {
        await page.evaluate(() => { if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; } });
        await sleep(100);
      }
      s = await state(page);
      check('no teaser in ' + room, s.st === 'PLAY' || (s.st === 'PANELS' && s.id !== 'ch2'), JSON.stringify(s));
    }
    await coverWatch('B1');
    await stage(page, 'B1', { woke: 1, bossGlitch: 1, crystal: 1, sageTame_GA1D: 1, bossChime: 1, nfMeet: 1 }, true);
    const tz = await waitFor(page, () => {
      if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
      return G.state === 'PANELS' && G.panels.seq.id === 'ch2';
    }, 8000);
    check('the chapter-two teaser plays over the crossing into the Data Conduits', tz, await page.evaluate(() => G.state + ' ' + (G.panels && G.panels.seq.id)));
    const uncB = await coverDone();
    check('...before a single frame of B1 is played', uncB === 0, uncB + ' frames');
    const last = await page.evaluate(() => { const P = G.panels; return P && P.list[P.list.length - 1].title === true; });
    check('the teaser ends on the chapter title card', last);
    await page.evaluate(() => { if (G.panels) { G.panels.ph = 'out'; G.panels.t = 1; } });
    await waitFor(page, () => G.state === 'PLAY', 2000);

    // ...and over the REAL way up: she jumps through the camp's hatch, the
    // teaser opens over the shaft, and when it closes the climb still carries
    // her onto B1's ledge — the pages pause the crossing, they do not break it
    await stage(page, 'A3', { woke: 1, bossGlitch: 1, crystal: 1, sageTame_GA1D: 1, bossChime: 1, nfMeet: 1, ch2Climb: 1 });
    await page.evaluate(() => { G.save.panels.past.free = 1; if (G.save.visited) delete G.save.visited.B1; });
    await waitFor(page, () => panelsLoaded(panelsSeq('ch2')), 10000);
    await page.evaluate(() => {
      // (the staging itself raises cards — the bell's evolution — that would
      // re-open mid-climb and hold the crossing; they are not what is tested)
      if (typeof OVERLAY_Q !== 'undefined') OVERLAY_Q.length = 0;
      // (the climb holds JUMP, and a held key is also the skip: the pages can
      // open and be skipped between two polls — so their start is recorded)
      window.__tzStart = false; const ps0 = panelsStart;
      panelsStart = function (id) { if (id === 'ch2' && G.roomId === 'B1') window.__tzStart = true; return ps0.apply(this, arguments); };
      G.dialog = null; G.state = 'PLAY'; G.enemies = []; G.projs = [];
      const g = G.grid, cols = [];
      if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) cols.push(x);
      else for (let x = 1; x < G.roomDef.w - 1; x++) if (g[0][x] === '.') cols.push(x);
      const cx = cols[Math.floor(cols.length / 2)];
      player.x = cx * TILE + (TILE - player.w) / 2; player.y = TILE + 2; player.vx = 0; player.vy = -760; player.on = false; player.iT = 99;
      keys[KEYB.JUMP[0]] = 1;
    });
    const shaftTz = await waitFor(page, () => {
      if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
      return (G.state === 'PANELS' && G.panels.seq.id === 'ch2') || window.__tzStart;
    }, 6000);
    await page.evaluate(() => { for (const k in keys) keys[k] = 0; });
    check('jumping up through the hatch opens the teaser over the shaft', shaftTz, await page.evaluate(() => G.state + ' ' + G.roomId + ' seen=' + Object.keys(G.save.panels.seen).join(',') + ' past=' + Object.keys(G.save.panels.past).join(',') + ' q=' + PN.queue.join(',') + ' due=' + PN.due + ' bossGlitch=' + G.save.flags.bossGlitch));
    await page.evaluate(() => { if (G.panels) { G.panels.ph = 'out'; G.panels.t = 1; } });
    // ...she steers her own landing in a seamless shaft (owner, 2026-10-13),
    // toward the ledge beside the hatch, letting go once over it
    const landed = await waitFor(page, () => {
      if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
      G.enemies = []; if (player) player.iT = 99;
      if (G.state === 'PLAY' && G.roomId === 'B1' && !player.on) {
        if (window.__tx == null) { const led = topLedge('B1', player.x, player.y, 1, true); window.__tx = led ? led.x1 : player.x; }
        const d = Math.sign(window.__tx - player.x), go = Math.abs(window.__tx - player.x) > 4;
        keys[KEYB.LEFT[0]] = go && d < 0 ? 1 : 0; keys[KEYB.RIGHT[0]] = go && d > 0 ? 1 : 0;
      } else { keys[KEYB.LEFT[0]] = 0; keys[KEYB.RIGHT[0]] = 0; }
      return G.state === 'PLAY' && G.roomId === 'B1' && !G.climb && player.on;
    }, 6000);
    const atB1 = await page.evaluate(() => ({ room: G.roomId, on: player.on, feet: Math.round(player.y + player.h), st: G.state }));
    check('...and when it closes, she can still steer onto B1\'s ledge', landed && atB1.room === 'B1' && atB1.on, JSON.stringify(atB1));
    // A BEAT DUE IN A ROOM SHE LEAVES IS NOT LOST (2026-11-19): the bell falls,
    // she is still in the air when she leaves A9 — the bell's pages play over
    // the next doorway instead of never
    await stage(page, 'A9', { bossChime: 1 });
    const left = await page.evaluate(async () => {
      if (G.panels) { G.panels = null; G.state = 'PLAY'; }
      panelsLoad(panelsSeq('chime'));
      player.on = false; G.boss = null;
      for (let i = 0; i < 20; i++) panelsTick(1 / 60);
      const inRoom = G.state;
      loadRoom('A8'); G.state = 'PLAY'; G.trans = null; player.on = true;
      for (let i = 0; i < 300 && G.state === 'PLAY'; i++) { panelsTick(1 / 30); await new Promise(r => setTimeout(r, 10)); }
      return { inRoom, st: G.state, id: G.panels && G.panels.seq.id, room: G.roomId };
    });
    check('a comic due in a room she left in mid-air plays over the next doorway, not never', left.inRoom === 'PLAY' && left.st === 'PANELS' && left.id === 'chime', JSON.stringify(left));
    await page.evaluate(() => { if (G.panels) { G.panels.ph = 'out'; G.panels.t = 1; } G.panels = null; G.state = 'PLAY'; });
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
