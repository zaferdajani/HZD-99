// THE TEXT RULES THE OTHER READER HARNESS DOES NOT REACH.
//
// tests/textreveal.cjs proves the reader on a keyboard: typed pages, first
// confirm reveals, a separate one turns, mash-proof, paged, Chinese and Arabic
// laid out, instant and reduced motion. The owner's text rules (studio brief,
// section F) also say:
//
//   * BLOCKING DIALOGUE PAUSES COMBAT. With a wolf on top of her and a shot in
//     the air, nothing hurts her while a conversation, an item card or a story
//     card is open — and the same wolf and shot DO hurt her without one (the
//     control, so the freeze is not a harmless setup). A guardian is frozen
//     too: its update is never called under a card.
//   * no single input both reveals and dismisses — on TOUCH, where it is
//     easiest to break: the tap on the on-screen E button that opens a talk
//     does not also reveal or turn it; a quick double tap while a page types
//     completes it and does not turn it; a double tap on a complete page turns
//     exactly one page; a finger held on a game button while a card opens
//     turns nothing. The same for the manhwa panels (js/panels.js), which
//     count a confirm on release. And a gamepad press, and a frame on which
//     two confirm controls arrive together (a pad's A is OK and INT), count
//     once.
//   * numbers and urgent notices stay immediate: the scrap count on the HUD is
//     the new number on the next frame, a toast (the ward's warning) is drawn
//     whole on its first frame — nothing numeric or urgent is typewritten.
//   * no competing overlay: a notice raised during a conversation is not drawn
//     over it, and is shown whole once the conversation closes.
//   * phone width (844x390): Arabic, Chinese, Russian and Turkish dialogue —
//     and a URL-long token in each — stays inside the box; screenshots of an
//     Arabic and a Chinese page are written to tests/out/text-rules/.
//
//   node tests/text-rules.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out', 'text-rules');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail == null ? '' : '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail))));
  if (!ok) fails.push(name);
};
const LONG = 'The guardians went last, you know. They were made to protect us, so the song had to shout them down, ' +
  'and it took every one of them before anyone stopped fighting it. You were asleep for recharging and missed it.';

