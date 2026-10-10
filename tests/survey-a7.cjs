// THE SURVEY IS THE ERRAND, NOT THE SHAFT (studio review MIS-01).
//
// Ratchet's side errand `ratchet_deep` used to be a REACH: dropping into A7
// finished it, and the early-discovery path read visited.A7 — so the coin was
// paid for arriving, before (or without) the one thing down there worth
// finding: the quarrymen's survey, terminal 20. It is a READ now. This walks
// every case through the game's own interaction path — the player is stood
// beside the terminal or Ratchet, a real KeyE keydown goes through the page's
// input listener, and update() turns it into findNear -> doInteract exactly as
// in play; dialogue pages are turned with the same key at a reader's pace.
// Rooms and positions are staged (the shaft's climb and drop have their own
// harnesses: climbout, cave-passage); the interaction is not.
//
//   1. standing in A7 after the ask does not complete it, and is not "early"
//   2. reading the survey after the ask completes it; Ratchet pays exactly once
//   3. reading it BEFORE the ask is remembered: the early line, paid once
//   4. an old save already paid under the visit rule stays paid: no re-offer,
//      no second payment, reading the survey afterwards changes nothing
//   5. an old save with the errand active and A7 visited but the survey
//      unread stays active through the real load path, until it is read
//
//   node tests/survey-a7.cjs       (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name);
};