async function boot(browser, opts) {
  const ctx = await browser.newContext(opts || { viewport: { width: 960, height: 540 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof heroArtReady === 'function' && heroArtReady() && typeof revealStart === 'function', null, { timeout: 30000 });
  await page.mouse.click(8, 8);
  return { ctx, page, errs };
}
// the meadow after the opening, every story flag a player would have there
const STAGE = (lang) => {
  if (lang) LANG = lang;
  const sv = newSave(1); sv.time = 99;
  Object.assign(sv.flags, { woke: 1, tut: 1, heal: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, ratchetSpareGiven: 1,
    opPod: 1, opTold: 1, opNote: 1, opScrap: 1, sawScrap: 1 });
  sv.items = Object.assign({}, sv.items, { batt: 1 });
  sv.bench = { room: 'A1', x: 1.5 * TILE, y: 13 * TILE };
  sv.opts = { textSpeed: 'normal', reduceMotion: false };
  startGame(sv);
  G.wake = null; G.zoneToast = null; G.toasts = []; G.cut = null; G.trans = null; G.state = 'PLAY';
  if (typeof overlayClear === 'function') overlayClear();
  for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
};

(async () => {
  console.log('── text-rules — combat pauses under cards, one input never does two things, numbers stay immediate\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });

  // ======================= 1. combat pauses (stepped) ========================
  {
    const { ctx, page, errs } = await boot(browser);
    const r = await page.evaluate(([src, LONG_TXT]) => {
      const STAGE = eval('(' + src + ')');
      window.requestAnimationFrame = () => 0;
      const step = (n, press) => { for (let i = 0; i < n; i++) {
        if (press && i === 0) for (const k of press) { keys[k] = 1; keysP[k] = 1; }
        update(1 / 60); for (const k in keysP) keysP[k] = 0;
        if (press && i === 0) for (const k of press) keys[k] = 0; } };
      // a wolf ON her and a hostile shot a few px away and closing
      const danger = () => {
        STAGE();
        player.x = 12 * TILE; player.y = pgFloorY(player.x + player.w / 2) - player.h - 1; player.vx = player.vy = 0;
        for (let i = 0; i < 20; i++) update(1 / 60);
        player.iT = 0; player.cores = player.maxCores();
        const w = G.enemies.find(e => e && !e.dead && isWolf(e)) || G.enemies.find(e => e && !e.dead);
        if (w) { w.x = player.x + player.w / 2 - w.w / 2; w.y = player.y + player.h - w.h; w.calm = false; w.hypnoT = 0; }
        G.projs = [new Proj(player.x + player.w / 2 - 40, player.y + player.h / 2, 260, 0, false, 1, 6, '#ff5c6c')];
        return w;
      };
      const snap = (w) => ({ cores: player.cores, iT: +player.iT.toFixed(3), wx: w ? Math.round(w.x * 100) : null,
        px: G.projs[0] ? Math.round(G.projs[0].x * 100) : null, hx: Math.round(player.x * 100) });
      const out = {};
      // the control: nothing open, the same danger hurts her
      let w = danger(); const c0 = player.cores;
      step(90);
      out.control = { wolf: !!(w && isWolf(w)), before: c0, after: player.cores };
      // under each kind of blocking overlay
      const kinds = {
        npc: () => { G.dialog = { name: t('n_servo'), npc: 'servo', lines: ['…', '…'], i: 0, onEnd: null }; G.state = 'DIALOG'; },
        item: () => showItem(t('i_kit'), t('i_kitd')),
        note: () => storyNote(t('story_need_blade'), null),
      };
      out.frozen = {};
      for (const k in kinds) {
        w = danger(); kinds[k]();
        const a = snap(w); step(180); const b = snap(w);
        out.frozen[k] = { state: G.state, same: JSON.stringify(a) === JSON.stringify(b), a, b };
        G.dialog = null; G.state = 'PLAY'; overlayClear();
      }
      // a guardian under a card: its update is not called at all
      STAGE(); Object.assign(G.save.flags, { crystal: 1, pl_cshard: 1, sageTame_GA1D: 1, bossChime: 1, nfMeet: 1, ratchetCamp: 1 });
      loadRoom('A4'); G.state = 'PLAY'; G.wake = null;
      player.x = 8 * TILE; player.y = pgFloorY(player.x + player.w / 2) - player.h - 1;
      if (!G.boss) G.boss = new Boss('glitch', player.x + 6 * TILE, 15 * TILE);
      let calls = 0; const real = G.boss.update.bind(G.boss);
      G.boss.update = function (dt) { calls++; return real(dt); };
      step(30); const inPlay = calls; calls = 0;
      showItem(t('i_kit'), t('i_kitd')); step(120);
      out.boss = { kind: G.boss.kind, inPlay, underCard: calls, state: G.state };
      G.dialog = null; G.state = 'PLAY'; overlayClear();

      // ======= 2. gamepad / doubled controls count once (stepped) ==========
      STAGE(); G.save.opts.textSpeed = 'normal';
      G.dialog = { name: 'Ratchet', npc: 'ratchet', lines: [LONG_TXT, 'two'], i: 0, onEnd: null }; G.state = 'DIALOG';
      step(20);
      step(1, ['GP_INT']);
      out.pad1 = { done: revealDone(G.dialog._rv), i: G.dialog.i, pg: G.dialog.pg };
      step(30); step(1, ['GP_INT']);
      out.pad2 = { i: G.dialog && G.dialog.i, pg: G.dialog && G.dialog.pg };
      // OK + INT + ATK on the very same frame: one press
      STAGE(); G.dialog = { name: 'Ratchet', npc: 'ratchet', lines: [LONG_TXT, 'two'], i: 0, onEnd: null }; G.state = 'DIALOG';
      step(20); step(1, ['GP_OK', 'GP_INT', 'KeyX']);
      out.both = { done: revealDone(G.dialog._rv), i: G.dialog.i, pg: G.dialog.pg };

      // ======= 3. numbers and urgent notices are immediate ==================
      STAGE(); step(5);
      const said = []; const realF = window.ftxt;
      window.ftxt = function (s) { said.push(String(s)); return realF.apply(this, arguments); };
      G.save.scrap += 37; const want = '⬢ ' + G.save.scrap;
      G.toast(t('gate_chime_ward'));
      try { draw(performance.now()); } finally { window.ftxt = realF; }
      out.hud = { scrap: said.indexOf(want) >= 0, want, toast: said.indexOf(t('gate_chime_ward')) >= 0 };

      // ======= 4. a notice during a conversation waits for it ===============
      STAGE(); step(5);
      G.dialog = { name: 'Ratchet', npc: 'ratchet', lines: ['one'], i: 0, onEnd: null }; G.state = 'DIALOG';
      const noticeTxt = t('i_scrap') + ' — ' + t('i_scraph');
      G.toast(noticeTxt);
      const said2 = []; window.ftxt = function (s) { said2.push(String(s)); return realF.apply(this, arguments); };
      try { step(30); draw(performance.now()); } finally { window.ftxt = realF; }
      const during = said2.indexOf(noticeTxt) >= 0;
      const lifeDuring = (G.toasts.find(q => q.text === noticeTxt) || {}).t;
      step(1, ['Enter']); step(20); step(1, ['Enter']); step(2);
      const said3 = []; window.ftxt = function (s) { said3.push(String(s)); return realF.apply(this, arguments); };
      try { draw(performance.now()); } finally { window.ftxt = realF; }
      out.notice = { during, after: said3.indexOf(noticeTxt) >= 0, state: G.state, lifeDuring };
      return out;
    }, [STAGE.toString(), LONG]);
    check('control: the wolf and the shot DO hurt her with nothing open', r.control.after < r.control.before, r.control);
    for (const k in r.frozen) {
      const f = r.frozen[k];
      check('under ' + (k === 'npc' ? 'a conversation' : k === 'item' ? 'an item card' : 'a story card') +
        ' nothing moves and nothing hurts her (three seconds, wolf on top of her, shot in the air)',
        f.state === 'DIALOG' && f.same, JSON.stringify(f.b));
    }
    check('a guardian is frozen under a card: its update never runs', r.boss.inPlay > 0 && r.boss.underCard === 0 && r.boss.state === 'DIALOG', r.boss);
    check('a gamepad press reveals the page and does not turn it', r.pad1.done && r.pad1.i === 0 && r.pad1.pg === 0, r.pad1);
    check('...a second, separate pad press turns it', r.pad2.pg === 1 || r.pad2.i === 1, r.pad2);
    check('three confirm controls on one frame are one press: revealed, not turned', r.both.done && r.both.i === 0 && r.both.pg === 0, r.both);
    check('the scrap count is the new number on the very next frame (not typed, not rolled)', r.hud.scrap, r.hud.want);
    check('an urgent notice (the ward) is drawn whole on its first frame', r.hud.toast);
    check('a notice raised during a conversation is not drawn over it', !r.notice.during, r.notice);
    check('...and is shown, whole, once the conversation closes', r.notice.after && r.notice.state === 'PLAY', r.notice);
    check('no page errors (stepped)', !errs.length, errs.slice(0, 2));
    await ctx.close();
  }

  // ======================= 5. touch, real loop ================================
  {
    const { ctx, page, errs } = await boot(browser, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.evaluate(`(${STAGE.toString()})()`);
    await page.evaluate(() => { TOUCH.enabled = true; });
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const tap = async (x, y) => { await touch('touchStart', [{ x, y }]); await sleep(40); await touch('touchEnd', []); };
    // a DOUBLE tap as fast as a thumb does it, and the gap the page actually
    // saw between the two touches (timed in the page, not here: the protocol's
    // own latency is not the player's)
    // the gap is read on the GAME's clock (the dialogue's dlgClock, the
    // panel's own t) — the clocks its rules are written against; on a loaded
    // machine wall time runs ahead of the simulation, which caps its step
    await page.evaluate(() => { window.__tt = []; addEventListener('touchstart', () =>
      __tt.push(1000 * (G.state === 'PANELS' && G.panels ? G.panels.t : (G.dlgClock || 0))), { capture: true }); });
    // The protocol's touch dispatch costs ~150 ms a call on this page at DPR 2,
    // which is slower than a thumb — so the double tap is dispatched IN the
    // page, as real TouchEvents on the touch layer's own element (the same
    // tStart/tEnd handlers a finger reaches), two frames apart.
    const dtap = async (x, y) => {
      const gap = await page.evaluate(([x, y]) => new Promise(res => {
        __tt.length = 0;
        const ev = (type, id) => {
          const t0 = new Touch({ identifier: id, target: tc, clientX: x, clientY: y });
          const list = type === 'touchend' ? [] : [t0];
          tc.dispatchEvent(new TouchEvent(type, { touches: list, targetTouches: list, changedTouches: [t0], bubbles: true, cancelable: true }));
        };
        // frame-paced, not timer-paced: a timer fires late on a busy page, a
        // frame does not skip — each touch in its own frame
        const after = (n, fn) => n <= 0 ? fn() : requestAnimationFrame(() => after(n - 1, fn));
        // (down a frame, up a frame, down again: the lift is seen by a frame
        // of its own — the panels count a confirm on RELEASE — and two frames
        // are at most 2 x SIM_MAX = 0.2 s of game time, so on a slow page as
        // on a fast one this is a double tap inside DLG_GAP)
        ev('touchstart', 71);
        after(1, () => { ev('touchend', 71);
          after(1, () => { ev('touchstart', 72);
            after(1, () => ev('touchend', 72)); });
          after(3, () => {
            setTimeout(() => res(__tt.length >= 2 ? Math.round(__tt[1] - __tt[0]) : -1), 200); }); });
      }), [x, y]);
      return gap;
    };
    const GAPMS = await page.evaluate(() => DLG_GAP * 1000);
    const btn = (code) => page.evaluate((code) => { const L = tLayout(); const q = L.btns.concat(L.corners).find(b => b.code === code);
      return q ? { x: TOUCH.ox + q.x, y: TOUCH.oy + q.y } : null; }, code);
    const dlg = () => page.evaluate(() => G.dialog ? { st: G.state, i: G.dialog.i, pg: G.dialog.pg | 0, done: revealDone(G.dialog._rv),
      n: G.dialog._pages ? G.dialog._pages.length : 0, lines: G.dialog.lines.length } : { st: G.state });
    // a: walk to Old Servo and tap the on-screen E button
    await page.evaluate(() => { const s = G.statics.find(q => q.extra === 'servo'); player.x = s.x + s.w / 2 - 70 - player.w / 2; player.vx = 0; });
    await sleep(400);
    const eb = await btn('VINT');
    await tap(eb.x, eb.y);
    await sleep(180);
    const a = await dlg();
    check('touch: the E-button tap that opens a talk does not also reveal or turn it', a.st === 'DIALOG' && a.i === 0 && a.pg === 0 && !a.done, a);
    // (the talk it opened is put away, and with it the waking it would chain
    // into, so nothing of Servo's queues behind the readers below)
    await page.evaluate(() => { G.dialog = null; G.state = 'PLAY'; overlayClear(); if (typeof OP !== 'undefined') OP.later.length = 0; });
    await sleep(200);
    // b: a quick double tap while a page types (a long speech, two lines)
    await page.evaluate((txt) => { overlayClear(); G.dialog = null; G.state = 'PLAY';
      G.dialog = { name: 'Ratchet', npc: 'ratchet', lines: [txt, 'two'], i: 0, onEnd: null }; G.state = 'DIALOG'; }, LONG);
    await sleep(350);
    const gb = await dtap(422, 120);
    const b = await dlg();
    check('touch: a quick double tap while a page types completes it, and does not turn it',
      gb > 0 && gb < GAPMS && b.done && b.i === 0 && b.pg === 0, Object.assign({ gapMs: gb }, b));
    // c: a double tap on the complete page turns exactly one
    await sleep(600);
    const gc = await dtap(422, 120);
    const c = await dlg();
    check('touch: a double tap on a read page turns exactly one page',
      gc > 0 && gc < GAPMS && c.st === 'DIALOG' && c.i + c.pg === 1, Object.assign({ gapMs: gc }, c));
    // d: a finger held on the attack button while a card opens
    await page.evaluate(() => { G.dialog = null; G.state = 'PLAY'; overlayClear(); });
    await sleep(200);
    const ab = await btn('VATK');
    await touch('touchStart', [{ x: ab.x, y: ab.y }]); await sleep(150);
    await page.evaluate((txt) => { G.dialog = { name: 'Ratchet', npc: 'ratchet', lines: [txt, 'two'], i: 0, onEnd: null }; G.state = 'DIALOG'; }, LONG);
    await sleep(1500);
    const d1 = await dlg();
    await touch('touchEnd', []); await sleep(200);
    const d2 = await dlg();
    check('touch: a finger held on a game button while a card opens turns nothing — not while held, not on release',
      d1.i === 0 && d1.pg === 0 && d2.i === 0 && d2.pg === 0, [d1, d2]);
    // e: the manhwa panels, double tap
    await page.evaluate(() => { G.dialog = null; G.state = 'PLAY'; overlayClear(); G.save.panels = { v: 1, seen: {}, past: {}, n: 0 }; panelsPlay('chime'); });
    await page.waitForFunction(() => G.panels && G.panels.ph === 'show' && G.panels.t > 0.5 && G.panels.reveal && !panelsRevealDone(G.panels.reveal), null, { timeout: 8000 }).catch(() => {});
    const pst = () => page.evaluate(() => G.panels ? { i: G.panels.i, done: panelsRevealDone(G.panels.reveal), ph: G.panels.ph, has: !!G.panels.reveal } : { st: G.state });
    const p0 = await pst();
    const gp = await dtap(422, 200);
    const p1 = await pst();
    check('touch: a double tap on a typing panel caption completes it and stays on that panel',
      gp > 0 && gp < GAPMS && p0.has && !p0.done && p1.done && p1.i === p0.i, { gapMs: gp, p0, p1 });
    await sleep(600); await tap(422, 200); await sleep(200);
    const p2 = await pst();
    check('...and a later single tap turns it', p2.i === p0.i + 1 || p2.ph === 'out' || p2.st, p2);
    check('no page errors (touch)', !errs.length, errs.slice(0, 2));
    await ctx.close();
  }

  // ======================= 6. phone width, five languages ======================
  {
    const { ctx, page, errs } = await boot(browser, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const URLISH = 'https://zaferdajani.github.io/HZD-99/manhua/chapter-one/servo-winding-house-and-the-gantry-coil';
    for (const lang of ['ar', 'zh', 'ru', 'tr']) {
      const r = await page.evaluate(([src, lang, url]) => {
        (eval('(' + src + ')'))(lang);
        TOUCH.enabled = true;
        G.save.opts.textSpeed = 'instant';
        const lines = [t('op_sv2'), t('op_sv3') + ' ' + url];
        G.dialog = { name: t('n_servo'), npc: 'servo', lines, i: 0, onEnd: null }; G.state = 'DIALOG';
        const res = [];
        for (let i = 0; i < lines.length; i++) {
          G.dialog.i = i; G.dialog.pg = 0; G.dialog._pk = null;
          const pages = dlgPages(G.dialog);
          c.save(); c.font = dlgFont(G.dialog);
          let widest = 0, n = 0, kept = '';
          for (const pg of pages) for (const ln of pg) { widest = Math.max(widest, c.measureText(ln).width); n = Math.max(n, pg.length); kept += ln; }
          c.restore();
          const strip = s => s.replace(/\s+/g, '');
          res.push({ pages: pages.length, widest: Math.round(widest), maxLines: n, whole: strip(kept) === strip(lines[i]) });
        }
        G.dialog.i = 0; G.dialog.pg = 0; G.dialog._pk = null;
        return { res, box: DLG_W, rtl: textRTL(lang) };
      }, [STAGE.toString(), lang, URLISH]);
      const ok = r.res.every(q => q.widest <= r.box && q.maxLines <= 4 && q.whole);
      check(lang + ' at 844x390: every dialogue line (and a URL-long token) inside the box, four lines a page at most, nothing lost',
        ok, r.res.map(q => q.pages + 'p/' + q.widest + 'px/' + q.maxLines + 'l' + (q.whole ? '' : '/LOST')).join(' ') + ' box ' + r.box);
      if (lang === 'ar' || lang === 'zh') {
        await sleep(400);
        await page.screenshot({ path: path.join(OUT, 'phone-dialog-' + lang + '.png') });
        // and a second page: the URL-long line, cut inside the box
        await page.evaluate(() => { G.dialog.i = 1; G.dialog.pg = 0; G.dialog._pk = null; G.dialog._rv = null; });
        await sleep(300);
        await page.screenshot({ path: path.join(OUT, 'phone-dialog-' + lang + '-long.png') });
      }
      if (lang === 'ar') check('ar is laid out right to left', r.rtl);
    }
    check('no page errors (languages)', !errs.length, errs.slice(0, 2));
    await ctx.close();
  }

  // ======================= 7. the words for what happens ======================
  // CHIME is a construct the Eye BUILT (entities.js MINIS): nothing under the
  // song to give back, so no line may promise to rescue, free or cleanse it.
  // The Sage and the guardians are infected machines: no line may say they are
  // killed or destroyed. Every string the robot world can show, in all five
  // languages, split into sentences; a sentence naming CHIME may not carry a
  // rescue word, a sentence naming a Sage or a guardian may not carry a kill
  // word. (One key says the opposite out loud — "rescued, NOT destroyed" — and
  // is named below rather than hidden by a looser pattern.)
  {
    const { ctx, page, errs } = await boot(browser);
    const r = await page.evaluate(() => {
      const sv = newSave(1); startGame(sv);
      const keys = new Set();
      const add = o => { if (o) for (const k in o) keys.add(k); };
      for (const L of TEXT_LAYERS) add(L.en);
      add(STORY_ORDER_TEXT.en); add(typeof STORY_OCT4_TEXT !== 'undefined' && STORY_OCT4_TEXT.en);
      add(typeof STORY_DRAFT2_TEXT !== 'undefined' && STORY_DRAFT2_TEXT.en); add(typeof GEAR_TEXT !== 'undefined' && GEAR_TEXT.en);
      add(THEMES.robo && THEMES.robo.i18n.en); add(I18N.en);
      const NEGATED = { pg_sage_free: 1 };
      const W = {
        en: { chime: /CHIME/, sage: /\bSages?\b|\bguardians?\b/i, rescue: /\b(rescu\w*|free[sd]?|freeing|cleans\w*|purif\w*|sav(e|ed|es|ing))\b/i, kill: /\b(kill\w*|slay|slain|slew|murder\w*|destroy\w*)\b/i },
        ar: { chime: /رنين/, sage: /حكيم|حكماء|حارس|حراس/, rescue: /أنقذ|إنقاذ|حرّر|حرر|تحرير|طهّر|طهر|تطهير|خلّص/, kill: /قتل|اقتل|يقتل|دمّر|دمر|تدمير/ },
        tr: { chime: /ÇAN|Çan\b/, sage: /Bilge|Muhafız|muhafız|bekçi/, rescue: /kurtar|özgür|arındır|arınd|temizle/i, kill: /öldür|katlet|yok et/i },
        zh: { chime: /风铃/, sage: /贤者|守护者|守卫/, rescue: /拯救|解救|救出|净化|解放|自由/, kill: /杀|消灭|毁灭|摧毁/ },
        ru: { chime: /КОЛОКОЛ|Колокол/, sage: /Мудрец|Страж|страж/, rescue: /спас|освобо|свобод|очист/i, kill: /убил|убит|убей|убить|уничтож/i },
      };
      const out = { keys: keys.size, chime: [], kill: [], cov: {} };
      for (const lang of Object.keys(W)) {
        LANG = lang; const w = W[lang];
        for (const k of keys) {
          let v = t(k); if (v == null || v === k) continue;
          v = [].concat(v).filter(x => typeof x === 'string').join(' ');
          for (const s of v.split(/(?<=[.!?。！？])\s*/)) {
            if (w.chime.test(s)) { out.cov[lang] = (out.cov[lang] | 0) + 1; if (w.rescue.test(s)) out.chime.push(lang + ':' + k + ': ' + s); }
            if (w.sage.test(s)) { out.cov[lang + 'S'] = (out.cov[lang + 'S'] | 0) + 1; if (w.kill.test(s) && !NEGATED[k]) out.kill.push(lang + ':' + k + ': ' + s); }
          }
        }
      }
      LANG = 'en';
      return out;
    });
    const covered = ['en', 'ar', 'tr', 'zh', 'ru'].every(l => r.cov[l] >= 3 && r.cov[l + 'S'] >= 5);
    check('the audit reaches every language (CHIME and the Sages/guardians are each named in several lines of each)', covered, JSON.stringify(r.cov) + ' over ' + r.keys + ' keys');
    check('no line, in any language, promises to rescue, free or cleanse CHIME — it is a hostile construct', !r.chime.length, r.chime.slice(0, 4).join(' | '));
    check('no line, in any language, says a Sage or a guardian is killed or destroyed', !r.kill.length, r.kill.slice(0, 4).join(' | '));
    check('no page errors (words)', !errs.length, errs.slice(0, 2));
    await ctx.close();
  }

  await browser.close();
  console.log('  shots in tests/out/text-rules/');
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — cards stop the fight, one press is one thing on every input, and numbers never type');
})().catch(e => { console.error(e); process.exit(1); });