(async () => {
  console.log('── survey-a7 — Ratchet\'s errand is finished by reading the survey, not by standing in the shaft\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof questRead === 'function', { timeout: 30000 });

  // the harness drives the clock itself, so stop the page's own loop
  await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const FLAGS = { woke: 1, tut: 1, heal: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, nfBreak: 1, crystal: 1, ratchetCamp: 1, alphaLead: 1 };
    window.__sv = {
      FLAGS,
      quiet() {
        if (typeof overlayClear === 'function') overlayClear();
        G.wake = G.cut = G.dialog = G.meet = G.trans = G.gateWalk = G.bossEntry = G.item = null; G.tut = null; G.state = 'PLAY';
        G.hitStop = 0; G.recharge = null;
      },
      // a chapter-one save past the forge, before the survey errand
      fresh() {
        const sv = newSave(1); sv.time = 99;
        Object.assign(sv.flags, FLAGS);
        sv.flags.said = { sl_ratchet_forged: 1 };
        sv.quests.ratchet_forge = 'done';
        startGame(sv); this.quiet();
      },
      // stage a room and stand her beside a static, on its floor
      standBy(room, pick) {
        loadRoom(room); this.quiet();
        G.enemies = []; G.pickups = []; G.boss = null;
        const s = G.statics.find(pick);
        if (!s) return null;
        player.x = s.x - player.w - 4; player.y = s.y + s.h - player.h;
        player.vx = player.vy = 0; player.on = true; player.face = 1;
        for (let i = 0; i < 6; i++) update(1 / 60);
        return s;
      },
      tick(n) { for (let i = 0; i < n; i++) { update(1 / 60); for (const k in keysP) delete keysP[k]; } },
      ratchet() { return G.statics.find(s => s.type === 'npc' && s.extra === 'ratchet'); },
      term() { return G.statics.find(s => s.type === 'term' && s.extra === 20); },
      snap() {
        return { state: qState('ratchet_deep'), done: qDone(questById('ratchet_deep')), scrap: G.save.scrap,
                 coin: (G.save.relics || []).filter(r => r === 'coin').length,
                 read: !!(G.save.flags.termRead && G.save.flags.termRead[20]),
                 toasts: (G.toasts || []).map(x => x.text) };
      },
    };
  });

  // one real key press, then the frames that read it
  const press = async (frames) => {
    await page.keyboard.down('KeyE');
    await page.evaluate(n => __sv.tick(n), frames || 1);
    await page.keyboard.up('KeyE');
  };
  // read every page of whatever conversation is open, a press per page at a
  // reader's pace (js/overlay.js refuses a mash), collecting what was said
  const readAll = async () => {
    const said = [];
    for (let n = 0; n < 200; n++) {
      const d = await page.evaluate(() => G.state === 'DIALOG' && G.dialog ? [].concat(G.dialog.lines || []) : null);
      if (!d) break;
      for (const l of d) if (said.indexOf(l) < 0) said.push(l);
      await press(20);
    }
    return said;
  };
  // walk up to the thing and press interact, through the real input path
  const interact = async (room, which) => {
    const near = await page.evaluate(([room, which]) => {
      const s = __sv.standBy(room, which === 'term' ? (q => q.type === 'term' && q.extra === 20) : (q => q.type === 'npc' && q.extra === 'ratchet'));
      G.toasts = [];
      return { found: !!s, near: !!s && G.near === s, label: G.near && G.near.type };
    }, [room, which]);
    if (!near.found || !near.near) return { near, said: [], opened: false };
    await press(1);
    const opened = await page.evaluate(() => G.state === 'DIALOG');
    const toastsAtOpen = await page.evaluate(() => (G.toasts || []).map(x => x.text));
    const said = await readAll();
    const after = await page.evaluate(() => { const st = G.state; __sv.quiet(); return st; });
    return { near, opened, said, after, toastsAtOpen };
  };

  const S = await page.evaluate(() => ({
    ask: t('q_ask_ratchet_deep'), goal: t('q_goal_ratchet_deep'), thanks: t('q_thanks_ratchet_deep'),
    early: t('q_early_ratchet_deep'), ready: t('q_ready'), survey: t('t20'), read: t('read'),
  }));
  check('the strings exist and speak of the survey', [S.ask, S.goal, S.thanks, S.early].every(v => typeof v === 'string' && /survey/i.test(v))
    && Array.isArray(S.survey) && S.survey.length === 3, JSON.stringify([S.ask, S.early]).slice(0, 120));

  // ---- 1. the shaft alone finishes nothing ---------------------------------
  await page.evaluate(() => __sv.fresh());
  const ask1 = await interact('A3', 'ratchet');
  const s1 = await page.evaluate(() => __sv.snap());
  check('Ratchet asks for the survey (real interact press beside him)',
    ask1.near.near && ask1.opened && ask1.said.join(' ').indexOf(S.ask) >= 0
    && ask1.said.join(' ').indexOf(S.early) < 0 && s1.state === 'active',
    JSON.stringify({ near: ask1.near, state: s1.state, said: ask1.said.join(' ').slice(0, 80) }));
  const v1 = await page.evaluate(() => {
    G.toasts = []; loadRoom('A7'); __sv.quiet(); G.enemies = []; G.pickups = [];
    // she walks the floor of the shaft — everywhere but the survey
    for (let i = 0; i < 90; i++) update(1 / 60);
    return __sv.snap();
  });
  check('standing in A7 after the ask does NOT complete the errand', v1.state === 'active' && !v1.done && !v1.read
    && v1.toasts.indexOf(S.ready) < 0, JSON.stringify(v1));
  const back1 = await interact('A3', 'ratchet');
  const s1b = await page.evaluate(() => __sv.snap());
  check('...and Ratchet does not pay for it: he still points her at the survey',
    s1b.state === 'active' && s1b.scrap === s1.scrap && s1b.coin === 0
    && back1.said.join(' ').indexOf(S.goal) >= 0 && back1.said.join(' ').indexOf(S.thanks) < 0,
    back1.said.join(' | ').slice(0, 120));

  // ---- 2. reading it after the ask completes it ----------------------------
  const rd2 = await interact('A7', 'term');
  const s2 = await page.evaluate(() => __sv.snap());
  check('the survey is a real interactable: the "Read" cue over it, the key opens it',
    rd2.near.near && rd2.near.label === 'term' && rd2.opened && S.read && S.read !== 'read',
    JSON.stringify(rd2.near));
  check('...the press reads all three lines of the survey', S.survey.every(l => rd2.said.indexOf(l) >= 0), rd2.said.length + ' lines');
  check('...and reading it after the ask completes the errand, and says so',
    s2.read && s2.done && s2.state === 'active' && (rd2.toastsAtOpen || []).indexOf(S.ready) >= 0, JSON.stringify(s2));
  const persisted = await page.evaluate(() => { persist(); const sv = JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))); return !!(sv.flags.termRead && sv.flags.termRead[20]); });
  check('...the read is in the saved game', persisted);
  const pay2 = await interact('A3', 'ratchet');
  const s2b = await page.evaluate(() => __sv.snap());
  check('Ratchet thanks her for the reading and pays: +80 scrap and the coin',
    pay2.said.join(' ').indexOf(S.thanks) >= 0 && s2b.state === 'done' && s2b.scrap - s2.scrap === 80 && s2b.coin === 1,
    JSON.stringify({ scrap: s2b.scrap - s2.scrap, coin: s2b.coin, state: s2b.state }));
  const again2 = await interact('A3', 'ratchet');
  const rd2b = await interact('A7', 'term');
  const s2c = await page.evaluate(() => __sv.snap());
  check('...exactly once: talking again and re-reading pay nothing more',
    s2c.scrap === s2b.scrap && s2c.coin === 1 && s2c.state === 'done' && again2.said.join(' ').indexOf(S.thanks) < 0
    && (rd2b.toastsAtOpen || []).indexOf(S.ready) < 0 && (await page.evaluate(() => (questFor('ratchet') || {}).id)) !== 'ratchet_deep',
    JSON.stringify({ d: s2c.scrap - s2b.scrap }));

  // ---- 3. read before the ask: remembered, paid once with the early line ----
  await page.evaluate(() => __sv.fresh());
  const s3a = await page.evaluate(() => __sv.snap());
  const rd3 = await interact('A7', 'term');
  const s3 = await page.evaluate(() => __sv.snap());
  check('reading the survey before anyone asks is remembered, and is not an errand yet',
    rd3.opened && s3.read && s3.state === 'none' && (rd3.toastsAtOpen || []).indexOf(S.ready) < 0, JSON.stringify(s3));
  const ask3 = await interact('A3', 'ratchet');
  const s3b = await page.evaluate(() => __sv.snap());
  check('...Ratchet says she already read it — the early line — and pays on the ask',
    ask3.said.join(' ').indexOf(S.early) >= 0 && ask3.said.join(' ').indexOf(S.ask) < 0
    && s3b.state === 'done' && s3b.scrap - s3a.scrap === 80 && s3b.coin === 1,
    JSON.stringify({ said: ask3.said.join(' | ').slice(0, 100), scrap: s3b.scrap - s3a.scrap, coin: s3b.coin }));
  const again3 = await interact('A3', 'ratchet');
  const s3c = await page.evaluate(() => __sv.snap());
  check('...once', s3c.scrap === s3b.scrap && s3c.coin === 1 && again3.said.join(' ').indexOf(S.early) < 0);

  // ...and the shaft without the survey is not early discovery either
  await page.evaluate(() => { __sv.fresh(); loadRoom('A7'); __sv.quiet(); for (let i = 0; i < 30; i++) update(1 / 60); });
  const ask3v = await interact('A3', 'ratchet');
  const s3v = await page.evaluate(() => __sv.snap());
  check('having stood in A7 without reading is NOT early discovery: he asks, nothing is paid',
    (await page.evaluate(() => !!G.save.visited.A7)) && ask3v.said.join(' ').indexOf(S.early) < 0
    && ask3v.said.join(' ').indexOf(S.ask) >= 0 && s3v.state === 'active' && s3v.coin === 0,
    ask3v.said.join(' | ').slice(0, 100));

  // ---- 4/5. saves made under the old visit rule, through the real load path --
  const oldSave = async (deep) => page.evaluate(deep => {
    const sv = newSave(1); sv.time = 99;
    Object.assign(sv.flags, __sv.FLAGS); sv.flags.said = { sl_ratchet_forged: 1 };
    sv.quests.ratchet_forge = 'done'; sv.quests.ratchet_deep = deep;
    sv.visited.A7 = 1;
    sv.qbase = { ratchet_deep: { reached: 1 } };          // what the old reach rule left behind
    if (deep === 'done') { sv.relics = (sv.relics || []).concat('coin'); sv.scrap = 500; }
    delete sv.flags.termRead;
    localStorage.setItem(saveKeyFor('robo'), JSON.stringify(sv));
    const loaded = loadStored('robo');                   // migrateStory, as Continue does
    startGame(loaded); __sv.quiet();                     // migrateWeapons + questMigrate
    return Object.assign(__sv.snap(), { qbase: JSON.stringify(G.save.qbase || {}) });
  }, deep);

  const o4 = await oldSave('done');
  check('an old save paid under the visit rule loads still paid', o4.state === 'done' && o4.coin === 1, JSON.stringify(o4));
  const t4 = await interact('A3', 'ratchet');
  const r4 = await interact('A7', 'term');
  const t4b = await interact('A3', 'ratchet');
  const o4b = await page.evaluate(() => __sv.snap());
  const all4 = t4.said.concat(t4b.said).join(' ');
  check('...is never offered again, and reading the survey afterwards pays nothing',
    o4b.state === 'done' && o4b.scrap === o4.scrap && o4b.coin === 1 && all4.indexOf(S.ask) < 0 && all4.indexOf(S.thanks) < 0
    && all4.indexOf(S.early) < 0 && (r4.toastsAtOpen || []).indexOf(S.ready) < 0,
    JSON.stringify({ scrap: o4b.scrap - o4.scrap, coin: o4b.coin }));

  const o5 = await oldSave('active');
  check('an old save with the errand active and A7 visited but the survey unread stays ACTIVE on load',
    o5.state === 'active' && !o5.done && !o5.read && o5.qbase.indexOf('ratchet_deep') < 0, JSON.stringify(o5));
  const t5 = await interact('A3', 'ratchet');
  const o5b = await page.evaluate(() => __sv.snap());
  check('...Ratchet still sends her to the survey and pays nothing',
    o5b.state === 'active' && o5b.scrap === o5.scrap && o5b.coin === 0 && t5.said.join(' ').indexOf(S.goal) >= 0,
    t5.said.join(' | ').slice(0, 100));
  await interact('A7', 'term');
  const t5b = await interact('A3', 'ratchet');
  const o5c = await page.evaluate(() => __sv.snap());
  check('...until she reads it: then he thanks her and pays once',
    t5b.said.join(' ').indexOf(S.thanks) >= 0 && o5c.state === 'done' && o5c.scrap - o5.scrap === 80 && o5c.coin === 1,
    JSON.stringify({ scrap: o5c.scrap - o5.scrap, coin: o5c.coin, state: o5c.state }));

  // ---- the five languages ----------------------------------------------------
  const langs = await page.evaluate(() => {
    const bad = [], seen = {};
    for (const l of LANGS.map(x => x.id)) {
      LANG = l;
      for (const k of ['q_ask_ratchet_deep', 'q_goal_ratchet_deep', 'q_thanks_ratchet_deep', 'q_early_ratchet_deep']) {
        const v = t(k);
        if (typeof v !== 'string' || v === k || (l !== 'en' && v === (seen[k] || ''))) bad.push(l + ':' + k);
        if (l === 'en') seen[k] = v;
      }
    }
    LANG = 'en';
    return { bad, langs: LANGS.map(x => x.id) };
  });
  check('ask, goal, thanks and early lines exist in every language, each its own translation',
    !langs.bad.length && ['en', 'ar', 'tr', 'zh', 'ru'].every(l => langs.langs.indexOf(l) >= 0), langs.bad.join(',') || langs.langs.join(','));

  if (errs.length) check('no page errors', false, errs.slice(0, 3).join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.length + ' check(s)'); process.exit(1); }
  console.log('\nOK — the coin is paid for the survey, once, and old saves keep what they earned');
})().catch(e => { console.error(e); process.exit(1); });
